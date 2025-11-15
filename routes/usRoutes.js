const express = require('express')
const router = express.Router();
const { log } = require('console');
const isLoggedIn = require('../middlewares/isLoggedIn');
const isLoggedInForCart = require('../middlewares/isLoggedInForCart.js');
const userModel = require('../models/userModel');
const landbookersModel = require('../models/landbookersModel');
const sellingFormModel = require('../models/sellingFormModel');
const buyingFormModel = require('../models/buyingFormModel');
const productModel = require('../models/productModel');
const buyingCartTimerModel = require('../models/buyingCartTimerModel');
const newMapProductModel = require('../models/newMapProductModel');
const skymanProductModel = require('../models/skymanProductModel');
const userBayanaFormModel = require('../models/userBayanaFormModel');
const counterFormModel = require('../models/counterModel');
const userNotificationModel = require('../models/userNotificationModel');
// const cityTehsilModel = require('../models/cityTehsilModel');
// const archiver = require('archiver');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const isAdminLoggedIn = require('../middlewares/isAdminLoggedIn');
const isLandbookersLoggedIn = require('../middlewares/isLandbookersLoggedIn');
const isAdminOrLandbookerLoggedIn = require('../middlewares/isAdminOrLandbookerLoggedIn');
const isQueryHouseStaffLoggedIn = require('../middlewares/isQueryHouseStaffLoggedIn');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const counterForSkymanProductModel = require('../models/counterForSkymanProductModel.js');

function sendFile(res, filePath, downloadName) {
  const absolutePath = path.join(__dirname, '../public', filePath);
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).send('File not found');
  }
  res.download(absolutePath, downloadName);
}
function sendZipFromPaths(res, filesArray, zipName) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${zipName}"`
  });
  archive.pipe(res);
  filesArray.forEach(file => {
    const fullPath = path.join(__dirname, '../public', file.path);
    if (fs.existsSync(fullPath)) {
      archive.file(fullPath, { name: file.originalName });
    } else {
      console.log('[MISSING FILE]', fullPath);
    }
  });

  archive.finalize();
}
const setSkymanProductModelCounter = async (req, res, next) => {
  try {
    const counter = await counterForSkymanProductModel.findOneAndUpdate(
      {name: 'productNumber'},
      {$inc: {seq: 1}},
      {new: true, upsert: true}
    )
    req.productNumber = counter.seq;
    next();
  } catch (error) {
    console.error('Error generating counter', error);
    res.status(500).send('Error generating product number')
  }
}
// const sharp = require('sharp');

const upload = require('../config/multer-config');
const uploadDisk = require('../config/multer-disk-storage');
const queryhouseModel = require('../models/queryhouseModel');
router.use(cookieParser());


router.get('/us', (req, res) => {
  res.send('coming from us router')
})

router.get('/landbook', async (req, res) => {
  const sellingForms = await sellingFormModel.find();
  const contacterSellingForms = [];
  if(sellingForms) {
    sellingForms.forEach((sellingForm) => {
      if(!sellingForm.khatauniSpecDetails) {
        contacterSellingForms.push(sellingForm);
      }
    })
  }

  const buyingForms = await buyingFormModel.find();
  const products = await productModel.find();
  // for map marker id creation notification
  let mapProductCreationLength = 0;
  if(products.length > 0) {
    products.forEach((product) => {
      if(product.mapMarkerId.length <= 0) {
        mapProductCreationLength += 1;
      }
    })
  }

  const buyingCartTimers = await buyingCartTimerModel.find();
  const theSkymanProducts = await skymanProductModel.find();
  const skymanProducts = [];
  theSkymanProducts.forEach((skymanProduct) => {
    if(skymanProduct.productId.length <= 0) {
      skymanProducts.push(skymanProduct)
    }
  })
  // const alreadyInskymanForms = product.claimedPeople.includes(user._id);
  const skymanForms = [];
  const franchises = await queryhouseModel.find();
  if(sellingForms) {
    if(franchises.length > 0) {
      franchises.forEach((franchise) => {
        sellingForms.forEach((sellingForm) => {
          if(sellingForm.khatauniSpecDetails && !sellingForm.skymanProductId.length > 0 && !sellingForm.city === franchise.queryhouseTehsil) {
            skymanForms.push(sellingForm);
          }
        })
      })
    } else {
      sellingForms.forEach((sellingForm) => {
        if(sellingForm.khatauniSpecDetails && !sellingForm.skymanProductId.length > 0) {
          skymanForms.push(sellingForm);
        }
      })
    }
  }
  // for landbooker userbayana forms
  const userBayanaForms = await userBayanaFormModel.find();
  const landbookerUserBayanaForms = [];
  if(franchises.length > 0) {
    franchises.forEach((franchise) => {
      userBayanaForms.forEach((userBayanaForm) => {
        if(!userBayanaForm.tehsil === franchise.queryhouseTehsil) {
          landbookerUserBayanaForms.push(userBayanaForm);
        }
      })
    })
  } else {
    userBayanaForms.forEach((userBayanaForm) => {
      landbookerUserBayanaForms.push(userBayanaForm);
    })
  }


  const success = req.flash('success');
  const error = req.flash('error');
  res.render('landbookLogin', { success, error, contacterSellingForms, buyingForms, mapProductCreationLength, skymanForms, skymanProducts, buyingCartTimers, landbookerUserBayanaForms })
})

