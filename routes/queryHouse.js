const express = require('express')
const router = express.Router();
const queryhouseModel = require('../models/queryhouseModel');
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
const queryhouseStaffModel = require('../models/queryhouseStaffModel');
const queryhouseOwnerModel = require('../models/queryhouseOwnerModel');
const skymanProductModel = require('../models/skymanProductModel');
const userBayanaFormModel = require('../models/userBayanaFormModel');
const landbookerMoneyModel = require('../models/landbookerMoney');
const queryhouseMoneyModel = require('../models/queryhouseMoney');
const isAdminLoggedIn = require('../middlewares/isAdminLoggedIn')
const isAdminOrLandbookerLoggedIn = require('../middlewares/isAdminOrLandbookerLoggedIn');
const isQueryhouseStaffLoggedIn = require('../middlewares/isQueryHouseStaffLoggedIn');
const isQueryhouseOwnerLoggedIn = require('../middlewares/isQueryhouseOwnerLoggedIn');
const uploadDisk = require('../config/multer-disk-storage');
const bcrypt = require("bcrypt")
const crypto = require('crypto');
const slugify = require('slugify');
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


router.get('/queryhouse', (req, res) => {
  res.send('hey, this is coming from query house route')
})

router.get('/create', isAdminLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error')
  res.render('create-queryhouse-page', {success, error})
})

router.post('/created-query-house', isAdminLoggedIn, upload.fields([
  { name: 'ownerPic', maxCount: 1 },
  { name: 'contractPic', maxCount: 1 }
]), async (req, res) => {

  let ownerPic = req.files['ownerPic'][0].buffer;
  let contractPic = req.files['contractPic'][0].buffer;

  let { ownername, email, franchisepassword, ownerContact, queryhouseContact, ownerAddress, queryhouseAddress, city, tehsil, ownerContactForOtp, rent} = req.body;

  const queryhouseCity = city.toLowerCase().replace(' ', '');
  const queryhouseTehsil = tehsil.toLowerCase().replace(' ', '');

  let queryhouseSameEmail = await queryhouseModel.findOne({email});
  if (queryhouseSameEmail) {
    req.flash('error', 'Query house already registered through this email')
    return res.status(406).redirect('/landad/admin-panel2');
  } else {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(franchisepassword, salt, async (err, hash) => {
          const slug = slugify(`${ownername}-${tehsil}-${hash}`, {lower: true});

          let createdLandbooker = await queryhouseModel.create({
          ownerPic, contractPic, ownername, email, ownerContact, queryhouseContact, ownerAddress, queryhouseAddress, queryhouseCity, queryhouseTehsil, ownerContactForOtp, franchisepassword: hash, slug, rent
          });
          req.flash('success', 'Now you can login to continue to Landbook')
          res.redirect('/us/landbook');
      })
    })
  }
})

router.get('/edited-queryhouse/:queryhouseId', isAdminLoggedIn, async (req, res) => {
  try {
    const queryhouseId = req.params.queryhouseId;
    const queryhouse = await queryhouseModel.findOne({_id: queryhouseId});
    if(queryhouse.rent === false) {
      queryhouse.rent = true;
    } else if (queryhouse.rent === true) {
      queryhouse.rent = false
    }
    await queryhouse.save();

    req.flash('success', 'queryhouse rent edited successfully!')
    const previousPage = req.get('Referrer') || '/landad/login';
    return res.status(500).redirect(previousPage);
  } catch (error) {
    console.error('Error editing rent of queryhouse', error);
    const previousPage = req.get('Referrer') || '/landad/login';
    return res.status(500).redirect(previousPage);
  }
})

