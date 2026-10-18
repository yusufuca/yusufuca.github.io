const [site, projects] = await Promise.all([
  fetch("data/site.json").then((response) => response.json()),
  fetch("data/projects.json").then((response) => response.json()),
]);

// Editorial content is managed in data/site.json and the local Website Text editor.
const copy = {
  navHome: "Home", navProjects: "Projects", navGames: "Games", navAbout: "About",
  filterAll: "All projects", filterProgramming: "Game Programming", filterAudio: "Game Audio",
  gamesPlay: "Play in Browser", gamesItch: "View on itch.io", gamesReadyTitle: "Choose a Game",
  gamesEmptyTitle: "No playable builds available yet.", cvButton: "Download CV",
  ...site.copy,
};
const splitCopy = (key) => (copy[key] || "").split(",").map((item) => item.trim()).filter(Boolean);

const app = document.querySelector("#app");
const page = document.body.dataset.page || "home";
const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const icon = {
  github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.68-3.75-1.32-3.75-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.7.08-.69.08-.69 1.12.08 1.7 1.15 1.7 1.15.99 1.7 2.6 1.2 3.23.92.1-.72.39-1.2.7-1.48-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.15 3.05-1.15.61 1.53.23 2.67.11 2.95.72.78 1.15 1.78 1.15 3 0 4.3-2.62 5.23-5.12 5.5.4.35.75 1.03.75 2.08v3.1c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.94 18.7H4.98V9.16h2.96v9.54ZM6.46 7.86a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44ZM19.02 18.7h-2.95v-4.64c0-1.1-.02-2.52-1.54-2.52-1.54 0-1.78 1.2-1.78 2.44v4.72H9.8V9.16h2.83v1.3h.04c.4-.75 1.36-1.54 2.8-1.54 3 0 3.55 1.97 3.55 4.53v5.25Z"/></svg>',
  gamepad: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 6h9.6c2.3 0 3.5 1.5 4.1 3.6l1 4.7c.5 2.2-1.9 3.8-3.6 2.4l-2.2-1.8H7.9l-2.2 1.8c-1.7 1.4-4.1-.2-3.6-2.4l1-4.7C3.7 7.5 4.9 6 7.2 6Zm.3 2.7v1.8H5.7v1.8h1.8v1.8h1.8v-1.8h1.8v-1.8H9.3V8.7H7.5Zm8.8 1a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm2.6 2.1a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const socials = [
  ["github", "GitHub"], ["linkedin", "LinkedIn"],
].filter(([key]) => site.socials?.[key]);

const gmailLogo = '<svg class="gmail-logo" viewBox="0 0 24 24" role="img" aria-label="Gmail"><path fill="#4285f4" d="M22 21h-4V9.2l4-3V21Z"/><path fill="#34a853" d="M2 21h4V9.2L2 6.2V21Z"/><path fill="#ea4335" d="M22 5.3 20.1 3.8 12 10 3.9 3.8 2 5.3l2.4 4.1L12 15l7.6-5.6L22 5.3Z"/><path fill="#fbbc04" d="M2 5.3v14c0 1 .9 1.7 2 1.7h2V9.2L2 5.3Z"/><path fill="#c5221f" d="M18 9.2V21h2c1.1 0 2-.7 2-1.7v-14l-4 3.9Z"/></svg>';

function contactActions(className = "footer-contact-actions") {
  const cvButton = site.cvUrl
    ? `<a class="footer-utility-button" href="${esc(site.cvUrl)}" download aria-label="Download CV"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v3h14v-3"/></svg><span>${esc(copy.cvButton)}</span></a>`
    : "";
  const socialLinks = socials.map(([key, label]) => `<a class="footer-social-link" href="${esc(site.socials[key])}" aria-label="${label}" title="${label}" target="_blank" rel="noreferrer">${icon[key] || icon.gamepad}</a>`).join("");
  return `<div class="${className}">${cvButton}<span class="email-copy-wrap"><button class="footer-utility-button email-copy-button contact-button" type="button" data-email="${esc(site.email || "")}" aria-label="Copy email address" title="Copy email address">${gmailLogo}<span class="email-button-label">${esc(copy.footerEmailButton)}</span><svg class="copy-check-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></button><span class="email-copy-status" role="status" aria-live="polite"></span></span><div class="footer-social-links">${socialLinks}</div></div>`;
}

function header(active) {
  return `<a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header wrap">
      <a class="brand" href="index.html" aria-label="${esc(site.name)} home"><span class="brand-name">${esc(site.name)}</span><span class="brand-role">${esc(site.role)}</span></a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span></span><span></span><span></span><span class="sr-only">Toggle navigation</span></button>
      <nav class="primary-nav" id="primary-nav" aria-label="Main navigation">
        <a class="${active === "home" ? "active" : ""}" href="index.html">${esc(copy.navHome)}</a>
        <a class="${active === "projects" ? "active" : ""}" href="projects.html">${esc(copy.navProjects)}</a>
        <a class="${active === "games" ? "active" : ""}" href="games.html">${esc(copy.navGames)}</a>
        <a class="${active === "about" ? "active" : ""}" href="about.html">${esc(copy.navAbout)}</a>
      </nav>
      <div class="header-actions"></div>
    </header>`;
}

function footer() {
  return `<footer class="site-footer" id="contact"><div class="wrap footer-inner"><div class="footer-bottom"><a class="brand brand-compact" href="index.html"><span class="brand-name">${esc(site.name)}</span><span class="brand-role">${esc(site.role)}</span></a>${copy.footerNote ? `<span class="footer-note">${esc(copy.footerNote)}</span>` : ""}${contactActions()}</div></div></footer>`;
}

function tags(items) {
  return `<ul class="tag-list" aria-label="Project tags">${items.map((tag) => `<li>${esc(tag)}</li>`).join("")}</ul>`;
}

function youtubeEmbedUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      videoId = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : "";
  } catch { return ""; }
}

