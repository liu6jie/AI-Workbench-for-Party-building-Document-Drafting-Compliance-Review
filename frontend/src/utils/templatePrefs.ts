const FAVORITES_KEY = 'party_template_favorites_v1';
const RECENT_KEY = 'party_template_recent_v1';
const MAX_RECENT = 3;

export function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function toggleFavorite(key: string): string[] {
  const current = getFavorites();
  const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function pushRecent(key: string): string[] {
  const current = getRecent().filter((k) => k !== key);
  const next = [key, ...current].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
