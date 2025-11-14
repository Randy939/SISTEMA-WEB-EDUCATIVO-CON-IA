// ===================================================
// CONTROLADOR DE AUTENTICACIÓN (auth_Controller.js)
// ===================================================

// --- 1. Importaciones ---
const path = require("node:path");
const bcrypt = require("bcrypt");
const User = require("../models/Usuario"); // Importa el modelo de Usuario

// ===================================================
// --- 2. Lógica de REGISTRO ---
// ===================================================

/**
 * Muestra la página de registro.
 * Si el usuario ya está logueado, lo redirige a su dashboard.
 */
exports.showRegisterPage = (req, res) => {
  // Comprueba si ya existe una sesión activa
  if (req.session.user) {
    console.log("Usuario ya logueado, redirigiendo a dashboard...");
    // Redirige al dashboard correspondiente según el rol
    return res.redirect(
      req.session.user.role === "profesor"
        ? "/profesor/dashboard"
        : "/dashboard",
    );
  }
  // Si no hay sesión, muestra la página de registro
  res.sendFile(path.join(__dirname, "../views/registro.html"));
};

/**
 * Procesa los datos del formulario de registro.
 * Crea un nuevo usuario en la base de datos.
 */
exports.handleRegister = async (req, res) => {
  try {
    const { nombre, email, password, role } = req.body;

    // Verifica si ya existe un usuario con ese email
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      console.log("Intento de registro fallido: Email ya existe.");
      return res.redirect("/registro"); // Idealmente, con un mensaje de error
    }

    // Encripta la contraseña antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crea la nueva instancia del usuario
    const newUser = new User({
      nombre: nombre,
      email: email,
      password: hashedPassword,
      role: role, // 'estudiante' o 'profesor'
    });

    // Guarda el usuario en la BD
    await newUser.save();
    console.log("Nuevo usuario registrado:", email);
    res.redirect("/login"); // Redirige al login tras registro exitoso
  } catch (error) {
    console.error("Error en el registro:", error);
    res.redirect("/registro");
  }
};

// ===================================================
// --- 3. Lógica de LOGIN ---
// ===================================================

/**
 * Muestra la página de inicio de sesión (login).
 * Si el usuario ya está logueado, lo redirige a su dashboard.
 */
exports.showLoginPage = (req, res) => {
  // Comprueba si ya existe una sesión activa
  if (req.session.user) {
    console.log("Usuario ya logueado, redirigiendo a dashboard...");
    return res.redirect(
      req.session.user.role === "profesor"
        ? "/profesor/dashboard"
        : "/dashboard",
    );
  }

  // --- LÓGICA FLASH ---
  // 1. Lee el mensaje de error de la sesión (si existe)
  const errorMessage = req.session.errorMessage;

  // 2. Borra el mensaje de la sesión para que no se muestre de nuevo
  delete req.session.errorMessage;

  // 3. Renderiza la plantilla EJS, pasándole el mensaje
  //    (Si no hay mensaje, 'errorMessage' será 'undefined' y el EJS no mostrará nada)
  res.render("login", { errorMessage });
};

/**
 * Función auxiliar para validar credenciales (sin cambios)
 */
const validateCredentials = async (req, email, password) => {
  // 1. Campos obligatorios
  if (!email || !password) {
    console.log(`Fallo de login: Campos vacíos recibidos. IP: [${req.ip}]`);
    return { isValid: false };
  }

  // 2. Validación de Longitud Máxima
  if (email.length > 254) {
    console.log(
      `Fallo de login: Email excede la longitud máxima. IP: [${req.ip}]`,
    );
    return { isValid: false };
  }
  if (password.length > 128) {
    console.log(
      `Fallo de login: Contraseña excede la longitud máxima. IP: [${req.ip}]`,
    );
    return { isValid: false };
  }

  // 3. Validación de Formato de Email (Regex)
  const emailRegex = new RegExp(
    "^[a-zA-Z0-9._%+\\-]+@ucvvirtual\\.edu\\.pe$",
    "i",
  );

  if (!emailRegex.test(email)) {
    console.log(
      `Fallo de login: El email "${email}" no tiene un formato institucional válido. IP: [${req.ip}]`,
    );
    return { isValid: false };
  }

  // 4. Búsqueda de usuario
  const user = await User.findOne({ email: email });
  if (!user) {
    console.log(
      `Fallo de login: Usuario no encontrado ("${email}"). IP: [${req.ip}]`,
    );
    return { isValid: false };
  }

  return { isValid: true, user };
};

