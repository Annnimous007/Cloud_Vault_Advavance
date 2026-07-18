/* ═══════════════════════════════════════════════════════════
   DELETE FLOW — Confirm & delete an uploaded file from GitHub
═══════════════════════════════════════════════════════════ */

const DeleteFlow = (() => {

  let pendingFile = null;

  /* ── Init modal buttons ────────────────────────────────────── */
  function init() {
    document.getElementById('deleteModalClose')?.addEventListener('click', close);
    document.getElementById('deleteCancelBtn')?.addEventListener('click', close);
    document.getElementById('deleteModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) close();
    });
    document.getElementById('deleteConfirmBtn')?.addEventListener('click', confirmDelete);

    // Delete from inside the preview modal too
    document.getElementById('previewDelete')?.addEventListener('click', () => {
      const file = Preview.getCurrentFile ? Preview.getCurrentFile() : null;
      if (file) {
        Preview.close();
        open(file);
      }
    });

    // Escape closes this modal too
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !document.getElementById('deleteModal')?.classList.contains('hidden')) {
        close();
      }
    });
  }

  /* ── Open confirm modal for a file ─────────────────────────── */
  function open(file) {
    pendingFile = file;
    const info = FileTypes.getInfo(file.name);

    document.getElementById('deleteFileName').textContent = file.name;

    const previewEl = document.getElementById('deleteFilePreview');
    if (previewEl) {
      if (FileTypes.isImage(file.name)) {
        previewEl.innerHTML = `<img src="${file.rawUrl}" alt="${Utils.escapeHTML(file.name)}" />`;
      } else {
        previewEl.innerHTML = `<i class="fa-solid ${info.fa}" style="color:${info.color}"></i>`;
      }
    }

    const confirmBtn = document.getElementById('deleteConfirmBtn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Delete Permanently';
    }

    document.getElementById('deleteModal')?.classList.remove('hidden');
  }

  /* ── Close confirm modal ───────────────────────────────────── */
  function close() {
    document.getElementById('deleteModal')?.classList.add('hidden');
    pendingFile = null;
  }

  /* ── Run the actual delete ─────────────────────────────────── */
  async function confirmDelete() {
    if (!pendingFile) return;

    const confirmBtn = document.getElementById('deleteConfirmBtn');
    const file = pendingFile;

    if (CONFIG.DEMO_MODE || !CONFIG.IS_CONFIGURED) {
      // Demo mode: just remove from local state, no real API call
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting…';
      }
      await new Promise(r => setTimeout(r, 500));
      App.removeFile(file.path);
      UI.toast(`🗑️ "${file.name}" deleted (demo mode)`, 'success');
      close();
      return;
    }

    if (!CONFIG.GITHUB_TOKEN) {
      UI.toast('GitHub token required to delete files. See Setup Guide.', 'warning');
      return;
    }

    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting…';
    }

    try {
      await GitHub.deleteFile(file);
      App.removeFile(file.path);
      UI.toast(`🗑️ "${file.name}" deleted successfully`, 'success');
      close();
    } catch (err) {
      console.error('Delete failed:', err);
      UI.toast(`Failed to delete: ${err.message}`, 'error', 6000);
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Delete Permanently';
      }
    }
  }

  return { init, open, close };
})();
