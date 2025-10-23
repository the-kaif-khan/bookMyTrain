const express = require('express')
const router = express.Router();
const ownerModel = require('../models/ownerModel')
const userModel = require('../models/userModel')
const landbookerModel = require('../models/landbookersModel');
const productModel = require('../models/productModel');
const sellingFormModel = require('../models/sellingFormModel');
const buyingFormModel = require('../models/buyingFormModel');
const mapProductModel = require('../models/mapProductModel');
const newMapProductModel = require('../models/newMapProductModel');
const mapLabelModel = require('../models/mapLabelModel');
const buyingCartTimerModel = require('../models/buyingCartTimerModel');
const cityTehsilModel = require('../models/cityTehsilModel');
const skymanProductModel = require('../models/skymanProductModel');
const landbookerMoneyModel = require('../models/landbookerMoney');
const queryhouseMoneyModel = require('../models/queryhouseMoney');
const queryhouseStaffModel = require('../models/queryhouseStaffModel');
const queryhouseOwnerModel = require('../models/queryhouseOwnerModel');
const isAdminLoggedIn = require('../middlewares/isAdminLoggedIn')
const isAdminOrLandbookerLoggedIn = require('../middlewares/isAdminOrLandbookerLoggedIn');
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
const queryhouseModel = require('../models/queryhouseModel');
const userBayanaFormModel = require('../models/userBayanaFormModel');


router.get('/admin', (req, res) => {
  res.send('hey, this is coming from yeah route')
})

router.get('/login', async (req, res) => {
  const success = req.flash('success')
  const error = req.flash('error')
  const theSellingForms = await sellingFormModel.find();
  const sellingForms = [];
  if(theSellingForms) {
    theSellingForms.forEach((sellingForm) => {
      if(sellingForm.skymanProductId.length <= 0) {
        sellingForms.push(sellingForm);
      }
    })
  }
  const buyingForms = await buyingFormModel.find();
  const products = await productModel.find();
  // for map marker id creation notification
  // let mapProductCreationLength = 0;
  // if(products.length > 0) {
  //   let productLength = 0;
  //   products.forEach((product) => {
  //     if(product.mapMarkerId.length === 0) {
  //       productLength++;
  //       mapProductCreationLength += productLength;
  //     }
  //   })
  // }
  // log(mapProductCreationLength)
  // for map marker id creation notification
  let mapProductCreationLength = 0;
  if(products.length > 0) {
    products.forEach((product) => {
      if(product.mapMarkerId.length <= 0) {
        mapProductCreationLength += 1;
      }
    })
  }
  log(mapProductCreationLength)

  // for skyman product notification 
  const theSkymanProducts = await skymanProductModel.find();
  let skymanProducts = [];
  if(theSkymanProducts) {
    theSkymanProducts.forEach((theSkymanProduct) => {
      if(theSkymanProduct.productId.length < 0) {
        skymanProducts.push(theSkymanProduct);
      } 
    })
  }
  // for user bayana form
  const theUserBayanaForms = await userBayanaFormModel.find();
  const userBayanaForms = [];
  theUserBayanaForms.forEach((userBayanaForm) => {
    if(!userBayanaForm.bayana) {
      userBayanaForms.push(userBayanaForm)
    }
  })
  const buyingCartTimers = await buyingCartTimerModel.find();

  res.render('ownerLogin', {sellingForms, buyingForms, mapProductCreationLength, skymanProducts, userBayanaForms, buyingCartTimers, success, error})
  log('yes')
})

router.post('/creating-owner', async (req, res) => {
  try{
    let {fullname, username, contactNumber, email, password, confirmPassword} = req.body;
    let owners = await ownerModel.find();
    if(owners.length > 0) {
      return res
      .status(500)
      .send(`you don't have permissions to create owner`);
    }
    if(password !== confirmPassword) {
      req.flash('error', 'Passwords do not match, try again!')
      const previousPage = req.get('Referrer') || '/us/landbook';
      return res.status(400).redirect(previousPage);
    }
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if(err) {
          return res.send(err.message)
        } else{
          let owner = await ownerModel.create({
            fullname,
            username,
            contact: contactNumber,
            email,
            password: hash 
          })
          res.redirect('/landad/login');
        }
  
      })
    });
  } catch (err) {
    res.send(err.message);
  }
})

