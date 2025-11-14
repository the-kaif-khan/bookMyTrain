const express = require('express')
const router = express.Router();
const { log } = require('console');
const cookieParser = require('cookie-parser');
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/productModel');
const userModel = require('../models/userModel');
const userNotificationModel = require('../models/userNotificationModel');
const buyingFormModel = require('../models/buyingFormModel');
const buyingCartTimerModel = require('../models/buyingCartTimerModel');
const cityTehsilModel = require('../models/cityTehsilModel');
const cityProductModel = require('../models/cityProductModel')
const queryhouseModel = require('../models/queryhouseModel')
const isLoggedInForCart = require('../middlewares/isLoggedInForCart');
const upload = require('../config/multer-config');
const { join } = require('path');
router.use(cookieParser());

router.get('/buy', (req, res) => {
  res.send('coming from buy router')
})

router.get('/basti/randomly', (req, res) => {
  res.render('properSearchPage')
})

router.get('/basti/map', (req, res) => {
  // res.render('mapPage')
  res.redirect('/home/map')
})

router.get('/addtoclaim/:productId/:city/:tehsil', isLoggedIn, async (req, res) => {
  // log(req.user);
  let {city, tehsil, productId} = req.params;

  let user = await userModel.findOne({_id: req.user._id});
  let product = await productModel.findOne({_id: productId});


  // check if product is already in user's cart..
  const alreadyInUsersClaimCart = user.claimCart.includes(productId);
  const alreadyInProductsClaimedPeople = product.claimedPeople.includes(user._id);

    // check if anyone filled the buying form...if yes.. dont claim
  if(product.buyingForm.length > 0 || product.buyingPeople.length > 0) {
    req.flash('error', 'Product is in buying process by someone, you can claim or buy it later if he/she not be able to buy this zameen in 3 days.')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  } else if (alreadyInUsersClaimCart || alreadyInProductsClaimedPeople) {
    req.flash('error', 'Product already in the cart');
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  }
  user.claimCart.push(productId);
  product.claimedPeople.push(user._id);

  // for notification, a userNotification model will be created and then it will be added to the user's notifications in the userModel...
  const newNotificationModel = await userNotificationModel.create({
    relatedTo: 'Claim cart',
    success: 'true',
    notificationText: 'Ye! You claimed a new land. Click here to see full details about what claiming a land to Claim cart at Landbook really means...'
  });
  newNotificationModel.user.push(user._id);
  user.notifications.push(newNotificationModel._id);
  await newNotificationModel.save();

  await user.save();
  await product.save();
  
  req.flash('success', 'Product added to your claim cart');
  const previousPage = req.get('Referrer') || '/home/login';
  return res.redirect(previousPage);
})

router.get('/claimcart/products/filter/:theCity/:theTehsil',isLoggedInForCart, isLoggedIn, async (req, res) => {
  const { city, tehsil } = req.query;
  const theCity = req.params.theCity;
  const theTehsil = req.params.theTehsil;
  const success = req.flash('success');
  const error = req.flash('error');

  const filter = {};
  if (city) filter.city = city;
  if (tehsil) filter.tehsil = tehsil;

  const user = await userModel.findOne({_id: req.user._id}).populate({
    path: 'claimCart',
    match: filter
  });

  const claimProducts = await user.claimCart;
  let buyingForm = null;
  if (claimProducts.length > 0 && claimProducts[0].buyingForm) {
    const buyingFormId = claimProducts?.[0]?.buyingForm;
    buyingForm = await buyingFormModel.findOne({_id: buyingFormId})
  }
  const cityTehsilList = await cityTehsilModel.find();
  const cityProducts = await cityProductModel.find();

  res.render('claim-page', {
    claimProducts,
    buyingForm,
    theCity,
    theTehsil,
    error,
    success,
    selectedFilters: { city, tehsil },
    cityTehsilList: cityProducts
  });
});

router.get('/claimcart/products/:city/:tehsil', isLoggedInForCart, async (req, res) => {
  const {city, tehsil} = req.params;
  // log(req.user)
  const error = req.flash('error');
  const success = req.flash('success');

  const products = await userModel.findOne({_id: req.user._id}).populate('claimCart');
  const claimProducts = products.claimCart;
  const showingClaimProducts = [];
  claimProducts.forEach((claimProduct) => {
    if(claimProduct.tehsil === tehsil) {
      showingClaimProducts.push(claimProduct);
    }
  })
  let buyingForm = null;
  if (claimProducts.length > 0 && claimProducts[0].buyingForm) {
    const buyingFormId = claimProducts?.[0]?.buyingForm;
    buyingForm = await buyingFormModel.findOne({_id: buyingFormId})
  }
  const cityProducts = await cityProductModel.find();

  res.render('claim-pre-page', {claimProducts: showingClaimProducts, buyingForm, selectedFilters: {}, cityTehsilList: cityProducts, error, success, theCity: city, theTehsil: tehsil});
})

