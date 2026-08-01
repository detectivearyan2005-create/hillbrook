// ── SMOOTH SCROLL (LENIS) ──
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
let lenis = null;

if (!prefersReducedMotion && window.Lenis) {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // cinematic ease-out
    smoothWheel: true,
    smoothTouch: false, // native momentum feels better on touch devices
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// Hooks a scroll-driven function directly to Lenis's interpolated position
// (falls back to native scroll if Lenis didn't load, so nothing breaks)
function onSmoothScroll(fn) {
  fn();
  if (lenis) {
    lenis.on("scroll", fn);
  } else {
    window.addEventListener("scroll", () => requestAnimationFrame(fn), {
      passive: true,
    });
  }
}

// ── HAMBURGER MENU ──
const hamburger = document.querySelector(".hero__hamburger");
const mobileMenu = document.querySelector(".hero__mobile-menu");

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", false);
    });
  });
}

//hero title
function fitTitle(animate = false) {
  const title = document.querySelector(".hero__title");
  const hero = document.querySelector(".hero");
  if (!title || !hero) return;

  const availableWidth = hero.clientWidth * 0.95;

  // reset
  title.style.animation = "none";
  title.style.fontSize = "100px";
  title.style.opacity = animate ? "0" : "1";
  title.style.transform = animate
    ? "translateX(-50%) translateY(40px)"
    : "translateX(-50%) translateY(0)";

  requestAnimationFrame(() => {
    const titleWidth = title.scrollWidth;
    const ratio = availableWidth / titleWidth;

    title.style.fontSize = 100 * ratio + "px";

    if (animate) {
      void title.offsetHeight; // force reflow
      requestAnimationFrame(() => {
        title.style.animation =
          "titleReveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards";
      });
    }
  });
}
document.fonts.ready.then(() => {
  const revealDone = 1900;
  const elapsed = performance.now();
  const remaining = Math.max(0, revealDone - elapsed);
  setTimeout(() => fitTitle(true), remaining);
});
window.addEventListener("resize", () => fitTitle(false));

// ── PARALLAX ON IMAGE ONLY (no delay) ──
// ── PARALLAX ON IMAGE/VIDEO (desktop + mobile) ──
const heroBgDesktop = document.querySelector(".hero__bg-desktop");
const heroBgMobile = document.querySelector(".hero__bg-mobile");
let ticking = false;

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      const offset = window.scrollY * 0.2;
      const isMobile = window.innerWidth <= 768;

      const activeEl = isMobile ? heroBgMobile : heroBgDesktop;
      if (activeEl) {
        activeEl.style.transform = `translateY(${offset}px)`;
      }

      ticking = false;
    });
    ticking = true;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
// ── HOUSE SECTION IMAGE PARALLAX + SCALE (combined) ──
document.querySelectorAll(".house-section").forEach((section) => {
  const img = section.querySelector(".house-section__img");
  if (!img) return;

  function update() {
    const rect = section.getBoundingClientRect();
    const total = window.innerHeight + section.offsetHeight; // never zero
    const scrolled = window.innerHeight - rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / total));

    const offset = (progress - 0.5) * 100; // slide
    const scale = 1 + progress * 0.2; // zoom

    img.style.transform = `translateY(${offset}px) scale(${scale})`;
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  update();
});

const textEls = document.querySelectorAll(".house-section__text");
const houseSections = document.querySelectorAll(".house-section");

if (houseSections.length > 0) {
  const firstSection = houseSections[0];
  const lastSection = houseSections[houseSections.length - 1];

  const firstLeft = firstSection.querySelector(".house-section__left");
  const firstText = firstSection.querySelector(".house-section__text");
  const lastLeft = lastSection.querySelector(".house-section__left");
  const lastText = lastSection.querySelector(".house-section__text");

  let firstLocked = false;
  let lastLocked = false;
  let lastScrollY = window.scrollY;

  function updateActiveLeftPanel() {
    if (window.innerWidth <= 768) return;

    const viewH = window.innerHeight;
    const middle = viewH / 2;
    const maxDistance = viewH * 0.5;

    const firstRect = firstSection.getBoundingClientRect();
    const lastRect = lastSection.getBoundingClientRect();

    const scrollingUp = window.scrollY < lastScrollY;
    lastScrollY = window.scrollY;

    // ── FIRST SECTION LOCK (scroll UP) — mirrors last section logic ──
    // ── FIRST SECTION LOCK (scroll UP) ──
    if (scrollingUp && firstRect.bottom >= viewH * 1.25 && !firstLocked) {
      firstLocked = true;

      firstLeft.style.position = "absolute";
      firstLeft.style.top = "50%";
      firstLeft.style.transform = "translateY(-50%)";
      firstLeft.style.opacity = "1";
      firstLeft.style.pointerEvents = "auto";

      firstText.style.opacity = "1";
    }

    if (firstRect.bottom < viewH * 1.25 && firstLocked) {
      firstLocked = false;

      firstLeft.style.cssText = "";
      firstText.style.cssText = "";

      firstLeft.classList.remove("active");
      firstText.classList.remove("visible");
    }
    // ── LAST SECTION LOCK (scroll DOWN) ──
    if (lastRect.top <= -(viewH * 0.25) && !lastLocked) {
      lastLocked = true;
      lastLeft.style.position = "absolute";
      lastLeft.style.top = "50%";
      lastLeft.style.transform = "translateY(-50%)";
      lastLeft.style.opacity = "1";
      lastLeft.style.pointerEvents = "auto";
      lastText.style.opacity = "1";
    }

    if (lastRect.top > -(viewH * 0.25) && lastLocked) {
      lastLocked = false;
      lastLeft.style.cssText = "";
      lastText.style.cssText = "";
    }

    // ── HIDE ALL PANELS WHILE FIRST IS LOCKED ──
    if (firstLocked || lastLocked) {
      houseSections.forEach((section) => {
        if (section === firstSection || section === lastSection) return;

        const leftPanel = section.querySelector(".house-section__left");
        const textEl = section.querySelector(".house-section__text");

        if (leftPanel) leftPanel.classList.remove("active");
        if (textEl) textEl.classList.remove("visible");
      });

      return;
    }

    // ── NORMAL LOGIC FOR ALL SECTIONS ──
    let closestSection = null;
    let closestDistance = Infinity;

    houseSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const distance = Math.abs(sectionCenter - middle);

      if (rect.top < viewH && rect.bottom > 0 && distance < closestDistance) {
        closestDistance = distance;
        closestSection = section;
      }
    });

    if (closestDistance > maxDistance) closestSection = null;

    if (closestSection === firstSection) {
      const rect = firstSection.getBoundingClientRect();
      if (rect.top > middle) closestSection = null;
    }

    houseSections.forEach((section) => {
      if (section === lastSection && lastLocked) return;

      const leftPanel = section.querySelector(".house-section__left");
      const textEl = section.querySelector(".house-section__text");
      const isActive = section === closestSection;
      if (leftPanel) leftPanel.classList.toggle("active", isActive);
      if (textEl) textEl.classList.toggle("visible", isActive);
    });
  }
  window.addEventListener(
    "scroll",
    () => requestAnimationFrame(updateActiveLeftPanel),
    { passive: true },
  );
  updateActiveLeftPanel();
}