router.post('/login-owner', async (req, res) => {
  let {username, password} = req.body;
  let owner = await ownerModel.findOne({username: username})
  if(!owner) {
    req.flash('error', 'username or password is incorrect')
    res.redirect('/landad/login')
  } else{
    bcrypt.compare(password, owner.password, (err, result) => {
      if(result === true) {

        let token = jwt.sign({email: owner.email, id: owner._id}, process.env.SKF_SKF);
        res.cookie('ownerLandbook', token)

        req.flash('success', 'You are all set!')
        res.redirect('/landad/admin-panel2')
      } else{
        res.send('username or password is incorrect')
      } 
    })
  }
})

// forgot password starts
router.get('/forgotPass', async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  
  res.render('forgot-owner-pass-page', {success, error})
})

router.post('/forgettingPass', async (req, res) => {
  try {
    let {name, username, contactNumber, email} = req.body;
    const owner = await ownerModel.findOne({username, contact: contactNumber, email, fullname: name});
    if(!owner) {
      req.flash('error', 'Your given information does not match any account. Please try again.!')
      const previousPage = req.get('Referrer') || '/us/landbook';
      return res.status(400).redirect(previousPage);
    } else {
      res.redirect(`/landad/forgettingPass/${owner._id}`)
    }

  } catch (error) {
    req.flash('error', `${error.message}`)
    console.error('something went wrong')
    return res.status(404).redirect('/home/login')
  }
})

router.get('/forgettingPass/:user', async (req, res) => {
  const owner = await ownerModel.findOne({_id: req.params.user});
  const success = req.flash('success');
  const error = req.flash('error');

  res.render('forgotting-owner-pass-page', {owner, success, error})
})

router.post('/forgettedPassword', async (req, res) => {
  try {
    const {username, password, confirmPassword} = req.body;
    if(password !== confirmPassword) {
      req.flash('error', 'Passwords do not match, try again!')
      const previousPage = req.get('Referrer') || '/us/landbook';
      return res.status(400).redirect(previousPage);
    }
    const owner = await ownerModel.findOne({username: username});
    if(!owner) {
      req.flash('error', 'Your username is incorrect!')
      const previousPage = req.get('Referrer') || '/us/landbook';
      return res.status(400).redirect(previousPage);
    }
    bcrypt.genSalt(10, async (err, salt) => {
      bcrypt.hash(password, salt, async (err, newHash) => {
        if(err) return res.status(406).send(err.message)
          owner.password = newHash
          await owner.save();
      });
      req.flash('success', 'Password successfully changed. Now you can login to continue to Landbook')
      res.redirect('/landad/login');
    })

  } catch (error) {
    console.error(err);
    req.flash('error', 'Error doing Forgot password!')
    res.status(500).redirect('home/login');
  }
})
// forgot password ends

router.get('/admin-panel2', async (req, res) => {
  const theSellingForms = await sellingFormModel.find();
  const sellingForms = [];
  if(theSellingForms) {
    theSellingForms.forEach((sellingForm) => {
      if(sellingForm.skymanProductId.length <= 0) {
        sellingForms.push(sellingForm);
      }
    })
  }
  const buyingForms = await buyingFormModel.find();
  const products = await productModel.find();
  // for map marker id creation notification
  // let mapProductCreationLength = 0;
  // if(products.length > 0) {
  //   let productLength = 0;
  //   products.forEach((product) => {
  //     if(product.mapMarkerId.length === 0) {
  //       productLength++;
  //       mapProductCreationLength += productLength;
  //     }
  //   })
  // }
  let mapProductCreationLength = 0;
  if(products.length > 0) {
    products.forEach((product) => {
      if(product.mapMarkerId.length <= 0) {
        mapProductCreationLength += 1;
      }
    })
  }

  const theSkymanProducts = await skymanProductModel.find();
  let skymanProducts = [];
  if(theSkymanProducts) {
    theSkymanProducts.forEach((theSkymanProduct) => {
      if(theSkymanProduct.productId.length <= 0) {
        skymanProducts.push(theSkymanProduct);
      } 
    })
  }
  const theUserBayanaForms = await userBayanaFormModel.find();
  const userBayanaForms = [];
  theUserBayanaForms.forEach((userBayanaForm) => {
    if(!userBayanaForm.bayana) {
      userBayanaForms.push(userBayanaForm)
    }
  })
  const buyingCartTimers = await buyingCartTimerModel.find();
  const landbookerMoneyProduct = await landbookerMoneyModel.find();
  const queryhouseMoneyProduct = await queryhouseMoneyModel.find();

  const success = req.flash('success');
  const error = req.flash('error');
  res.render('admin-panel2', {success, error, sellingForms, buyingForms, mapProductCreationLength, skymanProducts, userBayanaForms, buyingCartTimers, landbookerMoneyProduct, queryhouseMoneyProduct})
})

