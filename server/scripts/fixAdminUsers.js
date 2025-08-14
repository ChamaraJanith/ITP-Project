// scripts/fixAdminUsers.js - Fixed with department field
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UnifiedUserModel from '../model/UnifiedUserModel.js';
import dotenv from 'dotenv';

dotenv.config();

const fixAdminUsers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Clear existing admin users to avoid conflicts
    const deleteResult = await UnifiedUserModel.deleteMany({ 
      role: { $in: ['admin', 'receptionist', 'doctor', 'financial_manager'] }
    });
    console.log('🗑️ Deleted existing admin users:', deleteResult.deletedCount);

    // ✅ FIXED: Added department field for each admin user
    const adminUsers = [
      {
        name: "Chamara Janith",
        email: "admin@healx.com",
        password: "admin123",
        role: "admin",
        department: "administration", // ✅ Added required department
        isActive: true,
        isAccountVerified: true
      },
      {
        name: "Sarah Receptionist", 
        email: "receptionist@healx.com",
        password: "receptionist123",
        role: "receptionist",
        department: "reception", // ✅ Added required department
        isActive: true,
        isAccountVerified: true
      },
      {
        name: "Dr. Gayath Dahanayaka",
        email: "doctor@healx.com", 
        password: "doctor123",
        role: "doctor",
        department: "medical", // ✅ Added required department
        specialization: "General Medicine",
        isActive: true,
        isAccountVerified: true
      },
      {
        name: "Lisa Financial",
        email: "financial@healx.com",
        password: "financial123",
        role: "financial_manager",
        department: "finance", // ✅ Added required department
        isActive: true,
        isAccountVerified: true
      }
    ];

    console.log('👥 Creating new admin users...');

    for (const userData of adminUsers) {
      console.log(`\n🔨 Creating user: ${userData.email}`);
      
      // Hash password properly
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      console.log('🔐 Password hashed, length:', hashedPassword.length);
      
      // Create user with hashed password and department
      const adminUser = new UnifiedUserModel({
        name: userData.name,
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        role: userData.role,
        department: userData.department, // ✅ Include department
        specialization: userData.specialization || '',
        isActive: userData.isActive,
        isAccountVerified: userData.isAccountVerified
      });
      
      await adminUser.save();
      console.log(`✅ Created: ${userData.email} (${userData.role}) - Department: ${userData.department}`);
      console.log(`   - Employee ID: ${adminUser.employeeId}`);
      
      // Test password immediately
      const testResult = await bcrypt.compare(userData.password, hashedPassword);
      console.log(`🔐 Password test: ${testResult ? 'PASS ✅' : 'FAIL ❌'}`);
    }

    console.log('\n🎉 Admin users fixed successfully!');
    console.log('\n🎯 Test credentials:');
    console.log('   - Admin: admin@healx.com / admin123');
    console.log('   - Receptionist: receptionist@healx.com / receptionist123');
    console.log('   - Doctor: doctor@healx.com / doctor123');
    console.log('   - Financial: financial@healx.com / financial123');

    process.exit(0);

  } catch (error) {
    console.error('❌ Fix admin users error:', error);
    process.exit(1);
  }
};

fixAdminUsers();