// ── QUOTE SECTION PARALLAX ──
const quoteImg = document.getElementById("quoteImg");
const quoteSection = document.getElementById("quoteSection");

if (quoteImg && quoteSection) {
  function updateQuoteParallax() {
    const rect = quoteSection.getBoundingClientRect();
    const total = window.innerHeight + quoteSection.offsetHeight;
    const scrolled = window.innerHeight - rect.top;
    const progress = scrolled / total;

    const offset = (progress - 0.5) * 200; // 200 = intensity, increase if needed
    quoteImg.style.transform = `translateY(${offset}px)`;
  }

  window.addEventListener(
    "scroll",
    () => requestAnimationFrame(updateQuoteParallax),
    { passive: true },
  );
  updateQuoteParallax();
}
(function () {
  const l1 = document.getElementById("quoteLine1");
  const l2 = document.getElementById("quoteLine2");
  if (!l1 || !l2) return;

  const LINE1_PLAIN = "A ";
  const LINE1_ITALIC = "luxury hideaway";
  const LINE2 = "immersed in nature";

  function buildChars(el, text, isItalic) {
    text.split("").forEach((ch) => {
      const s = document.createElement("span");
      s.className = "quote-char" + (isItalic ? " quote-char--italic" : "");
      s.innerHTML = ch === " " ? "&nbsp;" : ch;
      el.appendChild(s);
    });
  }

  buildChars(l1, LINE1_PLAIN, false);
  buildChars(l1, LINE1_ITALIC, true);
  buildChars(l2, LINE2, false);

  const prefersReducedMotionQuote = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function revealLine(lineEl, startDelay, charDelay) {
    lineEl.querySelectorAll(".quote-char").forEach((ch, i) => {
      setTimeout(
        () => ch.classList.add("revealed"),
        startDelay + i * charDelay,
      );
    });
  }

  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          if (prefersReducedMotionQuote) {
            document
              .querySelectorAll(".quote-char")
              .forEach((c) => c.classList.add("revealed"));
          } else {
            revealLine(l1, 200, 52);
            const l1End = 200 + (LINE1_PLAIN + LINE1_ITALIC).length * 52 + 300;
            revealLine(l2, l1End, 46);
          }
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 },
  );

  observer.observe(quoteSection);
})();

// ── FIND US PARALLAX ──
const findusImg = document.getElementById("findusImg");
const findusContent = document.querySelector(".findus__content");
const findusWrap = findusImg ? findusImg.closest(".findus__img-wrap") : null;

if (findusImg && findusWrap) {
  function updateFindusParallax() {
    const rect = findusWrap.getBoundingClientRect();
    const total = window.innerHeight + findusWrap.offsetHeight;
    const scrolled = window.innerHeight - rect.top;
    const progress = scrolled / total;

    // Image moves more (background layer)
    const imgOffset = (progress - 0.5) * 120;
    findusImg.style.transform = `translateY(${imgOffset}px)`;

    // Content card moves opposite and less (foreground layer, creates depth)
    if (findusContent) {
      const contentOffset = (progress - 0.5) * -30;
      findusContent.style.transform = `translateY(${contentOffset}px)`;
    }
  }

  window.addEventListener(
    "scroll",
    () => requestAnimationFrame(updateFindusParallax),
    { passive: true },
  );
  updateFindusParallax();
}

// ── FOOTER FORM ──
const footerInput = document.querySelector(".footer-section__input");
const footerCta = document.querySelector(".footer-section__cta");

if (footerInput && footerCta) {
  footerCta.addEventListener("click", (e) => {
    e.preventDefault();

    const email = footerInput.value.trim();

    if (!email || !email.includes("@")) {
      footerInput.style.borderBottomColor = "#e74c3c";
      footerInput.placeholder = "Please enter a valid email";
      return;
    }

    // reset border
    footerInput.style.borderBottomColor = "#1a1a18";

    // success state
    footerCta.innerHTML =
      'Thank you! <span class="footer-section__cta-arrow">✓</span>';
    footerInput.value = "";
    footerInput.placeholder = "Email address";
  });

  // reset border on type
  footerInput.addEventListener("input", () => {
    footerInput.style.borderBottomColor = "#1a1a18";
  });
}

function fitBrandText() {
  const wrapper = document.querySelector(".site-footer__brand");
  const text = document.querySelector(".site-footer__brand-text");
  if (!wrapper || !text) return;

  const availableWidth = wrapper.clientWidth;
  if (availableWidth === 0) return;

  text.style.fontSize = "100px"; // reset to known baseline before measuring
  const textWidth = text.scrollWidth; // includes letter-spacing automatically — no manual math needed
  if (textWidth === 0) return;

  const newSize = 100 * (availableWidth / textWidth) * 0.99; // tiny safety margin only
  text.style.fontSize = newSize + "px";
}

function initFit() {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      requestAnimationFrame(fitBrandText); // ensure layout has settled post-font-swap
    });
  } else {
    fitBrandText();
  }
}

document.addEventListener("DOMContentLoaded", initFit);
window.addEventListener("resize", fitBrandText);
window.addEventListener("load", fitBrandText);
setTimeout(fitBrandText, 300); // catch any late font swap stragglers

///slider
const slider = document.querySelector(".services__grid");
const fill = document.getElementById("sliderFill");

if (slider && fill) {
  slider.addEventListener("scroll", () => {
    const max = slider.scrollWidth - slider.clientWidth;
    const progress = slider.scrollLeft / max;
    const maxTranslate = (100 / 33.33) * 100 - 100;
    fill.style.transform = `translateX(${progress * maxTranslate}%)`;
  });
}

//the retreat
// ── ANCHOR LINKS (SMOOTH SCROLL TO SECTION) ──
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href").slice(1);
    if (!id) return; // ignore placeholder href="#" links elsewhere on the site
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.5 });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ── SITE REVEAL ──
(function () {
  const overlay = document.getElementById("siteReveal");
  const logo = document.getElementById("siteReveal__logo");
  if (!overlay || !logo) return;

  document.body.classList.add("reveal-active");

  // Logo fades in
  setTimeout(() => logo.classList.add("visible"), 150);

  // Logo exits
  setTimeout(() => logo.classList.add("exit"), 900);

  // Curtain slides up
  setTimeout(() => overlay.classList.add("curtain-up"), 1150);

  // Unlock scroll + remove
  setTimeout(() => {
    document.body.classList.remove("reveal-active");
    overlay.remove();
  }, 1900);
})();

// video sound
// ── HERO SOUND TOGGLE ──
(function () {
  const toggleBtn = document.getElementById("heroSoundToggle");
  const mobileVideo = document.getElementById("heroMobileVideo");
  const desktopVideo = document.getElementById("heroDesktopVideo");
  if (!toggleBtn) return;

  let muted = true;

  toggleBtn.addEventListener("click", () => {
    muted = !muted;
    toggleBtn.classList.toggle("is-on", !muted);

    if (mobileVideo) mobileVideo.muted = muted;
    if (desktopVideo) desktopVideo.muted = muted;
  });
})();