router.get('/admin-panel', isAdminLoggedIn, async (req, res) => {
  const sellingForms = await sellingFormModel.find();
  const buyingForms = await buyingFormModel.find();
  const products = await productModel.find();
  // for map marker id creation notification
  let mapProductCreationLength = 0;
  if(products.length > 0) {
    let productLength = 0;
    products.forEach((product) => {
      if(product.mapMarkerId.length === 0) {
        productLength++;
        mapProductCreationLength += productLength;
      }
    })
  } 
  const success = req.flash('success');
  const error = req.flash('error');
  res.render('admin-panel', {success, error, sellingForms, buyingForms, mapProductCreationLength})
})

router.post('/admin/c&p.cp', isAdminOrLandbookerLoggedIn, upload.fields([
  { name: 'productImages', maxCount: 7},
  { name: 'badnaamImage', maxCount: 1 },
  { name: 'ratingImage', maxCount: 1},
  { name: 'product360Image', maxCount: 1},
  { name: 'compressedKhatauniFile', maxCount: 1 }
]), async (req, res) => {
  
  try {
    let { title, zameenNumber, city, ratingCount, tehsil, sellerPrice, landbookPrice, brokerPrice, LB, spec, why, sellerId, sellingFormId, keys, recommendation, sellerContact, skymanProductId, lat, lng} = req.body;

    let compressed360ImageBuffer = null;
    if(req.files['product360Image'] && req.files['product360Image'][0]) {
      compressed360ImageBuffer = await sharp(req.files['product360Image'][0].buffer)
      .resize({width: 3000})
      .jpeg({quality: 80})
      .toBuffer();
    }

    let compressedKhatauniFile = {
      data: req.files['compressedKhatauniFile'][0].buffer,
      contentType: req.files['compressedKhatauniFile'][0].mimetype,
      filename: req.files['compressedKhatauniFile'][0].originalname
    };

    const sellerIdFromForm = sellerId.trim();
    let user = await userModel.findOne({_id: sellerIdFromForm}).populate("sellingForm");
    const userId = user._id;
    const sellingFormIdFromForm = sellingFormId.trim();
    const realTehsil = tehsil.toLowerCase().replace(' ', '');
    const realCity = city.toLowerCase().replace(' ', '');
    let specArray = spec.split('\n').map(item => item.trim()).filter(item => item);
    let whyArray = why.split('\n').map(item => item.trim()).filter(item => item);

    let productImages = req.files['productImages'].map(file => file.buffer);
    let ratingImage = req.files['ratingImage'][0].buffer;
    let badnaamImage = req.files['badnaamImage'][0].buffer;

    let newProduct = await productModel.create({
      productImages,
      badnaamImage,
      compressedKhatauniFile,
      ratingImage,
      product360Image: compressed360ImageBuffer,
      ratingCount,
      title,
      zameenNumber,
      city: realCity,
      tehsil: realTehsil,
      sellerPrice,
      landbookPrice,
      brokerPrice,
      LB,
      spec: specArray,
      why: whyArray,
      keys,
      recommendation,
      sellerContact,
      skymanProductId,
      lat,
      lng
    });

    newProduct.seller.push(sellerIdFromForm);
    await newProduct.save();
    await userModel.findByIdAndUpdate(
      userId,
      { $push: { sellingProduct: newProduct._id } }
    );
    await skymanProductModel.findByIdAndUpdate(
      skymanProductId,
      { $push: { productId: newProduct._id } }
    );

    await sellingFormModel.findByIdAndUpdate(
      sellingFormIdFromForm,
      { $push: {product: newProduct._id} }
    );

    req.flash('success', 'Product created successfully')
    return res.status(404).redirect('/us/skyman-products-page')
    // const previousPage = req.get('Referrer') || '/us/landbook';
    // return res.status(404).redirect(previousPage);
  } catch (err) {
    log(err)
    log(err.message);
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.status(404).redirect(previousPage);
  }
});

