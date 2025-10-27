require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path')
const { log } = require('console');

const db = require('./config/mongoose-connection')

const landadRouter = require('./routes/landad')
const homeRouter = require('./routes/homeRoutes')
const buyRouter = require('./routes/buyRoutes')
const sellRouter = require('./routes/sellRoutes')
const usRouter = require('./routes/usRoutes')
const queryHouseRouter = require('./routes/queryHouse')
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const yesToFlash = require('./config/flash');


app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser());
app.use(session({
  secret: yesToFlash,
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

app.use((req, res, next) => {
  log('middleware chal raha hai');
  next();
})

app.use('/landad', landadRouter)
app.use('/home', homeRouter)
app.use('/buy', buyRouter)
app.use('/sell', sellRouter)
app.use('/us', usRouter)
app.use('/landbook-query-house', queryHouseRouter)


// port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})