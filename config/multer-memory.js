// config/multer-memory.js
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    // tweak single field limits if needed; overall you'll do specific checks server-side
    fileSize: 1024 * 1024 * 1024 // generic limit (200MB) as an upper safety — video check will be enforced later
  }
});

module.exports = upload;