router.get('/franchise/owner/:slug', async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }
  const sellingForms = await sellingFormModel.find();
  // const contacterSellingForms = [];
  // if(sellingForms) {
  //   sellingForms.forEach((sellingForm) => {
  //     if(!sellingForm.khatauniSpecDetails) {
  //       contacterSellingForms.push(sellingForm);
  //     }
  //   })
  // }
  // const buyingForms = await buyingFormModel.find();
  // const products = await productModel.find();
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
  // const skymanProducts = await skymanProductModel.find();
  // const alreadyInskymanForms = product.claimedPeople.includes(user._id);.......
  const skymanForms = [];
  if(sellingForms) {
    sellingForms.forEach((sellingForm) => {
      if(sellingForm.khatauniSpecDetails && !sellingForm.skymanProductId.length > 0) {
        skymanForms.push(sellingForm);
      }
    })
  }
  const queryhouseSkymanForms = [];
  skymanForms.forEach((skymanForm) => {
    if(skymanForm.city === franchise.queryhouseTehsil) {
      queryhouseSkymanForms.push(skymanForm)
    }
  })

  // for user bayana forms notification
  const userBayanaForms = await userBayanaFormModel.find();
  const theQueryhouseUserBayanaForms = [];
  userBayanaForms.forEach((userBayanaForm) => {
    if(userBayanaForm.tehsil === franchise.queryhouseTehsil) {
      theQueryhouseUserBayanaForms.push(userBayanaForm);
    }
  })
  const queryhouseUserBayanaForms = [];
  theQueryhouseUserBayanaForms.forEach((userBayanaForm) => {
    if(!userBayanaForm.bayana) {
      queryhouseUserBayanaForms.push(userBayanaForm)
    } 
  })

  const success = req.flash('success');
  const error = req.flash('error');
  res.render('query-house-login-page', { success, error, queryhouseSkymanForms, queryhouseUserBayanaForms, franchise })
})

router.get('/franchise/owner/login/:slug', async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }
  const sellingForms = await sellingFormModel.find();
  // const contacterSellingForms = [];
  // if(sellingForms) {
  //   sellingForms.forEach((sellingForm) => {
  //     if(!sellingForm.khatauniSpecDetails) {
  //       contacterSellingForms.push(sellingForm);
  //     }
  //   })
  // }
  // const buyingForms = await buyingFormModel.find();
  // const products = await productModel.find();
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
  // const skymanProducts = await skymanProductModel.find();
  // const alreadyInskymanForms = product.claimedPeople.includes(user._id);
  const skymanForms = [];
  if(sellingForms) {
    sellingForms.forEach((sellingForm) => {
      if(sellingForm.khatauniSpecDetails && !sellingForm.skymanProductId.length > 0) {
        skymanForms.push(sellingForm);
      }
    })
  }
  const queryhouseSkymanForms = [];
  skymanForms.forEach((skymanForm) => {
    if(skymanForm.city === franchise.queryhouseTehsil) {
      queryhouseSkymanForms.push(skymanForm)
    }
  })

  // for user bayana forms notification
  const userBayanaForms = await userBayanaFormModel.find();
  const theQueryhouseUserBayanaForms = [];
  userBayanaForms.forEach((userBayanaForm) => {
    if(userBayanaForm.tehsil === franchise.queryhouseTehsil) {
      theQueryhouseUserBayanaForms.push(userBayanaForm);
    }
  })
  const queryhouseUserBayanaForms = [];
  theQueryhouseUserBayanaForms.forEach((userBayanaForm) => {
    if(!userBayanaForm.bayana) {
      queryhouseUserBayanaForms.push(userBayanaForm)
    } 
  })

  const success = req.flash('success');
  const error = req.flash('error');
  res.render('query-house-owner-login-page', { success, error, queryhouseUserBayanaForms, queryhouseSkymanForms, franchise })
})


router.get('/view-houses', isAdminLoggedIn, async (req, res) => {
  const queryhouses = await queryhouseModel.find();
  const success = req.flash('success')
  const error = req.flash('error')
  res.render('query-houses-view', {queryhouses, success, error})
})

router.get('/download-owner-image/:queryhouseId', isAdminLoggedIn, async (req, res) => {
  try {
    const {queryhouseId} = req.params;
    const queryhouse = await queryhouseModel.findOne({_id: queryhouseId});

    if(!queryhouse || !queryhouse.ownerPic) {
      req.flash('error', 'badnaam image not found')
      const previousPage = req.get('Referrer') || '/home/login';
      return res.redirect(previousPage);
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="queryhouseowner-${queryhouse.ownername}_${queryhouseId}.jpg"`);
    res.end(queryhouse.ownerPic);
  } catch (error) {
    console.error('Error downloading owner image:', error);
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  }
})

router.get('/download-contract-image/:queryhouseId', isAdminLoggedIn, async (req, res) => {
  try {
    const {queryhouseId} = req.params;
    const queryhouse = await queryhouseModel.findOne({_id: queryhouseId});

    if(!queryhouse || !queryhouse.contractPic) {
      req.flash('error', 'contract image not found')
      const previousPage = req.get('Referrer') || '/home/login';
      return res.redirect(previousPage);
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="queryhouseowner-${queryhouse.ownername}_${queryhouseId}.jpg"`);
    res.end(queryhouse.contractPic);
  } catch (error) {
    console.error('Error downloading owner image:', error);
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  }
})

