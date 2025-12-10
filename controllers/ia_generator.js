const { GoogleGenerativeAI } = require("@google/generative-ai");

// Configuración
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Usamos el modelo Flash que ya configuramos antes
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.generarActividadLocal = async (datos) => {
  const {
    tema,
    grado,
    dificultad,
    cantidad_preguntas,
    cantidad_alternativas,
    puntaje_total,
  } = datos;
  const puntaje_por_pregunta = puntaje_total / cantidad_preguntas;

  const prompt = `
    Actúa como un DOCENTE EXPERTO. Crea una actividad de comprensión lectora.
    Tema: ${tema}, Grado: ${grado}, Dificultad: ${dificultad}.
    Estructura: 1 Lectura + ${cantidad_preguntas} Preguntas.
    ${cantidad_alternativas} alternativas por pregunta.
    Puntaje Total: ${puntaje_total} (aprox ${puntaje_por_pregunta} c/u).

    RESPONDER SOLO CON JSON VÁLIDO CON ESTA ESTRUCTURA (sin markdown):
    {
        "titulo": "Título creativo",
        "tema": "${tema}",
        "dificultad": "${dificultad}",
        "descripcion": "Texto de la lectura...",
        "preguntas": [
            {
                "preguntaTexto": "¿Pregunta?",
                "puntaje": ${puntaje_por_pregunta},
                "alternativas": [
                    { "texto": "Alt 1", "esCorrecta": false },
                    { "texto": "Alt Correcta", "esCorrecta": true }
                ]
            }
        ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpieza básica de JSON (quitar bloques de código markdown si la IA los pone)
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Error IA Node:", error);
    throw new Error("Fallo al generar con IA");
  }
};
