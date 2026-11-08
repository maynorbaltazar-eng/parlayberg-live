const savedPredictionNames={};
function pickElement(i,suffix){return document.getElementById('pred'+i+suffix)}
function predictionTeamNames(i){
  const parts=pickElement(i,'Match').value.split(/\s+vs\.?\s+/i);
  return {
    homeName:pickElement(i,'HomePreset').value || (parts.length===2?parts[0]:savedPredictionNames[i]?.homeName||'Home team'),
    awayName:pickElement(i,'AwayPreset').value || (parts.length===2?parts[1]:savedPredictionNames[i]?.awayName||'Away team')
  };
}
function populatePickOutcomes(i,selected){
  const type=pickElement(i,'PickType').value,market=PredictionPicks.markets[type];
  const select=pickElement(i,'PickOutcome');
  select.replaceChildren();
  for(const [value,label] of market?.options||[]){const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option)}
  select.value=selected ?? market?.options[0]?.[0] ?? '';
  for(const option of pickElement(i,'Result').children)if(option.value==='AUTO')option.hidden=!!market;
  pickElement(i,'PickOutcomeBox').hidden=!market?.options.length;
  for(const [suffix,show] of [['PickLineBox',market?.line],['PickTeamBox',market?.team],['PickExactBox',market?.exact],['PickTextBox',market?.text]])pickElement(i,suffix).hidden=!show;
  pickElement(i,'PickPeriodBox').hidden=!market;
  for(const suffix of ['Market','Pick','Current','Target','Unit','Percent'])pickElement(i,suffix+'LegacyBox').hidden=!!market;
  pickElement(i,'StepUp').hidden=!!market;pickElement(i,'StepDown').hidden=!!market;
  refreshPickLabels(i);
}
function refreshPickLabels(i){
  const names=predictionTeamNames(i),market=PredictionPicks.markets[pickElement(i,'PickType').value];
  for(const option of pickElement(i,'PickOutcome').children){
    const label=market?.options.find(([value])=>value===option.value)?.[1]||'';
    option.textContent=label.replace('Home',names.homeName).replace('Away',names.awayName);
  }
  for(const option of pickElement(i,'PickTeam').children)option.textContent=option.value==='away'?names.awayName:names.homeName;
}
function readPredictionPick(i){
  const market=pickElement(i,'PickType').value;
  if(!market)return null;
  return {market,outcome:pickElement(i,'PickOutcome').value,team:pickElement(i,'PickTeam').value,
    line:pickElement(i,'PickLine').value,exactHome:pickElement(i,'PickExactHome').value,exactAway:pickElement(i,'PickExactAway').value,
    text:pickElement(i,'PickText').value.trim(),period:pickElement(i,'PickPeriod').value,...predictionTeamNames(i)};
}
function predictionPickChanged(i,typeChanged=false){
  if(typeChanged)populatePickOutcomes(i);
  if(typeChanged || pickElement(i,'PickType').value)pickElement(i,'Result').value=pickElement(i,'PickType').value?'PENDING':'AUTO';
  updatePredPreview(i);
}
function drawPredictionPick(i,pick,mode){
  const active=PredictionPicks.isPick(pick);
  savedPredictionNames[i]=active?{homeName:pick.homeName,awayName:pick.awayName}:{};
  pickElement(i,'PickType').value=active?pick.market:'';
  populatePickOutcomes(i,active?pick.outcome:undefined);
  for(const [suffix,value] of [['PickTeam',pick?.team||'home'],['PickLine',pick?.line??2.5],['PickExactHome',pick?.exactHome??0],['PickExactAway',pick?.exactAway??0],['PickText',pick?.text||''],['PickPeriod',pick?.period||'full']])pickElement(i,suffix).value=value;
  pickElement(i,'Result').value=['AUTO','PENDING','HIT','LOST','VOID'].includes(mode)?mode:'AUTO';
  if(active && pickElement(i,'Result').value==='AUTO')pickElement(i,'Result').value='PENDING';
  updatePredPreview(i);
}
function collectPredictionPicks(payload){
  for(let i=1;i<=8;i++){
    const pick=readPredictionPick(i);
    try{if(pick)PredictionPicks.validate(pick)}catch(error){document.getElementById('status').textContent='Prediction '+i+': '+error.message;return false}
    payload['pred'+i+'Selection']=pick;
    payload['pred'+i+'Result']=pickElement(i,'Result').value;
    if(pick){payload['pred'+i+'Market']=PredictionPicks.markets[pick.market].label;payload['pred'+i+'Pick']=PredictionPicks.describe(pick)}
  }
  return true;
}
function initPickListeners(){
  for(let i=1;i<=8;i++){
    pickElement(i,'PickType').addEventListener('change',()=>predictionPickChanged(i,true));
    for(const suffix of ['PickOutcome','PickTeam','PickLine','PickExactHome','PickExactAway','PickText','PickPeriod'])pickElement(i,suffix).addEventListener('input',()=>predictionPickChanged(i));
    pickElement(i,'Result').addEventListener('change',()=>updatePredPreview(i));
  }
}
