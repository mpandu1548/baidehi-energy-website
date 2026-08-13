const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const destination = path.join(process.cwd(), 'media', req.uploadFolder);
    require('fs').mkdirSync(destination, { recursive: true });
    callback(null, destination);
  },
  filename(req, file, callback) {
    callback(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE || 5242880) },
  fileFilter(req, file, callback) {
    callback(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype));
  },
});

const newsUpload = multer({
  storage,
  limits: { fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE || 5242880) },
  fileFilter(req, file, callback) {
    const isImage = file.fieldname === 'image' && /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    const isDocument = file.fieldname === 'attachment'
      && /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/.test(file.mimetype);
    callback(null, isImage || isDocument);
  },
});

function uploadTo(folder) {
  return (req, res, next) => {
    req.uploadFolder = folder;
    imageUpload.single('image')(req, res, next);
  };
}

function uploadManyTo(folder, maximum = 20) {
  return (req, res, next) => {
    req.uploadFolder = folder;
    imageUpload.array('images', maximum)(req, res, next);
  };
}

function uploadNewsAssets(req, res, next) {
  req.uploadFolder = 'news';
  newsUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachment', maxCount: 1 }])(req, res, next);
}

module.exports = { uploadTo, uploadManyTo, uploadNewsAssets };
