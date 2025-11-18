// ===================================================
// CONTROLADOR DE AUTENTICACIÓN (auth_Controller.js)
// ===================================================

// --- 1. Importaciones ---
const path = require("node:path");
const bcrypt = require("bcrypt"); // Para encriptar contraseñas.
const User = require("../models/Usuario"); // Modelo de datos del usuario.
const crypto = require("node:crypto"); // Para generar tokens aleatorios seguros.
const nodemailer = require("nodemailer"); // Para enviar emails.

// Configura el "transportador" de email usando las variables de entorno.
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ===================================================
// --- Lógica de "OLVIDASTE TU CONTRASEÑA" ---
// ===================================================

// Muestra el formulario para pedir reseteo de contraseña.
exports.showForgotPasswordPage = (req, res) => {
  // Pasa el mensaje de éxito (si existe) y lo limpia de la sesión.
  const successMessage = req.session.successMessage;
  delete req.session.errorMessage; // Limpia cualquier error flotante.
  delete req.session.successMessage;

  res.render("contrasena_olvidada", { successMessage });
};

// Procesa la solicitud de reseteo.
// Genera un token, lo guarda y envía el email.
exports.handleForgotPassword = async (req, res) => {
  const { email } = req.body;

  // Mensaje genérico para prevenir enumeración de usuarios
  const genericMessage =
    "Si existe una cuenta con ese email, recibirás un enlace para resetear tu contraseña.";

  try {
    const user = await User.findOne({ email: email });

    // Si NO hay usuario, respondemos con el mensaje genérico por seguridad.
    if (!user) {
      console.log(`Solicitud de reseteo para email (no existe): ${email}`);
      req.session.successMessage = genericMessage;
      return res.redirect("/login");
    }

    // Si el usuario existe, generamos un token seguro.
    const token = crypto.randomBytes(32).toString("hex");
    const UNA_HORA = 3600000; // 1 hora en milisegundos.

    // Guarda el token y su fecha de expiración en el usuario.
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + UNA_HORA;
    await user.save();

    // Construye la URL de reseteo.
    const resetUrl = `http://localhost:${process.env.PORT || 3000}/contrasena_resetear/${token}`;

    // Configura las opciones del email.
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

    // Envía el email.
    await transporter.sendMail(mailOptions);
    console.log(`Email de reseteo enviado a ${email}.`);

    // Responde con el mensaje genérico y redirige al login.
    req.session.successMessage = genericMessage;
    res.redirect("/login");
  } catch (error) {
    console.error("Error en handleForgotPassword:", error);
    res.redirect("/login");
  }
};

// Muestra el formulario para ingresar la nueva contraseña.
// Valida el token primero.
exports.showResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.params;

    // Busca un usuario con ese token Y que no haya expirado.
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // $gt = "mayor que"
    });

    // Si el token es inválido o expiró, guarda el error en sesión y redirige.
    if (!user) {
      console.log("Token inválido o expirado.");
      req.session.errorMessage = "El enlace es inválido o ha expirado.";

      // Forzamos el guardado de la sesión antes de redirigir.
      return req.session.save((err) => {
        if (err) console.error("Error al guardar la sesión:", err);
        res.redirect("/login");
      });
    }

    // Si el token es válido, limpia mensajes y muestra la página.
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

