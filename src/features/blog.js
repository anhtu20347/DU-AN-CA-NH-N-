window.BlogFeature = {
  render() {
    const container = document.getElementById("tab-blog");
    const posts = App.state.data.posts || [];
    const isAdmin = App.state.isAdmin;

    const postsHtml = posts
      .map(
        (post, index) => `
      <article class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:10px;">
          <div>
            <span class="tag"><i class="fa-regular fa-calendar"></i> ${post.date}</span>
            <h3 style="font-size:1.35rem; margin-top:8px;">${post.title}</h3>
          </div>
          ${
            isAdmin
              ? `<div style="display:flex; gap:8px;">
                  <button class="btn btn-sm btn-outline" onclick="BlogFeature.openModal(${index})">
                    <i class="fa-solid fa-pen"></i> Sửa
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="BlogFeature.deletePost(${index})">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>`
              : ""
          }
        </div>
        <p style="color:var(--text-muted); white-space:pre-line; margin-bottom:16px;">${post.content}</p>
        ${
          post.imageUrl
            ? `<div style="margin-bottom:16px; border-radius:12px; overflow:hidden; max-height:420px;">
                <img src="${post.imageUrl}" alt="${post.title}" style="width:100%; object-fit:cover;" />
              </div>`
            : ""
        }
        <div class="item-attachments">
          ${
            post.externalLink
              ? `<a href="${post.externalLink}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary">
                  <i class="fa-solid fa-link"></i> Liên kết đính kèm
                </a>`
              : ""
          }
          ${
            post.fileData
              ? `<a href="${post.fileData}" download="${post.fileName || 'tai-lieu'}" class="btn btn-sm btn-secondary">
                  <i class="fa-solid fa-download"></i> Tải file (${post.fileName})
                </a>`
              : ""
          }
        </div>
      </article>
    `
      )
      .join("");

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2>Góc Chia sẻ & Kho Tài liệu</h2>
          <p style="color:var(--text-muted)">Nơi lưu giữ suy nghĩ, bài viết cá nhân và các tài liệu học tập</p>
        </div>
        ${
          isAdmin
            ? `<button class="btn btn-primary" onclick="BlogFeature.openModal(-1)">
                <i class="fa-solid fa-feather-pointed"></i> Viết bài / Tải tài liệu mới
              </button>`
            : ""
        }
      </div>
      ${postsHtml || `<p style="color:var(--text-muted)">Chưa có bài viết nào.</p>`}
    `;
  },

  openModal(index) {
    const isEdit = index >= 0;
    const post = isEdit
      ? App.state.data.posts[index]
      : { title: "", content: "", imageUrl: "", externalLink: "", fileName: "", fileData: "" };

    AdminFeature.showModal(`
      <h3 style="margin-bottom:18px;">${isEdit ? "Chỉnh sửa Bài viết" : "Đăng Bài viết / Tài liệu mới"}</h3>
      <div class="form-group">
        <label>Tiêu đề bài viết</label>
        <input id="post-title" class="form-control" value="${post.title}" />
      </div>
      <div class="form-group">
        <label>Nội dung chia sẻ</label>
        <textarea id="post-content" class="form-control" style="min-height:150px;">${post.content}</textarea>
      </div>
      <div class="form-group">
        <label>Ảnh đính kèm (Tải từ máy hoặc dán URL)</label>
        <input type="file" id="post-img-file" accept="image/*" class="form-control" style="margin-bottom:8px;" />
        <input id="post-img-url" class="form-control" placeholder="Hoặc dán link ảnh..." value="${post.imageUrl}" />
      </div>
      <div class="form-group">
        <label>Gắn liên kết tham khảo (nếu có)</label>
        <input id="post-link" class="form-control" placeholder="https://..." value="${post.externalLink}" />
      </div>
      <div class="form-group">
        <label>Tải lên File đính kèm (< 2.5MB)</label>
        <input type="file" id="post-file" class="form-control" />
        ${post.fileName ? `<small style="color:var(--accent)">Đang đính kèm: ${post.fileName}</small>` : ""}
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
        <button class="btn btn-secondary" onclick="AdminFeature.closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="BlogFeature.savePost(${index})">Đăng lưu</button>
      </div>
    `);
  },

  async savePost(index) {
    if (!App.state.data.posts) App.state.data.posts = [];
    const existing = index >= 0 ? App.state.data.posts[index] : {};

    let imageUrl = document.getElementById("post-img-url").value.trim();
    const imgInput = document.getElementById("post-img-file");
    if (imgInput.files && imgInput.files[0]) {
      imageUrl = await App.readImageCompressed(imgInput.files[0], 900);
    }

    let fileData = existing.fileData || "";
    let fileName = existing.fileName || "";
    const fileInput = document.getElementById("post-file");
    if (fileInput.files && fileInput.files[0]) {
      try {
        fileData = await App.readFileAsDataURL(fileInput.files[0]);
        fileName = fileInput.files[0].name;
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    const newPost = {
      id: existing.id || "post-" + Date.now(),
      title: document.getElementById("post-title").value.trim(),
      date: existing.date || new Date().toLocaleDateString("vi-VN"),
      content: document.getElementById("post-content").value,
      imageUrl,
      externalLink: document.getElementById("post-link").value.trim(),
      fileName,
      fileData
    };

    if (index >= 0) {
      App.state.data.posts[index] = newPost;
    } else {
      App.state.data.posts.unshift(newPost);
    }

    AdminFeature.closeModal();
    await App.saveData();
  },

  async deletePost(index) {
    if (!confirm("Xóa bài viết này?")) return;
    App.state.data.posts.splice(index, 1);
    await App.saveData();
  }
};
