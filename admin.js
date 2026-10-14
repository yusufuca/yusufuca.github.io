const $ = (selector) => document.querySelector(selector);
const projectForm = $("#project-form");
const siteForm = $("#site-form");
const copyForm = $("#copy-form");
document.querySelectorAll("[data-admin-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-admin-tab]").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
      document.getElementById(item.getAttribute("aria-controls")).hidden = !active;
    });
  });
});
let projects = [];
let site = {};
let selectedId = null;
let selectedTextLinks = [];

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}

function renderProjectList() {
  const filter = $("#project-filter").value;
  const visible = projects.filter((project) => filter === "all" || project.category === filter);
  $("#project-list").innerHTML = visible.map((project) => `
    <button class="project-option ${project.id === selectedId ? "active" : ""}" data-id="${escapeHtml(project.id)}" type="button">
      <strong>${escapeHtml(project.title || "Untitled project")}</strong>
      <span>${project.category === "audio" ? "Game audio" : "Game programming"}</span>
    </button>`).join("") || `<p class="empty-state"><span>No projects in this category yet.</span></p>`;
  $("#project-list").querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => selectProject(button.dataset.id));
  });
}

function selectProject(id) {
  selectedId = id;
  const project = projects.find((item) => item.id === id);
  if (!project) return;
  for (const [key, value] of Object.entries(project)) {
    const input = projectForm.elements.namedItem(key);
    if (!input) continue;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = key === "tags" ? (value || []).join(", ")
      : key === "links" ? (value || []).map((link) => `${link.label} | ${link.url}`).join("\n")
        : value || "";
  }
  projectForm.elements.namedItem("subtitle").value = project.subtitle || "";
  projectForm.elements.namedItem("date").value = project.date || "";
  projectForm.elements.namedItem("videoUrl").value = project.videoUrl || "";
  projectForm.elements.namedItem("gameWidth").value = project.gameWidth || 1080;
  projectForm.elements.namedItem("gameHeight").value = project.gameHeight || 1920;
  projectForm.elements.namedItem("playable").checked = project.playable === true;
  selectedTextLinks = structuredClone(project.textLinks || []);
  renderTextLinkEditor();
  $("#editor-title").textContent = project.title || "New project";
  $("#empty-state").hidden = true;
  projectForm.hidden = false;
  $("#delete-project").hidden = false;
  $("#project-status").textContent = "";
  renderProjectList();
}

