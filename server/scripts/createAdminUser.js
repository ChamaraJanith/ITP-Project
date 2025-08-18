import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UnifiedUserModel from '../model/UnifiedUserModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await UnifiedUserModel.findOne({ 
      email: 'admin@healx.com' 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@healx.com');
      console.log('🔐 You can use existing password');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const adminUser = new UnifiedUserModel({
      name: 'HealX Admin',
      email: 'admin@healx.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      permissions: ['all'],
      employeeId: 'ADM001',
      department: 'Administration',
      phone: '+1-800-HEALX-24',
      createdAt: new Date(),
      lastLoginAt: null
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@healx.com');
    console.log('🔐 Password: admin123');
    console.log('🏥 Role: admin');
    console.log('🆔 Employee ID: ADM001');

    // Create additional admin users if needed
    const users = [
      {
        name: 'Dr. Gayath Dahanayaka',
        email: 'doctor@healx.com',
        role: 'doctor',
        employeeId: 'DOC001',
        department: 'Cardiology'
      },
      {
        name: 'Emily Chen',
        email: 'receptionist@healx.com',
        role: 'receptionist',
        employeeId: 'REC001',
        department: 'Front Desk'
      },
      {
        name: 'Mr. Senuja Masinghe',
        email: 'finance@healx.com',
        role: 'financial_manager',
        employeeId: 'FIN001',
        department: 'Finance'
      }
    ];

    for (const userData of users) {
      const existingUser = await UnifiedUserModel.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPass = await bcrypt.hash('password123', 12);
        const newUser = new UnifiedUserModel({
          ...userData,
          password: hashedPass,
          isActive: true,
          permissions: [userData.role],
          phone: '+1-800-HEALX-24',
          createdAt: new Date()
        });
        await newUser.save();
        console.log(`✅ Created ${userData.role}: ${userData.email} (password: password123)`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();