router.get('/find-users', isAdminLoggedIn, async (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  const users = await userModel.find();

  res.render('admin-find-users-page', {users, error, success});
})

router.get('/delete-product/:productId', isAdminLoggedIn, async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await productModel.findOne({_id: productId});
  
    if(product || product.claimedPeople.length > 0 || product.buyingPeople.length > 0 || product.seller.length > 0 ) {
  
      await userModel.updateMany(
        { claimCart: productId },
        { $pull: {claimCart: productId} }
      );
      await userModel.updateMany(
        { buyingCart: productId },
        { $pull: {buyingCart: productId} }
      );
      await userModel.updateMany(
        { sellingProduct: productId },
        { $pull: {sellingProduct: productId} }
      );
      await userModel.updateMany(
        { buyingProduct: productId },
        { $pull: {buyingProduct: productId} }
      );
      await newMapProductModel.deleteMany({productId: productId});
      await userBayanaFormModel.deleteMany({productId: productId});
      // for updating the buying forms and user related to it....
      const buyingForm = await buyingFormModel.findOne({product: productId});
      if(buyingForm) {
        const buyingFormId = buyingForm._id;
        await userModel.updateMany(
          { buyingForm: buyingFormId },
          { $pull: {buyingForm: buyingFormId} }
        );
        await buyingFormModel.deleteMany({product: productId});
      }
      // when deleting product delete selling form related to it, also when deleted selling form then remove the sellingformid from user's selling form id...
      const theSellingForm = await sellingFormModel.findOne({product: productId});
      if(theSellingForm) {
        const sellingFormId = theSellingForm._id;
        await userModel.updateMany(
          { sellingForm: sellingFormId },
          { $pull: {sellingForm: sellingFormId} }
        );
        await sellingFormModel.deleteMany({product: productId});
      }
      // delete skyman product too
      const skymanProductId = product.skymanProductId[0];
      if(skymanProductId) {
      const skymanProduct = await skymanProductModel.findOne({_id: skymanProductId});

      const folderName = skymanProduct.productFolderName;
      const productPath = path.join(__dirname, '..', 'public', 'uploads', 'skyman', folderName);
      // ✅ Remove folder and files
      if (fs.existsSync(productPath)) {
        fs.rmSync(productPath, { recursive: true, force: true });
      }
      // ✅ Remove DB record
      await skymanProductModel.findByIdAndDelete(skymanProductId);
    }

      await productModel.findOneAndDelete({_id: productId});
  
      res.redirect('/us/adminProducts');
    } else if(product) {
      const productDeleted = await productModel.findOneAndDelete({_id: productId});
      res.redirect('/us/adminProducts');
    } else{
      res.redirect('/us/adminProducts')
    }
  } catch (error) {
    log(error)
    req.flash('error', `${error}`)
    return res.redirect('/us/landbook');
  }
  // req.flash('error', 'Product deleted')
  // res.redirect('/home/adminpanel')
})

router.get('/seed-city-tehsils', isAdminLoggedIn, async (req, res) => {
  await cityTehsilModel.deleteMany();

  await cityTehsilModel.insertMany([
    { city: 'basti', tehsils: ['bastisadar', 'harraiya', 'rudhauli', 'bhanpur'] },
    { city: 'lucknow', tehsils: ['hazratganj', 'aliganj', 'gomtinagar'] },
    { city: 'kanpur', tehsils: ['kalyanpur', 'kidwainagar', 'govindnagar'] }
  ]);
  req.flash('success', 'City tehsils seeded successfully!')
  const previousPage = req.get('Referrer') || '/landad/login';
  return res.redirect(previousPage);
})

router.post('/add-map-label', isAdminLoggedIn, async (req, res) => {
  const {lat, lng, labelText} = req.body;

  const newLabel = await mapLabelModel.create({
    lat,
    lng,
    labelText
  })
  res.redirect('/us/new-map');
})

