const path = require("node:path");
const User = require("../models/Usuario");
const Actividad = require("../models/Actividad"); // Necesitamos Actividad
const Progreso = require("../models/Progreso"); // <-- ¡NUEVO! Necesitamos el modelo
const bcrypt = require("bcrypt"); // <-- ¡NUEVO! Para la contraseña
const fs = require("node:fs");
// --- Tus funciones existentes (modificadas para pasar 'user') ---
exports.showDashboard = async (req, res) => {
  // Necesita 'async'
  try {
    const estudianteId = req.session.user.id;

    // 1. Obtener todas las actividades y el progreso
    const [todasLasActividades, progresoEstudiante] = await Promise.all([
      Actividad.find({}).lean(),
      Progreso.find({ estudianteId: estudianteId }).lean(),
    ]);

    const progresoMap = progresoEstudiante.reduce((map, prog) => {
      map[prog.actividadId.toString()] = prog;
      return map;
    }, {});

    // 2. Contar pendientes
    const pendientes = todasLasActividades.filter(
      (act) => !progresoMap[act._id.toString()],
    );
    const pendingCount = pendientes.length; // <-- Define pendingCount

    // 3. Contar completadas este mes y calcular precisión total
    let completedThisMonthCount = 0; // <-- Define completedThisMonthCount
    let totalPuntajeObtenido = 0;
    let totalPuntajePosible = 0;
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    progresoEstudiante.forEach((prog) => {
      if (prog.fechaCompletado >= inicioMes) {
        completedThisMonthCount++;
      }
      totalPuntajeObtenido += prog.puntajeObtenido;
      totalPuntajePosible += prog.puntajeTotalPosible;
    });

    // 4. Calcular promedio de precisión
    const averagePrecision =
      totalPuntajePosible > 0 // <-- Define averagePrecision
        ? Math.round((totalPuntajeObtenido / totalPuntajePosible) * 100)
        : 0;

    // 5. Renderizar la vista CON las variables
    res.render("estudiante/dashboard_estudiante", {
      active: "inicio",
      user: req.session.user,
      pendingCount: pendingCount, // <-- La pasa aquí
      completedThisMonthCount: completedThisMonthCount, // <-- La pasa aquí
      averagePrecision: averagePrecision, // <-- La pasa aquí
    });
  } catch (error) {
    console.error("Error al cargar dashboard estudiante:", error);
    // Fallback en caso de error (también las pasa)
    res.render("estudiante/dashboard_estudiante", {
      active: "inicio",
      user: req.session.user,
      pendingCount: 0,
      completedThisMonthCount: 0,
      averagePrecision: 0,
    });
  }
};

exports.showActividades = async (req, res) => {
  try {
    const estudianteId = req.session.user.id;

    // Buscamos TODAS las actividades (simplificación por ahora)
    // En un futuro, filtrarías por clase o asignación específica.
    const todasLasActividades = await Actividad.find({})
      .sort({ createdAt: -1 })
      .lean(); // .lean() para objetos JS simples

    // Buscamos el progreso de ESTE estudiante
    const progresoEstudiante = await Progreso.find({
      estudianteId: estudianteId,
    })
      .select("actividadId puntajeObtenido puntajeTotalPosible -_id") // Solo IDs y puntajes
      .lean();

    // Creamos un mapa (diccionario) para buscar rápido si una actividad ya fue completada
    const progresoMap = progresoEstudiante.reduce((map, prog) => {
      map[prog.actividadId.toString()] = prog; // Clave: ID de actividad, Valor: objeto de progreso
      return map;
    }, {});

    // Separamos las actividades en pendientes y completadas
    const actividadesPendientes = [];
    const actividadesCompletadas = [];

    todasLasActividades.forEach((act) => {
      const actIdString = act._id.toString();
      if (progresoMap[actIdString]) {
        // Si está en el mapa, ya la completó. Añadimos su puntaje.
        act.progreso = progresoMap[actIdString];
        actividadesCompletadas.push(act);
      } else {
        // Si no, está pendiente.
        actividadesPendientes.push(act);
      }
    });

    res.render("estudiante/actividades_estudiante", {
      active: "actividades",
      user: req.session.user,
      pendientes: actividadesPendientes,
      completadas: actividadesCompletadas,
    });
  } catch (error) {
    console.error("Error al mostrar actividades:", error);
    res.redirect("/dashboard");
  }
};

// 2. MUESTRA la página para realizar una actividad
exports.showRealizarActividad = async (req, res) => {
  try {
    const actividadId = req.params.id;
    const estudianteId = req.session.user.id;

    // Buscamos la actividad
    const actividad = await Actividad.findById(actividadId).lean();
    if (!actividad) {
      return res.redirect("/actividades");
    }

    // Verificamos si ya la completó (para evitar reintentos si no quieres)
    const yaCompletada = await Progreso.findOne({ estudianteId, actividadId });
    if (yaCompletada) {
      console.log("Intento de realizar actividad ya completada");
      return res.redirect("/actividades"); // O mostrar un mensaje
    }

    res.render("estudiante/realizar_actividad", {
      // Renderiza la NUEVA vista
      active: "actividades",
      user: req.session.user,
      actividad: actividad,
    });
  } catch (error) {
    console.error("Error al mostrar actividad para realizar:", error);
    res.redirect("/actividades");
  }
};

