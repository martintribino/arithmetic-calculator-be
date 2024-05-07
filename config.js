module.exports = {
  HOST: "localhost",
  USER: "mtribino",
  PASSWORD: "mtribino18",
  DB: "calculator",
  PORT: 3306,
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};