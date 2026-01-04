document.addEventListener("DOMContentLoaded", () => {
  const setupAlertModals = () => {
    const modals = document.querySelectorAll(".alert-modal");
    if (!modals.length) return;

    const closeModal = (modal) => {
      modal.classList.add("is-hiding");
      setTimeout(() => modal.remove(), 180);
    };

    document.querySelectorAll("[data-close-alert]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = button.closest(".alert-modal");
        if (modal) closeModal(modal);
      });
    });

    modals.forEach((modal) => {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) {
          closeModal(modal);
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        modals.forEach((modal) => closeModal(modal));
      }
    });
  };

  const slideWrap = document.querySelector(".promo-slide-wrap");
  const sliderTrack = slideWrap?.querySelector(".js-promo-slider");
  const slides = sliderTrack?.querySelectorAll(".promo-slider__item") ?? [];
  const prevBtn = slideWrap?.querySelector(".js-promo-prev");
  const nextBtn = slideWrap?.querySelector(".js-promo-next");

  if (sliderTrack && slides.length) {
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
  }

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

  const setupAddressPicker = () => {
    const provinceSelect = document.querySelector("[data-province-select]");
    const districtSelect = document.querySelector("[data-district-select]");
    const wardSelect = document.querySelector("[data-ward-select]");
    if (!provinceSelect || !districtSelect || !wardSelect) return;

    const savedProvince = provinceSelect.getAttribute("data-selected") || provinceSelect.value;
    const savedDistrict = districtSelect.getAttribute("data-selected") || districtSelect.value;
    const savedWard = wardSelect.getAttribute("data-selected") || wardSelect.value;

    const setOptions = (select, items, placeholder) => {
      const current = select.value;
      select.innerHTML = `<option value="">${placeholder}</option>`;
      items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name;
        if (item.name === current || item.name === select.getAttribute("data-selected")) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      select.disabled = items.length === 0;
    };

    const fetchJSON = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    };

    const API_ROOT = "https://provinces.open-api.vn/api/?depth=3";

    fetchJSON(API_ROOT)
      .then((data) => {
        const provinces = data ?? [];
        setOptions(provinceSelect, provinces, "Chọn tỉnh / thành");

        const renderDistricts = (provinceName) => {
          const province = provinces.find((p) => p.name === provinceName);
          const districts = province?.districts ?? [];
          setOptions(districtSelect, districts, "Chọn quận / huyện");
          setOptions(wardSelect, [], "Chọn phường / xã");
          if (districts.length) {
            const districtToSelect = districts.find((d) => d.name === savedDistrict);
            if (districtToSelect) {
              districtSelect.value = districtToSelect.name;
              renderWards(districtToSelect.name, districts);
            }
          }
        };

        const renderWards = (districtName, districts) => {
          const district = (districts ?? []).find((d) => d.name === districtName);
          const wards = district?.wards ?? [];
          setOptions(wardSelect, wards, "Chọn phường / xã");
          if (wards.length && savedWard) {
            const wardToSelect = wards.find((w) => w.name === savedWard);
            if (wardToSelect) {
              wardSelect.value = wardToSelect.name;
            }
          }
        };

        provinceSelect.addEventListener("change", () => {
          districtSelect.value = "";
          wardSelect.value = "";
          renderDistricts(provinceSelect.value);
        });

        districtSelect.addEventListener("change", () => {
          wardSelect.value = "";
          const province = provinces.find((p) => p.name === provinceSelect.value);
          renderWards(districtSelect.value, province?.districts ?? []);
        });

        if (savedProvince) {
          provinceSelect.value = savedProvince;
          renderDistricts(savedProvince);
        }
      })
      .catch(() => {
        provinceSelect.disabled = districtSelect.disabled = wardSelect.disabled = true;
        provinceSelect.innerHTML = `<option value=\"\">Không tải được danh sách tỉnh thành</option>`;
        districtSelect.innerHTML = `<option value=\"\">Hãy nhập thủ công</option>`;
        wardSelect.innerHTML = `<option value=\"\">Hãy nhập thủ công</option>`;
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

  const setupCartAutoUpdate = () => {
    const forms = document.querySelectorAll(".js-cart-update");
    if (!forms.length) return;

    forms.forEach((form) => {
      const input = form.querySelector(".js-cart-qty");
      if (!input) return;
      let timer;
      const submitForm = () => {
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          if (typeof form.requestSubmit === "function") {
            form.requestSubmit();
          } else {
            form.submit();
          }
        }, 250);
      };

      input.addEventListener("input", submitForm);
      input.addEventListener("change", submitForm);
    });
  };

  const setupPaymentNotice = () => {
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    if (!paymentRadios.length) return;

    const codRadio = Array.from(paymentRadios).find((el) => el.value === "cod");

    paymentRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.value === "card" && radio.checked) {
          window.alert("Hiện tại chưa hỗ trợ thanh toán online. Vui lòng chọn COD.");
          if (codRadio) {
            codRadio.checked = true;
          }
        }
      });
    });
  };

  setupMobileDrawer();
  setupAlertModals();
  setupAccordions();
  setupFlashSaleCountdown();
  setupCategoryCarousels();
  setupPaymentNotice();
  setupCartAutoUpdate();
  setupAddressPicker();
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
