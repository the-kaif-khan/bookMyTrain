const express = require('express')
const router = express.Router();
const userModel = require('../models/userModel')
const productModel = require('../models/productModel');
const sellingFormModel = require('../models/sellingFormModel');
const buyingFormModel = require('../models/buyingFormModel');
const mapProductModel = require('../models/mapProductModel');
const newMapProductModel = require('../models/newMapProductModel');
const mapLabelModel = require('../models/mapLabelModel');
const buyingCartTimerModel = require('../models/buyingCartTimerModel');
const cityTehsilModel = require('../models/cityTehsilModel');
const bcrypt = require("bcrypt")
const { log } = require('console');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
// const getFlash = require('../middlewares/getFlash');
router.use(cookieParser());
const archiver = require('archiver');
const {Readable} = require('stream');


const upload = require('../config/multer-config');
// for multer disc storage...
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const isLoggedInForCart = require('../middlewares/isLoggedInForCart');
const isLoggedIn = require('../middlewares/isLoggedIn');
const userBayanaFormModel = require('../models/userBayanaFormModel');

// if(process.env.NODE_ENV === 'development') {
//   console.log('in development');
// } else if(process.env.NODE_ENV === 'production') {
//   console.log('in production');
// } else{
//   console.log('comming from unknown');
// }

// only owner related start

router.get('/view/360image/:productId', async (req, res) => {
  const product = await productModel.findOne({_id: req.params.productId});
  if(!product || !product.product360Image) {
    req.flash('error', '360 degree image not found for this product')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(404).redirect(previousPage);
  }
  const base64Image = product.product360Image.toString('base64');
  res.render('view360-image-page', {imageBase64: base64Image});
})

// this can be it....
// this can be it....
// this can be it....
// this can be it....
// this can be it....
// this can be it....
router.post('/admin/modify-buying-products/:formId', async (req, res) => {
  const buyingCartTimerId = req.params.formId;
  const buyingCartTimer = await buyingCartTimerModel.findOne({_id: buyingCartTimerId});
  const buyerId = buyingCartTimer.user[0]._id;
  const productId = buyingCartTimer.product[0]._id;

  await productModel.updateMany(
    { buyingPeople: buyerId },
    { $pull: {buyingPeople: buyerId} }
  );
  const userBayanaForms = await userBayanaFormModel.find();
  if(userBayanaForms) {
    userBayanaForms.forEach(async (userBayanaForm) => {
      if(!userBayanaForm.bayana) {

        await productModel.updateMany(
          { bayana: userBayanaForm._id },
          { $pull: {bayana: userBayanaForm._id} }
        );
        await userModel.updateMany(
          { bayana: userBayanaForm._id },
          { $pull: {bayana: userBayanaForm._id} }
        );
        await userBayanaFormModel.findByIdAndDelete(userBayanaForm._id);
      }
    })
  }

  await productModel.updateMany(
    { buyingCartTimerId: buyingCartTimerId },
    { $pull: {buyingCartTimerId: buyingCartTimerId} }
  );
  await userModel.updateMany(
    { buyingCart: productId },
    { $pull: {buyingCart: productId} }
  )
  await userModel.updateMany(
    { buyingCartTimerId: buyingCartTimerId },
    { $pull: {buyingCartTimerId: buyingCartTimerId} }
  )
  // delete buying cartTimer model
  await buyingCartTimerModel.findByIdAndDelete(buyingCartTimerId);

  req.flash('success', 'All buying form and buying people id removed successfully!')
  res.send(200)
})


router.get('/product/image/:productId/:index', async (req, res) => {
  const product = await productModel.findOne({_id: req.params.productId});
  if(!product || !product.productImages[req.params.index]) {
    return res.status(404).send('Image not found')
  }
  res.contentType('image/jpeg');
  res.send(product.productImages[req.params.index]);
})

