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

// --- Rutas de Registro ---

// Muestra la página de registro
// Ruta: GET /registro
router.get("/registro", authController.showRegisterPage);

// Procesa los datos del formulario de registro
// Ruta: POST /registro
router.post("/registro", authController.handleRegister);

// --- RUTA DE LOGOUT (NUEVA) ---
router.get("/logout", authController.handleLogout);

module.exports = router;
