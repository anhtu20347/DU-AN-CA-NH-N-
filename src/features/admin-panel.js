openAuthModal() {
    if (App.state.isAdmin) {
      alert("Bạn đang ở trong chế độ Quản trị viên (Admin).");
      return;
    }

    const hasCloud = App.state.isCloudConnected;

    this.showModal(`
      <h3 style="margin-bottom:8px;"><i class="fa-solid fa-user-shield" style="color:var(--accent)"></i> Đăng nhập Quản trị viên</h3>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:18px;">
        Đăng nhập bằng tài khoản Google độc quyền của Anh Tú để quản lý và cập nhật nội dung web.
      </p>
      ${
        hasCloud
          ? `
          <div style="text-align: center; margin: 24px 0;">
            <button class="btn btn-primary" onclick="AdminFeature.loginWithGoogle()" style="padding: 12px 24px; font-size: 1rem; gap: 10px;">
              <i class="fa-brands fa-google"></i> Đăng nhập bằng Google
            </button>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
            <button class="btn btn-sm btn-outline" onclick="AdminFeature.openFirebaseConfigModal()">Đổi cấu hình Cloud</button>
            <button class="btn btn-secondary" onclick="AdminFeature.closeModal()">Đóng</button>
          </div>
        `
          : `
          <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:14px; border-radius:12px; margin-bottom:18px; font-size:0.88rem;">
            <strong>Trạng thái:</strong> Bạn chưa gắn mã Firebase Cloud. Bạn có thể bật <strong>Chế độ Admin Thử nghiệm</strong> ngay bên dưới.
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

  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      await firebase.auth().signInWithPopup(provider);
      this.closeModal();
    } catch (err) {
      alert("Đăng nhập Google thất bại: " + err.message);
    }
  },
