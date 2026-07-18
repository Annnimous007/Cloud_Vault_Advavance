/* ═══════════════════════════════════════════════════════════
   UI — Rendering, theme, view, toasts, stats, badges
═══════════════════════════════════════════════════════════ */

const UI = (() => {

  let isGridView = CONFIG.DEFAULT_VIEW !== 'list';
  let allFiles   = [];

  /* ══════════════════════════════════════════════════════════
     THEME
  ══════════════════════════════════════════════════════════ */
  function initTheme() {
    const saved = Utils.LS.get('theme', CONFIG.DEFAULT_THEME);
    applyTheme(saved);

    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Utils.LS.set('theme', theme);
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    const btn = document.getElementById('themeToggle');
    if (btn) btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }

  /* ══════════════════════════════════════════════════════════
     VIEW TOGGLE
  ══════════════════════════════════════════════════════════ */
  function initViewToggle() {
    const saved = Utils.LS.get('view', CONFIG.DEFAULT_VIEW);
    isGridView = saved !== 'list';
    applyViewClass();

    document.getElementById('viewToggle')?.addEventListener('click', () => {
      isGridView = !isGridView;
      Utils.LS.set('view', isGridView ? 'grid' : 'list');
      applyViewClass();
    });
  }

  function applyViewClass() {
    const grid = document.getElementById('filesGrid');
    const icon = document.getElementById('viewIcon');
    if (isGridView) {
      grid?.classList.remove('list-view');
      if (icon) icon.className = 'fa-solid fa-list';
    } else {
      grid?.classList.add('list-view');
      if (icon) icon.className = 'fa-solid fa-grip';
    }
  }

  /* ══════════════════════════════════════════════════════════
     SIDEBAR
  ══════════════════════════════════════════════════════════ */
  function initSidebar() {
    const toggle  = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const close   = document.getElementById('sidebarClose');

    function openSidebar() {
      sidebar?.classList.add('open');
      overlay?.classList.add('open');
      toggle?.setAttribute('aria-expanded', 'true');
    }
    function closeSidebar() {
      sidebar?.classList.remove('open');
      overlay?.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    }

    toggle?.addEventListener('click', () => {
      sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    close?.addEventListener('click',   closeSidebar);
    overlay?.addEventListener('click', closeSidebar);

    // Close on nav item click (mobile)
    sidebar?.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 1024) closeSidebar();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     STATS BAR
  ══════════════════════════════════════════════════════════ */
  function updateStats(files) {
    allFiles = files;

    const total     = files.length;
    const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);
    const types     = new Set(files.map(f => f.ext)).size;
    const latest    = files
      .filter(f => f.uploadedAt)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];

    // Animate count
    const totalEl = document.getElementById('statTotal');
    if (totalEl) Utils.animateCount(totalEl, total);

    const sizeEl  = document.getElementById('statSize');
    if (sizeEl) sizeEl.textContent = Utils.formatSize(totalSize);

    const typesEl = document.getElementById('statTypes');
    if (typesEl) Utils.animateCount(typesEl, types);

    const recentEl = document.getElementById('statRecent');
    if (recentEl) recentEl.textContent = latest ? Utils.formatDateRelative(latest.uploadedAt) : '—';

    // Storage bar (visual, not real quota — GitHub has no storage API)
    const fill = document.getElementById('storageFill');
    const used = document.getElementById('storageUsed');
    if (fill && used) {
      const sizeMB = totalSize / 1024 / 1024;
      const pct    = Math.min((sizeMB / 1000) * 100, 100); // fake 1 GB "limit"
      fill.style.width = pct + '%';
      fill.closest('.storage-bar')?.setAttribute('aria-valuenow', Math.round(pct));
      used.textContent = Utils.formatSize(totalSize);
    }

    updateBadges(files);
  }

  /* ── Category badges in sidebar ────────────────────────────── */
  function updateBadges(files) {
    const counts = { all: files.length, documents: 0, images: 0, videos: 0, audio: 0, archives: 0, others: 0 };
    files.forEach(f => { if (counts[f.category] !== undefined) counts[f.category]++; else counts.others++; });

    const map = {
      totalBadge: counts.all,
      docsBadge:  counts.documents,
      imgBadge:   counts.images,
      vidBadge:   counts.videos,
      audBadge:   counts.audio,
      archBadge:  counts.archives,
      otherBadge: counts.others,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  /* ══════════════════════════════════════════════════════════
     FILE RENDERING
  ══════════════════════════════════════════════════════════ */
  function renderFiles(files) {
    const grid      = document.getElementById('filesGrid');
    const emptyEl   = document.getElementById('emptyState');
    const loadingEl = document.getElementById('loadingState');

    if (!grid) return;

    loadingEl?.classList.add('hidden');

    if (!files.length) {
      grid.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      // Adjust empty state messaging
      const q = Search.getQuery();
      const f = Search.getFilter();
      const titleEl = document.getElementById('emptyTitle');
      const descEl  = document.getElementById('emptyDesc');
      if (q && titleEl && descEl) {
        titleEl.textContent = `No results for "${q}"`;
        descEl.textContent  = 'Try a different search term or clear the filter.';
      } else if (f !== 'all' && titleEl && descEl) {
        titleEl.textContent = `No ${f} yet`;
        descEl.textContent  = `Upload some ${f} files to see them here.`;
      }
      return;
    }

    emptyEl?.classList.add('hidden');

    if (isGridView) {
      grid.innerHTML = files.map(renderCard).join('');
    } else {
      grid.innerHTML = files.map(renderRow).join('');
    }

    // Lazy-load images
    lazyLoadImages();

    // Attach card event listeners
    attachCardListeners();
  }

  /* ── Grid card HTML ────────────────────────────────────────── */
  function renderCard(file) {
    const info     = FileTypes.getInfo(file.name);
    const isImg    = FileTypes.isImage(file.name);
    const isVid    = FileTypes.isVideo(file.name);
    const isAud    = FileTypes.isAudio(file.name);

    const thumb = isImg
      ? `<img
           data-src="${file.rawUrl}"
           src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
           alt="${Utils.escapeHTML(file.name)}"
           loading="lazy"
         />`
      : `<div class="file-type-icon" style="font-size:52px;line-height:1">
           <i class="fa-solid ${info.fa}" style="color:${info.color}"></i>
         </div>`;

    const overlayActions = isVid
      ? `<button class="thumb-action" title="Play video"><i class="fa-solid fa-play"></i></button>
         <button class="thumb-action" title="Download" data-action="download"><i class="fa-solid fa-download"></i></button>`
      : `<button class="thumb-action" title="View"><i class="fa-solid fa-eye"></i></button>
         <button class="thumb-action" title="Download" data-action="download"><i class="fa-solid fa-download"></i></button>`;

    return `
      <article class="file-card" role="listitem" data-path="${Utils.escapeHTML(file.path)}" tabindex="0"
        aria-label="${Utils.escapeHTML(file.name)}, ${info.label}, ${Utils.formatSize(file.size)}">
        <div class="file-card-thumb">
          ${thumb}
          <span class="file-ext-badge">${file.ext || '?'}</span>
          <div class="thumb-overlay" aria-hidden="true">${overlayActions}</div>
        </div>
        <div class="file-card-body">
          <div class="file-card-name" title="${Utils.escapeHTML(file.name)}">${Utils.escapeHTML(file.name)}</div>
          <div class="file-card-meta">
            <span>${Utils.formatSize(file.size)}</span>
            <span class="dot">·</span>
            <span>${Utils.formatDateRelative(file.uploadedAt)}</span>
          </div>
        </div>
        <div class="file-card-actions">
          <button class="card-action-btn share" data-action="view" title="Preview">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="card-action-btn download" data-action="download" title="Download">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="card-action-btn link" data-action="copy" title="Copy link">
            <i class="fa-solid fa-link"></i>
          </button>
          <button class="card-action-btn" data-action="qr" title="QR Code" style="margin-left:auto">
            <i class="fa-solid fa-qrcode"></i>
          </button>
          <button class="card-action-btn delete" data-action="delete" title="Delete">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </article>`;
  }

  /* ── List row HTML ─────────────────────────────────────────── */
  function renderRow(file) {
    const info  = FileTypes.getInfo(file.name);
    const isImg = FileTypes.isImage(file.name);

    const iconContent = isImg
      ? `<img data-src="${file.rawUrl}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" alt="" loading="lazy" />`
      : `<i class="fa-solid ${info.fa}" style="color:${info.color};font-size:20px"></i>`;

    return `
      <article class="file-row" role="listitem" data-path="${Utils.escapeHTML(file.path)}" tabindex="0"
        aria-label="${Utils.escapeHTML(file.name)}">
        <div class="file-row-icon">${iconContent}</div>
        <div class="file-row-info">
          <div class="file-row-name" title="${Utils.escapeHTML(file.name)}">${Utils.escapeHTML(file.name)}</div>
          <div class="file-row-meta">
            <span>${info.label}</span>
            <span>·</span>
            <span>${file.category}</span>
          </div>
        </div>
        <span class="file-row-ext">${(file.ext || '?').toUpperCase()}</span>
        <span class="file-row-size">${Utils.formatSize(file.size)}</span>
        <span class="file-row-date">${Utils.formatDate(file.uploadedAt)}</span>
        <div class="file-row-actions">
          <button class="card-action-btn" data-action="view" title="Preview">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="card-action-btn download" data-action="download" title="Download">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="card-action-btn link" data-action="copy" title="Copy link">
            <i class="fa-solid fa-link"></i>
          </button>
          <button class="card-action-btn" data-action="qr" title="QR Code">
            <i class="fa-solid fa-qrcode"></i>
          </button>
          <button class="card-action-btn delete" data-action="delete" title="Delete">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </article>`;
  }

  /* ── Lazy load images ──────────────────────────────────────── */
  function lazyLoadImages() {
    const imgs = document.querySelectorAll('#filesGrid img[data-src]');
    if (!imgs.length) return;

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            obs.unobserve(img);
          }
        });
      }, { rootMargin: '100px' });
      imgs.forEach(img => obs.observe(img));
    } else {
      imgs.forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    }
  }

  /* ── Attach event listeners to file cards/rows ─────────────── */
  function attachCardListeners() {
    document.querySelectorAll('#filesGrid [data-path]').forEach(card => {
      const path = card.dataset.path;

      // Click card → preview
      card.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        const file   = App.getFileByPath(path);
        if (!file) return;

        if (action === 'download') {
          downloadFile(file);
        } else if (action === 'copy') {
          copyFileLink(file);
        } else if (action === 'qr') {
          Preview.openQR(file);
        } else if (action === 'delete') {
          DeleteFlow.open(file);
        } else {
          Preview.open(file);
        }
      });

      // Keyboard: Enter to preview
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const file = App.getFileByPath(path);
          if (file) Preview.open(file);
        }
      });
    });
  }

  /* ── Skeleton loaders ──────────────────────────────────────── */
  function showSkeletons(count = 12) {
    const grid = document.getElementById('filesGrid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-thumb"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line" style="width:80%"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>`).join('');
  }

  /* ── Download a file ───────────────────────────────────────── */
  function downloadFile(file) {
    const a = document.createElement('a');
    a.href     = file.rawUrl;
    a.download = file.name;
    a.target   = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /* ── Copy shareable link ───────────────────────────────────── */
  async function copyFileLink(file) {
    const ok = await Utils.copyToClipboard(file.shareUrl);
    toast(ok ? '🔗 Link copied to clipboard!' : 'Copy failed — try manually', ok ? 'success' : 'error');
  }

  /* ══════════════════════════════════════════════════════════
     TOAST NOTIFICATIONS
  ══════════════════════════════════════════════════════════ */
  const TOAST_ICONS = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    info:    'fa-circle-info',
    warning: 'fa-triangle-exclamation',
  };

  function toast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const id   = Utils.uid();
    const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
    const el   = document.createElement('div');
    el.className = `toast ${type}`;
    el.id = id;
    el.innerHTML = `
      <span class="toast-icon"><i class="fa-solid ${icon}"></i></span>
      <span class="toast-msg">${Utils.escapeHTML(message)}</span>
      <button class="toast-close" onclick="this.closest('.toast').remove()" aria-label="Dismiss">
        <i class="fa-solid fa-xmark"></i>
      </button>`;

    container.appendChild(el);

    // Auto dismiss
    setTimeout(() => {
      el.classList.add('exiting');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, duration);
  }

  /* ══════════════════════════════════════════════════════════
     LOADING STATE
  ══════════════════════════════════════════════════════════ */
  function showLoading() {
    document.getElementById('loadingState')?.classList.remove('hidden');
    document.getElementById('emptyState')?.classList.add('hidden');
    showSkeletons();
  }

  function hideLoading() {
    document.getElementById('loadingState')?.classList.add('hidden');
  }

  /* ── Demo mode banner ──────────────────────────────────────── */
  function showDemoBanner() {
    // Insert a subtle notice below the topbar
    const main = document.querySelector('.main-content');
    if (!main || document.getElementById('demoBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'demoBanner';
    banner.style.cssText = `
      background: linear-gradient(90deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
      border-bottom: 1px solid rgba(99,102,241,0.2);
      padding: 8px 24px;
      font-size: 13px;
      color: var(--brand-300);
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    `;
    banner.innerHTML = `
      <i class="fa-solid fa-circle-info"></i>
      <span><strong>Demo Mode</strong> — These are sample files. Edit <code>js/config.js</code> with your GitHub repo to go live.</span>
      <a href="setup.html" style="margin-left:auto;color:var(--brand-400);text-decoration:underline">Setup Guide →</a>`;
    // Insert after topbar
    const topbar = main.querySelector('.topbar');
    topbar?.insertAdjacentElement('afterend', banner);
  }

  return {
    initTheme, initViewToggle, initSidebar,
    updateStats, renderFiles, showSkeletons,
    showLoading, hideLoading, toast, showDemoBanner,
    downloadFile, copyFileLink,
  };
})();
