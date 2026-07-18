/* ═══════════════════════════════════════════════════════════
   UPLOAD — Drag & drop, queue, progress, GitHub push
═══════════════════════════════════════════════════════════ */

const Upload = (() => {

  let queue = [];   // Array of { id, file, status, progress }

  /* ── Initialise upload UI ──────────────────────────────────── */
  function init() {
    const dropZone      = document.getElementById('dropZone');
    const fileInput     = document.getElementById('fileInput');
    const browseBtn     = document.getElementById('browseBtn');
    const startUploadBtn= document.getElementById('startUploadBtn');
    const clearQueueBtn = document.getElementById('clearQueue');
    const configNotice  = document.getElementById('configNotice');

    // Hide config notice if token is set
    if (CONFIG.GITHUB_TOKEN && CONFIG.IS_CONFIGURED) {
      configNotice?.classList.add('hidden');
    }

    // Browse button → trigger file input
    browseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput?.click();
    });

    // Drop zone click → file input
    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput?.click(); }
    });

    // File input change
    fileInput?.addEventListener('change', () => {
      if (fileInput.files.length) addToQueue([...fileInput.files]);
      fileInput.value = ''; // reset so same file can be re-added
    });

    // Drag events
    ['dragenter','dragover'].forEach(evt => {
      dropZone?.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });
    ['dragleave','dragend'].forEach(evt => {
      dropZone?.addEventListener(evt, () => dropZone.classList.remove('drag-over'));
    });
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const files = [...e.dataTransfer.files];
      if (files.length) addToQueue(files);
    });

    // Global drag-over (for the whole window)
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', (e) => {
      // Only handle if modal is open
      const modal = document.getElementById('uploadModal');
      if (!modal?.classList.contains('hidden')) return;
      e.preventDefault();
    });

    // Start upload
    startUploadBtn?.addEventListener('click', startUpload);

    // Clear queue
    clearQueueBtn?.addEventListener('click', clearQueue);
  }

  /* ── Add files to queue ────────────────────────────────────── */
  function addToQueue(files) {
    const uploadQueueEl = document.getElementById('uploadQueue');
    const dropZone      = document.getElementById('dropZone');

    files.forEach(file => {
      // Duplicate check within current queue
      const isDup = queue.some(q => q.file.name === file.name && q.file.size === file.size);
      const id = Utils.uid();
      queue.push({ id, file, status: isDup ? 'duplicate' : 'pending', progress: 0, isDup });
    });

    renderQueue();

    // Show queue, hide drop zone
    if (uploadQueueEl && dropZone) {
      uploadQueueEl.classList.remove('hidden');
      dropZone.classList.add('hidden');
    }
  }

  /* ── Render the queue list ─────────────────────────────────── */
  function renderQueue() {
    const list  = document.getElementById('queueList');
    const count = document.getElementById('queueCount');
    if (!list) return;

    count.textContent = queue.length;
    list.innerHTML = queue.map(item => {
      const info  = FileTypes.getInfo(item.file.name);
      const stMap = {
        pending:   { icon: 'fa-clock',          label: 'Queued',     cls: 'pending' },
        duplicate: { icon: 'fa-copy',           label: 'Duplicate',  cls: 'duplicate' },
        uploading: { icon: 'fa-spinner fa-spin', label: 'Uploading…', cls: 'uploading' },
        done:      { icon: 'fa-check',          label: 'Done',       cls: 'done' },
        error:     { icon: 'fa-xmark',          label: 'Error',      cls: 'error' },
      };
      const st = stMap[item.status] || stMap.pending;

      return `
        <li class="queue-item" data-id="${item.id}">
          <span class="queue-item-icon">
            <i class="fa-solid ${info.fa}" style="color:${info.color}"></i>
          </span>
          <div class="queue-item-info">
            <div class="queue-item-name" title="${Utils.escapeHTML(item.file.name)}">
              ${Utils.escapeHTML(item.file.name)}
              ${item.isDup ? '<span style="font-size:10px;color:var(--warning)"> (will overwrite)</span>' : ''}
            </div>
            <div class="queue-item-size">${Utils.formatSize(item.file.size)}</div>
            ${item.status === 'uploading' ? `
              <div class="progress-bar">
                <div class="progress-fill" style="width:${item.progress}%"></div>
              </div>` : ''}
          </div>
          <span class="queue-item-status ${st.cls}">
            <i class="fa-solid ${st.icon}"></i> ${st.label}
          </span>
          ${item.status !== 'uploading' && item.status !== 'done' ? `
            <button class="queue-item-remove" onclick="Upload.removeFromQueue('${item.id}')" aria-label="Remove ${Utils.escapeHTML(item.file.name)}">
              <i class="fa-solid fa-xmark"></i>
            </button>` : ''}
        </li>`;
    }).join('');
  }

  /* ── Remove single item from queue ────────────────────────── */
  function removeFromQueue(id) {
    queue = queue.filter(q => q.id !== id);
    if (queue.length === 0) {
      resetUploadUI();
    } else {
      renderQueue();
    }
  }

  /* ── Clear the entire queue ────────────────────────────────── */
  function clearQueue() {
    queue = [];
    resetUploadUI();
  }

  /* ── Reset to drop zone state ──────────────────────────────── */
  function resetUploadUI() {
    const queueEl   = document.getElementById('uploadQueue');
    const dropZone  = document.getElementById('dropZone');
    queueEl?.classList.add('hidden');
    dropZone?.classList.remove('hidden');
    const list = document.getElementById('queueList');
    if (list) list.innerHTML = '';
  }

  /* ── Run the upload queue ──────────────────────────────────── */
  async function startUpload() {
    if (!queue.length) return;

    if (!CONFIG.IS_CONFIGURED) {
      UI.toast('Configure GitHub settings in js/config.js first', 'warning');
      return;
    }
    if (!CONFIG.GITHUB_TOKEN) {
      UI.toast('GitHub token required for uploading. See Setup Guide.', 'warning');
      return;
    }

    const category = document.getElementById('categorySelect')?.value || 'auto';
    const startBtn = document.getElementById('startUploadBtn');
    if (startBtn) startBtn.disabled = true;

    let successCount = 0;
    let errorCount   = 0;
    const uploadedFiles = [];

    for (const item of queue) {
      if (item.status === 'done') continue;

      item.status   = 'uploading';
      item.progress = 0;
      renderQueue();

      try {
        const result = await GitHub.uploadFile(
          item.file,
          category,
          (pct) => { item.progress = pct; renderQueue(); }
        );
        item.status   = 'done';
        item.progress = 100;
        uploadedFiles.push(result);
        successCount++;
      } catch (err) {
        item.status  = 'error';
        item.errorMsg = err.message;
        errorCount++;
        console.error(`Upload failed for ${item.file.name}:`, err);
      }
      renderQueue();
    }

    // Summary toast
    if (successCount > 0) {
      UI.toast(`✅ ${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully!`, 'success');
      // Inject new files into app state
      if (window.App) App.injectFiles(uploadedFiles);
    }
    if (errorCount > 0) {
      UI.toast(`⚠️ ${errorCount} file${errorCount > 1 ? 's' : ''} failed to upload`, 'error');
    }

    if (startBtn) startBtn.disabled = false;

    // Auto-close modal after 2s if all succeeded
    if (errorCount === 0) {
      setTimeout(() => {
        document.getElementById('uploadModal')?.classList.add('hidden');
        // Reset queue for next use
        setTimeout(() => { queue = []; resetUploadUI(); }, 300);
      }, 1800);
    }
  }

  /* ── Open the upload modal ─────────────────────────────────── */
  function openModal() {
    queue = [];
    resetUploadUI();
    document.getElementById('uploadModal')?.classList.remove('hidden');
    document.getElementById('dropZone')?.focus();
  }

  /* ── Close the upload modal ────────────────────────────────── */
  function closeModal() {
    document.getElementById('uploadModal')?.classList.add('hidden');
  }

  return { init, openModal, closeModal, addToQueue, removeFromQueue, clearQueue };
})();
