/* Resume Studio — a free, no-login resume builder. Everything runs in the browser. */
'use strict';

/* ==========================================================================
   DEV_CONFIG — edit these to change the "About the developer" links.
   ========================================================================== */
const DEV_CONFIG = {
  name: 'Tanay Biswas',
  role: 'I fix bugs by creating new ones.',
  photo: 'assets/Mascot.png',
  github: 'https://github.com/Tanay8n',
  email: 'tanay8@gmail.com',
  linkedin: 'https://www.linkedin.com/in/tanay-biswas-8n?utm_source=share_via&utm_content=profile&utm_medium=member_android',
  portfolio: 'https://tanaybiswas.me',
  upiId: 'tny@slc',
};

const STORAGE_KEY = 'resume-studio:v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Templates ---------- */
const TEMPLATES = [
  { id: 'modern', name: 'Modern', tags: 'Clean · Photo', layout: 'single', font: 'Inter', hfont: 'Inter', accent: '#2563eb', photo: true },
  { id: 'classic', name: 'Classic', tags: 'Serif · Timeless', layout: 'single', font: 'Source Serif 4', hfont: 'Source Serif 4', accent: '#1f2937', photo: false },
  { id: 'minimal', name: 'Minimal', tags: 'Whitespace', layout: 'single', font: 'Lato', hfont: 'Lato', accent: '#111827', photo: false },
  { id: 'sidebar', name: 'Sidebar', tags: 'Dark sidebar', layout: 'side-left', side: 66, font: 'Poppins', hfont: 'Poppins', accent: '#1e3a5f', photo: true },
  { id: 'twocol', name: 'Two Column', tags: 'Balanced', layout: 'two-col', font: 'Open Sans', hfont: 'Open Sans', accent: '#0f766e', photo: true },
  { id: 'executive', name: 'Executive', tags: 'Header band', layout: 'single', font: 'Lora', hfont: 'Playfair Display', accent: '#1f3a5f', photo: true },
  { id: 'creative', name: 'Creative', tags: 'Bold · Colour', layout: 'side-right', side: 68, font: 'Poppins', hfont: 'Poppins', accent: '#e11d48', photo: true },
  { id: 'ats', name: 'ATS Plain', tags: 'Parser-safe', layout: 'single', font: 'Arial', hfont: 'Arial', accent: '#000000', photo: false },
  { id: 'timeline', name: 'Timeline', tags: 'Story', layout: 'single', font: 'Inter', hfont: 'Inter', accent: '#7c3aed', photo: false },
  { id: 'compact', name: 'Compact Tech', tags: 'Dense · Dev', layout: 'two-col', font: 'Inter', hfont: 'JetBrains Mono', accent: '#059669', photo: false },
  { id: 'elegant', name: 'Elegant', tags: 'Centered serif', layout: 'single', font: 'Lora', hfont: 'Playfair Display', accent: '#9a7b4f', photo: false },
  { id: 'bold', name: 'Bold', tags: 'Tinted sidebar', layout: 'side-left', side: 64, font: 'Poppins', hfont: 'Poppins', accent: '#0369a1', photo: true },
];
const TPL = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

