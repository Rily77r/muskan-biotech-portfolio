"use strict";

const data = window.portfolio;
const select = selector => document.querySelector(selector);

function link(label, href) {
  const anchor = document.createElement("a");
  anchor.textContent = label;
  anchor.href = href;
  return anchor;
}

function publicUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function documentUrl(value) {
  if (/^assets\/[\w /.-]+\.pdf$/i.test(value) && !value.split("/").includes("..")) {
    return value;
  }
  return publicUrl(value);
}

const details = [data.education.institution, data.education.dates].filter(Boolean).join(" · ");
select("#education-details").textContent = details || "Institution and dates pending confirmation.";

if (data.skills.length) {
  select("#skills-note").hidden = true;
  select("#skills-list").replaceChildren(...data.skills.map(skill => {
    const item = document.createElement("li");
    item.textContent = skill;
    return item;
  }));
}

const resources = {
  resume: ["View résumé", documentUrl(data.resume)],
  coverLetter: ["View cover letter", documentUrl(data.coverLetter)]
};

for (const [key, [label, href]] of Object.entries(resources)) {
  if (href) {
    const slot = select('[data-resource="' + key + '"]');
    slot.replaceChildren(link(label, href));
    slot.hidden = false;
  }
}

const menu = select(".menu");
const nav = select("#nav");
const compact = matchMedia("(max-width: 960px)");

function updateMenu(open = false) {
  menu.hidden = !compact.matches;
  menu.setAttribute("aria-expanded", String(open));
  nav.hidden = compact.matches && !open;
}

updateMenu();
compact.addEventListener("change", () => updateMenu());
menu.addEventListener("click", () => updateMenu(nav.hidden));
nav.addEventListener("click", event => {
  const anchor = event.target.closest("a");
  if (!anchor || !compact.matches) return;
  updateMenu();
  const destination = select(anchor.hash);
  destination.tabIndex = -1;
  destination.focus({ preventScroll: true });
});
select(".topbar").addEventListener("keydown", event => {
  if (event.key === "Escape" && compact.matches && !nav.hidden) {
    updateMenu();
    menu.focus();
  }
});

const dialog = select("#alfred");
const input = select("#question");
const log = select(".chat-log");
const close = select(".close");

for (const trigger of document.querySelectorAll(".js-chat")) {
  trigger.hidden = false;
  trigger.addEventListener("click", () => {
    dialog.showModal();
    close.focus();
  });
}

close.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

function resourceReply(key, ready, pending, section, sectionLabel) {
  const [label, href] = resources[key];
  return href ? [ready, href, label] : [pending, section, sectionLabel];
}

const replies = [
  [/\bcover\s*letter\b/, () => resourceReply("coverLetter", "Certainly. The cover letter is available here.", "Certainly. You may read Ms Choudhary’s cover letter on the portfolio.", "#cover-letter", "Read cover letter")],
  [/\br[eé]sum[eé](?![a-zé])|\bcv\b/, () => resourceReply("resume", "Certainly. Here is Ms Choudhary’s résumé.", "Certainly. You may read Ms Choudhary’s résumé on the portfolio.", "#resume", "Read résumé")],
  [/class\s*(xii|12)|12th|cbse|gurukripa|subjects|secondary|school/, () => [
    "Ms Choudhary attended Gurukripa Public School in Nawalgarh, Jhunjhunu, Rajasthan, for CBSE Class XII (2025). Her subjects were Physics, Chemistry, Biology, English and Physical Education.",
    "#class-xii", "View Class XII education"
  ]],
  [/coursework|curriculum|syllabus/, () => [
    "Certainly. The coursework section has an overview of JECRC’s programme and a link to the university’s syllabus.",
    "#coursework", "View coursework"
  ]],
  [/lab(?:oratory)? (?:work|research)|research projects?/, () => [
    "Allow me to show you the laboratory research section. Project write-ups will be added when available.",
    "#laboratory-research", "View laboratory research"
  ]],
  [/education|degree|study|studies|academic|university|college|jecrc/, () => [
    "Certainly. Ms Choudhary is currently pursuing a B.Sc. (Hons.) in Biotechnology" +
    (data.education.institution ? " at " + data.education.institution : "") +
    (data.education.dates ? " (" + data.education.dates + ")" : "") + ".",
    "#education", "View education"
  ]],
  [/projects?|work/, () => [
    "Certainly. The Projects section features this portfolio and links to Muskan’s laboratory research section.",
    "#projects", "View projects"
  ]],
  [/skills?|lab|techniques|research/, () => [
    data.skills.length ? "Her listed skills include " + data.skills.join(", ") + "." :
      "Ms Choudhary is developing her laboratory and technical skills through her undergraduate studies. Specific techniques will be added as her experience develops.",
    "#skills", "View skills"
  ]],
  [/interests?|genetics|molecular|microbiology|bioinformatics|recombinant/, () => [
    "Allow me to show you the areas Ms Choudhary is exploring, including molecular biology, genetics, microbiology and bioinformatics.",
    "#interests", "View interests"
  ]],
  [/about|muskan|choudhary|biotech/, () => [
    "Ms Choudhary studies biotechnology, with a portfolio centred on how living systems work and what that knowledge can help us do.",
    "#about", "Meet Muskan"
  ]],
  [/\b(dna|helix|animation)\b/, () => ["The rotating DNA model is on the home page. You may pause it using the control in its upper corner.", "#home", "View DNA model"]],
  [/\b(hi|hello|hey)\b/, () => ["Good day. Alfred at your service. May I show you the education, projects or documents section?"]],
  [/\b(thanks|thank you)\b/, () => ["My pleasure. Do let me know if I can direct you anywhere else."]]
];

