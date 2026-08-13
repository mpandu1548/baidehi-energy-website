const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const databasePath = path.resolve(process.env.DATABASE_PATH || 'data/baidehi.sqlite3');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: process.env.NODE_ENV === 'development' ? false : false,
});

module.exports = { sequelize, databasePath };
