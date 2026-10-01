// Automated scanners request other platforms' files (WordPress, PHP, leaked
// configs). None of these exist on a Next.js site, so the proxy answers them
// with a bare 404 instead of rendering the full not-found page each time.
const PROBE_EXTENSION = /\.(?:php\d?|aspx?|jsp|cgi|env|sql|bak|old|ini|yml|yaml|config|sh)$/i;
const PROBE_PREFIX = /^\/(?:wp-|wordpress|xmlrpc|phpmyadmin|pma|cgi-bin|vendor\/|\.env|\.git|\.svn|\.hg|\.aws|\.ds_store)/i;

/** True for paths that only automated vulnerability scanners request. */
export function isScannerProbe(pathname: string) {
  return PROBE_PREFIX.test(pathname) || PROBE_EXTENSION.test(pathname);
}
