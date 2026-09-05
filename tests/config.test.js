const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const page=await b.newPage({viewport:{width:1440,height:1000}});
  const errs=[];
  page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
  await page.goto('file:///tmp/test.html');
  const step=async(n,fn)=>{ try{ await fn(); console.log('✅ '+n); }catch(e){ console.log('❌ '+n+' → '+e.message); throw e; } };
  const hidden=sel=>page.waitForFunction(s=>document.querySelector(s).classList.contains('hide'),sel);

  await step('teacher sets up a 2-tier, MAP-only school',async()=>{
    await page.click('#segTeacher');
    await page.fill('#teacherNameInput','Mr Ali');
    await page.fill('#classCodeInput','MAP001');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-map:not(.hide)');
    await page.click('#benchSetBtn');
    await page.uncheck('#pane-tests [data-on="1"][data-inst="cat4"]');
    await page.uncheck('#pane-tests [data-on="1"][data-inst="ngrt"]');
    await page.check('#pane-tests [data-on="1"][data-inst="map"]');
    await page.check('#pane-tests [data-req="1"][data-inst="map"]');
    await page.click('#setTabs button[data-p="tiers"]');
    await page.selectOption('#setTierCount','2');
    const cuts=await page.$$eval('#pane-tiers [data-icut="map"]',e=>e.map(x=>x.value));
    if(cuts.length!==1)throw new Error('expected 1 cut for 2 tiers, got '+cuts);
    if(cuts[0]!=='215')throw new Error('RIT cut should sit on the configured mean, got '+cuts[0]);
    await page.click('#setTabs button[data-p="scales"]');
    await page.fill('#setRitMean','225');
    await page.dispatchEvent('#setRitMean','change');
    await page.click('#setTabs button[data-p="tiers"]');
    const c2=await page.$$eval('#pane-tiers [data-icut="map"]',e=>e.map(x=>x.value));
    if(c2[0]!=='225')throw new Error('RIT cut did not follow the new mean: '+c2);
    await page.click('#setSaveBtn');
    await hidden('#setModal');
  });

  await step('required benchmark blocks an empty submit',async()=>{
    await page.click('#logoutBtn');
    await page.fill('#codeInput','MAP001');
    await page.fill('#nameInput','Dana');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-bench:not(.hide)');
    const groups=await page.$$eval('#benchFields .bm-title',e=>e.map(x=>x.textContent));
    if(groups.join()!=='MAP Growth')throw new Error('only MAP should be asked for, got '+groups);
    await page.click('#benchSaveBtn');
    const err=await page.textContent('#benchErr');
    if(!/required/.test(err))throw new Error('required rule not enforced: '+err);
    await page.fill('#bmf_map_rit','240');
    await page.click('#benchSaveBtn');
    await page.waitForSelector('#view-map:not(.hide)');
  });

  await step('prior-knowledge check still runs after the benchmark step',async()=>{
    await page.click('#logoutBtn');
    await page.click('#segTeacher');
    await page.fill('#teacherNameInput','Mr Ali');
    await page.fill('#classCodeInput','MAP001');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-map:not(.hide)');
    await page.click('#preLearnBtn');
    await page.waitForSelector('#preOverlay:not(.hide)');
    await page.waitForSelector('#editObjBtn');            // panel renders async
    await page.click('#editObjBtn');                      // no PLA yet → set objective
    await page.waitForSelector('#objModal:not(.hide)');
    await page.fill('#objText','Students will balance chemical equations.');
    await page.fill('#objManualJson',JSON.stringify({questions:[
      {q:'What is conserved in a chemical reaction?',options:['Mass','Colour','Volume','Heat'],answer:0},
      {q:'2H2 + O2 → ?',options:['H2O','2H2O','HO2','H4O2'],answer:1}]}));
    await page.click('#objManualLoad');
    await page.waitForSelector('#publishObjBtn:not(.hide)');
    await page.click('#publishObjBtn');
    await page.waitForSelector('#preOverlay:not(.hide)');
    await page.click('#closePreBtn');
    await page.click('#logoutBtn');
    // student: benchmark step first, then the check
    await page.fill('#codeInput','MAP001');
    await page.fill('#nameInput','Eli');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-bench:not(.hide)');
    await page.fill('#bmf_map_rit','198');
    await page.click('#benchSaveBtn');
    await page.waitForSelector('#view-pla:not(.hide)',{timeout:5000});
    await page.click('.pla-opt');                          // wrong answer
    await page.click('#plaNext');
    await page.click('.pla-opt');
    await page.click('#plaNext');
    await page.waitForSelector('#plaEnter');
    await page.click('#plaEnter');
    await page.waitForSelector('#view-map:not(.hide)');
  });

  await step('blended grouping + mixed group shape',async()=>{
    await page.click('#logoutBtn');
    await page.click('#segTeacher');
    await page.fill('#teacherNameInput','Mr Ali');
    await page.fill('#classCodeInput','MAP001');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-map:not(.hide)');
    await page.click('#benchSetBtn');
    await page.click('#setTabs button[data-p="tiers"]');
    await page.selectOption('#setGrpStyle','mixed');
    await page.fill('#setGrpSize','2');
    await page.dispatchEvent('#setGrpSize','change');
    await page.click('#setSaveBtn');
    await hidden('#setModal');
    await page.click('#preLearnBtn');
    await page.waitForSelector('#preOverlay:not(.hide)');
    await page.waitForTimeout(700);
    await page.click('#grpModeSel button[data-m="blend"]');
    await page.waitForTimeout(700);
    const tags=await page.$$eval('#plGroups .grp-tag',e=>e.map(x=>x.textContent));
    if(!tags.some(x=>/mixed/.test(x)))throw new Error('mixed shape not applied: '+tags);
    const chips=await page.$$eval('#plGroups .grp-chip',e=>e.length);
    if(chips<2)throw new Error('expected students in groups, got '+chips);
  });

  await step('privacy: hiding raw scores strips the numbers',async()=>{
    await page.click('#closePreBtn');
    await page.click('#benchSetBtn');
    await page.click('#setTabs button[data-p="scales"]');
    await page.uncheck('#setSeeRaw');
    await page.click('#setSaveBtn');
    await hidden('#setModal');
    await page.click('#showDashBtn');
    await page.waitForTimeout(800);
    const dash=await page.textContent('#dashStudents');
    if(/MAP Growth 240/.test(dash))throw new Error('raw score still visible with privacy on');
    if(!/Developing|Secure/.test(dash))throw new Error('tier names should still show');
    await page.screenshot({path:'/home/claude/cm/shot-dashboard.png',fullPage:false});
    await page.click('#closeDashBtn');
  });

  await step('screenshots for review',async()=>{
    await page.click('#benchSetBtn');
    await page.waitForSelector('#setModal:not(.hide)');
    await page.screenshot({path:'/home/claude/cm/shot-settings.png'});
    await page.click('#setCancelBtn');
    await page.click('#preLearnBtn');
    await page.waitForTimeout(800);
    await page.screenshot({path:'/home/claude/cm/shot-grouping.png'});
    await page.click('#closePreBtn');
    await page.click('#logoutBtn');
    await page.fill('#codeInput','MAP001');
    await page.fill('#nameInput','Farah');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-bench:not(.hide)');
    await page.fill('#bmf_map_rit','232');
    await page.screenshot({path:'/home/claude/cm/shot-student-bench.png'});
  });

  console.log(errs.length?('\n⚠️ page errors:\n'+errs.join('\n')):'\n✨ no page errors');
  await b.close();
})();
