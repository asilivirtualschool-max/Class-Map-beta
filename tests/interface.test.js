const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const page=await b.newPage({viewport:{width:1500,height:1000}});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto('file:///tmp/test.html');
  const step=async(n,fn)=>{try{await fn();console.log('✅ '+n);}catch(e){console.log('❌ '+n+' → '+e.message);throw e;}};

  await step('room plan renders furniture and one table per station',async()=>{
    await page.click('#segTeacher');await page.fill('#teacherNameInput','Ms J');
    await page.fill('#classCodeInput','ROOMQA');await page.click('#loginBtn');
    await page.waitForSelector('#view-map:not(.hide)');
    if(!await page.$('.room-board'))throw new Error('no whiteboard');
    if(!await page.$('.room-door'))throw new Error('no door');
    if(!await page.$('.room-desk'))throw new Error('no teacher desk');
    const n=await page.$$eval('.station:not(.is-bonus)',e=>e.length);
    if(n!==6)throw new Error('expected 6 tables, got '+n);
    if(await page.$('.station-zone'))throw new Error('stadium zone label still present');
  });

  await step('every table shows four seats',async()=>{
    const perTable=await page.$$eval('.station',els=>els.map(e=>e.querySelectorAll('.seat').length));
    if(!perTable.every(n=>n===4))throw new Error('seats per table: '+perTable.join(','));
  });

  await step('dragging a table saves its position',async()=>{
    const before=await page.$eval('.station',e=>e.style.left);
    const box=await page.$eval('.station',e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
    await page.mouse.move(box.x,box.y);
    await page.mouse.down();
    await page.mouse.move(box.x+180,box.y+40,{steps:12});
    await page.mouse.up();
    await page.waitForTimeout(500);
    const after=await page.$eval('.station',e=>e.style.left);
    if(before===after)throw new Error('table did not move ('+before+')');
    const saved=await page.evaluate(async()=>JSON.stringify((await sGet(K_CFG())).stationPos));
    if(!/"1":/.test(saved))throw new Error('position not persisted: '+saved);
    // and it survives a re-render
    await page.evaluate(()=>refresh());
    await page.waitForTimeout(400);
    const again=await page.$eval('.station',e=>e.style.left);
    if(again!==after)throw new Error('position lost on refresh: '+again+' vs '+after);
  });

  await step('a drag does not open the edit modal',async()=>{
    if(await page.isVisible('#editStationModal'))throw new Error('drag opened the edit modal');
  });

  await step('reset layout puts the tables back',async()=>{
    page.once('dialog',d=>d.accept());
    await page.click('#resetLayoutBtn');
    await page.waitForTimeout(600);
    const saved=await page.evaluate(async()=>JSON.stringify((await sGet(K_CFG())).stationPos));
    if(saved!=='{}')throw new Error('positions not cleared: '+saved);
  });

  await step('dashboard shows the KPI strip at full height',async()=>{
    await page.click('#showDashBtn');
    await page.waitForTimeout(700);
    const h=await page.$eval('#dashKpis',e=>e.getBoundingClientRect().height);
    if(h<60)throw new Error('KPI strip collapsed to '+h+'px');
    const cells=await page.$$eval('#dashKpis .kcell',e=>e.length);
    if(cells!==7)throw new Error('expected 7 KPI cells, got '+cells);
    const q=await page.textContent('#dashQueue');
    if(!/Nobody is waiting/.test(q))throw new Error('empty queue message missing: '+q);
    if(!await page.$('#dashStations .loadrow'))throw new Error('no station load rows');
  });

  console.log(errs.length?('\n⚠️ '+errs.join(' | ')):'\n✨ no page errors');
  await b.close();
})();
