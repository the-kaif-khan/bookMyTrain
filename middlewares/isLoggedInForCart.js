const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel')

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.landbook;

    if(token) {
      const decoded = jwt.verify(req.cookies.landbook, process.env.SESSION_SECRET);
      const freshUser = await userModel.findOne({_id: decoded.id});
      req.user = freshUser;
      res.locals.currentUser = freshUser;
    } else {
      req.user = null;
      res.locals.currentUser = null;
    }
    next();
  }
  catch (err) {
    req.user = null;
    res.locals.currentUser = null;
    next();
  }
}
