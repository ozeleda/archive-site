# The Archive — Timeline Website

A static, no-framework website for publishing a chronological visual archive,
plus a local editor for managing entries. No database, no backend, no
recurring cost beyond your domain.

## What's in here

```
archive-site/
├── index.html          the public timeline page
├── editor.html          your local content editor (open in a browser)
├── css/styles.css       all styling
├── js/timeline.js       renders the public timeline from data/entries.json
├── js/editor.js         editor logic (load / add / edit / delete / export)
├── data/entries.json    your archive data — one JSON array of entries
└── media/               your image files live here
```

## 1. Running it locally

Browsers block a page from loading a local JSON file directly off disk
(the `file://` protocol), so you need a tiny local server to preview things.
From inside the `archive-site` folder, run one of:

```bash
# Python (usually already installed)
python3 -m http.server 8000

# or Node, if you have it
npx serve .
```

Then open `http://localhost:8000` for the timeline, and
`http://localhost:8000/editor.html` for the editor.

## 2. Adding your own entries

Open `editor.html` locally. It will try to auto-load your existing
`data/entries.json`. From there:

1. Click **+ New entry**, fill in the form, click **Save entry**.
2. For an **image**: drop the image file into the `media/` folder first,
   then reference it in the "Media URL" field as `media/your-file.jpg`.
3. For a **video**: don't put the video file in this project. Upload it to
   YouTube or Vimeo (set to "Unlisted" if you don't want it publicly
   searchable), then use the **embed URL** — for YouTube that looks like
   `https://www.youtube.com/embed/VIDEO_ID` (not the normal watch link).
   Optionally add a poster image the same way you'd add an image entry.
4. When you're done editing, click **Export entries.json** — this downloads
   an updated file. Move it into `data/`, replacing the old one.
5. Repeat any time you want to add more entries. The editor auto-generates
   accession-style catalog numbers and groups entries by year — you don't
   need to keep the file in date order yourself.

Why not store everything in a database? At 100+ entries a flat JSON file
is still plenty fast, it's diffable in git (so you get free version
history of every edit), and it keeps hosting free and simple. If your
archive later grows into the thousands or you want other people editing
it through a web form, that's the point to swap in something like a
headless CMS (e.g. Sanity or a Netlify CMS/Decap setup) reading from the
same `entries.json` structure.

## 3. Deploying — recommended: Netlify + GitHub

This gets you free hosting, HTTPS, and your custom domain, and lets you
publish updates with a normal `git push`.

1. **Create a GitHub repo** and push this folder to it:
   ```bash
   cd archive-site
   git init
   git add .
   git commit -m "Initial archive site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. **Sign up at [netlify.com](https://www.netlify.com)** (free tier is
   fine), then **Add new site → Import an existing project**, and
   connect your GitHub repo.
3. Build settings: leave **Build command** blank and set **Publish
   directory** to `.` (this is a static site — nothing to build).
4. Click **Deploy**. You'll get a live `*.netlify.app` URL within a minute.
5. **Connect your domain**: in the Netlify site dashboard go to
   **Domain settings → Add a domain**, enter your domain name, and follow
   the DNS instructions it gives you (usually either changing your
   domain's nameservers to Netlify's, or adding an A/CNAME record at
   your current registrar). Netlify issues a free HTTPS certificate
   automatically once DNS is pointed at it.
6. From now on, any time you `git push` an updated `entries.json` (or
   any file), Netlify rebuilds and redeploys automatically.

**Alternative:** Vercel works almost identically if you'd rather use that.
**If you'd rather use your own web host / cPanel:** skip the GitHub/Netlify
steps and just upload the whole `archive-site` folder via FTP/SFTP or your
host's file manager — it's a static site, so it runs anywhere that can
serve HTML files.

## 4. Customizing

- **Colors & fonts**: all in `css/styles.css` under the `:root` block at
  the top — change the hex values and font names there and the whole
  site updates.
- **Site title/intro text**: edit the `<header class="site-header">`
  block in `index.html`.
- **Accession number format**: edit the `accessionNumber()` function in
  `js/timeline.js` if you want a different catalog-number style.
