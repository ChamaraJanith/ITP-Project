import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UnifiedUserModel from '../model/UnifiedUserModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await UnifiedUserModel.findOne({ email: 'admin@healx.com' });
    
    if (admin) {
      console.log('✅ Admin user found!');
      console.log('=====================================');
      console.log('📧 Email:', admin.email);
      console.log('👤 Name:', admin.name);
      console.log('🏥 Role:', admin.role);
      console.log('🟢 Active:', admin.isActive);
      console.log('🆔 Employee ID:', admin.employeeId || 'N/A');
      console.log('📅 Created:', admin.createdAt);
      console.log('🔐 Password Hash Length:', admin.password ? admin.password.length : 'No password');
      console.log('=====================================');

      // Test password verification
      const testPassword = 'admin123';
      if (admin.password) {
        const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
        console.log(`🔐 Password "${testPassword}" is`, isPasswordValid ? '✅ VALID' : '❌ INVALID');
      } else {
        console.log('⚠️ No password hash found!');
      }

      // Check for any email issues
      if (admin.email !== 'admin@healx.com') {
        console.log('⚠️ EMAIL MISMATCH DETECTED!');
        console.log('Expected: admin@healx.com');
        console.log('Found:', admin.email);
      }

      // Check admin roles compatibility
      const adminRoles = ['admin', 'receptionist', 'doctor', 'financial_manager'];
      if (adminRoles.includes(admin.role)) {
        console.log('✅ Role is compatible with admin login');
      } else {
        console.log('❌ Role is NOT compatible with admin login');
        console.log('Current role:', admin.role);
        console.log('Compatible roles:', adminRoles);
      }

    } else {
      console.log('❌ Admin user NOT FOUND with email: admin@healx.com');
      
      // Check if user exists with different criteria
      console.log('🔍 Searching for users with admin role...');
      const allAdmins = await UnifiedUserModel.find({ role: 'admin' });
      console.log('Found', allAdmins.length, 'users with admin role:');
      
      if (allAdmins.length > 0) {
        allAdmins.forEach((user, index) => {
          console.log(`  ${index + 1}. Email: ${user.email} | Name: ${user.name} | Active: ${user.isActive}`);
        });
      } else {
        console.log('  No users found with admin role');
        
        // Check all users
        const allUsers = await UnifiedUserModel.find({});
        console.log(`\n🔍 Found ${allUsers.length} total users in UnifiedUserModel:`);
        allUsers.slice(0, 5).forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} - ${user.role} - Active: ${user.isActive}`);
        });
        if (allUsers.length > 5) {
          console.log(`  ... and ${allUsers.length - 5} more users`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

verifyAdminUser();