router.post('/createlandbookers', async (req, res) => {
  let {fullname, username, contactNumber, email, address, password, ownerContactForOtp} = req.body;
  let landbookersSameEmail = await landbookersModel.findOne({email});
  let landbookersSameUsername = await landbookersModel.findOne({username});
  if(landbookersSameUsername) {
    req.flash('error', 'User already registered through this username')
    return res.status(406).redirect('/us/landbook');
  }
  else if (landbookersSameEmail) {
    req.flash('error', 'User already registered through this email')
    return res.status(406).redirect('/us/landbook')
  } else {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
          let createdLandbooker = await landbookersModel.create({
          fullname,
          username,
          contactNumber,
          email,
          address,
          ownerContactForOtp,
          password: hash
          });
          req.flash('success', 'Now you can login to continue to Landbook')
          res.redirect('/us/landbook');
      })
    })
  }

})

router.post('/landbookerlogin', async (req, res) => {
  let {username, password} = req.body;
  let landbooker = await landbookersModel.findOne({username})
  if(!landbooker) {
    req.flash('error', 'Username or password is incorrect')
    return res.status(406).redirect('/us/landbook')
  } else{
    if(landbooker.banned) {
      req.flash('error', `Sorry ${landbooker.fullname}, You are banned from Landbook: ${landbooker.banReason}. Contact Landbook down below for query. `)
      return res.status(400).redirect('/us/landbook')
    }
    bcrypt.compare(password, landbooker.password, (err, result) => {
      if(err) return res.status(406).send('something went wrong')
        if(result === true) {

          let token = jwt.sign({email: landbooker.email, id: landbooker._id}, process.env.SKF_SKF);
          res.cookie('landbookers', token);

          req.flash('success', 'You are logged in!')
          res.redirect('/us/createProductsPanel')
        } else{
          req.flash('error', 'Username or password is incorrect')
          res.redirect('/us/landbook')
        }
    })
  }

})

router.get('/createProductsPanel', async (req, res) => {
  const sellingForms = await sellingFormModel.find();
  const contacterSellingForms = [];
  if(sellingForms) {
    sellingForms.forEach((sellingForm) => {
      if(!sellingForm.khatauniSpecDetails) {
        contacterSellingForms.push(sellingForm);
      }
    })
  }

  const buyingForms = await buyingFormModel.find();
  const products = await productModel.find();
  // for map marker id creation notification
  let mapProductCreationLength = 0;
  if(products.length > 0) {
    products.forEach((product) => {
      if(product.mapMarkerId.length <= 0) {
        mapProductCreationLength += 1;
      }
    })
  }

  const theSkymanProducts = await skymanProductModel.find();
  const skymanProducts = [];
  theSkymanProducts.forEach((skymanProduct) => {
    if(skymanProduct.productId.length <= 0) {
      skymanProducts.push(skymanProduct)
    }
  })
  const buyingCartTimers = await buyingCartTimerModel.find();
  // for landbooker userbayana forms
  const userBayanaForms = await userBayanaFormModel.find();
  const landbookerUserBayanaForms = [];
  const franchises = await queryhouseModel.find();
  if(franchises.length > 0) {
    franchises.forEach((franchise) => {
      userBayanaForms.forEach((userBayanaForm) => {
        if(!userBayanaForm.tehsil === franchise.queryhouseTehsil) {
          landbookerUserBayanaForms.push(userBayanaForm);
        }
      })
    })
  } else {
    userBayanaForms.forEach((userBayanaForm) => {
      landbookerUserBayanaForms.push(userBayanaForm);
    })
  }

  
  const success = req.flash('success');
  const error = req.flash('error');
  res.render('landbooker-create-products-panel', {success, error, contacterSellingForms, buyingForms, mapProductCreationLength, skymanProducts, buyingCartTimers, landbookerUserBayanaForms})
})

router.get('/landbooker-panel', isLandbookersLoggedIn, (req, res) => {
  res.send('hey')
})

router.get('/landbookers/createproduct', isLandbookersLoggedIn, (req, res) => {
  res.render('create-products-panel')
})

router.get('/sellingforms', isAdminOrLandbookerLoggedIn, async (req, res) => {
  let sellingForms = await sellingFormModel.find();
  const error = req.flash('error');
  const success = req.flash('success');

  res.render('landbooker-selling-form-page', {sellingForms, error, success});
})

router.get('/download/download-compressed-file/:formId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  try {
    const {formId} = req.params;
    const form = await sellingFormModel.findById(formId);
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

router.get('/buyingforms', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const buyingForms = await buyingFormModel.find();
  const error = req.flash('error')
  const success = req.flash('success')

  res.render('landbooker-buying-form-page', {buyingForms, error, success});
  // log(populatedBuyingForms);
})

router.post('/deletebuyingForm/:buyingFormId', isAdminLoggedIn, async (req, res) => {
  try {
    const buyingFormId = req.params.buyingFormId;
    const {landbookMessage} = req.body;
    const buyingForm = await buyingFormModel.findOne({_id: buyingFormId});
    const buyingFormDate = buyingForm.date;
  
    await userModel.updateMany(
      {buyingForm: buyingFormId},
      {$pull: {buyingForm: buyingFormId}}
    );
    await userModel.updateMany(
      {_id: {$in: buyingForm.user}},
      {$push: { buyingMessageFromLandbook: { message: landbookMessage, read: false, buyingFormDate: buyingFormDate } }}
    );
    await productModel.updateMany(
      {buyingForm: buyingFormId},
      {$pull: {buyingForm: buyingFormId}}
    );
  
    const deletedBuyingForm = await buyingFormModel.findOneAndDelete({_id: buyingFormId});
  
    req.flash('error', 'buying form deleted')
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);

  } catch (err) {
    log(err.message);
    return res.redirect('/us/landbook')
  }
})

