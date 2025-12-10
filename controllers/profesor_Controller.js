// controllers/profesor_Controller.js
const path = require("node:path");
const User = require("../models/Usuario");
const Actividad = require("../models/Actividad");
const Progreso = require("../models/Progreso");
const bcrypt = require("bcrypt");
const fs = require("node:fs");
const { generarActividadLocal } = require("./ia_generator");

// --- (showDashboard se queda igual) ---
exports.showDashboard = async (req, res) => {
  // <-- Añadimos 'async'
  try {
    const profesorId = req.session.user.id;

    // Contamos los estudiantes (todos los que tengan rol 'estudiante')
    // NOTA: A futuro, si implementas "Clases", filtrarías solo los de tus clases.
    const studentCount = await User.countDocuments({ role: "estudiante" });

    // Contamos las actividades creadas POR ESTE profesor
    const activityCount = await Actividad.countDocuments({
      profesorId: profesorId,
    });

    res.render("profesor/dashboard_profesor", {
      active: "inicio",
      user: req.session.user,
      studentCount: studentCount, // <-- Pasamos el conteo de estudiantes
      activityCount: activityCount, // <-- Pasamos el conteo de actividades
    });
  } catch (error) {
    console.error("Error al cargar dashboard del profesor:", error);
    // Si hay un error, al menos mostramos la página con ceros
    res.render("profesor/dashboard_profesor", {
      active: "inicio",
      user: req.session.user,
      studentCount: 0,
      activityCount: 0,
    });
  }
};

// --- GESTIÓN DE ESTUDIANTES ---