/// ── SMART NAV: HIDE ON SCROLL DOWN, SHOW ON SCROLL UP ──
(function () {
  const logo = document.getElementById("heroLogo");
  const nav = document.getElementById("heroNav");
  if (!logo || !nav) return;

  let lastScrollY = window.scrollY;
  let hidden = false;
  const REVEAL_ZONE = 80; // px from top — always show nav in this zone
  const SCROLL_BUFFER = 6; // ignore tiny scroll jitters

  function setHidden(next) {
    if (next === hidden) return;
    hidden = next;
    logo.classList.toggle("is-hidden", hidden);
    nav.classList.toggle("is-hidden", hidden);
  }

  function updateNavVisibility() {
    if (window.innerWidth <= 768) {
      // Mobile: hamburger/menu CSS handles everything, nav stays visible
      setHidden(false);
      lastScrollY = window.scrollY;
      return;
    }

    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    if (currentY <= REVEAL_ZONE) {
      setHidden(false);
    } else if (Math.abs(delta) > SCROLL_BUFFER) {
      setHidden(delta > 0); // scrolling down → hide, scrolling up → show
    }

    lastScrollY = currentY;
  }

  window.addEventListener(
    "scroll",
    () => requestAnimationFrame(updateNavVisibility),
    { passive: true },
  );
  window.addEventListener("resize", updateNavVisibility);
  updateNavVisibility();
})();

// ── LUXURY CAROUSEL (reusable) ──
function initLuxCarousel({
  trackId,
  carouselId,
  prevId,
  nextId,
  images,
  startIndex = 0,
}) {
  const track = document.getElementById(trackId);
  const carousel = document.getElementById(carouselId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  if (!track || !carousel || !prevBtn || !nextBtn) return;

  const n = images.length;
  let activeIndex = startIndex;
  let slides = [];

  images.forEach((item, i) => {
    const slide = document.createElement("div");
    slide.className = "lux-slide";
    slide.dataset.index = i;
    slide.innerHTML = `
      <div class="lux-slide__inner">
        <img class="lux-slide__img" src="${item.src}" alt="${item.title}" loading="lazy" />
        <div class="lux-slide__overlay"></div>
        <div class="lux-slide__caption"><span class="lux-slide__dot"></span>${item.title}</div>
      </div>
    `;
    slide.addEventListener("click", () => {
      if (parseInt(slide.dataset.index, 10) !== activeIndex) {
        goTo(parseInt(slide.dataset.index, 10));
      }
    });
    track.appendChild(slide);
    slides.push(slide);
  });

  function getPeek() {
    const w = window.innerWidth;
    if (w <= 576) return 0;
    if (w <= 900) return 13;
    return 20;
  }

  function layout() {
    const peek = getPeek();

    slides.forEach((slide, i) => {
      let diff = i - activeIndex;
      if (diff > n / 2) diff -= n;
      if (diff < -n / 2) diff += n;
      const absDiff = Math.abs(diff);

      let left, width;
      if (diff === 0) {
        left = peek;
        width = 100 - peek * 2;
      } else if (diff > 0) {
        left = 100 - peek + peek * (diff - 1);
        width = peek;
      } else {
        left = -peek * (Math.abs(diff) - 1);
        width = peek;
      }

      const visible = (absDiff <= 1 && peek > 0) || diff === 0;

      slide.style.left = left + "%";
      slide.style.width = width + "%";
      slide.style.opacity = visible ? "1" : "0";
      slide.style.zIndex = diff === 0 ? 3 : absDiff === 1 ? 2 : 1;
      slide.style.pointerEvents = visible ? "auto" : "none";
      slide.classList.toggle("is-active", diff === 0);

      const img = slide.querySelector(".lux-slide__img");
      if (img) {
        img.style.objectPosition = diff === 0 ? "center" : "right center";
      }
    });
  }

  function goTo(index) {
    activeIndex = ((index % n) + n) % n;
    layout();
  }
  function next() {
    goTo(activeIndex + 1);
  }
  function prev() {
    goTo(activeIndex - 1);
  }

  nextBtn.addEventListener("click", () => {
    next();
    resetAutoplay();
  });
  prevBtn.addEventListener("click", () => {
    prev();
    resetAutoplay();
  });

  window.addEventListener("resize", layout);

  carousel.setAttribute("tabindex", "0");
  carousel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      next();
      resetAutoplay();
    }
    if (e.key === "ArrowLeft") {
      prev();
      resetAutoplay();
    }
  });

  let touchStartX = 0;
  carousel.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );
  carousel.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        dx < 0 ? next() : prev();
        resetAutoplay();
      }
    },
    { passive: true },
  );

  let autoplayTimer = null;
  function startAutoplay() {
    autoplayTimer = setInterval(next, 5000);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }
  carousel.addEventListener("mouseenter", () => clearInterval(autoplayTimer));
  carousel.addEventListener("mouseleave", startAutoplay);

  layout();
  startAutoplay();
}

// ── Instance 1: existing house carousel ──
initLuxCarousel({
  trackId: "luxTrack",
  carouselId: "luxCarousel",
  prevId: "luxPrev",
  nextId: "luxNext",
  startIndex: 2, // starts on "The Entrance"
  images: [
    {
      title: "Kitchen",
      src: "https://picsum.photos/seed/vv-kitchen/1600/1000",
    },
    {
      title: "King Bedroom",
      src: "https://picsum.photos/seed/vv-king-bedroom/1600/1000",
    },
    {
      title: "The Entrance",
      src: "https://picsum.photos/seed/vv-entrance/1600/1000",
    },
    {
      title: "Hot Tub",
      src: "https://picsum.photos/seed/vv-hot-tub/1600/1000",
    },
    {
      title: "Indoor Pool",
      src: "https://picsum.photos/seed/vv-indoor-pool/1600/1000",
    },
    {
      title: "Downstairs Bedroom",
      src: "https://picsum.photos/seed/vv-downstairs-bedroom/1600/1000",
    },
    {
      title: "Living Area",
      src: "https://picsum.photos/seed/vv-living-area/1600/1000",
    },
  ],
});

// ── Instance 2: suite/stables carousel ──
initLuxCarousel({
  trackId: "luxTrack2",
  carouselId: "luxCarousel2",
  prevId: "luxPrev2",
  nextId: "luxNext2",
  startIndex: 0,
  images: [
    {
      title: "The Executive Suite",
      src: "https://picsum.photos/seed/vv-executive-suite/1600/1000",
    },
    {
      title: "Sea View Room from the Lounge",
      src: "https://picsum.photos/seed/vv-sea-view-lounge/1600/1000",
    },
    {
      title: "Loft Style Bedroom",
      src: "https://picsum.photos/seed/vv-loft-bedroom/1600/1000",
    },
    {
      title: "Cozy Lounge with View",
      src: "https://picsum.photos/seed/vv-cozy-lounge/1600/1000",
    },
    {
      title: "Equipped Kitchenette",
      src: "https://picsum.photos/seed/vv-kitchenette/1600/1000",
    },
    {
      title: "Mezzanine Bedroom",
      src: "https://picsum.photos/seed/vv-mezzanine-bedroom/1600/1000",
    },
  ],
});