router.post('/deletesellingform/:productId', isAdminLoggedIn, async (req, res) => {
  try {
    const sellingFormId = req.params.productId;
    const {landbookMessage} = req.body;
    const sellingForm = await sellingFormModel.findOne({_id: sellingFormId});
    const sellingFormDate = sellingForm.date;
    const userId = sellingForm.user;
    const user = await userModel.findOne({_id: userId});
    user.sellingForm.splice(user.sellingForm.indexOf(sellingFormId), 1)
    await user.save();
  
    await userModel.updateMany(
      { sellingForm: sellingFormId },
      { $pull: {sellingForm: sellingFormId} }
    );
  
    await userModel.updateMany(
      {_id: {$in: sellingForm.user}},
      {$push: { sellingMessageFromLandbook: { message: landbookMessage, read: false, sellingFormDate: sellingFormDate} }}
    );
    // await productModel.deleteMany({sellingFormId: sellingFormId});
  
    const deletedSellingForm = await sellingFormModel.findOneAndDelete({_id: sellingFormId});
    
    req.flash('error', 'Selling form deleted')
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  } catch (error) {
    log(error)
    req.flash('error', `${error}`)
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
})

router.get('/logoutlandbooker', (req, res) => {
  if(req.cookies.landbookers === '') {
    req.flash('error', 'You need to be logged in first')
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
  res.cookie('landbookers', '')
  req.flash('success', 'You are logged out!')
  res.redirect('/us/landbook')
})

router.get('/viewSellingForm/:sellingFormId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const sellingFormId = req.params.sellingFormId;

  const sellingForm = await sellingFormModel.findOne({_id: sellingFormId});
  res.render('landbookers-individual-selling-form', {sellingForm});
})

router.get('/edit-khataunispec/:sellingFormId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const sellingFormId = req.params.sellingFormId;
  const sellingForm = await sellingFormModel.findOne({_id: sellingFormId});
  const success = req.flash('success');
  const error = req.flash('error');
  if(sellingForm.skymanProductId.length > 0) {
    req.flash('error', 'Khatauni specification cannot be updated since skyman product is already created. Contact admin 24/7 @9140362143 for query!');
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }

  res.render('edit-khatauni-spec', {success, error, sellingForm})
})

router.post('/edited-khatauni-details/:sellingFormId', async (req, res) => {
  const sellingFormId = req.params.sellingFormId;
  const {khatauniSpecDetails} = req.body;

  const updatedSellingForm = await sellingFormModel
  .findByIdAndUpdate(sellingFormId, {khatauniSpecDetails});

  req.flash('success', 'Khatauni specification details updated successfully');
  res.redirect('/us/Sellingforms');
})

router.get('/skyman-panel', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const sellingForms = await sellingFormModel.find();
  const skymanForms = [];
  if(sellingForms) {
    sellingForms.forEach((sellingForm) => {
      if(sellingForm.khatauniSpecDetails) {
        skymanForms.push(sellingForm);
      }
    })
  }
  const franchises = await queryhouseModel.find();

  res.render('skyman-panel', {success, error, skymanForms, franchises})
})

router.get('/queryhouseContacts', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const franchises = await queryhouseModel.find();
  res.render('queryhousesContacts', {franchises})
})

router.get('/skyman-current-location', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');

  res.render('skyman-location-page', {success, error})
})

