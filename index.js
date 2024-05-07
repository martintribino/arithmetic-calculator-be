const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser')
const router = require('./routes/router');
const db = require("./models");
const enums = require("./types");
const cors = require('cors');

const opTypes = enums.operation;
const User = db.user;
const Operation = db.operation;

// Initial script
const initializeDB = async () => {
  var salt = bcrypt.genSaltSync(db.salt);
  const hashedPassword = await bcrypt.hashSync('mtribino18', salt);
  await User.create({ username: 'mtribino', password: hashedPassword, status: 'active', balance: 25.00 });
  const hashedPassword2 = await bcrypt.hash('truenorth', salt);
  await User.create({ username: 'truenorth', password: hashedPassword2, status: 'active', balance: 200.00 });
  console.log('Users created successfully');
  await Operation.create({type: opTypes.addition, cost: 1.00});
  await Operation.create({type: opTypes.subtraction, cost: 1.00});
  await Operation.create({type: opTypes.multiplication, cost: 2.00});
  await Operation.create({type: opTypes.division, cost: 2.00});
  await Operation.create({type: opTypes.square_root, cost: 3.00});
  await Operation.create({type: opTypes.random_string, cost: 5.00});
  console.log('Operations created successfully');
};
const app = express();
app.use(cors());
// Use the router for your API routes wit api prefix
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', router);

// Start the server
// PORT 3000 by default
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: true });
    await initializeDB();
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
