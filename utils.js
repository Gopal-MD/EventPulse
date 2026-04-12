/**
 * SmartVenue — Utility functions
 * Generic helpers for DOM, Logging, and Data
 */

const Logger = {
  info: (ctx, ...m) => console.log(`%c[${ctx}]`, 'color:#1E90FF; font-weight:bold;', ...m),
  debug: (ctx, ...m) => console.debug(`[${ctx}]`, ...m),
  warn: (ctx, ...m) => console.warn(`[${ctx}]`, ...m),
  error: (ctx, ...m) => console.error(`%c[${ctx}]`, 'color:#FF4D4D; font-weight:bold;', ...m)
};

const getEl = (id) => document.getElementById(id);
const queryAll = (sel) => document.querySelectorAll(sel);
const createElement = (tag, opt = {}) => {
  const el = document.createElement(tag);
  if (opt.className) el.className = opt.className;
  if (opt.html) el.innerHTML = opt.html;
  if (opt.attrs) Object.entries(opt.attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

const showToast = (msg, type = 'info') => {
  const t = getEl('toast');
  t.textContent = msg;
  t.style.background = type === 'success' ? 'var(--success)' : 
                       type === 'error' ? 'var(--danger)' : 'var(--electric-blue)';
  t.hidden = false;
  setTimeout(() => t.hidden = true, 3000);
};

const scrollToBottom = (id) => {
  const el = getEl(id);
  if (el) el.scrollTop = el.scrollHeight;
};

const debounce = (fn, ms) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
};

const LoggerAudit = () => {
  Logger.info('Audit', 'SmartVenue Core Utilities Loaded');
};