// 1. MUESTRA la página de gestión (formulario + lista)
exports.showEstudiantes = async (req, res) => {
  try {
    // Busca en la BD solo los usuarios con role 'estudiante'
    const estudiantes = await User.find({ role: "estudiante" }).sort({
      apellidos: 1, // Ordenamos por apellido
    });

    res.render("profesor/gestion_estudiantes", {
      active: "estudiantes",
      user: req.session.user,
      estudiantes: estudiantes,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/profesor/dashboard");
  }
};

// 2. MANEJA la creación de un nuevo estudiante (¡ACTUALIZADO!)
exports.handleCrearEstudiante = async (req, res) => {
  try {
    // Obtenemos los NUEVOS campos del formulario
    const { nombres, apellidos, grado, email, password } = req.body;

    // Verificamos si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email ya registrado");
      return res.redirect("/profesor/estudiantes");
    }

    // Hasheamos la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Creamos el nuevo usuario con los campos CORRECTOS
    const newUser = new User({
      nombres, // campo 'nombres'
      apellidos, // campo 'apellidos'
      grado, // campo 'grado'
      email,
      password: hashedPassword,
      role: "estudiante",
    });

    await newUser.save();
    console.log("Estudiante creado:", newUser.email);
    res.redirect("/profesor/estudiantes");
  } catch (error) {
    console.error("Error al crear estudiante:", error);
    res.redirect("/profesor/estudiantes");
  }
};

// 3. MUESTRA la página de edición
exports.showEditarEstudiante = async (req, res) => {
  try {
    const estudiante = await User.findById(req.params.id);
    if (!estudiante || estudiante.role !== "estudiante") {
      return res.redirect("/profesor/estudiantes");
    }

    res.render("profesor/editar_estudiante", {
      active: "estudiantes",
      user: req.session.user,
      estudiante: estudiante,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/profesor/estudiantes");
  }
};

// 4. MANEJA la actualización del estudiante (¡ACTUALIZADO!)
exports.handleEditarEstudiante = async (req, res) => {
  try {
    // Obtenemos los NUEVOS campos del formulario de edición
    const { nombres, apellidos, grado, email } = req.body;

    // Actualizamos al usuario en la BD
    await User.findByIdAndUpdate(req.params.id, {
      nombres,
      apellidos,
      grado,
      email,
    });

    console.log("Estudiante actualizado");
    res.redirect("/profesor/estudiantes");
  } catch (error) {
    console.error("Error al actualizar estudiante:", error);
    res.redirect("/profesor/estudiantes");
  }
};

// 5. MANEJA el reseteo de contraseña
exports.handleResetPassword = async (req, res) => {
  try {
    const { estudianteId, nuevaPassword } = req.body;

    if (!nuevaPassword) {
      console.log("No se proporcionó nueva contraseña");
      return res.redirect("/profesor/estudiantes");
    }

    // Hasheamos la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    // Actualizamos solo la contraseña
    await User.findByIdAndUpdate(estudianteId, { password: hashedPassword });

    console.log("Contraseña reseteada para el estudiante");
    res.redirect("/profesor/estudiantes");
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    res.redirect("/profesor/estudiantes");
  }
};

exports.handleEliminarEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.body;

    // Buscamos y eliminamos al usuario por su ID
    await User.findByIdAndDelete(estudianteId);

    /*
     * ¡Importante! A futuro, también deberíamos eliminar el progreso
     * de este estudiante en la base de datos "Progreso.js" para
     * no dejar datos "huérfanos".
     * (Ej: await Progreso.deleteMany({ estudiante: estudianteId });)
     */

    console.log("Estudiante eliminado exitosamente");
    res.redirect("/profesor/estudiantes");
  } catch (error) {
    console.error("Error al eliminar estudiante:", error);
    res.redirect("/profesor/estudiantes");
  }
};

// --- (showActividades, showReportes, showPerfil se quedan igual por ahora) ---
exports.showActividades = async (req, res) => {
  try {
    const actividades = await Actividad.find({
      profesorId: req.session.user.id,
    }).sort({ createdAt: -1 });
    res.render("profesor/gestion_actividades", {
      // Renderiza el "Hub"
      active: "actividades",
      user: req.session.user,
      actividades: actividades, // Solo pasa la lista
    });
  } catch (error) {
    console.error(error);
    res.redirect("/profesor/dashboard");
  }
};

// 2. Muestra la página/formulario de creación (sin cambios en la lógica, solo renderiza)
exports.showCrearActividadPage = (req, res) => {
  res.render("profesor/crear_actividad", {
    active: "actividades",
    user: req.session.user,
  });
};

// 3. MODIFICADA: Ahora redirige a la página de EDICIÓN
exports.handleCrearActividad = async (req, res) => {
  try {
    console.log("Recibido en Crear:", JSON.stringify(req.body, null, 2)); // Log más detallado
    const { titulo, descripcion, tema, dificultad } = req.body;
    const profesorId = req.session.user.id;

    let imagenUrl = "/images/default-activity.png";
    if (req.file) {
      imagenUrl = req.file.path.replace("public", "").replace(/\\/g, "/");
    }

    // --- Procesamiento ADAPTADO a la estructura anidada ---
    let preguntasData = [];
    // Verificamos si req.body.preguntas existe y es un array
    if (req.body.preguntas && Array.isArray(req.body.preguntas)) {
      preguntasData = req.body.preguntas
        .map((preguntaInput, index) => {
          const preguntaTexto = preguntaInput.preguntaTexto;
          const puntaje = preguntaInput.puntaje;
          // El índice de la correcta viene como 'correcta' en el objeto de la pregunta
          const indiceCorrecta = parseInt(preguntaInput.correcta, 10);

          let alternativas = [];
          // Verificamos si existen alternativas y es array
          if (
            preguntaInput.alternativas &&
            Array.isArray(preguntaInput.alternativas)
          ) {
            alternativas = preguntaInput.alternativas
              .map((altInput, altIndex) => {
                // El texto viene directo
                const textoAlt = altInput.texto;
                if (textoAlt && textoAlt.trim() !== "") {
                  return {
                    texto: textoAlt,
                    esCorrecta: altIndex === indiceCorrecta,
                  };
                }
                return null; // Ignorar alternativas vacías
              })
              .filter((alt) => alt !== null); // Limpiar nulos
          }

          // Validar antes de añadir
          if (
            preguntaTexto &&
            preguntaTexto.trim() !== "" &&
            alternativas.length > 0
          ) {
            return { preguntaTexto, puntaje, alternativas };
          }
          return null; // Ignorar preguntas inválidas
        })
        .filter((p) => p !== null); // Limpiar nulos
    }
    console.log(
      "Preguntas Procesadas:",
      JSON.stringify(preguntasData, null, 2),
    );
    // --- Fin Procesamiento Adaptado ---

    const nuevaActividad = new Actividad({
      titulo,
      descripcion,
      tema,
      dificultad,
      imagenUrl,
      profesorId,
      preguntas: preguntasData,
    });

    await nuevaActividad.save();
    console.log("Actividad creada:", nuevaActividad.titulo);
    res.redirect("/profesor/actividades");
  } catch (error) {
    console.error("Error al crear actividad:", error);
    res.redirect("/profesor/actividades/crear");
  }
};

// 3. MUESTRA la página de edición
exports.showEditarActividad = async (req, res) => {
  try {
    // Usamos .populate() si quisiéramos datos del profesor, pero no es necesario aquí
    const actividad = await Actividad.findById(req.params.id);

    if (!actividad) {
      return res.redirect("/profesor/actividades");
    }

    res.render("profesor/editar_actividad", {
      // Renderiza la vista de edición
      active: "actividades",
      user: req.session.user,
      actividad: actividad, // Pasamos la actividad completa con sus preguntas
    });
  } catch (error) {
    console.error(error);
    res.redirect("/profesor/actividades");
  }
};

// 4. MANEJA la actualización de una actividad
exports.handleEditarActividad = async (req, res) => {
  try {
    console.log("Recibido en Editar:", JSON.stringify(req.body, null, 2)); // Log más detallado
    const { titulo, descripcion, tema, dificultad } = req.body;
    const actividadId = req.params.id;
    const profesorId = req.session.user.id;

    const actividad = await Actividad.findById(actividadId);
    if (!actividad) {
      return res.redirect("/profesor/actividades");
    }

    // Actualizar campos básicos
    actividad.titulo = titulo;
    actividad.descripcion = descripcion;
    actividad.tema = tema;
    actividad.dificultad = dificultad;

    // Actualizar imagen si se subió una nueva
    if (req.file) {
      if (actividad.imagenUrl !== "/images/default-activity.png") {
        fs.unlink(
          path.join(__dirname, `../public${actividad.imagenUrl}`),
          (err) => {
            if (err) console.error("Error al borrar imagen antigua:", err);
          },
        );
      }
      actividad.imagenUrl = req.file.path
        .replace("public", "")
        .replace(/\\/g, "/");
    }

    // --- Re-procesamiento ADAPTADO ---
    let preguntasData = [];
    // Misma lógica adaptada que en Crear
    if (req.body.preguntas && Array.isArray(req.body.preguntas)) {
      preguntasData = req.body.preguntas
        .map((preguntaInput, index) => {
          const preguntaTexto = preguntaInput.preguntaTexto;
          const puntaje = preguntaInput.puntaje;
          const indiceCorrecta = parseInt(preguntaInput.correcta, 10);
          let alternativas = [];
          if (
            preguntaInput.alternativas &&
            Array.isArray(preguntaInput.alternativas)
          ) {
            alternativas = preguntaInput.alternativas
              .map((altInput, altIndex) => {
                const textoAlt = altInput.texto;
                if (textoAlt && textoAlt.trim() !== "") {
                  return {
                    texto: textoAlt,
                    esCorrecta: altIndex === indiceCorrecta,
                  };
                }
                return null;
              })
              .filter((alt) => alt !== null);
          }
          if (
            preguntaTexto &&
            preguntaTexto.trim() !== "" &&
            alternativas.length > 0
          ) {
            return { preguntaTexto, puntaje, alternativas };
          }
          return null;
        })
        .filter((p) => p !== null);
    }
    console.log(
      "Preguntas Procesadas (Editar):",
      JSON.stringify(preguntasData, null, 2),
    );
    // --- Fin Re-procesamiento Adaptado ---

    // ¡Sobrescribimos completamente el array de preguntas!
    actividad.preguntas = preguntasData;

    await actividad.save();
    console.log("Actividad actualizada:", actividad.titulo);
    res.redirect("/profesor/actividades");
  } catch (error) {
    console.error("Error al actualizar actividad:", error);
    res.redirect(`/profesor/actividades/editar/${req.params.id}`);
  }
};

// 5. MANEJA la eliminación de una actividad
exports.handleEliminarActividad = async (req, res) => {
  try {
    const { actividadId } = req.body;
    const actividad = await Actividad.findById(actividadId);

    // Seguridad: Verificar propiedad
    if (!actividad) {
      return res.redirect("/profesor/actividades");
    }

    // Borrar la imagen asociada (si no es la de por defecto)
    if (actividad.imagenUrl !== "/images/default-activity.png") {
      fs.unlink(
        path.join(__dirname, `../public${actividad.imagenUrl}`),
        (err) => {
          if (err) console.error("Error al borrar imagen de actividad:", err);
        },
      );
    }

    // --- ¡LÍNEA CLAVE AÑADIDA! ---
    // 1. Borramos todos los registros de progreso asociados a esta actividad
    await Progreso.deleteMany({ actividadId: actividadId });
    // --- FIN DE LÍNEA AÑADIDA ---

    // 2. Borramos la actividad de la BD
    await Actividad.findByIdAndDelete(actividadId);

    console.log("Actividad y todo el progreso asociado eliminados");
    res.redirect("/profesor/actividades");
  } catch (error) {
    console.error("Error al eliminar actividad:", error);
    res.redirect("/profesor/actividades");
  }
};

exports.showReportes = (req, res) => {
  res.send("Página de Reportes - EN CONSTRUCCIÓN");
};

exports.showPerfil = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render("profesor/perfil_profesor", {
      // Renderiza la nueva vista
      active: "perfil",
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/profesor/dashboard");
  }
};

// 2. MANEJA la actualización de info
exports.handleUpdateInfo = async (req, res) => {
  try {
    // ¡MODIFICACIÓN! Ahora también aceptamos 'nombre'
    const { nombre, email } = req.body;
    const userId = req.session.user.id;

    const user = await User.findById(userId);
    user.nombre = nombre; // <-- Actualiza el nombre
    user.email = email;
    await user.save();

    // Actualizamos la sesión
    req.session.user.nombre = user.nombre; // <-- Actualiza el nombre en la sesión
    req.session.user.email = user.email;

    console.log("Información actualizada para (profesor):", user.email);
    res.redirect("/profesor/perfil");
  } catch (error) {
    console.error("Error al actualizar info:", error);
    res.redirect("/profesor/perfil");
  }
};

// 3. MANEJA la actualización de contraseña
// (Esta función es idéntica a la del estudiante)
exports.handleUpdatePassword = async (req, res) => {
  try {
    const { password_actual, password_nueva, password_confirmar } = req.body;
    const userId = req.session.user.id;
    if (password_nueva !== password_confirmar) {
      return res.redirect("/profesor/perfil");
    }
    const user = await User.findById(userId);
    const isMatch = await bcrypt.compare(password_actual, user.password);
    if (!isMatch) {
      return res.redirect("/profesor/perfil");
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password_nueva, salt);
    await user.save();
    console.log("Contraseña actualizada para (profesor):", user.email);
    res.redirect("/profesor/perfil");
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    res.redirect("/profesor/perfil");
  }
};

// 4. MANEJA la actualización de foto
// (Esta función es idéntica a la del estudiante)
exports.handleUpdatePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect("/profesor/perfil");
    }
    const avatarUrl = req.file.path.replace("public", "").replaceAll("\\", "/");
    const user = await User.findById(req.session.user.id);
    user.avatarUrl = avatarUrl;
    await user.save();
    req.session.user.avatarUrl = avatarUrl;
    console.log("Foto actualizada para (profesor):", user.email);
    res.redirect("/profesor/perfil");
  } catch (error) {
    console.error("Error al actualizar la foto:", error);
    res.redirect("/profesor/perfil");
  }
};

