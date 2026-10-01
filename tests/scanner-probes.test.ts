import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

import { isScannerProbe } from "@/lib/scanner-probes";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

describe("scanner probes", () => {
  it("catches common vulnerability-scanner paths", () => {
    for (const path of [
      "/wp-login.php",
      "/wp-admin/install.php",
      "/wordpress/wp-includes/wlwmanifest.xml",
      "/xmlrpc.php",
      "/index.php",
      "/admin/config.php7",
      "/.env",
      "/.env.production",
      "/.git/config",
      "/phpmyadmin/",
      "/cgi-bin/luci",
      "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php",
      "/backup.sql",
      "/config.yml",
      "/web.config",
      "/default.aspx",
    ]) {
      expect(isScannerProbe(path), path).toBe(true);
    }
  });

  it("never matches the site's own pages and files", () => {
    for (const path of [
      "/",
      "/shop",
      "/shop/unknown-mark-tee",
      "/about",
      "/admin",
      "/admin/subscribers/export",
      "/account/settings",
      "/auth/confirm",
      "/api/contact",
      "/robots.txt",
      "/sitemap.xml",
      "/manifest.webmanifest",
      "/.well-known/security.txt",
    ]) {
      expect(isScannerProbe(path), path).toBe(false);
    }
  });

  it("never matches a file served from public/", () => {
    const publicDir = join(process.cwd(), "public");
    for (const file of files(publicDir)) {
      const path = `/${relative(publicDir, file).split(sep).join("/")}`;
      expect(isScannerProbe(path), path).toBe(false);
    }
  });
});