function projectThumbnail(project) {
  if (project.image) return project.image;
  const embed = youtubeEmbedUrl(project.videoUrl);
  const videoId = embed.match(/\/embed\/([^?]+)/)?.[1];
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "assets/sifb.svg";
}

function projectMedia(project, expanded) {
  const videoUrl = youtubeEmbedUrl(project.videoUrl);
  if (videoUrl) {
    const playerUrl = `${videoUrl}&enablejsapi=1&playsinline=1&origin=${encodeURIComponent(location.origin)}`;
    return `<iframe class="project-video-frame" src="${esc(playerUrl)}" title="${esc(project.title)} video" loading="eager" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><div class="project-video-cover"><img src="${esc(projectThumbnail(project))}" alt="${esc(project.alt)}" width="800" height="450" /></div>`;
  }
  if (!expanded) return `<img src="${esc(projectThumbnail(project))}" alt="${esc(project.alt)}" loading="lazy" width="800" height="600" />`;
  return `<div class="video-placeholder"><span>▶</span><p>No video available.</p></div>`;
}

function projectCard(project, expanded = false) {
  const links = [
    ...(project.links || []),
    ...(project.gamePath ? [{ label: copy.gamesPlay, url: `games.html?game=${encodeURIComponent(project.id)}`, kind: "play" }] : []),
    ...(project.itchUrl ? [{ label: "View on itch.io", url: project.itchUrl }] : []),
  ].filter((link) => link.url);
  const description = linkedDescription(project);
  return `<article id="project-${esc(project.id)}" class="project-card ${expanded ? "is-expanded" : ""}" data-project="${esc(project.id)}" tabindex="0" aria-label="${esc(project.title)} project, click to expand">
    <button class="project-trigger" type="button" aria-expanded="${expanded}" aria-controls="details-${esc(project.id)}">
      <span class="project-title">${esc(project.title)}</span><span class="expand-mark" aria-hidden="true">${expanded ? "−" : "+"}</span>
    </button>
    <div class="project-visual ${youtubeEmbedUrl(project.videoUrl) ? "has-video" : expanded ? "is-placeholder" : ""}">${projectMedia(project, expanded)}</div>
    ${tags(project.tags)}
    <p class="project-summary">${esc(String(project.description || "").split(/\n\s*\n/)[0])}</p>
    <div class="project-details" id="details-${esc(project.id)}" ${expanded ? "" : "hidden"}>
      ${project.subtitle ? `<span class="project-subtitle">${esc(project.subtitle)}</span>` : ""}
      <p>${description}</p>
      ${project.date ? `<time class="project-date" datetime="${esc(project.date)}">${esc(project.date)}</time>` : ""}
      ${links.length ? `<div class="project-links">${links.map((link) => projectAction(link)).join("")}</div>` : ""}
    </div>
  </article>`;
}

