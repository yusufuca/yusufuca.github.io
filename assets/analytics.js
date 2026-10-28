(() => {
  "use strict";

  // Keep local previews, admin tools and embedded game builds out of reports.
  if (location.hostname !== "yusufuca.github.io" || !["home", "projects", "games", "about"].includes(document.body?.dataset.page)) return;

  const measurementId = "G-2D209YMVV9";
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);

  function trackControl(control) {
    if (control.matches(":disabled, [aria-disabled='true']")) return;
    const card = control.closest(".project-card");
    const params = {
      page_name: document.body.dataset.page,
      ui_location: control.closest(".site-footer") ? "footer"
        : control.closest(".site-header") ? "header"
        : control.closest(".cv-preview") ? "cv_preview"
        : control.closest(".game-drawer") ? "game_drawer"
        : control.closest(".featured-work") ? "featured_work"
        : control.closest(".hero") ? "hero" : "main",
    };
    let action = "button_click";
    let label = (control.getAttribute("aria-label") || control.textContent || control.id || "button").trim().replace(/\s+/g, " ").slice(0, 100);
    if (card) params.project_id = card.dataset.project;

    if (control.matches(".project-card, .project-trigger")) {
      action = card.classList.contains("is-expanded") ? "project_collapse" : "project_expand";
      label = card.dataset.project;
    } else if (control.matches(".filter-button")) {
      action = "project_filter";
      label = control.dataset.filter;
    } else if (control.matches("[data-game-id]")) {
      action = "game_select";
      label = control.dataset.gameId;
      params.project_id = label;
    } else if (control.matches(".email-copy-button")) {
      action = "contact_copy";
      label = "Contact Me";
    } else if (control.matches(".cv-preview-zoom")) {
      action = control.getAttribute("aria-pressed") === "true" ? "cv_fit" : "cv_enlarge";
    } else if (control.id === "game-fullscreen") {
      action = document.fullscreenElement ? "fullscreen_exit" : "fullscreen_enter";
    } else if (control.matches("#game-menu-button, #game-drawer-close")) {
      action = control.id === "game-drawer-close" || control.getAttribute("aria-expanded") === "true" ? "game_menu_close" : "game_menu_open";
    } else if (control.matches(".menu-toggle")) {
      action = control.getAttribute("aria-expanded") === "true" ? "navigation_close" : "navigation_open";
    }

    if (control.matches("a[href]")) {
      const url = new URL(control.href, location.href);
      // Send destination categories, never mail addresses, query strings or PDF link labels.
      if (control.matches(".cv-preview-link")) {
        action = "cv_link";
        label = url.protocol === "mailto:" ? "email" : url.hostname;
      } else if (/\.pdf$/i.test(url.pathname)) {
        action = control.hasAttribute("download") ? "cv_download" : "cv_open";
      } else if (control.matches(".footer-social-link")) {
        action = "social_link";
      } else if (control.matches(".project-action-button, .inline-project-link")) {
        action = "project_link";
      } else {
        action = url.origin === location.origin ? "navigation" : "external_link";
      }
      if (["http:", "https:"].includes(url.protocol)) {
        params.destination_host = url.hostname;
        params.destination_path = url.pathname.slice(0, 100);
      }
      if (url.pathname.endsWith("games.html") && url.searchParams.has("game")) {
        params.project_id = url.searchParams.get("game").slice(0, 100);
      }
    }

    window.gtag("event", "ui_click", { ...params, ui_action: action, button_name: label });
  }

  // Delegation also covers controls created later when a game is selected.
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest("a[href], button, [role='button']");
    if (control) trackControl(control);
    else {
      const card = event.target.closest(".project-card");
      if (card) trackControl(card);
    }
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.repeat || !["Enter", " "].includes(event.key) || !(event.target instanceof Element)) return;
    // Native buttons and links generate click themselves; only article keyboard handling needs this.
    if (event.target.matches(".project-card")) trackControl(event.target);
  }, true);
})();