router.post('/creating-query-house-staff/:slug', async (req, res) => {
  let {fullname, username, contactNumber, email, address, password} = req.body;
  const franchise = req.params.slug;
  const queryhouse = await queryhouseModel.findOne({slug: franchise});
  const city = queryhouse.queryhouseCity;
  const tehsil = queryhouse.queryhouseTehsil;
  const ownerContactForOtp = queryhouse.ownerContact;
  const owner = queryhouse.ownername;

  let landbookersSameEmail = await queryhouseStaffModel.findOne({email});
  let landbookersSameUsername = await queryhouseStaffModel.findOne({username});
  if(landbookersSameUsername) {
    req.flash('error', 'Staff already registered through this username')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(406).redirect(previousPage);
  }
  else if (landbookersSameEmail) {
    req.flash('error', 'User already registered through this email')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(406).redirect(previousPage);
  } else {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        let createdLandbooker = await queryhouseStaffModel.create({
        fullname,
        username,
        contactNumber,
        email,
        address,
        city,
        tehsil,
        owner,
        ownerContactForOtp,
        password: hash
        });
        req.flash('success', 'Now you can login to continue to Landbook')
        const previousPage = req.get('Referrer') || '/home/login';
        return res.status(406).redirect(previousPage);
      })

    })
  }
})

router.post('/creating-query-house-owner/:slug', async (req, res) => {
  try {
    let {name, username, contactNumber, email, address, password} = req.body;
    const franchise = req.params.slug;
    const queryhouse = await queryhouseModel.findOne({slug: franchise});
    const ownerContactForOtp = queryhouse.ownerContact;
    const city = queryhouse.queryhouseCity;
    const tehsil = queryhouse.queryhouseTehsil;
    let owners = await queryhouseOwnerModel.find();
    if(owners.length > 0) {
      return res
        .status(500)
        .send(`you don't have permissions to create owner`);
    }
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if(err) {
          return res.send(err.message)
        } else{
          let owner = await queryhouseOwnerModel.create({
            name,
            username,
            contactNumber,
            ownerContactForOtp,
            email,
            address,
            city,
            tehsil,
            password: hash
          })
          req.flash('success', 'Query house owner can now log in!')
          const previousPage = req.get('Referrer') || '/home/login';
          return res.status(406).redirect(previousPage);
        }
  
      })
    });

  } catch (error) {
    req.flash('error', `${error.message}`)
    log(error)
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(406).redirect(previousPage);
  }
})

router.post('/query-house-staff-logging-in/:slug', async (req, res) => {
  let {username, password} = req.body;
  let landbooker = await queryhouseStaffModel.findOne({username})
  if(!landbooker) {
    req.flash('error', 'Username or password is incorrect')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(404).redirect(previousPage);
  } else{
    if(landbooker.banned) {
      req.flash('error', `Sorry ${landbooker.fullname}, You are banned from Landbook by your queryhouse owner: "${landbooker.banReason}"- reason given by your queryhouse owner. Contact Your queryhouse owner for query. `)
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(400).redirect(previousPage);
    }
    bcrypt.compare(password, landbooker.password, (err, result) => {
      if(err) return res.status(406).send('something went wrong')
        if(result === true) {

          let token = jwt.sign({email: landbooker.email, id: landbooker._id}, process.env.SKF_SKF);
          res.cookie('landbookQueryhouseStaffs', token);

          req.flash('success', 'You are logged in!')
          const previousPage = req.get('Referrer') || '/home/login';
          return res.redirect(previousPage);
        } else{
          req.flash('error', 'Username or password is incorrect')
          const previousPage = req.get('Referrer') || '/home/login';
          return res.redirect(previousPage);
        }
    })
  }

})

