import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const ORIGIN = "https://www.cyberscope.io";

const sourcePath = new URL("../reference/source.html", import.meta.url);
const desktopHeadPath = new URL("../reference/head-desktop.html", import.meta.url);
const mobileHeadPath = new URL("../reference/head-mobile.html", import.meta.url);
const desktopPath = new URL("../reference/next-desktop.html", import.meta.url);
const mobilePath = new URL("../reference/next-mobile.html", import.meta.url);
const desktopCssPath = new URL("../reference/css-desktop.css", import.meta.url);
const mobileCssPath = new URL("../reference/css-mobile.css", import.meta.url);
const outputPath = new URL("../index.html", import.meta.url);
const auditsOutputPath = new URL("../audits/index.html", import.meta.url);
const POLNATION_LOGO = "/assets/polnation-logo.png";
const LOCAL_ROOT_PATHS = [
  "assets/polnation-logo.png",
  "audits/polnation",
  "audits/polnation/"
];
const LOCAL_ROOT_PATTERN = LOCAL_ROOT_PATHS.map((path) => path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

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

function customizePolnationProject(markup) {
  return markup
    .replace(/\/audits\/moonmoon/g, "/audits/polnation/")
    .replace(/Moon Moon/g, "Polnation")
    .replace(/\balt=(["'])Polnation\1([^>]*?)\bsrcset=(["'])[^"']*1777323501819_686022d9-0a83-4763-9dea-6d62540e72d5[^"']*\3/g, `alt=$1Polnation$1$2srcset=$3${POLNATION_LOGO} 1x, ${POLNATION_LOGO} 2x$3`)
    .replace(/\bsrcset=(["'])[^"']*1777323501819_686022d9-0a83-4763-9dea-6d62540e72d5[^"']*\1/g, `srcset=$1${POLNATION_LOGO} 1x, ${POLNATION_LOGO} 2x$1`)
    .replace(/\bsrc=(["'])[^"']*1777323501819_686022d9-0a83-4763-9dea-6d62540e72d5[^"']*\1/g, `src=$1${POLNATION_LOGO}$1`);
}

function stripScripts(markup) {
  return markup
    .replace(/<link[^>]+rel=("|')preload\1[^>]+as=("|')script\2[^>]*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

const source = readFileSync(sourcePath, "utf8");
const sourceHead = source.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
const desktopHead = readFileSync(desktopHeadPath, "utf8");
const mobileHead = readFileSync(mobileHeadPath, "utf8");
let head = stripScripts(rewriteUrls([sourceHead, desktopHead, mobileHead].join("\n")));

const desktop = stripScripts(rewriteUrls(customizePolnationProject(readFileSync(desktopPath, "utf8"))));
const mobile = stripScripts(rewriteUrls(customizePolnationProject(readFileSync(mobilePath, "utf8"))));
const desktopCss = rewriteUrls(readFileSync(desktopCssPath, "utf8"));
const mobileCss = rewriteUrls(readFileSync(mobileCssPath, "utf8"));

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
  root.addEventListener("click", (event) => {
    const button = event.target.closest('button[title^="Scroll"]');
    if (!button) return;
    const stack = button.closest(".scrollable__StyledStack-sc-2609468f-0");
    const scroller = stack?.querySelector(".NoScrollbarBox-sc-17ff71bb-0");
    if (!scroller) return;
    event.preventDefault();
    scroller.scrollBy({ left: 320, behavior: "smooth" });
  });
  let timer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  });
})();
</script>
</body>
</html>`;

mkdirSync(new URL("../audits", import.meta.url), { recursive: true });
writeFileSync(outputPath, html, "utf8");
writeFileSync(auditsOutputPath, html, "utf8");
