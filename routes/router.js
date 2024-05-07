const express = require('express');
const bcrypt = require('bcrypt');
const db = require("../models");
const jwt = require('jsonwebtoken');
const router = express.Router();
const enums = require("../types");
const https = require('https');
const { Op } = require('sequelize');

const opTypes = enums.operation;
const User = db.user;
const Operation = db.operation;
const Record = db.record;

// Middleware to check if params are numbers
const checkNumber = (req, res, next) => {
  const { num1 } = req.body;
  if (!num1) {
    return res.status(400).json({ status: 400, error: 'Number not provided' });
  }
  if (isNaN(num1)) {
    return res.status(400).json({ status: 400, error: 'Not a number' });
  }
  next();
};

// Middleware to check if params are numbers
const checkNumbers = (req, res, next) => {
  const { num1, num2 } = req.body;
  if (!num1 || !num2) {
    return res.status(400).json({ status: 400, error: 'Numbers not provided' });
  }
  if (isNaN(num1) || isNaN(num2)) {
    return res.status(400).json({ status: 400, error: 'Not a number' });
  }
  next();
};

const createRecord = async (user, operation, opString) => {
  // Record transaction in the database
  await Record.create({
    userId: user.id,
    operationId: operation.id,
    amount: operation.cost,
    userBalance: user.balance,
    operationResponse: `${user.username} executed ${operation.type}: ${opString} with cost ${operation.cost} successfully`,
  });
};

// Middleware to verify jwt token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(400).json({ status: 400, error: 'Authorization not provided' });
  }
  const authHeaderComps = authHeader.split(' ');
  const authSchema = authHeader && authHeaderComps[0];
  if (authSchema !== 'Bearer') {
    return res.status(400).json({ status: 400, error: 'Authorization Schema not provided' });
  }
  const token = authHeader && authHeaderComps[1];
  if (!token) {
      return res.status(400).json({ error: 'Token not provided' });
  }
  jwt.verify(token, db.secret, async (err, decoded) => {
      if (err) {
          return res.status(401).json({ status: 401, error: 'Invalid token' });
      }
      const username = decoded.username;
      req.username = username;
      const user = await User.findOne({ where: { username } });
      if (!user) {
          return res.status(401).json({ status: 401, error: 'User not found' });
      }
      req.user = user;
      next();
  });
};

router.post('/login', async (req, res) => {
  try {
      const { username, pass } = req.body;
      const user = await User.findOne({ where: { username } });
      if (!user) {
          return res.status(401).json({ status: 401, error: 'Wrong credentials' });
      }
      const validPassword = await bcrypt.compare(pass, user.password);
      if (!validPassword) {
          return res.status(401).json({ status: 401, error: 'Wrong credentials' });
      }
      const token = jwt.sign({ username: user.username }, db.secret, { algorithm: 'HS384' , expiresIn: '1h' });
      return res.status(200).json({ status: 200, token: token });
  } catch (error) {
      res.status(500).json({ status: 500, error: error.message });
  }
});

// Get all records for given user route
router.post('/user/balance/buy', [verifyToken], async (req, res) => {
  try {
    const { user } = req;
    const { amount } = req.body;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ status: 400, error: 'Must be a number greater than 0' });
    }
    user.balance = amount*1;
    await user.save();
    return res.status(200).json({ status: 200, result: user.balance, });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

