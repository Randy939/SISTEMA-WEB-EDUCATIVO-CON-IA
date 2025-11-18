window.addEventListener("pageshow", function (event) {
  // Comprueba si la página se cargó desde el bfcache (botón "Atrás")
  if (event.persisted) {
    // Espera a que el navegador termine de rellenar el formulario
    setTimeout(function () {
      // 1. Resetea el formulario
      const form = document.getElementById("forgotPasswordForm");
      if (form) {
        form.reset();
      }

      // 2. Borra manualmente el valor (doble seguridad)
      const emailInput = document.getElementById("email");
      if (emailInput) {
        emailInput.value = "";
      }
    }, 0);
  }
});
