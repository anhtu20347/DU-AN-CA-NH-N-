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

  init() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const fallbackData = window.DefaultPortfolioData
      ? JSON.parse(JSON.stringify(window.DefaultPortfolioData))
      : { profile: {}, skills: [], projects: [], posts: [] };

    this.state.data = safeParseJSON(localStorage.getItem("anhtu_portfolio_data"), fallbackData);
    this.state.experience = sessionStorage.getItem("anhtu_experience");
    this.applyExperience();

    this.renderAll();
    this.initFirebaseIfConfigured();
    this.initSnowfall();
    this.initScrollSpy();
  },

  initSnowfall() {
    const canvas = document.getElementById("snow-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const flakeCount = window.innerWidth < 768 ? 55 : 95;
    const flakes = Array.from({ length: flakeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3 + 1.2,
      speedY: Math.random() * 1.2 + 0.4,
      speedX: (Math.random() - 0.5) * 0.6,
      swing: Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.02 + 0.008,
      opacity: Math.random() * 0.5 + 0.3
    }));

    function drawSnow() {
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        f.swing += f.swingSpeed;
        f.y += f.speedY;
        f.x += f.speedX + Math.sin(f.swing) * 0.4;

        if (f.y > height + 10) {
          f.y = -10;
          f.x = Math.random() * width;
        }
        if (f.x > width + 10) f.x = -10;
        if (f.x < -10) f.x = width + 10;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        ctx.fill();
      }
      requestAnimationFrame(drawSnow);
    }

    drawSnow();
  },

  initScrollSpy() {
    window.addEventListener("scroll", () => {
      const sections = ["home", "projects", "blog"];
      let current = "home";
      for (const id of sections) {
        const el = document.getElementById(`tab-${id}`);
        if (el && window.scrollY >= el.offsetTop - 220) {
          current = id;
        }
      }
      document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === current);
      });
    });
  },

  initFirebaseIfConfigured() {
    if (typeof firebase === "undefined") {
      this.updateSyncBadge("Chế độ Offline", false);
      return;
    }

    const configObj = safeParseJSON(localStorage.getItem("anhtu_firebase_config"), DEFAULT_CLOUD_CONFIG);
    const fbConfig = (configObj && configObj.firebaseConfig) ? configObj.firebaseConfig : DEFAULT_CLOUD_CONFIG.firebaseConfig;

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
        const allowedEmail = ((configObj && configObj.adminEmail) || DEFAULT_CLOUD_CONFIG.adminEmail).trim().toLowerCase();
        if (user && user.email.toLowerCase() === allowedEmail) {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  returnToGate() {
    this.state.experience = null;
    sessionStorage.removeItem("anhtu_experience");
    this.applyExperience();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  applyExperience() {
    const experience = this.state.experience;
    document.body.classList.toggle("experience-selected", Boolean(experience));
    document.body.classList.toggle("experience-professional", experience === "professional");
    const footerEdition = document.getElementById("footer-edition");
    if (footerEdition) {
      footerEdition.textContent = experience === "professional" ? "Professional Portfolio" : "Winter Edition Space";
    }
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

