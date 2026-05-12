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
    requestAnimationFrame(drawRadarCharts);
  };
  render();
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
