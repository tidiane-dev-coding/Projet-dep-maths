const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dept-math';

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for seeding');

  let User;
  try {
    const UserModule = require('../dist/models/User');
    User = UserModule.default || UserModule;
  } catch (err) {
    console.error('Error loading User model:', err);
    process.exit(1);
  }

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@univ.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const name = process.env.SEED_ADMIN_NAME || 'Amadou Tidiane Bah';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ 
    name, 
    email, 
    password: hash, 
    role: 'Admin',
    phone: process.env.SEED_ADMIN_PHONE || '+224 622 29 23 70'
  });
  console.log('Created admin user:', { id: user._id.toString(), email, name: user.name });
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