// Procesa y guarda la nueva contraseña.
exports.handleResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // 1. Re-validamos que el token siga siendo válido.
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    // Si no es válido, redirige silenciosamente.
    if (!user) {
      return res.redirect("/login");
    }

    // 2. Compara las contraseñas.
    if (password !== confirmPassword) {
      console.log("Reseteo fallido: Las contraseñas no coinciden.");
      req.session.errorMessage = "Las contraseñas no coinciden.";
      return res.redirect(`/contrasena_resetear/${token}`);
    }

    // 3. Hashea y guarda la nueva contraseña.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;

    // 4. ¡MUY IMPORTANTE! Invalida el token para que no se use de nuevo.
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log(`Contraseña actualizada para: ${user.email}`);

    // 5. Guarda el mensaje de éxito y redirige al login.
    req.session.successMessage =
      "¡Contraseña actualizada! Ya puedes iniciar sesión.";
    return req.session.save((err) => {
      if (err) console.error("Error al guardar la sesión:", err);
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

// Muestra la página de inicio de sesión (login).
// Si el usuario ya está logueado, lo redirige a su dashboard.
exports.showLoginPage = (req, res) => {
  // Si el usuario ya tiene sesión, no debe ver el login.
  if (req.session.user) {
    console.log("Usuario ya logueado, redirigiendo a dashboard...");
    return res.redirect(
      req.session.user.role === "profesor"
        ? "/profesor/dashboard"
        : "/dashboard",
    );
  }

  // --- Lógica de Mensajes Flash ---
  // Lee los mensajes de la sesión.
  const errorMessage = req.session.errorMessage;
  const successMessage = req.session.successMessage;

  // Borra los mensajes para que solo se muestren una vez.
  delete req.session.errorMessage;
  delete req.session.successMessage;

  // Renderiza la vista 'login' y le pasa los mensajes.
  res.render("login", { errorMessage, successMessage });
};

// Función auxiliar para validar credenciales de login.
const validateCredentials = async (req, email, password) => {
  // 1. Campos obligatorios.
  if (!email || !password) {
    console.log(`Fallo de login: Campos vacíos. IP: [${req.ip}]`);
    return { isValid: false };
  }

  // 2. Validación de Longitud (Protección básica).
  if (email.length > 254 || password.length > 128) {
    console.log(`Fallo de login: Campos exceden longitud. IP: [${req.ip}]`);
    return { isValid: false };
  }

  // 3. Validación de Formato de Email (Solo @ucvvirtual.edu.pe).
  const emailRegex = new RegExp(
    "^[a-zA-Z0-9._%+\\-]+@ucvvirtual\\.edu\\.pe$",
    "i",
  );
  if (!emailRegex.test(email)) {
    console.log(`Fallo de login: Email no institucional. IP: [${req.ip}]`);
    return { isValid: false };
  }

  // 4. Búsqueda de usuario.
  const user = await User.findOne({ email: email });
  if (!user) {
    console.log(`Fallo de login: Usuario no encontrado. IP: [${req.ip}]`);
    return { isValid: false };
  }

  // Si es válido, devuelve el usuario encontrado.
  return { isValid: true, user };
};

const createUserSession = (req, user, remember) => {
  if (remember) {
    // Sesión larga si el usuario marca "Recordar".
    const CATORCE_DIAS_MS = 4 * 60 * 60 * 1000;
    req.session.cookie.maxAge = CATORCE_DIAS_MS;
    console.log('Sesión configurada para "recordar" por 4 horas.');
  } else {
    // Sesión corta (se resetea con la actividad) si no marca "Recordar".
    const TREINTA_MINUTOS_MS = 30 * 60 * 1000;
    req.session.cookie.maxAge = TREINTA_MINUTOS_MS;
    console.log("Sesión normal configurada (expira en 30 min de inactividad).");
  }

  // Guarda solo la información esencial y no sensible en la sesión.
  req.session.user = {
    id: user._id,
    nombre: user.nombre,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
};

//Procesa los datos del formulario de login.
exports.handleLogin = async (req, res) => {
  // Constantes de seguridad para el bloqueo de cuenta.
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME_MIN = 15;
  const GENERIC_ERROR_MSG = "Email o contraseña incorrectos.";

  try {
    const { email, password, remember } = req.body;

    // 1. Valida las credenciales usando la función auxiliar.
    const validation = await validateCredentials(req, email, password);
    if (!validation.isValid) {
      req.session.errorMessage = GENERIC_ERROR_MSG;
      return res.redirect("/login");
    }

    const user = validation.user;

    // 2. Comprueba si la cuenta está bloqueada.
    if (user.lockUntil && user.lockUntil > Date.now()) {
      console.log(
        `Fallo de login: Cuenta "${email}" bloqueada. IP: [${req.ip}]`,
      );
      req.session.errorMessage = `Cuenta bloqueada temporalmente. Inténtalo de nuevo en ${LOCK_TIME_MIN} minutos.`;
      return res.redirect("/login");
    }

    // 3. Compara la contraseña enviada con la hasheada en la BD.
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      // --- ÉXITO DE LOGIN ---
      // Resetea los intentos fallidos.
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      // Regenera la sesión para prevenir "Session Fixation".
      req.session.regenerate((err) => {
        if (err) {
          console.error(
            `Error al regenerar la sesión: ${err}. IP: [${req.ip}]`,
          );
          req.session.errorMessage = "Ha ocurrido un error inesperado.";
          return res.redirect("/login");
        }

        // Crea la nueva sesión del usuario.
        createUserSession(req, user, remember);
        console.log(`¡Login exitoso! Sesión REGENERADA para: ${user.email}.`);

        // Redirige al dashboard correcto según el rol.
        return res.redirect(
          user.role === "profesor" ? "/profesor/dashboard" : "/dashboard",
        );
      });
    } else {
      // --- FALLO DE LOGIN (Contraseña incorrecta) ---
      // Incrementa los intentos de login.
      user.loginAttempts += 1;

      // Si supera el máximo, bloquea la cuenta.
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME_MIN * 60 * 1000;
        console.log(
          `Fallo de login: Cuenta "${email}" bloqueada. IP: [${req.ip}]`,
        );
      } else {
        console.log(`Fallo de login: Contraseña incorrecta para "${email}".`);
      }

      await user.save();
      req.session.errorMessage = GENERIC_ERROR_MSG;
      return res.redirect("/login");
    }
  } catch (error) {
    console.error(`Error en el login: ${error}. IP: [${req.ip}]`);
    req.session.errorMessage = "Ha ocurrido un error inesperado.";
    res.redirect("/login");
  }
};

// ===================================================
// --- 4. Lógica de LOGOUT ---
// ===================================================

// Cierra la sesión del usuario.
exports.handleLogout = (req, res) => {
  // Destruye la sesión en la base de datos (MongoStore).
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.redirect("/");
    }

    console.log("¡Sesión cerrada exitosamente!");

    // Limpia la cookie del navegador para asegurar el cierre.
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
};