router.post('/update-label/:id', isAdminLoggedIn, async (req, res) => {
  const {id} = req.params;
  const {text} = req.body;

  const updatedLabel = await mapLabelModel.findByIdAndUpdate(id, {labelText: text});
  res.send('Label updated');
})

router.get('/admin/addProductToBuyingCart/:userId', isAdminLoggedIn, async (req, res) => {
  const userId = req.params.userId;
  const user = await userModel.findOne({_id: userId});
  const success = req.flash('success');
  const error = req.flash('error');

  res.render('admin-addProductToBuyingCart', {user, success, error})
})

router.get('/find-landbookers', isAdminLoggedIn, async (req, res) => {
  const error = req.flash('error');
  const success = req.flash('success');
  const landbookers = await landbookerModel.find();

  res.render('admin-find-landbookers', {landbookers, error, success});
})

router.get('/admin/delete-landbooker/:landbookerId', isAdminLoggedIn, async (req, res) => {
  const landbookerId = req.params.landbookerId;
  const deletedLandbooker = await landbookerModel.findOneAndDelete({_id: landbookerId});
  res.cookie('landbookers', '')

  res.redirect('/landad/find-landbookers');
})

router.get('/admin/delete-user/:userId', isAdminLoggedIn, async (req, res) => {
  const userId = req.params.userId;

  // const products = await productModel.find();
  const user = await userModel.findOne({_id: userId});
  const claimedProduct = await productModel.findOne({claimedPeople: userId});
  const buyingProduct = await productModel.findOne({buyingPeople: userId});
  if(claimedProduct && buyingProduct) {
    await productModel.updateMany(
      { claimedPeople: userId },
      { $pull: {claimedPeople: userId} }
    )
    await productModel.updateMany(
      { buyingPeople: userId },
      { $pull: {buyingPeople: userId} }
    )
  }
  // await productModel.updateMany(
  //   { seller: userId },
  //   { $pull: {seller: userId} }
  // )
  await sellingFormModel.deleteMany({user: userId});
  await buyingFormModel.deleteMany({user: userId});
  const product = await productModel.findOne({seller: userId});
  if(product) {
    const productId = product._id;

    await newMapProductModel.deleteMany({productId: productId});
    await productModel.deleteMany({seller: userId});
  }
  res.cookie('landbook', '')

  const deletedUser = await userModel.findOneAndDelete({_id: userId});
  res.redirect('/landad/find-users')
})

router.get('/delete-user-bayana-form/:formId', isAdminLoggedIn, async (req, res) => {
  const userBayanaFormId = req.params.formId;
  const userBayanaForm = await userBayanaFormModel.findOne({_id: userBayanaFormId});
  await productModel.updateMany(
    { bayana: userBayanaFormId },
    { $pull: {bayana: userBayanaFormId} }
  );
  await userModel.updateMany(
    { bayana: userBayanaFormId },
    { $pull: {bayana: userBayanaFormId} }
  );
  const deleteBayanaForm = await userBayanaFormModel.findOneAndDelete({_id: userBayanaFormId});
  
  req.flash('success', 'Bayana form of user deleted successfully!')
  const previousPage = req.get('Referrer') || '/admin/login';
  return res.redirect(previousPage);
})

router.get('/deleted-user-bayana-form/:formId', async (req, res) => {
  const userBayanaFormId = req.params.formId;
  const userBayanaForm = await userBayanaFormModel.findOne({_id: userBayanaFormId});
  if(!userBayanaForm.bayana) {
    const deletedUserBayanaForm = await userBayanaFormModel.findOneAndDelete({_id: userBayanaFormId});
  } else {
    req.flash('success', 'Bayana form added to panel successfully!')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  }

  req.flash('success', 'Bayana form of user deleted successfully!')
  const previousPage = req.get('Referrer') || '/home/login';
  return res.redirect(previousPage);
})

router.get('/admin/ban-user/:userId', isAdminLoggedIn, async (req, res) => {
  const userId = req.params.userId;
  const user = await userModel.findOne({_id: userId});

  const success = req.flash('success');
  const error = req.flash('error');

  res.render('ban-user', {user, success, error});
})

