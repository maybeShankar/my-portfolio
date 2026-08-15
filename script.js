const button = document.getElementById("theme-btn");

button.addEventListener("click", function () {

    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("light-mode")) {
        button.textContent = "☀️";
    } else {
        button.textContent = "🌙";
    }

});
const menuButton = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

menuButton.addEventListener("click", function () {
    navLinks.classList.toggle("active");
});