const FONTS = [
  ['', 'Template default'], ['Inter', 'Inter'], ['Poppins', 'Poppins'], ['Lato', 'Lato'], ['Open Sans', 'Open Sans'],
  ['Arial', 'Arial / Helvetica'], ['Source Serif 4', 'Source Serif'], ['Lora', 'Lora'], ['Merriweather', 'Merriweather'],
  ['Playfair Display', 'Playfair Display'], ['Georgia', 'Georgia'],
];
const FONT_STACK = (f) => {
  const serif = ['Source Serif 4', 'Lora', 'Merriweather', 'Playfair Display', 'Georgia'].includes(f);
  const mono = f === 'JetBrains Mono';
  const tail = mono ? 'ui-monospace, Menlo, Consolas, monospace' : serif ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  return `"${f}", ${tail}`;
};
const ACCENTS = ['#2563eb', '#0f766e', '#059669', '#7c3aed', '#e11d48', '#ea580c', '#b45309', '#1e3a5f', '#334155', '#000000'];
const PAGE = { A4: { w: 210, h: 297 }, Letter: { w: 215.9, h: 279.4 } };
const PRINT_MARGIN = 10; // mm, top/bottom on continuation pages
const MM = 96 / 25.4;
// Chromium 130+ and Firefox repeat padding on every printed page (box-decoration-break: clone),
// so pages get clean margins and full-height sidebars. Other browsers fall back to @page margins.
const CLONE = (() => { const ua = navigator.userAgent, m = ua.match(/Chrom(?:e|ium)\/(\d+)/); return (!!m && +m[1] >= 130 && !/CriOS|EdgiOS/.test(ua)) || /Firefox\//.test(ua); })();
document.documentElement.classList.toggle('print-clone', CLONE);

/* ---------- Sections ---------- */
const BUILTIN = ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages', 'links'];
const SECTION_TITLES = { summary: 'Summary', experience: 'Experience', education: 'Education', projects: 'Projects', skills: 'Skills', certifications: 'Certifications', languages: 'Languages', links: 'Links' };
const SIDE_KEYS = ['skills', 'languages', 'certifications', 'links'];

const LISTS = {
  experience: { add: 'Add position', fields: [['role', 'Job title'], ['company', 'Company'], ['location', 'Location'], ['start', 'Start', 'half', 'e.g. Jan 2023'], ['end', 'End', 'half', 'e.g. Present'], ['bullets', 'Highlights (one per line)', 'area']], title: (i) => i.role || 'Untitled position', sub: (i) => i.company },
  education: { add: 'Add education', fields: [['degree', 'Degree / course'], ['school', 'School / university'], ['location', 'Location'], ['start', 'Start', 'half'], ['end', 'End', 'half'], ['details', 'Details (grade, coursework…)', 'area']], title: (i) => i.degree || 'Untitled education', sub: (i) => i.school },
  projects: { add: 'Add project', fields: [['name', 'Project name'], ['link', 'Link', '', 'https://'], ['tech', 'Tech / tools'], ['date', 'Date', '', 'e.g. 2025'], ['description', 'Description (one point per line)', 'area']], title: (i) => i.name || 'Untitled project', sub: (i) => i.tech },
  certifications: { add: 'Add certification', fields: [['name', 'Certification'], ['issuer', 'Issuer'], ['date', 'Date', 'half'], ['link', 'Link', 'half', 'https://']], title: (i) => i.name || 'Untitled certification', sub: (i) => i.issuer },
  skills: { add: 'Add skill', inline: true, fields: [['name', 'Skill'], ['level', 'Level', 'level']] },
  languages: { add: 'Add language', inline: true, fields: [['name', 'Language'], ['level', 'Proficiency', '', 'e.g. Fluent']] },
  links: { add: 'Add link', inline: true, fields: [['label', 'Label'], ['url', 'URL', '', 'https://']] },
  custom: { add: 'Add item', fields: [['title', 'Title'], ['subtitle', 'Subtitle'], ['date', 'Date', 'half'], ['link', 'Link', 'half', 'https://'], ['description', 'Description', 'area']], title: (i) => i.title || 'Untitled item', sub: (i) => i.subtitle },
};

/* ---------- State ---------- */
function blankState() {
  return {
    v: 1,
    design: { template: 'modern', accent: TPL.modern.accent, font: '', density: 'normal', scale: 1, page: 'A4', photo: true },
    personal: { name: '', title: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', photo: '' },
    summary: '', experience: [], education: [], projects: [], skills: [], certifications: [], languages: [], links: [], custom: [],
    order: [...BUILTIN], hidden: {}, titles: {},
  };
}

function sampleState(design) {
  const s = blankState();
  if (design) s.design = { ...design };
  s.personal = { name: 'Aarav Mehta', title: 'Full-Stack Developer', email: 'aarav.mehta@email.com', phone: '+91 12345 67890', location: 'Bengaluru, India', website: 'aaravmehta.dev', linkedin: 'linkedin.com/in/aaravmehta', github: 'github.com/aaravmehta', photo: '' };
  s.summary = 'Full-stack developer with 4+ years of experience building fast, accessible web products used by millions. I turn messy problems into simple interfaces and care about performance, clean code and shipping work people love.';
  s.experience = [
    { id: uid(), role: 'Senior Frontend Engineer', company: 'Razorpay', location: 'Bengaluru', start: 'Mar 2023', end: 'Present', bullets: 'Led the rebuild of the merchant dashboard in React and TypeScript, cutting load time by 42%\nDesigned a shared component library now used by 6 product teams\nMentored 4 junior developers and introduced weekly code reviews' },
    { id: uid(), role: 'Software Engineer', company: 'Swiggy', location: 'Bengaluru', start: 'Jul 2021', end: 'Feb 2023', bullets: 'Built real-time order tracking with WebSockets for 2M+ daily users\nImproved checkout conversion by 8% through A/B-tested UX changes' },
  ];
  s.education = [
    { id: uid(), degree: 'B.Tech in Computer Science & Engineering', school: 'National Institute of Technology, Trichy', location: 'Tiruchirappalli', start: '2017', end: '2021', details: 'CGPA 8.7 / 10 · Coursework: Data Structures, Operating Systems, Machine Learning' },
  ];
  s.projects = [
    { id: uid(), name: 'ShopLite', link: 'https://github.com/aaravmehta/shoplite', tech: 'Next.js, Supabase, Stripe', date: '2024', description: 'Open-source storefront starter with 1.2k GitHub stars and 100/100 Lighthouse scores' },
  ];
  s.skills = ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'Git', 'Figma'].map((n, k) => ({ id: uid(), name: n, level: [5, 5, 5, 4, 4, 4, 4, 3, 5, 3][k] }));
  s.certifications = [
    { id: uid(), name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services', date: '2024', link: '' },
  ];
  s.languages = [{ id: uid(), name: 'English', level: 'Fluent' }, { id: uid(), name: 'Hindi', level: 'Native' }];
  s.links = [];
  const cid = uid();
  s.custom = [{ id: cid, title: 'Achievements', items: [{ id: uid(), title: 'Winner, Smart India Hackathon', subtitle: 'Ministry of Education', date: '2020', link: '', description: 'Built an offline-first attendance system for rural schools.' }] }];
  s.order = [...BUILTIN.slice(0, 4), 'custom:' + cid, ...BUILTIN.slice(4)];
  return s;
}

function normalize(raw) {
  const s = blankState();
  if (!raw || typeof raw !== 'object') return s;
  s.design = { ...s.design, ...(raw.design || {}) };
  if (!TPL[s.design.template]) s.design.template = 'modern';
  if (!PAGE[s.design.page]) s.design.page = 'A4';
  if (!['compact', 'normal', 'relaxed'].includes(s.design.density)) s.design.density = 'normal';
  if (!/^#[0-9a-f]{6}$/i.test(s.design.accent || '')) s.design.accent = TPL[s.design.template].accent;
  s.design.scale = Math.min(1.15, Math.max(0.85, Number(s.design.scale) || 1));
  s.personal = { ...s.personal, ...(raw.personal || {}) };
  for (const k of Object.keys(s.personal)) s.personal[k] = String(s.personal[k] ?? '');
  s.summary = typeof raw.summary === 'string' ? raw.summary : '';
  for (const k of ['experience', 'education', 'projects', 'skills', 'certifications', 'languages', 'links']) {
    s[k] = Array.isArray(raw[k]) ? raw[k].filter((x) => x && typeof x === 'object').map((x) => ({ ...x, id: String(x.id || uid()) })) : [];
  }
  s.custom = Array.isArray(raw.custom) ? raw.custom.filter((c) => c && typeof c === 'object').map((c) => ({ id: String(c.id || uid()), title: String(c.title || 'Custom section'), items: (Array.isArray(c.items) ? c.items : []).filter((x) => x && typeof x === 'object').map((x) => ({ ...x, id: String(x.id || uid()) })) })) : [];
  s.hidden = raw.hidden && typeof raw.hidden === 'object' ? { ...raw.hidden } : {};
  s.titles = raw.titles && typeof raw.titles === 'object' ? { ...raw.titles } : {};
  const valid = new Set([...BUILTIN, ...s.custom.map((c) => 'custom:' + c.id)]);
  const order = (Array.isArray(raw.order) ? raw.order : []).filter((k) => valid.has(k));
  for (const k of valid) if (!order.includes(k)) order.push(k);
  s.order = [...new Set(order)];
  return s;
}

let state;
try { const raw = localStorage.getItem(STORAGE_KEY); state = raw ? normalize(JSON.parse(raw)) : sampleState(); }
catch { state = sampleState(); }

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  setSaveStatus('Saving…');
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setSaveStatus('Saved'); }
    catch { setSaveStatus('Not saved'); toast('Could not save: browser storage is full. Try a smaller photo.'); }
  }, 250);
}
function setSaveStatus(t) { const el = $('#save-status'); if (el) { el.textContent = t; el.dataset.state = t === 'Saved' ? 'ok' : t.startsWith('Not') ? 'err' : 'busy'; } }

