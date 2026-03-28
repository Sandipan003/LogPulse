const mysql = require('mysql2/promise');

async function createDb() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 8889,
    user: 'root',
    password: 'root'
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS logpulse;`);
    console.log('✅ Database "logpulse" secured!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create database:', err.message);
    process.exit(1);
  }
}

createDb();
