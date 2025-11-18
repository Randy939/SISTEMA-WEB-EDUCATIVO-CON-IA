// Contiene los "guardianes" que protegen las rutas de la aplicación.
const User = require("../models/Usuario");

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

// Refresca los datos del usuario en la sesión en cada petición.
// Refresca los datos del usuario en la sesión en cada petición.
exports.refreshUserSession = async (req, res, next) => {
  if (req.session.user) {
    try {
      // Busca los datos más frescos en la BD.
      const user = await User.findById(req.session.user.id)
        .select("nombres apellidos role avatarUrl experiencia email grado") // Pide TODOS los campos necesarios
        .lean();

      if (user) {
        // --- Lógica de Nivel (Movida aquí) ---
        const XP_POR_NIVEL = 100;
        const nivel = Math.floor(user.experiencia / XP_POR_NIVEL) + 1;
        const xpActualNivel = user.experiencia % XP_POR_NIVEL;
        const progresoXP = Math.round((xpActualNivel / XP_POR_NIVEL) * 100);
        const xpParaSiguiente = XP_POR_NIVEL - xpActualNivel;

        // Actualiza la sesión con el objeto de usuario COMPLETO.
        req.session.user = {
          id: user._id,
          nombres: user.nombres || "Usuario",
          apellidos: user.apellidos || "",
          email: user.email, // Añadido para el perfil
          grado: user.grado || "", // Añadido para el perfil
          role: user.role,
          avatarUrl: user.avatarUrl,
          nivel: nivel,
          experiencia: user.experiencia,
          progresoXP: progresoXP,
          xpParaSiguiente: xpParaSiguiente,
        };
      } else {
        // Si no se encuentra el usuario (ej. borrado), destruye la sesión.
        return req.session.destroy(() => res.redirect("/login"));
      }
    } catch (error) {
      console.error("Error al refrescar la sesión del usuario:", error);
    }
  }
  next();
};
