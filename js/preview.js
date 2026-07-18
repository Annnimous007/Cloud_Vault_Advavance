/* ═══════════════════════════════════════════════════════════
   PREVIEW — File preview modal for all supported formats
═══════════════════════════════════════════════════════════ */

const Preview = (() => {

  let currentFile = null;
  let qrInstance  = null;

  /* ── Open preview for a file object ───────────────────────── */
  async function open(file) {
    currentFile = file;
    const modal = document.getElementById('previewModal');
    const info  = FileTypes.getInfo(file.name);

    // Set header
    document.getElementById('previewTitle').textContent = file.name;
    document.getElementById('previewMeta').textContent  =
      `${info.label} · ${Utils.formatSize(file.size)} · ${Utils.formatDateRelative(file.uploadedAt)}`;

    const iconEl = document.getElementById('previewFileIcon');
    iconEl.innerHTML = `<i class="fa-solid ${info.fa}" style="color:${info.color};font-size:20px"></i>`;

    // Render body
    const body = document.getElementById('previewBody');
    body.innerHTML = '<div class="loading-state"><div class="loader-ring"></div><p>Loading preview…</p></div>';
    modal.classList.remove('hidden');

    // Render file details footer
    renderDetails(file, info);

    // Determine and render preview
    try {
      await renderPreview(file, body);
    } catch (err) {
      renderUnsupported(body, file, 'Preview failed — you can still download the file.');
    }
  }

  /* ── Render preview content ────────────────────────────────── */
  async function renderPreview(file, body) {
    const ext = file.ext || Utils.getExt(file.name);

    /* Image ────────────────────────────────────────────────── */
    if (FileTypes.isImage(file.name)) {
      body.innerHTML = '';
      const img = document.createElement('img');
      img.className = 'preview-image';
      img.alt = file.name;
      img.src = file.rawUrl;
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s';
      img.onload = () => { img.style.opacity = '1'; };
      img.onerror = () => renderUnsupported(body, file, 'Image failed to load.');
      body.appendChild(img);
      return;
    }

    /* Video ─────────────────────────────────────────────────── */
    if (FileTypes.isVideo(file.name)) {
      body.innerHTML = `
        <video class="preview-video" controls preload="metadata" style="width:100%;max-height:60vh;background:#000">
          <source src="${file.rawUrl}" type="video/${ext === 'mp4' ? 'mp4' : ext === 'webm' ? 'webm' : 'ogg'}">
          Your browser doesn't support this video format. <a href="${file.rawUrl}" download>Download instead</a>.
        </video>`;
      return;
    }

    /* Audio ─────────────────────────────────────────────────── */
    if (FileTypes.isAudio(file.name)) {
      const info = FileTypes.getInfo(file.name);
      body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:24px;padding:40px 24px;width:100%">
          <div style="width:80px;height:80px;border-radius:20px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;font-size:36px;">
            <i class="fa-solid ${info.fa}" style="color:${info.color}"></i>
          </div>
          <p style="color:var(--text-primary);font-weight:600;font-size:1.1rem;text-align:center;margin:0">${Utils.escapeHTML(file.name)}</p>
          <audio class="preview-audio" controls preload="metadata" style="width:100%;max-width:480px">
            <source src="${file.rawUrl}">
            Your browser doesn't support audio. <a href="${file.rawUrl}" download>Download instead</a>.
          </audio>
        </div>`;
      return;
    }

    /* PDF ───────────────────────────────────────────────────── */
    if (FileTypes.isPDF(file.name)) {
      body.innerHTML = `
        <iframe
          class="preview-pdf"
          src="${file.rawUrl}"
          title="PDF preview: ${Utils.escapeHTML(file.name)}"
          loading="lazy">
        </iframe>`;
      return;
    }

    /* Text / Markdown / Code ───────────────────────────────── */
    if (FileTypes.isText(file.name)) {
      const res = await fetch(file.rawUrl);
      if (!res.ok) throw new Error('Failed to fetch file');
      const text = await res.text();
      const escaped = Utils.escapeHTML(text);

      // Markdown rendering (basic)
      if (ext === 'md') {
        body.innerHTML = `
          <div class="preview-text" style="padding:24px">
            <div class="markdown-body" style="max-width:720px;margin:0 auto;color:var(--text-primary);line-height:1.7">
              ${renderMarkdown(escaped)}
            </div>
          </div>`;
      } else {
        body.innerHTML = `
          <div class="preview-text">
            <pre><code>${escaped}</code></pre>
          </div>`;
      }
      return;
    }

    /* Unsupported ───────────────────────────────────────────── */
    renderUnsupported(body, file);
  }

  /* ── Unsupported format fallback ───────────────────────────── */
  function renderUnsupported(body, file, msg) {
    const info = FileTypes.getInfo(file.name);
    body.innerHTML = `
      <div class="preview-unsupported">
        <div class="big-icon">
          <i class="fa-solid ${info.fa}" style="color:${info.color}"></i>
        </div>
        <h3 style="color:var(--text-primary)">${Utils.escapeHTML(file.name)}</h3>
        <p>${msg || 'Preview not available for this file type.'}</p>
        <a href="${file.rawUrl}" download="${file.name}" class="btn-primary" style="text-decoration:none">
          <i class="fa-solid fa-download"></i> Download File
        </a>
      </div>`;
  }

  /* ── Render file details in footer ────────────────────────── */
  function renderDetails(file, info) {
    const grid = document.getElementById('fileDetailsGrid');
    if (!grid) return;

    const details = [
      { label: 'File Name',  value: file.name },
      { label: 'Type',       value: info.label },
      { label: 'Size',       value: Utils.formatSize(file.size) },
      { label: 'Category',   value: file.category?.charAt(0).toUpperCase() + file.category?.slice(1) || '—' },
      { label: 'Uploaded',   value: Utils.formatDate(file.uploadedAt) },
      { label: 'Extension',  value: (file.ext || '—').toUpperCase() },
    ];

    grid.innerHTML = details.map(d => `
      <div class="detail-item">
        <span class="detail-label">${d.label}</span>
        <span class="detail-value" title="${Utils.escapeHTML(String(d.value))}">${Utils.escapeHTML(String(d.value || '—'))}</span>
      </div>`).join('');
  }

  /* ── Very lightweight Markdown → HTML converter ────────────── */
  function renderMarkdown(escaped) {
    return escaped
      // Re-unescape for processing (we'll re-escape inline)
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      // Then safely process
      .split('\n')
      .map(line => {
        line = line
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code>$1</code>')
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        if (/^### /.test(line)) return `<h3>${line.slice(4)}</h3>`;
        if (/^## /.test(line))  return `<h2>${line.slice(3)}</h2>`;
        if (/^# /.test(line))   return `<h1>${line.slice(2)}</h1>`;
        if (/^- /.test(line))   return `<li>${line.slice(2)}</li>`;
        if (/^\d+\. /.test(line)) return `<li>${line.replace(/^\d+\.\s/,'')}</li>`;
        if (line.trim() === '') return '<br>';
        return `<p>${line}</p>`;
      })
      .join('\n');
  }

  /* ── Initialise preview modal buttons ─────────────────────── */
  function init() {
    document.getElementById('previewModalClose')?.addEventListener('click', close);
    document.getElementById('previewModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) close();
    });

    document.getElementById('previewDownload')?.addEventListener('click', () => {
      if (!currentFile) return;
      const a = document.createElement('a');
      a.href     = currentFile.rawUrl;
      a.download = currentFile.name;
      a.target   = '_blank';
      a.click();
    });

    document.getElementById('previewCopyLink')?.addEventListener('click', async () => {
      if (!currentFile) return;
      const ok = await Utils.copyToClipboard(currentFile.shareUrl);
      UI.toast(ok ? 'Link copied to clipboard!' : 'Copy failed', ok ? 'success' : 'error');
    });

    document.getElementById('previewQR')?.addEventListener('click', () => {
      if (!currentFile) return;
      close();
      openQR(currentFile);
    });

    // Keyboard: Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!document.getElementById('previewModal')?.classList.contains('hidden')) close();
        if (!document.getElementById('qrModal')?.classList.contains('hidden')) closeQR();
        if (!document.getElementById('uploadModal')?.classList.contains('hidden')) Upload.closeModal();
      }
    });
  }

  /* ── Close preview ─────────────────────────────────────────── */
  function close() {
    document.getElementById('previewModal')?.classList.add('hidden');
    // Pause any media
    document.querySelectorAll('#previewBody video, #previewBody audio').forEach(m => m.pause());
    currentFile = null;
  }

  /* ── Open QR modal ─────────────────────────────────────────── */
  function openQR(file) {
    const modal    = document.getElementById('qrModal');
    const container= document.getElementById('qrCodeContainer');
    const nameEl   = document.getElementById('qrFileName');

    if (!modal || !container) return;

    container.innerHTML = '';
    nameEl.textContent  = file.name;

    // Generate QR
    try {
      qrInstance = new QRCode(container, {
        text:          file.shareUrl,
        width:         200,
        height:        200,
        colorDark:     '#000000',
        colorLight:    '#ffffff',
        correctLevel:  QRCode.CorrectLevel.M,
      });
    } catch (err) {
      container.innerHTML = '<p style="color:var(--danger);font-size:14px">QR generation failed</p>';
    }

    modal.classList.remove('hidden');

    // Download QR button
    document.getElementById('downloadQR')?.addEventListener('click', downloadQRImage, { once: true });
  }

  /* ── Download QR code as PNG ───────────────────────────────── */
  function downloadQRImage() {
    const canvas = document.querySelector('#qrCodeContainer canvas');
    const img    = document.querySelector('#qrCodeContainer img');
    if (canvas) {
      const a = document.createElement('a');
      a.href     = canvas.toDataURL('image/png');
      a.download = `qr-${currentFile?.name || 'cloudvault'}.png`;
      a.click();
    } else if (img) {
      const a = document.createElement('a');
      a.href     = img.src;
      a.download = `qr-${currentFile?.name || 'cloudvault'}.png`;
      a.click();
    }
  }

  /* ── Close QR modal ────────────────────────────────────────── */
  function closeQR() {
    document.getElementById('qrModal')?.classList.add('hidden');
    if (qrInstance) { qrInstance = null; }
  }

  /* ── Get the file currently shown in the preview modal ─────── */
  function getCurrentFile() {
    return currentFile;
  }

  return { init, open, close, openQR, closeQR, getCurrentFile };
})();
