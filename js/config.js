/* ═══════════════════════════════════════════════════════════
   CloudVault — Configuration
   ───────────────────────────────────────────────────────────
   ⚠️  EDIT THIS FILE before deploying.
   Only this file needs to change — nothing else.
═══════════════════════════════════════════════════════════ */

const CONFIG = {
  /* ── GitHub repository settings ────────────────────────────
     Owner: your GitHub username or org name
     Repo:  the repository name (where files live)
     Branch: usually 'main' or 'master'
  ──────────────────────────────────────────────────────────── */
  GITHUB_OWNER:  'YOUR_GITHUB_USERNAME',   // e.g. 'johndoe'
  GITHUB_REPO:   'YOUR_REPO_NAME',         // e.g. 'my-cloudvault'
  GITHUB_BRANCH: 'main',

  /* ── GitHub Personal Access Token ──────────────────────────
     Required ONLY for the upload feature.
     Viewing and downloading files works WITHOUT a token.

     To generate:
       GitHub → Settings → Developer settings →
       Personal access tokens (classic) → Generate new token
       Scopes: check "repo" (full control of private repos)
               or "public_repo" for public repos

     ⚠️  SECURITY: Never commit a real token to a public repo.
         Use a GitHub Secret + Actions workflow for production.
         For personal/private repos this is acceptable for
         quick setup — rotate your token periodically.
  ──────────────────────────────────────────────────────────── */
  GITHUB_TOKEN: '',   // e.g. 'ghp_xxxxxxxxxxxxxxxxxxxx'

  /* ── Site settings ──────────────────────────────────────── */
  SITE_NAME:    'CloudVault',
  SITE_TAGLINE: 'Your Personal File Cloud',

  /* ── Upload folder inside the repo ─────────────────────────
     All uploaded files go into this subfolder.
     Subdirectories (documents/, images/ …) are auto-created.
  ──────────────────────────────────────────────────────────── */
  UPLOADS_DIR: 'uploads',

  /* ── GitHub Pages base URL ──────────────────────────────────
     Leave empty to auto-detect from window.location.
     Set explicitly if you use a custom domain:
       e.g. 'https://files.yourdomain.com'
  ──────────────────────────────────────────────────────────── */
  BASE_URL: '',

  /* ── File display settings ──────────────────────────────── */
  FILES_PER_PAGE:   100,    // max files shown (increase if needed)
  DEFAULT_VIEW:     'grid', // 'grid' or 'list'
  DEFAULT_SORT:     'newest',
  DEFAULT_THEME:    'dark', // 'dark' or 'light'

  /* ── Demo mode ──────────────────────────────────────────────
     When true, shows sample files so you can preview the UI
     without a GitHub repo. Set to false after configuring.
  ──────────────────────────────────────────────────────────── */
  DEMO_MODE: true,

  /* ── Category → file extension mapping ─────────────────────
     You can add custom extensions here.
  ──────────────────────────────────────────────────────────── */
  CATEGORIES: {
    documents: ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','md','rtf','odt','ods','odp','csv'],
    images:    ['jpg','jpeg','png','gif','svg','webp','bmp','ico','tiff','tif','avif','heic'],
    videos:    ['mp4','webm','ogg','mov','avi','mkv','flv','wmv','m4v','3gp'],
    audio:     ['mp3','wav','ogg','aac','flac','m4a','opus','weba','wma'],
    archives:  ['zip','rar','7z','tar','gz','bz2','xz','zst'],
  },
};

/* ── Derived / computed ────────────────────────────────────────
   Do not edit below this line.
──────────────────────────────────────────────────────────── */
CONFIG.IS_CONFIGURED = (
  CONFIG.GITHUB_OWNER !== 'YOUR_GITHUB_USERNAME' &&
  CONFIG.GITHUB_REPO  !== 'YOUR_REPO_NAME'
);

CONFIG.RAW_BASE = `https://raw.githubusercontent.com/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/${CONFIG.GITHUB_BRANCH}`;

CONFIG.API_BASE = `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}`;

CONFIG.SITE_URL = CONFIG.BASE_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}${window.location.pathname.replace(/\/[^/]*$/, '')}`
    : '');
