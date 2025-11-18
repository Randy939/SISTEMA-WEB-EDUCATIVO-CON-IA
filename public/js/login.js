document.addEventListener("DOMContentLoaded", function () {
  const passwordInput = document.getElementById("password");
  const toggleButton = document.getElementById("togglePasswordBtn");
  const toggleIcon = document.getElementById("togglePasswordIcon");

  if (toggleButton && passwordInput && toggleIcon) {
    toggleButton.addEventListener("click", function () {
      // Comprueba el tipo de input actual
      const type =
        passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);

      // Cambia el icono
      if (type === "password") {
        toggleIcon.textContent = "visibility_off";
      } else {
        toggleIcon.textContent = "visibility";
      }
    });
  }
  const loginForm = document.getElementById("loginForm");
  const submitButton = document.getElementById("submitButton");

  if (loginForm && submitButton) {
    // Escuchamos el evento 'submit' del formulario
    loginForm.addEventListener("submit", function () {
      // 1. Deshabilitamos el botón para evitar clics dobles
      submitButton.disabled = true;

      // 2. Cambiamos el contenido del botón para mostrar un spinner
      //    (Usamos un SVG de spinner simple que funciona con Tailwind)
      submitButton.innerHTML = `<svg class="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="truncate">Iniciando sesión...</span>`;
    });
  }
});

// SCRIPT PARA BUSTEAR EL BACK-FORWARD CACHE
window.addEventListener("pageshow", function (event) {
  // 'event.persisted' es 'true' si la página se cargó
  // desde el bfcache (ej. al presionar "Atrás" o "Adelante")
  if (event.persisted) {
    // Forzamos una recarga completa de la página desde el servidor.
    // El 'true' asegura que no use la caché del navegador.
    window.location.reload(true);
  }
});
