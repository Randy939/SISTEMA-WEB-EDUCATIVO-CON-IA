// middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("node:path");

// 1. Configuración de almacenamiento
const storage = multer.diskStorage({
  // Dónde guardar los archivos
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  // Cómo nombrar el archivo (usamos el ID de usuario + extensión)
  filename: function (req, file, cb) {
    const userId = req.session.user.id;
    const extension = path.extname(file.originalname);
    cb(null, `${userId}${extension}`);
  },
});

// 2. Filtro de archivos (para aceptar solo imágenes)
const fileFilter = (req, file, cb) => {
  const mimetypes = ["image/jpeg", "image/png", "image/gif"];

  if (mimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Error: El archivo no es una imagen válida."), false);
  }
};

// 3. Inicializar multer con nuestra configuración
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Límite de 5MB
});

module.exports = upload;