// ── ROOMS SHOWCASE (crossfade + title reveal + active dot) ──
(function () {
  const nav = document.getElementById("roomsNav");
  const titleEl = document.getElementById("roomsTitle");
  const section = document.getElementById("roomsSection");
  const bgA = document.getElementById("roomsBgA");
  const bgB = document.getElementById("roomsBgB");
  if (!nav || !titleEl || !bgA || !bgB || !section) return;

  const ROOMS = [
    {
      label: "Indoor Pool",
      title: "<em>Unwind</em> in the warmth<br />of the indoor heated pool",
      src: "https://picsum.photos/seed/vv-indoor-pool/1900/1000",
    },
    {
      label: "Hot Tub",
      title: "<em>Soak</em> beneath the stars<br />in the private hot tub",
      src: "https://picsum.photos/seed/vv-hot-tub-showcase/1900/1000",
    },
    {
      label: "Bedroom",
      title: "<em>Rest</em> easy in rooms<br />built for quiet mornings",
      src: "https://picsum.photos/seed/vv-bedroom-showcase/1900/1000",
    },
    {
      label: "Kitchen",
      title: "<em>Gather</em> around the table<br />in the heart of the house",
      src: "https://picsum.photos/seed/vv-kitchen-showcase/1900/1000",
    },
    {
      label: "Living Room",
      title: "<em>Settle</em> into the warmth<br />of the living room",
      src: "https://picsum.photos/seed/vv-living-showcase/1900/1000",
    },
    {
      label: "Media Room",
      title: "<em>Wind</em> down with a film<br />in the media room",
      src: "https://picsum.photos/seed/vv-media-showcase/1900/1000",
    },
  ];

  const items = Array.from(nav.querySelectorAll(".rooms-section__item"));
  let activeIndex = 0;
  let showingA = true;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ── same char-by-char builder used by book-section / quote-section ──
  function buildChars(container, text, isItalic) {
    text.split("").forEach((ch) => {
      const s = document.createElement("span");
      s.className = "quote-char" + (isItalic ? " quote-char--italic" : "");
      s.innerHTML = ch === " " ? "&nbsp;" : ch;
      container.appendChild(s);
    });
  }

  // walks a room's title HTML (which contains <em> and <br/>) and rebuilds
  // it as .quote-char spans + real <br> tags, so the emphasis/line-break
  // structure is kept while every letter becomes individually revealable
  function buildTitleChars(el, html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    el.innerHTML = "";

    function walk(node, isItalic) {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          buildChars(el, child.textContent, isItalic);
        } else if (child.tagName === "EM") {
          walk(child, true);
        } else if (child.tagName === "BR") {
          el.appendChild(document.createElement("br"));
        } else {
          walk(child, isItalic);
        }
      });
    }
    walk(temp, false);
  }

  function revealTitle(el, startDelay = 0, charDelay = 40) {
    const chars = el.querySelectorAll(".quote-char");
    if (prefersReducedMotion) {
      chars.forEach((c) => c.classList.add("revealed"));
      return;
    }
    chars.forEach((ch, i) => {
      ch.classList.remove("revealed");
      void ch.offsetWidth; // force reflow so it replays on repeat triggers
      setTimeout(
        () => ch.classList.add("revealed"),
        startDelay + i * charDelay,
      );
    });
  }

  // build once on load so nothing "pops" as plain text before JS runs
  buildTitleChars(titleEl, ROOMS[activeIndex].title);

  function goTo(index) {
    if (index === activeIndex) return;
    const room = ROOMS[index];

    // title: rebuild + replay the exact char-reveal from book-section,
    // instead of the old opacity fade
    buildTitleChars(titleEl, room.title);
    revealTitle(titleEl, 0, 40);

    // crossfade: load new image into the hidden layer, then swap
    const nextLayer = showingA ? bgB : bgA;
    const currentLayer = showingA ? bgA : bgB;

    nextLayer.src = room.src;
    nextLayer.onload = () => {
      nextLayer.classList.add("rooms-section__bg--active");
      currentLayer.classList.remove("rooms-section__bg--active");
      showingA = !showingA;
    };

    items.forEach((item, i) => item.classList.toggle("is-active", i === index));
    activeIndex = index;
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const index = parseInt(item.dataset.room, 10);
      goTo(index);
    });
  });

  // ── play the entrance reveal once, the first time the section scrolls into view ──
  let hasEntered = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasEntered) {
          hasEntered = true;
          revealTitle(titleEl, 0, 40);
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 },
  );
  observer.observe(section);
})();

(function () {
  const img = document.getElementById("kitchenImg");
  const wrap = img ? img.closest(".kitchen-section__media") : null;
  const sideImg = document.getElementById("kitchenSideImg");
  const sideWrap = sideImg ? sideImg.closest(".kitchen-section__side") : null;
  const content = document.getElementById("kitchenContent");

  if (!wrap && !sideWrap && !content) return;

  function update() {
    const isMobile = window.innerWidth <= 768;

    if (wrap && img) {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      img.style.transform = `translateY(${(progress - 0.5) * 80}px)`;

      if (content) {
        content.style.transform = isMobile
          ? "none"
          : `translateY(${(progress - 0.5) * -25}px)`;
      }
    }
    if (sideWrap && sideImg) {
      const rect = sideWrap.getBoundingClientRect();
      const total = window.innerHeight + sideWrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      sideImg.style.transform = `translateY(${(progress - 0.5) * 60}px)`;
    }
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  update();
})();

(function () {
  const img = document.getElementById("kitchenImg");
  const wrap = img ? img.closest(".kitchen-section__media") : null;
  const sideImg = document.getElementById("kitchenSideImg");
  const sideWrap = sideImg ? sideImg.closest(".kitchen-section__side") : null;
  const content = document.getElementById("kitchenContent");

  if (!wrap && !sideWrap && !content) return;

  function update() {
    const isMobile = window.innerWidth <= 768;

    if (wrap && img) {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      img.style.transform = `translateY(${(progress - 0.5) * 100}px)`;

      if (content) {
        content.style.transform = isMobile
          ? "none"
          : `translateY(${(progress - 0.5) * -25}px)`;
      }
    }
    if (sideWrap && sideImg) {
      const rect = sideWrap.getBoundingClientRect();
      const total = window.innerHeight + sideWrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      sideImg.style.transform = `translateY(${(progress - 0.5) * 60}px)`;
    }
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  update();
})();

// ── BOOK YOUR STAY: TEXT REVEAL + PARALLAX ──
(function () {
  const line = document.getElementById("bookLine1");
  const section = document.getElementById("bookSection");
  const img = document.getElementById("bookImg");
  const cta = document.getElementById("bookCta");
  if (!line || !section) return;

  const ITALIC_PART = "Book ";
  const PLAIN_PART = "your stay";

  function buildChars(el, text, isItalic) {
    text.split("").forEach((ch) => {
      const s = document.createElement("span");
      s.className = "quote-char" + (isItalic ? " quote-char--italic" : "");
      s.innerHTML = ch === " " ? "&nbsp;" : ch;
      el.appendChild(s);
    });
  }

  buildChars(line, ITALIC_PART, true);
  buildChars(line, PLAIN_PART, false);

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function revealLine(lineEl, startDelay, charDelay, onDone) {
    const chars = lineEl.querySelectorAll(".quote-char");
    chars.forEach((ch, i) => {
      setTimeout(
        () => ch.classList.add("revealed"),
        startDelay + i * charDelay,
      );
    });
    if (onDone) {
      setTimeout(onDone, startDelay + chars.length * charDelay + 200);
    }
  }

  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          if (prefersReducedMotion) {
            line
              .querySelectorAll(".quote-char")
              .forEach((c) => c.classList.add("revealed"));
            if (cta) cta.classList.add("is-visible");
          } else {
            revealLine(line, 200, 48, () => {
              if (cta) cta.classList.add("is-visible");
            });
          }
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 },
  );

  observer.observe(section);

  // Parallax on background image
  if (img) {
    function updateParallax() {
      const rect = section.getBoundingClientRect();
      const total = window.innerHeight + section.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = scrolled / total;
      const offset = (progress - 0.5) * 200;
      img.style.transform = `translateY(${offset}px)`;
    }
    window.addEventListener(
      "scroll",
      () => requestAnimationFrame(updateParallax),
      { passive: true },
    );
    updateParallax();
  }
})();

