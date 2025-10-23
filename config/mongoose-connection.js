const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('db server connected');
})
.catch((err) => {
  console.log(err.message);
})

module.exports = mongoose.connection;
