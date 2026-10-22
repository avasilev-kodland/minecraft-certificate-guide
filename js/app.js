const app = document.querySelector("#app");
const langButton = document.querySelector("#lang-btn");
const langMenu = document.querySelector("#lang-menu");
const langCurrent = document.querySelector("#lang-current");

let currentLang = resolveLang();

const LATIN_RUN = /[A-Za-z][A-Za-z0-9]*([ \u00A0./-][A-Za-z0-9][A-Za-z0-9]*)*/g;

function appendText(node, text) {
  const value = text == null ? "" : String(text);
  if (document.documentElement.lang !== "ar" || !/[A-Za-z]/.test(value)) {
    node.append(document.createTextNode(value));
    return;
  }
  const pattern = new RegExp(LATIN_RUN.source, "g");
  let last = 0;
  let match = pattern.exec(value);
  while (match) {
    if (match.index > last) node.append(document.createTextNode(value.slice(last, match.index)));
    const embedded = document.createElement("bdi");
    embedded.dir = "ltr";
    embedded.textContent = match[0];
    node.append(embedded);
    last = match.index + match[0].length;
    match = pattern.exec(value);
  }
  if (last < value.length) node.append(document.createTextNode(value.slice(last)));
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  let text = null;
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value == null || value === false) return;
    if (key === "class") node.className = value;
    else if (key === "text") text = value;
    else node.setAttribute(key, value === true ? "" : value);
  });
  if (text != null) appendText(node, text);
  (children || []).forEach((child) => {
    if (child) node.append(child);
  });
  return node;
}

function externalLink(href, className, text) {
  return el("a", {
    class: className,
    href,
    text,
    target: "_blank",
    rel: "noopener noreferrer",
  });
}

function renderStep(step) {
  const body = [el("h3", { text: step.title }), el("p", { text: step.text })];

  if (step.links && step.links.length) {
    body.push(el("ul", { class: "links" }, step.links.map((link) => (
      el("li", null, [externalLink(link.href, "text-link", link.label)])
    ))));
  }

  if (step.image) {
    body.push(el("figure", null, [
      el("img", { src: step.image, alt: step.alt || "" }),
      step.caption ? el("figcaption", { text: step.caption }) : null,
    ]));
  }

  if (step.video) {
    const video = el("video", { controls: true, playsinline: true, preload: "metadata" });
    video.append(el("source", { src: step.video, type: "video/mp4" }));
    body.push(el("figure", null, [
      video,
      step.caption ? el("figcaption", { text: step.caption }) : null,
    ]));
  }

  return el("li", { class: "step" }, body);
}

function render(lang) {
  const copy = I18N[lang];
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = copy.metaTitle;

  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", copy.metaDescription);

  langCurrent.textContent = LANG_NAMES[lang];
  langButton.setAttribute("aria-label", copy.langLabel);
  langMenu.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-selected", button.dataset.lang === lang ? "true" : "false");
  });

  const page = el("article", { class: "doc", id: "top" }, [
    el("p", { class: "kicker", text: copy.eyebrow }),
    el("h1", { text: `${copy.title}: ${copy.titleMark}` }),
    el("section", null, [
      el("h2", { text: copy.whenLabel }),
      el("p", { text: copy.when }),
      copy.platforms ? el("p", { class: "platforms", dir: "ltr", text: copy.platforms }) : null,
      copy.platformsNote ? el("p", { text: copy.platformsNote }) : null,
    ]),
    el("section", null, [
      el("h2", { text: copy.linksLabel }),
      el("ul", { class: "links" }, [
        el("li", null, [externalLink(LINK_89, "text-link", `${copy.course89} · ${copy.age89}`)]),
        el("li", null, [externalLink(LINK_1012, "text-link", `${copy.course1012} · ${copy.age1012}`)]),
        el("li", null, [externalLink(SIGN_IN, "text-link", copy.signIn)]),
      ]),
    ]),
    el("section", { id: "steps" }, [
      el("h2", { text: copy.stepsLabel }),
      el("p", { class: "section-lead", text: copy.stepsLead }),
      el("ol", { class: "steps" }, copy.steps.map(renderStep)),
    ]),
    el("section", { id: "certificate" }, [
      el("h2", { text: copy.certLabel }),
      el("ul", { class: "notes" }, copy.certPoints.map((point) => (
        el("li", null, [
          el("strong", { text: point.lead }),
          el("span", { text: ` ${point.text}` }),
        ])
      ))),
      el("h3", { text: copy.examplesLabel }),
      el("ul", { class: "links" }, [
        el("li", null, [externalLink("assets/certificate-1.pdf", "text-link", `${copy.example1} (${copy.pdf})`)]),
        el("li", null, [externalLink("assets/certificate-2.pdf", "text-link", `${copy.example2} (${copy.pdf})`)]),
      ]),
    ]),
    el("section", { id: "notes" }, [
      el("h2", { text: copy.notesLabel }),
      el("ul", { class: "notes" }, copy.notes.map((note) => (
        el("li", null, [
          el("strong", { text: note.lead }),
          el("span", { text: ` ${note.text}` }),
        ])
      ))),
    ]),
  ]);

  app.replaceChildren(
    page,
    el("footer", { class: "footer", text: copy.footer })
  );
}

function buildMenu() {
  langMenu.replaceChildren(...LANG_ORDER.map((code) => {
    const item = el("li", { role: "none" }, [
      el("button", {
        type: "button",
        role: "option",
        lang: code,
        dir: code === "ar" ? "rtl" : "ltr",
        text: LANG_NAMES[code],
        "data-lang": code,
        "aria-selected": "false",
      }),
    ]);
    return item;
  }));
}

function setMenuOpen(open) {
  langButton.setAttribute("aria-expanded", open ? "true" : "false");
  langMenu.hidden = !open;
  if (open) {
    const selected = langMenu.querySelector('[aria-selected="true"]') || langMenu.querySelector("button");
    selected.focus();
  }
}

function choose(lang) {
  if (!isLang(lang) || lang === currentLang) {
    setMenuOpen(false);
    langButton.focus();
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    /* private mode */
  }
  const url = new URL(location.href);
  url.searchParams.set("lang", lang);
  history.replaceState(null, "", url);
  render(lang);
  setMenuOpen(false);
  langButton.focus();
}

buildMenu();
render(currentLang);

langButton.addEventListener("click", () => {
  setMenuOpen(langMenu.hidden);
});

langMenu.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) choose(button.dataset.lang);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".lang")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !langMenu.hidden) {
    setMenuOpen(false);
    langButton.focus();
    return;
  }
  if (langMenu.hidden) return;
  const buttons = [...langMenu.querySelectorAll("button")];
  const index = buttons.indexOf(document.activeElement);
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const next = index < 0 ? 0 : (index + delta + buttons.length) % buttons.length;
    buttons[next].focus();
  }
});
