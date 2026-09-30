import {test, expect} from '@playwright/test';
async function begin(page, cls='mage') {
  await page.goto('/'); await page.locator('[data-action=create]').click();
  await page.locator(`[data-class=${cls}]`).click(); await page.locator('[data-action=start]').click();
}
test('recipe picker explains missing ingredients, previews without spending, crafts batches and preserves selection', async ({page}) => {
  await begin(page); await page.keyboard.press('KeyI');
  await page.locator('#recipe-picker').selectOption('rod');
  await expect(page.locator('[data-action=craftMake-rod-1]')).toBeDisabled();
  await expect(page.locator('.craft-status')).toContainText('Не хватает материалов');
  await expect(page.locator('.ingredient-counts')).toContainText('0/2');
  await page.evaluate(()=>{const g=window.__ELDERIA__.game; Object.assign(g.save.inventory,{wood:4,fiber:2}); window.__ELDERIA__.action('inventory');});
  await expect(page.locator('[data-action=craftMake-rod-2]')).toBeEnabled();
  expect(await page.evaluate(()=>window.__ELDERIA__.game.save.inventory.rod)).toBe(0);
  await page.locator('[data-action=craftMake-rod-2]').click();
  expect(await page.evaluate(()=>{const s=window.__ELDERIA__.game.save;return [s.inventory.rod,s.inventory.wood,s.inventory.fiber,s.activities.recipes];})).toEqual([2,0,0,2]);
  await expect(page.locator('#toast')).toContainText('Создано: Удочка × 2');
  await expect(page.locator('#recipe-picker')).toHaveValue('rod');
  await expect(page.locator('[data-action=craftMake-rod-1]')).toBeDisabled();
  await page.locator('[data-bag-key="i:rod:0"]').click();
  await expect(page.locator('.bag-description')).toContainText('Нужна для рыбалки');
  await page.locator('[data-action=bagFilter-gear]').click();
  await expect(page.locator('[data-bag-key^="i:"]')).toHaveCount(0);
  await page.reload(); await page.locator('[data-action=continue]').click();
  expect(await page.evaluate(()=>window.__ELDERIA__.game.save.inventory.rod)).toBe(2);
});
test('portable clothing crafts and equips once, duplicate or invalid batches never consume resources',async({page})=>{
  await begin(page,'warrior');
  const r=await page.evaluate(()=>{
    const g=window.__ELDERIA__.game,s=g.save; s.inventory.fiber=12; s.inventory.wood=3;
    const before=s.inventory.fiber, invalid=g.craftSmall('cap',2), remaining=s.inventory.fiber;
    const crafted=g.craftSmall('cap'), duplicate=g.craftSmall('cap'), after=s.inventory.fiber;
    const unowned=g.craftSmall('rod',3), wood=s.inventory.wood;
    const negative=g.craftSmall('bait',-1), fraction=g.craftSmall('bait',1.5);
    return {before,invalid,remaining,crafted,duplicate,after,unowned,wood,negative,fraction,head:s.equippedWearables.head};
  });
  expect(r).toEqual({before:12,invalid:false,remaining:12,crafted:true,duplicate:false,after:9,unowned:false,wood:3,negative:false,fraction:false,head:'linenCap'});
  await page.keyboard.press('KeyI'); await page.locator('#recipe-picker').selectOption('cap');
  await expect(page.locator('.craft-status')).toContainText('уже есть');
  await expect(page.locator('[data-action=craftMake-cap-1]')).toBeDisabled();
  await page.reload();await page.locator('[data-action=continue]').click();
  expect(await page.evaluate(()=>window.__ELDERIA__.game.save.equippedWearables.head)).toBe('linenCap');
});
test('camp restriction is visible and batch cooking is atomic; fish can restore mana at full health',async({page})=>{
  await begin(page);
  await page.evaluate(()=>{const g=window.__ELDERIA__.game; g.save.x+=300;g.enemies=[]; Object.assign(g.save.inventory,{rawFish:4,wood:2}); window.__ELDERIA__.action('inventory');});
  await page.locator('#recipe-picker').selectOption('fish');
  await expect(page.locator('.craft-status')).toContainText('безопасный костёр');
  await expect(page.locator('[data-action=craftMake-fish-2]')).toBeDisabled();
  const r=await page.evaluate(()=>{const g=window.__ELDERIA__.game,s=g.save;const blocked=g.craftSmall('fish',2);const before=[s.inventory.rawFish,s.inventory.wood];const c=g.world.objects.find(o=>o.id==='camp1');s.x=c.x;s.y=c.y+15;g.enemies=[];const success=g.craftSmall('fish',2);s.hp=g.stats.maxHp;s.mana=0;const eat=g.eatFood('cookedFish');return {blocked,before,success,eat,fish:s.inventory.cookedFish,raw:s.inventory.rawFish,wood:s.inventory.wood,mana:s.mana};});
  expect(r).toEqual({blocked:false,before:[4,2],success:true,eat:true,fish:3,raw:0,wood:0,mana:15});
});
test('skill book separates first learning from upgrades, shows real bonuses and provides mentor marker',async({page})=>{
  await begin(page); await page.evaluate(()=>{const g=window.__ELDERIA__.game;g.equipWeapon('staff');g.save.level=3;g.save.skillPoints=3;g.save.abilityUses.starwave=0;window.__ELDERIA__.action('skills');});
  const first=page.locator('.skill-node[data-ability=starwave]');
  await expect(first).toContainText('Изучено · ранг 1/3');
  await expect(first).not.toContainText('8 попаданий');
  await expect(first.locator('.skill-preview')).toContainText('100% → Сила 125%');
  await page.locator('[data-action=learn-0]').click();
  await expect(first).toContainText('Изучено · ранг 2/3');
  await expect(first.locator('.skill-status')).toContainText('Нужен уровень 6');
  await expect(page.locator('[data-action=learn-0]')).toBeDisabled();
  expect(await page.evaluate(()=>window.__ELDERIA__.game.save.skillPoints)).toBe(2);
  await page.locator('[data-action=locateMentor]').click();
  expect(await page.evaluate(()=>{const g=window.__ELDERIA__.game,o=g.world.objects.find(o=>o.id==='mageMentor');return g.waypoint.x===o.x&&g.waypoint.y===o.y;})).toBe(true);
});
test('shop has readable opaque cards and new weapon purchases respect levels, currency and class schools',async({page})=>{
  await begin(page); await page.evaluate(()=>window.__ELDERIA__.action('acceptSmith'));
  await expect(page.locator('[data-action=buyWeapon-apprenticeFlame]')).toBeDisabled();
  await expect(page.locator('[data-action=buyWeapon-stormRod]')).toBeDisabled();
  const contrast=await page.locator('.gear-card').first().evaluate(card=>{
    const rgb=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
    const lum=c=>rgb(c).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0),bg=lum(getComputedStyle(card).backgroundColor);
    return ['.gear-title h3','.gear-title small','p','.gear-stats'].map(sel=>{const fg=lum(getComputedStyle(card.querySelector(sel)).color);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);});
  });
  for(const c of contrast) expect(c).toBeGreaterThanOrEqual(4.5);
  await page.evaluate(()=>{const g=window.__ELDERIA__.game;g.save.level=2;g.save.gold=115; g.onInteract(g.world.objects.find(o=>o.id==='smith'));});
  await page.locator('[data-action=buyWeapon-apprenticeFlame]').click();
  expect(await page.evaluate(()=>{const s=window.__ELDERIA__.game.save;return [s.gold,s.equippedWeapon,s.ownedWeapons.includes('apprenticeFlame')];})).toEqual([0,'apprenticeFlame',true]);
  await page.keyboard.press('Escape'); await page.keyboard.press('KeyK');
  await expect(page.locator('.skills-intro')).toContainText('Магия огня');
  await expect(page.locator('.skill-node[data-ability=flamewave]')).toContainText('0/8 попаданий');
});
test('first-learning costs are never charged again, upgraded stealth lasts longer, new weapons apply their attack status',async({page})=>{
  await begin(page,'ranger');
  const r=await page.evaluate(async()=>{
    const {weapons}=await import('/src/equipment.js'), {newSave}=await import('/src/storage.js');
    const g=window.__ELDERIA__.game,s=g.save;s.level=10;s.skillPoints=10;s.gold=100;
    s.ownedWeapons.push('daggers');g.equipWeapon('daggers');g.enemies=[];
    const mentor=g.world.objects.find(o=>o.id==='rangerMentor');s.x=mentor.x;s.y=mentor.y+15;
    const first=g.learnSkill(1);const firstGold=s.gold;s.x+=400;const upgrade=g.learnSkill(1);const upgradedGold=s.gold;
    g.paused=false;s.mana=200;const cast=g.useSkill(1),duration=g.buffs.stealth;
    const hits=[];
    for(const [id,w] of Object.entries(weapons).filter(([,w])=>w.appearance)) {
      g.load(newSave('Arsenal',w.class,{},id));g.save.level=20;g.equipWeapon(id);g.paused=false;g.attackCooldown=0;
      const e={...g.enemies.find(e=>e.type==='slime'),x:g.save.x+30,y:g.save.y,hp:3000,maxHp:3000,speed:0,cooldown:999};g.enemies=[e];g.attack();
      for(let i=0;i<8;i++)g.update(.03);
      hits.push({id,hp:e.hp,slow:e.slow||0,burn:e.burn||0,poison:e.poison||0,stun:e.stun||0});
    }
    g.paused=true;return {first,firstGold,upgrade,upgradedGold,cast,duration,hits};
  });
  expect({...r,hits:undefined}).toEqual({first:true,firstGold:40,upgrade:true,upgradedGold:40,cast:true,duration:6,hits:undefined});
  expect(r.hits).toHaveLength(12);for(const h of r.hits) expect(h.hp,h.id).toBeLessThan(3000);
  expect(r.hits.find(h=>h.id==='frostDaggers').slow).toBeGreaterThan(0);
  expect(r.hits.find(h=>h.id==='emberSpear').burn).toBeGreaterThan(0);
  expect(r.hits.find(h=>h.id==='assassinDaggers').poison).toBeGreaterThan(0);
  expect(r.hits.find(h=>h.id==='graniteStaff').stun).toBeGreaterThan(0);
});
