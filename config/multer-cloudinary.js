const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary.js');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    const isImage = file.mimetype.startsWith('image/');
    const isRaw = file.mimetype === 'application/pdf' || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed' || file.originalname.endsWith('.pdf') || file.originalname.endsWith('.zip');
    const folderName = req.productNumber;

    let resourceType = 'image';
    if(isVideo) resourceType = 'video';
    else if (isRaw) resourceType = 'raw';

    return {
      folder: `skyman/${folderName} || 'products'}`,
      resource_type: resourceType,
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

const uploadCloud = multer({storage});
module.exports = uploadCloud;

