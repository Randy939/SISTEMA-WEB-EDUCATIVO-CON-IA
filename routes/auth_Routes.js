// Define todas las rutas relacionadas con la autenticación (login, logout, reseteo).

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth_Controller");

// --- Rutas de Login ---

// Muestra la página de login (formulario).
router.get("/login", authController.showLoginPage);

// Procesa los datos del formulario de login.
router.post("/login", authController.handleLogin);

// --- Rutas de Reseteo de Contraseña ---

// Muestra el formulario para solicitar el reseteo.
router.get("/contrasena_olvidada", authController.showForgotPasswordPage);

// Procesa el email para enviar el enlace de reseteo.
router.post("/contrasena_olvidada", authController.handleForgotPassword);

// Muestra el formulario para ingresar la nueva contraseña (valida el token).
router.get("/contrasena_resetear/:token", authController.showResetPasswordPage);

// Procesa y guarda la nueva contraseña.
router.post("/contrasena_resetear/:token", authController.handleResetPassword);

// --- Ruta de Logout ---

// Cierra la sesión del usuario (protegida con POST para CSRF).
router.post("/logout", authController.handleLogout);

// Exporta el router para ser usado en app.js.
module.exports = router;