router.post('/query-house-owner-logging-in/:slug', async (req, res) => {
  let {username, password} = req.body;
  let owner = await queryhouseOwnerModel.findOne({username})
  if(!owner) {
    req.flash('error', 'Username or password is incorrect')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(404).redirect(previousPage);
  } else{
    if(owner.banned) {
      req.flash('error', `Sorry ${owner.fullname}, You are banned from Landbook: ${owner.banReason}. Contact Landbook down below for query. `)
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(400).redirect(previousPage);
    }
    bcrypt.compare(password, owner.password, (err, result) => {
      if(err) return res.status(406).send('something went wrong')
        if(result === true) {

          let token = jwt.sign({email: owner.email, id: owner._id}, process.env.SKF_SKF);
          res.cookie('landbookQueryhouseOwner', token);

          req.flash('success', 'You are logged in!')
          const previousPage = req.get('Referrer') || '/home/login';
          return res.redirect(previousPage);
        } else{
          req.flash('error', 'Username or password is incorrect')
          const previousPage = req.get('Referrer') || '/home/login';
          return res.redirect(previousPage);
        }
    })
  }

})

router.get('/logout-query-house-staff/:slug', (req, res) => {
  if(req.cookies.landbookQueryhouseStaffs === '') {
    req.flash('error', 'You need to be logged in first')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  }
  res.cookie('landbookQueryhouseStaffs', '')
  req.flash('success', 'You are logged out!')
  const previousPage = req.get('Referrer') || '/home/login';
  return res.redirect(previousPage);
})

router.get('/logout-query-house-owner/:slug', (req, res) => {
  if(req.cookies.landbookQueryhouseOwner === '') {
    req.flash('error', 'You need to be logged in first')
    const previousPage = req.get('Referrer') || '/home/login';
    return res.redirect(previousPage);
  }
  res.cookie('landbookQueryhouseOwner', '')
  req.flash('success', 'You are logged out!')
  const previousPage = req.get('Referrer') || '/home/login';
  return res.redirect(previousPage);
})

router.get('/query-house-panel/:slug', async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug})
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }

  const buyingForms = await buyingFormModel.find();
  const products = await productModel.find();
  // for map marker id creation notification

  const userBayanaForms = await userBayanaFormModel.find();
  const theQueryhouseUserBayanaForms = [];
  userBayanaForms.forEach((userBayanaForm) => {
    if(userBayanaForm.tehsil === franchise.queryhouseTehsil) {
      theQueryhouseUserBayanaForms.push(userBayanaForm);
    }
  })
  const queryhouseUserBayanaForms = [];
  theQueryhouseUserBayanaForms.forEach((userBayanaForm) => {
    if(!userBayanaForm.bayana) {
      queryhouseUserBayanaForms.push(userBayanaForm)
    } 
  })

  const success = req.flash('success');
  const error = req.flash('error');
  res.render('query-house-staff-panel-page', {success, error, queryhouseUserBayanaForms, buyingForms, franchise, queryhouseStaff: req.cookies.landbookQueryhouseOwner, queryhouse: req.cookies.landbookQueryhouseStaffs})
})
router.get('/query-house-owner-panel/:slug', async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug})
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }

  const buyingForms = await buyingFormModel.find();
  const products = await productModel.find();
  // for map marker id creation notification

  const userBayanaForms = await userBayanaFormModel.find();
  const theQueryhouseUserBayanaForms = [];
  userBayanaForms.forEach((userBayanaForm) => {
    if(userBayanaForm.tehsil === franchise.queryhouseTehsil) {
      theQueryhouseUserBayanaForms.push(userBayanaForm);
    }
  })
  const queryhouseUserBayanaForms = [];
  theQueryhouseUserBayanaForms.forEach((userBayanaForm) => {
    if(!userBayanaForm.bayana) {
      queryhouseUserBayanaForms.push(userBayanaForm)
    } 
  })


  const success = req.flash('success');
  const error = req.flash('error');
  res.render('query-house-owner-panel-page', {success, error, queryhouseUserBayanaForms, buyingForms, franchise, queryhouseStaff: req.cookies.landbookQueryhouseOwner, queryhouse: req.cookies.landbookQueryhouseStaffs})
})