/* ---------- Helpers ---------- */
function mix(hex, pct, base = '#ffffff') { // pct of hex over base
  const h = (x) => { x = x.replace('#', ''); if (x.length === 3) x = x.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)); };
  try {
    const a = h(hex), b = h(base);
    if (a.some(isNaN)) return base;
    return '#' + a.map((v, i) => Math.round(v * pct + b[i] * (1 - pct)).toString(16).padStart(2, '0')).join('');
  } catch { return base; }
}
function safeUrl(u) {
  u = String(u || '').trim(); if (!u) return '';
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(u)) return 'https://' + u;
  return '';
}
const prettyUrl = (u) => String(u || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
const lines = (t) => String(t || '').split(/\n+/).map((l) => l.replace(/^\s*[-•*▪–]\s*/, '').trim()).filter(Boolean);
const dateRange = (a, b) => [a, b].filter((x) => String(x || '').trim()).map(esc).join(' – ');
const initials = (n) => String(n || '').trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();

const ICON = {
  mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16M8 7.6v.1M11.5 16v-3.2c0-1.4 1-2.3 2.2-2.3s2.1.9 2.1 2.3V16M11.5 10.5V16"/>',
  github: '<path d="M9 19c-4 1.3-4-2-5.6-2.5M14.6 21v-3.2a2.8 2.8 0 0 0-.8-2.2c2.6-.3 5.4-1.3 5.4-5.8a4.5 4.5 0 0 0-1.2-3.1 4.2 4.2 0 0 0-.1-3.1s-1-.3-3.2 1.2a11 11 0 0 0-5.8 0C6.7 3.3 5.7 3.6 5.7 3.6a4.2 4.2 0 0 0-.1 3.1 4.5 4.5 0 0 0-1.2 3.1c0 4.5 2.8 5.5 5.4 5.8a2.8 2.8 0 0 0-.8 2.2V21"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
const icon = (n) => `<svg class="r-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

/* ---------- Resume rendering ---------- */
function sectionTitle(s, key) {
  if (key.startsWith('custom:')) { const c = s.custom.find((x) => 'custom:' + x.id === key); return c ? c.title : ''; }
  return s.titles[key] || SECTION_TITLES[key];
}
function sec(key, title, body) {
  if (!body) return '';
  return `<section class="r-sec r-sec-${key.split(':')[0]}"><h2 class="r-h"><span>${esc(title)}</span></h2><div class="r-body">${body}</div></section>`;
}
function itemHead(title, sub, date, link) {
  const t = title ? (link ? `<a href="${esc(link)}">${esc(title)}</a>` : esc(title)) : '';
  return `<div class="r-ih"><div class="r-ih-main">${t ? `<h3 class="r-it">${t}</h3>` : ''}${sub ? `<div class="r-sub">${sub}</div>` : ''}</div>${date ? `<div class="r-date">${date}</div>` : ''}</div>`;
}
function bulletsHTML(text) {
  const ls = lines(text);
  if (!ls.length) return '';
  if (ls.length === 1) return `<p class="r-p">${esc(ls[0])}</p>`;
  return `<ul class="r-ul">${ls.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
}
const has = (i, ...ks) => ks.some((k) => String(i[k] ?? '').trim());
function renderSectionBody(s, key) {
  switch (key) {
    case 'summary': return s.summary.trim() ? `<p class="r-p r-summary">${esc(s.summary.trim()).replace(/\n/g, '<br>')}</p>` : '';
    case 'experience': return s.experience.filter((i) => has(i, 'role', 'company', 'bullets')).map((i) => `<div class="r-item">${itemHead(i.role, [esc(i.company), esc(i.location)].filter(Boolean).join(' · '), dateRange(i.start, i.end))}${bulletsHTML(i.bullets)}</div>`).join('');
    case 'education': return s.education.filter((i) => has(i, 'degree', 'school')).map((i) => `<div class="r-item">${itemHead(i.degree, [esc(i.school), esc(i.location)].filter(Boolean).join(' · '), dateRange(i.start, i.end))}${bulletsHTML(i.details)}</div>`).join('');
    case 'projects': return s.projects.filter((i) => has(i, 'name', 'description')).map((i) => `<div class="r-item">${itemHead(i.name, i.tech ? `<span class="r-tech">${esc(i.tech)}</span>` : '', esc(i.date), safeUrl(i.link))}${bulletsHTML(i.description)}</div>`).join('');
    case 'certifications': {
      const cs = s.certifications.filter((i) => has(i, 'name'));
      return cs.length ? `<div class="r-certs">${cs.map((i) => `<div class="r-item r-cert">${itemHead(i.name, esc(i.issuer), esc(i.date), safeUrl(i.link))}</div>`).join('')}</div>` : '';
    }
    case 'skills': {
      const sk = s.skills.filter((x) => String(x.name || '').trim());
      return sk.length ? `<ul class="r-skills">${sk.map((x) => { const lv = Math.max(0, Math.min(5, Number(x.level) || 0)); return `<li${lv ? ` data-lv="${lv}"` : ''}><span class="r-sk">${esc(x.name)}</span>${lv ? `<span class="r-bar" aria-hidden="true"><i style="width:${lv * 20}%"></i></span>` : ''}</li>`; }).join('')}</ul>` : '';
    }
    case 'languages': {
      const ls = s.languages.filter((x) => String(x.name || '').trim());
      return ls.length ? `<ul class="r-langs">${ls.map((x) => `<li><span class="r-ln">${esc(x.name)}</span>${x.level ? `<span class="r-lvl">${esc(x.level)}</span>` : ''}</li>`).join('')}</ul>` : '';
    }
    case 'links': {
      const ls = s.links.filter((x) => String(x.url || '').trim());
      return ls.length ? `<ul class="r-links">${ls.map((x) => { const u = safeUrl(x.url); return `<li>${x.label ? `<span class="r-lab">${esc(x.label)}</span>` : ''}${u ? `<a href="${esc(u)}">${esc(prettyUrl(x.url))}</a>` : `<span>${esc(x.url)}</span>`}</li>`; }).join('')}</ul>` : '';
    }
    default: {
      const c = s.custom.find((x) => 'custom:' + x.id === key);
      if (!c) return '';
      return c.items.filter((i) => has(i, 'title', 'description')).map((i) => `<div class="r-item">${itemHead(i.title, esc(i.subtitle), esc(i.date), safeUrl(i.link))}${bulletsHTML(i.description)}</div>`).join('');
    }
  }
}
function contactHTML(p) {
  const it = [];
  if (p.email.trim()) it.push(['mail', p.email.trim(), 'mailto:' + p.email.trim()]);
  if (p.phone.trim()) it.push(['phone', p.phone.trim(), 'tel:' + p.phone.replace(/[^\d+]/g, '')]);
  if (p.location.trim()) it.push(['pin', p.location.trim(), '']);
  if (p.website.trim()) it.push(['globe', prettyUrl(p.website.trim()), safeUrl(p.website)]);
  if (p.linkedin.trim()) it.push(['linkedin', prettyUrl(p.linkedin.trim()), safeUrl(p.linkedin)]);
  if (p.github.trim()) it.push(['github', prettyUrl(p.github.trim()), safeUrl(p.github)]);
  if (!it.length) return '';
  return `<ul class="r-contact">${it.map(([ic, t, h]) => `<li>${icon(ic)}${h ? `<a href="${esc(h)}">${esc(t)}</a>` : `<span>${esc(t)}</span>`}</li>`).join('')}</ul>`;
}
function photoHTML(s, tpl) {
  if (!tpl.photo || !s.design.photo) return '';
  if (s.personal.photo) return `<div class="r-photo"><img src="${esc(s.personal.photo)}" alt=""></div>`;
  const ini = initials(s.personal.name);
  return ini ? `<div class="r-photo r-mono" aria-hidden="true">${esc(ini)}</div>` : '';
}

function renderResume(s, opts = {}) {
  const tpl = TPL[s.design.template] || TPL.modern;
  const d = s.design, p = s.personal;
  const font = d.font || tpl.font, hfont = d.font || tpl.hfont;
  const g = { compact: 0.72, normal: 1, relaxed: 1.3 }[d.density] || 1;
  const pg = PAGE[d.page] || PAGE.A4;
  const accent = d.accent || tpl.accent;
  const vars = `--accent:${accent};--accent-soft:${mix(accent, 0.09)};--accent-mid:${mix(accent, 0.22)};--accent-dark:${mix(accent, 0.8, '#000000')};--font:${FONT_STACK(font).replace(/"/g, "'")};--hfont:${FONT_STACK(hfont).replace(/"/g, "'")};--fs:${(10 * d.scale).toFixed(2)}pt;--g:${g};--pw:${pg.w}mm;--ph:${pg.h}mm;--pm:${PRINT_MARGIN}mm;--side:${tpl.side || 0}mm`;
  const keys = s.order.filter((k) => !s.hidden[k]);
  const secs = (ks) => ks.map((k) => sec(k, sectionTitle(s, k), renderSectionBody(s, k))).join('');
  const name = `<h1 class="r-name">${esc(p.name.trim()) || '<span class="r-ph">Your Name</span>'}</h1>`;
  const title = p.title.trim() ? `<p class="r-role">${esc(p.title.trim())}</p>` : '';
  const contact = contactHTML(p);
  const photo = photoHTML(s, tpl);
  let inner = '';
  if (tpl.layout === 'side-left' || tpl.layout === 'side-right') {
    const side = keys.filter((k) => SIDE_KEYS.includes(k)), main = keys.filter((k) => !SIDE_KEYS.includes(k));
    const contactBlock = contact ? `<section class="r-sec r-sec-contact"><h2 class="r-h"><span>Contact</span></h2><div class="r-body">${contact}</div></section>` : '';
    const aside = `<aside class="r-side">${photo}${contactBlock}${secs(side)}</aside>`;
    const mainEl = `<div class="r-main"><header class="r-head">${name}${title}</header>${secs(main)}</div>`;
    inner = `<div class="r-grid">${tpl.layout === 'side-left' ? aside + mainEl : mainEl + aside}</div>`;
  } else if (tpl.layout === 'two-col') {
    const side = keys.filter((k) => SIDE_KEYS.includes(k)), main = keys.filter((k) => !SIDE_KEYS.includes(k));
    inner = `<header class="r-head">${photo}<div class="r-head-text">${name}${title}${contact}</div></header><div class="r-cols"><div class="r-main">${secs(main)}</div><aside class="r-side">${secs(side)}</aside></div>`;
  } else {
    inner = `<header class="r-head">${photo}<div class="r-head-text">${name}${title}${contact}</div></header><div class="r-main">${secs(keys)}</div>`;
  }
  return `<article class="resume t-${tpl.id} l-${tpl.layout} dens-${d.density} page-${d.page}${photo ? ' has-photo' : ''}" style="${vars}"${opts.label === false ? ' aria-hidden="true"' : ' aria-label="Resume preview"'}>${inner}</article>`;
}

/* ---------- Preview ---------- */
let previewQueued = false;
function schedulePreview() {
  if (previewQueued) return; previewQueued = true;
  requestAnimationFrame(() => { previewQueued = false; renderPreview(); });
}
function renderPreview() {
  $('#sheet').innerHTML = renderResume(state);
  $('#print-root').innerHTML = renderResume(state, { label: false });
  applyPrintPageCSS();
  fitPreview();
  thumbsDirty = true;
  if (currentTab === 'design') scheduleThumbs();
}
function fitPreview() {
  const pane = $('#preview-scroll'), wrap = $('#sheet-wrap'), sheet = $('#sheet');
  const art = sheet.firstElementChild; if (!art || !pane.clientWidth) return;
  const pg = PAGE[state.design.page];
  const wpx = pg.w * MM;
  const avail = pane.clientWidth - (window.innerWidth < 760 ? 24 : 64);
  const scale = Math.min(1, avail / wpx);
  sheet.style.transform = `scale(${scale})`;
  const h = art.offsetHeight;
  wrap.style.width = wpx * scale + 'px';
  wrap.style.height = h * scale + 'px';
  const guides = $('#guides'); guides.innerHTML = '';
  const padEl = art.querySelector('.r-grid > .r-main') || art;
  const cs = getComputedStyle(padEl);
  const pt = CLONE ? parseFloat(cs.paddingTop) : PRINT_MARGIN * MM, pb = CLONE ? parseFloat(cs.paddingBottom) : PRINT_MARGIN * MM;
  const pagePx = pg.h * MM;
  const first = pagePx - pb, next = pagePx - pt - pb;
  const contentH = contentHeight(art);
  let y = first, n = 2, pages = 1;
  while (y < contentH - 1 && n < 30) {
    const gd = document.createElement('div'); gd.className = 'guide'; gd.style.top = y * scale + 'px'; gd.innerHTML = `<span>Page ${n}</span>`;
    guides.appendChild(gd); y += next; n++; pages++;
  }
  $('#print-root').style.setProperty('--print-min', Math.floor(pages * pagePx - (pages - 1) * (CLONE ? pt + pb : 2 * PRINT_MARGIN * MM) - (CLONE ? 0 : PRINT_MARGIN * MM) - 2) + 'px');
  $('#page-count').textContent = `${pages} page${pages > 1 ? 's' : ''} · ${state.design.page === 'Letter' ? 'US Letter' : 'A4'}`;
}
function contentHeight(art) { // height actually used by content (ignores the sheet's min-height)
  const top = art.getBoundingClientRect().top; let max = 0;
  for (const el of art.querySelectorAll('.r-item, .r-sec, .r-head, .r-photo, li')) { const r = el.getBoundingClientRect(); if (r.bottom > max) max = r.bottom; }
  const scale = art.getBoundingClientRect().height / art.offsetHeight || 1;
  return (max - top) / scale;
}
function sideColor(tpl) {
  const a = state.design.accent || tpl.accent;
  if (tpl.id === 'sidebar') return a;
  if (tpl.id === 'bold') return mix(a, 0.09);
  if (tpl.id === 'creative') return mix(a, 0.07);
  return '#ffffff';
}
function applyPrintPageCSS() {
  const pg = state.design.page === 'Letter' ? 'letter' : 'A4';
  $('#print-page-css').textContent = CLONE
    ? `@page{size:${pg};margin:0}`
    : `@page{size:${pg};margin:${PRINT_MARGIN}mm 0}@page:first{margin-top:0}`;
}

/* ---------- Editor ---------- */
let openPanels = new Set(['personal']);
let openEntries = new Set();
let fid = 0;
function field(label, attrs, value, kind, ph) {
  const id = 'f' + (++fid);
  const a = Object.entries(attrs).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  if (kind === 'area') return `<label class="fld fld-full" for="${id}"><span>${esc(label)}</span><textarea id="${id}" ${a} rows="4" placeholder="${esc(ph || '')}">${esc(value)}</textarea></label>`;
  if (kind === 'level') {
    const opts = [0, 1, 2, 3, 4, 5].map((i) => `<option value="${i}"${Number(value) === i ? ' selected' : ''}>${i ? '●'.repeat(i) + '○'.repeat(5 - i) : 'No level'}</option>`).join('');
    return `<label class="fld fld-level" for="${id}"><span class="sr">${esc(label)}</span><select id="${id}" ${a}>${opts}</select></label>`;
  }
  const inl = ph === label ? ' aria-label="' + esc(label) + '"' : '';
  return `<label class="fld${kind === 'half' ? ' fld-half' : ''}" for="${id}"><span${inl ? ' class="sr"' : ''}>${esc(label)}</span><input id="${id}" type="text" ${a} value="${esc(value)}" placeholder="${esc(ph || '')}" autocomplete="off"></label>`;
}
const SV = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const BTN = {
  up: SV('<path d="m6 15 6-6 6 6"/>'),
  down: SV('<path d="m6 9 6 6 6-6"/>'),
  del: SV('<path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  chev: '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  eye: SV('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeoff: SV('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
};
function actions(list, id, idx, len, cid, label) {
  const c = cid ? ` data-cid="${cid}"` : '';
  const l = esc(label || 'item');
  return `<div class="row-actions"><button type="button" class="ib" data-act="up" data-list="${list}" data-id="${id}"${c} aria-label="Move ${l} up"${idx === 0 ? ' disabled' : ''}>${BTN.up}</button><button type="button" class="ib" data-act="down" data-list="${list}" data-id="${id}"${c} aria-label="Move ${l} down"${idx === len - 1 ? ' disabled' : ''}>${BTN.down}</button><button type="button" class="ib ib-del" data-act="del" data-list="${list}" data-id="${id}"${c} aria-label="Delete ${l}">${BTN.del}</button></div>`;
}
function listHTML(listKey, items, cid) {
  const L = LISTS[listKey];
  const c = cid ? { cid } : {};
  const rows = items.map((it, idx) => {
    if (L.inline) {
      return `<div class="row-inline${listKey === 'skills' ? ' row-skill' : ''}" data-id="${it.id}">${L.fields.map(([f, lab, kind, ph]) => field(lab, { list: listKey, id: it.id, f, ...c }, it[f] ?? '', kind, lab)).join('')}${actions(listKey, it.id, idx, items.length, cid, it.name || it.label)}</div>`;
    }
    const open = openEntries.has(it.id);
    return `<div class="entry${open ? ' open' : ''}" data-id="${it.id}"><div class="entry-head"><button type="button" class="entry-toggle" data-toggle="${it.id}" aria-expanded="${open}">${BTN.chev}<span class="entry-t"><b>${esc(L.title(it))}</b><small>${esc(L.sub(it) || '')}</small></span></button>${actions(listKey, it.id, idx, items.length, cid, L.title(it))}</div><div class="entry-body"${open ? '' : ' hidden'}><div class="grid">${L.fields.map(([f, lab, kind, ph]) => field(lab, { list: listKey, id: it.id, f, ...c }, it[f] ?? '', kind, ph)).join('')}</div></div></div>`;
  }).join('');
  return `<div class="entries${L.inline ? ' entries-inline' : ''}">${rows || '<p class="empty">Nothing here yet.</p>'}</div><button type="button" class="btn-add" data-add="${listKey}"${cid ? ` data-cid="${cid}"` : ''}>+ ${esc(L.add)}</button>`;
}
function panel(key, title, count, body) {
  const open = openPanels.has(key);
  return `<details class="panel" data-panel="${esc(key)}"${open ? ' open' : ''}><summary>${BTN.chev}<span class="p-title">${esc(title)}</span>${count !== null ? `<span class="count">${count}</span>` : ''}${state.hidden[key] ? '<span class="tag-hidden">Hidden</span>' : ''}</summary><div class="panel-body">${body}</div></details>`;
}
function renderEditor() {
  const s = state, p = s.personal;
  const pf = (k, lab, ph, type = 'text', half = true) => `<label class="fld${half ? ' fld-half' : ''}" for="p-${k}"><span>${lab}</span><input id="p-${k}" type="${type}" data-p="${k}" value="${esc(p[k])}" placeholder="${esc(ph)}" autocomplete="off"></label>`;
  const tpl = TPL[s.design.template];
  const photoBlock = `<div class="photo-row"><div class="avatar">${p.photo ? `<img src="${esc(p.photo)}" alt="Your photo">` : `<span>${esc(initials(p.name) || '+')}</span>`}</div><div class="photo-ctl"><div class="photo-btns"><label class="btn btn-sm" for="photo-input">${p.photo ? 'Change photo' : 'Upload photo'}</label><input id="photo-input" type="file" accept="image/*" class="sr">${p.photo ? '<button type="button" class="btn btn-sm btn-ghost" data-photo="remove">Remove</button>' : ''}</div><label class="switch"><input type="checkbox" data-design="photo"${s.design.photo ? ' checked' : ''}><span>Show photo${tpl.photo ? '' : ` <em>(${esc(tpl.name)} has no photo)</em>`}</span></label></div></div>`;
  let html = panel('personal', 'Personal details', null, `${photoBlock}<div class="grid">${pf('name', 'Full name', 'Your name', 'text', false)}${pf('title', 'Headline', 'e.g. Frontend Developer', 'text', false)}${pf('email', 'Email', 'you@email.com', 'email')}${pf('phone', 'Phone', '+91 …', 'tel')}${pf('location', 'Location', 'City, Country')}${pf('website', 'Website', 'yoursite.com')}${pf('linkedin', 'LinkedIn', 'linkedin.com/in/…')}${pf('github', 'GitHub', 'github.com/…')}</div>`);
  for (const key of s.order) {
    if (key === 'summary') {
      html += panel('summary', sectionTitle(s, 'summary'), null, `<label class="fld fld-full" for="summary-in"><span class="sr">Summary</span><textarea id="summary-in" data-k="summary" rows="5" placeholder="Two or three lines about who you are and what you do best.">${esc(s.summary)}</textarea></label><p class="hint" id="summary-hint">${s.summary.length} characters · aim for 250–500</p>`);
    } else if (key.startsWith('custom:')) {
      const c = s.custom.find((x) => 'custom:' + x.id === key); if (!c) continue;
      const body = `<div class="custom-title"><label class="fld" for="ct-${c.id}"><span>Section title</span><input id="ct-${c.id}" type="text" data-ctitle="${c.id}" value="${esc(c.title)}"></label><button type="button" class="btn btn-sm btn-ghost danger" data-delcustom="${c.id}">Delete section</button></div>${listHTML('custom', c.items, c.id)}`;
      html += panel(key, c.title || 'Custom section', c.items.length, body);
    } else {
      html += panel(key, sectionTitle(s, key), s[key].length, listHTML(key, s[key]));
    }
  }
  html += `<button type="button" class="btn-add btn-add-section" data-addcustom="1">+ Add custom section</button>`;
  const arr = s.order.map((k, i) => { const t = esc(sectionTitle(s, k) || 'Untitled'); return `<li><span class="arr-name${s.hidden[k] ? ' off' : ''}">${t}</span><div class="row-actions"><button type="button" class="ib" data-vis="${esc(k)}" aria-label="${s.hidden[k] ? 'Show' : 'Hide'} ${t}" aria-pressed="${!!s.hidden[k]}">${s.hidden[k] ? BTN.eyeoff : BTN.eye}</button><button type="button" class="ib" data-sec="up" data-key="${esc(k)}" aria-label="Move ${t} up"${i === 0 ? ' disabled' : ''}>${BTN.up}</button><button type="button" class="ib" data-sec="down" data-key="${esc(k)}" aria-label="Move ${t} down"${i === s.order.length - 1 ? ' disabled' : ''}>${BTN.down}</button></div></li>`; }).join('');
  html += panel('arrange', 'Arrange & hide sections', null, `<p class="hint">On sidebar and two-column templates, skills, languages, certifications and links sit in the side column.</p><ul class="arrange">${arr}</ul>`);
  html += `<p class="credit">Free, no login. Your data stays in this browser. <button type="button" class="linkish" data-open="about">About the developer</button></p>`;
  $('#content-pane').innerHTML = html;
}

function getList(listKey, cid) {
  if (listKey === 'custom') return (state.custom.find((c) => c.id === cid) || { items: [] }).items;
  return state[listKey];
}
function onEditorInput(e) {
  const t = e.target, d = t.dataset;
  if (d.p) { state.personal[d.p] = t.value; if (d.p === 'name') { const av = $('.avatar span'); if (av) av.textContent = initials(t.value) || '+'; } }
  else if (d.k === 'summary') { state.summary = t.value; const h = $('#summary-hint'); if (h) h.textContent = `${t.value.length} characters · aim for 250–500`; }
  else if (d.ctitle) { const c = state.custom.find((x) => x.id === d.ctitle); if (c) { c.title = t.value; const pt = t.closest('.panel').querySelector('.p-title'); if (pt) pt.textContent = t.value || 'Custom section'; } }
  else if (d.list && d.id && d.f) {
    const it = getList(d.list, d.cid).find((x) => x.id === d.id); if (!it) return;
    it[d.f] = d.f === 'level' && d.list === 'skills' ? Number(t.value) : t.value;
    const L = LISTS[d.list], entry = t.closest('.entry');
    if (entry && L.title) { entry.querySelector('.entry-t b').textContent = L.title(it); entry.querySelector('.entry-t small').textContent = L.sub(it) || ''; }
  } else if (d.design === 'photo') { state.design.photo = t.checked; }
  else return;
  save(); schedulePreview();
}
function focusAfter(sel) { const el = $(sel, $('#content-pane')); if (el && !el.disabled) el.focus(); }
function onEditorClick(e) {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.toggle) {
    const entry = b.closest('.entry'), body = entry.querySelector('.entry-body');
    const open = body.hidden; body.hidden = !open; entry.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
    open ? openEntries.add(d.toggle) : openEntries.delete(d.toggle);
    return;
  }
  if (d.add) {
    const list = getList(d.add, d.cid); const it = { id: uid() };
    for (const [f, , kind] of LISTS[d.add].fields) it[f] = kind === 'level' ? 0 : '';
    list.push(it); openEntries.add(it.id);
    commit();
    focusAfter(`[data-id="${it.id}"] input, [data-id="${it.id}"] textarea`);
    return;
  }
  if (d.act) {
    const list = getList(d.list, d.cid); const i = list.findIndex((x) => x.id === d.id); if (i < 0) return;
    if (d.act === 'del') {
      const [gone] = list.splice(i, 1); commit();
      toast('Deleted', { action: 'Undo', fn: () => { const l = getList(d.list, d.cid); l.splice(Math.min(i, l.length), 0, gone); commit(); } });
      return;
    }
    const j = d.act === 'up' ? i - 1 : i + 1; if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]]; commit();
    focusAfter(`[data-act="${d.act}"][data-id="${d.id}"]`);
    return;
  }
  if (d.addcustom) {
    const c = { id: uid(), title: 'Custom section', items: [{ id: uid(), title: '', subtitle: '', date: '', link: '', description: '' }] };
    state.custom.push(c); state.order.push('custom:' + c.id); openPanels.add('custom:' + c.id); openEntries.add(c.items[0].id);
    commit(); const inp = $(`#ct-${c.id}`); if (inp) { inp.focus(); inp.select(); }
    return;
  }
  if (d.delcustom) {
    if (!confirm('Delete this whole section?')) return;
    state.custom = state.custom.filter((c) => c.id !== d.delcustom); state.order = state.order.filter((k) => k !== 'custom:' + d.delcustom); commit(); return;
  }
  if (d.vis) { if (state.hidden[d.vis]) delete state.hidden[d.vis]; else state.hidden[d.vis] = true; commit(); focusAfter(`[data-vis="${CSS.escape(d.vis)}"]`); return; }
  if (d.sec) {
    const i = state.order.indexOf(d.key), j = d.sec === 'up' ? i - 1 : i + 1; if (i < 0 || j < 0 || j >= state.order.length) return;
    [state.order[i], state.order[j]] = [state.order[j], state.order[i]]; commit();
    focusAfter(`[data-sec="${d.sec}"][data-key="${CSS.escape(d.key)}"]`); return;
  }
  if (d.photo === 'remove') { state.personal.photo = ''; commit(); return; }
  if (d.open === 'about') openAbout();
}
function commit() { save(); renderEditor(); renderPreview(); }
function trackPanels(e) {
  const dt = e.target; if (!dt.matches || !dt.matches('details.panel')) return;
  dt.open ? openPanels.add(dt.dataset.panel) : openPanels.delete(dt.dataset.panel);
}
async function onPhoto(file) {
  if (!file || !file.type.startsWith('image/')) { toast('Please choose an image file.'); return; }
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const size = 360, c = document.createElement('canvas'); c.width = c.height = size;
    const m = Math.min(img.naturalWidth, img.naturalHeight);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, size, size);
    URL.revokeObjectURL(url);
    state.personal.photo = c.toDataURL('image/jpeg', 0.86); state.design.photo = true;
    commit(); toast(TPL[state.design.template].photo ? 'Photo added' : 'Photo added. Pick a template with a photo to show it.');
  } catch { toast('Could not read that image.'); }
}