// ── BEACH SECTION PARALLAX (both images, independent) ──
(function () {
  function setupParallax(imgId, wrapSelector, intensity) {
    const img = document.getElementById(imgId);
    const wrap = img ? img.closest(wrapSelector) : null;
    if (!img || !wrap) return;

    function update() {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const offset = (progress - 0.5) * intensity;
      img.style.transform = `translateY(${offset}px)`;
    }

    window.addEventListener("scroll", () => requestAnimationFrame(update), {
      passive: true,
    });
    window.addEventListener("resize", () => requestAnimationFrame(update));
    update();
  }

  setupParallax("beachImgLeft", ".beach-section__media-left", 120);
  setupParallax("beachImgSmall", ".beach-section__media-small", 60);
})();

// ── Instance 3: farm carousel ──
initLuxCarousel({
  trackId: "luxTrack3",
  carouselId: "luxCarousel3",
  prevId: "luxPrev3",
  nextId: "luxNext3",
  startIndex: 0,
  images: [
    {
      title: "The Grounds",
      src: "https://picsum.photos/seed/vv-farm-grounds/1600/1000",
    },
    {
      title: "Cattle Enjoying the Views",
      src: "https://picsum.photos/seed/vv-farm-cattle/1600/1000",
    },
    {
      title: "The Estate",
      src: "https://picsum.photos/seed/vv-farm-estate/1600/1000",
    },
    {
      title: "Permaculture",
      src: "https://picsum.photos/seed/vv-farm-permaculture/1600/1000",
    },
  ],
});

// ── HECTARES SECTION PARALLAX ──
(function () {
  const img = document.getElementById("hectaresImg");
  const wrap = img ? img.closest(".hectares-section__media") : null;
  if (!img || !wrap) return;

  function update() {
    const rect = wrap.getBoundingClientRect();
    const total = window.innerHeight + wrap.offsetHeight;
    const scrolled = window.innerHeight - rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / total));
    const offset = (progress - 0.5) * 80;
    img.style.transform = `translateY(${offset}px)`;
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  window.addEventListener("resize", () => requestAnimationFrame(update));
  update();
})();

// ── LAND BACK SECTION PARALLAX (both images, independent) ──
(function () {
  function setupParallax(imgId, wrapSelector, intensity) {
    const img = document.getElementById(imgId);
    const wrap = img ? img.closest(wrapSelector) : null;
    if (!img || !wrap) return;

    function update() {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const offset = (progress - 0.5) * intensity;
      img.style.transform = `translateY(${offset}px)`;
    }

    window.addEventListener("scroll", () => requestAnimationFrame(update), {
      passive: true,
    });
    window.addEventListener("resize", () => requestAnimationFrame(update));
    update();
  }

  setupParallax("landBackImgLarge", ".land-back-section__media-large", 100);
  setupParallax("landBackImgSmall", ".land-back-section__media-small", 50);
})();

// ── Parallax effect for [data-parallax] elements ──
(function () {
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (!parallaxEls.length) return;

  function updateParallax() {
    const viewportH = window.innerHeight;

    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallaxSpeed) || 0.1;

      // progress: -1 (element bottom at viewport top) to 1 (element top at viewport bottom)
      const elCenter = rect.top + rect.height / 2;
      const progress = (elCenter - viewportH / 2) / viewportH;

      const offset = progress * speed * 100; // percentage
      const img = el.querySelector(".cover-image");
      if (img) {
        img.style.transform = `translate3d(0px, ${offset}%, 0px)`;
      }
    });

    requestAnimationFrame(updateParallax);
  }

  requestAnimationFrame(updateParallax);
})();

// ── FAQ Accordion ──
(function () {
  const faqButtons = document.querySelectorAll(".faq__question");

  faqButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq__item");
      const answer = item.querySelector(".faq__answer");
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      // close all other open items (accordion behavior — remove this loop for multi-open)
      faqButtons.forEach((otherBtn) => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherBtn
            .closest(".faq__item")
            .querySelector(".faq__answer").style.maxHeight = null;
        }
      });

      if (isOpen) {
        btn.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
})();

// ── ENQUIRY SECTION: TEXT REVEAL + PARALLAX ──
(function () {
  const line = document.getElementById("enquiryLine1");
  const section = document.getElementById("enquirySection");
  const img = document.getElementById("enquiryImg");
  const subtext = document.getElementById("enquirySubtext");
  const cta = document.getElementById("enquiryCta");
  if (!line || !section) return;

  const ITALIC_PART = "Tell us ";
  const PLAIN_PART = "what you're planning";

  function buildChars(el, text, isItalic) {
    text.split("").forEach((ch) => {
      const s = document.createElement("span");
      s.className = "quote-char" + (isItalic ? " quote-char--italic" : "");
      s.innerHTML = ch === " " ? "&nbsp;" : ch;
      el.appendChild(s);
    });
  }

  buildChars(line, ITALIC_PART, true);
  buildChars(line, PLAIN_PART, false);

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function revealLine(lineEl, startDelay, charDelay, onDone) {
    const chars = lineEl.querySelectorAll(".quote-char");
    chars.forEach((ch, i) => {
      setTimeout(
        () => ch.classList.add("revealed"),
        startDelay + i * charDelay,
      );
    });
    if (onDone) {
      setTimeout(onDone, startDelay + chars.length * charDelay + 200);
    }
  }

  let hasAnimated = false;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          if (prefersReducedMotion) {
            line
              .querySelectorAll(".quote-char")
              .forEach((c) => c.classList.add("revealed"));
            if (subtext) subtext.classList.add("is-visible");
            if (cta) cta.classList.add("is-visible");
          } else {
            revealLine(line, 200, 42, () => {
              if (subtext) subtext.classList.add("is-visible");
              setTimeout(() => {
                if (cta) cta.classList.add("is-visible");
              }, 200);
            });
          }
          observer.disconnect();
        }
      });
    },
    { threshold: 0.35 },
  );

  observer.observe(section);

  // Parallax on background image (same pattern as book-section)
  if (img) {
    function updateParallax() {
      const rect = section.getBoundingClientRect();
      const total = window.innerHeight + section.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = scrolled / total;
      const offset = (progress - 0.5) * 200;
      img.style.transform = `translateY(${offset}px)`;
    }
    window.addEventListener(
      "scroll",
      () => requestAnimationFrame(updateParallax),
      { passive: true },
    );
    updateParallax();
  }
})();

