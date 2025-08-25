/* verifyAdminUser.mjs  ─────────────────────────────────────────────── */
import mongoose           from 'mongoose';
import bcrypt             from 'bcryptjs';
import dotenv             from 'dotenv';
import fs                 from 'fs';
import dns                from 'dns/promises';
import net                from 'net';
import path               from 'path';
import { MongoClient }    from 'mongodb';
import { fileURLToPath }  from 'url';

import UnifiedUserModel   from '../model/UnifiedUserModel.js';

/* ── Resolve __dirname in an ES-module ─────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* ── Load and validate environment variables ───────────────────────── */
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) throw new Error(`.env not found at ${envPath}`);

dotenv.config({ path: envPath });
if (!process.env.MONGODB_URL) throw new Error('MONGODB_URL is missing in .env');

/* ────────────────────────────────────────────────────────────────────
   Diagnostic helper – pinpoints DNS, firewall, whitelist, or auth
──────────────────────────────────────────────────────────────────── */
async function inspectMongoConnection(uri) {
  console.log('🩺  Running pre-flight MongoDB diagnostics…');

  /* 1️⃣  extract host + port from URI */
  const match = uri.match(/mongodb(?:\+srv)?:\/\/([^/]+)/);
  if (!match) throw new Error('Invalid MongoDB URI format');
  const hostPort = match[1];
  const [host, port = 27017] = hostPort.split(':');

  /* 2️⃣  DNS resolution */
  try {
    const addresses = await dns.lookup(host, { all: true });
    console.log(`🔎 DNS OK: ${host} → ${addresses.map(a => a.address).join(', ')}`);
  } catch (err) {
    console.error('❌ DNS lookup failed — cluster name or local DNS problem');
    throw err;
  }

  /* 3️⃣  Raw TCP connectivity */
  await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port, timeout: 4000 });
    socket.on('connect', () => { console.log(`🔌 TCP OK on ${host}:${port}`); socket.destroy(); resolve(); });
    socket.on('timeout', () => reject(new Error('Connection timed out (firewall or IP-whitelist)')));
    socket.on('error', reject);
  });

  /* 4️⃣  Driver-level handshake */
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
  try {
    await client.db('admin').command({ ping: 1 });
    console.log('✅ Driver handshake OK — credentials & replica-set look fine');
  } catch (err) {
    if (/Authentication/i.test(err.message)) {
      console.error('❌ Authentication failed — wrong username/password in URI');
    } else if (/server selection timed out/i.test(err.message)) {
      console.error('❌ Whitelist / replica-set issue — check Atlas IP-access list');
    } else {
      console.error('❌ Driver handshake failed:', err.message);
    }
    throw err;
  } finally {
    await client.close();
  }
  console.log('🩺  Diagnostics finished — no fundamental connectivity issues.\n');
}

/* ────────────────────────────────────────────────────────────────────
   Main logic – now calls inspectMongoConnection *before* Mongoose
──────────────────────────────────────────────────────────────────── */
async function verifyAdminUser() {
  try {
    await inspectMongoConnection(process.env.MONGODB_URL);          // ← NEW
    console.log('🔗 Connecting to MongoDB…');
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,  // fail fast
      socketTimeoutMS: 45000           // drop stalled sockets
    });
    console.log('✅ Connected to DB:', mongoose.connection.db.databaseName);

    /* ── Query admin user ─────────────────────────────────────────── */
    const admin = await UnifiedUserModel.findOne({ email: 'admin@healx.com' });

    if (!admin) {
      console.warn('❌ No admin@healx.com found — listing current admins');
      const fallback = await UnifiedUserModel.find({ role: 'admin' });
      fallback.forEach((u, i) => console.log(`${i + 1}. ${u.email} | ${u.name}`));
      return;
    }

    /* ── Display and verify password ─────────────────────────────── */
    console.log(`
📧 Email:          ${admin.email}
👤 Name:           ${admin.name}
🏥 Role:           ${admin.role}
🟢 Active:         ${admin.isActive}
🆔 Employee ID:    ${admin.employeeId}
🔐 Hash length:    ${admin.password?.length ?? 'No hash'}
📅 Created:        ${admin.createdAt}
`);
    const testPw = 'admin123';
    if (admin.password) {
      const ok = await bcrypt.compare(testPw, admin.password);
      console.log(`🔐 Test password "${testPw}" is`, ok ? '✅ VALID' : '❌ INVALID');
    }

  } catch (err) {
    console.error('💥 Startup aborted:', err.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Connection closed');
    }
  }
}

/* ─── Kick-off ────────────────────────────────────────────────────── */
verifyAdminUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
