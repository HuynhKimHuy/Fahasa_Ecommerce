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

  const refreshContainer = document.querySelector("[data-order-auto-refresh]");
  if (refreshContainer) {
    const refreshBtn = refreshContainer.querySelector("[data-order-refresh]");
    const toggle = refreshContainer.querySelector("[data-auto-refresh-toggle]");
    const intervalMs = Number(refreshContainer.getAttribute("data-refresh-interval")) || 20000;
    let timerId = null;

    const reloadPage = () => {
      window.location.reload();
    };

    const startAuto = () => {
      clearInterval(timerId);
      timerId = window.setInterval(reloadPage, intervalMs);
      refreshContainer.classList.add("is-live");
    };

    const stopAuto = () => {
      clearInterval(timerId);
      timerId = null;
      refreshContainer.classList.remove("is-live");
    };

    if (toggle) {
      toggle.addEventListener("change", () => {
        if (toggle.checked) {
          startAuto();
        } else {
          stopAuto();
        }
      });
      if (toggle.checked) {
        startAuto();
      }
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", reloadPage);
    }
  }

  document.querySelectorAll("[data-sidebar-accordion]").forEach((sidebar) => {
    const sections = Array.from(
      sidebar.querySelectorAll("[data-accordion-section]")
    );

    const openSection = (name) => {
      sections.forEach((section) => {
        const isMatch = section.getAttribute("data-accordion-section") === name;
        section.classList.toggle("is-open", isMatch);
      });
    };

    sidebar.querySelectorAll("[data-accordion-open]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const target = chip.getAttribute("data-accordion-open");
        openSection(target);
        sidebar
          .querySelectorAll(".admin-sidebar__chip")
          .forEach((btn) => btn.classList.remove("is-active"));
        chip.classList.add("is-active");
      });
    });

    sidebar.querySelectorAll("[data-accordion-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const section = button.closest("[data-accordion-section]");
        if (!section) return;
        const isOpen = section.classList.contains("is-open");
        sections.forEach((sec) => sec.classList.remove("is-open"));
        section.classList.toggle("is-open", !isOpen);
      });
    });
  });
});
