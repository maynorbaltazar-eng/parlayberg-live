const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../prediction-picks.js'),'utf8'),context);
const model=context.PredictionPicks;
const base={period:'full',homeName:'Arsenal',awayName:'Barcelona',team:'home',line:'2.5',exactHome:2,exactAway:1,text:'Saka'};
test('all soccer market outcomes have valid human-readable descriptions',()=>{
 for(const [market,spec] of Object.entries(model.markets)){
  for(const [outcome] of spec.options.length?spec.options:[['']]){
   const pick={...base,market,outcome};
   model.validate(pick);
   assert(model.describe(pick).length>0,market+' '+outcome);
   assert.equal(model.result('AUTO',pick,9,1),'PENDING','live counters must never settle '+market);
  }
 }
 assert.equal(model.describe({...base,market:'winner',outcome:'home'}),'Arsenal to win');
 assert.equal(model.describe({...base,market:'winner',outcome:'draw'}),'Draw');
 assert.equal(model.describe({...base,market:'winner',outcome:'away'}),'Barcelona to win');
 assert.equal(model.describe({...base,market:'goals',outcome:'under'}),'Under 2.5 goals');
 assert.equal(model.describe({...base,market:'btts',outcome:'no'}),'Both teams to score — No');
 assert.equal(model.describe({...base,market:'exact_score'}),'Arsenal 2–1 Barcelona');
 assert.equal(model.describe({...base,market:'team_goals',outcome:'over',team:'away'}),'Barcelona over 2.5 goals');
});
test('manual outcomes and legacy automatic trackers are independent',()=>{
 const pick={...base,market:'winner',outcome:'home'};
 for(const value of ['PENDING','HIT','LOST','VOID'])assert.equal(model.result(value,pick,0,10),value);
 assert.equal(model.result('AUTO',null,2,2),'HIT');
 assert.equal(model.result('AUTO',null,1,2),'PENDING');
 assert.equal(model.result('AUTO',null,9,0),'PENDING');
 assert.equal(model.resultLabel('HIT'),'WON');
});
test('incomplete, invalid and unsupported picks cannot be saved',()=>{
 const invalid=[{market:'not-a-market'},{market:'winner',outcome:'invalid'},{market:'goals',outcome:'over',line:''},{market:'goals',outcome:'under',line:-1},{market:'goals',outcome:'over',line:2.2},{market:'goals',outcome:'over',line:null},{market:'exact_score',exactHome:1.5},{market:'exact_score',exactAway:-1},{market:'player_goal',outcome:'yes',text:''},{market:'custom',outcome:'yes',text:'x'.repeat(161)},{market:'team_goals',outcome:'over',team:'other'},{market:'btts',outcome:'yes',period:'unknown'}];
 for(const fields of invalid)assert.throws(()=>model.validate({...base,...fields}),undefined,JSON.stringify(fields));
 assert.equal(model.describe(null),'');
 assert.equal(model.isPick({market:'__proto__'}),false);
});
