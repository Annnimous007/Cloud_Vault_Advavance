/* ═══════════════════════════════════════════════════════════
   GITHUB API — File listing, uploading, metadata
═══════════════════════════════════════════════════════════ */

const GitHub = (() => {

  /* ── API request helper ────────────────────────────────────── */
  async function apiRequest(endpoint, options = {}) {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
    if (CONFIG.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${CONFIG.GITHUB_TOKEN}`;
    }
    const res = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API error ${res.status}`);
    }
    return res.json();
  }

  /* ── Recursively list all files under uploads/ ─────────────── */
  async function listFiles() {
    try {
      const data = await apiRequest(`/git/trees/${CONFIG.GITHUB_BRANCH}?recursive=1`);
      const items = data.tree || [];

      const files = items
        .filter(item =>
          item.type === 'blob' &&
          item.path.startsWith(CONFIG.UPLOADS_DIR + '/') &&
          !item.path.endsWith('/.gitkeep') &&
          !item.path.endsWith('/.gitignore')
        )
        .map(item => {
          const filename = item.path.split('/').pop();
          const category = FileTypes.getCategory(filename);
          const pathParts = item.path.split('/');
          const folder = pathParts.length > 2 ? pathParts[pathParts.length - 2] : 'others';

          return {
            name:      filename,
            path:      item.path,
            sha:       item.sha,
            size:      item.size || 0,
            category:  category,
            folder:    folder,
            ext:       Utils.getExt(filename),
            rawUrl:    Utils.rawUrl(item.path),
            shareUrl:  buildShareUrl(item.path),
            uploadedAt: null, // GitHub tree API doesn't return dates
          };
        });

      // Try to enrich with commit dates (limited to first 30 to avoid rate limiting)
      const enriched = await enrichWithDates(files);
      return enriched;
    } catch (err) {
      console.error('GitHub listFiles error:', err);
      throw err;
    }
  }

  /* ── Enrich files with last-commit dates ───────────────────── */
  async function enrichWithDates(files) {
    if (!files.length) return files;
    // Fetch dates in batches to avoid hammering the API
    const BATCH = 20;
    const toEnrich = files.slice(0, BATCH);

    await Promise.allSettled(
      toEnrich.map(async (file) => {
        try {
          const commits = await apiRequest(`/commits?path=${encodeURIComponent(file.path)}&per_page=1`);
          if (commits && commits[0]) {
            file.uploadedAt = commits[0].commit.committer.date;
          }
        } catch {
          // Date enrichment is best-effort
        }
      })
    );
    return files;
  }

  /* ── Build public share URL ────────────────────────────────── */
  function buildShareUrl(path) {
    const base = CONFIG.SITE_URL.replace(/\/$/, '');
    return `${base}/file.html?path=${encodeURIComponent(path)}`;
  }

  /* ── Upload a file via GitHub Contents API ─────────────────── */
  async function uploadFile(file, category = 'auto', onProgress = null) {
    if (!CONFIG.GITHUB_TOKEN) {
      throw new Error('GitHub token not configured. See Setup Guide.');
    }

    const detectedCat = category === 'auto' ? FileTypes.getCategory(file.name) : category;
    const safeName    = Utils.slugify(file.name);
    const repoPath    = `${CONFIG.UPLOADS_DIR}/${detectedCat}/${safeName}`;

    // Check for existing file (duplicate detection)
    let existingSha = null;
    try {
      const existing = await apiRequest(`/contents/${repoPath}`);
      existingSha = existing.sha;
    } catch {
      // File doesn't exist — fine
    }

    if (onProgress) onProgress(20);

    // Encode to base64
    const base64 = await Utils.fileToBase64(file);
    if (onProgress) onProgress(60);

    const now    = new Date().toISOString();
    const body   = {
      message: `Upload ${safeName} via CloudVault [${now}]`,
      content: base64,
      branch:  CONFIG.GITHUB_BRANCH,
    };
    if (existingSha) body.sha = existingSha; // Update if duplicate

    const result = await apiRequest(`/contents/${repoPath}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    if (onProgress) onProgress(100);

    return {
      name:       safeName,
      path:       repoPath,
      sha:        result.content.sha,
      size:       file.size,
      category:   detectedCat,
      ext:        Utils.getExt(safeName),
      rawUrl:     Utils.rawUrl(repoPath),
      shareUrl:   buildShareUrl(repoPath),
      uploadedAt: now,
      isDuplicate: !!existingSha,
    };
  }

  /* ── Delete a file via GitHub Contents API ─────────────────── */
  async function deleteFile(file) {
    if (!CONFIG.GITHUB_TOKEN) {
      throw new Error('GitHub token not configured. See Setup Guide.');
    }
    if (!file.sha) {
      throw new Error('Missing file SHA — cannot delete safely.');
    }

    const body = {
      message: `Delete ${file.name} via CloudVault`,
      sha: file.sha,
      branch: CONFIG.GITHUB_BRANCH,
    };

    await apiRequest(`/contents/${file.path}`, {
      method: 'DELETE',
      body: JSON.stringify(body),
    });

    return true;
  }

  /* ── Demo mode: generate fake files for UI preview ─────────── */
  function getDemoFiles() {
    const now = Date.now();
    const day = 86400000;
    return [
      { name:'Project_Report_Q4.pdf',     path:'uploads/documents/Project_Report_Q4.pdf',     size:2457600,  category:'documents', ext:'pdf',  uploadedAt: new Date(now - 1*day).toISOString(), sha:'a1' },
      { name:'Budget_2024.xlsx',          path:'uploads/documents/Budget_2024.xlsx',           size:98304,    category:'documents', ext:'xlsx', uploadedAt: new Date(now - 2*day).toISOString(), sha:'a2' },
      { name:'Team_Photo.jpg',            path:'uploads/images/Team_Photo.jpg',               size:3145728,  category:'images',    ext:'jpg',  uploadedAt: new Date(now - 3*day).toISOString(), sha:'a3' },
      { name:'Product_Launch.pptx',       path:'uploads/documents/Product_Launch.pptx',       size:5242880,  category:'documents', ext:'pptx', uploadedAt: new Date(now - 4*day).toISOString(), sha:'a4' },
      { name:'Logo_Design.svg',           path:'uploads/images/Logo_Design.svg',              size:24576,    category:'images',    ext:'svg',  uploadedAt: new Date(now - 5*day).toISOString(), sha:'a5' },
      { name:'Product_Demo.mp4',          path:'uploads/videos/Product_Demo.mp4',             size:52428800, category:'videos',    ext:'mp4',  uploadedAt: new Date(now - 6*day).toISOString(), sha:'a6' },
      { name:'Background_Music.mp3',      path:'uploads/audio/Background_Music.mp3',          size:4718592,  category:'audio',     ext:'mp3',  uploadedAt: new Date(now - 7*day).toISOString(), sha:'a7' },
      { name:'Source_Code.zip',           path:'uploads/archives/Source_Code.zip',            size:10485760, category:'archives',  ext:'zip',  uploadedAt: new Date(now - 8*day).toISOString(), sha:'a8' },
      { name:'README.md',                 path:'uploads/documents/README.md',                 size:4096,     category:'documents', ext:'md',   uploadedAt: new Date(now - 9*day).toISOString(), sha:'a9' },
      { name:'Screenshot_App.png',        path:'uploads/images/Screenshot_App.png',           size:1572864,  category:'images',    ext:'png',  uploadedAt: new Date(now-10*day).toISOString(), sha:'b1' },
      { name:'Meeting_Notes.docx',        path:'uploads/documents/Meeting_Notes.docx',        size:36864,    category:'documents', ext:'docx', uploadedAt: new Date(now-11*day).toISOString(), sha:'b2' },
      { name:'Podcast_Episode_01.mp3',    path:'uploads/audio/Podcast_Episode_01.mp3',        size:31457280, category:'audio',     ext:'mp3',  uploadedAt: new Date(now-12*day).toISOString(), sha:'b3' },
      { name:'Banner_Wide.webp',          path:'uploads/images/Banner_Wide.webp',             size:614400,   category:'images',    ext:'webp', uploadedAt: new Date(now-13*day).toISOString(), sha:'b4' },
      { name:'Data_Export.csv',           path:'uploads/documents/Data_Export.csv',           size:204800,   category:'documents', ext:'csv',  uploadedAt: new Date(now-14*day).toISOString(), sha:'b5' },
      { name:'Design_Assets.rar',         path:'uploads/archives/Design_Assets.rar',          size:20971520, category:'archives',  ext:'rar',  uploadedAt: new Date(now-15*day).toISOString(), sha:'b6' },
      { name:'Tutorial_Video.mp4',        path:'uploads/videos/Tutorial_Video.mp4',           size:78643200, category:'videos',    ext:'mp4',  uploadedAt: new Date(now-16*day).toISOString(), sha:'b7' },
      { name:'Profile_Avatar.gif',        path:'uploads/images/Profile_Avatar.gif',           size:524288,   category:'images',    ext:'gif',  uploadedAt: new Date(now-17*day).toISOString(), sha:'b8' },
      { name:'Invoice_Nov2024.pdf',       path:'uploads/documents/Invoice_Nov2024.pdf',       size:147456,   category:'documents', ext:'pdf',  uploadedAt: new Date(now-18*day).toISOString(), sha:'b9' },
    ].map(f => ({
      ...f,
      rawUrl:   `${CONFIG.RAW_BASE}/${f.path}`,
      shareUrl: `${CONFIG.SITE_URL}/file.html?path=${encodeURIComponent(f.path)}`,
    }));
  }

  return { listFiles, uploadFile, deleteFile, getDemoFiles, apiRequest };
})();
