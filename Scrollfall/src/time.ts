// Wall-clock time goes through here so tests can fake it (Playwright's page.clock fakes Date.now).
export function now(): number {
  return Date.now();
}

// YYYY-MM-DD in the player's local time zone.
export function localDateKey(ms: number = now()): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
