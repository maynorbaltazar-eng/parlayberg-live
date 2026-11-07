const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'control.html'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/teams/catalog.json')));
function setup(failCatalog=false){
 const elements={};
 function element(id=''){return {id,value:'',style:{},children:[],files:[],classList:{toggle(){}},appendChild(o){this.children.push(o)},replaceChildren(){this.children=[]},addEventListener(type,fn){this[type]=fn},removeAttribute(key){delete this[key]}}}
 for(const [,id] of html.matchAll(/id="([^"]+)"/g)) elements[id]=element(id);
 let server={homeTeam:'Original',awayTeam:'Away',homeLogo:'https://example.com/manual.png',awayLogo:'',homeScore:2,pred1Pick:'Existing pick',clock:'00:00'};
 const posts=[];
 const context={document:{getElementById:id=>elements[id],createElement:()=>element()},location:{origin:'http://localhost'},console,setInterval(){},Date,FileReader:class{readAsDataURL(){this.result='data:image/png;base64,dGVzdA==';this.onload()}}};
 Object.assign(context,elements);
 context.fetch=async(url,options)=>{
  if(url.includes('catalog'))return {ok:!failCatalog,json:async()=>catalog};
  if(options?.method==='POST'){const payload=JSON.parse(options.body);posts.push(payload);server={...server,...payload};}
  return {ok:true,json:async()=>({...server})};
 };
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'team-selector.js'),'utf8'),context);
 vm.runInContext(html.match(/<script>\s*([\s\S]*?)<\/script>/)[1],context);
 return {context,elements,posts,run:code=>vm.runInContext(code,context)};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('search aliases, accents, no matches and explicit selection',async()=>{
 const t=setup();await settle();
 for(const [query,name] of [['man city','Manchester City'],['BARÇA','Barcelona'],['Bayern München','Bayern Munich'],['United States','USA']]){
  t.elements.homeSearch.value=query;t.elements.homeSearch.input();
  assert(t.elements.homePreset.children.some(o=>o.value===name));
 }
 t.elements.homeSearch.value='unknown team';t.elements.homeSearch.input();
 assert.equal(t.elements.homePreset.children.length,1);
 assert.equal(t.elements.homeTeam.value,'Original');
 t.run("applyPreset('home','Real Madrid');applyPreset('away','Arsenal')");
 assert.equal(t.elements.homeTeam.value,'Real Madrid');
 assert.equal(t.elements.awayTeam.value,'Arsenal');
 assert.equal(t.posts.length,0,'selection stays a draft until Update Overlay');
 await t.run('pollLive()');
 assert.equal(t.elements.homeTeam.value,'Real Madrid','polling preserves selection');
 await t.run('saveAll()');await settle();
 assert.equal(t.posts[0].homeLogo,catalog.find(t=>t.name==='Real Madrid').logo);
 assert.equal(t.posts[0].awayTeam,'Arsenal');
 assert.equal(t.posts[0].pred1Pick,'Existing pick');
 assert(!('clock' in t.posts[0]));
 assert.equal(t.elements.hs.textContent,2);
});
test('manual URLs, upload, removal and image failure remain usable',async()=>{
 const t=setup();await settle();
 t.elements.homeLogo.value='https://example.com/custom.png';
 await t.run('saveAll()');await settle();
 assert.equal(t.posts[0].homeLogo,'https://example.com/custom.png');
 t.elements.homeLogoFile.files=[{}];
 t.run("pickLogo(document.getElementById('homeLogoFile'),'homeLogo','homeLogoPreview')");
 assert(t.elements.homeLogo.value.startsWith('data:image/'));
 t.elements.homeLogoPreview.onerror();
 assert.equal(t.elements.homeLogoPreview.style.visibility,'hidden');
 t.run("clearLogo('homeLogo','homeLogoPreview','homeLogoFile')");
 await t.run('saveAll()');await settle();
 assert.equal(t.posts.at(-1).homeLogo,'');
 assert.equal(t.elements.homeLogoPreview.src,undefined);
});
test('catalog failure leaves manual controls usable',async()=>{
 const t=setup(true);await settle();
 assert(t.elements.homeSearchStatus.textContent.includes('unavailable'));
 t.elements.homeTeam.value='Custom FC';await t.run('saveAll()');await settle();
 assert.equal(t.posts[0].homeTeam,'Custom FC');
});
test('all curated assets are local PNGs, unique and nonempty',()=>{
 assert.equal(new Set(catalog.map(t=>t.name)).size,catalog.length);
 for(const team of catalog){
  const data=fs.readFileSync(path.join(root,team.logo));
  assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a',team.name);
  assert(data.readUInt32BE(16)>0 && data.readUInt32BE(20)>0,team.name);
 }
});
