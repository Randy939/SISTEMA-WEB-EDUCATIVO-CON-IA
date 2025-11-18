// Gestiona la conexión a la base de datos MongoDB.
const mongoose = require("mongoose");

// Lee la URL de la base de datos desde las variables de entorno (.env).
const mongoURI = process.env.MONGO_URI;

//Intenta conectarse a la base de datos usando mongoose.
const connectDB = async () => {
  try {
    // Seguridad: Verifica que la variable MONGO_URI exista.
    if (!mongoURI) {
      throw new Error("MONGO_URI no está definida en .env");
    }

    // Conecta a la base de datos.
    await mongoose.connect(mongoURI);
    console.log("¡Conexión a MongoDB Atlas exitosa!");
  } catch (err) {
    // Si la conexión falla, muestra el error y detiene la aplicación.
    console.error("Error al conectar a MongoDB:", err.message);
    process.exit(1); // Sale del proceso con código de error.
  }
};

// Exporta la función para ser usada en app.js.
module.exports = connectDB;
