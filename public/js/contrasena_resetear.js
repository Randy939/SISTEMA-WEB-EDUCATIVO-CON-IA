// Esperamos a que la página cargue, igual que en login.ejs
document.addEventListener("DOMContentLoaded", function () {
  // --- Lógica para el PRIMER campo: "Nueva Contraseña" ---
  const passwordInput1 = document.getElementById("password");
  const toggleButton1 = document.getElementById("togglePasswordBtn1");
  const toggleIcon1 = document.getElementById("togglePasswordIcon1");

  if (toggleButton1 && passwordInput1 && toggleIcon1) {
    toggleButton1.addEventListener("click", function () {
      // Comprueba el tipo de input
      const type =
        passwordInput1.getAttribute("type") === "password"
          ? "text"
          : "password";
      passwordInput1.setAttribute("type", type);

      // Cambia el icono
      if (type === "password") {
        toggleIcon1.textContent = "visibility_off";
      } else {
        toggleIcon1.textContent = "visibility";
      }
    });
  }

  // --- Lógica para el SEGUNDO campo: "Confirmar Contraseña" ---
  const passwordInput2 = document.getElementById("confirmPassword");
  const toggleButton2 = document.getElementById("togglePasswordBtn2");
  const toggleIcon2 = document.getElementById("togglePasswordIcon2");

  if (toggleButton2 && passwordInput2 && toggleIcon2) {
    toggleButton2.addEventListener("click", function () {
      // Comprueba el tipo de input
      const type =
        passwordInput2.getAttribute("type") === "password"
          ? "text"
          : "password";
      passwordInput2.setAttribute("type", type);

      // Cambia el icono
      if (type === "password") {
        toggleIcon2.textContent = "visibility_off";
      } else {
        toggleIcon2.textContent = "visibility";
      }
    });
  }
});