// 5. MANEJA la eliminación de foto
// (Esta función es idéntica a la del estudiante)
exports.handleDeletePhoto = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const defaultAvatar = "/images/default-avatar.png";
    const user = await User.findById(userId);
    user.avatarUrl = defaultAvatar;
    await user.save();
    req.session.user.avatarUrl = defaultAvatar;
    console.log("Foto eliminada para (profesor):", user.email);
    res.redirect("/profesor/perfil");
  } catch (error) {
    console.error("Error al eliminar la foto:", error);
    res.redirect("/profesor/perfil");
  }
};

// --- INTEGRACIÓN CON IA (ACTUALIZADO) ---
exports.generarContenidoIA = async (req, res) => {
  try {
    const {
      tema,
      grado,
      dificultad,
      cantidad_preguntas,
      cantidad_alternativas,
      puntaje_total,
    } = req.body;

    // --- CÓDIGO VIEJO (ELIMINAR) ---
    /*
    const response = await fetch("http://127.0.0.1:8000/generar-actividad", {
      ...
    });
    */

    // --- CÓDIGO NUEVO (INTEGRACIÓN DIRECTA) ---
    // Llamamos directamente a tu función en Node.js, sin HTTP fetch
    const data = await generarActividadLocal({
        tema,
        grado,
        dificultad,
        cantidad_preguntas: parseInt(cantidad_preguntas),
        cantidad_alternativas: parseInt(cantidad_alternativas),
        puntaje_total: parseInt(puntaje_total)
    });

    // Devolvemos la data directamente
    res.json({ success: true, data: data });

  } catch (error) {
    console.error("Error al generar con IA:", error);
    res.status(500).json({
      success: false,
      message: "Error en el servidor: " + error.message,
    });
  }
};
// ... importaciones existentes ...

