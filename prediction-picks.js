// Shared display rules for user-authored soccer picks. Results are entered manually.
(function(root){
  const markets = {
    winner:{label:'Match winner',options:[['home','Home win'],['draw','Draw'],['away','Away win']]},
    double_chance:{label:'Double chance',options:[['home_draw','Home or draw'],['away_draw','Away or draw'],['home_away','Either team wins']]},
    draw_no_bet:{label:'Draw no bet',options:[['home','Home team'],['away','Away team']]},
    goals:{label:'Total goals',options:[['over','Over'],['under','Under']],line:true},
    btts:{label:'Both teams to score',options:[['yes','Yes'],['no','No']]},
    team_goals:{label:'Team total goals',options:[['over','Over'],['under','Under']],line:true,team:true},
    exact_score:{label:'Exact score',options:[],exact:true},
    clean_sheet:{label:'Team clean sheet',options:[['yes','Yes'],['no','No']],team:true},
    corners:{label:'Total corners',options:[['over','Over'],['under','Under']],line:true},
    player_goal:{label:'Player to score',options:[['yes','Yes'],['no','No']],text:true},
    custom:{label:'Custom outcome',options:[['yes','Yes'],['no','No']],text:true}
  };
  const periods={full:'90 minutes + stoppage',first:'First half',second:'Second half',extra:'Extra time only'};
  function isPick(value){return !!value && typeof value==='object' && Object.hasOwn(markets,value.market)}
  function validate(pick){
    if(!isPick(pick))throw Error('Choose a pick type');
    const market=markets[pick.market];
    if(!Object.hasOwn(periods,pick.period))throw Error('Choose the match period');
    if(market.options.length && !market.options.some(([value])=>value===pick.outcome))throw Error('Choose an outcome');
    if(market.team && !['home','away'].includes(pick.team))throw Error('Choose a team');
    const number=value=>(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isFinite(Number(value));
    if(market.line && (!number(pick.line) || Number(pick.line)<0 || !Number.isInteger(Number(pick.line)*2)))throw Error('Enter a nonnegative whole or half-number line, such as 2.5');
    if(market.exact && ![pick.exactHome,pick.exactAway].every(value=>number(value) && Number.isInteger(Number(value)) && Number(value)>=0 && Number(value)<=99))throw Error('Enter both exact scores as whole numbers from 0 to 99');
    if(market.text && (typeof pick.text!=='string' || !pick.text.trim() || pick.text.trim().length>160))throw Error('Enter a player or custom outcome (up to 160 characters)');
    return pick;
  }
  function describe(pick){
    if(!isPick(pick))return '';
    const home=String(pick.homeName||'Home team'),away=String(pick.awayName||'Away team');
    const team=pick.team==='away'?away:home, line=String(pick.line??'');
    const direction=pick.outcome==='under'?'Under':'Over';
    switch(pick.market){
      case 'winner':return pick.outcome==='draw'?'Draw':(pick.outcome==='away'?away:home)+' to win';
      case 'double_chance':return pick.outcome==='home_draw'?home+' or draw':pick.outcome==='away_draw'?away+' or draw':'Either team wins (no draw)';
      case 'draw_no_bet':return (pick.outcome==='away'?away:home)+' — draw no bet';
      case 'goals':return direction+' '+line+' goals';
      case 'btts':return 'Both teams to score — '+(pick.outcome==='no'?'No':'Yes');
      case 'team_goals':return team+' '+direction.toLowerCase()+' '+line+' goals';
      case 'exact_score':return home+' '+String(pick.exactHome??'')+'–'+String(pick.exactAway??'')+' '+away;
      case 'clean_sheet':return team+' clean sheet — '+(pick.outcome==='no'?'No':'Yes');
      case 'corners':return direction+' '+line+' corners';
      case 'player_goal':return String(pick.text||'Player')+' to score — '+(pick.outcome==='no'?'No':'Yes');
      case 'custom':return (pick.outcome==='no'?'No: ':'Yes: ')+String(pick.text||'Custom outcome');
    }
  }
  function result(mode,pick,current,target){
    if(['PENDING','HIT','LOST','VOID'].includes(mode))return mode;
    if(isPick(pick))return 'PENDING';
    return Number(target)>0 && Number(current)>=Number(target)?'HIT':'PENDING';
  }
  const resultLabels={PENDING:'PENDING',HIT:'WON',LOST:'LOST',VOID:'VOID'};
  root.PredictionPicks={markets,periods,isPick,validate,describe,result,resultLabel:value=>resultLabels[value]||'PENDING'};
})(globalThis);
