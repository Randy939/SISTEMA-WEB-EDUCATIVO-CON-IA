// Archivo principal de la aplicación Express.

// Carga las variables de entorno desde .env.
require("dotenv").config();

// --- 1. Importaciones de Módulos ---
const express = require("express");
const path = require("node:path"); // Para manejar rutas de archivos.
const connectDB = require("./config/database"); // Nuestra función de conexión a BD.
const session = require("express-session"); // Para manejar sesiones de usuario.
const MongoStore = require("connect-mongo"); // Para guardar sesiones en MongoDB.
const helmet = require("helmet"); // Para seguridad básica (headers HTTP).
const rateLimit = require("express-rate-limit"); // Para prevenir ataques de fuerza bruta/DoS.

// --- 2. Importaciones de Rutas ---
const authRoutes = require("./routes/auth_Routes");
const studentRoutes = require("./routes/estudiante_Routes");
const professorRoutes = require("./routes/profesor_Routes");

// --- 3. Conexión a Base de Datos ---
connectDB();

// --- 4. Inicialización de Express ---
const app = express();
const PORT = 3000; // Puerto en el que correrá el servidor.

// --- 5. Configuración del Motor de Vistas (EJS) ---
app.set("view engine", "ejs"); // Usa EJS como motor de plantillas.
app.set("views", path.join(__dirname, "views")); // Define la carpeta de vistas.

// --- 6. Middlewares Globales ---

// Configura Content Security Policy (CSP) para prevenir ataques XSS.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Permite recursos del propio dominio.
      // (¡ADVERTENCIA! 'unsafe-inline' es necesario para el CDN de Tailwind)
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "'unsafe-inline'", // (Necesario para estilos inline)
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"], // Bloquea plugins (Flash, etc.).
      upgradeInsecureRequests: [], // Pide HTTPS.
    },
  }),
);

// Middlewares para parsear (leer) datos de formularios y JSON.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sirve archivos estáticos (CSS, JS, imágenes) desde la carpeta 'public'.
app.use(express.static(path.join(__dirname, "public")));

// Middleware Anti-Caché para prevenir que se guarden páginas seguras.
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// --- 7. Configuración de Sesión ---
const isProduction = process.env.NODE_ENV === "production";
const mongoURI = process.env.MONGO_URI;

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secreto para firmar la cookie (desde .env).
    resave: false, // No volver a guardar si no hay cambios.
    saveUninitialized: false, // No guardar sesiones vacías.
    store: MongoStore.create({
      // Almacena la sesión en MongoDB.
      mongoUrl: mongoURI,
    }),
    rolling: true, // Resetea el tiempo de expiración en cada petición.
    cookie: {
      secure: isProduction, // 'true' en producción (solo HTTPS).
      httpOnly: true, // Previene acceso a la cookie desde JS.
      sameSite: "lax", // Protección CSRF.
    },
  }),
);

// --- 8. Configuración de Rate Limiter (Seguridad) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos.
  max: 100, // Límite de 100 peticiones por IP en esa ventana.
  message:
    "Demasiadas solicitudes desde esta IP, por favor inténtalo de nuevo.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplica el limitador solo a las rutas de autenticación.
app.use("/login", authLimiter);
app.use("/registro", authLimiter);
app.use("/forgot-password", authLimiter);
app.use("/reset-password", authLimiter);

// --- 9. Rutas de la Aplicación ---
app.use("/", authRoutes); // Rutas de autenticación.
app.use("/", studentRoutes); // Rutas de estudiantes.
app.use("/", professorRoutes); // Rutas de profesores.

// Ruta raíz: Redirige automáticamente al login.
app.get("/", (req, res) => {
  res.redirect("/login");
});

// --- 10. Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`¡Servidor escuchando en http://localhost:${PORT}`);
});