/* ---------- Design pane ---------- */
let currentTab = 'content', thumbsDirty = true, thumbTimer = 0;
function renderDesign() {
  const d = state.design, t0 = TPL[d.template];
  const tpls = TEMPLATES.map((t) => `<button type="button" class="tpl${d.template === t.id ? ' on' : ''}" data-tpl="${t.id}" aria-pressed="${d.template === t.id}"><span class="tpl-thumb" data-thumb="${t.id}"></span><span class="tpl-name">${t.name}</span><span class="tpl-tags">${t.tags}</span></button>`).join('');
  const sw = ACCENTS.map((c) => `<button type="button" class="sw${d.accent.toLowerCase() === c ? ' on' : ''}" data-accent="${c}" style="--c:${c}" aria-label="Accent colour ${c}" aria-pressed="${d.accent.toLowerCase() === c}"></button>`).join('');
  const seg = (name, label, vals, cur) => `<div class="seg" role="radiogroup" aria-label="${label}">${vals.map(([v, l]) => `<button type="button" role="radio" aria-checked="${String(cur) === String(v)}" data-set="${name}" data-val="${v}">${l}</button>`).join('')}</div>`;
  const defName = t0.font === t0.hfont ? t0.font : `${t0.hfont} + ${t0.font}`;
  $('#design-pane').innerHTML = `
    <section class="dz"><h2 class="dz-h">Templates <span class="count">${TEMPLATES.length}</span></h2><div class="tpl-grid">${tpls}</div></section>
    <section class="dz"><h2 class="dz-h">Accent colour</h2><div class="swatches">${sw}<label class="sw sw-custom${ACCENTS.includes(d.accent.toLowerCase()) ? '' : ' on'}" title="Custom colour" style="--c:${esc(d.accent)}"><input type="color" id="accent-custom" value="${esc(d.accent)}" aria-label="Custom accent colour"><span aria-hidden="true">+</span></label></div></section>
    <section class="dz"><h2 class="dz-h"><label for="font-sel">Font</label></h2><select id="font-sel" class="select">${FONTS.map(([v, l]) => `<option value="${esc(v)}"${d.font === v ? ' selected' : ''}>${v ? l : `${l} (${defName})`}</option>`).join('')}</select></section>
    <section class="dz"><h2 class="dz-h">Spacing</h2>${seg('density', 'Spacing', [['compact', 'Compact'], ['normal', 'Normal'], ['relaxed', 'Relaxed']], d.density)}</section>
    <section class="dz"><h2 class="dz-h"><label for="scale-in">Text size</label> <span class="val" id="scale-val">${Math.round(d.scale * 100)}%</span></h2><input type="range" id="scale-in" min="0.85" max="1.15" step="0.05" value="${d.scale}"></section>
    <section class="dz"><h2 class="dz-h">Paper size</h2>${seg('page', 'Paper size', [['A4', 'A4'], ['Letter', 'US Letter']], d.page)}</section>
    <section class="dz"><label class="switch"><input type="checkbox" id="photo-toggle"${d.photo ? ' checked' : ''}><span>Show photo on templates that support it</span></label></section>`;
  thumbsDirty = true; scheduleThumbs();
}
function scheduleThumbs() { clearTimeout(thumbTimer); thumbTimer = setTimeout(renderThumbs, 150); }
function renderThumbs() {
  if (!thumbsDirty || currentTab !== 'design') return; thumbsDirty = false;
  const curDefault = state.design.accent.toLowerCase() === TPL[state.design.template].accent.toLowerCase();
  for (const el of $$('[data-thumb]')) {
    const t = TPL[el.dataset.thumb];
    const s = { ...state, design: { ...state.design, template: t.id, page: 'A4', accent: curDefault ? t.accent : state.design.accent } };
    el.innerHTML = `<span class="tpl-scale">${renderResume(s, { label: false })}</span>`;
    const w = el.clientWidth || 160; el.firstElementChild.style.transform = `scale(${w / (210 * MM)})`;
  }
}
function setTemplate(id) {
  const prev = TPL[state.design.template];
  if (state.design.accent.toLowerCase() === prev.accent.toLowerCase()) state.design.accent = TPL[id].accent;
  state.design.template = id;
  save(); renderDesign(); renderEditor(); renderPreview();
  $(`[data-tpl="${id}"]`)?.focus({ preventScroll: true });
  toast(`${TPL[id].name} template applied`);
}
function onDesignClick(e) {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.tpl) { setTemplate(b.dataset.tpl); if (matchMedia('(max-width: 899px)').matches) setView('preview'); return; }
  if (b.dataset.accent) { state.design.accent = b.dataset.accent; save(); renderDesign(); renderPreview(); focusD(`[data-accent="${b.dataset.accent}"]`); return; }
  if (b.dataset.set) { state.design[b.dataset.set] = b.dataset.val; save(); renderDesign(); renderPreview(); focusD(`[data-set="${b.dataset.set}"][data-val="${b.dataset.val}"]`); }
}
function focusD(sel) { const st = $('#design-pane').scrollTop; $(sel)?.focus({ preventScroll: true }); $('#design-pane').scrollTop = st; }
function onDesignInput(e) {
  const t = e.target;
  if (t.id === 'accent-custom') { state.design.accent = t.value; $$('.sw.on').forEach((x) => x.classList.remove('on')); t.parentElement.classList.add('on'); t.parentElement.style.setProperty('--c', t.value); }
  else if (t.id === 'font-sel') state.design.font = t.value;
  else if (t.id === 'scale-in') { state.design.scale = Number(t.value); $('#scale-val').textContent = Math.round(state.design.scale * 100) + '%'; }
  else if (t.id === 'photo-toggle') state.design.photo = t.checked;
  else return;
  save(); schedulePreview();
}