function linkedDescription(project) {
  const text = String(project.description || "");
  const link = (project.textLinks || []).find((item) => item.text && item.targetProjectId && text.includes(item.text));
  if (!link) return esc(text);
  const index = text.indexOf(link.text);
  const href = `projects.html#project-${encodeURIComponent(link.targetProjectId)}`;
  return `${esc(text.slice(0, index))}<a class="inline-project-link" data-project-target="${esc(link.targetProjectId)}" href="${esc(href)}">${esc(link.text)}</a>${esc(text.slice(index + link.text.length))}`;
}

function projectAction(link) {
  const isPlay = link.kind === "play" || link.label.toLowerCase() === "play on this site";
  const isInternal = /^projects\.html#project-/.test(link.url);
  let service = "external";
  try {
    const host = new URL(link.url, location.href).hostname.toLowerCase().replace(/^www\./, "");
    if (host === "github.com") service = "github";
    else if (["youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) service = "youtube";
    else if (host === "itch.io" || host.endsWith(".itch.io")) service = "itch";
  } catch { /* Use the generic link icon for invalid or local URLs. */ }
  if (isPlay) service = "play";
  const serviceIcon = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z"/><path class="play-mark" d="m10 8.5 5 3.5-5 3.5v-7Z"/><path d="M8 3v2m8-2v2M8 19v2m8-2v2"/></svg>',
    github: icon.github,
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="youtube-mark" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z"/><path class="youtube-play" d="m9.6 15.5 6.2-3.5-6.2-3.5v7Z"/></svg>',
    itch: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="6"/><text x="12" y="15" text-anchor="middle">itch</text></svg>',
    external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h6v6M19 5l-9 9"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  }[service];
  const target = isInternal || isPlay ? "" : ' target="_blank" rel="noreferrer"';
  const targetId = isInternal ? link.url.split("#project-")[1] : "";
  return `<a class="project-action-button service-${service} ${isPlay ? "is-play" : ""}" href="${esc(link.url)}"${target}${targetId ? ` data-project-target="${esc(targetId)}"` : ""}><span class="action-icon">${serviceIcon}</span><span>${esc(link.label)}</span>${icon.arrow}</a>`;
}

function groupBlock(category, title, subtitle, items, compact = false) {
  return `<section class="work-group ${compact ? "work-group-compact" : ""}" data-category="${category}">
    <div class="group-heading"><span class="group-icon" aria-hidden="true">${category === "programming" ? icon.gamepad : "<span class='sound-bars'><i></i><i></i><i></i><i></i><i></i></span>"}</span><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div></div>
    ${compact ? `<p class="category-overview">${esc(category === "programming" ? copy.projectsProgrammingDetails : copy.projectsAudioDetails)}</p>` : ""}
    <div class="project-grid">${items.map((project) => projectCard(project)).join("")}</div>
  </section>`;
}

function homePage() {
  const programming = projects.filter((item) => item.category === "programming");
  const audio = projects.filter((item) => item.category === "audio");
  const showreelPlayerUrl = showreelEmbed ? `${showreelEmbed}&playsinline=1&controls=1` : "";
  return `<main id="main">
    <section class="hero wrap">
      <div class="hero-copy"><h1>${esc(copy.heroTitleA)}<br /><span class="gradient-text">${esc(copy.heroTitleB)}</span></h1>
        <p class="hero-lede">${esc(copy.heroLead)}</p>
        <ul class="tag-list skill-pills" aria-label="Core skills">${splitCopy("skills").map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="hero-actions"><a class="button button-violet" href="projects.html">${esc(copy.heroButton || "Projects")} ${icon.arrow}</a><a class="button button-violet" href="about.html">${esc(copy.heroAboutButton || "About")} ${icon.arrow}</a></div>
      </div>
      <div class="showreel-wrap"><div class="featured-project-heading"><h2>${esc(copy.showreelTitle)}</h2><p class="eyebrow">${esc(copy.showreelSubtitle)}</p></div><div class="showreel-card">
        ${showreelPlayerUrl ? `<iframe class="showreel-frame" src="${esc(showreelPlayerUrl)}" title="${esc(copy.dialogTitle)}" loading="eager" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>` : ""}
      </div><p class="featured-project-footer">${esc(copy.showreelFooter)}</p><p class="featured-project-description">${esc(copy.showreelNote)}</p></div>
    </section>
    <section class="work-section wrap" id="work">
      <header class="section-intro"><h2>${esc(copy.workTitle)}</h2><p>${esc(copy.workDescription)}</p></header>
      <div class="work-columns">${groupBlock("programming", copy.programmingTitle, copy.programmingDescription, programming)}${groupBlock("audio", copy.audioTitle, copy.audioDescription, audio)}</div>
    </section>
  </main>`;
}

function projectsPage() {
  const programming = projects.filter((item) => item.category === "programming");
  const audio = projects.filter((item) => item.category === "audio");
  return `<main id="main" class="page-main wrap"><header class="page-heading"><h1>${esc(copy.projectsTitleA)}${copy.projectsTitleB ? `<br /><span class="gradient-text">${esc(copy.projectsTitleB)}</span>` : ""}</h1><p>${esc(copy.projectsDescription)}</p></header>
    <div class="filter-row" role="group" aria-label="Filter projects"><button class="filter-button active" data-filter="all" aria-pressed="true">${esc(copy.filterAll)}</button><button class="filter-button" data-filter="programming" aria-pressed="false"><span class="filter-icon" aria-hidden="true">${icon.gamepad}</span>${esc(copy.filterProgramming)}</button><button class="filter-button" data-filter="audio" aria-pressed="false"><span class="filter-icon" aria-hidden="true"><span class="sound-bars"><i></i><i></i><i></i><i></i><i></i></span></span>${esc(copy.filterAudio)}</button></div>
    <div class="projects-page-grid">${groupBlock("programming", copy.programmingTitle, copy.projectsProgrammingDescription, programming, true)}${groupBlock("audio", copy.audioTitle, copy.projectsAudioDescription, audio, true)}</div>
  </main>`;
}

function gamesPage() {
  const games = projects.filter((item) => item.category === "programming" && item.playable === true);
  const requestedGame = new URLSearchParams(location.search).get("game");
  const firstPlayable = games.find((game) => game.id === requestedGame && game.gamePath) || null;
  const width = Number(firstPlayable?.gameWidth) || 1080;
  const height = Number(firstPlayable?.gameHeight) || 1920;
  return `<main id="main" class="games-page wrap">
    <header class="games-heading"><h1 id="games-page-title">${firstPlayable ? esc(firstPlayable.title) : `${esc(copy.gamesTitleA)} <span class="gradient-text">${esc(copy.gamesTitleB)}</span>`}</h1><p id="games-page-description" ${firstPlayable ? "hidden" : ""}>${esc(copy.gamesDescription)}</p></header>
    <section class="game-arcade" id="game-arcade" aria-label="Playable games">
      <aside class="game-drawer" id="game-drawer" aria-label="Game list">
        <div class="game-drawer-heading"><div><h2>${esc(copy.gamesReadyTitle)}</h2></div><button class="game-drawer-close" id="game-drawer-close" type="button" aria-label="Close game list">×</button></div>
        <div class="game-drawer-list">${games.length ? games.map((game) => `<button class="game-choice ${game.id === firstPlayable?.id ? "active" : ""}" type="button" data-game-id="${esc(game.id)}" ${game.gamePath ? `aria-pressed="${game.id === firstPlayable?.id}"` : "disabled title='Playable build not uploaded yet'"}><img src="${esc(projectThumbnail(game))}" alt="" loading="lazy"/><span><strong>${esc(game.title)}</strong><small>${game.gamePath ? esc(copy.gamesPlay) : esc(copy.gameShowcaseLabel)}</small></span>${game.gamePath ? `<span class="game-choice-mark" aria-hidden="true">›</span>` : ""}</button>`).join("") : `<p class="game-list-empty">${esc(copy.gamesEmptyTitle)}</p>`}</div>
        <a class="game-project-link" href="projects.html">${esc(copy.gamesExplore)} ${icon.arrow}</a>
      </aside>
      <button class="game-edge-trigger" id="game-menu-button" type="button" aria-expanded="false" aria-controls="game-drawer" aria-label="Open game list" title="Browse games" ${firstPlayable ? "" : "hidden"}><span class="game-edge-arrow" aria-hidden="true">›</span><span class="game-edge-label" aria-hidden="true">Games</span></button>
      <div class="game-stage" id="game-stage">
        <div class="game-player-area" id="game-player-area">${firstPlayable ? `<iframe class="game-player-frame" id="game-player-frame" src="${esc(firstPlayable.gamePath)}" title="${esc(firstPlayable.title)} playable game" width="${width}" height="${height}" allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write" allowfullscreen></iframe>` : `<div class="game-start-screen"><div class="game-start-heading"><h2>${esc(games.some((game) => game.gamePath) ? copy.gamesReadyTitle : copy.gamesEmptyTitle)}</h2></div><div class="game-start-grid">${games.filter((game) => game.gamePath).map((game) => `<button class="game-launch-choice" type="button" data-game-id="${esc(game.id)}"><img src="${esc(projectThumbnail(game))}" alt="" /><span><strong>${esc(game.title)}</strong><small class="game-launch-action">${esc(copy.gamesPlay)} ↗</small></span></button>`).join("")}</div></div>`}</div>
        <button class="game-fullscreen" id="game-fullscreen" type="button" aria-label="Enter fullscreen" title="Fullscreen" ${firstPlayable ? "" : "disabled"}>⛶</button>
      </div>
    </section>
  </main>`;
}

function aboutPage() {
  return `<main id="main" class="page-main wrap"><header class="page-heading"><h1>${esc(copy.aboutTitleA)}${copy.aboutTitleB ? `<br /><span class="gradient-text">${esc(copy.aboutTitleB)}</span>` : ""}</h1><p class="about-lede">${esc(copy.aboutLead)}</p></header>
    <section class="about-layout"><div class="about-story"><h2>${esc(copy.aboutStoryTitleA)}${copy.aboutStoryTitleB ? `<br />${esc(copy.aboutStoryTitleB)}` : ""}</h2><p>${esc(copy.aboutParagraph1)}</p><p>${esc(copy.aboutParagraph2)}</p>${copy.aboutParagraph3 ? `<p>${esc(copy.aboutParagraph3)}</p>` : ""}${copy.aboutParagraph4 ? `<p>${esc(copy.aboutParagraph4)}</p>` : ""}<div class="about-focus"><h3>${esc(copy.focusEyebrow)}</h3><ul class="tag-list">${splitCopy("focusAreas").map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div><a class="button button-violet" href="projects.html">${esc(copy.aboutButton)} ${icon.arrow}</a>${contactActions("about-contact-actions")}</div></section>
  </main>`;
}

const pageContent = { home: homePage, projects: projectsPage, games: gamesPage, about: aboutPage };
const showreelEmbed = youtubeEmbedUrl(site.showreelUrl);
app.innerHTML = `${header(page)}${(pageContent[page] || homePage)()}${footer()}`;

document.querySelectorAll(".email-copy-button").forEach((copyEmailButton) => copyEmailButton.addEventListener("click", async () => {
  const email = copyEmailButton.dataset.email.trim();
  const status = copyEmailButton.closest(".email-copy-wrap").querySelector(".email-copy-status");
  if (!email) {
    status.textContent = "Add your email in the admin panel first.";
    status.classList.add("is-error");
    copyEmailButton.setAttribute("aria-label", "Add an email address in the admin panel to enable copying");
    window.setTimeout(() => { status.textContent = ""; status.classList.remove("is-error"); }, 3500);
    return;
  }
  let copied = false;
  try {
    await navigator.clipboard.writeText(email);
    copied = true;
  } catch {
    const field = document.createElement("textarea");
    field.value = email;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    try { copied = document.execCommand("copy"); } catch { copied = false; }
    field.remove();
  }
  if (copied) {
    copyEmailButton.classList.add("is-copied");
    copyEmailButton.setAttribute("aria-label", "Email address copied");
    status.textContent = "Email address copied to clipboard.";
    window.setTimeout(() => {
      copyEmailButton.classList.remove("is-copied");
      copyEmailButton.setAttribute("aria-label", "Copy email address");
      status.textContent = "";
    }, 2400);
  } else {
    status.textContent = `Could not copy. Email: ${email}`;
    status.classList.add("is-error");
    window.setTimeout(() => { status.textContent = ""; status.classList.remove("is-error"); }, 5000);
  }
}));

function toggleProject(card) {
  const group = card.closest(".work-group");
  const willExpand = !card.classList.contains("is-expanded");
  group.querySelectorAll(".project-card").forEach((item) => {
    const open = willExpand && item === card;
    const project = projects.find((entry) => entry.id === item.dataset.project);
    item.classList.toggle("is-expanded", open);
    item.querySelector(".project-trigger").setAttribute("aria-expanded", String(open));
    item.querySelector(".expand-mark").textContent = open ? "−" : "+";
    item.querySelector(".project-details").hidden = !open;
    item.querySelector(".project-visual").classList.toggle("has-video", Boolean(youtubeEmbedUrl(project?.videoUrl)));
    item.querySelector(".project-visual").classList.toggle("is-placeholder", open && !youtubeEmbedUrl(project?.videoUrl));
    const visual = item.querySelector(".project-visual");
    const frame = visual.querySelector(".project-video-frame");
    if (frame) {
      if (!open) frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "https://www.youtube-nocookie.com");
    } else visual.innerHTML = project ? projectMedia(project, open) : "";
  });
  if (willExpand) requestAnimationFrame(() => card.scrollIntoView({
    block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  }));
}

document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button, iframe")) return;
    toggleProject(card);
  });
  card.addEventListener("keydown", (event) => {
    if (event.target !== card || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    toggleProject(card);
  });
});

document.querySelectorAll(".project-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => toggleProject(trigger.closest(".project-card")));
});

function openProjectTarget(id, { updateUrl = true, scroll = true } = {}) {
  const card = document.querySelector(`.project-card[data-project="${CSS.escape(id)}"]`);
  if (!card) return false;
  const group = card.closest(".work-group");
  if (group?.hidden) {
    const allFilter = document.querySelector('.filter-button[data-filter="all"]');
    allFilter?.click();
  }
  if (!card.classList.contains("is-expanded")) toggleProject(card);
  if (updateUrl) history.replaceState(null, "", `#project-${encodeURIComponent(id)}`);
  if (scroll) card.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

document.querySelectorAll("[data-project-target]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.dataset.projectTarget;
    if (!targetId) return;
    const targetUrl = new URL(link.href, location.href);
    if (targetUrl.pathname.endsWith("projects.html") && page === "projects") {
      event.preventDefault();
      openProjectTarget(targetId);
    }
  });
});

if (page === "projects") {
  const targetId = decodeURIComponent(location.hash.match(/^#project-(.+)$/)?.[1] || "");
  if (targetId) requestAnimationFrame(() => openProjectTarget(targetId, { updateUrl: false }));
}

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".projects-page-grid .work-group").forEach((group) => {
      group.hidden = button.dataset.filter !== "all" && group.dataset.category !== button.dataset.filter;
      if (group.hidden) group.querySelectorAll(".project-video-frame").forEach((frame) => {
        frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "https://www.youtube-nocookie.com");
      });
    });
    document.querySelector(".projects-page-grid")?.classList.toggle("is-filtered", button.dataset.filter !== "all");
  });
});

