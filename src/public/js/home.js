document.addEventListener("DOMContentLoaded", () => {
  const slideWrap = document.querySelector(".promo-slide-wrap");
  const sliderTrack = slideWrap?.querySelector(".js-promo-slider");
  const slides = sliderTrack?.querySelectorAll(".promo-slider__item") ?? [];
  const prevBtn = slideWrap?.querySelector(".js-promo-prev");
  const nextBtn = slideWrap?.querySelector(".js-promo-next");

  if (!sliderTrack || slides.length === 0) {
    return;
  }

  let activeIndex = 0;

  const updateSlide = () => {
    sliderTrack.style.transform = `translateX(-${activeIndex * 100}%)`;
  };

  const goToPrev = () => {
    activeIndex = (activeIndex - 1 + slides.length) % slides.length;
    updateSlide();
  };

  const goToNext = () => {
    activeIndex = (activeIndex + 1) % slides.length;
    updateSlide();
  };
  // ⭐ TỰ ĐỘNG CHẠY SAU VÀI GIÂY
  const AUTO_DELAY = 3000; // 3000ms = 3 giây

  const autoPlay = () => {
    setInterval(() => {
      goToNext(); // mỗi lần gọi là nhảy sang slide kế tiếp
    }, AUTO_DELAY);
  };

  autoPlay();

  prevBtn?.addEventListener("click", goToPrev);
  nextBtn?.addEventListener("click", goToNext);

  const flashSaleWrap = document.querySelector(".flash-sale__carousel");
  const flashSaleList = flashSaleWrap?.querySelector(".js-flash-sale-list");
  const flashSalePrev = flashSaleWrap?.querySelector(".js-flash-sale-prev");
  const flashSaleNext = flashSaleWrap?.querySelector(".js-flash-sale-next");

  const scrollFlashSale = (direction) => {
    if (!flashSaleList) {
      return;
    }

    const firstItem = flashSaleList.querySelector(".flash-sale__item");
    const gap = 12; // matches the spacing defined in SCSS
    const step = (firstItem?.offsetWidth ?? flashSaleList.clientWidth) + gap;
    if (!step) {
      return;
    }

    flashSaleList.scrollBy({
      left: step * direction,
      behavior: "smooth",
    });
  };

  flashSalePrev?.addEventListener("click", () => scrollFlashSale(-1));
  flashSaleNext?.addEventListener("click", () => scrollFlashSale(1));

  const setupNavDropdown = () => {
    const wrapper = document.querySelector("[data-nav-menu]");
    const toggle = wrapper?.querySelector("[data-nav-toggle]");
    const dropdown = wrapper?.querySelector("[data-nav-dropdown]");
    if (!wrapper || !toggle || !dropdown) return;

    const close = () => wrapper.classList.remove("is-open");
    const open = () => wrapper.classList.add("is-open");

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      wrapper.classList.toggle("is-open");
    });

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
      }
    });
  };

  setupNavDropdown();

  const setupMobileDrawer = () => {
    const drawer = document.querySelector("[data-drawer]");
    const overlay = document.querySelector("[data-drawer-overlay]");
    const openBtn = document.querySelector("[data-drawer-open]");
    const closeBtn = document.querySelector("[data-drawer-close]");
    const body = document.body;

    if (!drawer || !overlay || !openBtn) return;

    const openDrawer = () => {
      drawer.classList.add("is-open");
      overlay.classList.add("is-visible");
      body.classList.add("is-drawer-open");
    };

    const closeDrawer = () => {
      drawer.classList.remove("is-open");
      overlay.classList.remove("is-visible");
      body.classList.remove("is-drawer-open");
    };

    openBtn.addEventListener("click", (event) => {
      event.preventDefault();
      openDrawer();
    });

    closeBtn?.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    });
  };

  const setupAccordions = () => {
    const accordions = document.querySelectorAll("[data-accordion]");
    if (!accordions.length) return;

    accordions.forEach((accordion) => {
      const trigger = accordion.querySelector("[data-accordion-toggle]");
      const panel = accordion.querySelector("[data-accordion-panel]");
      if (!trigger || !panel) return;

      trigger.addEventListener("click", () => {
        const isOpen = accordion.classList.contains("is-open");
        accordions.forEach((item) => item.classList.remove("is-open"));
        if (!isOpen) {
          accordion.classList.add("is-open");
        }
      });
    });

    accordions[0]?.classList.add("is-open");
  };

  const setupFlashSaleCountdown = () => {
    const countdownEl = document.querySelector("[data-countdown]");
    if (!countdownEl) return;

    const timeBoxes = countdownEl.querySelectorAll(".time-box");
    const labelEl = document.querySelector("[data-countdown-label]");
    const endTimeStr = countdownEl.getAttribute("data-end-time");
    if (!endTimeStr || timeBoxes.length < 3) return;

    const endTime = new Date(endTimeStr);
    if (Number.isNaN(endTime.getTime())) return;

    const setDisplay = (hours, minutes, seconds) => {
      timeBoxes[0].textContent = String(hours).padStart(2, "0");
      timeBoxes[1].textContent = String(minutes).padStart(2, "0");
      timeBoxes[2].textContent = String(seconds).padStart(2, "0");
    };

    const markEnded = () => {
      labelEl && (labelEl.textContent = "Flash Sale đã kết thúc");
      labelEl?.classList.add("is-ended");
    };

    const updateCountdown = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setDisplay(0, 0, 0);
        markEnded();
        return false;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setDisplay(hours, minutes, seconds);
      return true;
    };

    let stillRunning = updateCountdown();
    if (!stillRunning) return;

    const interval = setInterval(() => {
      const running = updateCountdown();
      if (!running) {
        clearInterval(interval);
      }
    }, 1000);
  };

  const setupCategoryCarousels = () => {
    const carousels = document.querySelectorAll("[data-carousel]");
    if (!carousels.length) return;

    carousels.forEach((carousel) => {
      const list = carousel.querySelector("[data-carousel-list]");
      const prev = carousel.querySelector("[data-carousel-prev]");
      const next = carousel.querySelector("[data-carousel-next]");
      if (!list) return;

      const scrollStep = () => {
        const firstItem = list.querySelector(".flash-sale__item");
        const gap = 12;
        return (firstItem?.offsetWidth ?? list.clientWidth) + gap;
      };

      const scrollByDir = (dir) => {
        const step = scrollStep();
        list.scrollBy({ left: step * dir, behavior: "smooth" });
      };

      prev?.addEventListener("click", () => scrollByDir(-1));
      next?.addEventListener("click", () => scrollByDir(1));
    });
  };

  setupMobileDrawer();
  setupAccordions();
  setupFlashSaleCountdown();
  setupCategoryCarousels();
});
const snowContainer = document.getElementById("snow-container");

if (snowContainer) {
  const spawnSnow = () => {
    const snow = document.createElement("div");
    snow.className = "snowflake";

    const size = Math.random() * 5 + 3;
    const startX = Math.random() * window.innerWidth;
    const duration = Math.random() * 6 + 4;

    snow.style.width = `${size}px`;
    snow.style.height = `${size}px`;
    snow.style.left = `${startX}px`;
    snow.style.animationDuration = `${duration}s`;

    snowContainer.appendChild(snow);

    snow.addEventListener("animationend", () => {
      snow.remove();
    });
  };

  const snowTimer = setInterval(spawnSnow, 250);

  window.addEventListener("beforeunload", () => clearInterval(snowTimer));
}