function renderTextLinkEditor() {
  const target = $("#text-link-target");
  target.innerHTML = `<option value="">Choose destination project</option>${projects.filter((item) => item.id !== selectedId).map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title || item.id)}</option>`).join("")}`;
  $("#text-link-list").innerHTML = selectedTextLinks.length
    ? selectedTextLinks.map((link, index) => {
      const destination = projects.find((item) => item.id === link.targetProjectId)?.title || link.targetProjectId;
      return `<div class="text-link-item"><span><strong>“${escapeHtml(link.text)}”</strong><small>→ ${escapeHtml(destination)}</small></span><button type="button" data-remove-text-link="${index}" aria-label="Remove link for ${escapeHtml(link.text)}">Remove</button></div>`;
    }).join("")
    : `<span class="text-link-empty">No linked phrases yet.</span>`;
  $("#text-link-list").querySelectorAll("[data-remove-text-link]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTextLinks.splice(Number(button.dataset.removeTextLink), 1);
      renderTextLinkEditor();
    });
  });
}

$("#add-text-link").addEventListener("mousedown", (event) => event.preventDefault());
$("#add-text-link").addEventListener("click", () => {
  const description = projectForm.elements.namedItem("description");
  const phrase = description.value.slice(description.selectionStart, description.selectionEnd).trim();
  const targetProjectId = $("#text-link-target").value;
  if (!phrase) {
    $("#project-status").textContent = "Select a phrase in the description first.";
    description.focus();
    return;
  }
  if (!targetProjectId) {
    $("#project-status").textContent = "Choose the project this phrase should open.";
    return;
  }
  selectedTextLinks = selectedTextLinks.filter((link) => link.text !== phrase);
  selectedTextLinks.push({ text: phrase, targetProjectId });
  $("#project-status").textContent = "Phrase linked. Save the project to publish the change.";
  renderTextLinkEditor();
});

function readProjectForm() {
  const values = Object.fromEntries(new FormData(projectForm).entries());
  const links = values.links.split("\n").map((line) => {
    const [label, ...urlParts] = line.split("|");
    return { label: label.trim(), url: urlParts.join("|").trim() };
  }).filter((link) => link.label && link.url);
  return {
    id: values.id.trim(),
    title: values.title.trim(),
    category: values.category,
    subtitle: values.subtitle.trim(),
    date: values.date,
    image: values.image.trim(),
    alt: values.alt.trim(),
    tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    description: values.description.trim(),
    textLinks: selectedTextLinks.filter((link) => values.description.includes(link.text)),
    videoUrl: values.videoUrl.trim(),
    itchUrl: values.itchUrl.trim(),
    gameWidth: Number(values.gameWidth) || 1080,
    gameHeight: Number(values.gameHeight) || 1920,
    playable: projectForm.elements.namedItem("playable").checked,
    gamePath: projects.find((item) => item.id === selectedId)?.gamePath || "",
    links,
  };
}

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const project = readProjectForm();
  if (!/^[a-z0-9-]+$/.test(project.id)) {
    $("#project-status").textContent = "Use lowercase letters, numbers and hyphens for the ID.";
    return;
  }
  if (projects.some((item) => item.id === project.id && item.id !== selectedId)) {
    $("#project-status").textContent = "That project ID is already in use.";
    return;
  }
  const existingIndex = projects.findIndex((item) => item.id === selectedId);
  if (existingIndex >= 0) projects[existingIndex] = project;
  else projects.unshift(project);
  selectedId = project.id;
  try {
    await api("/api/projects", { method: "PUT", body: JSON.stringify(projects) });
    $("#project-status").textContent = "Project saved to data/projects.json";
    $("#editor-title").textContent = project.title;
    renderProjectList();
  } catch (error) {
    $("#project-status").textContent = error.message;
  }
});

$("#add-project").addEventListener("click", () => {
  const id = `new-project-${Date.now().toString().slice(-5)}`;
  projects.unshift({ id, title: "New project", category: "programming", subtitle: "", date: "", image: "", alt: "", tags: [], description: "", textLinks: [], videoUrl: "", itchUrl: "", gameWidth: 1080, gameHeight: 1920, playable: false, links: [] });
  selectProject(id);
  projectForm.elements.namedItem("title").focus();
});

$("#delete-project").addEventListener("click", async () => {
  const project = projects.find((item) => item.id === selectedId);
  if (!project || !window.confirm(`Delete “${project.title}”?`)) return;
  projects = projects.filter((item) => item.id !== selectedId);
  try {
    await api("/api/projects", { method: "PUT", body: JSON.stringify(projects) });
    selectedId = null;
    projectForm.hidden = true;
    $("#delete-project").hidden = true;
    $("#empty-state").hidden = false;
    $("#editor-title").textContent = "Select a project";
    renderProjectList();
  } catch (error) {
    $("#project-status").textContent = error.message;
  }
});

$("#project-filter").addEventListener("change", renderProjectList);

$("#upload-game").addEventListener("click", async () => {
  const file = $("#game-zip").files[0];
  const id = projectForm.elements.namedItem("id").value.trim();
  if (!file) {
    $("#upload-status").textContent = "Choose a WebGL ZIP first.";
    return;
  }
  if (!projects.some((project) => project.id === id)) {
    $("#upload-status").textContent = "Save this project before uploading its game.";
    return;
  }
  if (!projectForm.reportValidity()) return;
  const button = $("#upload-game");
  button.disabled = true;
  $("#upload-status").textContent = `Uploading ${file.name}…`;
  try {
    const currentIndex = projects.findIndex((project) => project.id === id);
    const editedProject = readProjectForm();
    editedProject.gamePath = projects[currentIndex].gamePath || "";
    projects[currentIndex] = editedProject;
    await api("/api/projects", { method: "PUT", body: JSON.stringify(projects) });
    const result = await api(`/api/upload-game?slug=${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/zip" },
      body: file,
    });
    projects = await api("/api/projects");
    selectProject(id);
    $("#upload-status").textContent = `Game is ready at ${result.gamePath}`;
    $("#project-status").textContent = "Project saved with its WebGL game.";
  } catch (error) {
    $("#upload-status").textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

siteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(siteForm).entries());
  site = {
    ...site,
    name: values.name.trim(),
    role: values.role.trim(),
    email: values.email.trim(),
    showreelUrl: values.showreelUrl.trim(),
    cvUrl: values.cvUrl.trim(),
    socials: {
      ...site.socials,
      github: values.github.trim(),
      linkedin: values.linkedin.trim(),
      itch: values.itch.trim(),
      youtube: values.youtube.trim(),
    },
  };
  try {
    await api("/api/site", { method: "PUT", body: JSON.stringify(site) });
    $("#site-status").textContent = "Settings saved to data/site.json";
  } catch (error) {
    $("#site-status").textContent = error.message;
  }
});

copyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(copyForm).entries());
  site = { ...site, copy: { ...site.copy, ...values } };
  try {
    await api("/api/site", { method: "PUT", body: JSON.stringify(site) });
    $("#copy-status").textContent = "Website text saved to data/site.json";
  } catch (error) {
    $("#copy-status").textContent = error.message;
  }
});

async function initialize() {
  try {
    [projects, site] = await Promise.all([api("/api/projects"), api("/api/site")]);
    renderProjectList();
    for (const [key, value] of Object.entries({
      name: site.name, role: site.role, email: site.email,
      showreelUrl: site.showreelUrl, cvUrl: site.cvUrl, github: site.socials?.github,
      linkedin: site.socials?.linkedin, itch: site.socials?.itch, youtube: site.socials?.youtube,
    })) siteForm.elements.namedItem(key).value = value || "";
    for (const [key, value] of Object.entries(site.copy || {})) {
      const field = copyForm.elements.namedItem(key);
      if (field) field.value = value || "";
    }
  } catch (error) {
    $("#project-list").innerHTML = `<p class="error-message">${escapeHtml(error.message)}. Start the editor with <code>start-admin.bat</code>.</p>`;
  }
}

initialize();
