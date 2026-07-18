/* ═══════════════════════════════════════════════════════════
   SEARCH — Filter, sort, and keyboard shortcut
═══════════════════════════════════════════════════════════ */

const Search = (() => {

  let currentQuery    = '';
  let currentFilter   = 'all';
  let currentSort     = CONFIG.DEFAULT_SORT || 'newest';
  let onChangeCallback = null;

  /* ── Init search UI ────────────────────────────────────────── */
  function init(onChange) {
    onChangeCallback = onChange;

    const searchInput = document.getElementById('searchInput');
    const sortSelect  = document.getElementById('sortSelect');

    // Search input (debounced)
    searchInput?.addEventListener('input', Utils.debounce((e) => {
      currentQuery = e.target.value.trim().toLowerCase();
      notify();
    }, 250));

    // Sort select
    sortSelect?.addEventListener('change', (e) => {
      currentSort = e.target.value;
      notify();
    });

    // Category chips (toolbar + sidebar)
    document.querySelectorAll('[data-filter]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        setFilter(el.dataset.filter);
      });
    });

    // ⌘K / Ctrl+K shortcut to focus search
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      }
    });
  }

  /* ── Set active category filter ────────────────────────────── */
  function setFilter(filter) {
    currentFilter = filter;

    // Update chip active states (toolbar)
    document.querySelectorAll('.filter-chips .chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === filter);
    });

    // Update sidebar nav active states
    document.querySelectorAll('.sidebar-nav .nav-item[data-filter]').forEach(n => {
      n.classList.toggle('active', n.dataset.filter === filter);
      if (n.dataset.filter === filter) n.setAttribute('aria-current', 'page');
      else n.removeAttribute('aria-current');
    });

    // Update breadcrumb
    const labels = {
      all: 'All Files', documents: 'Documents', images: 'Images',
      videos: 'Videos', audio: 'Audio', archives: 'Archives', others: 'Others',
    };
    const breadcrumb = document.getElementById('breadcrumbText');
    if (breadcrumb) breadcrumb.textContent = labels[filter] || 'All Files';

    notify();
  }

  /* ── Apply filter + sort to a files array ──────────────────── */
  function apply(files) {
    let result = [...files];

    // Category filter
    if (currentFilter !== 'all') {
      result = result.filter(f => f.category === currentFilter);
    }

    // Text search
    if (currentQuery) {
      const q = currentQuery;
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.ext.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }

    // Sort
    result = sort(result, currentSort);

    return result;
  }

  /* ── Sort an array of files ────────────────────────────────── */
  function sort(files, method) {
    const arr = [...files];
    switch (method) {
      case 'newest':
        return arr.sort((a, b) => {
          if (!a.uploadedAt && !b.uploadedAt) return 0;
          if (!a.uploadedAt) return 1;
          if (!b.uploadedAt) return -1;
          return new Date(b.uploadedAt) - new Date(a.uploadedAt);
        });
      case 'oldest':
        return arr.sort((a, b) => {
          if (!a.uploadedAt && !b.uploadedAt) return 0;
          if (!a.uploadedAt) return 1;
          if (!b.uploadedAt) return -1;
          return new Date(a.uploadedAt) - new Date(b.uploadedAt);
        });
      case 'name-asc':
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case 'size-desc':
        return arr.sort((a, b) => (b.size || 0) - (a.size || 0));
      case 'size-asc':
        return arr.sort((a, b) => (a.size || 0) - (b.size || 0));
      case 'type':
        return arr.sort((a, b) => {
          const catOrder = { documents:0, images:1, videos:2, audio:3, archives:4, others:5 };
          const ca = catOrder[a.category] ?? 99;
          const cb = catOrder[b.category] ?? 99;
          return ca !== cb ? ca - cb : a.ext.localeCompare(b.ext);
        });
      default:
        return arr;
    }
  }

  /* ── Notify app of changes ─────────────────────────────────── */
  function notify() {
    if (typeof onChangeCallback === 'function') onChangeCallback();
  }

  /* ── Getters ───────────────────────────────────────────────── */
  function getQuery()  { return currentQuery; }
  function getFilter() { return currentFilter; }
  function getSort()   { return currentSort; }

  return { init, apply, setFilter, getQuery, getFilter, getSort };
})();