router.post('/banningUser', isAdminLoggedIn, async (req, res) => {
  const {username, email, contactNumber, id, reason} = req.body;

  try {
    const user = await userModel.findOne({_id: id});

    if(!user) return res.status(404).send('User not found');
    user.banned = true;
    user.banReason = reason || 'No reason provided';
    await user.save();
    res.cookie('landbook', '')
  
    req.flash('error', `User ${user.username} has been banned.`);
    res.redirect('/landad/find-users');
  } catch (err) {
    req.flash('error', `${err}`)
    res.redirect('/landad/login')
  }
})

router.get('/admin/ban-landbooker/:landbookerId', isAdminLoggedIn, async (req, res) => {
  const landbookerId = req.params.landbookerId;
  const landbooker = await landbookerModel.findOne({_id: landbookerId});

  const success = req.flash('success');
  const error = req.flash('error');

  res.render('ban-landbooker', {landbooker, success, error});
})

router.get('/admin/unban-user/:userId', isAdminLoggedIn, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findOne({_id: userId});
  
    if(user.banned === true) {
      user.banned = false;
      user.banReason = '';
      await user.save();
      req.flash('success', `user ${user.username} un-banned successfully!`);
      return res.redirect('/landad/find-users');
    } else {
      req.flash('error', 'user already not banned!');
      return res.status(404).redirect('/landad/find-users');
    }
  } catch (error) {
    req.flash('error', `${error.message}`)
    return res.redirect('/landad/find-users')
  }
})

router.get('/admin/unban-landbooker/:landbookerId', isAdminLoggedIn, async (req, res) => {
  try {
    const landbookerId = req.params.landbookerId;
    const landbooker = await landbookerModel.findOne({_id: landbookerId});
  
    if(landbooker.banned === true) {
      landbooker.banned = false;
      landbooker.banReason = '';
      await landbooker.save();
    } else {
      req.flash('error', 'Landbooker already not banned!');
      return res.status(404).redirect('/landad/find-landbookers');
    }
  } catch (error) {
    req.flash('error', `${error.message}`)
    return res.redirect('/landad/find-landbookers')
  }
})

router.post('/banningLandbooker', isAdminLoggedIn, async (req, res) => {
  const {fullname, username, email, contactNumber, id, reason} = req.body;

  try {
    const landbooker = await landbookerModel.findOne({_id: id});

    if(!landbooker) return res.status(404).send('landbooker not found');
    landbooker.banned = true;
    landbooker.banReason = reason || 'No reason provided';
    await landbooker.save();
  
    req.flash('error', `landbooker ${landbooker.username} has been banned.`);
    res.cookie('landbookers', '')
    res.redirect('/landad/find-landbookers');
  } catch (err) {
    req.flash('error', `${err}`)
    res.redirect('/landad/login')
  }
})

router.get('/logoutOwner', (req, res) => {
  req.flash('error', 'Admin is logged out!')
  res.cookie('ownerLandbook', '')
  res.redirect('/landad/login')
})

router.get('/search/users', isAdminLoggedIn, async (req, res) => {
  try {
    const query = req.query.q;
    const users = await userModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ]
    });
    res.render('admin-search-users-page', { users, query});
  } catch (err) {
    log(err.message);
    res.send('error during search')
  }
})

router.get('/search/query-houses', isAdminLoggedIn, async (req, res) => {
  const query = req.query.q;
  try {
    const queryhouses = await queryhouseModel.find({
      $or: [
        { ownername: { $regex: query, $options: 'i' } },
        { queryhouseTehsil: { $regex: query, $options: 'i' } }
      ]
    });
    res.render('admin-search-queryhouses-page', { queryhouses, query});
  } catch (err) {
    log(err.message);
    res.send('error during search')
  }
})