// Get all records for given user route
router.post('/records/delete', [verifyToken], async (req, res) => {
  try {
    const { user } = req;
    const { ids = [] } = req.body;
    // Check op balance from database
    const recs = await Record.findAll({
      where: { [Op.and]: [{ userId: user.id }, { id: {[Op.in]: ids} }] }
    });
    recs.map( async (rec) => {
      rec.isDeleted = true;
      await rec.save();
    })
    return res.status(200).json({ status: 200, result: ids });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

// Get all records for given user route
router.get('/records', [verifyToken], async (req, res) => {
  try {
    const { user } = req;
    const { limit = 10, offset = 0, orderBy = 'createdAt', order = 'DESC' } = req.query;
    // Check op balance from database
    const { count, rows } = await Record.findAndCountAll({
      where: { [Op.and]: [{ userId: user.id }, { isDeleted: false }] },
      offset: offset*1,
      limit: limit*1,
      order: [[orderBy, order]],
      attributes: ['id', 'amount', 'userBalance', 'operationResponse', 'createdAt']
    });
    return res.status(200).json({ status: 200, result: { count, rows } });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

// Addition route
router.post('/addition', [verifyToken, checkNumbers], async (req, res) => {
  try {
    const { user } = req;
    const { num1, num2 } = req.body;
    // Check op balance from database
    const actualOperation = await Operation.findOne({ where: { type: opTypes.addition } });
    if (!actualOperation) {
      return res.status(400).json({ status: 400, error: 'Operation doesn\'t exist' });
    }
    // Check if user has balance
    const opCost = user.balance - actualOperation.cost;
    if(opCost < 0) {
      return res.status(400).json({ status: 400, error: 'User balance is not enough' });
    }
    // Deduct cost from user's balance
    user.balance = opCost;
    await user.save();
    // Perform operation
    const result = (num1*1) + (num2*1);
    // Record transaction in the database
    await createRecord(user, actualOperation, `${num1}+${num2}=${result}`);
    // Send response
    return res.status(200).json({ status: 200, result: result });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

// Subtraction route
router.post('/subtraction', [verifyToken, checkNumbers], async (req, res) => {
  try {
    const { user } = req;
    const { num1, num2 } = req.body;
    // Check op balance from database
    const actualOperation = await Operation.findOne({ where: { type: opTypes.subtraction } });
    if (!actualOperation) {
      return res.status(400).json({ status: 400, error: 'Operation doesn\'t exist' });
    }
    // Check if user has balance
    const opCost = user.balance - actualOperation.cost;
    if(opCost < 0) {
      return res.status(400).json({ status: 400, error: 'User balance is not enough' });
    }
    // Deduct cost from user's balance
    user.balance = opCost;
    user.save();
    // Perform operation
    const result = (num1*1) - (num2*1);
    // Record transaction in the database
    await createRecord(user, actualOperation, `${num1}-${num2}=${result}`);
    // Send response
    return res.status(200).json({ status: 200, result: result });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

// Multiplication route
router.post('/multiplication', [verifyToken, checkNumbers], async (req, res) => {
  try {
    const { user } = req;
    const { num1, num2 } = req.body;
    // Check op balance from database
    const actualOperation = await Operation.findOne({ where: { type: opTypes.multiplication } });
    if (!actualOperation) {
      return res.status(400).json({ status: 400, error: 'Operation doesn\'t exist' });
    }
    // Check if user has balance
    const opCost = user.balance - actualOperation.cost;
    if(opCost < 0) {
      return res.status(400).json({ status: 400, error: 'User balance is not enough' });
    }
    // Deduct cost from user's balance
    user.balance = opCost;
    user.save();
    // Perform operation
    const result = (num1*1) * (num2*1);
    // Record transaction in the database
    await createRecord(user, actualOperation, `${num1}*${num2}=${result}`);
    // Send response
    return res.status(200).json({ status: 200, result: result });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

// Division route
router.post('/division', [verifyToken, checkNumbers], async (req, res) => {
  try {
    const { user } = req;
    const { num1, num2 } = req.body;
    // Check op balance from database
    const actualOperation = await Operation.findOne({ where: { type: opTypes.division } });
    if (!actualOperation) {
      return res.status(400).json({ status: 400, error: 'Operation doesn\'t exist' });
    }
    // Check if user has balance
    const opCost = user.balance - actualOperation.cost;
    if(opCost < 0) {
      return res.status(400).json({ status: 400, error: 'User balance is not enough' });
    }
    // Deduct cost from user's balance
    user.balance = opCost;
    user.save();
    if(num2 === 0) {
      return res.status(400).json({ status: 400, error: 'Error by zero division' });
    }
    // Perform operation
    const result = (num1*1) / (num2*1);
    // Record transaction in the database
    await createRecord(user, actualOperation, `${num1}/${num2}=${result}`);
    // Send response
    return res.status(200).json({ status: 200, result: result });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

// Square root route
router.post('/square-root', [verifyToken, checkNumber], async (req, res) => {
  try {
    const { user } = req;
    const { num1 } = req.body;
    // Check op balance from database
    const actualOperation = await Operation.findOne({ where: { type: opTypes.square_root } });
    if (!actualOperation) {
      return res.status(400).json({ status: 400, error: 'Operation doesn\'t exist' });
    }
    // Check if user has balance
    const opCost = user.balance - actualOperation.cost;
    if(opCost < 0) {
      return res.status(400).json({ status: 400, error: 'User balance is not enough' });
    }
    // Deduct cost from user's balance
    user.balance = opCost;
    user.save();
    // Perform operation
    const result = Math.sqrt(num1*1);
    // Record transaction in the database
    await createRecord(user, actualOperation, `√${num1}=${result}`);
    // Send response
    return res.status(200).json({ status: 200, result: result });
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

// Random string generation route
router.post('/random-string', [verifyToken], async (req, res) => {
  try {
    const { user } = req;
    const { 
      num = 1, len = 25, digits = 'off', upperalpha = 'on', loweralpha = 'on', unique = 'on',
      format = 'plain', rnd = 'new'
    } = req.body;
    // Check op balance from database
    const actualOperation = await Operation.findOne({ where: { type: opTypes.random_string } });
    if (!actualOperation) {
      return res.status(400).json({ status: 400, error: 'Operation doesn\'t exist' });
    }
    // Check if user has balance
    const opCost = user.balance - actualOperation.cost;
    if(opCost < 0) {
      return res.status(400).json({ status: 400, error: 'User balance is not enough' });
    }
    const options = 
      new URL(`https://www.random.org/strings/?num=${num}&len=${len}&digits=${digits}&upperalpha=${upperalpha}&loweralpha=${loweralpha}&unique=${unique}&format=${format}&rnd=${rnd}`);
    var request = https.request(options, (response) => {
      let data = ''
      response.on('data', (chunk) => {
          data += chunk;
      });
      response.on('end', async () => {
        // Deduct cost from user's balance
        user.balance = opCost;
        user.save();
        // Record transaction in the database
        await createRecord(user, actualOperation, `${data}`);
        // Send response
        return res.status(200).json({ status: 200, result: data });
      });
    });
    request.on("error", (err) => {
      return res.status(400).json({ status: 400, error: err.message });
    }).end();
  } catch (error) {
    res.status(500).json({ status: 500, error: error.message });
  }
});

module.exports = router;
