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

  // Tạo hiệu ứng những bông tuyết trắng tròn rơi liên tục trên màn hình
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

    const flakeCount = 110;
    const flakes = Array.from({ length: flakeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 3.5 + 1.2, // Bán kính bông tuyết tròn
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

  // Tự động sáng nút trên thanh menu khi cuộn trang
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
    if (!savedConfig) {
      this.updateSyncBadge("Chế độ Local (Chưa gắn Cloud)", false);
      return;
    }

    try {
      const configObj = JSON.parse(savedConfig);
      if (!firebase.apps.length) {
        firebase.initializeApp(configObj.firebaseConfig);
      }
      this.state.isCloudConnected = true;
      this.updateSyncBadge("Đã đồng bộ Cloud", true);

      firebase.database().ref("portfolioData").on("value", (snapshot) => {
        const cloudData = snapshot.val();
        if (cloudData) {
          this.state.data = cloudData;
          localStorage.setItem("anhtu_portfolio_data", JSON.stringify(cloudData));
          this.renderAll();
        } else if (this.state.isAdmin) {
          this.saveData();
        }
      });

      firebase.auth().onAuthStateChanged((user) => {
        const allowedEmail = (configObj.adminEmail || "").trim().toLowerCase();
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

    if (isAdmin) {
      toolbar.classList.remove("hidden");
      adminBtn.innerHTML = `<i class="fa-solid fa-user-check"></i> Admin`;
      emailSpan.textContent = emailLabel || "Admin";
    } else {
      toolbar.classList.add("hidden");
      adminBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Admin`;
    }
    this.renderAll();
  },

  async saveData() {
    localStorage.setItem("anhtu_portfolio_data", JSON.stringify(this.state.data));
    if (this.state.isCloudConnected && firebase.apps.length) {
      try {
        await firebase.database().ref("portfolioData").set(this.state.data);
        this.updateSyncBadge("Đã lưu lên Cloud ✓", true);
      } catch (e) {
        alert("Không thể ghi lên Cloud. Hãy kiểm tra quyền Admin hoặc Rules trên Firebase: " + e.message);
      }
    }
    this.renderAll();
  },

  logoutAdmin() {
    if (this.state.isCloudConnected && firebase.apps.length) {
      firebase.auth().signOut();
    }
    this.setAdminSession(false, null);
  },

  // Bấm vào menu sẽ cuộn mượt mà xuống phần đó trên cùng 1 trang
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

  updateSyncBadge(text, isOnline) {
    const badge = document.getElementById("sync-status");
    if (!badge) return;
    badge.textContent = text;
    badge.style.color = isOnline ? "#34d399" : "#fbbf24";
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
        reject(new Error("File lớn hơn 2.5MB. Với file dung lượng lớn, bạn nên dán link Google Drive vào ô Liên kết ngoài."));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  renderAll() {
    if (window.HomeFeature) HomeFeature.render();
    if (window.ProjectsFeature) ProjectsFeature.render();
    if (window.BlogFeature) BlogFeature.render();
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
