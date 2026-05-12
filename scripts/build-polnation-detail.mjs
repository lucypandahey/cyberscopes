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
  [data-disabled-dropdown-link="true"]{cursor:default}
  [class*="sticky__ContainerButton"]{display:none!important}
  .copy-toast{
    position:fixed;
    left:50%;
    bottom:32px;
    z-index:9999;
    transform:translate(-50%,16px);
    border:1px solid rgba(14,201,172,.55);
    border-radius:8px;
    background:rgba(2,27,55,.96);
    color:#fff;
    font:600 14px/1.2 Arial,sans-serif;
    padding:10px 16px;
    box-shadow:0 12px 36px rgba(0,0,0,.35);
    opacity:0;
    pointer-events:none;
    transition:opacity .18s ease, transform .18s ease;
  }
  .copy-toast.is-visible{opacity:1;transform:translate(-50%,0)}
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
  const homeUrl = "https://cyberscopes.uk/";
  const pick = () => window.innerWidth <= 800 ? "snapshot-mobile" : "snapshot-desktop";
  const polnationScores = {
    Fundamentals: 74,
    Vitals: 67
  };
  let active = "";
  let toastTimer = 0;
  const textOf = (el) => (el?.textContent || "").replace(/\\s+/g, " ").trim();
  const showCopyToast = () => {
    let toast = document.querySelector(".copy-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "copy-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.textContent = "copied";
      document.body.appendChild(toast);
    }
    clearTimeout(toastTimer);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1400);
  };
  const copyText = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    showCopyToast();
  };
  const removeContactAndTelegram = () => {
    for (const el of root.querySelectorAll("a, button")) {
      if (textOf(el) === "Contact Us") {
        (el.closest("li") || el).remove();
      }
    }

    for (const el of root.querySelectorAll('a[href*="t.me/"], img[alt*="Telegram" i]')) {
      (el.closest("a") || el).remove();
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
  const setFirstPercentAfterLabel = (section, label, value) => {
    const elements = Array.from(section.querySelectorAll("*"));
    const labelIndex = elements.findIndex((el) => textOf(el) === label);
    if (labelIndex < 0) return;

    for (const el of elements.slice(labelIndex + 1)) {
      if (/^\\d+%$/.test(textOf(el))) {
        el.textContent = value + "%";
        return;
      }
    }
  };
  const updatePolnationScores = () => {
    for (const [name, value] of Object.entries(polnationScores)) {
      for (const wrapper of root.querySelectorAll('[class*="radar__LabelTextWrapper"]')) {
        if (textOf(wrapper.querySelector("h3")) === name) {
          const score = wrapper.querySelector("span");
          if (score) score.textContent = value + "%";
        }
      }

      const section = root.querySelector("#" + name.toLowerCase());
      if (section) setFirstPercentAfterLabel(section, "Score", value);
    }
  };
  const wireHomeNavigation = () => {
    const setHomeLink = (el) => {
      if (!el) return;
      el.setAttribute("href", homeUrl);
      el.removeAttribute("target");
      el.removeAttribute("rel");
    };

    for (const el of root.querySelectorAll("header a")) {
      setHomeLink(el);
      el.dataset.homeRedirect = "true";
    }

    for (const el of root.querySelectorAll("header button")) {
      el.dataset.homeRedirect = "true";
    }

    for (const el of root.querySelectorAll('nav[aria-label="Breadcrumb"] a')) {
      const label = (el.textContent || "").replace(/\\s+/g, " ").trim();
      if (label === "Home" || label === "Audits") {
        setHomeLink(el);
        el.dataset.homeRedirect = "true";
      }
    }
  };
  const drawRadarCharts = () => {
    const preferredOrder = ["Security", "Vitals", "Market", "Decentralization", "Fundamentals"];
    for (const wrapper of document.querySelectorAll('[class*="radar__RadarWrapper"]')) {
      const canvas = wrapper.querySelector("canvas");
      if (!canvas) continue;

      const labelMap = new Map();
      for (const label of wrapper.querySelectorAll('[class*="radar__LabelTextWrapper"]')) {
        const name = label.querySelector("h3")?.textContent?.trim();
        const valueText = label.querySelector("span")?.textContent || "";
        const value = Number.parseFloat(valueText.replace("%", ""));
        if (name && Number.isFinite(value)) labelMap.set(name, value);
      }

      const values = preferredOrder
        .filter((name) => labelMap.has(name))
        .map((name) => ({ name, value: labelMap.get(name) }));
      if (values.length < 3) continue;

      const rect = canvas.getBoundingClientRect();
      const cssWidth = Math.max(1, Math.round(rect.width || Number(canvas.getAttribute("width")) || 180));
      const cssHeight = Math.max(1, Math.round(rect.height || Number(canvas.getAttribute("height")) || 180));
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const pixelWidth = Math.round(cssWidth * dpr);
      const pixelHeight = Math.round(cssHeight * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const cx = cssWidth / 2;
      const cy = cssHeight / 2;
      const radius = Math.min(cssWidth, cssHeight) * 0.39;
      const startAngle = -Math.PI / 2;
      const step = (Math.PI * 2) / values.length;

      const point = (index, ratio) => {
        const angle = startAngle + index * step;
        return {
          x: cx + Math.cos(angle) * radius * ratio,
          y: cy + Math.sin(angle) * radius * ratio
        };
      };

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(248, 248, 248, 0.32)";
      ctx.lineWidth = 1;

      for (let ring = 1; ring <= 5; ring += 1) {
        ctx.beginPath();
        for (let i = 0; i < values.length; i += 1) {
          const p = point(i, ring / 5);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      for (let i = 0; i < values.length; i += 1) {
        const p = point(i, 1);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      const polygon = values.map((item, index) => point(index, Math.max(0, Math.min(100, item.value)) / 100));
      ctx.beginPath();
      polygon.forEach((p, index) => {
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(14, 201, 172, 0.55)";
      ctx.strokeStyle = "#0EC9AC";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      for (const p of polygon) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#0EC9AC";
        ctx.strokeStyle = "#E6FFF9";
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      }
    }
  };
  const render = () => {
    const next = pick();
    if (next === active) return;
    active = next;
    style.textContent = document.getElementById(next.replace("snapshot", "css")).content.textContent;
    root.innerHTML = document.getElementById(next).innerHTML;
    removeContactAndTelegram();
    wireHomeNavigation();
    disableDropdownLinks();
    updatePolnationScores();
    requestAnimationFrame(drawRadarCharts);
  };
  render();
  root.addEventListener("click", (event) => {
    if (event.target.closest('[data-disabled-dropdown-link="true"]')) {
      event.preventDefault();
      return;
    }

    const homeControl = event.target.closest("[data-home-redirect='true']");
    if (homeControl) {
      event.preventDefault();
      window.location.href = homeUrl;
      return;
    }

    const button = event.target.closest("button");
    if (!button) return;
    const copyIcon = button.querySelector('img[alt="Copy"]');
    const titledAddress = button.querySelector("span[title]");
    if (!copyIcon && !titledAddress) return;
    event.preventDefault();
    const value = titledAddress?.getAttribute("title") || titledAddress?.textContent?.trim();
    copyText(value);
  });
  let timer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      render();
      requestAnimationFrame(drawRadarCharts);
    }, 120);
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
