window.AdminFeature = {
  showModal(html) {
    const root = document.getElementById("modal-root");
    if (!root) return;
    root.innerHTML = `
      <div class="modal-backdrop" onclick="if (event.target === this) AdminFeature.closeModal()">
        <div class="modal-box">${html}</div>
      </div>
    `;
  },

  clearAuthInputs() {
    const emailEl = document.getElementById("admin-login-email");
    const passEl = document.getElementById("admin-login-pass");
    if (emailEl) emailEl.value = "";
    if (passEl) passEl.value = "";
  },

  closeModal() {
    this.clearAuthInputs();
    const root = document.getElementById("modal-root");
    if (root) root.innerHTML = "";
  },

  openAuthModal() {
    if (App.state.isAdmin) {
      alert("Bạn đang đăng nhập ở chế độ Quản trị viên (Admin).");
      return;
    }

    const hasCloud =
      App.state.isCloudConnected &&
      typeof firebase !== "undefined" &&
      firebase.apps.length > 0;

    this.showModal(`
      <h3 style="margin-bottom:8px;">
        <i class="fa-solid fa-user-shield" style="color:var(--accent)"></i> Đăng nhập Quản trị viên
      </h3>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:18px;">
        Chỉ tài khoản Quản trị viên được cấp phép mới có quyền thêm, sửa, xóa nội dung.
      </p>

      ${
        hasCloud
          ? `
          <div style="text-align:center; margin-bottom:18px;">
            <button type="button" class="btn btn-primary" onclick="AdminFeature.loginWithGoogle()" style="width:100%; justify-content:center; padding:12px; font-size:0.98rem;">
              <i class="fa-brands fa-google"></i> Đăng nhập bằng Google
            </button>
          </div>

          <div style="text-align:center; color:var(--text-muted); font-size:0.82rem; margin:14px 0; border-top:1px dashed var(--border-frost); padding-top:14px;">
            Hoặc đăng nhập bằng Email / Mật khẩu
          </div>

          <form id="admin-login-form" autocomplete="off" onsubmit="event.preventDefault(); AdminFeature.loginWithEmail();">
            <div class="form-group">
              <label for="admin-login-email">Email Quản trị</label>
              <input
                id="admin-login-email"
                name="adm_user_nocache"
                type="text"
                inputmode="email"
                class="form-control"
                value=""
                placeholder="Nhập email..."
                autocomplete="off"
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
                readonly
                onfocus="this.removeAttribute('readonly');"
              />
            </div>
            <div class="form-group">
              <label for="admin-login-pass">Mật khẩu</label>
              <input
                id="admin-login-pass"
                name="adm_pass_nocache"
                type="password"
                class="form-control"
                value=""
                placeholder="Nhập mật khẩu..."
                autocomplete="new-password"
                readonly
                onfocus="this.removeAttribute('readonly');"
              />
            </div>

            <div id="auth-error-msg" style="color:#f87171; font-size:0.86rem; margin-bottom:14px; display:none;"></div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:18px;">
              <button type="button" class="btn" onclick="AdminFeature.closeModal()">Đóng</button>
              <button type="submit" class="btn btn-primary">Đăng nhập</button>
            </div>
          </form>
        `
          : `
          <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:14px; border-radius:12px; margin-bottom:18px; font-size:0.88rem;">
            <strong>Trạng thái:</strong> Không kết nối được Firebase Cloud. Vui lòng kiểm tra lại đường truyền mạng.
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn" onclick="AdminFeature.closeModal()">Đóng</button>
          </div>
        `
      }
    `);

    // Xóa trắng lại một lần nữa sau khi mở để chống trình duyệt tự điền
    setTimeout(() => this.clearAuthInputs(), 30);
  },

  showAuthError(msg) {
    const el = document.getElementById("auth-error-msg");
    if (el) {
      el.textContent = msg;
      el.style.display = "block";
    } else {
      alert(msg);
    }
  },

  async loginWithGoogle() {
    try {
      await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await firebase.auth().signInWithPopup(provider);
      const email = (result.user && result.user.email ? result.user.email : "").toLowerCase();
      if (email !== App.getAllowedAdminEmail()) {
        await firebase.auth().signOut();
        this.showAuthError("Tài khoản này không có quyền Quản trị viên!");
        return;
      }
      this.closeModal();
    } catch (err) {
      if (err.code === "auth/unauthorized-domain") {
        this.showAuthError("Tên miền GitHub Pages chưa được thêm vào Authorized domains trên Firebase Console.");
      } else if (err.code === "auth/operation-not-allowed") {
        this.showAuthError("Bạn chưa bật phương thức đăng nhập Google trong Firebase Authentication.");
      } else if (err.code === "auth/popup-blocked") {
        this.showAuthError("Trình duyệt đang chặn cửa sổ pop-up. Hãy cho phép pop-up rồi thử lại.");
      } else if (err.code !== "auth/popup-closed-by-user") {
        this.showAuthError("Lỗi đăng nhập Google: " + err.message);
      }
    }
  },

  async loginWithEmail() {
    const emailEl = document.getElementById("admin-login-email");
    const passEl = document.getElementById("admin-login-pass");
    const email = (emailEl?.value || "").trim();
    const pass = passEl?.value || "";

    if (!email || !pass) {
      this.showAuthError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    // Xóa trắng ô mật khẩu ngay lập tức sau khi lấy giá trị
    if (passEl) passEl.value = "";

    try {
      await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const result = await firebase.auth().signInWithEmailAndPassword(email, pass);
      const signedEmail = (result.user && result.user.email ? result.user.email : "").toLowerCase();
      if (signedEmail !== App.getAllowedAdminEmail()) {
        await firebase.auth().signOut();
        this.showAuthError("Tài khoản này không có quyền Quản trị viên!");
        return;
      }
      this.closeModal();
    } catch (err) {
      if (err.code === "auth/operation-not-allowed") {
        this.showAuthError("Phương thức Email/Password chưa được bật trên Firebase. Hãy dùng nút Đăng nhập bằng Google ở trên.");
      } else {
        this.showAuthError("Email hoặc mật khẩu không chính xác.");
      }
    }
  },

  openFirebaseConfigModal() {
    if (!App.state.isAdmin) {
      alert("Chỉ Quản trị viên đã đăng nhập mới có thể xem và thay đổi cấu hình Cloud.");
      return;
    }

    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem("anhtu_firebase_config") || "null");
    } catch (e) {}

    const currentEmail = (saved && saved.adminEmail) || App.getAllowedAdminEmail();
    const currentConfigStr =
      saved && saved.firebaseConfig
        ? JSON.stringify(saved.firebaseConfig, null, 2)
        : JSON.stringify(
            {
              apiKey: "AIzaSyCZCF7QKOlF2U2KGDoSRbIr_7VHWzJa5_k",
              authDomain: "du-an-ca.firebaseapp.com",
              databaseURL: "https://du-an-ca-default-rtdb.firebaseio.com",
              projectId: "du-an-ca",
              storageBucket: "du-an-ca.firebasestorage.app",
              messagingSenderId: "754514100191",
              appId: "1:754514100191:web:a2110bd884daf68d684e6a"
            },
            null,
            2
          );

    this.showModal(`
      <h3 style="margin-bottom:8px;">Cấu hình Kho lưu trữ Firebase</h3>
      <div class="form-group">
        <label>Email Admin duy nhất được phép sửa web</label>
        <input id="fb-admin-email" type="email" class="form-control" autocomplete="off" value="${currentEmail}" />
      </div>
      <div class="form-group">
        <label>Đối tượng firebaseConfig (JSON)</label>
        <textarea id="fb-config-json" class="form-control" style="min-height:170px; font-family:monospace; font-size:0.84rem;">${currentConfigStr}</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn" onclick="AdminFeature.closeModal()">Hủy</button>
        <button type="button" class="btn btn-primary" onclick="AdminFeature.saveFirebaseConfig()">Lưu & Kết nối Cloud</button>
      </div>
    `);
  },

  saveFirebaseConfig() {
    if (!App.state.isAdmin) return;
    const adminEmail = (document.getElementById("fb-admin-email")?.value || "").trim();
    const rawJson = (document.getElementById("fb-config-json")?.value || "").trim();
    try {
      const firebaseConfig = JSON.parse(rawJson);
      localStorage.setItem(
        "anhtu_firebase_config",
        JSON.stringify({ adminEmail, firebaseConfig })
      );
      alert("Đã lưu cấu hình! Trang web sẽ tự tải lại.");
      window.location.reload();
    } catch (e) {
      alert("Chuỗi JSON firebaseConfig chưa đúng định dạng. Hãy kiểm tra lại dấu ngoặc kép!");
    }
  },

  exportBackup() {
    const dataStr = JSON.stringify(App.state.data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anhtu-portfolio-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }
};
