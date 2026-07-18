# ☁️ CloudVault — Personal GitHub-Powered File Cloud

A modern, responsive file hosting and sharing platform that runs entirely on **GitHub Pages** — no servers, no subscriptions, no limits. Upload, organise, preview, and share any file with anyone using a public link.

![CloudVault Dashboard](https://via.placeholder.com/900x500/0a0a0f/6366f1?text=CloudVault+Dashboard)

---

## ✨ Features

| Feature | Details |
|---|---|
| 🗂️ **File Browser** | Grid & list view with sorting, filtering, search |
| 📤 **Upload UI** | Drag & drop, multi-file, auto category detection, progress bars |
| 👁️ **Previews** | Images (gallery), PDF (embedded), video (HTML5), audio player, text/Markdown |
| 🔗 **Sharing** | One-click copy link, QR code generation per file |
| 🌙 **Dark / Light** | Theme toggle with system preference detection |
| 📱 **Responsive** | Desktop, tablet, mobile — all perfect |
| ⌨️ **Accessible** | Keyboard navigation, ARIA labels, focus rings, reduced motion |
| 🔍 **Search** | Real-time filter by name, extension, category — `⌘K` shortcut |
| 📊 **Stats** | Total files, storage used, file types count, last upload |
| ⚡ **Performance** | Lazy loading, skeleton screens, debounced search |
| 🤖 **Auto Index** | GitHub Actions rebuilds the file index on every push to `uploads/` |

---

## 🚀 Quick Start (10 minutes)

### 1. Fork this repository

Click **Fork** on GitHub to get your own copy, or clone and push to a new repo:

```bash
git clone https://github.com/YOUR_USERNAME/cloudvault.git
cd cloudvault
```

### 2. Enable GitHub Pages

`Settings → Pages → Source: Deploy from branch → main / (root) → Save`

Your site will be at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### 3. Generate a GitHub Token

`GitHub → Settings → Developer settings → Personal access tokens (classic) → Generate new token`

- Scope: `repo` (or `public_repo` for public repos)
- Copy the token — you won't see it again!

### 4. Edit `js/config.js`

This is the **only file you need to edit**:

```js
const CONFIG = {
  GITHUB_OWNER:  'your-github-username',
  GITHUB_REPO:   'your-repo-name',
  GITHUB_BRANCH: 'main',
  GITHUB_TOKEN:  'ghp_xxxxxxxxxxxxxxxxxxxx',
  DEMO_MODE:      false,   // ← set to false!
};
```

### 5. Commit and push

```bash
git add js/config.js
git commit -m "Configure CloudVault"
git push
```

GitHub Actions will deploy the site automatically. Visit your Pages URL — done! 🎉

---

## 📁 Adding Files

### Via the Upload UI (recommended)
1. Click **Upload** in the top bar
2. Drag & drop files or browse your computer
3. Select category or let CloudVault auto-detect
4. Click **Start Upload** — files are committed to your repo via the GitHub API

### Via Git directly
Place files in the correct subfolder under `uploads/`:

```
uploads/
  documents/    ← PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD, CSV…
  images/       ← JPG, PNG, GIF, SVG, WEBP, AVIF…
  videos/       ← MP4, WEBM, MOV, AVI, MKV…
  audio/        ← MP3, WAV, AAC, FLAC, M4A…
  archives/     ← ZIP, RAR, 7Z, TAR, GZ…
  others/       ← Anything else
```

The GitHub Actions workflow automatically rebuilds `uploads/index.json` on every push to `uploads/`.

---

## 🗂️ Project Structure

```
cloudvault/
├── index.html              # Main dashboard
├── file.html               # Individual file share page
├── setup.html              # Visual setup guide
├── css/
│   ├── variables.css       # Design tokens & themes (dark/light)
│   ├── base.css            # Reset, typography, buttons
│   ├── layout.css          # Sidebar, topbar, stats bar, grid
│   ├── components.css      # Cards, modals, upload zone, toasts
│   ├── animations.css      # Entry effects, transitions
│   └── responsive.css      # Mobile/tablet breakpoints
├── js/
│   ├── config.js           # ← EDIT THIS — your GitHub credentials
│   ├── utils.js            # Helpers (format, debounce, clipboard…)
│   ├── fileTypes.js        # Extension → icon/color/category map
│   ├── github.js           # GitHub API (list files, upload)
│   ├── upload.js           # Drag & drop, queue, progress
│   ├── preview.js          # Preview modal for all formats
│   ├── search.js           # Search, filter, sort engine
│   ├── ui.js               # Rendering, theme, toasts, stats
│   └── app.js              # Main orchestrator
├── assets/
│   └── icons/
│       └── favicon.svg
├── uploads/                # Your files go here
│   ├── documents/
│   ├── images/
│   ├── videos/
│   ├── audio/
│   ├── archives/
│   └── others/
└── .github/
    └── workflows/
        ├── deploy.yml      # Auto-deploy to GitHub Pages
        └── index.yml       # Auto-rebuild file index on upload
```

---

## 🔒 Security Notes

| Scenario | Recommendation |
|---|---|
| **Public repo, personal use** | Token in `config.js` is acceptable for quick setup — rotate periodically |
| **Public repo, shared/team** | Use a Cloudflare Worker or Vercel Edge Function as a proxy — token stays server-side |
| **Private repo** | Token in `config.js` is fine since the source isn't publicly visible |
| **Production** | Store token in a GitHub Secret and proxy uploads through a serverless function |

---

## 🎨 Supported File Formats

| Category | Formats | Preview |
|---|---|---|
| Documents | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD, CSV, RTF | PDF embedded · Text/MD rendered · Others: download |
| Images | JPG, PNG, GIF, SVG, WEBP, BMP, AVIF, HEIC, TIFF | Full-screen gallery |
| Videos | MP4, WEBM, MOV, AVI, MKV, FLV | HTML5 player |
| Audio | MP3, WAV, AAC, FLAC, M4A, OPUS | Audio player |
| Archives | ZIP, RAR, 7Z, TAR, GZ, BZ2 | Download only |
| Code | JS, TS, HTML, CSS, PY, JSON, YAML, SH… | Syntax-highlighted text |
| Others | Any format | Download button |

---

## ⚙️ Configuration Reference

All options in `js/config.js`:

```js
const CONFIG = {
  // Required
  GITHUB_OWNER:   'your-username',
  GITHUB_REPO:    'your-repo',
  GITHUB_BRANCH:  'main',
  GITHUB_TOKEN:   '',          // Required for upload only

  // Site
  SITE_NAME:      'CloudVault',
  SITE_TAGLINE:   'Your Personal File Cloud',
  BASE_URL:       '',          // Set for custom domains

  // Behaviour
  UPLOADS_DIR:    'uploads',
  FILES_PER_PAGE: 100,
  DEFAULT_VIEW:   'grid',      // 'grid' | 'list'
  DEFAULT_SORT:   'newest',
  DEFAULT_THEME:  'dark',      // 'dark' | 'light'
  DEMO_MODE:      false,       // true = show sample files

  // Category → extension mapping (add custom extensions here)
  CATEGORIES: {
    documents: ['pdf','doc','docx', ...],
    images:    ['jpg','jpeg','png', ...],
    // ...
  },
};
```

---

## 📱 Sharing Files

Every file has a shareable URL:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/file.html?path=uploads/images/photo.jpg
```

- **Anyone** can open the link and preview or download the file
- **No GitHub account required** for visitors
- Each file page includes a **QR code** for easy mobile sharing
- Direct raw URL also works for embedding images in other sites

---

## 🛠️ Custom Domain

1. `Settings → Pages → Custom domain` → enter `files.yourdomain.com`
2. Add a `CNAME` DNS record: `files.yourdomain.com` → `YOUR_USERNAME.github.io`
3. Update `config.js`: `BASE_URL: 'https://files.yourdomain.com'`
4. Enable **Enforce HTTPS** in GitHub Pages settings

---

## 📄 License

MIT — free to use, modify, and deploy for personal or commercial projects.

---

<p align="center">Built with ❤️ · Powered by GitHub Pages · Zero cost</p>