router.get('/search/user-money', isAdminLoggedIn, async (req, res) => {
  const userNameToSeach = req.query.q;
  try {
    const results = await userBayanaFormModel.find()
      .populate({
        path: 'user',
        match: { name: userNameToSeach }
      }).populate('productId')
        .populate('queryhouse');

    const filteredResults = results.filter(item => item.user && item.user.length !== 0);

    res.render('admin-search-userMoney',
      { 
        userBayanaForms: filteredResults,
        query: req.query
      });
  } catch (err) {
    log(err.message);
    res.send('error during search')
  }
})
router.get('/search/landbooker-money', isAdminLoggedIn, async (req, res) => {
  const landbookerfullnameToSeach = req.query.q;
  try {
    const results = await landbookerMoneyModel.find()
      .populate({
        path: 'landbooker',
        match: { fullname: landbookerfullnameToSeach }
      }).populate('user')
        .populate('productId');

    const filteredResults = results.filter(item => item.landbooker && item.landbooker.length !== 0);

    res.render('admin-search-landbookerMoney',
      { 
        landbookerMoneys: filteredResults,
        query: req.query
      });
  } catch (err) {
    log(err.message);
    res.send('error during search')
  }
})
router.get('/search/queryhouse-money', isAdminLoggedIn, async (req, res) => {
  const tehsilToSeach = req.query.q;
try {
  const results = await queryhouseMoneyModel.find()
    .populate({
      path: 'queryhouse',
      match: { queryhouseTehsil: tehsilToSeach }
    }).populate('productId')
      .populate('user')
      .populate('queryhouseStaff');

  const filteredResults = results.filter(item => item.queryhouse && item.queryhouse.length !== 0);

  res.render('admin-search-queryhouseMoney',
    { 
      queryhouseMoneys: filteredResults,
      query: req.query
    });
} catch (err) {
  log(err.message);
  res.send('error during search')
}
})


router.get('/admin/delete-queryhouse/:id', async (req, res) => {
  const queryhouseId = req.params.id;
  const queryhouse = await queryhouseModel.findOne({_id: queryhouseId});
  const queryhouseStaffs = await queryhouseStaffModel.find();
  queryhouseStaffs.forEach(async (queryhouseStaff) => {
    if(queryhouseStaff.tehsil === queryhouse.queryhouseTehsil) {
      await queryhouseStaffModel.findOneAndDelete({_id: queryhouseStaff._id});
    }
  })
  const queryhouseOwners = await queryhouseOwnerModel.find();
  queryhouseOwners.forEach(async (queryhouseOwner) => {
    if(queryhouseOwner.tehsil === queryhouse.queryhouseTehsil) {
      await queryhouseOwnerModel.findOneAndDelete({_id: queryhouseOwner._id})
    }
  })
  res.cookie('landbookQueryhouseOwner', '')
  res.cookie('landbookQueryhouseStaffs', '')
  const deletedQueryhouse = await queryhouseModel.findOneAndDelete({_id: queryhouseId});

  req.flash('success', `Landbook Query House of ${queryhouse.queryhouseTehsil} tehsil is deleted successfully!`)
  const previousPage = req.get('Referrer') || '/admin/login';
  return res.redirect(previousPage);
})

// this can be it.......
// this can be it.......
// this can be it.......
// this can be it.......
// this can be it.......
router.get('/admin/modify-buying-product/:productId',isAdminLoggedIn, async (req, res) => {
  const productId = req.params.productId;
  const product = await productModel.findOne({_id: productId});
  const buyerId = product.buyingPeople[0]._id;


  await productModel.updateMany(
    { buyingPeople: buyerId },
    { $pull: {buyingPeople: buyerId} }
  );
  
  await productModel.updateMany(
    { buyingForm: buyerId },
    { $pull: {buyingForm: buyerId} }
  );
  await userModel.updateMany(
    { buyingCart: productId },
    { $pull: {buyingCart: productId} }
  )

  req.flash('success', 'All buying form and buying people id removed successfully!')
  const previousPage = req.get('Referrer') || '/admin/login';
  return res.redirect(previousPage);
})

router.get('/dues', isAdminLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const userBayanaForms = await userBayanaFormModel.find()
    .populate('user')
    .populate('productId')
    .populate('queryhouse');
  res.render('admin-landbook-money', {success, error, userBayanaForms})
})

router.get('/landbooker-dues', isAdminLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req. flash('error');
  const landbookerMoneys = await landbookerMoneyModel.find()
    .populate('user')
    .populate('landbooker')
    .populate('productId');

  res.render('admin-landbooker-dues', {success, error, landbookerMoneys})
})

router.get('/queryhouse-dues', isAdminLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const queryhouseMoneys = await queryhouseMoneyModel.find()
    .populate('user')
    .populate('productId')
    .populate('queryhouse')
    .populate('queryhouseStaff')

  res.render('admin-queryhouse-dues', {success, error, queryhouseMoneys})
})

