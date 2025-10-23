const jwt = require('jsonwebtoken');
const ownerModel = require('../models/ownerModel');
const landbookersModel = require('../models/landbookersModel');
const queryhouseStaffModel = require('../models/queryhouseStaffModel');
const queryhouseOwnerModel = require('../models/queryhouseOwnerModel');

module.exports = async (req, res, next) => {
  try {
    // check for landbook queryhouse staff cookie
    if (req.cookies.landbookQueryhouseStaffs) {
      const decoded = jwt.verify(req.cookies.landbookQueryhouseStaffs, process.env.SKF_SKF);
      const queryhouseStaff = await queryhouseStaffModel.findOne({_id: decoded.id});
      if(!queryhouseStaff) throw new Error('Query house staff not found');
      req.queryhouseStaff = queryhouseStaff;
      return next();
    }

    // check for landbook queryhouse owner cookie
    else if (req.cookies.landbookQueryhouseOwner) {
      const decoded = jwt.verify(req.cookies.landbookQueryhouseOwner, process.env.SKF_SKF);
      const queryhouseOwner = await queryhouseOwnerModel.findOne({_id: decoded.id});
      if(!queryhouseOwner) throw new Error('Query house owner not found');
      req.queryhouseOwner = queryhouseOwner;
      return next();
    }

    // Check for landbooker cookie
    else if (req.cookies.landbookers) {
      const decoded = jwt.verify(req.cookies.landbookers, process.env.SESSION_SECRET);
      const landbookers = await landbookersModel.findOne({ _id: decoded.id });
      if (!landbookers) throw new Error('landbooker not found');
      req.landbooker = landbookers;
      return next();
    }

    // Check for owner cookie
    else if (req.cookies.ownerLandbook) {
      const decoded = jwt.verify(req.cookies.ownerLandbook, process.env.SESSION_SECRET);
      const owner = await ownerModel.findOne({ _id: decoded.id });
      if (!owner) throw new Error('User not found');
      req.owner = owner;
      return next();
    }

    // If neither is logged in
    req.flash('error', 'You need to login first');
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(404).redirect(previousPage);
  } catch (err) {
    console.log(err)
    res.status(401).send('Invalid token or user/owner not found');
  }
};