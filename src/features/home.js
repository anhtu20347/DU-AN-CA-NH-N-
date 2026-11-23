window.HomeFeature = {
  render() {
    const container = document.getElementById("tab-home");
    const p = App.state.data.profile;
    const isAdmin = App.state.isAdmin;

    if (document.body.classList.contains("experience-professional")) {
      this.renderProfessional(container, p, isAdmin);
      return;
    }

    const skillsHtml = (p.skills || [])
      .map((s) => `<span class="tag">${s}</span>`)
      .join("");

    const linksHtml = (p.links || [])
      .map(
        (l) => `
        <a href="${l.url}" target="_blank" rel="noopener" class="pill-link">
          <i class="${l.icon || 'fa-solid fa-link'}"></i> ${l.label}
        </a>`
      )
      .join("");

    const cvButtonHtml = p.cvFileData
      ? `<a href="${p.cvFileData}" download="${p.cvFileName || 'CV_AnhTu.pdf'}" class="pill-link" style="border-color: var(--accent);">
          <i class="fa-solid fa-file-arrow-down"></i> Tải CV (${p.cvFileName})
         </a>`
      : "";

    container.innerHTML = `
      <div class="card">
        ${
          isAdmin
            ? `<div style="display:flex; justify-content:flex-end; margin-bottom:14px;">
                <button class="btn btn-sm btn-primary" onclick="HomeFeature.openEditProfileModal()">
                  <i class="fa-solid fa-pen-to-square"></i> Chỉnh sửa Hồ sơ & Tải CV
                </button>
              </div>`
            : ""
        }
        <div class="hero-grid">
          <div class="avatar-wrap">
            <img src="${p.avatarUrl}" alt="${p.name}" />
          </div>
          <div>
            <span class="hero-badge">${p.badge}</span>
            <h1 class="hero-title">${p.name}</h1>
            <p style="font-weight:600; color: var(--accent); margin-bottom:12px;">${p.headline}</p>
            <p class="hero-bio">${p.bio}</p>
            <div class="link-pills">
              ${cvButtonHtml}
              ${linksHtml}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 14px;"><i class="fa-solid fa-bolt" style="color:var(--accent)"></i> Kỹ năng & Thế mạnh chuyên môn</h3>
        <div class="tag-list">
          ${skillsHtml}
        </div>
      </div>
    `;
  },

  renderProfessional(container, p, isAdmin) {
    const skillsHtml = (p.skills || []).map((skill) => `<li>${skill}</li>`).join("");
    const contactHtml = (p.links || [])
      .filter((link) => !link.url.includes("example.com"))
      .map((link) => `<a href="${link.url}" target="_blank" rel="noopener"><i class="${link.icon || "fa-solid fa-link"}"></i> ${link.label}</a>`)
      .join("");
    const cvButtonHtml = p.cvFileData
      ? `<a class="resume-download" href="${p.cvFileData}" download="${p.cvFileName || "CV_AnhTu.pdf"}"><i class="fa-solid fa-download"></i> Tải CV</a>`
      : "";
    const adminButton = isAdmin
      ? `<button class="btn btn-sm btn-primary" onclick="HomeFeature.openEditProfileModal()"><i class="fa-solid fa-pen-to-square"></i> Chỉnh sửa hồ sơ</button>`
      : "";

    container.innerHTML = `
      <div class="resume-page">
        <div class="resume-admin">${adminButton}</div>
        <header class="resume-header">
          <div class="resume-portrait"><img src="${p.avatarUrl}" alt="Ảnh đại diện ${p.name}" /></div>
          <div class="resume-heading">
            <p class="resume-kicker">CURRICULUM VITAE</p>
            <h1>${p.name}</h1>
            <p class="resume-role">${p.headline}</p>
            <div class="resume-contact">${contactHtml}${cvButtonHtml}</div>
          </div>
          <span class="resume-mark" aria-hidden="true">AT.</span>
        </header>
        <div class="resume-rule"></div>
        <div class="resume-columns">
          <div class="resume-main-column">
            <section class="resume-section">
              <h2><span>01</span> Giới thiệu</h2>
              <p class="resume-summary">${p.bio}</p>
            </section>
            <section class="resume-section">
              <h2><span>02</span> Dự án tiêu biểu</h2>
              <p class="resume-hint">Các sản phẩm học thuật, kinh doanh và truyền thông được trình bày trong mục Dự án bên dưới.</p>
              <a class="resume-inline-link" href="#tab-projects" onclick="App.switchTab('projects'); return false;">Xem các dự án <i class="fa-solid fa-arrow-right"></i></a>
            </section>
            <section class="resume-section">
              <h2><span>03</span> Định hướng</h2>
              <p class="resume-summary">Kết hợp tư duy quản trị, marketing và công nghệ để xây dựng trải nghiệm, dự án và hoạt động có giá trị thực tiễn.</p>
            </section>
          </div>
          <aside class="resume-sidebar">
            <section class="resume-section">
              <h2><span>04</span> Học vấn</h2>
              <div class="resume-timeline"><span class="resume-dot"></span><div><h3>Trường Đại học Ngân hàng TP. Hồ Chí Minh</h3><p>Quản trị Kinh doanh & Marketing</p><small>Đang theo học</small></div></div>
            </section>
            <section class="resume-section">
              <h2><span>05</span> Năng lực</h2>
              <ul class="resume-skills">${skillsHtml}</ul>
            </section>
            <section class="resume-note"><span>PROFILE</span><p>${p.badge}</p></section>
          </aside>
        </div>
      </div>`;
  },

  openEditProfileModal() {
    const p = App.state.data.profile;
    const linksText = (p.links || []).map((l) => `${l.label} | ${l.url}`).join("\n");

    AdminFeature.showModal(`
      <h3 style="margin-bottom:18px;">Chỉnh sửa Hồ sơ Cá nhân</h3>
      <div class="form-group">
        <label>Tên hiển thị</label>
        <input id="edit-name" class="form-control" value="${p.name}" />
      </div>
      <div class="form-group">
        <label>Nhãn giới thiệu ngắn (Badge)</label>
        <input id="edit-badge" class="form-control" value="${p.badge}" />
      </div>
      <div class="form-group">
        <label>Tiêu đề chuyên môn (Headline)</label>
        <input id="edit-headline" class="form-control" value="${p.headline}" />
      </div>
      <div class="form-group">
        <label>Giới thiệu bản thân chi tiết</label>
        <textarea id="edit-bio" class="form-control">${p.bio}</textarea>
      </div>
      <div class="form-group">
        <label>Đổi Ảnh đại diện (Chọn ảnh từ máy hoặc dán link ảnh)</label>
        <input type="file" id="edit-avatar-file" accept="image/*" class="form-control" style="margin-bottom:8px;" />
        <input id="edit-avatar-url" class="form-control" placeholder="Hoặc dán URL ảnh..." value="${p.avatarUrl}" />
      </div>
      <div class="form-group">
        <label>Đính kèm File CV / Portfolio (PDF, DOCX < 2.5MB)</label>
        <input type="file" id="edit-cv-file" accept=".pdf,.doc,.docx" class="form-control" />
        ${p.cvFileName ? `<small style="color:var(--accent)">Đang lưu: ${p.cvFileName}</small>` : ""}
      </div>
      <div class="form-group">
        <label>Kỹ năng (Cách nhau bằng dấu phẩy)</label>
        <input id="edit-skills" class="form-control" value="${(p.skills || []).join(", ")}" />
      </div>
      <div class="form-group">
        <label>Các liên kết mạng xã hội (Mỗi dòng: Tên hiển thị | Link URL)</label>
        <textarea id="edit-links" class="form-control" placeholder="GitHub | https://github.com/...">${linksText}</textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
        <button class="btn btn-secondary" onclick="AdminFeature.closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="HomeFeature.saveProfile()">Lưu thay đổi</button>
      </div>
    `);
  },

  async saveProfile() {
    const p = App.state.data.profile;
    p.name = document.getElementById("edit-name").value.trim();
    p.badge = document.getElementById("edit-badge").value.trim();
    p.headline = document.getElementById("edit-headline").value.trim();
    p.bio = document.getElementById("edit-bio").value;
    p.avatarUrl = document.getElementById("edit-avatar-url").value.trim();

    const avatarInput = document.getElementById("edit-avatar-file");
    if (avatarInput.files && avatarInput.files[0]) {
      p.avatarUrl = await App.readImageCompressed(avatarInput.files[0], 500);
    }

    const cvInput = document.getElementById("edit-cv-file");
    if (cvInput.files && cvInput.files[0]) {
      try {
        p.cvFileData = await App.readFileAsDataURL(cvInput.files[0]);
        p.cvFileName = cvInput.files[0].name;
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    p.skills = document
      .getElementById("edit-skills")
      .value.split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    p.links = document
      .getElementById("edit-links")
      .value.split("\n")
      .map((line) => {
        const parts = line.split("|");
        if (parts.length < 2) return null;
        return { label: parts[0].trim(), url: parts[1].trim(), icon: "fa-solid fa-arrow-up-right-from-square" };
      })
      .filter(Boolean);

    AdminFeature.closeModal();
    await App.saveData();
  }
};

