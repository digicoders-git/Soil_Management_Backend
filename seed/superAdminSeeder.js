import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const createSuperAdmin = async () => {
  try {
    await connectDB();

    // Update if exists, else create
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });

    if (existingSuperAdmin) {
      existingSuperAdmin.phone = '9999999999';
      existingSuperAdmin.password = 'superadmin123';
      await existingSuperAdmin.save();
      console.log('SuperAdmin updated successfully:');
    } else {
      await User.create({
        name: 'Super Admin',
        email: 'superadmin@soiltest.com',
        password: 'superadmin123',
        role: 'superadmin',
        phone: '9999999999'
      });
      console.log('SuperAdmin created successfully:');
    }

    console.log('Mobile: 9999999999');
    console.log('Password: superadmin123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating superadmin:', error);
    process.exit(1);
  }
};

createSuperAdmin();