router.get('/create-skyman-products/:formId', async (req, res) => {
  const skymanFormId = req.params.formId;
  const skymanProduct = await sellingFormModel.findOne({_id: skymanFormId})
  if(skymanProduct.skymanProductId.length > 0) {
    req.flash('error', 'Product already uploaded by Skyman! If the skyman product needs to corrected somewhere, contact modifier @9140362143 for query.');
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
  const success = req.flash('success');
  const error = req.flash('error');
  res.render('landbooker-create-skyman-products', {success, error, skymanProduct})
})

router.post('/skyman/created-product', setSkymanProductModelCounter, uploadDisk.fields([
  { name: 'realImage', maxCount: 1 },
  { name: 'mainRoadImages', maxCount: 10 },
  { name: 'image360', maxCount: 1 },
  { name: 'khatauniFile', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 }
]), isAdminOrLandbookerLoggedIn, async (req, res) => {
  try {
    const {tehsil, landbookerUsername, badnaamSpec, lat, lng, sellerPrice, LB, spec, sellerId, sellingFormId, contactNumber, khatauniSpecDetails, landAddress} = req.body;
    const sellerIdFromForm = sellerId.trim();
    const sellingFormIdFromForm = sellingFormId.trim();
    const realTehsil = tehsil.toLowerCase().replace(' ', '');
    const specArray = spec.split('\n').map(item => item.trim()).filter(item => item);

    const folderName = req.productNumber;

    const realImage = req.files['realImage']?.[0];
    const image360 = req.files['image360']?.[0];
    const khatauniFile = req.files['khatauniFile']?.[0];
    const videoFile = req.files['videoFile']?.[0];
    const mainRoadImages = req.files['mainRoadImages'] || [];

    const newSkymanProduct = await skymanProductModel.create({
      skymanName: req.body.skymanName || 'Skyman',
      realImage: {
        path: `/uploads/skyman/${folderName}/${realImage.filename}`,
        originalName: realImage.originalname
      },
      mainRoadImages: mainRoadImages.map(file => ({
        path: `/uploads/skyman/${folderName}/${file.filename}`,
        originalName: file.originalname
      })),
      image360: {
        path: `/uploads/skyman/${folderName}/${image360.filename}`,
        originalName: image360.originalname
      },
      khatauniFile: {
        path: `/uploads/skyman/${folderName}/${khatauniFile.filename}`,
        originalName: khatauniFile.originalname
      },
      videoFile: {
        path: `/uploads/skyman/${folderName}/${videoFile.filename}`,
        originalName: videoFile.originalname
      },
      tehsil: realTehsil, badnaamSpec, lat, lng, sellerPrice, LB, productFolderName: folderName, spec: specArray, sellerId: sellerIdFromForm, landAddress, sellingFormId: sellingFormIdFromForm,  contactNumber, khatauniSpecDetails
    });
    await sellingFormModel.findByIdAndUpdate(
      sellingFormIdFromForm,
      { $push: { skymanProductId: newSkymanProduct._id } }
    );

    req.flash('success', 'Product successfully uploaded by Skyman!');
    res.redirect('/us/skyman-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect('/us/skyman-panel');
  }
});

router.get('/skyman-products-page', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const skymanProducts = await skymanProductModel.find();
  const landbooker = req.owner;

  res.render('skyman-products-page', {success, error, skymanProducts, landbooker})
})

router.get('/delete-skyman-product/:id', isAdminOrLandbookerLoggedIn, async (req, res) => {
  try {
    const skymanProductId = req.params.id
    const skymanProduct = await skymanProductModel.findById(skymanProductId);
    const sellingFormId = skymanProduct.sellingFormId[0];
    const sellingForm = await sellingFormModel.findOne({_id: sellingFormId})
    if(sellingForm) {
    const deletedSellingForm = await sellingFormModel.findByIdAndDelete(sellingFormId)
    await userModel.updateMany(
      { sellingForm: sellingFormId },
      { $pull: {sellingForm: sellingFormId} }
    );
  }

    const numberFolderName = skymanProduct.productFolderName;
    const folderName = String(numberFolderName);
    const productPath = path.join(__dirname, '..', 'public', 'uploads', 'skyman', folderName);

    // ✅ Remove folder and files
    if (fs.existsSync(productPath)) {
      fs.rmSync(productPath, { recursive: true, force: true });
    }
    // ✅ Remove DB record
    await skymanProductModel.findByIdAndDelete(skymanProductId);

    req.flash('success', 'Skyman product and all files deleted');
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);; // adjust if your listing page is different
  } catch (err) {
    // console.error(err);
    log(err)
    req.flash('error', `${err.message}`);
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
});

router.get('/real-product-creation-page/:skymanProductId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  // for notification
  const sellingForms = await sellingFormModel.find();
  const contacterSellingForms = [];
  if(sellingForms) {
    sellingForms.forEach((sellingForm) => {
      if(!sellingForm.khatauniSpecDetails) {
        contacterSellingForms.push(sellingForm);
      }
    })
  }
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
  const skymanProducts = await skymanProductModel.find();

  const skymanProductId = req.params.skymanProductId;
  const skymanProduct = await skymanProductModel.findOne({_id: skymanProductId});
  if(skymanProduct.productId.length > 0) {
    req.flash('error', 'Real product already created by modifier. If there is something to edit the product, contact Admin 24/7 @9140362143!');
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  } 

  const success = req.flash('success');
  const error = req.flash('error');
  res.render('landbooker-real-product-creation', {success, error, skymanProduct, contacterSellingForms, buyingForms, mapProductCreationLength, skymanProducts});
})

// skyman products download routes start
router.get('/download/skyman/real/:id', async (req, res) => {
  const product = await skymanProductModel.findById(req.params.id);
  sendFile(res, product.realImage.path, `${product.productFolderName}-realImage.jpg`);
});

router.get('/download/skyman/image360/:id', async (req, res) => {
  const product = await skymanProductModel.findById(req.params.id);
  sendFile(res, product.image360.path, `${product.productFolderName}-image360.jpg`);
});

router.get('/download/skyman/khatauni/:id', async (req, res) => {
  const product = await skymanProductModel.findById(req.params.id);
  sendFile(res, product.khatauniFile.path, `${product.productFolderName}-khatauni.zip`);
});

router.get('/download/skyman/video/:id', async (req, res) => {
  const product = await skymanProductModel.findById(req.params.id);
  sendFile(res, product.videoFile.path, `${product.productFolderName}-video.mp4`);
});

router.get('/download/skyman/mainRoad/:id', async (req, res) => {
  const product = await skymanProductModel.findById(req.params.id);
  sendZipFromPaths(res, product.mainRoadImages, `${product.productFolderName}-mainRoadImages.zip`);
});
// skyman products download routes end


router.get('/viewBuyingForm/:buyingFormId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const buyingFormId = req.params.buyingFormId;
  const buyingForm = await buyingFormModel.findOne({_id: buyingFormId});
  const theProduct = await productModel.findOne({_id: buyingForm.product})
  const product = await productModel.findOne({_id: buyingForm.product}).populate("claimedPeople");
  const claimedPeoples = product.claimedPeople;

  res.render('landbooker-individual-buying-form', {theProduct, claimedPeoples})
})

router.get('/viewClaimedPeople/:productId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const productId = req.params.productId;
  const theProduct = await productModel.findOne({_id: productId});
  const product = await productModel.findOne({_id: theProduct._id}).populate("claimedPeople");
  const claimedPeoples = product.claimedPeople;

  res.render('claimed-people-page', {claimedPeoples, theProduct});
})

