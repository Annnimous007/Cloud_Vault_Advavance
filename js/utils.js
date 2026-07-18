/* ═══════════════════════════════════════════════════════════
   UTILS — Shared helper functions
═══════════════════════════════════════════════════════════ */

const Utils = (() => {

  /* ── Format file size ──────────────────────────────────────── */
  function formatSize(bytes) {
    if (bytes === 0 || bytes == null) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const val = bytes / Math.pow(1024, i);
    return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`;
  }

  /* ── Format date ───────────────────────────────────────────── */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateRelative(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    const diff = (Date.now() - d) / 1000;
    if (diff < 60)     return 'Just now';
    if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDate(dateStr);
  }

  /* ── Get file extension ────────────────────────────────────── */
  function getExt(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  /* ── Get filename without extension ───────────────────────── */
  function getBaseName(filename) {
    if (!filename) return '';
    const name = filename.split('/').pop();
    const dotIdx = name.lastIndexOf('.');
    return dotIdx > 0 ? name.slice(0, dotIdx) : name;
  }

  /* ── Escape HTML ───────────────────────────────────────────── */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ── Debounce ──────────────────────────────────────────────── */
  function debounce(fn, delay = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  }

  /* ── Copy text to clipboard ────────────────────────────────── */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  /* ── Encode file to base64 ─────────────────────────────────── */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /* ── Generate a unique ID ──────────────────────────────────── */
  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  /* ── Slugify filename ──────────────────────────────────────── */
  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.\-_]/g, '')
      .replace(/-+/g, '-');
  }

  /* ── Build raw GitHub URL for a file path ──────────────────── */
  function rawUrl(path) {
    return `${CONFIG.RAW_BASE}/${path}`;
  }

  /* ── Build the public shareable link for a file ────────────── */
  function shareUrl(file) {
    const base = CONFIG.SITE_URL.replace(/\/$/, '');
    return `${base}/file.html?path=${encodeURIComponent(file.path)}`;
  }

  /* ── Animate a number counting up ─────────────────────────── */
  function animateCount(el, target, duration = 600) {
    const start = performance.now();
    const startVal = 0;
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(startVal + (target - startVal) * ease);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  /* ── Detect if user prefers dark ───────────────────────────── */
  function prefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ── Local storage helpers ─────────────────────────────────── */
  const LS = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    },
  };

  return {
    formatSize, formatDate, formatDateRelative,
    getExt, getBaseName, escapeHTML, debounce,
    copyToClipboard, fileToBase64, uid, slugify,
    rawUrl, shareUrl, animateCount, prefersDark, LS,
  };
})();
