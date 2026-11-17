window.AdminFeature = {
  showModal(htmlContent) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `
      <div class="modal-backdrop" onclick="if(event.target === this) AdminFeature.closeModal()">
        <div class="modal-box">
          ${htmlContent}
        </div>
      </div>
    `;
  },

  closeModal() {
    document.getElementById("modal-root").innerHTML = "";
  },

  openAuthModal() {
    if (App.state.isAdmin) {
      alert("Bạn đang ở trong chế độ Quản trị viên (Admin).");
      return;
    }

    const hasCloud = App.state.isCloudConnected;

    this.showModal(`
      <h3 style="margin-bottom:8px;"><i class="fa-solid fa-user-shield" style="color:var(--accent)"></i> Đăng nhập Quản trị viên</h3>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:18px;">
        Chỉ duy nhất tài khoản Admin của Anh Tú mới có quyền thêm, sửa, xóa nội dung trên trang web này.
      </p>
      ${
        hasCloud
          ? `
          <div class="form-group">
            <label>Email Admin</label>
            <input id="login-email" type="email" class="form-control" placeholder="nhap-email-cua-ban@gmail.com" />
          </div>
          <div class="form-group">
            <label>Mật khẩu</label>
            <input id="login-password" type="password" class="form-control" placeholder="••••••••" />
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
            <button class="btn btn-sm btn-outline" onclick="AdminFeature.openFirebaseConfigModal()">Đổi cấu hình Cloud</button>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-secondary" onclick="AdminFeature.closeModal()">Đóng</button>
              <button class="btn btn-primary" onclick="AdminFeature.loginWithFirebase()">Đăng nhập</button>
            </div>
          </div>
        `
          : `
          <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:14px; border-radius:12px; margin-bottom:18px; font-size:0.88rem;">
            <strong>Trạng thái:</strong> Bạn chưa gắn mã Firebase Cloud. Bạn có thể bật <strong>Chế độ Admin Thử nghiệm</strong> ngay bây giờ để sửa web trực tiếp, hoặc bấm <strong>Kết nối Firebase Cloud</strong> để lưu vĩnh viễn trên đám mây.
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="AdminFeature.closeModal()">Đóng</button>
            <button class="btn btn-outline" onclick="AdminFeature.openFirebaseConfigModal()">
              <i class="fa-solid fa-cloud"></i> Kết nối Firebase Cloud
            </button>
            <button class="btn btn-primary" onclick="AdminFeature.enableLocalAdmin()">
              <i class="fa-solid fa-unlock"></i> Vào Admin Thử nghiệm ngay
            </button>
          </div>
        `
      }
    `);
  },

  enableLocalAdmin() {
    this.closeModal();
    App.setAdminSession(true, "Admin (Local Mode)");
  },

  async loginWithFirebase() {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value;
    try {
      await firebase.auth().signInWithEmailAndPassword(email, pass);
      this.closeModal();
    } catch (err) {
      alert("Đăng nhập thất bại: " + err.message);
    }
  },

  openFirebaseConfigModal() {
    const saved = localStorage.getItem("anhtu_firebase_config");
    const parsed = saved ? JSON.parse(saved) : { adminEmail: "", firebaseConfig: {} };

    this.showModal(`
      <h3 style="margin-bottom:8px;">Cấu hình Kho lưu trữ Firebase Miễn phí</h3>
      <p style="color:var(--text-muted); font-size:0.86rem; margin-bottom:16px;">
        Dán cấu hình Firebase Project của bạn vào đây. Khi đã kết nối, dù bạn sửa code trên GitHub bao nhiêu lần thì bài viết, ảnh và file đã đăng vẫn giữ nguyên 100%.
      </p>
      <div class="form-group">
        <label>Email Admin duy nhất được phép sửa web</label>
        <input id="cfg-admin-email" type="email" class="form-control" placeholder="email-admin-cua-ban@gmail.com" value="${parsed.adminEmail || ''}" />
      </div>
      <div class="form-group">
        <label>Đối tượng firebaseConfig (JSON)</label>
        <textarea id="cfg-json" class="form-control" style="font-family:monospace; font-size:0.82rem; min-height:150px;" placeholder='{"apiKey": "...", "authDomain": "...", "databaseURL": "...", "projectId": "..."}'>${
          Object.keys(parsed.firebaseConfig || {}).length ? JSON.stringify(parsed.firebaseConfig, null, 2) : ""
        }</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
        <button class="btn btn-secondary" onclick="AdminFeature.closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="AdminFeature.saveFirebaseConfig()">Lưu & Kết nối Cloud</button>
      </div>
    `);
  },

  saveFirebaseConfig() {
    const adminEmail = document.getElementById("cfg-admin-email").value.trim();
    const rawJson = document.getElementById("cfg-json").value.trim();
    try {
      const firebaseConfig = JSON.parse(rawJson);
      localStorage.setItem("anhtu_firebase_config", JSON.stringify({ adminEmail, firebaseConfig }));
      this.closeModal();
      location.reload();
    } catch (e) {
      alert("Chuỗi JSON firebaseConfig chưa đúng định dạng. Hãy kiểm tra lại dấu ngoặc kép!");
    }
  },

  exportBackup() {
    const blob = new Blob([JSON.stringify(App.state.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anhtu-web-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }
};
