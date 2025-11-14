// public/js/tabs_actividades.js
document.addEventListener("DOMContentLoaded", () => {
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");

  // Clases para el estado activo/inactivo de las TABS
  const activeTabClasses = ["border-b-primary", "text-primary"];
  const inactiveTabClasses = [
    "border-b-transparent",
    "text-[#4e7397]",
    "dark:text-slate-400",
    "hover:text-primary",
    "dark:hover:text-primary",
  ];

  function switchTab(targetId) {
    // targetId viene como '#pendientes' o '#completadas'
    console.log("Switching to:", targetId);

    // --- CORRECCIÓN CLAVE: Mapear el href al ID de la sección ---
    // Construimos el ID de la sección que queremos mostrar
    // Ej: Si targetId es '#pendientes', sectionTargetId será 'section-pendientes'
    const sectionTargetId = `section-${targetId.substring(1)}`;
    // --- FIN DE CORRECCIÓN ---

    tabLinks.forEach((link) => {
      const linkTarget = link.getAttribute("href");
      // Quitar clases activas y añadir inactivas (esto estaba bien)
      link.classList.remove(...activeTabClasses);
      link.classList.add(...inactiveTabClasses);

      // Si es el link clickeado, hacer lo opuesto (esto estaba bien)
      if (linkTarget === targetId) {
        link.classList.remove(...inactiveTabClasses);
        link.classList.add(...activeTabClasses);
      }
    });

    tabContents.forEach((content) => {
      // Ocultar todos los contenidos (esto estaba bien)
      content.classList.add("hidden");

      // --- CORRECCIÓN CLAVE: Comparar ID de contenido con el ID mapeado ---
      // Comparamos el ID del div (ej: 'section-pendientes') con el ID que construimos
      if (content.id === sectionTargetId) {
        console.log("Showing:", content.id);
        content.classList.remove("hidden"); // Mostrar el correcto
      }
      // --- FIN DE CORRECCIÓN ---
    });
  }

  // Estado inicial: mostrar pendientes (esto estaba bien)
  switchTab("#pendientes");

  // Añadir listeners a los links (esto estaba bien)
  tabLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href");
      switchTab(targetId);
    });
  });
});