router.get('/sellpage/products/filter/:theCity/:theTehsil', isLoggedInForCart, async (req, res) => {
  const { rating, maxPrice, city, tehsil } = req.query;
  const theCity = req.params.theCity;
  const theTehsil = req.params.theTehsil;
  const success = req.flash('success');
  const error = req.flash('error');

  const filter = {};
  if (rating) filter.ratingCount = { $gte: parseFloat(rating) };
  if (maxPrice) filter.landbookPrice = { $lte: parseFloat(maxPrice) };
  if (city) filter.city = city;
  if (tehsil) filter.tehsil = tehsil;

  const products = await productModel.find(filter);
  const cityTehsilList = await cityTehsilModel.find();

  res.render('sell-main-page', {
    products,
    theCity,
    theTehsil,
    error,
    success,
    selectedFilters: { rating, maxPrice, city, tehsil },
    cityTehsilList
  });
});

router.get('/landbook-map-page', (req, res) => {
  res.render('user-map-page')
})

router.get('/get-markers', async (req, res) => {
  const markers = await newMapProductModel.find().lean();
  res.json(markers);
})

router.get('/get-labels', async (req, res) => {
  const labels = await mapLabelModel.find();
  res.json(labels);
})

router.get('/download-khatauni-images/:productId', isLoggedIn, async (req, res) => {
  try {
    const {productId} = req.params;
    const form = await productModel.findById(productId);
    if(!form || !form.compressedKhatauniFile || !form.compressedKhatauniFile.data) {
      return res.status(404).send('form not found')
      // const previousPage = req.get('Referrer') || '/home/login';
      // return res.status(404).redirect(previousPage);
    }
    res.set({
      'Content-Type': form.compressedKhatauniFile.contentType,
      'Content-Disposition': `attachment;filename="${form.compressedKhatauniFile.filename}"`
    });
    res.send(form.compressedKhatauniFile.data);
  } catch (error) {
    log(error)
    req.flash(`${error.message}`)
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.status(404).redirect(previousPage);
  }
})