// 3. MANEJA el envío de las respuestas
exports.handleEnviarActividad = async (req, res) => {
  try {
    const actividadId = req.params.id;
    const estudianteId = req.session.user.id;
    const respuestas = req.body.respuestas || {}; // Esperamos { 'id_pregunta': 'id_alternativa', ... }

    // 1. Buscamos la actividad OTRA VEZ (para tener las respuestas correctas)
    const actividad = await Actividad.findById(actividadId);
    if (!actividad) {
      return res.redirect("/actividades");
    }

    // Evitar doble envío (si ya existe progreso)
    const yaCompletada = await Progreso.findOne({ estudianteId, actividadId });
    if (yaCompletada) {
      return res.redirect("/actividades");
    }

    // 2. Calculamos el puntaje
    let puntajeObtenido = 0;
    let puntajeTotalPosible = 0;

    actividad.preguntas.forEach((pregunta) => {
      puntajeTotalPosible += pregunta.puntaje; // Sumamos el puntaje posible
      const preguntaId = pregunta._id.toString();
      const respuestaEstudiante = respuestas[preguntaId]; // ID de la alternativa que marcó

      if (respuestaEstudiante) {
        // Buscamos la alternativa correcta dentro de la pregunta
        const alternativaCorrecta = pregunta.alternativas.find(
          (alt) => alt.esCorrecta,
        );
        if (
          alternativaCorrecta &&
          alternativaCorrecta._id.toString() === respuestaEstudiante
        ) {
          // ¡Respuesta correcta! Sumamos el puntaje
          puntajeObtenido += pregunta.puntaje;
        }
      }
    });

    // 3. Creamos y guardamos el registro de progreso
    const nuevoProgreso = new Progreso({
      estudianteId,
      actividadId,
      puntajeObtenido,
      puntajeTotalPosible,
    });
    await nuevoProgreso.save();

    console.log(
      `Actividad completada por ${estudianteId}. Puntaje: ${puntajeObtenido}/${puntajeTotalPosible}`,
    );
    res.redirect("/actividades"); // Volvemos a la lista
  } catch (error) {
    // Manejo de error si ya existe (por el índice unique)
    if (error.code === 11000) {
      console.log("Error: Intento de completar actividad duplicada.");
      return res.redirect("/actividades");
    }
    console.error("Error al enviar actividad:", error);
    res.redirect("/actividades");
  }
};

exports.showProgreso = (req, res) => {
  res.send("Página de Progreso - EN CONSTRUCCIÓN");
};

// --- MODIFICADA: Ahora pasamos los datos del usuario real ---
exports.showPerfil = async (req, res) => {
  try {
    // Obtenemos los datos MÁS FRESCOS del usuario desde la BD
    const user = await User.findById(req.session.user.id);

    res.render("estudiante/perfil_estudiante", {
      active: "perfil",
      user: user, // Pasamos el objeto 'user' completo (con nombre, email, etc.)
    });
  } catch (error) {
    console.error(error);
    res.redirect("/dashboard");
  }
};

// --- ¡NUEVA FUNCIÓN! ---
exports.handleUpdateInfo = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.session.user.id;

    // Actualizamos el usuario en la BD
    const user = await User.findById(userId);
    user.email = email;
    await user.save();

    // ¡Importante! Actualizamos también la sesión
    req.session.user.email = user.email;

    console.log("Información actualizada para:", user.email);
    res.redirect("/perfil");
  } catch (error) {
    console.error("Error al actualizar info:", error);
    res.redirect("/perfil");
  }
};

// --- ¡NUEVA FUNCIÓN! ---
exports.handleUpdatePassword = async (req, res) => {
  try {
    const { password_actual, password_nueva, password_confirmar } = req.body;
    const userId = req.session.user.id;

    // 1. Validar que las contraseñas nuevas coincidan
    if (password_nueva !== password_confirmar) {
      console.log("Error: Las contraseñas nuevas no coinciden");
      return res.redirect("/perfil"); // (Idealmente con un mensaje de error)
    }

    // 2. Buscar al usuario
    const user = await User.findById(userId);

    // 3. Validar contraseña actual
    const isMatch = await bcrypt.compare(password_actual, user.password);
    if (!isMatch) {
      console.log("Error: La contraseña actual es incorrecta");
      return res.redirect("/perfil"); // (Idealmente con un mensaje de error)
    }

    // 4. Hashear y guardar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password_nueva, salt);
    await user.save();

    console.log("Contraseña actualizada para:", user.email);
    res.redirect("/perfil");
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    res.redirect("/perfil");
  }
};

exports.handleUpdatePhoto = async (req, res) => {
  try {
    // 1. Multer ya guardó el archivo. 'req.file' tiene la info.
    if (!req.file) {
      console.log("No se subió ningún archivo.");
      return res.redirect("/perfil");
    }

    // 2. Construimos la URL web (no la ruta del sistema)
    // Reemplazamos 'public\' con '/'
    const avatarUrl = req.file.path.replace("public", "").replaceAll("\\", "/");

    // 3. Actualizamos la BD
    const user = await User.findById(req.session.user.id);
    user.avatarUrl = avatarUrl;
    await user.save();

    // 4. ¡MUY IMPORTANTE! Actualizamos la sesión
    req.session.user.avatarUrl = avatarUrl;

    console.log("Foto de perfil actualizada para:", user.email);
    res.redirect("/perfil");
  } catch (error) {
    console.error("Error al actualizar la foto:", error);
    res.redirect("/perfil");
  }
};

exports.handleDeletePhoto = async (req, res) => {
  try {
    const userId = req.session.user.id;
    // Esta es la ruta por defecto que definiste en tu modelo
    const defaultAvatar = "/images/default-avatar.png";

    // Actualizamos la BD
    const user = await User.findById(userId);
    user.avatarUrl = defaultAvatar;
    await user.save();

    // Actualizamos la sesión
    req.session.user.avatarUrl = defaultAvatar;

    console.log("Foto de perfil eliminada para:", user.email);
    res.redirect("/perfil");
  } catch (error) {
    console.error("Error al eliminar la foto:", error);
    res.redirect("/perfil");
  }
};
