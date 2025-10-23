const jwt = require('jsonwebtoken')
const { log } = require('console');
const ownerModel = require('../models/ownerModel');

module.exports = async (req, res, next) => {
  if(!req.cookies.ownerLandbook) {
    req.flash('error', `You don't have permissions!`);
    return res.redirect('/us/landbook')
  }
  try {
    let decoded = jwt.verify(req.cookies.ownerLandbook, process.env.SESSION_SECRET)
    
    let owner = await ownerModel.findOne({_id: decoded.id})
    req.owner = owner;
    
    next();
  } catch (err) {
    res.send(err.message);
  }
}
