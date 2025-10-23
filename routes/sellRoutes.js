const express = require('express')
const router = express.Router();
const { log } = require('console');
const cookieParser = require('cookie-parser');
const upload = require('../config/multer-config');
router.use(cookieParser());
const sellingFormModel = require('../models/sellingFormModel');
const cityTehsilModel = require('../models/cityTehsilModel');
const isLoggedIn = require('../middlewares/isLoggedIn');

router.get('/sell', (req, res) => {
  res.send('coming from sell router')
})

router.get('/preview/:city/:tehsil', isLoggedIn, (req, res) => {
  const {city, tehsil} = req.params;

  res.render('preview-of-selling-page', {city, tehsil})
})

router.get('/fillform/:city/:tehsil', isLoggedIn, async (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  const {city, tehsil} = req.params;
  const cityTehsils = await cityTehsilModel.find();
  let gotCityTehsils = '';
  cityTehsils.forEach((cityTehsil) => {
    if(cityTehsil.city === city) {
      gotCityTehsils = cityTehsil;
    }
  })

  res.render('selling-form-page', {city, tehsil, error, success, gotCityTehsils});
})

router.post('/creatingsellingform/:city/:tehsil', upload.single('compressedKhatauniFile'), isLoggedIn,  async (req, res) => {
  try {
    const loggedUser = req.user;
    let {contactNumber, city, address, sellerPrice, khatauniSpecDetails} = req.body;

    let compressedKhatauniFile = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname
    };
    // let khatauniImages = req.files['khatauniImages'].map(file => file.buffer);

    let newSellingForm = await sellingFormModel.create({
      compressedKhatauniFile,
      sellerPrice,
      khatauniSpecDetails,
      contactNumber,
      address,
      city
    })
    
    newSellingForm.user.push(loggedUser._id);
    await newSellingForm.save();
    loggedUser.sellingForm.push(newSellingForm._id);
    await loggedUser.save();

    req.flash('success', 'Your selling form submitted successfully. You can check your selling product in your profile page in not more than 24 hours')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  } catch (err) {
    req.flash('error', `${err.message}`)
    res.redirect('/home/login')
    log(err)
  }
})

module.exports = router;
