const crypto = require("crypto");
const { Sequelize, DataTypes } = require('sequelize');
const enums = require("../types");
const st = enums.status;
const op = enums.operation;
const dbConfig = require("../config.js");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.salt = 10;
db.secret = crypto.randomBytes(20).toString("base64url");
// User Table
const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
      type: DataTypes.STRING,
      allowNull: false,
  },
  status: {
      type: DataTypes.ENUM(st.active, st.inactive),
      allowNull: false,
      defaultValue: enums.active,
  },
  balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
  },
});
// Operation Table
const Operation = sequelize.define("Operation", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM(op.addition, op.subtraction, op.multiplication, op.division, op.square_root, op.random_string),
    allowNull: false,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
});
//Record Table
const Record = sequelize.define("Record", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  operationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Operation,
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  userBalance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  operationResponse: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

db.user = User;
db.operation = Operation;
db.record = Record;

module.exports = db;