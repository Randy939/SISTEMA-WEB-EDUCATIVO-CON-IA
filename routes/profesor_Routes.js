// routes/Profesor_Routes.js
const express = require("express");
const router = express.Router();
const profesorController = require("../controllers/profesor_Controller");

// Importamos nuestros "guardias"
const {
  isAuthenticated,
  isProfessor,
} = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const activityUpload = require("../middleware/activityUpload");

// Usamos [isAuthenticated, isProfessor] como una cadena de middlewares
router.get(
  "/profesor/dashboard",
  [isAuthenticated, isProfessor],
  profesorController.showDashboard,
);
router.get(
  "/profesor/estudiantes",
  [isAuthenticated, isProfessor],
  profesorController.showEstudiantes,
);
router.post(
  "/profesor/estudiantes/crear",
  [isAuthenticated, isProfessor],
  profesorController.handleCrearEstudiante,
);
router.get(
  "/profesor/estudiantes/editar/:id",
  [isAuthenticated, isProfessor],
  profesorController.showEditarEstudiante,
);
router.post(
  "/profesor/estudiantes/editar/:id",
  [isAuthenticated, isProfessor],
  profesorController.handleEditarEstudiante,
);
router.post(
  "/profesor/estudiantes/reset-password",
  [isAuthenticated, isProfessor],
  profesorController.handleResetPassword,
);
router.post(
  "/profesor/estudiantes/eliminar",
  [isAuthenticated, isProfessor],
  profesorController.handleEliminarEstudiante,
);

router.get(
  "/profesor/actividades",
  [isAuthenticated, isProfessor],
  profesorController.showActividades,
);
router.get(
  "/profesor/actividades/crear",
  [isAuthenticated, isProfessor],
  profesorController.showCrearActividadPage,
);
router.post(
  "/profesor/actividades/crear",
  [isAuthenticated, isProfessor],
  activityUpload.single("imagen"),
  profesorController.handleCrearActividad,
);
router.get(
  "/profesor/actividades/editar/:id",
  [isAuthenticated, isProfessor],
  profesorController.showEditarActividad,
);
router.post(
  "/profesor/actividades/editar/:id",
  [isAuthenticated, isProfessor],
  activityUpload.single("imagen"),
  profesorController.handleEditarActividad,
);
router.post(
  "/profesor/actividades/eliminar",
  [isAuthenticated, isProfessor],
  profesorController.handleEliminarActividad,
);

router.get(
  "/profesor/reportes",
  [isAuthenticated, isProfessor],
  profesorController.showReportes,
);
router.get(
  "/profesor/perfil",
  [isAuthenticated, isProfessor],
  profesorController.showPerfil,
);
router.post(
  "/profesor/perfil/actualizar-info",
  [isAuthenticated, isProfessor],
  profesorController.handleUpdateInfo,
);
router.post(
  "/profesor/perfil/actualizar-password",
  [isAuthenticated, isProfessor],
  profesorController.handleUpdatePassword,
);
router.post(
  "/profesor/perfil/actualizar-foto",
  [isAuthenticated, isProfessor],
  upload.single("avatar"),
  profesorController.handleUpdatePhoto,
);
router.post(
  "/profesor/perfil/eliminar-foto",
  [isAuthenticated, isProfessor],
  profesorController.handleDeletePhoto,
);

module.exports = router;
