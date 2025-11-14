// middleware/authMiddleware.js

exports.isAuthenticated = (req, res, next) => {
  // 1. Verificamos si el usuario existe en la sesión
  //    (Recuerda que creamos 'req.session.user' al hacer login)
  if (req.session.user) {
    // 2. Si el usuario existe, ¡está autenticado!
    //    Le damos permiso para continuar con la ruta que pidió.
    return next();
  } else {
    // 3. Si no hay usuario en la sesión, no está autenticado.
    //    Lo redirigimos a la página de login.
    console.log("Acceso no autorizado. Redirigiendo a /login.");
    res.redirect("/login");
  }
};

// --- (BONUS) Guardia para Roles ---
// Este guardia revisa si el usuario es un estudiante
exports.isStudent = (req, res, next) => {
  if (req.session.user?.role === "estudiante") {
    return next();
  } else {
    // Si no es estudiante (es profesor o no está logueado),
    // lo mandamos a una página de "acceso denegado" o al login.
    console.log("Acceso denegado. No es un estudiante.");
    res.redirect("/login");
  }
};

exports.isProfessor = (req, res, next) => {
  if (req.session.user?.role === "profesor") {
    // Si es profesor, déjalo pasar
    return next();
  } else {
    // Si no es profesor (es estudiante o no logueado),
    // lo mandamos al login o al dashboard de estudiante.
    console.log("Acceso denegado. No es un profesor.");
    res.redirect("/login");
  }
};
