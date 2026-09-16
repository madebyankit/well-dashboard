/**
 * Tiny localStorage helpers.
 *
 * This is a front-end demo with no backend database, so the user directory,
 * task list and appearance preferences are persisted in the browser. Every call
 * is guarded because localStorage is unavailable during SSR and can throw in
 * private-browsing modes.
 */

export function loadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — preferences simply will not persist */
  }
}

export function removeKey(key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  APPEARANCE: 'wpm.appearance',
  SESSION: 'wpm.session',
  USERS: 'wpm.users',
  TASKS: 'wpm.tasks',
};
