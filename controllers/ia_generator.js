// utils/ia_generator.js (o donde lo tengas guardado)
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
  
  const puntaje_por_pregunta = (puntaje_total / cantidad_preguntas).toFixed(2); // Redondeamos para evitar decimales largos

  const prompt = `
    Actúa como un DOCENTE EXPERTO. Crea una actividad de comprensión lectora.
    Tema: ${tema}, Grado: ${grado}, Dificultad: ${dificultad}.
    Estructura: 1 Lectura + ${cantidad_preguntas} Preguntas.
    ${cantidad_alternativas} alternativas por pregunta.
    Puntaje Total: ${puntaje_total} (aprox ${puntaje_por_pregunta} c/u).

    IMPORTANTE:
    RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO.
    NO uses bloques de código markdown (\`\`\`json).
    NO escribas texto introductorio ni conclusiones.

    Estructura JSON requerida:
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

    console.log("Respuesta IA cruda:", text.substring(0, 100) + "..."); // Debug

    // --- LIMPIEZA ROBUSTA (Igual que en Python) ---
    // Busca desde la primera llave { hasta la última }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
        text = jsonMatch[0];
    } else {
        throw new Error("La IA no devolvió un JSON válido");
    }
    // ----------------------------------------------

    return JSON.parse(text);

  } catch (error) {
    console.error("Error IA Node:", error);
    // Lanzamos el error original para ver detalles en el log del servidor
    throw error; 
  }
};
