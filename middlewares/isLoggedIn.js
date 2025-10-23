const jwt = require('jsonwebtoken')
const { log } = require('console');
const userModel = require('../models/userModel');

module.exports = async (req, res, next) => {
  if(!req.cookies.landbook) {
    req.flash('error', 'You need to login first');
    // const previousPage = req.get('Referrer') || '/';
    // return res.redirect(previousPage);
    return res.redirect('/home/login')
  }
  try {
    let decoded = jwt.verify(req.cookies.landbook, process.env.SESSION_SECRET)
    
    let user = await userModel.findOne({_id: decoded.id})
    req.user = user;
    
    next();
  } catch (err) {
    res.send(err.message);
  }
}


