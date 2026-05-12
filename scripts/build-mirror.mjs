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
  [data-disabled-dropdown-link="true"]{cursor:default}
  [class*="sticky__ContainerButton"]{display:none!important}
  .polnation-search-results{
    position:absolute;
    left:0;
    right:0;
    top:calc(100% + 8px);
    z-index:5000;
    display:none;
    border:1px solid rgba(255,255,255,.32);
    border-radius:14px;
    background:#001f43;
    box-shadow:0 18px 40px rgba(0,0,0,.32);
    overflow:hidden;
  }
  .polnation-search-results.is-visible{display:block}
  .polnation-search-result{
    display:flex;
    align-items:center;
    gap:12px;
    width:100%;
    min-height:58px;
    padding:12px 18px;
    color:#fff;
    text-decoration:none;
    font:700 16px/1.2 Arial,sans-serif;
    background:transparent;
    border:0;
    cursor:pointer;
    text-align:left;
  }
  .polnation-search-result:hover,
  .polnation-search-result:focus{background:rgba(14,201,172,.12);outline:none}
  .polnation-search-result img{
    width:34px;
    height:34px;
    border-radius:8px;
    object-fit:contain;
    flex:0 0 auto;
  }
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
  const polnationUrl = "/audits/polnation/";
  const polnationLogo = "/assets/polnation-logo.png";
  const pick = () => window.innerWidth <= 800 ? "snapshot-mobile" : "snapshot-desktop";
  let active = "";
  const normalize = (value) => (value || "").trim().toLowerCase().replace(/\\s+/g, "");
  const textOf = (el) => (el?.textContent || "").replace(/\\s+/g, " ").trim();
  const removeContactAndTelegram = () => {
    for (const el of root.querySelectorAll("a, button")) {
      if (textOf(el) === "Contact Us") {
        (el.closest("li") || el).remove();
      }
    }

    for (const el of root.querySelectorAll('[class*="sticky__ContainerButton"]')) {
      (el.closest(".fixed") || el.parentElement || el).remove();
    }
  };
  const disableDropdownLinks = () => {
    for (const el of root.querySelectorAll('[class*="dropdown__StyledRelativeBox"] > a, [class*="dropdown__StyledDropdownContainer"] a')) {
      el.dataset.disabledDropdownLink = "true";
      el.removeAttribute("href");
      el.removeAttribute("target");
      el.removeAttribute("rel");
    }
  };
  const wirePolnationSearch = () => {
    const input = root.querySelector('input[placeholder="Search project, contract or wallet"]');
    if (!input) return;

    const container = input.closest(".StyledTextInput__StyledTextInputContainer-sc-1x30a0s-1") || input.parentElement;
    if (!container) return;
    container.style.position = "relative";

    let results = container.querySelector(".polnation-search-results");
    if (!results) {
      results = document.createElement("div");
      results.className = "polnation-search-results";
      results.innerHTML = '<a class="polnation-search-result" href="' + polnationUrl + '"><img src="' + polnationLogo + '" alt="Polnation"><span>Polnation</span></a>';
      container.appendChild(results);
    }

    const update = () => {
      const query = normalize(input.value);
      const matched = query.length > 0 && "polnation".includes(query);
      results.classList.toggle("is-visible", matched);
    };

    input.addEventListener("input", update);
    input.addEventListener("focus", update);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const query = normalize(input.value);
      if (!query || !"polnation".includes(query)) return;
      event.preventDefault();
      window.location.href = polnationUrl;
    });
    document.addEventListener("click", (event) => {
      if (container.contains(event.target)) return;
      results.classList.remove("is-visible");
    });
    update();
  };
  const render = () => {
    const next = pick();
    if (next === active) return;
    active = next;
    style.textContent = document.getElementById(next.replace("snapshot", "css")).content.textContent;
    root.innerHTML = document.getElementById(next).innerHTML;
    removeContactAndTelegram();
    disableDropdownLinks();
    wirePolnationSearch();
  };
  render();
  root.addEventListener("click", (event) => {
    if (event.target.closest('[data-disabled-dropdown-link="true"]')) {
      event.preventDefault();
      return;
    }

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