const menuToggle = document.querySelector(".menu-toggle");
menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  document.querySelector(".primary-nav").classList.toggle("nav-open", open);
});

const arcade = document.querySelector("#game-arcade");
const gameFrame = document.querySelector("#game-player-frame");
function resizeGameFrame() {
  const frame = document.querySelector("#game-player-frame");
  const area = document.querySelector("#game-player-area");
  if (!frame || !area) return;
  const width = Number(frame.getAttribute("width")) || 1080;
  const height = Number(frame.getAttribute("height")) || 1920;
  const ratio = width / height;
  const stage = document.querySelector("#game-stage");
  const fullscreen = document.fullscreenElement === stage;
  if (fullscreen && stage) {
    stage.style.width = "";
    stage.style.flex = "";
    arcade.style.width = "";
  }
  const pageBounds = document.querySelector(".games-page")?.getBoundingClientRect();
  const mobileDrawer = matchMedia("(max-width: 760px)").matches;
  let availableWidth;
  let availableHeight;
  if (fullscreen) {
    availableWidth = stage.clientWidth;
    availableHeight = stage.clientHeight;
  } else {
    const pageWidth = pageBounds?.width || window.innerWidth;
    availableWidth = pageWidth - 2;
    availableHeight = Math.min(window.innerHeight * 0.72, 800);
  }
  const fittedWidth = Math.max(1, Math.min(availableWidth, availableHeight * ratio));
  const fittedHeight = fittedWidth / ratio;
  if (!fullscreen && stage && arcade) {
    area.style.width = "100%";
    area.style.height = `${Math.floor(fittedHeight)}px`;
    area.style.flex = "none";
    stage.style.flex = "none";
    stage.style.width = `${Math.floor(fittedWidth)}px`;
    stage.style.height = `${Math.floor(fittedHeight)}px`;
    arcade.style.width = "";
  } else if (fullscreen) {
    area.style.width = "100%";
    area.style.height = "auto";
    area.style.flex = "1";
    stage.style.width = "100vw";
    stage.style.height = "100vh";
  }
  frame.style.width = `${Math.floor(fittedWidth)}px`;
  frame.style.height = `${Math.floor(fittedHeight)}px`;
}
function chooseGame(id) {
  const game = projects.find((item) => item.id === id && item.gamePath);
  if (!game) return;
  let frame = document.querySelector("#game-player-frame");
  if (!frame) {
    document.querySelector("#game-player-area").innerHTML = `<iframe class="game-player-frame" id="game-player-frame" title="${esc(game.title)} playable game" allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write" allowfullscreen></iframe>`;
    frame = document.querySelector("#game-player-frame");
  }
  const width = Number(game.gameWidth) || 1080;
  const height = Number(game.gameHeight) || 1920;
  frame.setAttribute("width", String(width));
  frame.setAttribute("height", String(height));
  frame.title = `${game.title} playable game`;
  if (frame.getAttribute("src") !== game.gamePath) frame.src = game.gamePath;
  const nowPlaying = document.querySelector("#game-now-playing");
  if (nowPlaying) nowPlaying.textContent = game.title;
  const pageTitle = document.querySelector("#games-page-title");
  if (pageTitle) pageTitle.textContent = game.title;
  const pageDescription = document.querySelector("#games-page-description");
  if (pageDescription) pageDescription.hidden = true;
  document.querySelectorAll(".game-choice").forEach((button) => {
    const active = button.dataset.gameId === game.id;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#game-fullscreen").disabled = false;
  document.querySelector("#game-menu-button").hidden = false;
  resizeGameFrame();
  toggleGameDrawer(false);
}
const toggleGameDrawer = (open) => {
  if (!arcade || !document.querySelector("#game-player-frame")) return;
  arcade.classList.toggle("drawer-open", open);
  const button = document.querySelector("#game-menu-button");
  button?.setAttribute("aria-expanded", String(open));
  button?.setAttribute("aria-label", open ? "Close game list" : "Open game list");
  window.setTimeout(resizeGameFrame, 280);
};
document.querySelectorAll(".game-choice[data-game-id]").forEach((button) => {
  button.addEventListener("click", () => chooseGame(button.dataset.gameId));
});
document.querySelectorAll(".game-launch-choice[data-game-id]").forEach((button) => {
  button.addEventListener("click", () => chooseGame(button.dataset.gameId));
});
const gameEdgeTrigger = document.querySelector("#game-menu-button");
gameEdgeTrigger?.addEventListener("click", () => toggleGameDrawer(!arcade.classList.contains("drawer-open")));
document.querySelector("#game-drawer-close")?.addEventListener("click", () => toggleGameDrawer(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && arcade?.classList.contains("drawer-open")) toggleGameDrawer(false);
});
document.querySelector("#game-fullscreen")?.addEventListener("click", async () => {
  const stage = document.querySelector("#game-stage");
  if (!stage || !document.querySelector("#game-player-frame")) return;
  try {
    if (document.fullscreenElement === stage) await document.exitFullscreen();
    else await stage.requestFullscreen();
  } catch { /* Fullscreen may be unavailable in some embedded contexts. */ }
});
document.addEventListener("fullscreenchange", () => {
  const stage = document.querySelector("#game-stage");
  const button = document.querySelector("#game-fullscreen");
  if (button) {
    const isFullscreen = document.fullscreenElement === stage;
    button.textContent = "⛶";
    button.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
    button.title = isFullscreen ? "Exit fullscreen" : "Fullscreen";
  }
  window.requestAnimationFrame(resizeGameFrame);
});
window.addEventListener("resize", resizeGameFrame);
if (gameFrame) resizeGameFrame();