// not in use
router.get('/claimcart/:city/:tehsil', isLoggedInForCart, isLoggedIn, async (req, res) => {
  const {city, tehsil} = req.params;
  // log(req.user)
  const error = req.flash('error');
  const success = req.flash('success');

  const products = await userModel.findOne({_id: req.user._id}).populate('claimCart');
  const claimProducts = products.claimCart;
  const showingClaimProducts = [];
  claimProducts.forEach((claimProduct) => {
    if(claimProduct.tehsil === tehsil) {
      showingClaimProducts.push(claimProduct);
    }
  })

  res.render('claim-page', {showingClaimProducts, error, success, city, tehsil});
})

router.get('/remove/claimcart/:productId', isLoggedIn, async (req, res) => {
  const productId = req.params.productId;

  let product = await productModel.findOne({_id: productId});
  let user = await userModel.findOne({_id: req.user._id});

  product.claimedPeople.splice(product.claimedPeople.indexOf(user._id), 1);
  user.claimCart.splice(user.claimCart.indexOf(productId), 1);

  await product.save();
  await user.save();

  req.flash('error', 'Product removed from your claim cart');
  const previousPage = req.get('Referrer') || '/home/login';
  return res.redirect(previousPage);
  // log(product, user);
})



router.get('/give-bayana/:city/:tehsil/:productId', isLoggedIn, isLoggedInForCart, async (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  const {productId, city, tehsil} = req.params;
  const product = await productModel.findOne({_id: productId});
  const queryhouses = await queryhouseModel.find();
  let queryhouseContactNumber = '';
  queryhouses.forEach((queryhouse) => {
    if(product.tehsil === queryhouse.queryhouseTehsil) {
      queryhouseContactNumber = queryhouse.queryhouseContact;
    }
  })

  res.render('bayana-form-page', {city, tehsil, productId, product, error, success, queryhouseContactNumber});
})

router.get('/give-bayana/:productId', isLoggedIn, isLoggedInForCart, async (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  const {productId, city, tehsil} = req.params;
  const product = await productModel.findOne({_id: productId});
  let theProduct = '';
  if(product.buyingPeople.length > 0) {
    theProduct = product;
  }
  const queryhouses = await queryhouseModel.find();
  let queryhouseContactNumber = '';
  queryhouses.forEach((queryhouse) => {
    if(product.tehsil === queryhouse.queryhouseTehsil) {
      queryhouseContactNumber = queryhouse.queryhouseContact;
    }
  })

  res.render('bayana-form-from-profile', {city, tehsil, queryhouseContactNumber, productId, theProduct, error, success});
})



router.get('/buyingform/:productId/:city/:tehsil', isLoggedIn, async (req, res) => {
  const {city, tehsil} = req.params;

  const success = req.flash('success');
  const error = req.flash('error');

  const productId = req.params.productId;
  const product = await productModel.findOne({_id: productId});
  const cityTehsils = await cityTehsilModel.find();
  let gotCityTehsils = '';
  cityTehsils.forEach((cityTehsil) => {
    if(cityTehsil.city === city) {
      gotCityTehsils = cityTehsil;
    }
  })

  res.render('buying-form-page', {product, success, error, city, tehsil, gotCityTehsils});
})