/* ---------- Tabs, views, menus ---------- */
function setTab(tab) {
  currentTab = tab;
  for (const b of $$('[role="tab"]')) { const on = b.dataset.tab === tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
  $('#content-pane').hidden = tab !== 'content'; $('#design-pane').hidden = tab !== 'design';
  if (tab === 'design') { if (!$('#design-pane').children.length) renderDesign(); else { thumbsDirty = true; scheduleThumbs(); } }
}
function setView(v) {
  document.body.dataset.view = v;
  for (const b of $$('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === v));
  if (v === 'preview') requestAnimationFrame(fitPreview);
}
function toast(msg, action) {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) { const b = document.createElement('button'); b.type = 'button'; b.textContent = action.action; b.onclick = () => { action.fn(); t.remove(); }; t.appendChild(b); }
  const box = $('#toasts'); while (box.children.length > 2) box.firstElementChild.remove();
  box.appendChild(t);
  const ms = action ? 5000 : 2200;
  setTimeout(() => t.classList.add('out'), ms); setTimeout(() => t.remove(), ms + 400);
}
function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const slug = (s) => String(s || 'resume').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resume';
function exportJSON() { download(`${slug(state.personal.name)}-resume.json`, JSON.stringify(state, null, 2), 'application/json'); toast('Exported as JSON'); }
function importJSON(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data || typeof data !== 'object' || !('personal' in data || 'experience' in data)) throw new Error('shape');
      state = normalize(data); commit(); if (currentTab === 'design') renderDesign(); toast('Resume imported');
    } catch { toast('That file is not a Resume Studio JSON export.'); }
  };
  r.readAsText(file);
}
function menuAction(a) {
  closeMenu();
  if (a === 'sample') { if (!confirm('Replace your current content with the sample resume?')) return; state = sampleState(state.design); openPanels = new Set(['personal']); commit(); toast('Sample loaded'); }
  else if (a === 'clear') { if (!confirm('Clear the sample and all content? Your template and design stay.')) return; const d = state.design; state = blankState(); state.design = d; openPanels = new Set(['personal']); commit(); toast('Cleared. Start typing!'); }
  else if (a === 'fresh') { if (!confirm('Start fresh? This removes all content and resets the design.')) return; state = blankState(); openPanels = new Set(['personal']); commit(); renderDesign(); toast('Fresh start'); }
  else if (a === 'export') exportJSON();
  else if (a === 'import') $('#import-input').click();
  else if (a === 'about') openAbout();
  else if (a === 'aboutus') openAboutUs();
  else if (a === 'support') openSupport();
  else if (a === 'feedback') openFeedback();
}
function openMenu() { $('#menu').hidden = false; $('#menu-btn').setAttribute('aria-expanded', 'true'); $('#menu button').focus(); }
function closeMenu() { $('#menu').hidden = true; $('#menu-btn').setAttribute('aria-expanded', 'false'); }

