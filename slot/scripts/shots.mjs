import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE ?? "https://slot-jet.vercel.app";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "screens");
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, selector, text) {
  await page.waitForFunction(
    (sel, t) => [...document.querySelectorAll(sel)].some((e) => e.textContent.includes(t)),
    {},
    selector,
    text
  );
  await page.evaluate(
    (sel, t) => {
      const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(t));
      el.click();
    },
    selector,
    text
  );
}

async function shot(page, name) {
  await sleep(450);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log("✓", name);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 460, height: 880, deviceScaleFactor: 2 },
});
const page = await browser.newPage();

// 00 — лендинг
await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
await shot(page, "00-landing");

// 01 — услуга
await page.goto(`${BASE}/aigerim`, { waitUntil: "networkidle2" });
await shot(page, "01-service");

// 02 — мастер
await clickText(page, "button", "Маникюр классический");
await shot(page, "02-master");

// 03 — дата/время
await clickText(page, "button", "Айгерим");
await page.waitForFunction(
  () => [...document.querySelectorAll("button")].some((b) => /^\d\d:\d\d$/.test(b.textContent.trim())),
  { timeout: 8000 }
);
await shot(page, "03-datetime");

// 04 — контакты (кликаем первый свободный слот)
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /^\d\d:\d\d$/.test(x.textContent.trim()));
  b.click();
});
await page.waitForFunction(() =>
  [...document.querySelectorAll("input")].some((i) => (i.placeholder || "").includes("зовут"))
);
await shot(page, "04-contacts");

// заполняем имя/телефон
await page.evaluate(() => {
  const setVal = (ph, v) => {
    const i = [...document.querySelectorAll("input")].find((x) => (x.placeholder || "").includes(ph));
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(i, v);
    i.dispatchEvent(new Event("input", { bubbles: true }));
  };
  setVal("зовут", "Аружан");
  setVal("+7", "+7 700 555 00 11");
});
await sleep(300);

// 05 — оплата депозита
await clickText(page, "button", "Внести депозит");
await shot(page, "05-deposit");

// 06 — успех + напоминание
await clickText(page, "button", "Оплатить");
await page.waitForFunction(
  () => document.body.textContent.includes("Вы записаны"),
  { timeout: 10000 }
);
await shot(page, "06-success");

// 07 — страница управления (подтверждение клиентом)
await clickText(page, "a", "Перенести или отменить");
await page.waitForFunction(() => document.body.textContent.includes("Ваша запись"));
await shot(page, "07-manage");

await browser.close();
console.log("done");
