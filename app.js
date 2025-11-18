// app.js
require("dotenv").config();
// Importar librerías
const express = require("express");
const path = require("node:path");
const connectDB = require("./config/database");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoURI = process.env.MONGO_URI;
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

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
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      // Por defecto, solo permite cosas de tu propio dominio ('self')
      defaultSrc: ["'self'"],

      // Scripts: Permite 'self', Tailwind CDN, y 'unsafe-inline'
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"],

      // Estilos: Permite 'self', Google Fonts, y 'unsafe-inline'
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],

      // Fuentes: Permite 'self' y el dominio de Google Fonts
      fontSrc: ["'self'", "https://fonts.gstatic.com"],

      // Imágenes: Permite 'self' y 'data:'
      imgSrc: ["'self'", "data:"],

      // No permite plugins como Flash
      objectSrc: ["'none'"],

      // Pide a los navegadores que usen HTTPS
      upgradeInsecureRequests: [],
    },
  }),
);

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
    secret: process.env.SESSION_SECRET,
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
      sameSite: "lax", // Mitiga ataques CSRF. La cookie solo se envía en el mismo sitio.
    },
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP cada 15 min
  message:
    "Demasiadas solicitudes desde esta IP, por favor inténtalo de nuevo después de 15 minutos",
  standardHeaders: true, // Envía headers estándar
  legacyHeaders: false, // Deshabilita headers antiguos
});

app.use("/login", authLimiter);
app.use("/registro", authLimiter);
app.use("/forgot-password", authLimiter);
app.use("/reset-password", authLimiter);
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
