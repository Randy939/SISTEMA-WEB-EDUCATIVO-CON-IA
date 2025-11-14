// app.js

// Importar librerías
const express = require("express");
const path = require("node:path");
const connectDB = require("./config/database");
const session = require("express-session"); // <-- NUEVO
const MongoStore = require("connect-mongo"); // <-- NUEVO
const { mongoURI } = require("./config/key");
const helmet = require("helmet"); // <-- NUEVO (para la sesión)

// Importar nuestras rutas
const authRoutes = require("./routes/auth_Routes");
const studentRoutes = require("./routes/estudiante_Routes");
const professorRoutes = require("./routes/profesor_Routes");

// --- Conectar a la Base de Datos ---
connectDB(); // <-- 2. LLAMAR A LA FUNCIÓN DE CONEXIÓN

// Inicializar la aplicación de Express
const app = express();
const PORT = 3000;
// --- CONFIGURACIÓN DE EJS ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Middlewares ---
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- NUEVO MIDDLEWARE ANTI-CACHÉ ---
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
// --- FIN DEL MIDDLEWARE ANTI-CACHÉ ---

// --- CONFIGURACIÓN DE SESIÓN ---

// Variable para determinar si estamos en producción (para cookies seguras)
const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: "un-secreto-muy-secreto-para-firmar-la-cookie",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
    }),

    rolling: true,
    // --- ¡NUEVA CONFIGURACIÓN DE COOKIE SEGURA! ---
    cookie: {
      secure: isProduction, // true = solo enviar sobre HTTPS (en producción)
      httpOnly: true, // Previene acceso desde JS en el cliente (es el default, pero es bueno ser explícito)
      sameSite: "strict", // Mitiga ataques CSRF. La cookie solo se envía en el mismo sitio.
    },
  }),
);

// --- Rutas ---
app.use("/", authRoutes);
app.use("/", studentRoutes);
app.use("/", professorRoutes);

app.get("/", (req, res) => {
  res.redirect("/login");
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`¡Servidor escuchando en http://localhost:${PORT}`);
});
