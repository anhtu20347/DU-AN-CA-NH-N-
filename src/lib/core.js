window.App = {
  state: {
    data: null,
    isAdmin: false,
    adminUser: null,
    activeTab: "home",
    isCloudConnected: false
  },

  // Khởi chạy ứng dụng
  init() {
    document.getElementById("year").textContent = new Date().getFullYear();

    // Tải dữ liệu tạm trong trình duyệt hoặc dữ liệu mặc định
    const cached = localStorage.getItem("anhtu_portfolio_data");
    this.state.data = cached ? JSON.parse(cached) : structuredClone(window.DefaultPortfolioData);

    // Kiểm tra cấu hình Firebase Cloud
    this.initFirebaseIfConfigured();
    this.renderAll();
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

      // Lắng nghe dữ liệu thời gian thực từ Firebase Realtime Database
      firebase.database().ref("portfolioData").on("value", (snapshot) => {
        const cloudData = snapshot.val();
        if (cloudData) {
          this.state.data = cloudData;
          localStorage.setItem("anhtu_portfolio_data", JSON.stringify(cloudData));
          this.renderAll();
        } else if (this.state.isAdmin) {
          // Đẩy dữ liệu khởi tạo lên Cloud lần đầu
          this.saveData();
        }
      });

      // Kiểm tra phiên đăng nhập Admin duy nhất
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
      adminBtn.innerHTML = `<i class="fa-solid fa-user-check"></i> Đang ở chế độ Admin`;
      emailSpan.textContent = emailLabel || "Admin";
    } else {
      toolbar.classList.add("hidden");
      adminBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Admin`;
    }
    this.renderAll();
  },

  // Lưu mọi thay đổi (Không bao giờ mất khi sửa code giao diện)
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

  switchTab(tabName) {
    this.state.activeTab = tabName;
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    document.querySelectorAll(".tab-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === `tab-${tabName}`);
    });
  },

  updateSyncBadge(text, isOnline) {
    const badge = document.getElementById("sync-status");
    if (!badge) return;
    badge.textContent = text;
    badge.style.color = isOnline ? "#10b981" : "#f59e0b";
  },

  // Chuyển đổi và tự động nén ảnh tải lên thành chuỗi Base64 nhẹ để lưu thẳng vào Database miễn phí
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

  // Đọc file đính kèm (PDF, DOCX, ZIP nhỏ < 2MB) thành DataURL để khách tải về
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
