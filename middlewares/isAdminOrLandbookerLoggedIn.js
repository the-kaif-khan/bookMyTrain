const jwt = require('jsonwebtoken');
const ownerModel = require('../models/ownerModel');
const landbookersModel = require('../models/landbookersModel');

module.exports = async (req, res, next) => {
  try {
    // Check for user cookie
    if (req.cookies.ownerLandbook) {
      const decoded = jwt.verify(req.cookies.ownerLandbook, process.env.SESSION_SECRET);
      const owner = await ownerModel.findOne({ _id: decoded.id });
      if (!owner) throw new Error('User not found');
      req.owner = owner;
      return next();
    }

    // Check for owner cookie
    if (req.cookies.landbookers) {
      const decoded = jwt.verify(req.cookies.landbookers, process.env.SESSION_SECRET);
      const landbookers = await landbookersModel.findOne({ _id: decoded.id });
      if (!landbookers) throw new Error('landbooker not found');
      req.landbooker = landbookers;
      return next();
    }

    // If neither is logged in
    req.flash('error', 'You need to login first!');
    res.redirect('/us/landbook');
  } catch (err) {
    console.log(err)
    res.status(401).send('Invalid token or user/owner not found');
  }
};