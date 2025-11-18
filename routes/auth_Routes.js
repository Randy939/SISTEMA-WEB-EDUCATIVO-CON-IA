// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth_Controller");

// --- Rutas de Login ---

// Muestra la página de login
// Ruta: GET /login
router.get("/login", authController.showLoginPage);

// Procesa los datos del formulario de login
// Ruta: POST /login
router.post("/login", authController.handleLogin);

router.get("/contrasena_olvidada", authController.showForgotPasswordPage);
router.post("/contrasena_olvidada", authController.handleForgotPassword);
router.get("/contrasena_resetear/:token", authController.showResetPasswordPage);
router.post("/contrasena_resetear/:token", authController.handleResetPassword);

// --- RUTA DE LOGOUT (NUEVA) ---
router.post("/logout", authController.handleLogout); // ¡Que sea POST, no GET!

module.exports = router;
