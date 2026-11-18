// Cấu hình Firebase mặc định cho mọi thiết bị (Điện thoại, Máy tính khách...)
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

window.App = {
  state: {
    data: null,
    isAdmin: false,
    adminUser: null,
    activeTab: "home",
    isCloudConnected: false
  },

  init() {
    document.getElementById("year").textContent = new Date().getFullYear();

    const cached = localStorage.getItem("anhtu_portfolio_data");
    this.state.data = cached ? JSON.parse(cached) : structuredClone(window.DefaultPortfolioData);

    this.initFirebaseIfConfigured();
    this.renderAll();
    this.initSnowfall();
    this.initScrollSpy();
  },

  // Hiệu ứng những bông tuyết trắng tròn rơi liên tục trên cả máy tính & điện thoại
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

    const flakeCount = window.innerWidth < 768 ? 65 : 110;
    const flakes = Array.from({ length: flakeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3.5 + 1.2,
      speedY: Math.random() * 1.4 + 0.5,
      speedX: (Math.random() - 0.5) * 0.7,
      swing: Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.02 + 0.008,
      opacity: Math.random() * 0.55 + 0.35
    }));

    function drawSnow() {
      ctx.clearRect(0, 0, width, height);
      for (const f of flakes) {
        f.swing += f.swingSpeed;
        f.y += f.speedY;
        f.x += f.speedX + Math.sin(f.swing) * 0.45;

        if (f.y > height + 10) {
          f.y = -10;
          f.x = Math.random() * width;
        }
        if (f.x > width + 10) f.x = -10;
        if (f.x < -10) f.x = width + 10;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#ffffff";
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
    const savedConfig = localStorage.getItem("anhtu_firebase_config");
    const configObj = savedConfig ? JSON.parse(savedConfig) : DEFAULT_CLOUD_CONFIG;

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(configObj.firebaseConfig);
      }
      this.state.isCloudConnected = true;
      this.updateSyncBadge("Đã đồng bộ Cloud", true);

      // Lắng nghe dữ liệu từ Firebase Realtime Database
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
        const allowedEmail = (configObj.adminEmail || DEFAULT_CLOUD_CONFIG.adminEmail).trim().toLowerCase();
        if (user && user.email.toLowerCase() === allowedEmail) {
          this.setAdminSession(true, user.email);
        } else {
          if (user) firebase.auth().signOut();
          this.setAdminSession(false, null);
        }
      });
