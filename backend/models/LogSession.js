const { Sequelize, DataTypes } = require('sequelize');

const MYSQL_DB = process.env.MYSQL_DB || 'logpulse';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASS = process.env.MYSQL_PASS || 'root';
const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = process.env.MYSQL_PORT || 8889;

const sequelize = new Sequelize(MYSQL_DB, MYSQL_USER, MYSQL_PASS, {
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  }
});

const LogSession = sequelize.define('LogSession', {
  _id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  rawContent: {
    type: DataTypes.TEXT('long')
  },
  stats: {
    type: DataTypes.JSON
  },
  aiSummary: {
    type: DataTypes.JSON
  },
  clusters: {
    type: DataTypes.JSON
  },
  timeline: {
    type: DataTypes.JSON
  }
}, {
  tableName: 'log_sessions',
  timestamps: false
});

module.exports = { LogSession, sequelize };
