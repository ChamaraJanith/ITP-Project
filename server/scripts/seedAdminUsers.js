// scripts/seedAdminUsers.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UnifiedUserModel from '../model/UnifiedUserModel.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdminUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    const adminUsers = [
      {
        name: "Mr. Chamara Janith",
        email: "admin@healx.com",
        password: await bcrypt.hash("admin123", 12),
        role: "admin"
      },
      {
        name: " Madushi Rashmika", 
        email: "receptionist@healx.com",
        password: await bcrypt.hash("receptionist123", 12),
        role: "receptionist"
      },
      {
        name: "Dr. Gayath Dahanayaka",
        email: "doctor@healx.com", 
        password: await bcrypt.hash("doctor123", 12),
        role: "doctor",
        specialization: "General Medicine"
      },
      {
        name: "Mr. Senuja Masinghe",
        email: "financial@healx.com",
        password: await bcrypt.hash("financial123", 12),
        role: "financial_manager"
      }
    ];

    for (const userData of adminUsers) {
      const existing = await UnifiedUserModel.findOne({ email: userData.email });
      if (!existing) {
        const adminUser = new UnifiedUserModel(userData);
        await adminUser.save();
        console.log(`✅ Created: ${userData.email} (${userData.role})`);
      }
    }

    console.log('🎉 Admin users seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedAdminUsers();