router.get('/download-bayana-image-of-user/:bayanaId', isAdminLoggedIn, async (req, res) => {
  try {
    const {bayanaId} = req.params;
    const userBayanaForm = await userBayanaFormModel.findOne({_id: bayanaId}).populate('user');
    const user = userBayanaForm.user[0];

    if(!userBayanaForm || !userBayanaForm.bayana) {
      req.flash('error', 'bayana image not found')
      const previousPage = req.get('Referrer') || '/home/login';
      return res.redirect(previousPage);
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="bayanaImage-${user.username}-${user.name}-${user.email}-${bayanaId}.jpg"`);
    res.end(userBayanaForm.bayana);
  } catch (error) {
    console.error('Error downloading bayana image:', error);
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  }
})
router.get('/download-bayana-image-of-landbooker/:landbookerMoneyId', isAdminLoggedIn, async (req, res) => {
  try {
    const {landbookerMoneyId} = req.params;
    const landbookerMoneyProduct = await landbookerMoneyModel.findOne({_id: landbookerMoneyId}).populate('user');
    const user = landbookerMoneyProduct.user[0];

    if(!landbookerMoneyProduct || !landbookerMoneyProduct.bayana) {
      req.flash('error', 'bayana image not found')
      const previousPage = req.get('Referrer') || '/landad/login';
      return res.redirect(previousPage);
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="bayanaImage-${user.username}-${user.name}-${user.email}-${landbookerMoneyId}.jpg"`);
    res.end(landbookerMoneyProduct.bayana);
  } catch (error) {
    console.error('Error downloading bayana image:', error);
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  }
})
router.get('/download-bayana-image-of-queryhouse/:queryhouseMoneyId', isAdminLoggedIn, async (req, res) => {
  try {
    const {queryhouseMoneyId} = req.params;
    const queryhouseMoneyProduct = await queryhouseMoneyModel.findOne({_id: queryhouseMoneyId}).populate('user');
    const user = queryhouseMoneyProduct.user[0];

    if(!queryhouseMoneyProduct || !queryhouseMoneyProduct.bayana) {
      req.flash('error', 'bayana image not found')
      const previousPage = req.get('Referrer') || '/landad/login';
      return res.redirect(previousPage);
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="bayanaImage-${user.username}-${user.name}-${user.email}-${queryhouseMoneyId}.jpg"`);
    res.end(queryhouseMoneyProduct.bayana);
  } catch (error) {
    console.error('Error downloading bayana image:', error);
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  }
})

router.get('/admin/delete-landbookerMoney/:landbookerMoneyId', async (req, res) => {
  try {
    const landbookerMoneyId = req.params.landbookerMoneyId;
    const deletedlandbookerMoney = await landbookerMoneyModel.findByIdAndDelete(landbookerMoneyId);
    
    const previousPage = req.get('Referrer') || '/landad/login';
    return res.redirect(previousPage);

  } catch (error) {
    req.flash('error deleting landbooker money product')
    const previousPage = req.get('Referrer') || '/landad/login';
    return res.redirect(previousPage);
  }
})
router.get('/admin/delete-queryhouseMoney/:queryhouseMoneyId', async (req, res) => {
  try {
    const queryhouseMoneyId = req.params.queryhouseMoneyId;
    const deletedQueryhouseMoney = await queryhouseMoneyModel.findByIdAndDelete(queryhouseMoneyId);

    const previousPage = req.get('Referrer') || '/landad/login';
    return res.status(500).redirect(previousPage);

  } catch (error) {
    req.flash('error deleting queryhouse money product')
    const previousPage = req.get('Referrer') || '/landad/login';
    return res.status(500).redirect(previousPage);
  }
})


router.get('/edit-bayana-image-of-user/:bayanaId', isAdminLoggedIn, async (req, res) => {
  try {
    const userBayanaFormId =  req.params.bayanaId;
    await userBayanaFormModel.findByIdAndUpdate(
      userBayanaFormId,
      { $unset: {bayana: ''} }
    );
    req.flash('bayana edited(deleted) successfully!')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  } catch (error) {
    log(error.message)
    req.flash('error deleting bayana image')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  }
})

// not is use
// router.get('/mapProductcreation', (req, res) => {
//   const success = req.flash('success');
//   const error = req.flash('error');

//   res.render('admin-map-products-panel', {success, error});
// })

module.exports = router;