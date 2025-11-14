// models/Progreso.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProgresoSchema = new Schema(
  {
    estudianteId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Referencia al modelo Usuario
      required: true,
    },
    actividadId: {
      type: Schema.Types.ObjectId,
      ref: "Actividad", // Referencia al modelo Actividad
      required: true,
    },
    // Guardaremos las respuestas del estudiante (ej: { preguntaId: '...', alternativaSeleccionadaId: '...' })
    // Por ahora, simplificaremos guardando solo el puntaje
    puntajeObtenido: {
      type: Number,
      required: true,
    },
    puntajeTotalPosible: {
      // Para calcular el porcentaje fácilmente
      type: Number,
      required: true,
    },
    fechaCompletado: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Índice para asegurar que un estudiante solo complete una actividad una vez
// (Puedes quitarlo si quieres permitir reintentos)
ProgresoSchema.index({ estudianteId: 1, actividadId: 1 }, { unique: true });

module.exports = mongoose.model("Progreso", ProgresoSchema);
