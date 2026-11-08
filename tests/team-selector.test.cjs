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
 vm.runInContext(fs.readFileSync(path.join(root,'prediction-picks.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(root,'team-selector.js'),'utf8'),context);
 vm.runInContext(fs.readFileSync(path.join(root,'prediction-pick-controller.js'),'utf8'),context);
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
test('prediction selectors share the full catalog, save both icons in all eight rows and preserve custom match labels',async()=>{
 const t=setup();await settle();
 for(let i=1;i<=8;i++){
  assert.equal(t.elements['pred'+i+'HomePreset'].children.length,195);
  assert.equal(t.elements['pred'+i+'AwayPreset'].children.length,195);
  t.elements['pred'+i+'Match'].value='MATCH '+i;
  t.run('applyPredictionPreset('+i+',"Home","Arsenal");applyPredictionPreset('+i+',"Away","Barcelona")');
  assert.equal(t.elements['pred'+i+'Match'].value,'Arsenal vs Barcelona');
  assert.equal(t.elements['pred'+i+'HomeLogoPreview'].children[0].src,'/assets/teams/18.png');
 }
 assert.equal(t.posts.length,0);
 await t.run('pollLive()');
 assert.equal(t.elements.pred8Icon.value,'/assets/teams/18.png');
 await t.run('saveAll()');await settle();
 for(let i=1;i<=8;i++){
  assert.equal(t.posts[0]['pred'+i+'Icon'],'/assets/teams/18.png');
  assert.equal(t.posts[0]['pred'+i+'Icon2'],'/assets/teams/15.png');
  assert.equal(t.elements['pred'+i+'HomePreset'].value,'Arsenal');
 }
 t.elements.pred8Icon.value='';
 await t.run('load()');
 assert.equal(t.elements.pred8Icon.value,'/assets/teams/18.png');
 assert.equal(t.elements.pred8HomePreset.value,'Arsenal');
 assert.equal(t.elements.homeTeam.value,'Original');
 t.elements.pred1Match.value='My custom derby';
 t.run('applyPredictionPreset(1,"Home","Guadalajara")');
 assert.equal(t.elements.pred1Match.value,'My custom derby');
 t.run('applyPredictionPreset(8,"Home","Liverpool")');
 assert.equal(t.elements.pred8Match.value,'Liverpool vs Barcelona');
 assert.equal(t.elements.pred7Match.value,'Arsenal vs Barcelona');
});
test('prediction search does not change icons; manual emoji, saved images, clearing and main-match copying work',async()=>{
 const t=setup();await settle();
 t.elements.pred1HomeSearch.value='Liga MX';t.elements.pred1HomeSearch.input();
 assert.equal(t.elements.pred1HomePreset.children.length,19);
 assert.equal(t.elements.pred1Icon.value,'');
 t.elements.pred1Icon.value='🇭🇳';t.run('refreshPredictionLogo(1,"Home")');
 assert.equal(t.elements.pred1HomeLogoPreview.textContent,'🇭🇳');
 t.elements.pred1Icon2.value='https://example.com/logo.png';t.run('refreshPredictionLogo(1,"Away")');
 assert.equal(t.elements.pred1AwayLogoPreview.children[0].src,'https://example.com/logo.png');
 t.elements.pred1AwayLogoPreview.children[0].onerror();
 assert.equal(t.elements.pred1AwayLogoPreview.textContent,'⚽');
 t.run('clearPredictionLogo(1,"Home")');
 assert.equal(t.elements.pred1Icon.value,'');
 assert.equal(t.elements.pred1Icon2.value,'https://example.com/logo.png');
 t.run('applyPreset("home","Arsenal");applyPreset("away","Barcelona");copyMainMatch(2)');
 assert.equal(t.elements.pred2Match.value,'Arsenal vs Barcelona');
 assert.equal(t.elements.pred2Icon.value,'/assets/teams/18.png');
 assert.equal(t.elements.pred2Icon2.value,'/assets/teams/15.png');
 await t.run('saveAll()');await settle();
 assert.equal(t.posts[0].pred1Icon,'');
 assert.equal(t.posts[0].pred1Icon2,'https://example.com/logo.png');
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
  assert.match(team.logo,/^\/assets\/teams\/[a-z0-9-]+\.png$/);
  const data=fs.readFileSync(path.join(root,team.logo));
  assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a',team.name);
  assert(data.readUInt32BE(16)>0 && data.readUInt32BE(20)>0,team.name);
 }
});
test('structured winner picks save, reload, reset results on edits and leave other rows untouched',async()=>{
 const t=setup();await settle();
 t.run('applyPredictionPreset(1,"Home","Arsenal");applyPredictionPreset(1,"Away","Barcelona")');
 t.elements.pred1PickType.value='winner';t.elements.pred1PickType.change();
 assert.equal(t.elements.pred1PickOutcome.children.length,3);
 assert.equal(t.elements.pred1CurrentLegacyBox.hidden,true);
 t.elements.pred1PickOutcome.value='away';t.elements.pred1PickOutcome.input();
 t.elements.pred1Current.value=9;t.elements.pred1Target.value=1;
 assert.equal(t.run('predStatus(1)'),'PENDING');
 t.elements.pred1Result.value='HIT';t.elements.pred1Result.change();
 await t.run('saveAll()');await settle();
 assert.equal(t.posts[0].pred1Selection.market,'winner');
 assert.equal(t.posts[0].pred1Selection.outcome,'away');
 assert.equal(t.posts[0].pred1Selection.homeName,'Arsenal');
 assert.equal(t.posts[0].pred1Pick,'Barcelona to win');
 assert.equal(t.posts[0].pred1Result,'HIT');
 assert.equal(t.posts[0].pred2Selection,null);
 t.elements.pred1PickType.value='';await t.run('load()');
 assert.equal(t.elements.pred1PickType.value,'winner');
 assert.equal(t.elements.pred1PickOutcome.value,'away');
 assert.equal(t.elements.pred1Result.value,'HIT');
 t.elements.pred1PickOutcome.value='draw';t.elements.pred1PickOutcome.input();
 assert.equal(t.elements.pred1Result.value,'PENDING');
 t.elements.pred1PickType.value='';t.elements.pred1PickType.change();
 assert.equal(t.elements.pred1CurrentLegacyBox.hidden,false);
 assert.equal(t.elements.pred1Result.value,'AUTO');
});
test('total-goal lines and exact scores validate before any state request',async()=>{
 const t=setup();await settle();
 t.elements.pred8PickType.value='goals';t.elements.pred8PickType.change();
 t.elements.pred8PickLine.value='';await t.run('saveAll()');await settle();
 assert.equal(t.posts.length,0);
 assert(t.elements.status.textContent.includes('Prediction 8'));
 t.elements.pred8PickLine.value='3.5';
 t.elements.pred8PickOutcome.value='under';await t.run('saveAll()');await settle();
 assert.equal(t.posts[0].pred8Pick,'Under 3.5 goals');
 t.elements.pred8PickType.value='exact_score';t.elements.pred8PickType.change();
 t.elements.pred8PickExactHome.value='1.5';await t.run('saveAll()');await settle();
 assert.equal(t.posts.length,1);
 t.elements.pred8PickExactHome.value='2';t.elements.pred8PickExactAway.value='1';
 await t.run('saveAll()');await settle();
 assert.equal(t.posts.at(-1).pred8Selection.exactHome,'2');
});
test('all nine leagues are complete and original saved logo paths remain valid',()=>{
 const counts={'Premier League':20,'La Liga':20,'Serie A':20,'Ligue 1':18,'Bundesliga':18,'Eredivisie':18,'Liga Portugal':18,'MLS':30,'Liga MX':18};
 assert.equal(catalog.length,194);
 for(const [league,count] of Object.entries(counts)){
  const teams=catalog.filter(t=>t.league===league);
  assert.equal(teams.length,count,league);
  assert(teams.every(t=>t.kind==='Club' && t.season===(league==='MLS'?'2026':'2026-27')));
 }
 assert.equal(catalog.filter(t=>t.kind==='National team').length,14);
 const original=['Argentina','Brazil','Mexico','Honduras','USA','Spain','France','England','Portugal','Germany','Italy','Netherlands','Colombia','Uruguay','Real Madrid','Barcelona','Manchester United','Manchester City','Arsenal','Chelsea','Liverpool','Bayern Munich','Inter Milan','AC Milan','PSG','Juventus'];
 original.forEach((name,i)=>assert.equal(catalog.find(t=>t.name===name)?.logo,'/assets/teams/'+i+'.png',name));
 for(const name of ['Coventry City','Hull City','Ipswich Town','Málaga','Racing Santander','Deportivo La Coruña','Frosinone','Monza','Venezia','Troyes','Le Mans','Schalke 04','Elversberg','Paderborn']) assert(catalog.some(t=>t.name===name),name);
});
test('league search, common nicknames and accented club names work',async()=>{
 const t=setup();await settle();
 for(const [query,count] of [['EPL',20],['Premier League',20],['LaLiga',20],['Serie A',20],['SerieA',20],['Ligue1',18],['League1',18],['Bundesliga',18],['Eredivisie',18],['Eredivise',18],['Liga Portugal',18],['Portugal Liga',18],['Primeira Liga',18],['MLS',30],['Major League Soccer',30],['LigaMX',18],['Liga MX',18]]){
  t.elements.homeSearch.value=query;t.elements.homeSearch.input();
  assert.equal(t.elements.homePreset.children.length-1,count,query);
 }
 for(const [query,name] of [['Spurs','Tottenham Hotspur'],['Gladbach','Borussia Mönchengladbach'],['malaga','Málaga'],['Atleti','Atlético Madrid'],['Serie A Napoli','Napoli'],['EPL Arsenal','Arsenal'],['Chivas','Guadalajara'],['America','Club América'],['Pumas','Pumas UNAM'],['LAFC','Los Angeles FC'],['NYRB','Red Bull New York'],['Sporting Lisbon','Sporting CP'],['PSV','PSV Eindhoven'],['montreal','CF Montréal'],['Argentina','Argentina']]){
  t.elements.homeSearch.value=query;t.elements.homeSearch.input();
  assert(t.elements.homePreset.children.some(o=>o.value===name),query);
 }
 const option=t.elements.homePreset.children[1];
 assert(option.textContent.includes('National team'));
 t.elements.homeSearch.value='Serie A';t.elements.homeSearch.input();
 assert(t.elements.homePreset.children[1].textContent.includes('Serie A'));
});
test('all previous 110 name/logo pairs are preserved and current new clubs are covered',()=>{
 const previous=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/previous-team-paths.json'),'utf8'));
 assert.equal(Object.keys(previous).length,110);
 for(const [name,logo] of Object.entries(previous)) assert.equal(catalog.find(t=>t.name===name)?.logo,logo,name);
 for(const name of ['Atlante','San Diego FC','Red Bull New York','ADO Den Haag','Cambuur','Willem II','Académico de Viseu','Marítimo']) assert(catalog.some(t=>t.name===name),name);
 assert(!catalog.some(t=>t.name==='Mazatlán'),'Mazatlán was replaced by Atlante in the current Liga MX roster');
});
test('every club selects and saves its own bundled logo without changing the other side',async()=>{
 const t=setup();await settle();
 t.run("applyPreset('away','Barcelona')");
 const awayLogo=t.elements.awayLogo.value;
 for(const team of catalog.filter(t=>t.kind==='Club')){
  t.run('applyPreset("home",'+JSON.stringify(team.name)+')');
  await t.run('saveAll()');await settle();
  assert.equal(t.posts.at(-1).homeTeam,team.name);
  assert.equal(t.posts.at(-1).homeLogo,team.logo);
  assert.equal(t.posts.at(-1).awayLogo,awayLogo);
  assert.equal(t.elements.homeLogoPreview.src,team.logo);
 }
});