router.get('/user/profile', isLoggedIn, async (req, res) => {
  try {
    let user = req.user;
    const success = req.flash('success');
    const error = req.flash('error');
    // if(user.buyingCart.length > 0 || user.sellingProduct.length > 0) {

      let userBuying = await userModel.findOne({_id: user._id}).populate("buyingCart");
      let userSelling = await userModel.findOne({_id: user._id}).populate('sellingProduct');
      let userClaiming = await userModel.findOne({_id: user._id}).populate('claimCart');
      let userBuyingCartTimer = await buyingCartTimerModel.findOne({_id: user._id}).populate('buyingCartTimerId');

      const fullUser = await userModel.findOne({_id: user._id}).populate('buyingForm')
      const buyingForms = fullUser.buyingForm;
      let userSellingForms = [];
      if(fullUser.sellingForm.length > 0) {
        const populatedUserSellingForms = await userModel.findOne({_id: fullUser._id}).populate('sellingForm');
        
        if(populatedUserSellingForms.sellingForm.length > 0) {
          populatedUserSellingForms.sellingForm.forEach((userSellingForm) => {
            if(!userSellingForm.product.length > 0) {
              userSellingForms.push(userSellingForm); 
            }
          })
        }
      }

      const buyingCartProducts = userBuying.buyingCart;
      const userSellingProducts = userSelling.sellingProduct;
      const claimProducts = userClaiming.claimCart;
      let claimCartBuyingForm = null;
      if (claimProducts.length > 0 && claimProducts[0].buyingForm) {
        const buyingFormId = claimProducts?.[0]?.buyingForm;
        claimCartBuyingForm = await buyingFormModel.findOne({_id: buyingFormId})
      }

      res.render('profile-page', {buyingCartProducts, userSellingProducts, buyingForms,  claimProducts, claimCartBuyingForm, userSellingForms, user, success, error});
  } catch (error) {
    log(error)
    req.flash('error' `${error.message}`);
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
})

router.get('/user/changeSellingPrice/:productId', async (req, res) => {
  const user = req.user;
  const productId = req.params.productId;
  res.cookie('landbook', '')
  req.flash('error', `User is logged out! Log in here to be able to change your product's selling price`)
  const product = await productModel.findOne({_id: productId});
  const success = req.flash('success');
  const error = req.flash('error');

  res.render('user-change-selling-price', {product, success, error})
})

router.post('/changing-selling-price/userlogin/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    let {username, password} = req.body;
    let user = await userModel.findOne({username})
    if(!user) {
      req.flash('error', 'Username or password is incorrect')
      return res.status(406).redirect(`/us/user/changeSellingPrice/${productId}`)
    } else{
      if(user.banned) {
        req.flash('error', `Sorry ${user.name}, You are banned from Landbook: ${user.banReason}. Contact Landbook down below for query. `)
        return res.status(400).redirect(`/us/user/changeSellingPrice/${productId}`)
      }
      bcrypt.compare(password, user.password, (err, result) => {
        if(err) return res.status(406).send('something went wrong')
          if(result === true) {
  
            let token = jwt.sign({email: user.email, id: user._id}, process.env.SESSION_SECRET);
            res.cookie('landbook', token);
  
            res.redirect(`/us/change-selling-price/${productId}`)
          } else{
            req.flash('error', 'Username or password is incorrect')
            res.redirect(`/us/user/changeSellingPrice/${productId}`)
          }
      })
    }
  } catch (error) {
    req.flash('error', `${error.message}`)
    console.error('something went wrong')
    return res.status(404).redirect('/home/login') 
  }

})

router.get('/change-selling-price/:productId', isLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const product = await productModel.findOne({_id: req.params.productId});

  res.render('user-changing-selling-price', {success, error, product})
})

router.post('/selling-user/changed-selling-price/:productId', isLoggedIn, async (req, res) => {
  try {
    const {sellerPrice, landbookPrice, brokerPrice} = req.body;
    const product = await productModel.findOne({_id: req.params.productId});
    
    product.sellerPrice = sellerPrice;
    product.landbookPrice = landbookPrice;
    product.brokerPrice = brokerPrice;
    await product.save();

    req.flash('success', 'Selling price changed successfully!');
    res.redirect('/us/user/profile');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong');
    return res.status(500).redirect('/home/login');
  }
})

router.get('/user/notification', isLoggedIn, async(req, res) => {
  const user = req.user;
  const theUser = await userModel.findOne({_id: user._id}).populate('notifications');
  await userNotificationModel.updateMany(
    { user: theUser._id },
    { $set: {read: true} }
  );
  const allNotifications = [];
  if(theUser.notifications.length > 0) {
    theUser.notifications.forEach((notification) => {
      if(notification.read === false) {
        allNotifications.push(notification);
      }
    })
  }

  res.render('user-notification-page', {theUser, allNotifications})
})

// forgot password
router.get('/user/forgotPass', async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  
  res.render('forgot-user-pass-page', {success, error})
})

router.post('/user/forgottingPass', async (req, res) => {
  try {
    let {username, contactNumber, email} = req.body;
    const user = await userModel.findOne({username, contactNumber, email});
    if(!user) {
      req.flash('error', 'Your given information does not match any account. Please try again.')
      return res.status(406).redirect('/us/user/forgotPass')
    } else {
      if(user.banned) {
        req.flash('error', `Sorry ${user.name}, You are banned from Landbook: ${user.banReason}. Contact Landbook down below for query. `)
        return res.status(400).redirect('/home/login')
      }
      res.redirect(`/us/user/forgottingPass/${user._id}`)
    }

  } catch (error) {
    req.flash('error', `${error.message}`)
    console.error('something went wrong')
    return res.status(404).redirect('/home/login')
  }
})

router.get('/user/forgottingPass/:user', async (req, res) => {
  const user = await userModel.findOne({_id: req.params.user});
  const success = req.flash('success');
  const error = req.flash('error');

  res.render('forgotting-user-pass-page', {user, success, error})
})

router.post('/user/forgottedPassword', async (req, res) => {
  try {
    const {username, password, confirmPassword} = req.body;
    if(password !== confirmPassword) {
      req.flash('error', 'Passwords do not match, try again!')
      const previousPage = req.get('Referrer') || '/us/landbook';
      return res.status(400).redirect(previousPage);
    }
    const user = await userModel.findOne({username: username});
    if(!user) {
      req.flash('error', 'Your username is incorrect!')
      const previousPage = req.get('Referrer') || '/us/landbook';
      return res.status(400).redirect(previousPage);
    }
    bcrypt.genSalt(10, async (err, salt) => {
      bcrypt.hash(password, salt, async (err, newHash) => {
        if(err) return res.status(406).send(err.message)
          user.password = newHash
          await user.save();
      });
      req.flash('success', 'Password successfully changed. Now you can login to continue to Landbook')
      res.redirect('/home/login');
    })

  } catch (error) {
    console.error(err);
    req.flash('error', 'Error doing Forgot password!')
    res.status(500).redirect('home/login');
  }
})

