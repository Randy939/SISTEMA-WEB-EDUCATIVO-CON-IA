// Contiene los "guardianes" que protegen las rutas de la aplicación.

// Middleware para verificar si un usuario está autenticado.
// Si no tiene sesión, lo redirige al login.
exports.isAuthenticated = (req, res, next) => {
  // Comprueba si 'req.session.user' fue creado en el login.
  if (req.session.user) {
    // Si existe, el usuario está logueado. Permite continuar.
    return next();
  } else {
    // Si no existe, redirige al login.
    console.log("Acceso no autorizado. Redirigiendo a /login.");
    res.redirect("/login");
  }
};

// Middleware para verificar si el usuario logueado tiene el rol de "estudiante".
exports.isStudent = (req, res, next) => {
  // Usa "optional chaining" (?) por si 'req.session.user' no existe.
  if (req.session.user?.role === "estudiante") {
    return next(); // Es estudiante, permite continuar.
  } else {
    // Si no es estudiante, redirige al login.
    console.log("Acceso denegado. No es un estudiante.");
    res.redirect("/login");
  }
};

// Middleware para verificar si el usuario logueado tiene el rol de "profesor".
exports.isProfessor = (req, res, next) => {
  if (req.session.user?.role === "profesor") {
    return next(); // Es profesor, permite continuar.
  } else {
    // Si no es profesor, redirige al login.
    console.log("Acceso denegado. No es un profesor.");
    res.redirect("/login");
  }
};
