const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const page=await b.newPage();
  const errs=[];
  page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE: '+m.text());});
  await page.goto('file:///tmp/test.html');
  const step=async(n,fn)=>{ try{ await fn(); console.log('✅ '+n); }catch(e){ console.log('❌ '+n+' → '+e.message); throw e; } };

  // ── teacher ──
  await step('teacher login',async()=>{
    await page.click('#segTeacher');
    await page.fill('#teacherNameInput','Ms Johnson');
    await page.fill('#classCodeInput','TEST12');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-map:not(.hide)',{timeout:5000});
  });

  await step('settings panel opens with CAT4+NGRT on',async()=>{
    await page.click('#benchSetBtn');
    await page.waitForSelector('#setModal:not(.hide)');
    const on=await page.$$eval('#pane-tests [data-on="1"][data-inst]',els=>els.filter(e=>e.checked).map(e=>e.dataset.inst));
    if(JSON.stringify(on)!==JSON.stringify(['cat4','ngrt']))throw new Error('default instruments = '+on);
  });

  await step('cut scores seed from percentiles (SAS 90/110)',async()=>{
    await page.click('#setTabs button[data-p="tiers"]');
    const cuts=await page.$$eval('#pane-tiers [data-icut="cat4"]',els=>els.map(e=>e.value));
    if(cuts.join(',')!=='90,110')throw new Error('cat4 cuts = '+cuts);
  });

  await step('turn on PTM + add a school benchmark',async()=>{
    await page.click('#setTabs button[data-p="tests"]');
    await page.check('#pane-tests [data-on="1"][data-inst="ptm"]');
    await page.click('#addCustomBtn');
    await page.click('#setSaveBtn');
    await page.waitForFunction(()=>document.querySelector('#setModal').classList.contains('hide'));
  });

  await step('4 tiers rename + custom cut score sticks',async()=>{
    await page.click('#benchSetBtn');
    await page.click('#setTabs button[data-p="tiers"]');
    await page.selectOption('#setTierCount','4');
    await page.fill('#pane-tiers [data-tname="0"]','Emerging');
    await page.dispatchEvent('#pane-tiers [data-tname="0"]','change');
    const n=await page.$$eval('#pane-tiers [data-icut="cat4"]',e=>e.length);
    if(n!==3)throw new Error('expected 3 cuts for 4 tiers, got '+n);
    await page.fill('#pane-tiers [data-icut="cat4"][data-ci="0"]','85');
    await page.dispatchEvent('#pane-tiers [data-icut="cat4"][data-ci="0"]','change');
    const badge=await page.textContent('#pane-tiers .bmrow');
    if(!/school cut scores/.test(badge))throw new Error('override badge missing');
    await page.click('#setSaveBtn');
  });

  await step('station: differentiated versions + reading demand',async()=>{
    await page.click('.station .station-edit');
    await page.waitForSelector('#editStationModal:not(.hide)');
    await page.fill('#editStationTask','Read the source and answer Q1–Q3.');
    const nVars=await page.$$eval('#editVariants textarea',e=>e.length);
    if(nVars!==4)throw new Error('expected 4 tier variants, got '+nVars);
    await page.evaluate(()=>{
      const ta=document.querySelectorAll('#editVariants textarea');
      ta[0].value='Use the sentence starters on the card. Answer Q1 only.';
      ta[3].value='Answer Q1–Q3, then argue which source is more reliable.';
      ta.forEach(x=>x.dispatchEvent(new Event('input',{bubbles:true})));
    });
    await page.fill('#editStationDemand','12.5');
    await page.click('#saveEditStationBtn');
    await page.waitForFunction(()=>document.querySelector('#editStationModal').classList.contains('hide'));
    console.log('  SAVED VARS:',await page.evaluate(()=>JSON.stringify(cfg.stationVariants)));
    console.log('  STORED:',await page.evaluate(async()=>JSON.stringify((await sGet(K_CFG())).stationVariants)));
    const txt=await page.textContent('.station');
    if(!/differentiated/.test(txt))throw new Error('no differentiated marker on the card');
  });

  await step('teacher logs out',async()=>{
    await page.click('#logoutBtn');
    await page.waitForSelector('#view-login:not(.hide)');
  });

  // ── student A: low profile ──
  const join=async(name,vals)=>{
    await page.fill('#codeInput','TEST12');
    await page.fill('#nameInput',name);
    await page.click('#loginBtn');
    await page.waitForSelector('#view-bench:not(.hide)',{timeout:5000});
    for(const [sel,v] of Object.entries(vals)) await page.fill(sel,String(v));
    await page.click('#benchSaveBtn');
    await page.waitForSelector('#view-map:not(.hide)',{timeout:5000});
  };

  await step('student form is generated from the config (CAT4+NGRT+PTM+custom)',async()=>{
    await page.fill('#codeInput','TEST12');
    await page.fill('#nameInput','Aisha');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-bench:not(.hide)');
    const groups=await page.$$eval('#benchFields .bm-group .bm-title',e=>e.map(x=>x.textContent));
    if(groups.length!==4)throw new Error('expected 4 benchmark cards, got '+JSON.stringify(groups));
    if(!await page.$('#bmf_cat4_sas'))throw new Error('CAT4 SAS field missing');
    if(!await page.$('#bmf_ngrt_ra'))throw new Error('NGRT reading age field missing');
  });

  await step('out-of-range score is rejected',async()=>{
    await page.fill('#bmf_cat4_sas','400');
    await page.click('#benchSaveBtn');
    const err=await page.textContent('#benchErr');
    if(!/between/.test(err))throw new Error('no range error, got: '+err);
  });

  await step('live tier preview updates',async()=>{
    await page.fill('#bmf_cat4_sas','82');
    await page.fill('#bmf_ngrt_ra','9.2');
    const live=await page.textContent('#benchLive');
    if(!/Emerging|Developing/.test(live))throw new Error('live preview = '+live);
    await page.click('#benchSaveBtn');
    await page.waitForSelector('#view-map:not(.hide)');
  });

  await step('student sees the version for their tier + reading nudge',async()=>{
    await page.click('.station:not(.is-bonus)');
    await page.waitForSelector('#taskDock:not(.hide)');
    const task=await page.textContent('#dockTaskText');
    if(!/sentence starters/.test(task)){
      console.log(await page.evaluate(()=>JSON.stringify({myTier,tc:tierCount(),cuts:bench.tiers.cuts,icuts:bench.instruments.cat4.cuts,vars:cfg.stationVariants,cur:current})));
      throw new Error('served the wrong version: '+task);}
    if(await page.isHidden('#dockReadNote')){
      console.log('  DBG',await page.evaluate(async()=>JSON.stringify({dem:demandFor(1),sd:cfg.stationDemand,rec:await sGet(kStu(me.name)),myTier})));
      throw new Error('reading nudge should show (RA 9.2 < demand 12.5)');}
    await page.click('#aLeave');
  });

  await step('logout → second student, high profile',async()=>{
    await page.click('#logoutBtn');
    await page.waitForSelector('#view-login:not(.hide)');
    await join('Bilal',{'#bmf_cat4_sas':126,'#bmf_ngrt_ra':14.2,'#bmf_ngrt_ss':128});
    await page.click('.station:not(.is-bonus)');
    await page.waitForSelector('#taskDock:not(.hide)');
    const task=await page.textContent('#dockTaskText');
    if(!/more reliable/.test(task))throw new Error('high tier got: '+task);
    if(await page.isVisible('#dockReadNote'))throw new Error('reading nudge should be hidden for RA 14.2');
    await page.click('#aLeave');
  });

  await step('third student, no data at all',async()=>{
    await page.click('#logoutBtn');
    await page.fill('#codeInput','TEST12');
    await page.fill('#nameInput','Chen');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-bench:not(.hide)');
    await page.click('#benchSkip');
    await page.waitForSelector('#view-map:not(.hide)');
    const task=await page.textContent('#dockTaskText').catch(()=>'');
  });

  // ── back to teacher ──
  await step('teacher dashboard shows the class profile',async()=>{
    await page.click('#logoutBtn');
    await page.click('#segTeacher');
    await page.fill('#teacherNameInput','Ms Johnson');
    await page.fill('#classCodeInput','TEST12');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-map:not(.hide)');
    await page.click('#showDashBtn');
    await page.waitForSelector('#dashOverlay:not(.hide)');
    await page.waitForTimeout(600);
    const kpis=await page.textContent('#dashKpis');
    if(!/Data coverage/.test(kpis))throw new Error('no coverage KPI');
    if(!/Clarification/.test(kpis))throw new Error('no clarification KPI');
    const prof=await page.textContent('#dashProfile');
    if(!/Tier profile/i.test(prof))throw new Error('no tier profile card');
    if(!/Mean CAT4 SAS/.test(prof)){console.log('PROFILE:',prof.replace(/\s+/g,' ').slice(0,600));
      console.log(await page.evaluate(async()=>{const ks=await sList('stu:'+classCode+':');const out=[];for(const k of ks){out.push(await sGet(k));}return JSON.stringify(out.map(s=>({n:s.name,bm:s.bm})));}));
      throw new Error('no CAT4 mean');}
    if(!/Reading age/.test(prof)&&!/Below/.test(prof))throw new Error('no reading stat');
    const flags=await page.textContent('#dashProfile');
    if(!/Reading age .* below/.test(flags))throw new Error('reading-gap flag missing');
    if(!/No benchmark data/.test(flags))throw new Error('no-data flag missing for Chen');
    await page.click('#closeDashBtn');
  });

  await step('grouping panel tiers and groups students',async()=>{
    await page.click('#preLearnBtn');
    await page.waitForSelector('#preOverlay:not(.hide)');
    await page.waitForTimeout(600);
    const panel=await page.textContent('#prePanel');
    if(!/Benchmark tier/.test(panel))throw new Error('mode pills missing');
    const chips=await page.$$eval('#plGroups .grp-chip',e=>e.map(x=>x.textContent.trim()));
    if(chips.length<3)throw new Error('expected 3 chips, got '+JSON.stringify(chips));
    // tier override
    await page.selectOption('.pl-tiersel[data-tname="Aisha"]','3');
    await page.waitForTimeout(500);
    const after=await page.$eval('.pl-tiersel[data-tname="Aisha"]',e=>e.value);
    if(after!=='3')throw new Error('override did not stick: '+after);
    await page.click('#closePreBtn');
  });

  await step('config export/import round-trips',async()=>{
    await page.click('#benchSetBtn');
    const cfgJson=await page.evaluate(()=>JSON.stringify(setDraft));
    const round=await page.evaluate(j=>JSON.stringify(mergeBench(JSON.parse(j))),cfgJson);
    if(JSON.parse(round).tiers.names[0]!=='Emerging')throw new Error('tier names lost');
    await page.click('#setCancelBtn');
  });

  console.log(errs.length?('\n⚠️ console/page errors:\n'+errs.join('\n')):'\n✨ no console errors');
  await b.close();
  process.exit(errs.length?1:0);
})();