// ── CONTACT FORM: validation + submit handling ──
(function () {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("contactSubmit");
  const statusEl = document.getElementById("contactStatus");
  if (!form) return;

  const fields = {
    firstName: {
      el: document.getElementById("firstName"),
      label: "First name",
    },
    lastName: { el: document.getElementById("lastName"), label: "Last name" },
    email: { el: document.getElementById("email"), label: "Email" },
    phone: { el: document.getElementById("phone"), label: "Phone" },
    message: { el: document.getElementById("message"), label: "Message" },
  };

  function showError(key, msg) {
    const field = fields[key];
    const wrapper = field.el.closest(".contact-form__field");
    wrapper.classList.add("has-error");
    wrapper.querySelector(".contact-form__error").textContent = msg;
  }

  function clearError(key) {
    const field = fields[key];
    const wrapper = field.el.closest(".contact-form__field");
    wrapper.classList.remove("has-error");
    wrapper.querySelector(".contact-form__error").textContent = "";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validate() {
    let valid = true;

    Object.keys(fields).forEach((key) => {
      const value = fields[key].el.value.trim();
      clearError(key);

      if (!value) {
        showError(key, `${fields[key].label} is required`);
        valid = false;
      } else if (key === "email" && !isValidEmail(value)) {
        showError(key, "Enter a valid email address");
        valid = false;
      }
    });

    return valid;
  }

  // clear individual field error as the person types
  Object.keys(fields).forEach((key) => {
    fields[key].el.addEventListener("input", () => clearError(key));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    statusEl.textContent = "";
    statusEl.className = "contact-form__status";

    if (!validate()) {
      statusEl.textContent = "Please fix the errors above.";
      statusEl.classList.add("is-error");
      return;
    }

    // ── Hook this up to your real form backend / email service ──
    // Example placeholder submit (replace with actual fetch to your endpoint):
    submitBtn.disabled = true;
    submitBtn.querySelector("span") && (submitBtn.innerHTML = "SENDING…");

    setTimeout(() => {
      // Simulated success — swap this block for a real fetch() call, e.g.:
      // fetch('/api/contact', { method: 'POST', body: new FormData(form) })
      //   .then(res => res.ok ? onSuccess() : onError())
      //   .catch(onError);

      statusEl.textContent = "Thanks — we'll be in touch shortly.";
      statusEl.classList.add("is-success");
      form.reset();
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        'SUBMIT <span class="contact-form__submit-arrow">→</span>';
    }, 800);
  });
})();

// ── PAGE HERO TITLE REVEAL (bottom-left inner pages) ──
function revealPageHeroTitle() {
  const title = document.querySelector(".page-hero__title");
  if (!title) return;

  requestAnimationFrame(() => {
    title.classList.add("is-visible");
  });
}

(function () {
  const SITE_REVEAL_DURATION = 1900; // must match the site reveal timeout below

  Promise.resolve(document.fonts ? document.fonts.ready : null).then(() => {
    const elapsed = performance.now();
    const remaining = Math.max(0, SITE_REVEAL_DURATION - elapsed);
    setTimeout(revealPageHeroTitle, remaining);
  });
})();

// ── HIGHLIGHT CURRENT PAGE IN NAV ──
(function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document
    .querySelectorAll(".hero__nav a, .hero__mobile-menu a")
    .forEach((link) => {
      const linkPage = link.getAttribute("href");
      if (linkPage === currentPage) {
        link.classList.add("nav--gold");
      }
    });
})();

/* ==========================================================================
   CURATED HERO — behaviour
   1. Assign each floating card a unique drift distance / rotation / scale
      / duration / delay so nothing moves in sync.
   2. Play a staggered entrance the first time the section enters view:
      heading first, images next, CTA last.
   3. Add a very subtle mouse parallax (desktop only) and scroll parallax,
      both applied to a nested wrapper so they never fight the CSS
      floating-drift animation running on the outer card.
   ========================================================================== */

