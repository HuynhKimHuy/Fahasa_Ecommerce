document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-confirm]").forEach((element) => {
    element.addEventListener("click", (event) => {
      const message =
        element.getAttribute("data-confirm") ||
        "Bạn có chắc chắn muốn thực hiện hành động này?";
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });
});