router.get('/all-queryhouse-products/:slug', isQueryhouseStaffLoggedIn, async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const products = await productModel.find();
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }
  const queryhouseProducts = [];
  products.forEach((product) => {
    if (product.tehsil === franchise.queryhouseTehsil) {
      queryhouseProducts.push(product)
    }
  })
  res.render('queryhouse-products-page', {queryhouseProducts, franchise, success, error, landbookers: req.cookies.ownerLandbook})
})

router.get('/query-house-skyman-panel/:slug', isQueryhouseStaffLoggedIn, async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }
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
  const queryhouseSkymanForms = [];
  skymanForms.forEach((skymanForm) => {
    if(skymanForm.city === franchise.queryhouseTehsil) {
      queryhouseSkymanForms.push(skymanForm)
    }
  })

  res.render('query-house-skyman-panel-page', {req, res, success, error, queryhouseSkymanForms, franchise})
})

router.get('/create-skyman-products/:formId/:slug', isQueryhouseStaffLoggedIn, async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug})
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }
  const skymanFormId = req.params.formId;
  const skymanProduct = await sellingFormModel.findOne({_id: skymanFormId})
  if(skymanProduct.skymanProductId.length > 0) {
    req.flash('error', 'Product already uploaded by Skyman! If the skyman product needs to corrected somewhere, contact modifier @9140362143 for query.');
    const previousPage = req.get('Referrer') || '/us/landbook';
    return res.redirect(previousPage);
  }
  const success = req.flash('success');
  const error = req.flash('error');
  res.render('query-house-create-skyman-products-page', {success, error, skymanProduct, franchise})
})

router.post('/skyman/created-product/:slug', isQueryhouseStaffLoggedIn, uploadDisk.fields([
  { name: 'realImage', maxCount: 1 },
  { name: 'mainRoadImages', maxCount: 10 },
  { name: 'image360', maxCount: 1 },
  { name: 'khatauniFile', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 }
]), isQueryhouseStaffLoggedIn, async (req, res) => {
  try {
    const franchise = await queryhouseModel.findOne({slug: req.params.slug});
    if(!franchise) {
      return res.status(404).send('Franchise not found');
    }
    const {tehsil, productFolderName, badnaamSpec, lat, lng, sellerPrice, LB, spec, sellerId, sellingFormId, contactNumber, khatauniSpecDetails} = req.body;
    const sellerIdFromForm = sellerId.trim();
    const sellingFormIdFromForm = sellingFormId.trim();
    const realTehsil = tehsil.toLowerCase().replace(' ', '');
    const specArray = spec.split('\n').map(item => item.trim()).filter(item => item);

    const folderName = req.body.productFolderName;

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
      tehsil: realTehsil, badnaamSpec, lat, lng, sellerPrice, LB, productFolderName, spec: specArray, sellerId: sellerIdFromForm, sellingFormId: sellingFormIdFromForm,  contactNumber, khatauniSpecDetails
    });
    await sellingFormModel.findByIdAndUpdate(
      sellingFormIdFromForm,
      { $push: { skymanProductId: newSkymanProduct._id } }
    );

    req.flash('success', 'Product successfully uploaded by Skyman!');
    res.redirect(`/landbook-query-house/query-house-skyman-panel/${franchise.slug}`);
  } catch (err) {
    console.error(err);
    req.flash('error', err.message);
    res.redirect(`/landbook-query-house/query-house-skyman-panel/${franchise.slug}`);
  }
});

router.get('/query-house-buying-forms/:slug', isQueryhouseStaffLoggedIn, async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }
  const buyingForms = await buyingFormModel.find();
  const queryhouseBuyingForms = [];
  buyingForms.forEach((buyingForm) => {
    if(buyingForm.tehsil === franchise.queryhouseTehsil) {
      queryhouseBuyingForms.push(buyingForm)
    }
  });

  const error = req.flash('error')
  const success = req.flash('success')

  res.render('query-house-buying-forms-page', {queryhouseBuyingForms, error, success, franchise});
  // log(populatedBuyingForms);
})

