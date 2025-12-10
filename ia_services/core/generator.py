import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Usamos el modelo validado
model = genai.GenerativeModel('gemini-flash-latest')

def limpiar_respuesta_json(texto):
    """Busca el primer '{' y el último '}' para extraer solo el JSON."""
    try:
        match = re.search(r'\{[\s\S]*\}', texto)
        if match:
            return match.group(0)
        return texto
    except Exception:
        return texto

async def generar_actividad_ia(tema: str, grado: str, dificultad: str, cant_preguntas: int, cant_alternativas: int, puntaje_total: int):
    
    # 1. CÁLCULO MATEMÁTICO EN PYTHON (Más seguro)
    # Calculamos cuánto debe valer cada pregunta.
    # Si no es exacto, la IA manejará los decimales o redondeará, pero le damos la guía base.
    puntaje_por_pregunta = puntaje_total / cant_preguntas
    
    # 2. PROMPT REFORMULADO PARA COMPRENSIÓN LECTORA
    prompt = f"""
    Actúa como un DOCENTE EXPERTO EN LENGUA Y LITERATURA especializado en Comprensión Lectora.
    Tu tarea es crear una actividad de evaluación basada en un texto original.

    PARÁMETROS DE LA ACTIVIDAD:
    - Tema del texto: {tema}
    - Público objetivo: Estudiantes de {grado}
    - Nivel de complejidad: {dificultad}
    - Estructura: 1 Lectura + {cant_preguntas} Preguntas de comprensión.
    - Alternativas por pregunta: {cant_alternativas}.
    
    DISTRIBUCIÓN DEL PUNTAJE:
    - Puntaje Total de la Actividad: {puntaje_total} puntos.
    - Valor de cada pregunta: {puntaje_por_pregunta} puntos. (Asigna este valor a la propiedad "puntaje" de cada pregunta).

    INSTRUCCIONES DE CONTENIDO:
    1. El texto "descripcion" debe ser una lectura narrativa, expositiva o argumentativa adecuada para el grado escolar. No debe ser una lista de datos, sino un texto fluido que permita evaluar la comprensión.
    2. Las preguntas deben evaluar diferentes niveles de comprensión (literal, inferencial y crítico).
    3. Asegúrate de que SOLO UNA alternativa sea correcta.

    FORMATO DE SALIDA (JSON PURO OBLIGATORIO):
    Responde ÚNICAMENTE con el objeto JSON. Sin markdown, sin explicaciones previas.
    
    {{
        "titulo": "Un título creativo para la lectura",
        "tema": "{tema}",
        "dificultad": "{dificultad}",
        "descripcion": "Aquí va el cuerpo completo del texto de lectura (mínimo 3 párrafos)...",
        "preguntas": [
            {{
                "preguntaTexto": "¿Pregunta de comprensión sobre el texto?",
                "puntaje": {puntaje_por_pregunta},
                "alternativas": [
                    {{ "texto": "Distractor 1", "esCorrecta": false }},
                    {{ "texto": "Respuesta Correcta", "esCorrecta": true }},
                    ... (hasta completar {cant_alternativas} alternativas)
                ]
            }}
            ... (hasta completar {cant_preguntas} preguntas)
        ]
    }}
    """

    try:
        response = await model.generate_content_async(prompt)
        
        print(f"\n🤖 Respuesta cruda de Gemini: {response.text[:100]}...") 

        texto_limpio = limpiar_respuesta_json(response.text)
        datos_json = json.loads(texto_limpio)
        
        return datos_json

    except json.JSONDecodeError:
        print(f"\n❌ ERROR DE PARSEO JSON.\nLa IA respondió esto:\n{response.text}\n")
        return {"error": "La IA generó una respuesta que no es JSON válido."}
    except Exception as e:
        print(f"\n❌ OTRO ERROR: {str(e)}")
        return {"error": str(e)}