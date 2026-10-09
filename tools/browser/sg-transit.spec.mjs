import { expect, test } from '@playwright/test';

const FIREBASE_STUB = `
(function () {
  if (window.__transitFirebaseStub) return;
  window.__transitFirebaseStub = true;
  var docs = [];
  var listeners = [];
  function emit() {
    var snapshot = {
      docs: docs.map(function (data, index) {
        return {
          id: "comment-" + index,
          data: function () { return data; },
          ref: { delete: function () { return Promise.resolve(); } },
        };
      }),
    };
    listeners.forEach(function (listener) { listener(snapshot); });
  }
  function commentsApi() {
    return {
      orderBy: function () { return this; },
      limit: function () { return this; },
      onSnapshot: function (ok) {
        listeners.push(ok);
        emit();
        return function () {};
      },
      add: function (payload) {
        docs.unshift({
          name: payload.name,
          body: payload.body,
          createdAt: { toDate: function () { return new Date("2026-10-09T08:00:00+08:00"); } },
        });
        emit();
        return Promise.resolve({ id: "new-comment" });
      },
    };
  }
  function firestore() {
    return {
      collection: function () {
        return {
          doc: function () {
            return { collection: function () { return commentsApi(); } };
          },
        };
      },
    };
  }
  firestore.FieldValue = { serverTimestamp: function () { return { server: true }; } };
  window.firebase = {
    initializeApp: function () { return {}; },
    firestore: firestore,
    auth: function () {
      return {
        get currentUser() { return null; },
        onAuthStateChanged: function (fn) { fn(null); },
        signInWithPopup: function () { return Promise.resolve(); },
        signOut: function () { return Promise.resolve(); },
      };
    },
  };
})();
`;

async function stubFirebase(page) {
  await page.route("https://www.gstatic.com/firebasejs/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: FIREBASE_STUB }),
  );
}

test("home opens the transit note and comments stay on the page", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await stubFirebase(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const link = page.locator("#sg-transit-home-link");
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "pages/sg-transit.html");
  await expect(page.locator("#craft #sg-transit-home-link")).toHaveCount(0);
  await link.click();

  await expect(page).toHaveURL(/\/pages\/sg-transit\.html$/);
  await expect(page.locator("h1")).toContainText("One fare, if you watch the clock.");
  await expect(page.locator("main")).toContainText("$1.75");
  await expect(page.locator("main")).toContainText("$2.66");
  await expect(page.locator("main")).toContainText("New Ride");
  await expect(page.locator("main")).toContainText("45 minutes");
  await expect(page.locator(".clock-svg")).toBeVisible();
  await expect(page.locator(".transit-steps")).toBeHidden();
  await expect(page.locator('img[src="../assets/sg-transit/station.jpg"]')).toBeVisible();
  await expect(page.locator("#share-copy")).toHaveAttribute("aria-label", "Copy link");
  await expect(page.locator('a[href*="twitter.com/intent/tweet"]')).toHaveAttribute("aria-label", "Share on X");
  await expect(page.locator('a[href*="wa.me/"]')).toHaveAttribute("aria-label", "Share on WhatsApp");
  await expect(page.locator('a[href*="linkedin.com"]')).toHaveAttribute("aria-label", "Share on LinkedIn");
  await expect(page.locator('a[href^="mailto:"]')).toHaveAttribute("aria-label", "Email this note");
  await expect(page.locator("#comments")).not.toContainText("public on this page");
  await expect(page.locator("#comment-list")).toContainText("No comments yet");

  await page.locator("#comment-name").fill("Ada");
  await page.locator("#comment-body").fill("No");
  await page.locator("#comment-submit").click();
  await expect(page.locator("#comment-status")).toContainText("4 to 1000");

  await page.locator("#website").fill("https://spam.example", { force: true });
  await page.locator("#comment-body").fill("honeypot-should-not-appear-9f3c");
  await page.locator("#comment-submit").click();
  await expect(page.locator("#comment-status")).toHaveText("Comment posted.");
  await expect(page.locator("#comment-list")).not.toContainText("honeypot-should-not-appear-9f3c");

  await page.locator("#comment-name").fill("Ada");
  await page.locator("#comment-body").fill("The 45 minute gap is the whole trick.");
  await page.locator("#comment-submit").click();
  await expect(page.locator("#comment-status")).toHaveText("Comment posted.");
  await expect(page.locator("#comment-list")).toContainText("Ada");
  await expect(page.locator("#comment-list")).toContainText("The 45 minute gap is the whole trick.");
  await expect(page.locator("#comment-list")).not.toContainText("honeypot-should-not-appear-9f3c");

  await page.evaluate(() => localStorage.removeItem("alphaeus-transit-comment-at-v1"));
  await page.locator("#comment-name").fill("   ");
  await page.locator("#comment-body").fill("No name on this one.");
  await page.locator("#comment-submit").click();
  await expect(page.locator("#comment-status")).toHaveText("Comment posted.");
  await expect(page.locator("#comment-list")).toContainText("Anonymous");
  await expect(page.locator("#comment-list")).toContainText("No name on this one.");

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.locator("#share-copy").click();
  await expect(page.locator("#share-status")).toHaveText("Link copied.");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe("https://alphaeusng.github.io/pages/sg-transit.html");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("transit note stacks the clock on a phone and explains a missing Firebase script", async ({ page }) => {
  await page.route("https://www.gstatic.com/firebasejs/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pages/sg-transit.html", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".clock-svg")).toBeHidden();
  await expect(page.locator(".transit-steps")).toBeVisible();
  await expect(page.locator(".transit-steps")).toContainText("7.20");
  await expect(page.locator("#comment-status")).toContainText("You can still share the note.");
  await expect(page.locator("#comment-submit")).toBeDisabled();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