router.get('/user-bayana-forms/:slug', isQueryhouseStaffLoggedIn, async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});
  if(!franchise) {
    return res.status(404).send('Franchise not found');
  }
  const userBayanaForms = await userBayanaFormModel.find()
    .populate('buyingFormId')
    .populate('user')
    .populate('productId')
    .populate('buyingCartTimerId')
    .populate('productSeller');
  const queryhouseUserBayanaForms = [];
  userBayanaForms.forEach((userBayanaForm) => {
    if(userBayanaForm.tehsil === franchise.queryhouseTehsil) {
      queryhouseUserBayanaForms.push(userBayanaForm);
    }
  })
  const success = req.flash('success');
  const error = req.flash('error');

  res.render('queryhouse-user-bayana-forms', {queryhouseUserBayanaForms, success, error, landbookers: req.cookies.ownerLandbook, franchise});
})

router.post('/fill-bayana-by-query-house/:bayanaId', isQueryhouseStaffLoggedIn, upload.fields([
  { name: 'bayana', maxCount: 1 }
]), async (req, res) => {
  const landbooker = req.landbooker;
  const bayanaFormId = req.params.bayanaId;
  const userBayana = await userBayanaFormModel.findOne({_id: bayanaFormId})
    .populate('queryhouse')
    .populate('productId');
  const product = userBayana.productId[0];
  // if(product.bayana.length > 0) {
  //   req.flash('error', 'Bayana uploaded already. Product is in deleting process!')
  //   const previousPage = req.get('Referrer') || '/home/login';
  //   return res.redirect(previousPage);
  // }
  if(userBayana.length > 0) {
    userBayana.forEach((userBayan) => {
      if(userBayan.bayana) {
        req.flash('error', 'Bayana uploaded already. Product is in deleting process!')
        const previousPage = req.get('Referrer') || '/home/login';
        return res.redirect(previousPage);
      }
    })
  }
  let landbookPrice = product.landbookPrice * 100000;
  const queryhouse = userBayana.queryhouse;
  let bayana = req.files['bayana'][0].buffer;

  // await userBayanaFormModel.findByIdAndUpdate(
  //   bayanaFormId,
  //   { bayana: bayana }
  // );

  // for money starts
  if(!queryhouse.length > 0) {
    if(!landbooker) {
      return res.send('Sorry, admin cannot fill bayana!')
    }
    await userBayanaFormModel.findByIdAndUpdate(
      bayanaFormId,
      { bayana: bayana }
    );
    const newLandbookerMoneyModel = await landbookerMoneyModel.create({
      money: landbookPrice * 0.023,
      city: userBayana.city,
      tehsil: userBayana.tehsil,
      bayana: bayana
    })
    newLandbookerMoneyModel.productId.push(userBayana.productId[0]);
    newLandbookerMoneyModel.user.push(userBayana.user[0]);
    newLandbookerMoneyModel.landbooker.push(landbooker._id);
    await newLandbookerMoneyModel.save();
  } else {

    await userBayanaFormModel.findByIdAndUpdate(
      bayanaFormId,
      { bayana: bayana }
    );
    const queryhouseStaff = req.queryhouseStaff;
    const queryhouseOwner = req.queryhouseOwner
    if(queryhouse.rent) {
      // if queryhouse staff logged in or owner of queryhouse
      if(queryhouseStaff) {
        const newQueryhouseMoneyModel = await queryhouseMoneyModel.create({
        money: (landbookPrice * 0.023).toFixed(2),
        landbookMoney: (landbookPrice * 0.00782).toFixed(2),
        queryhouseMoney: ((landbookPrice * 0.023) - (landbookPrice * 0.00782)).toFixed(2),
        city: userBayana.city,
        tehsil: userBayana.tehsil,
        bayana: bayana
        })
        newQueryhouseMoneyModel.productId.push(userBayana.productId[0]);
        newQueryhouseMoneyModel.user.push(userBayana.user[0]);
        newQueryhouseMoneyModel.queryhouse.push(queryhouse._id);
        newQueryhouseMoneyModel.queryhouseStaff.push(queryhouseStaff._id);
        newQueryhouseMoneyModel.renting = true;
        await newQueryhouseMoneyModel.save();
      } else {
        const newQueryhouseMoneyModel = await queryhouseMoneyModel.create({
        money: (landbookPrice * 0.023).toFixed(2),
        landbookMoney: (landbookPrice * 0.00782).toFixed(2),
        queryhouseMoney: ((landbookPrice * 0.023) - (landbookPrice * 0.00782)).toFixed(2),
        city: userBayana.city,
        tehsil: userBayana.tehsil,
        bayana: bayana
        })
        newQueryhouseMoneyModel.productId.push(userBayana.productId[0]);
        newQueryhouseMoneyModel.user.push(userBayana.user[0]);
        newQueryhouseMoneyModel.queryhouse.push(queryhouse._id);
        newQueryhouseMoneyModel.queryhouseStaff.push(queryhouseOwner._id);
        newQueryhouseMoneyModel.renting = true;
        await newQueryhouseMoneyModel.save();
      }
    } else {
      // if queryhouse staff logged in or owner of queryhouse
      if(queryhouseStaff) {
        const newQueryhouseMoneyModel = await queryhouseMoneyModel.create({
        money: (landbookPrice * 0.023).toFixed(2),
        landbookMoney: (landbookPrice * 0.0069).toFixed(2),
        queryhouseMoney: ((landbookPrice * 0.023) - (landbookPrice * 0.0069)).toFixed(2),
        city: userBayana.city,
        tehsil: userBayana.tehsil,
        bayana: bayana
        })
        newQueryhouseMoneyModel.productId.push(userBayana.productId[0]);
        newQueryhouseMoneyModel.user.push(userBayana.user[0]);
        newQueryhouseMoneyModel.queryhouse.push(queryhouse._id);
        newQueryhouseMoneyModel.queryhouseStaff.push(queryhouseStaff._id);
        newQueryhouseMoneyModel.renting = false;
        await newQueryhouseMoneyModel.save();
      } else {
        const newQueryhouseMoneyModel = await queryhouseMoneyModel.create({
        money: (landbookPrice * 0.023).toFixed(2),
        landbookMoney: (landbookPrice * 0.0069).toFixed(2),
        queryhouseMoney: ((landbookPrice * 0.023) - (landbookPrice * 0.0069)).toFixed(2),
        city: userBayana.city,
        tehsil: userBayana.tehsil,
        bayana: bayana
        })
        newQueryhouseMoneyModel.productId.push(userBayana.productId[0]);
        newQueryhouseMoneyModel.user.push(userBayana.user[0]);
        newQueryhouseMoneyModel.queryhouse.push(queryhouse._id);
        newQueryhouseMoneyModel.queryhouseStaff.push(queryhouseOwner._id);
        newQueryhouseMoneyModel.renting = false;
        await newQueryhouseMoneyModel.save();
      }
    }
  }
  // for money ends

  req.flash('success', 'Bayana uploaded successfully!')
  const previousPage = req.get('Referrer') || '/home/login';
  return res.redirect(previousPage);
})

