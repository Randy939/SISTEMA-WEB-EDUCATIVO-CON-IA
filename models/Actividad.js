// models/Actividad.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// --- Sub-esquema para las Alternativas ---
const AlternativaSchema = new Schema({
  texto: {
    type: String,
    required: true,
  },
  esCorrecta: {
    type: Boolean,
    required: true,
    default: false,
  },
});

// --- Sub-esquema para las Preguntas ---
const PreguntaSchema = new Schema({
  preguntaTexto: {
    type: String,
    required: true,
  },
  puntaje: {
    type: Number,
    required: true,
    default: 10,
  },
  alternativas: [AlternativaSchema], // Un array de alternativas
});

// --- Esquema Principal de la Actividad ---
const ActividadSchema = new Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    tema: {
      type: String,
      required: true,
    },
    dificultad: {
      type: String,
      required: true,
      enum: ["Fácil", "Intermedio", "Difícil"],
    },
    imagenUrl: {
      type: String,
      default: "/images/default-activity.png",
    },
    profesorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- ¡CAMPO NUEVO AÑADIDO! ---
    // Un array de Preguntas, usando el esquema que definimos arriba
    preguntas: [PreguntaSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Actividad", ActividadSchema);