function openAbout() {
  const c = DEV_CONFIG;
  $('#about-body').innerHTML = `
    ${c.photo
  ? `<img class="dev-avatar dev-avatar-img" src="${esc(c.photo)}" alt="${esc(c.name)}">`
  : `<div class="dev-avatar" aria-hidden="true">${esc(initials(c.name))}</div>`}

    <h2 id="about-title">${esc(c.name)}</h2><p class="dev-role">${esc(c.role)}</p>
    <p class="dev-note">I built QuickResume so anyone can make a great resume for free. No sign-up, no watermark, and your data never leaves your browser.</p>
    <div class="dev-links">
      <a class="dev-btn" href="${esc(c.github)}" target="_blank" rel="noopener">${icon('github')}<span>GitHub</span></a>
      <a class="dev-btn" href="mailto:${esc(c.email)}">${icon('mail')}<span>Email</span></a>
      ${c.linkedin ? `<a class="dev-btn" href="${esc(c.linkedin)}" target="_blank" rel="noopener">${icon('linkedin')}<span>LinkedIn</span></a>` : ''}
    </div>
    ${c.portfolio ? `<a class="bmc" href="${esc(c.portfolio)}" target="_blank" rel="noopener"><span aria-hidden="true">🌐</span> Visit my portfolio</a>` : ''}
    <p class="dev-mail">${esc(c.email)}</p>`;
  const dlg = $('#about'); if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
}

