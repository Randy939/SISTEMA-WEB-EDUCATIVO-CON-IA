from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from core.generator import generar_actividad_ia

app = FastAPI()

# Modelo de datos ACTUALIZADO
class SolicitudActividad(BaseModel):
    tema: str
    grado: str
    dificultad: str
    cantidad_preguntas: int
    cantidad_alternativas: int
    puntaje_total: int  # <--- NUEVO CAMPO

@app.get("/")
def read_root():
    return {"estado": "Servicio de IA Activo (Comprensión Lectora) 📚"}

@app.post("/generar-actividad")
async def generar_actividad(solicitud: SolicitudActividad):
    """
    Endpoint que recibe los parámetros del profesor y devuelve la actividad generada.
    """
    try:
        # Pasamos el nuevo parámetro a la función generadora
        resultado = await generar_actividad_ia(
            tema=solicitud.tema,
            grado=solicitud.grado,
            dificultad=solicitud.dificultad,
            cant_preguntas=solicitud.cantidad_preguntas,
            cant_alternativas=solicitud.cantidad_alternativas,
            puntaje_total=solicitud.puntaje_total # <--- LO PASAMOS AQUÍ
        )
        
        if "error" in resultado:
            raise HTTPException(status_code=500, detail=resultado["error"])
            
        return resultado

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)