const jwt = require('jsonwebtoken')
const { log } = require('console');
const landbookersModel = require('../models/landbookersModel');

module.exports = async (req, res, next) => {
  if(!req.cookies.landbookers) {
    req.flash('error', 'You need to login first');
    return res.redirect('/us/landbook')
  }
  try {
    let decoded = jwt.verify(req.cookies.landbookers, process.env.SESSION_SECRET)
    
    let landbooker = await landbookersModel.findOne({_id: decoded.id})
    req.landbooker = landbooker;
    
    next();
  } catch (err) {
    res.send(err.message);
  }
}
