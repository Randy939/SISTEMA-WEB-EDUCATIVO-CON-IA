// routes/estudiante_Routes.js
const express = require("express");
const router = express.Router();
const studentController = require("../controllers/estudiante_Controller");
const { isAuthenticated } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Rutas para el estudiante
router.get("/dashboard", isAuthenticated, studentController.showDashboard);
router.get("/actividades", isAuthenticated, studentController.showActividades);
router.get(
  "/actividad/:id",
  isAuthenticated,
  studentController.showRealizarActividad,
);
router.post(
  "/actividad/:id/enviar",
  isAuthenticated,
  studentController.handleEnviarActividad,
);

router.get("/perfil", isAuthenticated, studentController.showPerfil);
router.post(
  "/perfil/actualizar-info",
  isAuthenticated,
  studentController.handleUpdateInfo,
);
router.post(
  "/perfil/actualizar-password",
  isAuthenticated,
  studentController.handleUpdatePassword,
);
router.post(
  "/perfil/actualizar-foto",
  isAuthenticated,
  upload.single("avatar"),
  studentController.handleUpdatePhoto,
);
router.post(
  "/perfil/eliminar-foto",
  isAuthenticated,
  studentController.handleDeletePhoto,
);

router.get(
  "/actividad/:id/resultados", // Nueva ruta
  isAuthenticated,
  studentController.showResultadosActividad,
);

module.exports = router;
