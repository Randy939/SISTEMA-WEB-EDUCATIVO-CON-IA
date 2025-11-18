// ===================================================
// CONTROLADOR DE AUTENTICACIÓN (auth_Controller.js)
// ===================================================

// --- 1. Importaciones ---
const path = require("node:path");
const bcrypt = require("bcrypt");
const User = require("../models/Usuario");
const crypto = require("node:crypto"); // <-- AÑADE ESTA LÍNEA
const nodemailer = require("nodemailer"); // Importa el modelo de Usuario

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "sistemadelecturaia@gmail.com",
    pass: "jruj gxdv ecsc zxvw",
  },
});

// ===================================================
// --- 3c. Lógica de "OLVIDASTE TU CONTRASEÑA" ---
// ===================================================

/**
 * Muestra el formulario para pedir reseteo de contraseña.
 */
exports.showForgotPasswordPage = (req, res) => {
  const successMessage = req.session.successMessage;

  delete req.session.errorMessage;
  delete req.session.successMessage;

  res.render("contrasena_olvidada", { successMessage });
};

/**
 * Procesa la solicitud de reseteo.
 * Genera un token, lo guarda y envía el email.
 */
exports.handleForgotPassword = async (req, res) => {
  const { email } = req.body;

  // Mensaje genérico para prevenir enumeración de usuarios
  const genericMessage =
    "Si existe una cuenta con ese email, recibirás un enlace para resetear tu contraseña.";

  try {
    const user = await User.findOne({ email: email });

    // Si NO hay usuario, simplemente respondemos con éxito
    // Esto es una medida de seguridad clave.
    if (!user) {
      console.log(`Solicitud de reseteo para email (no existe): ${email}`);
      req.session.successMessage = genericMessage;
      return res.redirect("/login");
    }

    // Si el usuario existe, generamos el token
    const token = crypto.randomBytes(32).toString("hex");
    const UNA_HORA = 3600000; // 1 hora en milisegundos

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + UNA_HORA;
    await user.save();

    // 2. Envía el email de verificación
    const resetUrl = `http://localhost:${process.env.PORT || 3000}/contrasena_resetear/${token}`;

    const mailOptions = {
      from: '"Sistema Educativo IA" <no-reply@sistema.com>',
      to: email,
      subject: "Enlace para resetear tu contraseña",
      html: `
          <h2>¡Hola, ${user.nombre}!</h2>
          <p>Recibimos una solicitud para resetear tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
          <a href="${resetUrl}" style="background: #4396ea; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Resetear mi Contraseña</a>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si tú no solicitaste esto, puedes ignorar este email.</p>
        `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Email de reseteo enviado a ${email}.`,
      nodemailer.getTestMessageUrl(info),
    );
    req.session.successMessage = genericMessage;
    res.redirect("/login");
  } catch (error) {
    console.error("Error en handleForgotPassword:", error);
    res.redirect("/login");
  }
};

/**
 * Muestra el formulario para ingresar la nueva contraseña.
 * Valida el token primero.
 */
exports.showResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.params;

    // Busca el token Y comprueba que no haya expirado
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // $gt = "mayor que"
    });

    if (!user) {
      console.log("[DEBUG] showResetPasswordPage: Token inválido o expirado."); // <-- DEPURACIÓN
      req.session.errorMessage = "El enlace es inválido o ha expirado.";

      // ¡AQUÍ ESTÁ EL ARREGLO!
      // Forzamos el guardado de la sesión ANTES de redirigir
      return req.session.save((err) => {
        if (err) {
          console.error("[DEBUG] Error al guardar la sesión:", err);
          return res.redirect("/login"); // Redirige de todas formas
        }

        console.log(
          "[DEBUG] Sesión guardada con errorMessage. Redirigiendo a /login.",
        ); // <-- DEPURACIÓN
        res.redirect("/login");
      });
    }
    const errorMessage = req.session.errorMessage;
    const successMessage = req.session.successMessage;

    delete req.session.errorMessage;
    delete req.session.successMessage;
    res.render("contrasena_resetear", {
      token: token,
      errorMessage,
      successMessage,
    });
  } catch (error) {
    console.error("Error en showResetPasswordPage:", error);
    res.redirect("/login");
  }
};

/**
 * Procesa y guarda la nueva contraseña.
 */
exports.handleResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // 1. Re-validamos el token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect("/login");
    }

    // 2. Comparamos las contraseñas
    if (password !== confirmPassword) {
      // (Aquí deberías enviar un error a la vista reset-password)
      console.log("Reseteo fallido: Las contraseñas no coinciden.");
      req.session.errorMessage = "Las contraseñas no coinciden.";
      return res.redirect(`/contrasena_resetear/${token}`);
    }

    // 3. Hasheamos y guardamos la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    // 4. ¡MUY IMPORTANTE! Invalidamos el token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    console.log(`Contraseña actualizada exitosamente para: ${user.email}`);

    // (Aquí deberías enviar un mensaje de éxito a la página de login)
    req.session.successMessage =
      "¡Contraseña actualizada! Ya puedes iniciar sesión.";
    return req.session.save((err) => {
      if (err) {
        console.error("[DEBUG] Error al guardar la sesión:", err);
        return res.redirect("/login");
      }

      console.log(
        "[DEBUG] Sesión guardada con successMessage. Redirigiendo a /login.",
      ); // <-- DEPURACIÓN
      res.redirect("/login");
    });
  } catch (error) {
    console.error("Error en handleResetPassword:", error);
    res.redirect("/login");
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
  console.log("[DEBUG] Cargando showLoginPage...");
  // 1. Lee el mensaje de error de la sesión (si existe)
  const errorMessage = req.session.errorMessage;
  const successMessage = req.session.successMessage;
  if (errorMessage) {
    console.log("[DEBUG] 'errorMessage' ENCONTRADO:", errorMessage); // <-- DEPURACIÓN
  } else if (successMessage) {
    console.log("[DEBUG] 'successMessage' ENCONTRADO:", successMessage); // <-- DEPURACIÓN
  } else {
    console.log("[DEBUG] No se encontraron mensajes flash en la sesión."); // <-- DEPURACIÓN
  }
  // 2. Borra el mensaje de la sesión para que no se muestre de nuevo
  delete req.session.errorMessage;
  delete req.session.successMessage;

  // 3. Renderiza la plantilla EJS, pasándole el mensaje
  //    (Si no hay mensaje, 'errorMessage' será 'undefined' y el EJS no mostrará nada)
  res.render("login", { errorMessage, successMessage });
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

      req.session.errorMessage = `Cuenta bloqueada temporalmente. Inténtalo de nuevo en ${LOCK_TIME_MIN} minutos.`;

      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // Lógica de éxito
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      // --- ¡NUEVO! REGENERACIÓN DE SESIÓN (Protección Session Fixation) ---
      req.session.regenerate((err) => {
        if (err) {
          // Si hay un error al regenerar, redirigir al login
          console.error(
            `Error al regenerar la sesión: ${err}. IP: [${req.ip}]`,
          );
          req.session.errorMessage = "Ha ocurrido un error inesperado.";
          return res.redirect("/login");
        }

        // Una vez regenerada la sesión, creamos los datos del usuario
        createUserSession(req, user, remember);

        console.log(
          `¡Login exitoso! Sesión REGENERADA para: ${user.email}. IP: [${req.ip}]`,
        );

        // Redirigimos al dashboard correspondiente
        return res.redirect(
          user.role === "profesor" ? "/profesor/dashboard" : "/dashboard",
        );
      });
      // --- FIN DE REGENERACIÓN DE SESIÓN ---
    } else {
      // <-- ¡¡ESTA ES LA LÍNEA MÁGICA QUE FALTABA!!

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
    }
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
