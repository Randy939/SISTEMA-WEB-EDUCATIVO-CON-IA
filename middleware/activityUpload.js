// middleware/activityUpload.js
const multer = require("multer");
const path = require("node:path");
const crypto = require("node:crypto"); // Para generar nombres únicos

// 1. Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/actividades/"); // ¡Una nueva carpeta!
  },
  // Usamos un nombre aleatorio para evitar colisiones
  filename: function (req, file, cb) {
    const randomName = crypto.randomBytes(16).toString("hex");
    const extension = path.extname(file.originalname);
    cb(null, `${randomName}${extension}`);
  },
});

// 2. Filtro de archivos (igual que el de perfil)
const fileFilter = (req, file, cb) => {
  const mimetypes = ["image/jpeg", "image/png", "image/gif"];
  if (mimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Error: El archivo no es una imagen válida."), false);
  }
};

// 3. Inicializar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});

module.exports = upload;