router.get('/owner/queryhouse-staffs/:slug', isQueryhouseStaffLoggedIn, async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});
  if(!franchise) {
    res.send('franchise not found.')
  }
  const theQueryhouseStaffs = await queryhouseStaffModel.find();
  const queryhouseStaffs = [];
  theQueryhouseStaffs.forEach((queryhouseStaff) => {
    if(queryhouseStaff.tehsil === franchise.queryhouseTehsil) {
      queryhouseStaffs.push(queryhouseStaff);
    }
  })
  const error = req.flash("error");
  const success = req.flash('success');

  res.render('queryhouse-admin-staffs', {queryhouseStaffs, franchise, success, error})
})

router.get('/owner/delete-queryhouse-staff/:staffId', isQueryhouseOwnerLoggedIn, async (req, res) => {
  try {
    const staffId = req.params.staffId;
    const deletedStaff = await queryhouseStaffModel.findOneAndDelete({_id: staffId});
    res.cookie('landbookQueryhouseStaffs', '')
    req.flash('success', `Query house staff ${deletedStaff.fullname} is deleted successfully!`)
    const previousPage = req.get('Referrer') || '/home/login';
    return res.status(500).redirect(previousPage);
  } catch (error) {
      req.flash('error', `${error.message}`)
      log(error);
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(500).redirect(previousPage);
  }
})
router.get('/owner/ban-queryhouse-staff/:staffId/:slug', isQueryhouseOwnerLoggedIn, async (req, res) => {
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});
  if(!franchise) {
    res.send('franchise not found.')
  }
  const staffId = req.params.staffId;
  const staff = await queryhouseStaffModel.findOne({_id: staffId});

  const success = req.flash('success');
  const error = req.flash('error');

  res.render('ban-queryhouse-staff', {staff, success, error, franchise});
})
router.post('/banning-queryhouse-staff/:slug', isQueryhouseOwnerLoggedIn, async (req, res) => {
  const {username, email, contactNumber, id, reason} = req.body;

  try {
    const franchise = await queryhouseModel.findOne({slug: req.params.slug});
    const staff = await queryhouseStaffModel.findOne({_id: id});

    if(!staff) return res.status(404).send('Staff not found');
    staff.banned = true;
    staff.banReason = reason || 'No reason provided';
    await staff.save();
    res.cookie('landbookQueryhouseStaffs', '')
  
    req.flash('error', `User ${staff.username} has been banned.`);
    res.redirect(`/landbook-query-house/owner/queryhouse-staffs/${franchise.slug}`);
  } catch (err) {
    req.flash('error', `${err.message}`)
    log(err)
    res.redirect(`/landbook-query-house/owner/queryhouse-staffs/${franchise.slug}`)
  }
})
router.get('/owner/unban-queryhouse-staff/:staffId', isQueryhouseOwnerLoggedIn, async (req, res) => {
  try {
    const staffId = req.params.staffId;
    const staff = await queryhouseStaffModel.findOne({_id: staffId});
  
    if(staff.banned === true) {
      staff.banned = false;
      staff.banReason = '';
      await staff.save();
      req.flash('success', `staff ${staff.username} un-banned successfully!`);
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(404).redirect(previousPage);
    } else {
      req.flash('error', 'staff already not banned!');
      const previousPage = req.get('Referrer') || '/home/login';
      return res.status(404).redirect(previousPage);
    }
  } catch (error) {
    req.flash('error', `${error.message}`)
    return res.redirect('/landad/find-users')
  }
})