function openAboutUs() {
  $('#aboutus-body').innerHTML = `
    <h2 id="aboutus-title">About QuickResume</h2>
    <p>QuickResume is a free, no‑login resume builder. It runs entirely in the browser, storing data locally so nothing ever leaves your device.</p>
    <p>Features include 12 modern templates, live side‑by‑side preview, customizable fonts, colours, spacing, and PDF export via the browser’s print engine.</p>`;
  const dlg = $('#aboutus'); if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
}

function openSupport() {
  const dlg = $('#support');
  dlg.innerHTML = `
    <button type="button" class="btn-icon dlg-close" id="support-close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <div class="support-card" aria-labelledby="support-title">
      <div class="support-icon" aria-hidden="true">♡</div>
      <h2 id="support-title">Support QuickResume 💝</h2>
      <p>We keep QuickResume free, private and accessible for everyone.</p>
      <p>Your contribution helps us maintain the project, improve the templates and keep building useful features.</p>
      <strong>Every contribution helps us make the platform better. 🙏</strong>
      <div class="support-options">
        ${[49, 69, 99, 149, 499, 999, 1999].map((amount) => `<button type="button" class="support-option" data-support-amount="${amount}"><span aria-hidden="true">♡</span> ₹${amount}</button>`).join('')}
      </div>
      <button type="button" class="support-skip" data-support-skip>Maybe later</button>
    </div>`;
  $('#support-close').addEventListener('click', () => dlg.close());
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
}

