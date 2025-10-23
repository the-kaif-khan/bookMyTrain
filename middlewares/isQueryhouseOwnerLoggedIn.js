const jwt = require('jsonwebtoken');
const queryhouseOwnerModel = require('../models/queryhouseOwnerModel');
const ownerModel = require('../models/ownerModel');

module.exports = async (req, res, next) => {
  try {
    // check for landbook queryhouse owner cookie
    if (req.cookies.landbookQueryhouseOwner) {
      const decoded = jwt.verify(req.cookies.landbookQueryhouseOwner, process.env.SKF_SKF);
      const queryhouseOwner = await queryhouseOwnerModel.findOne({_id: decoded.id});
      if(!queryhouseOwner) throw new Error('Query house owner not found');
      req.queryhouseOwner = queryhouseOwner;
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