router.get('/admin/queryhouse-dues/:slug', isQueryhouseOwnerLoggedIn, async (req, res) => {
  try {
    
    const franchise = await queryhouseModel.findOne({slug: req.params.slug});
    if(!franchise) {
      res.send('franchise not found.')
    }
    const success = req.flash('success');
    const error = req.flash('error');
    const theQueryhouseMoneys = await queryhouseMoneyModel.find()
      .populate('user')
      .populate('productId')
      .populate('queryhouse')
      .populate('queryhouseStaff');
    const queryhouseMoneys = [];
    theQueryhouseMoneys.forEach((queryhouseMoney) => {
      if(queryhouseMoney.tehsil === franchise.queryhouseTehsil) {
        queryhouseMoneys.push(queryhouseMoney);
      }
    })

    res.render('queryhouse-dues', {success, error, queryhouseMoneys, franchise})

  } catch (error) {
    console.error('Error editing rent of queryhouse', error);
    const previousPage = req.get('Referrer') || '/landad/login';
    return res.status(500).redirect(previousPage);
  }
})

router.post('/admin/deleting-bayana-forms/:formId', async(req, res) => {
  try {
    const bayanaFormId = req.params.formId;
    const userBayanaForm = await userBayanaFormModel.findOne({_id: bayanaFormId});

    await userModel.updateMany(
      { bayana: bayanaFormId },
      { $pull: {bayana: bayanaFormId} }
    );
    await productModel.updateMany(
      { bayana: bayanaFormId },
      { $pull: {bayana: bayanaFormId} }
    );
    const deletedUserBayanaForm = await userBayanaFormModel.findByIdAndDelete(bayanaFormId);
    res.send(200);
    
  } catch (error) {
    console.error(err);
    res.status(500).send('Error moving product');
  }
})

router.get('/queryhouse-calculated-price/:productId/:slug', async (req, res) => {
  const success = req.flash('success');
  const error = req.flash('error');
  const productId = req.params.productId;
  const product = await productModel.findOne({_id: productId})
    .populate('seller')
  const franchise = await queryhouseModel.findOne({slug: req.params.slug});

  res.render('queryhouse-calculated-pricing-page', {product, success, error, franchise});
})

module.exports = router;