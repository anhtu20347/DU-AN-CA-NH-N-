window.ProjectsFeature = {
  render() {
    const container = document.getElementById("tab-projects");
    const projects = App.state.data.projects || [];
    const isAdmin = App.state.isAdmin;

    const cardsHtml = projects
      .map(
        (item, index) => `
      <article class="item-card">
        ${
          item.coverUrl
            ? `<div class="item-cover"><img src="${item.coverUrl}" alt="${item.title}" /></div>`
            : ""
        }
        <div class="item-body">
          <div class="tag-list">
            <span class="tag">${item.category || "Dự án"}</span>
          </div>
          <h3 class="item-title">${item.title}</h3>
          <p class="item-desc">${item.description}</p>
          <div class="item-attachments">
            ${
              item.externalLink
                ? `<a href="${item.externalLink}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary">
                    <i class="fa-solid fa-up-right-from-square"></i> Mở Liên kết
                  </a>`
                : ""
            }
            ${
              item.fileData
                ? `<a href="${item.fileData}" download="${item.fileName || 'tai-lieu'}" class="btn btn-sm btn-secondary">
                    <i class="fa-solid fa-paperclip"></i> Tải file (${item.fileName})
                  </a>`
                : ""
            }
            ${
              isAdmin
                ? `<button class="btn btn-sm btn-outline" onclick="ProjectsFeature.openModal(${index})">
                    <i class="fa-solid fa-pen"></i> Sửa
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="ProjectsFeature.deleteProject(${index})">
                    <i class="fa-solid fa-trash"></i>
                  </button>`
                : ""
            }
          </div>
        </div>
      </article>
    `
      )
      .join("");

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2>Dự án & Hoạt động Nổi bật</h2>
          <p style="color:var(--text-muted)">Các sản phẩm công nghệ, dự án khởi nghiệp và sự kiện mình đã thực hiện</p>
        </div>
        ${
          isAdmin
            ? `<button class="btn btn-primary" onclick="ProjectsFeature.openModal(-1)">
                <i class="fa-solid fa-plus"></i> Thêm Dự án mới
              </button>`
            : ""
        }
      </div>
      <div class="grid-2">
        ${cardsHtml || `<p style="color:var(--text-muted)">Chưa có dự án nào.</p>`}
      </div>
    `;
  },

  openModal(index) {
    const isEdit = index >= 0;
    const item = isEdit
      ? App.state.data.projects[index]
      : { title: "", category: "", description: "", coverUrl: "", externalLink: "", fileName: "", fileData: "" };

    AdminFeature.showModal(`
      <h3 style="margin-bottom:18px;">${isEdit ? "Chỉnh sửa Dự án" : "Thêm Dự án mới"}</h3>
      <div class="form-group">
        <label>Tên dự án / hoạt động</label>
        <input id="proj-title" class="form-control" value="${item.title}" />
      </div>
      <div class="form-group">
        <label>Lĩnh vực / Phân loại</label>
        <input id="proj-category" class="form-control" placeholder="VD: Marketing, EdTech, Sự kiện..." value="${item.category}" />
      </div>
      <div class="form-group">
        <label>Mô tả chi tiết</label>
        <textarea id="proj-desc" class="form-control">${item.description}</textarea>
      </div>
      <div class="form-group">
        <label>Ảnh minh họa (Tải ảnh từ máy hoặc dán URL)</label>
        <input type="file" id="proj-cover-file" accept="image/*" class="form-control" style="margin-bottom:8px;" />
        <input id="proj-cover-url" class="form-control" placeholder="Hoặc dán link ảnh..." value="${item.coverUrl}" />
      </div>
      <div class="form-group">
        <label>Gắn liên kết ngoài (Link Web, GitHub, Google Drive, Canva...)</label>
        <input id="proj-link" class="form-control" placeholder="https://..." value="${item.externalLink}" />
      </div>
      <div class="form-group">
        <label>Đính kèm File trực tiếp (< 2.5MB: PDF, Slide, Word...)</label>
        <input type="file" id="proj-file" class="form-control" />
        ${item.fileName ? `<small style="color:var(--accent)">File hiện tại: ${item.fileName}</small>` : ""}
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
        <button class="btn btn-secondary" onclick="AdminFeature.closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="ProjectsFeature.saveProject(${index})">Lưu dự án</button>
      </div>
    `);
  },

  async saveProject(index) {
    if (!App.state.data.projects) App.state.data.projects = [];
    const existing = index >= 0 ? App.state.data.projects[index] : {};

    let coverUrl = document.getElementById("proj-cover-url").value.trim();
    const coverInput = document.getElementById("proj-cover-file");
    if (coverInput.files && coverInput.files[0]) {
      coverUrl = await App.readImageCompressed(coverInput.files[0], 800);
    }

    let fileData = existing.fileData || "";
    let fileName = existing.fileName || "";
    const fileInput = document.getElementById("proj-file");
    if (fileInput.files && fileInput.files[0]) {
      try {
        fileData = await App.readFileAsDataURL(fileInput.files[0]);
        fileName = fileInput.files[0].name;
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    const newItem = {
      id: existing.id || "proj-" + Date.now(),
      title: document.getElementById("proj-title").value.trim(),
      category: document.getElementById("proj-category").value.trim(),
      description: document.getElementById("proj-desc").value,
      coverUrl,
      externalLink: document.getElementById("proj-link").value.trim(),
      fileName,
      fileData
    };

    if (index >= 0) {
      App.state.data.projects[index] = newItem;
    } else {
      App.state.data.projects.unshift(newItem);
    }

    AdminFeature.closeModal();
    await App.saveData();
  },

  async deleteProject(index) {
    if (!confirm("Bạn có chắc muốn xóa dự án này?")) return;
    App.state.data.projects.splice(index, 1);
    await App.saveData();
  }
};