router.get('/user-buying-cart-timers', isLoggedIn, async (req, res) => {
  try {
    const success = req.flash('success');
    const error = req.flash('error');
    const user = req.user;
    const userId = user._id;
  
    const buyingCartTimers = await buyingCartTimerModel.find({user: userId});
    // for sending products related to the buying cart timers individually...
    for (let bCartTimers of buyingCartTimers) {
      bCartTimers.productDetails = [];
  
      for (prodId of bCartTimers.product) {
        const fullProduct = await productModel.findById(prodId);
        if(fullProduct) {
          bCartTimers.productDetails.push(fullProduct);
        }
      }
    }
    res.render('user-buying-cart-timers-page', {buyingCartTimers, user, success, error});
  } catch (error) {
    log(error)
    req.flash('error' `${error.message}`);
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
})

router.get('/landbookers-buying-cart-timers', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const buyingCartTimers = await buyingCartTimerModel.find().populate('user');
  // for sending products related to the buying cart timers individually...
  for (let bCartTimers of buyingCartTimers) {
    bCartTimers.productDetails = [];

    for (prodId of bCartTimers.product) {
      const fullProduct = await productModel.findById(prodId);
      if(fullProduct) {
        bCartTimers.productDetails.push(fullProduct);
      }
    }
  }

  res.render('landbooker-buying-cart-timers', {buyingCartTimers, success, error,})
})

router.get('/landbooker-user-bayana-forms', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const userBayanaForms = await userBayanaFormModel.find()
    .populate('productId')
    .populate('user')
    .populate('queryhouse')
    .populate('buyingFormId')
    .populate('buyingCartTimerId')
    .populate('productSeller');
  const success = req.flash('success');
  const error = req.flash('error');

  res.render('landbooker-user-bayana-forms', {userBayanaForms, success, error, landbookers: req.cookies.ownerLandbook});
})

router.get('/landbooker-calculated-price/:productId', async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const productId = req.params.productId;
  const product = await productModel.findOne({_id: productId});

  res.render('landbooker-calculated-pricing', {product, success, error});
})


router.post('/filling-bayana-form/:productId', isLoggedIn, async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await productModel.findOne({_id: productId});
    const sellerId = product.seller[0];
    if(product.bayana.length > 0) {
      req.flash('error', `A claimed user has given bayana to this land already in his/her claimed time which was 5 hours. This land now can only be bought by that claimed user which is now a buyer of this land. If you had claimed this land too, then you'll have a 5 hours claimed time for you too in which if you able to give bayana to this land before that claimed user in between 5 hours then this land would be yours! Please read instructions of what claimed time and claimed people are in Landbook Help page so that you do not miss an opportunity to buy a land of yours choice without any interference. This product/land will be deleted/removed from Landbook soon...Landbook!`)
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(404).redirect(previousPage);
    }
    const user = req.user;
    // to check also if user filled bayana to that product already
    const hasAlreadyFilled = user.bayana.some(bayanaId => product.bayana.includes(bayanaId));
    if(hasAlreadyFilled) {
      req.flash('error', `You've already filled the bayana form for this product. A user can only able to fill bayana form for a product once only not twice. Now you can contact to the product's Landbook query house for it's address or any other query But mainly you have to get to the Landbook Query House and give bayana to this selected land before the timer runs out (72 hours (3 days)).`)
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(400).redirect(previousPage);
    }
    // to check ends here
    const queryhouses = await queryhouseModel.find();

    let theQueryhouse = '';
    queryhouses.forEach((queryhouse) => {
      if(product.tehsil === queryhouse.queryhouseTehsil) {
        theQueryhouse = queryhouse;
      }
    })

    const buyingFormId = product.buyingForm[0];

    const counter = await counterFormModel.findOneAndUpdate(
      {name: 'priority'},
      {$inc: {seq: 1}},
      {new: true, upsert: true}
    )
    const productNumber = counter.seq;
  
    const {currentContact, city, tehsil} = req.body;
    const userBayanaProduct = await userBayanaFormModel.create({
      currentContact, city, tehsil, email: user.email, priority: productNumber
    })
    // to push bayana form id in product and user.bayana
    await userModel.findByIdAndUpdate(
      user._id,
      { $push: { bayana: userBayanaProduct._id } }
    )
    await productModel.findByIdAndUpdate(
      productId,
      { $push: { bayana: userBayanaProduct._id } }
    )
    // ends here
    if(theQueryhouse) {
      userBayanaProduct.queryhouse.push(theQueryhouse._id);
      await userBayanaProduct.save();
    }
    userBayanaProduct.productId.push(productId);
    userBayanaProduct.buyingFormId.push(buyingFormId);
    userBayanaProduct.user.push(user._id)
    userBayanaProduct.productSeller.push(sellerId);
    await userBayanaProduct.save();
  
    req.flash('success', `Your bayana giving form is filled successfully. Now you can contact to the product's Landbook query house for it's address or any other query But mainly you have to get to the Landbook Query House and give bayana to this selected land before the timer runs out (72 hours (3 days)).`)
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  } catch (error) {
    log(error)
    req.flash('error', `Something went wrong`)
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  }
})
router.post('/filling-bayana-form-for-buyingCarter/:productId', isLoggedIn, async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await productModel.findOne({_id: productId});
    if(product.bayana.length > 0) {
      req.flash('error', `A claimed user has given bayana to this land already in his/her claimed time which was 5 hours. This land now can only be bought by that claimed user which is now a buyer of this land. If you have claimed this land too, then you'll have a 5 hours claimed time for you too in which if you able to give bayana to this land before that claimed user in between 5 hours then this land would be yours! Please read instructions of what claimed time and claimed people are in Landbook Help page so that you do not miss an opportunity to buy a land of yours choice without any interference. This product/land will be deleted/removed from Landbook soon...Landbook!`)
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(404).redirect(previousPage);
    }
    const user = req.user;
    // to check also if user filled bayana to that product already
    const hasAlreadyFilled = user.bayana.some(bayanaId => product.bayana.includes(bayanaId));
    if(hasAlreadyFilled) {
      req.flash('error', `You've already filled the bayana form for this product. A user can only able to fill bayana form for a product once only not twice. Now you can contact to the product's Landbook query house for it's address or any other query But mainly you have to get to the Landbook Query House and give bayana to this selected land before the timer runs out (72 hours (3 days)).`)
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(400).redirect(previousPage);
    }
    // to check ends here

    const queryhouses = await queryhouseModel.find();

    let theQueryhouse = '';
    queryhouses.forEach((queryhouse) => {
      if(product.tehsil === queryhouse.queryhouseTehsil) {
        theQueryhouse = queryhouse;
      }
    })
    const buyingFormId = product.buyingForm[0];

    const counter = await counterFormModel.findOneAndUpdate(
      {name: 'priority'},
      {$inc: {seq: 1}},
      {new: true, upsert: true}
    )
    const productNumber = counter.seq;
  
    const {currentContact, city, tehsil, buyingCartTimerId} = req.body;
    const userBayanaProduct = await userBayanaFormModel.create({
      currentContact, city, tehsil, email: user.email, priority: productNumber
    })
    // to push bayana form id in product and user.bayana
    await userModel.findByIdAndUpdate(
      user._id,
      { $push: { bayana: userBayanaProduct._id } }
    )
    await productModel.findByIdAndUpdate(
      productId,
      { $push: { bayana: userBayanaProduct._id } }
    )
    // ends here
    
    if(theQueryhouse) {
      userBayanaProduct.queryhouse.push(theQueryhouse._id);
      await userBayanaProduct.save();
    }
    userBayanaProduct.productId.push(productId);
    userBayanaProduct.buyingCartTimerId.push(buyingCartTimerId);
    userBayanaProduct.user.push(user._id)
    await userBayanaProduct.save();
  
    req.flash('success', `Your bayana giving form is filled successfully. Now you can contact to the product's Landbook query house for it's address or any other query But mainly you have to get to the Landbook Query House and give bayana to this selected land before the timer runs out (72 hours (3 days)).`)
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  } catch (error) {
    log(error)
    req.flash('error', `Something went wrong`)
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  }
})


