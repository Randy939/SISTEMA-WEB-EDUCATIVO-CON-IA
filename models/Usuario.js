// Define el esquema de Mongoose para la colección de 'Usuarios'.

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Definimos la estructura (el "esquema") de nuestro usuario.
const UserSchema = new Schema({
  nombre: {
    type: String,
    required: true, // Este campo es obligatorio.
    trim: true, // Limpia espacios en blanco al inicio y al final.
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true, // No puede haber dos usuarios con el mismo email.
    lowercase: true, // Almacena el email siempre en minúsculas.
    trim: true,
    maxlength: 254, // Límite estándar para emails.
  },
  password: {
    type: String,
    required: true, // La contraseña hasheada es obligatoria.
  },
  role: {
    type: String,
    required: true,
    enum: ["estudiante", "profesor"], // Solo permite estos dos valores.
    default: "estudiante", // Valor por defecto si no se especifica.
  },
  avatarUrl: {
    type: String,
    default: "/images/default-avatar.png", // Imagen de perfil por defecto.
  },

  // --- Campos para el bloqueo de cuenta (Seguridad) ---
  loginAttempts: {
    type: Number,
    required: true,
    default: 0, // Inicia en 0 intentos fallidos.
  },
  lockUntil: {
    type: Date,
    default: null, // 'null' significa que la cuenta no está bloqueada.
  },

  // --- Campos para el reseteo de contraseña (Seguridad) ---
  resetPasswordToken: {
    type: String,
    default: null, // Token para resetear la contraseña.
  },
  resetPasswordExpires: {
    type: Date,
    default: null, // Fecha de expiración del token.
  },

  // --- Timestamp ---
  fechaRegistro: {
    type: Date,
    default: Date.now, // Guarda la fecha de creación automáticamente.
  },
});

// Creamos el modelo a partir del esquema y lo exportamos.
// Mongoose llamará a la colección 'users' (plural y minúscula de 'User').
module.exports = mongoose.model("User", UserSchema);
