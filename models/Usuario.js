// models/User.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Definimos la estructura (el "esquema") de nuestro usuario
const UserSchema = new Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100, // <-- AÑADIDO: Límite de 100 caracteres
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254, // <-- AÑADIDO: Límite estándar para emails
  },
  password: {
    type: String,
    required: true, // La contraseña es obligatoria
  },
  role: {
    type: String,
    required: true,
    enum: ["estudiante", "profesor"], // Solo puede ser uno de estos dos valores
    default: "estudiante", // Si no se especifica, será 'estudiante'
  },
  avatarUrl: {
    type: String,
    default: "/images/default-avatar.png", // Usa la foto por defecto
  },

  // --- NUEVOS CAMPOS PARA BLOQUEO ---
  loginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null, // null significa que no está bloqueado
  },

  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },

  fechaRegistro: {
    type: Date,
    default: Date.now, // Guarda la fecha de creación automáticamente
  },
});

// Creamos el modelo y lo exportamos
// Mongoose tomará 'User', lo pondrá en minúscula y plural ('users')
// y ese será el nombre de la "colección" (tabla) en la BD.
module.exports = mongoose.model("User", UserSchema);