(function () {
  "use strict";

  const section = document.getElementById("curatedHero");
  if (!section) return;

  const content = section.querySelector(".curated-hero__content");
  const cards = Array.from(section.querySelectorAll(".floating-img"));
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Random signed distance, e.g. rand between 20 and 60, then randomly +/-
  function randSigned(min, max) {
    const v = rand(min, max);
    return Math.random() < 0.5 ? -v : v;
  }

  /* ------------------------------------------------------------------
     1. Randomize each card's floating-drift parameters via CSS custom
        properties. The single @keyframes chFloatDrift in the stylesheet
        reads these, so every card still shares one keyframe definition
        but animates uniquely.
     ------------------------------------------------------------------ */

  function initFloatParams() {
    cards.forEach((card) => {
      const dx = randSigned(20, 60); // horizontal drift 20-60px
      const dy = randSigned(20, 60); // vertical drift 20-60px
      const drot = randSigned(1, 3); // rotation -3deg to 3deg
      const dscale = rand(0.98, 1.03); // gentle scale for depth
      const duration = rand(8, 18); // 8-18s, unique per card
      const delay = rand(-6, 2); // negative delay desyncs starting phase

      card.style.setProperty("--dx", dx.toFixed(1) + "px");
      card.style.setProperty("--dy", dy.toFixed(1) + "px");
      card.style.setProperty("--drot", drot.toFixed(2) + "deg");
      card.style.setProperty("--dscale", dscale.toFixed(3));
      card.style.animationDuration = duration.toFixed(2) + "s";
      card.style.animationDelay = delay.toFixed(2) + "s";
    });
  }

  /* ------------------------------------------------------------------
     2. Entrance sequence, triggered once when the section scrolls
        into view. Heading fades in first, image cards follow with a
        random stagger, CTA arrives last.
     ------------------------------------------------------------------ */

  function playEntrance() {
    // Heading + content wrapper: no extra delay, leads the sequence.
    content.classList.add("is-visible");

    // Image cards: staggered, randomized so the reveal itself feels organic.
    cards.forEach((card, i) => {
      const baseStagger = 90; // ms between cards, roughly
      const jitter = rand(0, 160);
      const entranceDelay = i * baseStagger + jitter;

      window.setTimeout(() => {
        card.classList.add("is-visible");

        // Once the entrance transition finishes, hand off to the
        // continuous floating-drift animation.
        const startFloating = () => card.classList.add("is-floating");
        if (prefersReducedMotion) {
          startFloating();
        } else {
          card.addEventListener("transitionend", startFloating, {
            once: true,
          });
        }
      }, entranceDelay);
    });

    // CTA fades in last, after the images have had time to start landing.
    const cta = section.querySelector(".curated-hero__cta");
    const ctaDelay = cards.length * 90 + 350;
    window.setTimeout(() => {
      if (cta) cta.style.transitionDelay = "0s";
    }, ctaDelay);
  }

  function initEntranceObserver() {
    if (!("IntersectionObserver" in window)) {
      playEntrance();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playEntrance();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(section);
  }

  /* ------------------------------------------------------------------
     3a. Mouse parallax — desktop only, very subtle (max ~18px), applied
         to the .floating-img__inner wrapper so it composes independently
         of the outer card's floating-drift animation.
     ------------------------------------------------------------------ */

  let latestMouseX = 0;
  let latestMouseY = 0;
  let mouseRAFQueued = false;

  function applyMouseParallax() {
    mouseRAFQueued = false;
    cards.forEach((card) => {
      const depth = parseFloat(card.dataset.depth || "0.4");
      const inner = card.querySelector(".floating-img__inner");
      if (!inner) return;

      const maxShift = 18; // px, keeps the effect luxuriously subtle
      const mx = latestMouseX * maxShift * depth;
      const my = latestMouseY * maxShift * depth;

      inner.style.transform =
        "translate3d(" + mx.toFixed(1) + "px," + my.toFixed(1) + "px,0)";
    });
  }

  function onMouseMove(e) {
    const rect = section.getBoundingClientRect();
    // Normalize to -1..1 relative to section center.
    latestMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    latestMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    if (!mouseRAFQueued) {
      mouseRAFQueued = true;
      requestAnimationFrame(applyMouseParallax);
    }
  }

  function initMouseParallax() {
    if (isCoarsePointer || prefersReducedMotion) return; // touch devices: skip
    section.addEventListener("mousemove", onMouseMove, { passive: true });
    section.addEventListener("mouseleave", () => {
      latestMouseX = 0;
      latestMouseY = 0;
      requestAnimationFrame(applyMouseParallax);
    });
  }

  /* ------------------------------------------------------------------
     3b. Scroll parallax — cards drift at different speeds as the
         section passes through the viewport. The centered content
         block is left untouched so it always reads as stable.
     ------------------------------------------------------------------ */

  let scrollRAFQueued = false;

  function applyScrollParallax() {
    scrollRAFQueued = false;
    const rect = section.getBoundingClientRect();
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;

    // Progress goes from -1 (section below viewport) to 1 (section above),
    // 0 when the section is centered in the viewport.
    const progress =
      ((rect.top + rect.height / 2) / (viewportH + rect.height)) * 2 - 1;

    cards.forEach((card) => {
      const speed = parseFloat(card.dataset.speed || "0.2");
      const shift = progress * speed * 120; // px, kept gentle
      card.style.setProperty("--scroll-shift", shift.toFixed(1) + "px");
      // Combine with any existing floating animation transform by
      // nudging the card's base position via a CSS variable read from
      // a lightweight top-level transform layer.
      card.style.translate = "0 " + shift.toFixed(1) + "px";
    });
  }

  function onScroll() {
    if (!scrollRAFQueued) {
      scrollRAFQueued = true;
      requestAnimationFrame(applyScrollParallax);
    }
  }

  function initScrollParallax() {
    if (prefersReducedMotion) return;
    window.addEventListener("scroll", onScroll, { passive: true });
    applyScrollParallax();
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */

  initFloatParams();
  initEntranceObserver();
  initMouseParallax();
  initScrollParallax();
})();

// ── GALLERY STREAM: ENDLESS-FLOWING MASONRY PARALLAX ──
// Cards live in normal flow (flex column). The only motion is a
// transform on each column's track, computed from scroll position and
// wrapped (modulo) against the height of one full card-set — so the
// stream never runs out, and never needs to add/remove DOM nodes.
(function () {
  "use strict";

  const section = document.getElementById("galleryStream");
  const viewport = section
    ? section.querySelector(".gallery-stream__viewport")
    : null;
  const columnEls = section
    ? Array.from(section.querySelectorAll(".gallery-column"))
    : [];
  if (!section || !viewport || !columnEls.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // One pool of images per column, so neighbouring columns never show
  // the same photo at the same height. Swap these for real photography —
  // nothing else in the HTML needs to change.
  const COLUMN_IMAGES = [
    [
      { seed: "vv-beach-walker", caption: "Swim & Surf" },
      { seed: "vv-orchard-path", caption: "Farm Walks" },
      { seed: "vv-coastal-hike", caption: "Coastal Hikes" },
      { seed: "vv-lawn-games", caption: "Lawn Games" },
      { seed: "vv-island-tour", caption: "Island Tours" },
    ],
    [
      { seed: "vv-ebiking", caption: "E-Biking" },
      { seed: "vv-surf-lesson", caption: "Surf Lessons" },
      { seed: "vv-glass-boat", caption: "Glass Bottom Boat" },
      { seed: "vv-hot-spring", caption: "Geo-Thermal Pools" },
      { seed: "vv-hahei-cove", caption: "Cathedral Cove" },
    ],
    [
      { seed: "vv-day-tour", caption: "Personalised Tours" },
      { seed: "vv-ocean-dive", caption: "Ocean Adventures" },
      { seed: "vv-farm-table", caption: "Farm-to-Table" },
      { seed: "vv-kauri-forest", caption: "Kauri Forest" },
      { seed: "vv-chocolate", caption: "Chocolate Tour" },
    ],
    [
      { seed: "vv-sunset-sail", caption: "Sunset Sailing" },
      { seed: "vv-kayak-cove", caption: "Kayaking" },
      { seed: "vv-mountain-bike", caption: "Mountain Biking" },
      { seed: "vv-picnic-hill", caption: "Hilltop Picnics" },
      { seed: "vv-fireside", caption: "Fireside Evenings" },
    ],
  ];

  // Slightly vary each card's shape across a set for a genuine masonry
  // feel — still just aspect-ratio in CSS, still fully in flow.
  const SHAPES = ["", "gallery-card--tall", "", "gallery-card--short", ""];

  function buildCardEl(item, shapeClass) {
    const card = document.createElement("figure");
    card.className = "gallery-card" + (shapeClass ? " " + shapeClass : "");

    // Small, static, one-time jitter baked directly onto the card's
    // own transform — independent of the scroll-driven transform that
    // will live on the ancestor .gallery-column__track.
    const jitter = (Math.random() - 0.5) * 36; // ±18px
    card.style.transform = "translate3d(0," + jitter.toFixed(1) + "px,0)";

    const bg = document.createElement("div");
    bg.className = "gallery-card__caption-bg";

    const img = document.createElement("img");
    img.src = "https://picsum.photos/seed/" + item.seed + "/700/900";
    img.alt = item.caption;
    img.loading = "lazy";

    const caption = document.createElement("figcaption");
    caption.className = "gallery-card__caption";
    caption.textContent = item.caption;

    card.appendChild(bg);
    card.appendChild(img);
    card.appendChild(caption);
    return card;
  }

  function buildSet(images) {
    const set = document.createElement("div");
    set.className = "gallery-column__set";
    images.forEach((item, i) => {
      set.appendChild(buildCardEl(item, SHAPES[i % SHAPES.length]));
    });
    return set;
  }

  // Build each column: a track containing TWO identical sets back to
  // back. Once the track has scrolled up by exactly one set's height,
  // it is reset to 0 — visually seamless, because set two is now
  // sitting exactly where set one started.
  const columns = columnEls.map((col, i) => {
    const speed = parseFloat(col.dataset.speed || "0.5");
    const images = COLUMN_IMAGES[i % COLUMN_IMAGES.length];

    const track = document.createElement("div");
    track.className = "gallery-column__track";

    const setA = buildSet(images);
    const setB = buildSet(images);
    setB.setAttribute("aria-hidden", "true");

    track.appendChild(setA);
    track.appendChild(setB);
    col.appendChild(track);

    // Wrap every <img> in this column in a parallax layer so the
    // image can lag behind its card independently of the hover-zoom.
    const layers = Array.from(track.querySelectorAll(".gallery-card")).map(
      (card) => {
        const img = card.querySelector("img");
        const layer = document.createElement("div");
        layer.className = "gallery-parallax-layer";
        card.insertBefore(layer, img);
        layer.appendChild(img);
        return layer;
      },
    );

    return { col, track, setA, speed, layers, baseHeight: 0 };
  });

  const IMAGE_LAG_RATIO = 0.6; // inner image travels at ~60% of its column's speed

  function measure() {
    columns.forEach((c) => {
      // Height of ONE set (+ the gap that would sit between the
      // looped repeat) is the modulo period for a seamless wrap.
      const gap = parseFloat(getComputedStyle(c.track).gap || "24") || 24;
      c.baseHeight = c.setA.getBoundingClientRect().height + gap;
    });
  }

  function isMobile() {
    return window.innerWidth <= 900;
  }

  function update() {
    if (isMobile() || prefersReducedMotion) {
      columns.forEach((c) => {
        c.track.style.transform = "";
        c.layers.forEach((l) => (l.style.transform = ""));
      });
      return;
    }

    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const scrolledIn = Math.max(0, Math.min(scrollable, -rect.top));
    const viewportH = window.innerHeight;
    const maxImageShift = 60; // px — safely inside the card's clipped bounds

    columns.forEach((c) => {
      if (!c.baseHeight) return;
      const raw = scrolledIn * c.speed;
      const trackY = -(raw % c.baseHeight);
      c.track.style.transform = "translate3d(0," + trackY.toFixed(2) + "px,0)";

      // Per-card lag: each image gets its own small, clamped offset based
      // on where ITS card sits in the viewport right now — not the
      // column's (much larger) cumulative shift.
      c.layers.forEach((layer) => {
        const cardRect = layer.parentElement.getBoundingClientRect();
        const cardCenter = cardRect.top + cardRect.height / 2;
        const progress = (cardCenter - viewportH / 2) / viewportH;
        const clamped = Math.max(-1, Math.min(1, progress));
        const shift = clamped * maxImageShift;
        layer.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
      });
    });
  }

  // Measure after layout has settled (fonts/images affect box sizes
  // only via aspect-ratio here, so one rAF pass is enough).
  requestAnimationFrame(() => {
    measure();
    update();
  });

  // Reuse the site's existing smooth-scroll hook instead of adding a
  // new scroll listener.
  if (typeof onSmoothScroll === "function") {
    onSmoothScroll(update);
  } else {
    window.addEventListener("scroll", () => requestAnimationFrame(update), {
      passive: true,
    });
  }

  window.addEventListener("resize", () => {
    requestAnimationFrame(() => {
      measure();
      update();
    });
  });
})();
// ── CRAFTING YOUR STAY: hover-reveal activity images ──
(function () {
  const wrap = document.getElementById("craftListWrap");
  const imgBox = document.getElementById("craftHoverImg");
  const imgTag = document.getElementById("craftHoverImgTag");
  const listEl = document.getElementById("craftList");
  if (!wrap || !imgBox || !imgTag || !listEl) return;

  const links = wrap.querySelectorAll(".craft-link");
  if (!links.length) return;

  function isTouch() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      if (isTouch()) return;
      const src = link.dataset.img;
      if (!src) return;

      imgTag.src = src;
      imgTag.alt = link.textContent.trim();

      const linkRect = link.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const boxW = imgBox.offsetWidth;
      const boxH = imgBox.offsetHeight;

      // vertical: center the image on the hovered word's line
      let relativeTop =
        linkRect.top - wrapRect.top + linkRect.height / 2 - boxH / 2;
      relativeTop = Math.max(0, Math.min(relativeTop, wrapRect.height - boxH));

      // horizontal: start just after the word itself, so the box
      // reads as "attached" to it, then clamp inside the container
      let relativeLeft = linkRect.left - wrapRect.left + linkRect.width * 0.4;
      relativeLeft = Math.max(0, Math.min(relativeLeft, wrapRect.width - boxW));

      imgBox.style.top = relativeTop + "px";
      imgBox.style.left = relativeLeft + "px";
      imgBox.classList.add("is-visible");

      listEl.classList.add("is-hovering");
      links.forEach((l) => l.classList.remove("is-active"));
      link.classList.add("is-active");
    });
  });

  wrap.addEventListener("mouseleave", () => {
    imgBox.classList.remove("is-visible");
    listEl.classList.remove("is-hovering");
    links.forEach((l) => l.classList.remove("is-active"));
  });
})();

