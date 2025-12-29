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

  const setupAdminSidebar = () => {
    const sidebar = document.querySelector("[data-admin-sidebar]");
    const overlay = document.querySelector("[data-admin-sidebar-overlay]");
    if (!sidebar || !overlay) return;

    const openButtons = document.querySelectorAll("[data-admin-sidebar-open]");
    const closeButtons = document.querySelectorAll("[data-admin-sidebar-close]");
    const dragHandle = sidebar.querySelector("[data-admin-sidebar-drag]");

    const openSidebar = () => {
      sidebar.classList.add("is-open");
      overlay.classList.add("is-visible");
      document.body.classList.add("is-admin-sidebar-open");
    };

    const closeSidebar = () => {
      sidebar.classList.remove("is-open");
      overlay.classList.remove("is-visible");
      document.body.classList.remove("is-admin-sidebar-open");
    };

    openButtons.forEach((btn) =>
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        openSidebar();
      })
    );

    closeButtons.forEach((btn) =>
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        closeSidebar();
      })
    );

    overlay.addEventListener("click", closeSidebar);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    });

    // Drag-to-close (mobile) when sidebar is open
    if (dragHandle) {
      let startX = 0;
      let currentX = 0;
      let isDragging = false;
      let sidebarWidth = sidebar.getBoundingClientRect().width;

      const onPointerMove = (event) => {
        if (!isDragging) return;
        currentX = event.clientX ?? (event.touches && event.touches[0]?.clientX) ?? 0;
        const delta = Math.min(0, currentX - startX);
        sidebar.style.transform = `translateX(${delta}px)`;
      };

      const onPointerUp = () => {
        if (!isDragging) return;
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
        isDragging = false;

        const delta = currentX - startX;
        sidebar.style.transform = "";
        if (delta < -sidebarWidth * 0.25) {
          closeSidebar();
        }
      };

      dragHandle.addEventListener("pointerdown", (event) => {
        if (!sidebar.classList.contains("is-open")) return;
        sidebarWidth = sidebar.getBoundingClientRect().width;
        startX = event.clientX ?? 0;
        currentX = startX;
        isDragging = true;
        sidebar.style.transition = "none";
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
      });

      dragHandle.addEventListener("touchstart", (event) => {
        if (!sidebar.classList.contains("is-open")) return;
        sidebarWidth = sidebar.getBoundingClientRect().width;
        startX = event.touches[0]?.clientX ?? 0;
        currentX = startX;
        isDragging = true;
        sidebar.style.transition = "none";
        document.addEventListener("touchmove", onPointerMove);
        document.addEventListener("touchend", onPointerUp, { once: true });
      });

      document.addEventListener("pointerup", () => {
        sidebar.style.transition = "";
      });
      document.addEventListener("touchend", () => {
        sidebar.style.transition = "";
      });
    }
  };

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

  setupAdminSidebar();
});
