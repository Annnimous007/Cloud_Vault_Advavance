/* ═══════════════════════════════════════════════════════════
   APP — Main orchestrator: init, load, filter, route
═══════════════════════════════════════════════════════════ */

const App = (() => {

  let allFiles     = [];   // All files from GitHub / demo
  let filteredFiles = [];  // After search/filter/sort

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  async function init() {
    // 1. UI setup
    UI.initTheme();
    UI.initViewToggle();
    UI.initSidebar();

    // 2. Search + filter
    Search.init(onFilterChange);

    // 3. Preview + QR modals
    Preview.init();
    DeleteFlow.init();

    // 4. Upload UI
    Upload.init();
    bindUploadButtons();

    // 5. QR modal close
    document.getElementById('qrModalClose')?.addEventListener('click', Preview.closeQR);
    document.getElementById('qrModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) Preview.closeQR();
    });

    // 6. Upload modal close
    document.getElementById('uploadModalClose')?.addEventListener('click', Upload.closeModal);
    document.getElementById('uploadModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) Upload.closeModal();
    });

    // 7. Empty state upload button
    document.getElementById('emptyUploadBtn')?.addEventListener('click', Upload.openModal);

    // 8. Load files
    await loadFiles();
  }

  /* ── Bind upload open buttons ──────────────────────────────── */
  function bindUploadButtons() {
    ['uploadBtn', 'uploadNavBtn'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        Upload.openModal();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     LOAD FILES
  ══════════════════════════════════════════════════════════ */
  async function loadFiles() {
    UI.showLoading();

    try {
      if (CONFIG.DEMO_MODE || !CONFIG.IS_CONFIGURED) {
        // Demo mode — use sample data
        await simulateDelay(800);
        allFiles = GitHub.getDemoFiles();
        UI.showDemoBanner();
      } else {
        // Real mode — fetch from GitHub API
        allFiles = await GitHub.listFiles();
      }

      UI.updateStats(allFiles);
      onFilterChange();
    } catch (err) {
      console.error('Failed to load files:', err);
      UI.hideLoading();
      UI.toast(`Failed to load files: ${err.message}`, 'error', 8000);

      // Show empty state with error message
      const emptyTitle = document.getElementById('emptyTitle');
      const emptyDesc  = document.getElementById('emptyDesc');
      if (emptyTitle) emptyTitle.textContent = 'Could not load files';
      if (emptyDesc)  emptyDesc.textContent  = `Error: ${err.message}. Check your GitHub config.`;
      document.getElementById('emptyState')?.classList.remove('hidden');
      document.getElementById('loadingState')?.classList.add('hidden');
      document.getElementById('filesGrid').innerHTML = '';
    }
  }

  /* ── Simulate delay for demo (UX realism) ─────────────────── */
  function simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ══════════════════════════════════════════════════════════
     FILTER CHANGE HANDLER
  ══════════════════════════════════════════════════════════ */
  function onFilterChange() {
    filteredFiles = Search.apply(allFiles);
    UI.renderFiles(filteredFiles);
  }

  /* ══════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════ */

  /* ── Look up a file by its repo path ──────────────────────── */
  function getFileByPath(path) {
    return allFiles.find(f => f.path === path) || null;
  }

  /* ── Inject newly uploaded files into state ────────────────── */
  function injectFiles(newFiles) {
    // Merge, deduplicating by path
    const existing = new Set(allFiles.map(f => f.path));
    const toAdd = newFiles.filter(f => !existing.has(f.path));
    const toUpdate = newFiles.filter(f => existing.has(f.path));

    // Update existing
    toUpdate.forEach(updated => {
      const idx = allFiles.findIndex(f => f.path === updated.path);
      if (idx !== -1) allFiles[idx] = updated;
    });

    // Add new
    allFiles = [...toAdd, ...allFiles];

    UI.updateStats(allFiles);
    onFilterChange();
  }

  /* ── Reload from GitHub (pull latest) ─────────────────────── */
  async function reload() {
    allFiles = [];
    await loadFiles();
    UI.toast('Files refreshed', 'success');
  }

  /* ── Remove a file from local state (after successful delete) ── */
  function removeFile(path) {
    allFiles = allFiles.filter(f => f.path !== path);
    UI.updateStats(allFiles);
    onFilterChange();
  }

  return { init, getFileByPath, injectFiles, removeFile, reload };
})();

/* ══════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', App.init);
