// config/database.js

const mongoose = require("mongoose");
const { mongoURI } = require("./key"); // Importamos nuestra URL secreta

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("¡Conexión a MongoDB Atlas exitosa!");
  } catch (err) {
    console.error("Error al conectar a MongoDB:", err.message);
    // Salir del proceso si no nos podemos conectar
    process.exit(1);
  }
};

module.exports = connectDB;
