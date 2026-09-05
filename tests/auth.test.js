const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const page=await b.newPage({viewport:{width:1400,height:900}});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  const step=async(n,fn)=>{try{await fn();console.log('✅ '+n);}catch(e){console.log('❌ '+n+' → '+e.message);throw e;}};

  const AUTH_MSG='Anonymous sign-in is switched off for this Firebase project.';
  // Stand in for a project where Anonymous sign-in has not been enabled yet:
  // the app initialises fine, but every read and write is refused.
  const stub=`window.__cmDB={ready:()=>true,signedIn:()=>false,error:()=>${JSON.stringify(AUTH_MSG)},
    get:async()=>{throw new Error('not-signed-in')},set:async()=>{throw new Error('not-signed-in')},
    del:async()=>{throw new Error('not-signed-in')},list:async()=>{throw new Error('not-signed-in')}};`;
  await page.addInitScript(stub);
  await page.goto('file:///tmp/test.html');
  await page.evaluate(stub);   // re-apply after the module script overwrites it

  await step('teacher gets a standing "not syncing" warning',async()=>{
    await page.click('#segTeacher');
    await page.fill('#teacherNameInput','Ms J');
    await page.fill('#classCodeInput','AUTH01');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-map:not(.hide)',{timeout:8000});
    await page.waitForTimeout(800);
    if(await page.isHidden('#syncBanner'))throw new Error('sync banner not shown');
    const txt=await page.textContent('#syncBanner');
    if(!/Not syncing/.test(txt))throw new Error('banner text: '+txt);
    if(!/Anonymous sign-in is switched off/.test(txt))throw new Error('banner omits the reason: '+txt);
    if(!/Students will not be able to join/.test(txt))throw new Error('banner omits the consequence: '+txt);
  });

  await step('student on their own device is told the real reason',async()=>{
    // A fresh context = a different device, with no localStorage cache to
    // mask the failure the way the teacher's own machine would.
    const ctx=await b.newContext({viewport:{width:420,height:860}});
    const sp=await ctx.newPage();
    await sp.addInitScript(stub);
    await sp.goto('file:///tmp/test.html');
    await sp.evaluate(stub);
    await sp.fill('#codeInput','AUTH01');
    await sp.fill('#nameInput','Aanya');
    await sp.click('#loginBtn');
    await sp.waitForTimeout(1800);
    const err=await sp.textContent('#loginErr');
    if(!/Anonymous sign-in is switched off/.test(err))throw new Error('login error was: "'+err+'"');
    await ctx.close();
  });

  await step('banner clears once sign-in succeeds',async()=>{
    await page.click('#logoutBtn');                 // step 1 left us on the map
    await page.waitForSelector('#view-login:not(.hide)');
    await page.evaluate(()=>{
      const mem={};
      window.__cmDB={ready:()=>true,signedIn:()=>true,error:()=>'',
        get:async k=>mem[k]!==undefined?JSON.parse(mem[k]):null,
        set:async(k,v)=>{mem[k]=JSON.stringify(v);},
        del:async k=>{delete mem[k];},
        list:async p=>Object.keys(mem).filter(k=>k.startsWith(p))};
    });
    await page.click('#segTeacher');
    await page.fill('#teacherNameInput','Ms J');
    await page.fill('#classCodeInput','AUTH02');
    await page.click('#loginBtn');
    await page.waitForSelector('#view-map:not(.hide)',{timeout:8000});
    await page.waitForTimeout(900);
    if(await page.isVisible('#syncBanner'))throw new Error('banner still showing after successful sign-in');
  });

  console.log(errs.length?('\n⚠️ '+errs.join(' | ')):'\n✨ no page errors');
  await b.close();
})();