// ── VIDEO SECTION PARALLAX (supports multiple instances) ──
(function () {
  const imgs = document.querySelectorAll(".js-parallax-img");
  if (!imgs.length) return;

  const items = Array.from(imgs)
    .map((img) => {
      const wrap = img.closest(".video-wrap");
      return wrap ? { img, wrap } : null;
    })
    .filter(Boolean);

  function update() {
    items.forEach(({ img, wrap }) => {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      const offset = (progress - 0.5) * 100;
      img.style.transform = `translateY(${offset}px)`;
    });
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  window.addEventListener("resize", () => requestAnimationFrame(update));
  update();
})();

// ── SUITE SECTION PARALLAX (main image + side image + content counter-move) ──
(function () {
  const img = document.getElementById("suiteImg");
  const wrap = img ? img.closest(".suite-section__media") : null;
  const sideImg = document.getElementById("suiteSideImg");
  const sideWrap = sideImg ? sideImg.closest(".suite-section__side") : null;
  const content = document.getElementById("suiteContent");

  if (!wrap && !sideWrap && !content) return;

  function update() {
    const isMobile = window.innerWidth <= 768;

    if (wrap && img) {
      const rect = wrap.getBoundingClientRect();
      const total = window.innerHeight + wrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      img.style.transform = `translateY(${(progress - 0.5) * 80}px)`;

      if (content) {
        content.style.transform = isMobile
          ? "none"
          : `translateY(${(progress - 0.5) * -25}px)`;
      }
    }

    if (sideWrap && sideImg) {
      const rect = sideWrap.getBoundingClientRect();
      const total = window.innerHeight + sideWrap.offsetHeight;
      const scrolled = window.innerHeight - rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / total));
      sideImg.style.transform = `translateY(${(progress - 0.5) * 60}px)`;
    }
  }

  window.addEventListener("scroll", () => requestAnimationFrame(update), {
    passive: true,
  });
  window.addEventListener("resize", () => requestAnimationFrame(update));
  update();
})();
