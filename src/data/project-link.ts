// Project link URL contract: an absolute HTTPS source, or a root-relative
// path that resolves back to this site. Resolution uses the same WHATWG URL
// parser as browsers, so protocol-relative (`//host`) and backslash
// (`/\host`) relative forms resolve cross-origin and are rejected here;
// absolute references must still be HTTPS. Kept import-free so tests can
// pin the contract without loading Astro or the content layer.
const siteOrigin = 'https://local.invalid';

export function isProjectLinkTarget(value: string): boolean {
  if (value.startsWith('/')) {
    try { return new URL(value, siteOrigin).origin === siteOrigin; } catch { return false; }
  }
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