// this can be its....
// this can be its....
// this can be its....
// this can be its....
// this can be its....
// this can be its....
// this can be its....
// this can be its....
router.post('/admin/move-buying-form/:formId', async (req, res) => {
  try {
    const buyingForm = await buyingFormModel.findOne({_id: req.params.formId});
    if(!buyingForm) {
      log('form not found');
      return res.status(404).send('Form not found');
    }
    // push productId into user's buying cart
    await userModel.findByIdAndUpdate(buyingForm.user, {
      $push: { buyingCart: buyingForm.product }
    });
    // add user id in product's buying people
    const userId = buyingForm.user;
    const productId = buyingForm.product;
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
    // push the buying cartTimer in userModel
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
    res.send(200);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error moving product');
  }
})
router.post('/admin/modify-buying-products/:formId', async (req, res) => {
  const buyingCartTimerId = req.params.formId;
  const buyingCartTimer = await buyingCartTimerModel.findOne({_id: buyingCartTimerId});
  const buyerId = buyingCartTimer.user[0]._id;
  log(buyerId)
  const productId = buyingCartTimer.product[0]._id;
  log(productId)

  await productModel.updateMany(
    { buyingPeople: buyerId },
    { $pull: {buyingPeople: buyerId} }
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


router.post('/addtobuyingcart', isLoggedIn, async (req, res) => {
  try {
    const now = new Date();
    const hour = now.getHours();

    // if(hour < 7 || hour >= 14) {
    //   return res.status(403).send('Form only be submitted between 7 to 2')
    // }
    const user = req.user;
    const {name, contactNumber, tehsil, address, buyingProductId} = req.body;

    let buyingProduct = await productModel.findOne({_id: buyingProductId}).populate('bayana');

    if(buyingProduct.buyingPeople.length > 0 || buyingProduct.buyingForm.length > 0 || buyingProduct.bayana.bayana) {
      req.flash('error', 'Someone is buying this zameen already. IF they not be able to buy this zameen... you will be notified if you claimed this product...Landbook');
      const previousPage = req.get('Referrer') || '/home/login';
      return res.redirect(previousPage);
    } else {
      let buyingForm = await buyingFormModel.create({
        name,
        contactNumber,
        tehsil,
        address
      })
      
      buyingForm.product.push(buyingProductId);
      buyingProduct.buyingForm.push(buyingForm._id)
      buyingForm.user.push(user._id);
      await buyingForm.save();
      await buyingProduct.save();
    
      user.buyingForm.push(buyingForm._id);
      // user.buyingCart.push(buyingProductId);
      await user.save();
  
    
      req.flash('success', 'Your buying form submitted successfully. You can check your buying product in your profile page');
      const previousPage = req.get('Referrer') || '/home/login';
      return res.redirect(previousPage);
    }
  } catch (err) {
    log(err.message);
    return req.flash('error', 'something went wrong, please try again now or later')
  }

})

router.get('/buyingcart/products/filter/:theCity/:theTehsil',isLoggedInForCart, isLoggedIn, async (req, res) => {
  const { city, tehsil } = req.query;
  const theCity = req.params.theCity;
  const theTehsil = req.params.theTehsil;
  const success = req.flash('success');
  const error = req.flash('error');

  const filter = {};
  if (city) filter.city = city;
  if (tehsil) filter.tehsil = tehsil;

  const user = await userModel.findOne({_id: req.user._id}).populate({
    path: 'buyingCart',
    match: filter
  });

  const showingBuyingProducts = await user.buyingCart;
  const cityProducts = await cityProductModel.find();

  res.render('buying-now-cart-page', {
    showingBuyingProducts,
    theCity,
    theTehsil,
    error,
    success,
    selectedFilters: { city, tehsil },
    cityTehsilList: cityProducts
  });
});

router.get('/buyingcart/products/:city/:tehsil', isLoggedInForCart, async (req, res) => {
  const {city, tehsil} = req.params;
  // log(req.user)
  const error = req.flash('error');
  const success = req.flash('success');

  const products = await userModel.findOne({_id: req.user._id}).populate('buyingCart');
  const buyingProducts = products.buyingCart;
  const showingBuyingProducts = [];
  buyingProducts.forEach((buyingProduct) => {
    if(buyingProduct.tehsil === tehsil) {
      showingBuyingProducts.push(buyingProduct);
    }
  })
  let buyingForm = null;
  if (buyingProducts.length > 0 && buyingProducts[0].buyingForm) {
    const buyingFormId = buyingProducts?.[0]?.buyingForm;
    buyingForm = await buyingFormModel.findOne({_id: buyingFormId})
  }
  const cityProducts = await cityProductModel.find();

  res.render('buying-now-cart-pre-page', {showingBuyingProducts, buyingForm, selectedFilters: {}, cityTehsilList: cityProducts, error, success, theCity: city, theTehsil: tehsil});
})

// not in use...
router.get('/buyingcart/:city/:tehsil', isLoggedInForCart, isLoggedIn, async (req, res) => {
  const {city, tehsil} = req.params;
  // log(req.user);
  const error = req.flash('error')
  const success = req.flash('success');

  let products = await userModel.findOne({_id: req.user}).populate('buyingCart');
  const buyingProducts = products.buyingCart;

  const showingBuyingProducts = [];
  buyingProducts.forEach((buyingProduct) => {
    if(buyingProduct.tehsil === tehsil) {
      showingBuyingProducts.push(buyingProduct);
    }
  })

  res.render('buying-now-cart-page', {products, showingBuyingProducts, error, success, city, tehsil});
})

router.get('/remove/buyingcart/:productId', isLoggedIn, async (req, res) => {
  const productId = req.params.productId;

  const product = await productModel.findOne({_id: productId});
  const user = await userModel.findOne({_id: req.user._id});

  product.buyingPeople.splice(product.buyingPeople.indexOf(user._id));
  user.buyingCart.splice(user.buyingCart.indexOf(productId));

  await product.save();
  await user.save();

  req.flash('error', 'Product removed from your buying cart')
  const previousPage = req.get('Referrer') || '/home/login';
  return res.redirect(previousPage);
})

router.get('/viewproduct/:productId/:city/:tehsil', isLoggedInForCart, isLoggedIn, async (req, res) => {
  const {city, tehsil} = req.params;

  const error = req.flash('error');
  const success = req.flash('success')

  const productId = req.params.productId;

  let product = await productModel.findOne({_id: productId})
  product.visits = (product.visits || 0) + 1;
  await product.save();

  const topProduct = await productModel.findOne().sort({visits: -1}).limit(1);

  const recommendations = await productModel.find({
    _id: {$ne: product._id},
    recommendation: product.recommendation
  }).limit(4);

  res.render('individual-product-page-when-click-page', {product, recommendations, topProduct, success, error, city, tehsil});
})

module.exports = router;