/**
 * Función auxiliar para crear la sesión (sin cambios)
 */
const createUserSession = (req, user, remember) => {
  // ... (Esta función auxiliar no cambia, déjala como estaba)
  if (remember) {
    const CATORCE_DIAS_MS = 4 * 60 * 60 * 1000;
    req.session.cookie.maxAge = CATORCE_DIAS_MS;
    console.log('Sesión configurada para "recordar" por 4 horas.');
  } else {
    // EL USUARIO NO MARCÓ "Recordar Sesión"
    // Le damos una sesión corta que expira por inactividad.
    const TREINTA_MINUTOS_MS = 30 * 60 * 1000;
    req.session.cookie.maxAge = TREINTA_MINUTOS_MS;
    console.log("Sesión normal configurada (expira en 30 min de inactividad).");
  }
  req.session.user = {
    id: user._id,
    nombre: user.nombre,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
};

/**
 * Procesa los datos del formulario de login.
 * ¡AHORA AÑADE MENSAJES FLASH ANTES DE REDIRIGIR!
 */
exports.handleLogin = async (req, res) => {
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME_MIN = 15;
  const GENERIC_ERROR_MSG = "Email o contraseña incorrectos.";

  try {
    const { email, password, remember } = req.body;

    // --- ¡CAMBIO AQUÍ! ---
    // Ahora pasamos 'req' a la función de validación
    const validation = await validateCredentials(req, email, password);

    if (!validation.isValid) {
      req.session.errorMessage = GENERIC_ERROR_MSG;
      return res.redirect("/login");
    }

    const user = validation.user;

    if (user.lockUntil && user.lockUntil > Date.now()) {
      console.log(
        `Fallo de login: Cuenta "${email}" está bloqueada. IP: [${req.ip}]`,
      );

      // ANTES: req.session.errorMessage = 'Cuenta bloqueada. Inténtalo más tarde.';
      // AHORA: Un mensaje más específico.
      req.session.errorMessage = `Cuenta bloqueada temporalmente. Inténtalo de nuevo en ${LOCK_TIME_MIN} minutos.`;

      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Lógica de éxito
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
      createUserSession(req, user, remember);
      // --- ¡CAMBIO AQUÍ! (Log de IP) ---
      console.log(
        `¡Login exitoso! Sesión creada para: ${user.email}. IP: [${req.ip}]`,
      );
      return res.redirect(
        user.role === "profesor" ? "/profesor/dashboard" : "/dashboard",
      );
    }

    // Lógica de fallo de contraseña
    user.loginAttempts += 1;

    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_TIME_MIN * 60 * 1000;
      // --- ¡CAMBIO AQUÍ! (Log de IP) ---
      console.log(
        `Fallo de login: Cuenta "${email}" bloqueada por ${LOCK_TIME_MIN} min. IP: [${req.ip}]`,
      );
    } else {
      // --- ¡CAMBIO AQUÍ! (Log de IP) ---
      console.log(
        `Fallo de login: Contraseña incorrecta para "${email}". Intento ${user.loginAttempts}. IP: [${req.ip}]`,
      );
    }

    await user.save();
    req.session.errorMessage = GENERIC_ERROR_MSG;
    return res.redirect("/login");
  } catch (error) {
    // --- ¡CAMBIO AQUÍ! (Log de IP) ---
    console.error(`Error en el login: ${error}. IP: [${req.ip}]`);
    req.session.errorMessage =
      "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.";
    res.redirect("/login");
  }
};

// ===================================================
// --- 4. Lógica de LOGOUT ---
// ===================================================

/**
 * Cierra la sesión del usuario.
 * Destruye la sesión, limpia la cookie y redirige al login.
 */
exports.handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      // Si hay un error al destruir la sesión
      console.error("Error al cerrar sesión:", err);
      return res.redirect("/"); // O a una página de error
    }

    console.log("¡Sesión cerrada exitosamente!");

    // Limpia la cookie del navegador
    // 'connect.sid' es el nombre por defecto de la cookie de express-session
    res.clearCookie("connect.sid");

    // Redirige a la página de login
    res.redirect("/login");
  });
};