function handleSupportClick(e) {
  const amountButton = e.target.closest('[data-support-amount]');
  if (amountButton) {
    const amount = amountButton.dataset.supportAmount;
    const upiStr = `upi://pay?pa=${encodeURIComponent(DEV_CONFIG.upiId)}&pn=${encodeURIComponent(DEV_CONFIG.name)}&am=${amount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiStr)}&bgcolor=ffffff&color=000000&margin=12`;
    const card = $('#support .support-card');
    card.innerHTML = `
      <button type="button" class="support-back" id="support-back">← Back</button>
      <div class="support-qr-amount">₹${amount}</div>
      <img class="support-qr-img" src="${qrUrl}" alt="UPI QR code for ₹${amount}" width="220" height="220" onerror="this.hidden=true;this.nextElementSibling.hidden=false">
      <p class="support-qr-error" hidden>⚠️ QR couldn't load — use the button below or check your connection.</p>
      <p class="support-qr-hint">📷 Scan with GPay, PhonePe, Paytm or any UPI app</p>
      <a class="support-upi-btn" href="${upiStr}">📱 Open UPI App directly</a>
    `;
    $('#support-back').addEventListener('click', openSupport);
    return;
  }
  if (e.target.closest('[data-support-skip]')) $('#support').close();
}

function openFeedback() {
  const dlg = $('#feedback');
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  dlg.querySelector('[name="message"]').focus();
}

function sendFeedback(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const type = data.get('type');
  const rating = data.get('rating');
  const message = data.get('message');
  const subject = encodeURIComponent(`Resume Studio feedback: ${type}`);
  const body = encodeURIComponent(`Feedback type: ${type}\nRating: ${rating}/5\n\n${message}`);
  window.location.href = `mailto:${DEV_CONFIG.email}?subject=${subject}&body=${body}`;
  $('#feedback').close();
  form.reset();
  toast('Your email app is ready to send the feedback');
}

async function downloadPDF() {
  renderPreview();
  const old = document.title; document.title = `${state.personal.name.trim() || 'My'} Resume`;
  if (!localStorage.getItem('rs-pdf-tip')) { toast('In the print window, choose "Save as PDF"'); try { localStorage.setItem('rs-pdf-tip', '1'); } catch {} }
  try { await document.fonts.ready; } catch {}
  await Promise.all($$('#print-root img').map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  setTimeout(() => { window.print(); setTimeout(() => { document.title = old; }, 800); }, 80);
}

/* ---------- Boot ---------- */
function boot() {
  renderEditor(); setTab('content'); setView('edit'); renderPreview();
  const cp = $('#content-pane');
  cp.addEventListener('input', onEditorInput);
  cp.addEventListener('click', onEditorClick);
  cp.addEventListener('toggle', trackPanels, true);
  cp.addEventListener('change', (e) => { if (e.target.id === 'photo-input') { onPhoto(e.target.files[0]); e.target.value = ''; } });
  const dp = $('#design-pane');
  dp.addEventListener('click', onDesignClick); dp.addEventListener('input', onDesignInput);
  for (const b of $$('[role="tab"]')) b.addEventListener('click', () => setTab(b.dataset.tab));
  $('.tabs').addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = currentTab === 'content' ? 'design' : 'content'; setTab(n); $(`[data-tab="${n}"]`).focus(); } });
  for (const b of $$('[data-view]')) b.addEventListener('click', () => setView(b.dataset.view));
  $('#templates-btn').addEventListener('click', () => { setTab('design'); setView('edit'); $('#design-pane').scrollTop = 0; });
  $$('.pdf-btn').forEach((b) => b.addEventListener('click', downloadPDF));
  // Info & About button
  const infoBtn = $('#info-btn');
  const infoAvatar = $('#info-menu-avatar');
  if (infoAvatar) { infoAvatar.src = 'assets/logo.png'; infoAvatar.alt = 'QuickResume'; infoAvatar.hidden = false; }

  function openInfoMenu() { $('#info-menu').hidden = false; infoBtn.setAttribute('aria-expanded', 'true'); }
  function closeInfoMenu() { $('#info-menu').hidden = true; infoBtn.setAttribute('aria-expanded', 'false'); }
  infoBtn.addEventListener('click', (e) => { e.stopPropagation(); $('#info-menu').hidden ? openInfoMenu() : closeInfoMenu(); });
  $('#info-menu').addEventListener('click', (e) => { const b = e.target.closest('[data-menu]'); if (b) { closeInfoMenu(); menuAction(b.dataset.menu); } });
  document.addEventListener('click', (e) => { if (!$('#info-menu').hidden && !e.target.closest('#info-wrap')) closeInfoMenu(); });

  $('#about-close').addEventListener('click', () => $('#about').close());
  $('#about').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('#aboutus-close').addEventListener('click', () => $('#aboutus').close());
  $('#aboutus').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('#support').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
    handleSupportClick(e);
  });
  $('#feedback-close').addEventListener('click', () => $('#feedback').close());
  $('#feedback').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('#feedback-form').addEventListener('submit', sendFeedback);

  $('#menu-btn').addEventListener('click', (e) => { e.stopPropagation(); $('#menu').hidden ? openMenu() : closeMenu(); });
  $('#menu').addEventListener('click', (e) => { const b = e.target.closest('[data-menu]'); if (b) menuAction(b.dataset.menu); });
  $('#menu').addEventListener('keydown', (e) => {
    const items = $$('#menu button'), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Escape') { closeMenu(); $('#menu-btn').focus(); }
  });
  document.addEventListener('click', (e) => { if (!$('#menu').hidden && !e.target.closest('#menu')) closeMenu(); });
  $('#import-input').addEventListener('change', (e) => { importJSON(e.target.files[0]); e.target.value = ''; });
  if ('ResizeObserver' in window) new ResizeObserver(() => fitPreview()).observe($('#preview-scroll'));
  else window.addEventListener('resize', fitPreview);
  if (document.fonts) document.fonts.ready.then(fitPreview);
  window.addEventListener('beforeprint', () => { $('#print-root').innerHTML = renderResume(state, { label: false }); applyPrintPageCSS(); });
  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY && e.newValue) { try { state = normalize(JSON.parse(e.newValue)); renderEditor(); renderPreview(); } catch {} } });
  setSaveStatus('Saved');
}
boot();
