import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ORIGIN = "https://www.cyberscope.io";
const IN = new URL("../reference/polnation-detail/", import.meta.url);

const outputs = [
  new URL("../audits/polnation/index.html", import.meta.url),
  new URL("../audits/moonmoon/index.html", import.meta.url)
];
const LOCAL_ROOT_PATHS = ["assets/polnation-logo.png"];
const LOCAL_ROOT_PATTERN = LOCAL_ROOT_PATHS.map((path) => path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

function read(name) {
  return readFileSync(new URL(name, IN), "utf8");
}

function rewriteUrls(markup) {
  const localRootPath = new RegExp(`^/(${LOCAL_ROOT_PATTERN})(?:[?#].*)?$`);

  let html = markup.replace(
    /\b(href|src|poster|action)=("|')\/(?!\/)([^"']*)/g,
    (match, attr, quote, path) => {
      const value = `/${path}`;
      return localRootPath.test(value) ? match : `${attr}=${quote}${ORIGIN}${value}`;
    }
  );

  html = html.replace(/\b(srcset|srcSet)=("|')([^"']+)\2/g, (match, name, quote, value) => {
    const rewritten = value.replace(/(^|,\s*)\/(?!\/)([^,\s]+)/g, (item, prefix, path) => {
      const url = `/${path}`;
      return localRootPath.test(url) ? item : `${prefix}${ORIGIN}${url}`;
    });
    return `${name}=${quote}${rewritten}${quote}`;
  });

  return html.replace(
    /url\((["']?)\/(?!\/)([^)"']+)/g,
    (match, quote, path) => {
      const value = `/${path}`;
      return localRootPath.test(value) ? match : `url(${quote}${ORIGIN}${value}`;
    }
  );
}

function stripScripts(markup) {
  return markup
    .replace(/<link[^>]+rel=("|')preload\1[^>]+as=("|')script\2[^>]*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

const head = stripScripts(rewriteUrls([read("head-desktop.html"), read("head-mobile.html")].join("\n")));
const desktop = stripScripts(rewriteUrls(read("next-desktop.html")));
const mobile = stripScripts(rewriteUrls(read("next-mobile.html")));
const desktopCss = rewriteUrls(read("css-desktop.css"));
const mobileCss = rewriteUrls(read("css-mobile.css"));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
${head}
<meta name="robots" content="noindex,nofollow">
<style>
  template{display:none!important}
  .dropdown__StyledRelativeBox-sc-77781fc3-1:hover .dropdown__StyledDropdownContainer-sc-f41f1f99-0{display:flex}
</style>
<style id="snapshot-css"></style>
</head>
<body>
<div id="__next"></div>
<template id="snapshot-desktop">${desktop}</template>
<template id="snapshot-mobile">${mobile}</template>
<template id="css-desktop">${desktopCss}</template>
<template id="css-mobile">${mobileCss}</template>
<script>
(() => {
  const root = document.getElementById("__next");
  const style = document.getElementById("snapshot-css");
  const pick = () => window.innerWidth <= 800 ? "snapshot-mobile" : "snapshot-desktop";
  let active = "";
  const render = () => {
    const next = pick();
    if (next === active) return;
    active = next;
    style.textContent = document.getElementById(next.replace("snapshot", "css")).content.textContent;
    root.innerHTML = document.getElementById(next).innerHTML;
  };
  render();
  let timer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  });
})();
</script>
</body>
</html>`;

for (const output of outputs) {
  mkdirSync(new URL(".", output), { recursive: true });
  writeFileSync(output, html, "utf8");
  console.log(output.pathname);
}
