import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory name (ES module version of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the upload directory based on route
    let uploadDir;
    
    if (req.originalUrl.includes('events')) {
      uploadDir = path.join(__dirname, '..', 'uploads', 'events');
    } else if (req.originalUrl.includes('camping-equipment')) {
      uploadDir = path.join(__dirname, '..', 'uploads', 'equipment');
    } else {
      uploadDir = path.join(__dirname, '..', 'uploads');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Created directory: ${uploadDir}`);
      } catch (err) {
        console.error(`Error creating directory ${uploadDir}:`, err);
      }
    }
    
    console.log(`File will be uploaded to: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const originalName = file.originalname.replace(/\s+/g, '-'); // Replace spaces with hyphens
    const ext = path.extname(originalName);
    const newFilename = `${path.basename(originalName, ext)}-${uniqueSuffix}${ext}`;
    console.log(`Generated filename: ${newFilename}`);
    cb(null, newFilename);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/i;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  console.log(`Validating file: ${file.originalname}, mimetype: ${file.mimetype}`);
  console.log(`Valid extension: ${extname}, valid mimetype: ${mimetype}`);

  if (extname && mimetype) {
    console.log('File accepted:', file.originalname);
    return cb(null, true);
  } else {
    console.log('File rejected:', file.originalname);
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer with error handling
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Export a wrapper function to handle errors
export default upload;
