import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const fakeUser = { UserID: 1, Username: "TestUser", Email: "test@example.com", Tier: "Free", DateCreated: "2024-01-01" };

// Lots of thoughts + folders so Dashboard content is much taller than the viewport.
const fakeThoughts = Array.from({ length: 20 }, (_, i) => ({
  ThoughtID: i + 1,
  ThoughtName: `Idea ${i + 1}`,
  ThoughtDescr: `desc ${i + 1}`,
  DateCreated: "2024-06-01",
  Favorite: false,
  Pinned: false,
}));
const fakeLists = [
  { ListName: "Work", ThoughtCount: 5 },
  { ListName: "Journal", ThoughtCount: 8 },
];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
page.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));

await page.route("**/api/thoughts?unlisted=true", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakeThoughts) }));
await page.route("**/api/lists", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, lists: fakeLists }) }));
await page.route("**/api/me/storage", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, bytes: 1024 }) }));

await page.addInitScript(({ user }) => {
  localStorage.setItem("token", "fake-token-for-visual-test");
  localStorage.setItem("user", JSON.stringify(user));
}, { user: fakeUser });

await page.setViewportSize({ width: 1297, height: 700 });

await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Your Brain Dump", { timeout: 15000 });

const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
const viewportHeight = 700;
console.log("Dashboard page scrollHeight:", pageHeight, "(viewport:", viewportHeight, ") -- content is taller:", pageHeight > viewportHeight);

const footerVisibleBeforeScroll = await page.locator("text=Storage used").isVisible();
console.log("Storage-used footer visible without scrolling:", footerVisibleBeforeScroll);

await page.screenshot({ path: "sidebar-fix-dashboard-top.png", fullPage: false });
console.log("Screenshot: dashboard top (unscrolled) taken");

// Scroll the page down and confirm the sidebar stays pinned (still visible, still showing footer).
await page.mouse.wheel(0, 1500);
await page.waitForTimeout(200);
const footerVisibleAfterScroll = await page.locator("text=Storage used").isVisible();
console.log("Storage-used footer visible after scrolling content down:", footerVisibleAfterScroll);
await page.screenshot({ path: "sidebar-fix-dashboard-scrolled.png", fullPage: false });
console.log("Screenshot: dashboard scrolled taken");

// Compare against Lists (short content) to confirm it still looks the same as before.
await page.goto(`${BASE}/lists`, { waitUntil: "networkidle" });
await page.waitForSelector("table.adminTable", { timeout: 15000 });
await page.screenshot({ path: "sidebar-fix-lists.png", fullPage: false });
console.log("Screenshot: lists taken");

console.log("Console errors:", consoleErrors.length ? consoleErrors : "none");
await browser.close();
