# Yusuf Semih Uca — Game Developer Portfolio

A responsive, static portfolio for game programming and game audio. It uses HTML, CSS and vanilla JavaScript, so it has no framework runtime or backend requirement.

## Run locally

On Windows, double-click `start-admin.bat`, then open `http://127.0.0.1:4174/` for the portfolio. The site uses JavaScript `fetch()` to load its JSON data, so serve the files over HTTP rather than opening an HTML file directly.

## Use the local admin panel

On Windows, double-click `start-admin.bat`. It starts a built-in PowerShell server and opens `http://127.0.0.1:4174/admin.html`; Node.js is not required on your PC. Keep the terminal window open while editing. The panel updates project descriptions, tags, images, links, itch.io URLs, profile details and social links.

To add a Unity WebGL game, first save its project in the editor, then choose the WebGL ZIP and upload it. The ZIP must contain `index.html` at its top level. The editor unpacks it into `games/<project-id>/`, updates the project entry and adds a Play button on the Games page. The original ZIP is not published. Uploads are limited to 500 MB compressed and 2 GB extracted.

The editor only listens on `127.0.0.1` and is not copied into `dist/`. It is a local editing tool, not an online, multi-user admin account.

## Edit projects

Project entries live in `data/projects.json`. Edit a project's title, category (`programming` or `audio`), image path, alt text, tags, description, optional YouTube video URL and links. Project thumbnails expand into the video when a YouTube URL is set. Link entries use this shape:

```json
{ "label": "View project", "url": "https://example.com/project" }
```

The homepage shows both categories at once. Project cards start collapsed; select a card title to expand its details. The Projects page can filter by category.

## Replace images

The included SVGs are original illustrative placeholders, not screenshots from finished games. Replace the files under `assets/` or update the `image` path in `data/projects.json`. Keep project images in a 4:3 ratio for the intended crop. Use descriptive `alt` text for meaningful images.

## Add your links

Edit `data/site.json` to add your GitHub, LinkedIn, itch.io and YouTube URLs, your contact email, and an optional showreel URL. Social icons appear when a URL is set. Project action buttons appear when `links` contains entries. Until a showreel URL is supplied, its button opens the project list.

## Deploy

The included GitHub Actions workflow prepares and deploys `dist/` to GitHub Pages whenever code is pushed to `main`. In the GitHub repository, choose **Settings → Pages → GitHub Actions** as the build source. A personal site repository must be named `<your-github-username>.github.io`; its address is `https://<your-github-username>.github.io/`. A regular project repository uses `https://<your-github-username>.github.io/<repository-name>/`. GitHub Pages does not use a `.github` address suffix. GitHub blocks individual files over 100 MiB and limits a published Pages site to 1 GB, so large Unity builds may need optimization or a different game host.

## Structure

```text
index.html          Home
projects.html       Filterable project list
games.html          Playable-games hub
about.html          About and focus areas
app.js              Shared rendering and interactions
styles.css          Shared responsive design system
data/projects.json  Editable project content
data/site.json      Editable profile and external links
assets/             Replaceable SVG artwork
scripts/admin-server.ps1 Local-only Windows admin editor server
scripts/prepare-dist.mjs  Prepare files for static hosting
.github/workflows/pages.yml  Build and deploy GitHub Pages
admin.html          Local-only content editor
dist/               Static hosting output
```
