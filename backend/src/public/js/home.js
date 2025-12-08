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
});


