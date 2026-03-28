const { User } = require('./models/User');
const { sequelize } = require('./models/LogSession');
const bcrypt = require('bcryptjs');

async function seedUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected. Seeding default operator...');

    const email = 'admin@logpulse.io';
    const password = 'admin123';
    
    // Check if user exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('ℹ️ User admin@logpulse.io already exists.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ email, passwordHash });
    
    console.log('🚀 Default Operator Created!');
    console.log('ID: admin@logpulse.io');
    console.log('PASS: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed. Ensure MAMP is running!');
    console.error(error.message);
    process.exit(1);
  }
}

seedUser();
