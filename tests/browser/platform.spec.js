import { test, expect } from "@playwright/test";
test("Yandex lifecycle, language, cloud saves and ads follow SDK callbacks", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/sdk.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
    const mock=window.__sdkMock={events:[],handlers:{},cloud:null,rewardMode:'reward',pending:null};
    window.YaGames={init:async()=>({environment:{i18n:{lang:'en'}},
      features:{LoadingAPI:{ready:()=>mock.events.push('ready')},GameplayAPI:{start:()=>mock.events.push('start'),stop:()=>mock.events.push('stop')}},
      on:(event,handler)=>mock.handlers[event]=handler,
      getPlayer:async()=>({getData:async()=>({}),setData:async data=>{mock.cloud=JSON.parse(JSON.stringify(data));mock.events.push('save');}}),
      adv:{showRewardedVideo:({callbacks})=>{mock.pending=callbacks;callbacks.onOpen();}}
    })};
  `,
    }),
  );
  await page.goto("http://elderia.localhost:5173");
  await expect(page.locator("h1")).toContainText("Every valley");
  expect(await page.evaluate(() => window.__sdkMock.events)).toEqual(["ready"]);
  await page.locator('[data-action="create"]').click();
  await page.locator('[data-action="start"]').click();
  expect(
    await page.evaluate(
      () => window.__sdkMock.events.filter((e) => e === "start").length,
    ),
  ).toBe(1);
  await page.evaluate(() => window.__sdkMock.handlers.game_api_pause());
  expect(await page.evaluate(() => window.__ELDERIA__.game.paused)).toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.__ELDERIA__.audio.context.state))
    .toBe("suspended");
  await page.evaluate(() => window.__sdkMock.handlers.game_api_resume());
  expect(await page.evaluate(() => window.__ELDERIA__.game.paused)).toBe(false);
  await page.keyboard.press("KeyE");
  await page.locator('[data-action="rewarded"]').click();
  expect(await page.evaluate(() => window.__ELDERIA__.game.paused)).toBe(true);
  const count = await page.evaluate(
    () => window.__ELDERIA__.game.save.inventory.potion,
  );
  await page.evaluate(() => {
    window.__sdkMock.pending.onRewarded();
    window.__sdkMock.pending.onRewarded();
    window.__sdkMock.pending.onClose();
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.__ELDERIA__.game.save.inventory.potion),
    )
    .toBe(count + 2);
  expect(await page.evaluate(() => window.__ELDERIA__.game.paused)).toBe(false);
  await page.keyboard.press("KeyE");
  await page.locator('[data-action="rewarded"]').click();
  await page.evaluate(() => window.__sdkMock.pending.onError({}));
  await expect
    .poll(() => page.evaluate(() => window.__ELDERIA__.game.paused))
    .toBe(false);
  expect(
    await page.evaluate(() => window.__ELDERIA__.game.save.inventory.potion),
  ).toBe(count + 2);
  await expect
    .poll(
      () =>
        page.evaluate(() => window.__sdkMock.cloud?.elderia.inventory.potion),
      { timeout: 20000 },
    )
    .toBe(count + 2);
  expect(
    await page.evaluate(
      () => window.__sdkMock.events.filter((e) => e === "ready").length,
    ),
  ).toBe(1);
  expect(errors).toEqual([]);
});