router.get('/download-badnaam-image/:productId', isLoggedIn, async (req, res) => {
  try {
    const {productId} = req.params;
    const product = await productModel.findOne({_id: productId});

    if(!product || !product.badnaamImage) {
      req.flash('error', 'badnaam image not found')
      const previousPage = req.get('Referrer') || '/home/login';
      return res.redirect(previousPage);
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="BadnaamImage_${productId}.jpg"`);
    res.end(product.badnaamImage);
  } catch (error) {
    console.error('Error downloading badnaam image:', error);
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  }
})

// this can be it....
// this can be it....
// this can be it....
// this can be it....
// this can be it....
// this can be it....
// this can be it....
router.post('/admin/move-buying-form/:formId', async (req, res) => {
  try {
    const buyingForm = await buyingFormModel.findOne({_id: req.params.formId});
    const theProduct = await productModel.findOne({_id: buyingForm.product[0]}).populate('bayana');

    if(theProduct.bayana.length > 0) {
      theProduct.bayana.forEach(async (singleBayana) => {
        if(singleBayana.bayana) {
          // if it is then pull user buying form from product and user model and then delete the userbuyingform and then send a buying message to the user...
          const buyingFormDate = buyingForm.date;
          await productModel.findByIdAndUpdate(theProduct._id, {
            $pull: { buyingForm: buyingForm._id }
          })
          await userModel.findByIdAndUpdate(buyingForm.user[0], {
            $pull: { buyingForm: buyingForm._id }
          })
          await userModel.updateMany(
            {_id: {$in: buyingForm.user}},
            {$push: { buyingMessageFromLandbook: { message: 'Sorry, but a claimed person gave bayana to this land in his/her given claimed time. You cannot buy this land... Landbook.', read: false, buyingFormDate: buyingFormDate } }}
          );
          await buyingFormModel.findByIdAndDelete(buyingForm._id);
          res.send(200);
        } else {
          if(!buyingForm) {
            log('form not found');
            return res.status(404).send('Form not found');
          }
          // push productId into user's buying cart
          await userModel.findByIdAndUpdate(buyingForm.user, {
            $push: { buyingCart: buyingForm.product }
          });

          // add user id in product's buying people
          const userId = buyingForm.user[0];
          const productId = buyingForm.product[0];
          await productModel.findByIdAndUpdate(buyingForm.product, {
            $push: { buyingPeople: userId }
          });

          // pull the buying form id from productModel...
          await productModel.findByIdAndUpdate(productId, {
            $pull: { buyingForm: buyingForm._id }
          })

          // for another model eg. buyingCartTimer
          const buyingCartTimer = await buyingCartTimerModel.create({
            product: productId,
            user: userId
          })
          // push the buying cartTimer in userModel and productModel
          await userModel.findByIdAndUpdate(userId, {
            $push: { buyingCartTimerId: buyingCartTimer._id }
          });
          await productModel.findByIdAndUpdate(productId, {
            $push: { buyingCartTimerId: buyingCartTimer._id }
          })

          // delete the form
          await userModel.updateMany(
            { buyingForm: buyingForm._id },
            { $pull: {buyingForm: buyingForm._id} }
          );

          await buyingFormModel.findByIdAndDelete(buyingForm._id);
          // one new addition is that to delete the userBayanaForm because there is userBayanaform filled by claimed users but with empty bayana image... and then remove the userBayana form ids from usermodel and productModel...
          await userModel.findByIdAndUpdate(userId, {
            $pull: { bayana: singleBayana._id }
          })
          await productModel.findByIdAndUpdate(productId, {
            $pull: { bayana: singleBayana._id }
          })
          await userBayanaFormModel.findByIdAndDelete(singleBayana._id);
          return res.send(200);
        }
      })
    } else {
      if(!buyingForm) {
        log('form not found');
        return res.status(404).send('Form not found');
      }
      log('this is also running')
      // push productId into user's buying cart
      await userModel.findByIdAndUpdate(buyingForm.user, {
        $push: { buyingCart: buyingForm.product }
      });

      // add user id in product's buying people
      const userId = buyingForm.user[0];
      const productId = buyingForm.product[0];
      await productModel.findByIdAndUpdate(buyingForm.product, {
        $push: { buyingPeople: userId }
      });

      // pull the buying form id from productModel...
      await productModel.findByIdAndUpdate(productId, {
        $pull: { buyingForm: buyingForm._id }
      })


      const product = await productModel.findOne({_id: productId});
      if(product.bayana.length <= 0) {
        // for another model eg. buyingCartTimer
        const buyingCartTimer = await buyingCartTimerModel.create({
          product: productId,
          user: userId
        })
        // push the buying cartTimer in userModel and productModel
        await userModel.findByIdAndUpdate(userId, {
          $push: { buyingCartTimerId: buyingCartTimer._id }
        });
        await productModel.findByIdAndUpdate(productId, {
          $push: { buyingCartTimerId: buyingCartTimer._id }
        })
      }

      // delete the form
      await userModel.updateMany(
        { buyingForm: buyingForm._id },
        { $pull: {buyingForm: buyingForm._id} }
      );

      await buyingFormModel.findByIdAndDelete(buyingForm._id);
      res.send(200);
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Error moving product');
  }
})

router.get('/buyingCartTimersPage', async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');

  const buyingCartTimers = await buyingCartTimerModel.find();

  res.render('landbooker-buying-cart-timers-page', {buyingCartTimers, success, error});
})

router.get('/view/360/:id', async (req, res) => {
  const product = await productModel.findOne({_id: req.params.id});
  res.contentType(product.threeSixtyImage.contentType);
  res.send(product.threeSixtyImage.data);
});
// only owner related ends

router.get('/login', (req, res) => {
  let error = req.flash('error')
  let success = req.flash('success')
  res.render('loginPage', {error, success});
})

router.post('/usersignup', async (req, res) => {
  let {name, username, contactNumber, email, password, confirmPassword} = req.body;
  let user = await userModel.findOne({email});
  let sameUsername = await userModel.findOne({username});
  if(password !== confirmPassword) {
    req.flash('error', 'Passwords do not match, try again!')
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.status(400).redirect(previousPage);
  }
  if(sameUsername) {
    req.flash('error', 'User already registered through this username')
    return res.status(406).redirect('/home/login');
  }
  else if (user) {
    req.flash('error', 'User already registered through this email')
    return res.status(406).redirect('/home/login')
  } else {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if(err) return res.status(406).send(err.message)
          let createdUser = await userModel.create({
          name,
          username,
          contactNumber,
          email,
          password: hash
          });
          req.flash('success', 'Now you can login to continue to Landbook')
          res.redirect('/home/login');
      })
    })
  }
  // res.send('yuea')
})

router.post('/userlogin', async (req, res) => {
  try {
    let {username, password} = req.body;
    let user = await userModel.findOne({username})
    if(!user) {
      req.flash('error', 'Username or password is incorrect')
      return res.status(406).redirect('/home/login')
    } else{
      if(user.banned) {
        req.flash('error', `Sorry ${user.name}, You are banned from Landbook: ${user.banReason}. Contact Landbook down below for query. `)
        return res.status(400).redirect('/home/login')
      }
      bcrypt.compare(password, user.password, (err, result) => {
        if(err) return res.status(406).send('something went wrong')
          if(result === true) {
  
            let token = jwt.sign({email: user.email, id: user._id}, process.env.SESSION_SECRET);
            res.cookie('landbook', token);
  
            res.redirect('/home/landbook')
          } else{
            req.flash('error', 'Username or password is incorrect')
            res.redirect('/home/login')
          }
      })
    }
  } catch (error) {
    req.flash('error', `${error.message}`)
    console.error('something went wrong')
    return res.status(404).redirect('/home/login') 
  }

})

router.get('/landbook', isLoggedInForCart, async (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');

  const products = await productModel.find();
  const bigProducts = [];
  products.forEach((product) => {
    if(product.landbookPrice >= 50) {
      bigProducts.push(product);
    }
  })
  res.render('mainHomePage', {bigProducts, error, success});
})

router.get('/:city/:tehsil', isLoggedInForCart, (req, res) => {
  const {city, tehsil} = req.params;

  res.render('homePage', {city, tehsil});
})

router.get('/buy/:city/:tehsil', (req, res) => {
  const {city, tehsil} = req.params;

  res.render('howToSearchPage', {city, tehsil})
})

router.get('/sell/:city/:tehsil', (req, res) => {
  const {city, tehsil} = req.params;

  const success = req.flash('success');
  const error = req.flash('error');
  res.render('sell-your-zameen-page', {success, error, city, tehsil});
})

router.get('/search/:city/:tehsil', isLoggedInForCart, async (req, res) => {
  const {city, tehsil} = req.params;
  
  try {
    const query = req.query.q;
    const products = await productModel.find({
      $or: [
        { keys: { $regex: query, $options: 'i' } },
        { recommendation: { $regex: query, $options: 'i' } },
      ]
    });
    res.render('search-page', { products, query, city, tehsil });
  } catch (err) {
    log(err.message);
    res.send('error during search')
  }
})

// for suggestions while searching...
// router.get('/suggest', async (req, res) => {
//   const search = req.query.q;
//   if(!search) return res.json([]);

//   try {
//     const products = await productModel.find({ key: {$regex: search, $options: 'i'} }).limit(5);
//     res.json(products.map(p => p.key));
//   } catch (err) {
//     res.status(500).json([]);
//   }
// })

router.get('/compress/:city/:tehsil', isLoggedIn, (req, res) => {
  const {city, tehsil} = req.params;

  res.render('compressing-page', {city, tehsil});
});

router.post('/compress-images', isLoggedIn, upload.array('images'), async (req, res) => {
  try {
    const archive = archiver('zip');
    res.attachment('compressed-images.zip');
    archive.pipe(res);

    for (const file of req.files) {
      const compressedBuffer = await sharp(file.buffer)
        .resize({ width: 2000 })           // Resize to 2000px width (adjustable)
        .jpeg({ quality: 80 })             // Compress to 80% quality
        .toBuffer();

      archive.append(Readable.from(compressedBuffer), {
        name: file.originalname.replace(/\.(\w+)$/, '_compressed.jpg')
      });
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).send('Compression failed');
  }
});

router.get('/userlogout', (req, res) => {
  if(req.cookies.landbook === '') {
    req.flash('error', 'You need to be logged in first')
    return res.redirect('/home/login')
  }
  res.cookie('landbook', '')
  res.redirect('/home/login')
})

router.get('/aboutus', (req, res) => {
  res.send('about us is getting ready soon')
  // res.render('about-us');
})

router.get('/newaboutus', (req, res) => {
  res.send('about us is getting ready')
  // res.render('about-us-new')
})

router.get('/help/:city/:tehsil', (req, res) => {
  const {city, tehsil} = req.params;

  res.render('help-page', {city, tehsil})
})

module.exports = router;