router.get('/download-bayana-of-product/:userBayanaFormId', isLandbookersLoggedIn, async (req, res) => {
try {
  const userBayanaFormId = req.params.userBayanaFormId;
  const userBayanaForm = await userBayanaFormModel.findOne({_id: userBayanaFormId});
  if(!userBayanaForm || !userBayanaForm.bayana.length > 0) {
    req.flash('error', 'bayana image not found')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  }
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Disposition', `attachment; filename="bayana-${userBayanaForm.currentContact}-${userBayanaForm.email}-${userBayanaForm.user}-${userBayanaFormId}.jpg"`);
  res.end(userBayanaForm.bayana);

} catch (error) {
  console.error('Error downloading bayana image:', error);
  const previousPage = req.get('Referrer') || '/home/login';
  return res.status(500).redirect(previousPage);
}
})

router.get('/user/remove-buying-cart-timer/:formId', async (req, res) => {
  try {
    const buyingCartTimerId = req.params.formId;
    const buyingCartTimer = await buyingCartTimerModel.findOne({_id: buyingCartTimerId});
    const buyerId = buyingCartTimer.user[0]._id;
    log(buyerId)
    const productId = buyingCartTimer.product[0]._id;
  
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
    await productModel.updateMany(
      { buyingCartTimerId: buyingCartTimerId },
      { $pull: {buyingCartTimerId: buyingCartTimerId} }
    )
    await userBayanaFormModel.updateMany(
      { buyingCartTimerId: buyingCartTimerId },
      { $pull: {buyingCartTimerId: buyingCartTimerId} }
    )
    // delete buying cartTimer model
    await buyingCartTimerModel.findByIdAndDelete(buyingCartTimerId);
  
    req.flash('error', 'Buying cart timer removed successfully. That product is no longer now in your Buying cart!')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  } catch (error) {
    log(error)
    req.flash('error' `${error.message}`);
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
})

router.get('/user/message/:userId', async (req, res) => {
  try {
    const user = await userModel.findOne({_id: req.params.userId});
    user.buyingMessageFromLandbook.forEach((buyingMessage) => {
      buyingMessage.read = true;
    })
  
    user.sellingMessageFromLandbook.forEach((sellingMessage) => {
      sellingMessage.read = true;
    })

    for (let claimedMsg of user.claimedMessageFromLandbook) {
        claimedMsg.productDetails = [];

        for (prodId of claimedMsg.productId) {
          const fullProduct = await productModel.findById(prodId);
          if (fullProduct) {
            claimedMsg.productDetails.push(fullProduct);
          }
        }
        claimedMsg.read = true;
      }
    await user.save();
  
    res.render('message-page', {user});
  } catch (error) {
    log(error.message);
    res.redirect('/us/user/profile')
  }
})

router.get('/user/delete-buying-form/:buyingFormId', isLoggedIn, async (req, res) => {
  const user = req.user;
  const buyingFormId = req.params.buyingFormId;
  try {
    await userModel.updateMany(
      {buyingForm: buyingFormId},
      {$pull: {buyingForm: buyingFormId}}
    );
    await productModel.updateMany(
      {buyingForm: buyingFormId},
      {$pull: {buyingForm: buyingFormId}}
    );
    const deletedBuyingForm = await buyingFormModel.findOneAndDelete({_id: buyingFormId});
    req.flash('error', 'Your buying form deleted');
    res.redirect('/us/user/profile');
  } catch (err) {
    log(err)
    req.flash('error' `${err.message}`);
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
})

router.get('/adminProducts', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const error = req.flash('error')
  const success = req.flash('success');

  const products = await productModel.find();
  res.render('admin-products-page', {landbookers: req.cookies.ownerLandbook,products, error, success});
})

router.get('/newMapProductCreation', isAdminOrLandbookerLoggedIn, (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');

  res.render('admin-new-map-products-panel', {error, success})
})

router.get('/newMapProductCreation/:productId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const product = await productModel.findOne({_id: req.params.productId})
  const success = req.flash('success');
  const error = req.flash('error');
  const products = await productModel.find();
    // for map marker id creation notification
  let mapProductCreationLength = 0;
  if(products.length > 0) {
    products.forEach((product) => {
      if(product.mapMarkerId.length <= 0) {
        mapProductCreationLength += 1;
      }
    })
  }

  res.render('admin-new-map-products-panel', {error, success, product, mapProductCreationLength})
})