function appendMessage(text, visitor, href, label) {
  const message = document.createElement("div");
  message.className = visitor ? "message visitor" : "message";
  const speaker = document.createElement("span");
  speaker.className = "sr-only";
  speaker.textContent = visitor ? "You: " : "Alfred: ";
  message.append(speaker, document.createTextNode(text));
  if (href) {
    const anchor = link(label, href);
    if (href.startsWith("#")) {
      anchor.addEventListener("click", () => {
        dialog.close();
        const destination = select(href);
        destination.tabIndex = -1;
        destination.focus({ preventScroll: true });
      });
    }
    message.append(anchor);
  }
  log.append(message);
  log.scrollTop = log.scrollHeight;
}

function ask(question) {
  const clean = question.trim();
  if (!clean) return;
  appendMessage(clean, true);
  const match = replies.find(([pattern]) => pattern.test(clean.toLowerCase()));
  const [text, href, label] = match ? match[1]() : [
    "I’m afraid that falls outside my remit. I can help with Ms Choudhary’s education, skills, projects and documents."
  ];
  appendMessage(text, false, href, label);
}

select(".chat-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!input.value.trim()) return;
  ask(input.value);
  input.value = "";
});

for (const prompt of document.querySelectorAll(".prompts button")) {
  prompt.addEventListener("click", () => ask(prompt.textContent));
}

const canvas = select("#helix");
const ctx = canvas.getContext("2d");
if (ctx) initHelix();

