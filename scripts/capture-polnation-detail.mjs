import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const TARGET = "https://www.cyberscope.io/audits/moonmoon";
const OUT = "reference/polnation-detail";
const POLNATION_LOGO = "/assets/polnation-logo.png";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyTextReplacements(value) {
  if (!value) return value;
  const replacements = [
    [new RegExp(escapeRegex("moonmoontoken.com"), "gi"), "polnation.com"],
    [/MoonMoonTheMeme/g, "Polnation"],
    [/Moon Moon/g, "Polnation"],
    [/MoonMoon/g, "Polnation"],
    [/MOONMOON/g, "POLNATION"],
    [/moonmoon/g, "polnation"],
    [/\$Polnation/g, "$POLNATION"],
    [/polnationtoken\.com/gi, "polnation.com"],
    [/Polnation \(\$POLNATION\) is the ultimate meme wolf dog[\s\S]*?(?=(Show More|$))/gi, "Polnation ($POLNATION) is a community-driven Web3 project built around participation, transparent token utilities, and ecosystem growth. "],
    [/ultimate meme wolf dog of the crypto wilderness[\s\S]*?(?=(Show More|$))/gi, "community-driven Web3 project built around participation, transparent token utilities, and ecosystem growth. "]
  ];

  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

async function customizePage(page) {
  await page.evaluate(({ logo }) => {
    const applyTextReplacements = (value) => {
      if (!value) return value;
      return value
        .replace(/moonmoontoken\.com/gi, "polnation.com")
        .replace(/MoonMoonTheMeme/g, "Polnation")
        .replace(/Moon Moon/g, "Polnation")
        .replace(/MoonMoon/g, "Polnation")
        .replace(/MOONMOON/g, "POLNATION")
        .replace(/moonmoon/g, "polnation")
        .replace(/\$Polnation/g, "$POLNATION")
        .replace(/polnationtoken\.com/gi, "polnation.com")
        .replace(/Polnation \(\$POLNATION\) is the ultimate meme wolf dog[\s\S]*?(?=(Show More|$))/gi, "Polnation ($POLNATION) is a community-driven Web3 project built around participation, transparent token utilities, and ecosystem growth. ")
        .replace(/ultimate meme wolf dog of the crypto wilderness[\s\S]*?(?=(Show More|$))/gi, "community-driven Web3 project built around participation, transparent token utilities, and ecosystem growth. ");
    };

    document.title = applyTextReplacements(document.title).replace(
      "Polnation Smart Contract Audit | Cyberscope",
      "Polnation Smart Contract Audit | Cyberscope"
    );

    const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = textWalker.nextNode())) textNodes.push(node);
    for (const textNode of textNodes) {
      textNode.nodeValue = applyTextReplacements(textNode.nodeValue);
      if (textNode.nodeValue.includes("Polnation ($POLNATION) is the ultimate meme wolf dog")) {
        textNode.nodeValue = "Polnation ($POLNATION) is a community-driven Web3 project built around participation, transparent token utilities, and ecosystem growth.";
      }
    }

    for (const el of document.querySelectorAll("*")) {
      for (const attr of ["alt", "title", "aria-label", "placeholder", "content", "href", "src", "srcset"]) {
        if (el.hasAttribute(attr)) {
          el.setAttribute(attr, applyTextReplacements(el.getAttribute(attr)));
        }
      }
    }

    for (const img of document.images) {
      const alt = img.getAttribute("alt") || "";
      const src = img.getAttribute("src") || "";
      const rect = img.getBoundingClientRect();
      const isProjectAvatar =
        /1777323501819_686022d9-0a83-4763-9dea-6d62540e72d5/i.test(src) ||
        (/firebasestorage\.googleapis\.com/i.test(src) &&
          rect.width >= 32 &&
          rect.width <= 96 &&
          rect.top >= 100 &&
          rect.top <= 420);

      if (/Polnation/i.test(alt) || /moon/i.test(alt) || isProjectAvatar) {
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
        img.setAttribute("src", logo);
        img.setAttribute("alt", "Polnation");
      }
    }

    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const removeElement = (el) => {
      if (el && el.parentElement) el.remove();
    };

    for (const h3 of Array.from(document.querySelectorAll("h3"))) {
      if (text(h3) === "Market") {
        const section = h3.closest(".section__SectionContainer-sc-34bb0fa1-0");
        if (section) removeElement(section);
      }
    }

    for (const link of Array.from(document.querySelectorAll("a"))) {
      if (text(link) === "Market") {
        removeElement(link.parentElement || link);
      }
    }

    // Keep the top summary radar's Market metric. The detailed Market section is
    // removed above, but the original score overview uses five axes.
  }, { logo: POLNATION_LOGO });
}

async function captureCss(page) {
  return page.evaluate(() => {
    return Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join("\n");
  });
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const snapshot of [
  { name: "desktop", width: 1440, height: 2600 },
  { name: "mobile", width: 390, height: 2600 }
]) {
  const page = await browser.newPage({
    viewport: { width: snapshot.width, height: snapshot.height }
  });

  await page.goto(TARGET, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5000);
  await customizePage(page);
  await page.waitForTimeout(500);

  const html = await page.evaluate(
    () => document.getElementById("__next")?.innerHTML ?? ""
  );
  const head = applyTextReplacements(await page.evaluate(() => document.head.innerHTML));
  const css = applyTextReplacements(await captureCss(page));

  writeFileSync(`${OUT}/next-${snapshot.name}.html`, html, "utf8");
  writeFileSync(`${OUT}/head-${snapshot.name}.html`, head, "utf8");
  writeFileSync(`${OUT}/css-${snapshot.name}.css`, css, "utf8");

  console.log(`${snapshot.name}: ${html.length} html, ${css.length} css`);
  await page.close();
}

await browser.close();
