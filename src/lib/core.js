const DEFAULT_CLOUD_CONFIG = {
  adminEmail: "phamanhtu2849@gmail.com",
  firebaseConfig: {
    apiKey: "AIzaSyCZCF7QKOlF2U2KGDoSRbIr_7VHWzJa5_k",
    authDomain: "du-an-ca.firebaseapp.com",
    databaseURL: "https://du-an-ca-default-rtdb.firebaseio.com",
    projectId: "du-an-ca",
    storageBucket: "du-an-ca.firebasestorage.app",
    messagingSenderId: "754514100191",
    appId: "1:754514100191:web:a2110bd884daf68d684e6a"
  }
};

function safeParseJSON(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
}

window.App = {
  state: {
    data: null,
    isAdmin: false,
    adminUser: null,
    activeTab: "home",
    isCloudConnected: false,
    experience: null
  },

  getAllowedAdminEmail() {
    const configObj = safeParseJSON(localStorage.getItem("anhtu_firebase_config"), DEFAULT_CLOUD_CONFIG);
    return ((configObj && configObj.adminEmail) || DEFAULT_CLOUD_CONFIG.adminEmail).trim().toLowerCase();
  },

  init() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const fallbackData = window.DefaultPortfolioData
      ? JSON.parse(JSON.stringify(window.DefaultPortfolioData))
      : { profile: {}, skills: [], projects: [], posts: [] };

    this.state.data = safeParseJSON(localStorage.getItem("anhtu_portfolio_data"), fallbackData);
    this.state.experience = sessionStorage.getItem("anhtu_experience");

    this.initSnowfall();
    this.initParallax();
    this.applyExperience();
    this.renderAll();
    this.initFirebaseIfConfigured();
    this.initScrollSpy();
  },

  // Parallax 4 lớp siêu nhẹ bằng GPU (tự ngắt khi cuộn xuống nội dung dưới)
  initParallax() {
    const hero = document.getElementById("parallax-hero");
    const container = document.querySelector("[data-parallax-layers]");
    if (!hero || !container) return;

    const layerConfigs = [
      { el: container.querySelector('[data-parallax-layer="1"]'), factor: 0.52 },
      { el: container.querySelector('[data-parallax-layer="2"]'), factor: 0.38 },
      { el: container.querySelector('[data-parallax-layer="3"]'), factor: 0.34 },
      { el: container.querySelector('[data-parallax-layer="4"]'), factor: 0.06 }
    ].filter((item) => item.el);

    let heroHeight = hero.offsetHeight || window.innerHeight;
    let targetY = window.scrollY;
    let currentY = targetY;
    let rafId = null;

    const updateMetrics = () => {
      heroHeight = hero.offsetHeight || window.innerHeight;
    };

    const applyTransforms = (y) => {
      for (let i = 0; i < layerConfigs.length; i++) {
        const item = layerConfigs[i];
        item.el.style.transform = `translate3d(0, ${(y * item.factor).toFixed(2)}px, 0)`;
      }
    };

    const renderFrame = () => {
      if (this.state.experience !== "winter") {
        rafId = null;
        return;
      }

      const clampedTarget = Math.min(Math.max(targetY, 0), heroHeight);
      currentY += (clampedTarget - currentY) * 0.18;

      if (Math.abs(clampedTarget - currentY) < 0.35) {
        currentY = clampedTarget;
        applyTransforms(currentY);
        rafId = null;
        return;
      }

      applyTransforms(currentY);
      rafId = requestAnimationFrame(renderFrame);
    };

    const onScroll = () => {
      targetY = window.scrollY;
      if (
        !rafId &&
        this.state.experience === "winter" &&
        (targetY <= heroHeight + 120 || currentY < heroHeight)
      ) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMetrics, { passive: true });

    this.refreshParallax = () => {
      updateMetrics();
      targetY = window.scrollY;
      currentY = Math.min(Math.max(targetY, 0), heroHeight);
      applyTransforms(currentY);
    };
  },

  // Tuyết rơi tối ưu: gom 3 lệnh vẽ/khung hình & tự tạm dừng khi không ở Winter Space
  initSnowfall() {
    const canvas = document.getElementById("snow-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let resizeTimer = null;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          width = canvas.width = window.innerWidth;
          height = canvas.height = window.innerHeight;
        }, 150);
      },
      { passive: true }
    );

    const flakeCount = window.innerWidth < 768 ? 30 : 48;
    const opacityLevels = [0.3, 0.52, 0.78];
    const buckets = [[], [], []];

    for (let i = 0; i < flakeCount; i++) {
      buckets[i % 3].push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2.2 + 1.1,
        speedY: Math.random() * 0.95 + 0.45,
        speedX: (Math.random() - 0.5) * 0.45,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.016 + 0.006
      });
    }

    let snowRafId = null;
    const shouldRun = () => !document.hidden && this.state.experience === "winter";

    const drawSnow = () => {
      if (!shouldRun()) {
        snowRafId = null;
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      for (let b = 0; b < 3; b++) {
        const list = buckets[b];
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${opacityLevels[b]})`;
        for (let i = 0; i < list.length; i++) {
          const f = list[i];
          f.swing += f.swingSpeed;
          f.y += f.speedY;
          f.x += f.speedX + Math.sin(f.swing) * 0.35;

          if (f.y > height + 8) {
            f.y = -8;
            f.x = Math.random() * width;
          }
          if (f.x > width + 8) f.x = -8;
          if (f.x < -8) f.x = width + 8;

          ctx.moveTo(f.x + f.r, f.y);
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      snowRafId = requestAnimationFrame(drawSnow);
    };

    this.syncSnowState = () => {
      if (shouldRun() && !snowRafId) {
        snowRafId = requestAnimationFrame(drawSnow);
      } else if (!shouldRun() && snowRafId) {
        cancelAnimationFrame(snowRafId);
        snowRafId = null;
        ctx.clearRect(0, 0, width, height);
      }
    };

    document.addEventListener("visibilitychange", () => this.syncSnowState());
  },

  // ScrollSpy dùng IntersectionObserver (không đọc offsetTop khi cuộn)
  initScrollSpy() {
    const sections = ["home", "projects", "blog"]
      .map((id) => document.getElementById(`tab-${id}`))
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            const id = entries[i].target.id.replace("tab-", "");
            document.querySelectorAll(".nav-btn").forEach((btn) => {
              btn.classList.toggle("active", btn.dataset.tab === id);
            });
          }
        }
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
  },

  initFirebaseIfConfigured() {
    if (typeof firebase === "undefined") {
      this.updateSyncBadge("Chế độ Offline", false);
      return;
    }

    const configObj = safeParseJSON(localStorage.getItem("anhtu_firebase_config"), DEFAULT_CLOUD_CONFIG);
    const fbConfig =
      configObj && configObj.firebaseConfig
        ? configObj.firebaseConfig
        : DEFAULT_CLOUD_CONFIG.firebaseConfig;

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(fbConfig);
      }
      this.state.isCloudConnected = true;
      this.updateSyncBadge("Đã đồng bộ Cloud", true);

      firebase.database().ref("portfolioData").on(
        "value",
        (snapshot) => {
          const cloudData = snapshot.val();
          if (cloudData) {
            this.state.data = cloudData;
            localStorage.setItem("anhtu_portfolio_data", JSON.stringify(cloudData));
            this.renderAll();
          } else if (this.state.isAdmin) {
            this.saveData();
          }
        },
        (error) => {
          console.error("Lỗi đọc Database:", error);
          this.updateSyncBadge("Chưa bật Realtime DB", false);
        }
      );

      firebase.auth().onAuthStateChanged((user) => {
        const allowedEmail = this.getAllowedAdminEmail();
        if (user && user.email && user.email.toLowerCase() === allowedEmail) {
          this.setAdminSession(true, user.email);
        } else {
          if (user) firebase.auth().signOut();
          this.setAdminSession(false, null);
        }
      });
    } catch (err) {
      console.error("Lỗi cấu hình Firebase:", err);
      this.updateSyncBadge("Lỗi cấu hình Cloud", false);
    }
  },

  setAdminSession(isAdmin, emailLabel) {
    this.state.isAdmin = isAdmin;
    this.state.adminUser = emailLabel;
    const toolbar = document.getElementById("admin-toolbar");
    const adminBtn = document.getElementById("admin-toggle-btn");
    const emailSpan = document.getElementById("admin-email-display");

    if (toolbar && adminBtn && emailSpan) {
      if (isAdmin) {
        toolbar.classList.remove("hidden");
        adminBtn.innerHTML = `<i class="fa-solid fa-user-check"></i> Admin`;
        emailSpan.textContent = emailLabel || "Admin";
      } else {
        toolbar.classList.add("hidden");
        adminBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Admin`;
        emailSpan.textContent = "Admin";
      }
    }
    this.renderAll();
  },

  async saveData() {
    localStorage.setItem("anhtu_portfolio_data", JSON.stringify(this.state.data));
    if (this.state.isCloudConnected && typeof firebase !== "undefined" && firebase.apps.length) {
      try {
        await firebase.database().ref("portfolioData").set(this.state.data);
        this.updateSyncBadge("Đã lưu lên Cloud ✓", true);
      } catch (e) {
        alert("Chưa lưu được lên Cloud: " + e.message);
      }
    }
    this.renderAll();
  },

  logoutAdmin() {
    if (this.state.isCloudConnected && typeof firebase !== "undefined" && firebase.apps.length) {
      firebase.auth().signOut();
    }
    this.setAdminSession(false, null);
  },

  switchTab(tabName) {
    this.state.activeTab = tabName;
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    const targetSection = document.getElementById(`tab-${tabName}`);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },

  enterExperience(experience) {
    this.state.experience = experience;
    sessionStorage.setItem("anhtu_experience", experience);
    this.applyExperience();
    this.renderAll();
    window.scrollTo({ top: 0, behavior: "auto" });
    if (this.refreshParallax) this.refreshParallax();
  },

  returnToGate() {
    this.state.experience = null;
    sessionStorage.removeItem("anhtu_experience");
    this.applyExperience();
    this.renderAll();
    window.scrollTo({ top: 0, behavior: "auto" });
  },

  applyExperience() {
    const experience = this.state.experience;
    document.body.classList.toggle("experience-selected", Boolean(experience));
    document.body.classList.toggle("experience-professional", experience === "professional");
    const footerEdition = document.getElementById("footer-edition");
    if (footerEdition) {
      footerEdition.textContent =
        experience === "professional" ? "Professional Portfolio" : "Winter Edition Space";
    }
    if (this.syncSnowState) this.syncSnowState();
    if (this.refreshParallax) this.refreshParallax();
  },

  updateSyncBadge(text, isOnline) {
    const badge = document.getElementById("sync-status");
    if (!badge) return;
    badge.textContent = text;
    badge.style.color = isOnline ? "#34d399" : "#fbbf24";
    badge.style.borderColor = isOnline ? "#34d399" : "#fbbf24";
  },

  readImageCompressed(file, maxWidth = 900) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      if (file.size > 2.5 * 1024 * 1024) {
        reject(new Error("File lớn hơn 2.5MB. Bạn nên dán link Google Drive vào ô Liên kết ngoài."));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  renderAll() {
    try { if (window.HomeFeature) HomeFeature.render(); } catch (e) { console.error("Lỗi Home:", e); }
    try { if (window.ProjectsFeature) ProjectsFeature.render(); } catch (e) { console.error("Lỗi Projects:", e); }
    try { if (window.BlogFeature) BlogFeature.render(); } catch (e) { console.error("Lỗi Blog:", e); }
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