exports.showReportes = async (req, res) => {
  try {
    const profesorId = req.session.user.id;

    // 1. Obtener todos los estudiantes
    const estudiantes = await User.find({ role: "estudiante" })
      .select("nombres apellidos email")
      .sort({ apellidos: 1 })
      .lean();

    // 2. Obtener todas las actividades de este profesor
    const actividades = await Actividad.find({ profesorId: profesorId })
      .select("titulo tema")
      .sort({ createdAt: -1 })
      .lean();

    // 3. Obtener todo el progreso registrado para estas actividades
    // (Optimizamos buscando solo lo necesario)
    const actividadesIds = actividades.map((a) => a._id);
    const progresos = await Progreso.find({
      actividadId: { $in: actividadesIds },
    }).lean();

    // 4. Crear un Mapa para acceso rápido: reporte[estudianteId][actividadId] = { nota, total }
    const mapaProgreso = {};

    progresos.forEach((p) => {
      const key = `${p.estudianteId.toString()}_${p.actividadId.toString()}`;
      mapaProgreso[key] = {
        obtenido: p.puntajeObtenido,
        posible: p.puntajeTotalPosible,
        porcentaje: Math.round(
          (p.puntajeObtenido / p.puntajeTotalPosible) * 100,
        ),
      };
    });

    res.render("profesor/reportes_profesor", {
      active: "reportes",
      user: req.session.user,
      estudiantes: estudiantes,
      actividades: actividades,
      mapaProgreso: mapaProgreso,
    });
  } catch (error) {
    console.error("Error al mostrar reportes:", error);
    res.redirect("/profesor/dashboard");
  }
};
