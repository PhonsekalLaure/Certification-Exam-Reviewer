// Semantic checks execute reviewed examples only in an isolated test browser.
// The application continues to render every exhibit as escaped text.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1123-915-0_26.1123.915.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const bank=JSON.parse(readFileSync(new URL('../src/data/html-css.json',import.meta.url),'utf8'));
const q=n=>bank.questions.find(q=>q.number===n);
const filled=n=>q(n).exhibit.replace(/^\d{2}(?: |$)/gm,'').replace(/\[(\d+)\]/g,(_,i)=>q(n).pairs[Number(i)-1].right);
const answer=n=>q(n).options.find(o=>o.id===q(n).correctIds[0]).text;
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1024,height:800}});
const results=[];
const pass=m=>{results.push(m);console.log('PASS:',m)};
const style=(selector,property)=>page.locator(selector).first().evaluate((el,p)=>getComputedStyle(el)[p],property);
await page.route('**/*',route=>route.abort());
try {
  await page.setContent(q(6).exhibit);
  assert.equal(await style('p','backgroundColor'),'rgb(0, 128, 0)');assert.equal(answer(6),'Green');
  await page.setContent(filled(10));
  assert.equal(await style('#style1','color'),'rgb(255, 0, 0)');assert.equal(await style('#style1','fontSize'),'30px');
  assert.equal(await style('p:not([id])','color'),'rgb(128, 0, 128)');assert.equal(q(10).pairs[2].right,'purple');
  pass('CSS specificity and inheritance produce Green and purple, correcting the source keys');

  const external=q(5).exhibit.split('<!-- Head markup -->')[0].replace('/* mystyles.css */','');
  const document=q(5).exhibit.split('<!-- Head markup -->')[1].replace('href="mystyles.css"','href="https://review.test/mystyles.css"');
  await page.route('https://review.test/mystyles.css',route=>route.fulfill({contentType:'text/css',body:external}));
  await page.setContent(document);await page.locator('h2').waitFor();
  assert.deepEqual(await page.locator('h1,h2,p').evaluateAll(els=>els.map(e=>getComputedStyle(e).color)),['rgb(0, 0, 0)','rgb(0, 0, 255)','rgb(0, 0, 255)','rgb(128, 0, 0)','rgb(0, 0, 0)']);
  pass('External, internal, and inline color rules agree with every cascade statement');

  for (const [width,image] of [[767,'SmallLogo.png'],[768,'NormalLogo.png'],[1024,'NormalLogo.png']]) {
    await page.setViewportSize({width,height:800});
    await page.setContent(`<style>${filled(15)}</style><div class="welcome">Welcome</div>`);
    assert.ok((await style('.welcome','backgroundImage')).endsWith(`${image}")`));
  }
  assert.equal(q(15).pairs[1].right,'min-width');
  pass('Responsive backgrounds are correct at 767, 768, and 1024 CSS pixels');

  await page.setContent(filled(16));
  assert.equal(await style('.label','display'),'inline');assert.equal(await style('.question','display'),'inline');
  const geometry=await page.evaluate(()=>{
    const image=document.querySelector('.icon').getBoundingClientRect();
    const after=document.querySelector('.after').getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(document.querySelector('.description'));
    const text=range.getBoundingClientRect();return {bottom:image.bottom,after:after.top,text:text.top};
  });
  assert.ok(geometry.text<geometry.bottom);assert.ok(geometry.after>=geometry.bottom);
  assert.deepEqual(q(16).pairs.map(p=>p.right),['Yes','No','Yes']);
  pass('The repaired float example wraps description text and clears the final paragraph');

  const [css,html]=q(17).exhibit.split('\n\n');await page.setContent(`<style>${css}</style>${html}`);
  assert.equal(await style('.productBox','color'),'rgb(0, 0, 0)');assert.equal(await style('.productBox','backgroundColor'),'rgb(0, 255, 0)');
  await page.setContent(`<style>body{font-size:16px}${filled(18)}</style><p>Example</p>`);
  assert.equal(await style('p','color'),'rgb(0, 0, 255)');assert.equal(await style('p','lineHeight'),'50px');assert.equal(await style('p','fontSize'),'24px');assert.equal(await style('p','fontStyle'),'italic');
  await page.setContent(`<style>body{${q(19).exhibit}}</style>`);
  assert.equal(await style('body','backgroundColor'),'rgb(0, 0, 255)');assert.equal(await style('body','backgroundRepeat'),'repeat-x');assert.equal(await style('body','backgroundPositionX'),'100%');
  assert.deepEqual(q(19).pairs.map(p=>p.right),['No','Yes']);
  pass('Repaired selectors, valid blue color, typography, and background shorthand render as keyed');

  assert.equal(answer(20),'Absolute positioning');
  await page.setContent('<style>.parent{position:relative;height:200px}.child{position:absolute;top:20px;left:30px;height:50px}.next{height:10px}</style><div class="parent"><div class="child">Absolute</div><div class="next">Normal flow</div></div>');
  const position=await page.evaluate(()=>{const p=document.querySelector('.parent').getBoundingClientRect(),c=document.querySelector('.child').getBoundingClientRect(),n=document.querySelector('.next').getBoundingClientRect();return[c.top-p.top,c.left-p.left,n.top-p.top]});
  assert.deepEqual(position,[20,30,0]);
  pass('Absolute positioning uses ancestor offsets and leaves no normal-flow space');

  await page.setContent(filled(12));
  assert.equal(await page.evaluate(()=>document.compatMode),'CSS1Compat');assert.equal(await page.title(),'Hello World');assert.match(await page.locator('body').textContent(),/Hello World/);
  const head=q(13).correctIds.map(id=>q(13).options.find(o=>o.id===id).text).join('\n');
  await page.setContent(`<!DOCTYPE html><html>${head}<body></body></html>`);
  assert.equal(await page.title(),'About Contoso');assert.equal(await page.locator('head meta').getAttribute('charset'),'utf-8');
  await page.setContent('<!DOCTYPE html><html>'+filled(14)+'</html>');
  assert.equal(await page.locator('link[rel="stylesheet"]').getAttribute('href'),'style.css');assert.equal(await page.locator('script[src]').getAttribute('src'),'_js/form.js');assert.equal(await page.title(),'Blue Yonder Airlines');assert.equal(await page.locator('noscript').textContent(),'Your browser does not support JavaScript!');
  for (const [n,src,alt] of [[2,'portrait.png','Family Portrait'],[22,'contoso.png','Contoso Logo'],[24,'html15.gif','HTML Icon']]) {
    await page.setContent(filled(n));assert.equal(await page.locator('img').getAttribute('src'),src);assert.equal(await page.locator('img').getAttribute('alt'),alt);
  }
  await page.setContent(filled(23));assert.equal(await page.locator('video').evaluate(e=>e.controls),true);assert.equal(await page.locator('video source').getAttribute('type'),'video/mp4');
  pass('Completed doctype, head, metadata, image alternatives, and video markup parse correctly');
  mkdirSync('test-results',{recursive:true});writeFileSync('test-results/reviewed-answers-report.json',JSON.stringify({passed:results},null,2));
} finally {await browser.close()}
