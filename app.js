(() => {
  "use strict";

  const body = document.body;
  const root = document.documentElement;
  body.classList.add("has-js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sequence = document.querySelector(".hero-sequence");
  const video = document.getElementById("transformVideo");
  const signalVideo = document.getElementById("signalVideo");
  const chapters = [...document.querySelectorAll("[data-chapter]")];
  const sequenceProgress = document.getElementById("sequenceProgress");
  const sequenceNumber = document.getElementById("sequenceNumber");
  const documentProgress = document.getElementById("documentProgress");
  const header = document.getElementById("siteHeader");
  const loaderProgress = document.getElementById("loaderProgress");
  const copyLink = document.getElementById("copyLink");

  const translations = {
    en: {
      navWork: "Work",
      navSecurity: "Security",
      navContact: "Contact",
      heroKicker: "Computer Engineering × Cybersecurity",
      heroLead: "I build digital products, study how systems break, and design how they should recover.",
      exploreWork: "Explore my work",
      transformKicker: "Transformation",
      transformTitle: "Human ideas.<br><span>Machine precision.</span>",
      transformLead: "Technology matters when it turns curiosity into something useful, fast and dependable.",
      securityKicker: "Security mindset",
      securityHeroTitle: "Think like an attacker.<br><span>Build like a defender.</span>",
      securityHeroLead: "Linux, networks, web security and detection—learned through hands-on labs and real products.",
      founderKicker: "Founder mode",
      founderTitle: "Build.<br><span>Secure.</span> Grow.",
      founderLead: "From Istanbul, I am building AuraDigital while moving toward cybersecurity engineering.",
      enterPortfolio: "Enter the portfolio",
      scrollTransform: "SCROLL TO TRANSFORM",
      statementKicker: "A profile in motion",
      statementTitle: "Between <em>systems</em><br>and <em>stories.</em>",
      statementBody: "I am a Computer Engineering student and the founder of AuraDigital. My work lives where product design, cloud infrastructure and cybersecurity meet.",
      locationLabel: "Location",
      directionLabel: "Direction",
      buildingLabel: "Building",
      workKicker: "Selected systems",
      workTitle: "Ideas that became<br><em>real products.</em>",
      workIntro: "Strategy, interface, code and deployment—connected into one practical workflow.",
      auraDescription: "A digital studio for websites, QR menus, NFC experiences and practical growth systems.",
      menuDescription: "Restaurant menus created, previewed and published through a streamlined digital flow.",
      signalLabel: "CREATIVE EXPERIMENT",
      signalTitle: "Motion with<br>purpose.",
      signalDescription: "AI-assisted visuals turned into an interactive story—not decoration, but direction.",
      securitySectionKicker: "Cybersecurity direction",
      securitySectionTitle: "Observe the signal.<br><em>Understand the system.</em>",
      securitySectionBody: "I am growing toward SOC and security engineering through hands-on labs, network analysis, web testing and automation.",
      viewGithub: "View GitHub",
      contactKicker: "The next chapter",
      contactTitle: "Let’s build something<br><em>worth securing.</em>",
      contactBody: "Open to cybersecurity internships, junior opportunities and ambitious digital collaborations.",
      visitAura: "Visit AuraDigital",
      copyLink: "Copy site link",
      copied: "Link copied",
      footerLine: "ISTANBUL · COMPUTER ENGINEERING · CYBERSECURITY"
    },
    tr: {
      navWork: "Projeler",
      navSecurity: "Güvenlik",
      navContact: "İletişim",
      heroKicker: "Bilgisayar Mühendisliği × Siber Güvenlik",
      heroLead: "Dijital ürünler geliştiriyor, sistemlerin nasıl kırıldığını inceliyor ve nasıl toparlanmaları gerektiğini tasarlıyorum.",
      exploreWork: "Projelerimi keşfet",
      transformKicker: "Dönüşüm",
      transformTitle: "İnsan fikri.<br><span>Makine hassasiyeti.</span>",
      transformLead: "Teknoloji; merakı kullanışlı, hızlı ve güvenilir bir şeye dönüştürdüğünde anlam kazanır.",
      securityKicker: "Güvenlik zihniyeti",
      securityHeroTitle: "Saldırgan gibi düşün.<br><span>Savunmacı gibi geliştir.</span>",
      securityHeroLead: "Linux, ağlar, web güvenliği ve tespit—uygulamalı lablar ve gerçek ürünlerle öğreniyorum.",
      founderKicker: "Kurucu modu",
      founderTitle: "Üret.<br><span>Güvenli kıl.</span> Büyüt.",
      founderLead: "İstanbul’dan AuraDigital’i geliştirirken siber güvenlik mühendisliğine doğru ilerliyorum.",
      enterPortfolio: "Portfolyoya gir",
      scrollTransform: "DÖNÜŞÜM İÇİN KAYDIR",
      statementKicker: "Hareket halinde bir profil",
      statementTitle: "<em>Sistemler</em> ile<br><em>hikâyeler</em> arasında.",
      statementBody: "Bilgisayar Mühendisliği öğrencisi ve AuraDigital’in kurucusuyum. Çalışmalarım ürün tasarımı, bulut altyapısı ve siber güvenliğin kesişiminde yer alıyor.",
      locationLabel: "Konum",
      directionLabel: "Hedef",
      buildingLabel: "Geliştirdiklerim",
      workKicker: "Seçili sistemler",
      workTitle: "Fikirden doğan<br><em>gerçek ürünler.</em>",
      workIntro: "Strateji, arayüz, kod ve dağıtım—tek bir uygulanabilir iş akışında birleşiyor.",
      auraDescription: "Web siteleri, QR menüler, NFC deneyimleri ve pratik büyüme sistemleri için dijital stüdyo.",
      menuDescription: "Restoran menülerini oluşturmak, önizlemek ve yayınlamak için sade bir dijital akış.",
      signalLabel: "YARATICI DENEY",
      signalTitle: "Amacı olan<br>hareket.",
      signalDescription: "Yapay zekâ destekli görseller interaktif bir hikâyeye dönüşüyor; süs değil, yön veriyor.",
      securitySectionKicker: "Siber güvenlik yönüm",
      securitySectionTitle: "Sinyali gözlemle.<br><em>Sistemi anla.</em>",
      securitySectionBody: "Uygulamalı lablar, ağ analizi, web testleri ve otomasyonla SOC ve güvenlik mühendisliğine doğru ilerliyorum.",
      viewGithub: "GitHub’ı görüntüle",
      contactKicker: "Sıradaki bölüm",
      contactTitle: "Güvende tutulmaya değer<br><em>bir şey üretelim.</em>",
      contactBody: "Siber güvenlik stajlarına, junior fırsatlara ve iddialı dijital iş birliklerine açığım.",
      visitAura: "AuraDigital’i ziyaret et",
      copyLink: "Site bağlantısını kopyala",
      copied: "Bağlantı kopyalandı",
      footerLine: "İSTANBUL · BİLGİSAYAR MÜHENDİSLİĞİ · SİBER GÜVENLİK"
    },
    ar: {
      navWork: "الأعمال",
      navSecurity: "الأمن",
      navContact: "التواصل",
      heroKicker: "هندسة الحاسوب × الأمن السيبراني",
      heroLead: "أبني منتجات رقمية، وأدرس كيف تتعطل الأنظمة، وأصمم كيف يجب أن تتعافى.",
      exploreWork: "استكشف أعمالي",
      transformKicker: "التحوّل",
      transformTitle: "أفكار بشرية.<br><span>دقة الآلة.</span>",
      transformLead: "تكتسب التقنية قيمتها عندما تحوّل الفضول إلى شيء مفيد وسريع ويمكن الاعتماد عليه.",
      securityKicker: "عقلية أمنية",
      securityHeroTitle: "فكّر كمهاجم.<br><span>وابنِ كمدافع.</span>",
      securityHeroLead: "لينكس والشبكات وأمن الويب والرصد—من خلال مختبرات عملية ومنتجات حقيقية.",
      founderKicker: "وضع المؤسس",
      founderTitle: "ابنِ.<br><span>أمّن.</span> تطوّر.",
      founderLead: "أبني AuraDigital من إسطنبول وأتقدم نحو هندسة الأمن السيبراني.",
      enterPortfolio: "ادخل إلى معرض الأعمال",
      scrollTransform: "مرّر للتحوّل",
      statementKicker: "ملف شخصي متحرك",
      statementTitle: "بين <em>الأنظمة</em><br>و<em>القصص.</em>",
      statementBody: "أنا طالب هندسة حاسوب ومؤسس AuraDigital. تجمع أعمالي بين تصميم المنتجات والبنية السحابية والأمن السيبراني.",
      locationLabel: "الموقع",
      directionLabel: "المسار",
      buildingLabel: "ما أبنيه",
      workKicker: "أنظمة مختارة",
      workTitle: "أفكار أصبحت<br><em>منتجات حقيقية.</em>",
      workIntro: "الاستراتيجية والواجهة والبرمجة والنشر—ضمن سير عمل عملي واحد.",
      auraDescription: "استوديو رقمي للمواقع وقوائم QR وتجارب NFC وأنظمة النمو العملية.",
      menuDescription: "إنشاء قوائم المطاعم ومعاينتها ونشرها عبر مسار رقمي مبسّط.",
      signalLabel: "تجربة إبداعية",
      signalTitle: "حركة ذات<br>هدف.",
      signalDescription: "صور مدعومة بالذكاء الاصطناعي تتحول إلى قصة تفاعلية؛ ليست زينة بل توجّه التجربة.",
      securitySectionKicker: "مساري في الأمن السيبراني",
      securitySectionTitle: "راقب الإشارة.<br><em>وافهم النظام.</em>",
      securitySectionBody: "أتقدم نحو SOC وهندسة الأمن عبر المختبرات العملية وتحليل الشبكات واختبار الويب والأتمتة.",
      viewGithub: "عرض GitHub",
      contactKicker: "الفصل القادم",
      contactTitle: "لنبنِ شيئاً<br><em>يستحق الحماية.</em>",
      contactBody: "منفتح على تدريبات الأمن السيبراني والفرص المبتدئة والتعاونات الرقمية الطموحة.",
      visitAura: "زيارة AuraDigital",
      copyLink: "نسخ رابط الموقع",
      copied: "تم نسخ الرابط",
      footerLine: "إسطنبول · هندسة الحاسوب · الأمن السيبراني"
    }
  };

  let activeLanguage = "en";
  let duration = 10;
  let targetTime = 0.01;
  let mediaReady = false;
  let ticking = false;
  let loaderFinished = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = (edge0, edge1, value) => {
    const x = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
    return x * x * (3 - 2 * x);
  };

  function setLoaderProgress(progress) {
    if (loaderProgress) loaderProgress.style.transform = `scaleX(${clamp(progress)})`;
  }

  function finishLoader() {
    if (loaderFinished) return;
    loaderFinished = true;
    setLoaderProgress(1);
    window.setTimeout(() => {
      body.classList.remove("is-loading");
      body.classList.add("is-ready");
    }, 220);
  }

  function chapterVisibility(progress, start, end) {
    const feather = Math.min(0.09, Math.max(0.045, (end - start) * 0.27));
    const fadeIn = start <= 0 ? 1 : smoothstep(start, start + feather, progress);
    const fadeOut = end >= 1 ? 1 : 1 - smoothstep(end - feather, end, progress);
    return clamp(Math.min(fadeIn, fadeOut));
  }

  function getSequenceProgress() {
    if (!sequence) return 0;
    const rect = sequence.getBoundingClientRect();
    const distance = Math.max(1, sequence.offsetHeight - window.innerHeight);
    return clamp(-rect.top / distance);
  }

  function syncVideo(force = false) {
    if (reduceMotion || !mediaReady || !video) return;
    if (video.seeking && !force) return;
    if (Math.abs(video.currentTime - targetTime) < 0.025 && !force) return;

    try {
      video.currentTime = clamp(targetTime, 0.01, Math.max(0.01, duration - 0.035));
    } catch (_) {
      // Browsers can briefly reject seeks while metadata is being attached.
    }
  }

  function render() {
    ticking = false;
    const sequenceValue = getSequenceProgress();
    const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
    const pageValue = clamp(window.scrollY / maxScroll);

    if (documentProgress) documentProgress.style.transform = `scaleX(${pageValue})`;
    if (sequenceProgress) sequenceProgress.style.transform = `scaleX(${sequenceValue})`;
    root.style.setProperty("--sequence-progress", sequenceValue.toFixed(4));
    header?.classList.toggle("is-compact", window.scrollY > 32);

    let strongestOpacity = -1;
    let strongestIndex = 0;

    chapters.forEach((chapter, index) => {
      const start = Number(chapter.dataset.start);
      const end = Number(chapter.dataset.end);
      const opacity = reduceMotion ? (index === 0 ? 1 : 0) : chapterVisibility(sequenceValue, start, end);
      const midpoint = (start + end) / 2;
      const direction = sequenceValue < midpoint ? 1 : -1;
      const y = direction * (1 - opacity) * 34;
      const scale = 0.982 + opacity * 0.018;

      chapter.style.opacity = opacity.toFixed(3);
      chapter.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;

      if (opacity > strongestOpacity) {
        strongestOpacity = opacity;
        strongestIndex = index;
      }
    });

    chapters.forEach((chapter, index) => {
      const active = index === strongestIndex && strongestOpacity > 0.22;
      chapter.classList.toggle("is-active", active);
      chapter.setAttribute("aria-hidden", String(!active));
      chapter.inert = !active;
    });

    if (sequenceNumber) sequenceNumber.textContent = `${String(strongestIndex + 1).padStart(2, "0")} / 04`;

    if (video && !reduceMotion) {
      targetTime = 0.01 + sequenceValue * Math.max(0.01, duration - 0.055);
      const scale = 1.055 + sequenceValue * 0.035;
      const lift = (sequenceValue - 0.5) * -0.7;
      video.style.transform = `translate3d(0, ${lift.toFixed(2)}%, 0) scale(${scale.toFixed(4)})`;
      video.style.filter = `saturate(${(0.82 + sequenceValue * 0.12).toFixed(3)}) contrast(1.1) brightness(${(0.72 - sequenceValue * 0.08).toFixed(3)})`;
      syncVideo();
    }
  }

  function requestRender() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(render);
  }

  function unlockVideo() {
    if (reduceMotion || !video || video.dataset.unlocked === "true") return;
    video.dataset.unlocked = "true";
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.then === "function") {
      playAttempt
        .then(() => {
          video.pause();
          syncVideo(true);
        })
        .catch(() => {
          video.dataset.unlocked = "false";
        });
    }
  }

  function handleVideoMetadata() {
    if (!video) return;
    duration = Number.isFinite(video.duration) ? video.duration : 10;
    mediaReady = true;
    setLoaderProgress(0.78);
    video.pause();
    render();
  }

  video?.addEventListener("loadedmetadata", handleVideoMetadata, { once: true });

  video?.addEventListener("loadeddata", finishLoader, { once: true });
  video?.addEventListener("canplay", finishLoader, { once: true });
  video?.addEventListener("seeked", requestRender);
  video?.addEventListener("error", () => {
    body.classList.add("video-failed");
    finishLoader();
  }, { once: true });

  if (video?.readyState >= 1) handleVideoMetadata();
  if (video?.readyState >= 2) finishLoader();

  ["pointerdown", "touchstart", "wheel"].forEach((eventName) => {
    window.addEventListener(eventName, unlockVideo, { once: true, passive: true });
  });

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender, { passive: true });
  window.addEventListener("pageshow", requestRender);
  window.addEventListener("load", () => window.setTimeout(finishLoader, 180), { once: true });
  window.setTimeout(finishLoader, 2400);
  setLoaderProgress(0.32);

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal-on-scroll").forEach((element) => revealObserver.observe(element));

  if (signalVideo) {
    const signalObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !reduceMotion) {
          signalVideo.play().catch(() => {});
        } else {
          signalVideo.pause();
        }
      });
    }, { threshold: 0.28 });
    signalObserver.observe(signalVideo);
  }

  const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduceMotion;
  if (canTilt) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const localX = clamp((event.clientX - rect.left) / rect.width);
        const localY = clamp((event.clientY - rect.top) / rect.height);
        const x = (localX - 0.5) * 2;
        const y = (localY - 0.5) * 2;
        card.style.setProperty("--ry", `${(x * 4.8).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-y * 4.8).toFixed(2)}deg`);
        card.style.setProperty("--mouse-local-x", `${(localX * 100).toFixed(1)}%`);
        card.style.setProperty("--mouse-local-y", `${(localY * 100).toFixed(1)}%`);
      }, { passive: true });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--rx", "0deg");
      });
    });

    window.addEventListener("pointermove", (event) => {
      root.style.setProperty("--mouse-x", `${(event.clientX / window.innerWidth * 100).toFixed(1)}%`);
      root.style.setProperty("--mouse-y", `${(event.clientY / window.innerHeight * 100).toFixed(1)}%`);
    }, { passive: true });
  }

  function setLanguage(language) {
    const nextLanguage = translations[language] ? language : "en";
    const dictionary = translations[nextLanguage];
    activeLanguage = nextLanguage;
    root.lang = nextLanguage;
    root.dir = nextLanguage === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = dictionary[element.dataset.i18n];
      if (value) element.textContent = value;
    });

    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      const value = dictionary[element.dataset.i18nHtml];
      if (value) element.innerHTML = value;
    });

    document.querySelectorAll("[data-language]").forEach((button) => {
      const active = button.dataset.language === nextLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    try {
      window.localStorage.setItem("dhia-language", nextLanguage);
    } catch (_) {
      // The language still works when storage is blocked.
    }
  }

  document.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });

  let storedLanguage = "en";
  try {
    storedLanguage = window.localStorage.getItem("dhia-language") || "en";
  } catch (_) {
    storedLanguage = "en";
  }
  setLanguage(storedLanguage);

  copyLink?.addEventListener("click", async () => {
    const label = copyLink.querySelector("span");
    try {
      await navigator.clipboard.writeText(window.location.href.split("#")[0]);
      if (label) label.textContent = translations[activeLanguage].copied;
      window.setTimeout(() => {
        if (label) label.textContent = translations[activeLanguage].copyLink;
      }, 1500);
    } catch (_) {
      window.location.hash = "top";
    }
  });

  render();
})();
