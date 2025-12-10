document.addEventListener("DOMContentLoaded", () => {
  // 1. Obtener referencias a los elementos
  const tabPendientes = document.getElementById("tab-pendientes");
  const tabCompletadas = document.getElementById("tab-completadas");
  const sectionPendientes = document.getElementById("section-pendientes");
  const sectionCompletadas = document.getElementById("section-completadas");

  // Verifica que los elementos existan para evitar errores
  if (
    !tabPendientes ||
    !tabCompletadas ||
    !sectionPendientes ||
    !sectionCompletadas
  ) {
    console.error("Error: No se encontraron los elementos de las pestañas.");
    return;
  }

  // 2. Función para activar la pestaña de Pendientes
  function showPendientes(e) {
    if (e) e.preventDefault(); // Evita el salto de página del enlace

    // Actualizar estilos de los botones
    tabPendientes.classList.add("active");
    tabCompletadas.classList.remove("active");

    // Mostrar/Ocultar secciones
    sectionPendientes.classList.remove("hidden");
    sectionCompletadas.classList.add("hidden");
  }

  // 3. Función para activar la pestaña de Completadas
  function showCompletadas(e) {
    if (e) e.preventDefault();

    // Actualizar estilos de los botones
    tabPendientes.classList.remove("active");
    tabCompletadas.classList.add("active");

    // Mostrar/Ocultar secciones
    sectionPendientes.classList.add("hidden");
    sectionCompletadas.classList.remove("hidden");
  }

  // 4. Asignar los eventos "click"
  tabPendientes.addEventListener("click", showPendientes);
  tabCompletadas.addEventListener("click", showCompletadas);
});