function initHelix() {
  const motion = select(".motion");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const particles = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random()]);
  const specimen = canvas.closest(".specimen");
  let pointer = 0;
  let tilt = -.48;
  let phase = .8;
  let frame = 0;
  let previous = 0;
  let width = 0;
  let height = 0;
  let paused = preference.matches;
  let visible = false;

  function point(index, strand) {
    const angle = index * .29 + phase + strand * Math.PI;
    const radius = height * .165;
    const x = Math.cos(angle) * radius;
    const y = (index / 45 - .5) * height * .77;
    return {
      x: width * .5 + x * Math.cos(tilt) - y * Math.sin(tilt),
      y: height * .5 + x * Math.sin(tilt) + y * Math.cos(tilt),
      depth: Math.sin(angle)
    };
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    for (const [x, y, size] of particles) {
      ctx.fillStyle = "rgba(146,184,255," + (.16 + size * .48) + ")";
      ctx.beginPath();
      ctx.arc(x * width, ((y + .018 * Math.sin(phase + x * 12) + 1) % 1) * height, .45 + size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-.46);
    ctx.strokeStyle = "#8cafff2e";
    ctx.lineWidth = 1;
    for (const radius of [.29, .39, .47]) {
      ctx.beginPath();
      ctx.ellipse(0, 0, height * radius, height * radius * .63, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    const strands = [0, 1].map(strand => Array.from({ length: 46 }, (_, i) => point(i, strand)));
    const colours = ["#76ecff", "#bd91ff"];
    for (let i = 0; i < 46; i += 2) {
      const [a, b] = strands.map(strand => strand[i]);
      const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, "#47dafa55");
      gradient.addColorStop(1, "#bd91ff7b");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    const beads = strands.flatMap((points, strand) => {
      const colour = colours[strand];
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.globalAlpha = .43 + (b.depth + 1) * .24;
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2.3;
        ctx.stroke();
      }
      return points.map(p => ({ ...p, colour }));
    });

    for (const bead of beads.sort((a, b) => a.depth - b.depth)) {
      const radius = 2 + (bead.depth + 1) * 1.45;
      ctx.globalAlpha = .55 + (bead.depth + 1) * .22;
      ctx.fillStyle = bead.colour;
      ctx.shadowColor = bead.colour;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(bead.x, bead.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ecf7ff";
      ctx.beginPath();
      ctx.arc(bead.x - radius * .19, bead.y - radius * .2, radius * .35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function tick(time) {
    phase += previous ? Math.min(time - previous, 40) * .00125 : 0;
    const desiredTilt = -.48 + pointer * .16;
    tilt += (desiredTilt - tilt) * .075;
    previous = time;
    render();
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    motion.textContent = paused ? "Play animation" : "Pause animation";
    motion.setAttribute("aria-pressed", String(paused));
    if (!paused && visible && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    }
  }

  new ResizeObserver(() => {
    const scale = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (width && height) render();
  }).observe(canvas);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(canvas);

  preference.addEventListener("change", () => {
    paused = preference.matches;
    sync();
  });
  motion.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  specimen.addEventListener("pointermove", event => {
    if (paused || preference.matches || event.pointerType === "touch") return;
    const bounds = specimen.getBoundingClientRect();
    pointer = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
  });
  specimen.addEventListener("pointerleave", () => { pointer = 0; });
  motion.hidden = false;
  sync();
}

const topicNav = select(".topic-nav");
const topicLinks = [...topicNav.querySelectorAll("a")];
const topicPanels = topicLinks.map(anchor => select(anchor.hash));
const topicControls = select(".topic-controls");
const previousTopic = topicControls.querySelector('[data-step="-1"]');
const nextTopic = topicControls.querySelector('[data-step="1"]');
let activeTopic = 0;

function showTopic(index) {
  activeTopic = index;
  topicPanels.forEach((panel, position) => {
    panel.hidden = position !== index;
    if (position === index) topicLinks[position].setAttribute("aria-current", "true");
    else topicLinks[position].removeAttribute("aria-current");
  });
  previousTopic.disabled = index === 0;
  nextTopic.disabled = index === topicPanels.length - 1;
}

function topicFromHash() {
  const index = topicLinks.findIndex(anchor => anchor.hash === location.hash);
  if (index >= 0) showTopic(index);
}

function openTopic(index, focusHeading) {
  showTopic(index);
  history.pushState(null, "", topicLinks[index].hash);
  if (focusHeading) {
    const heading = topicPanels[index].querySelector("h3");
    heading.focus({ preventScroll: true });
    topicPanels[index].scrollIntoView({ block: "start" });
  }
}

topicLinks.forEach((anchor, index) => {
  anchor.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openTopic(index, compact.matches);
  });
});
previousTopic.addEventListener("click", () => openTopic(activeTopic - 1, true));
nextTopic.addEventListener("click", () => openTopic(activeTopic + 1, true));
topicControls.querySelector("a").addEventListener("click", () => {
  topicLinks[activeTopic].focus({ preventScroll: true });
});
window.addEventListener("hashchange", topicFromHash);
showTopic(0);
topicFromHash();
topicControls.hidden = false;

const sectionEntrances = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("section-entered");
    observer.unobserve(entry.target);
  }
}, { threshold: 0.12 });

for (const section of document.querySelectorAll("main > .section")) {
  sectionEntrances.observe(section);
}
