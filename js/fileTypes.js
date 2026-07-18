/* ═══════════════════════════════════════════════════════════
   FILE TYPES — Icons, colors, category detection
═══════════════════════════════════════════════════════════ */

const FileTypes = (() => {

  /* ── Icon map: extension → { icon, color } ─────────────────── */
  const EXT_MAP = {
    // Documents
    pdf:  { icon: '📄', fa: 'fa-file-pdf',         color: '#ef4444', label: 'PDF' },
    doc:  { icon: '📝', fa: 'fa-file-word',         color: '#2563eb', label: 'Word' },
    docx: { icon: '📝', fa: 'fa-file-word',         color: '#2563eb', label: 'Word' },
    xls:  { icon: '📊', fa: 'fa-file-excel',        color: '#16a34a', label: 'Excel' },
    xlsx: { icon: '📊', fa: 'fa-file-excel',        color: '#16a34a', label: 'Excel' },
    ppt:  { icon: '📋', fa: 'fa-file-powerpoint',   color: '#ea580c', label: 'PowerPoint' },
    pptx: { icon: '📋', fa: 'fa-file-powerpoint',   color: '#ea580c', label: 'PowerPoint' },
    txt:  { icon: '📃', fa: 'fa-file-lines',        color: '#64748b', label: 'Text' },
    md:   { icon: '📑', fa: 'fa-file-code',         color: '#7c3aed', label: 'Markdown' },
    rtf:  { icon: '📃', fa: 'fa-file-lines',        color: '#64748b', label: 'RTF' },
    csv:  { icon: '📊', fa: 'fa-file-csv',          color: '#059669', label: 'CSV' },
    odt:  { icon: '📝', fa: 'fa-file-lines',        color: '#2563eb', label: 'OpenDoc' },
    ods:  { icon: '📊', fa: 'fa-file-lines',        color: '#16a34a', label: 'OpenSheet' },
    odp:  { icon: '📋', fa: 'fa-file-lines',        color: '#ea580c', label: 'OpenPres' },

    // Images
    jpg:  { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'JPEG' },
    jpeg: { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'JPEG' },
    png:  { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'PNG' },
    gif:  { icon: '🎞️', fa: 'fa-file-image',       color: '#ec4899', label: 'GIF' },
    svg:  { icon: '🎨', fa: 'fa-file-image',       color: '#8b5cf6', label: 'SVG' },
    webp: { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'WebP' },
    bmp:  { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'BMP' },
    ico:  { icon: '🔷', fa: 'fa-file-image',       color: '#6366f1', label: 'ICO' },
    tiff: { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'TIFF' },
    tif:  { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'TIFF' },
    avif: { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'AVIF' },
    heic: { icon: '🖼️', fa: 'fa-file-image',       color: '#f59e0b', label: 'HEIC' },

    // Videos
    mp4:  { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'MP4' },
    webm: { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'WebM' },
    mov:  { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'MOV' },
    avi:  { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'AVI' },
    mkv:  { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'MKV' },
    flv:  { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'FLV' },
    wmv:  { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'WMV' },
    m4v:  { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'M4V' },
    ogg:  { icon: '🎬', fa: 'fa-file-video',       color: '#dc2626', label: 'OGG' },

    // Audio
    mp3:  { icon: '🎵', fa: 'fa-file-audio',       color: '#7c3aed', label: 'MP3' },
    wav:  { icon: '🎵', fa: 'fa-file-audio',       color: '#7c3aed', label: 'WAV' },
    aac:  { icon: '🎵', fa: 'fa-file-audio',       color: '#7c3aed', label: 'AAC' },
    flac: { icon: '🎵', fa: 'fa-file-audio',       color: '#7c3aed', label: 'FLAC' },
    m4a:  { icon: '🎵', fa: 'fa-file-audio',       color: '#7c3aed', label: 'M4A' },
    opus: { icon: '🎵', fa: 'fa-file-audio',       color: '#7c3aed', label: 'OPUS' },
    weba: { icon: '🎵', fa: 'fa-file-audio',       color: '#7c3aed', label: 'WebA' },
    wma:  { icon: '🎵', fa: 'fa-file-audio',       color: '#7c3aed', label: 'WMA' },

    // Archives
    zip:  { icon: '📦', fa: 'fa-file-zipper',      color: '#b45309', label: 'ZIP' },
    rar:  { icon: '📦', fa: 'fa-file-zipper',      color: '#b45309', label: 'RAR' },
    '7z': { icon: '📦', fa: 'fa-file-zipper',      color: '#b45309', label: '7Z' },
    tar:  { icon: '📦', fa: 'fa-file-zipper',      color: '#b45309', label: 'TAR' },
    gz:   { icon: '📦', fa: 'fa-file-zipper',      color: '#b45309', label: 'GZ' },
    bz2:  { icon: '📦', fa: 'fa-file-zipper',      color: '#b45309', label: 'BZ2' },
    xz:   { icon: '📦', fa: 'fa-file-zipper',      color: '#b45309', label: 'XZ' },

    // Code
    js:   { icon: '⚡', fa: 'fa-file-code',        color: '#f59e0b', label: 'JS' },
    ts:   { icon: '🔷', fa: 'fa-file-code',        color: '#2563eb', label: 'TS' },
    html: { icon: '🌐', fa: 'fa-file-code',        color: '#ea580c', label: 'HTML' },
    css:  { icon: '🎨', fa: 'fa-file-code',        color: '#2563eb', label: 'CSS' },
    py:   { icon: '🐍', fa: 'fa-file-code',        color: '#16a34a', label: 'Python' },
    json: { icon: '📋', fa: 'fa-file-code',        color: '#f59e0b', label: 'JSON' },
    xml:  { icon: '📋', fa: 'fa-file-code',        color: '#64748b', label: 'XML' },
    sh:   { icon: '💻', fa: 'fa-file-code',        color: '#64748b', label: 'Shell' },

    // Fonts
    ttf:  { icon: '🔤', fa: 'fa-font',             color: '#64748b', label: 'TTF' },
    otf:  { icon: '🔤', fa: 'fa-font',             color: '#64748b', label: 'OTF' },
    woff: { icon: '🔤', fa: 'fa-font',             color: '#64748b', label: 'WOFF' },
    woff2:{ icon: '🔤', fa: 'fa-font',             color: '#64748b', label: 'WOFF2' },

    // Default
    _default: { icon: '📁', fa: 'fa-file',         color: '#64748b', label: 'File' },
  };

  /* ── Get type info for a filename ──────────────────────────── */
  function getInfo(filename) {
    const ext = Utils.getExt(filename);
    return EXT_MAP[ext] || { ...EXT_MAP['_default'], label: ext.toUpperCase() || 'File' };
  }

  /* ── Get category for a filename ───────────────────────────── */
  function getCategory(filename) {
    const ext = Utils.getExt(filename);
    for (const [cat, exts] of Object.entries(CONFIG.CATEGORIES)) {
      if (exts.includes(ext)) return cat;
    }
    return 'others';
  }

  /* ── Is image? ─────────────────────────────────────────────── */
  function isImage(filename) {
    return getCategory(filename) === 'images';
  }

  /* ── Is video? ─────────────────────────────────────────────── */
  function isVideo(filename) {
    return getCategory(filename) === 'videos';
  }

  /* ── Is audio? ─────────────────────────────────────────────── */
  function isAudio(filename) {
    return getCategory(filename) === 'audio';
  }

  /* ── Is PDF? ───────────────────────────────────────────────── */
  function isPDF(filename) {
    return Utils.getExt(filename) === 'pdf';
  }

  /* ── Is text-previewable? ──────────────────────────────────── */
  function isText(filename) {
    const TEXT_EXTS = ['txt','md','csv','json','xml','html','css','js','ts','sh','yaml','yml','toml','ini','env','log','py','rb','rs','go','java','c','cpp','h'];
    return TEXT_EXTS.includes(Utils.getExt(filename));
  }

  /* ── Render icon HTML (FA icon with color dot) ─────────────── */
  function renderIconHTML(filename, size = 36) {
    const info = getInfo(filename);
    return `<i class="fa-solid ${info.fa}" style="color:${info.color};font-size:${Math.round(size * 0.6)}px"></i>`;
  }

  /* ── Render emoji icon ─────────────────────────────────────── */
  function renderEmoji(filename) {
    return getInfo(filename).icon;
  }

  return { getInfo, getCategory, isImage, isVideo, isAudio, isPDF, isText, renderIconHTML, renderEmoji, EXT_MAP };
})();
