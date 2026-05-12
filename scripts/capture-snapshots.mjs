import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const TARGET = "https://www.cyberscope.io/audits";

mkdirSync("reference", { recursive: true });

const browser = await chromium.launch();

for (const snapshot of [
  { name: "desktop", width: 1440, height: 2600 },
  { name: "mobile", width: 390, height: 2600 }
]) {
  const page = await browser.newPage({
    viewport: { width: snapshot.width, height: snapshot.height }
  });

  await page.goto(TARGET, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(3000);

  const html = await page.evaluate(
    () => document.getElementById("__next")?.innerHTML ?? ""
  );
  const head = await page.evaluate(() => document.head.innerHTML);
  const css = await page.evaluate(() => {
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

  writeFileSync(`reference/next-${snapshot.name}.html`, html, "utf8");
  writeFileSync(`reference/head-${snapshot.name}.html`, head, "utf8");
  writeFileSync(`reference/css-${snapshot.name}.css`, css, "utf8");
  console.log(`${snapshot.name}: ${html.length}`);

  await page.close();
}

await browser.close();