router.get('/new-map', isAdminOrLandbookerLoggedIn, (req, res) => {
  res.render('new-map-page');
})

router.post('/add-new-marker', isAdminOrLandbookerLoggedIn, async (req, res) => {
  try {
    const {clusterName, lat, lng, popupText, productId} = req.body;

    const theProduct = await productModel.findOne({_id: productId});
    if(theProduct.mapMarkerId.length > 0) {
      req.flash('error', 'map marker already created for this product!')
      const previousPage = req.get('Referrer') || '/us/landbook';
      return res.status(404).redirect(previousPage);
    }
    const product = await productModel.findOne({_id: productId}).select('city tehsil landbookPrice spec LB');
    // const productCity = product.city;
    // const productTehsil = product.tehsil;
    const realClusterName = clusterName.toLowerCase().replace(' ', '');
  
    let newMapProduct = await newMapProductModel.create({
      clusterName: realClusterName,
      lat,
      lng,
      popupText,
      productId,
      city: product.city,
      tehsil: product.tehsil,
      price: product.landbookPrice,
      spec: product.spec.slice(0,3),
      LB: product.LB
    });
    await productModel.findByIdAndUpdate(
      productId,
      { $push: { mapMarkerId: newMapProduct._id } }
    );

    req.flash('success', 'New map marker created')
    res.redirect('/us/adminProducts')
  } catch (error) {
    req.flash('error', `Something went wrong: ${error.message}`);
    log(error);
    res.redirect('/us/adminProducts')
  }
})

router.get('/admin/delete-marker/:markerId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const markerId = req.params.markerId;
  await productModel.updateMany(
    { mapMarkerId: markerId },
    { $pull: {mapMarkerId: markerId} }
  )
  const deletedMarker = await newMapProductModel.findOneAndDelete({_id: markerId});

  req.flash('error', 'selected map marker deleted successfully!')
  res.redirect('/home/newMapProductCreation')
})

router.get('/admin/update-marker/:markerId', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const markerId = req.params.markerId;
  const marker = await newMapProductModel.findOne({_id: markerId});

  res.render('update-markers', {marker, success, error});
})

router.post('/updating-marker', isAdminOrLandbookerLoggedIn, async (req, res) => {
  const {clusterName, lat, lng, popupText, productId, markerId} = req.body;
  try {
    const updatedClusterName = await newMapProductModel
    .findByIdAndUpdate(markerId, {clusterName});
    const updatedLat = await newMapProductModel
    .findByIdAndUpdate(markerId, {lat});
    const updatedLng = await newMapProductModel
    .findByIdAndUpdate(markerId, {lng});
    const updatedPopupText = await newMapProductModel
    .findByIdAndUpdate(markerId, {popupText});
    const updatedLabel = await newMapProductModel
    .findByIdAndUpdate(markerId, {productId});
  
    req.flash('success', 'selected map marker updated successfully!')
    res.redirect('/home/newMapProductCreation')
  } catch (error) {
    log(error)
    req.flash('error' `${error.message}`);
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
})

router.get('/mapCoordinates', (req, res) => {
  res.render('admin-map-coordinates');
})

router.post('/send-claimcart-message', isAdminOrLandbookerLoggedIn, async (req, res) => {
  try {
    const { message, productId } = req.body;
    if (!message || message.trim().length === 0) {
      req.flash('error', 'Message cannot be empty!');
      return res.redirect('/us/buyingforms');
    }
    const usersWithClaimedProduct = await userModel.find({
      claimCart: productId
    })
    const updatePromises = usersWithClaimedProduct.map(user => {
      user.claimedMessageFromLandbook.push({
        message,
        date: new Date(),
        read: false,
        productId: [productId]
      });
      return user.save();
    });

    await Promise.all(updatePromises);
    req.flash('success', 'Message sent to all claimers!');
    res.redirect('/us/buyingforms');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/us/buyingforms');
  }
});

router.get('/admin-calculator', (req, res) => {
  res.render('admin-product-calculator')
})

router.get('/previous', (req, res) => {
  const previousPage = req.get('Referrer') || '/home/login';
  return res.redirect(previousPage);
})

module.exports = router;
