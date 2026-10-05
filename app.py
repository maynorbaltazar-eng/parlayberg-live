from flask import Flask, request, jsonify, send_from_directory
import os, threading, time, requests
app=Flask(__name__, static_folder='.')
lock=threading.Lock()
state={
"homeTeam":"HOME TEAM","awayTeam":"AWAY TEAM","homeLogo":"","awayLogo":"","homeScore":0,"awayScore":0,"clock":"00:00","matchStatus":"PRE","liveDataMode":False,"liveFixtureId":"","liveClock":"",
"clockElapsed":0,"clockRunning":False,"clockLastStarted":None,"clockMode":"standard","penaltyMode":False,"penaltyHome":0,"penaltyAway":0,
"possessionHome":"50","possessionAway":"50","shotsHome":"0","shotsAway":"0",
"sotHome":"0","sotAway":"0","cornersHome":"0","cornersAway":"0",
"foulsHome":"0","foulsAway":"0","yellowHome":"0","yellowAway":"0","redHome":"0","redAway":"0",
"event1":"00'  |","event2":"00'  |","event3":"00'  |","event4":"00'  |","event5":"00'  |",
"match1Home":"HOME 1","match1Away":"AWAY 1","match1HomeScore":0,"match1AwayScore":0,"match1Status":"00:00",
"match2Home":"HOME 2","match2Away":"AWAY 2","match2HomeScore":0,"match2AwayScore":0,"match2Status":"00:00",
"match3Home":"HOME 3","match3Away":"AWAY 3","match3HomeScore":0,"match3AwayScore":0,"match3Status":"00:00",
"match4Home":"HOME 4","match4Away":"AWAY 4","match4HomeScore":0,"match4AwayScore":0,"match4Status":"00:00",
"match5Home":"HOME 5","match5Away":"AWAY 5","match5HomeScore":0,"match5AwayScore":0,"match5Status":"00:00",
"pred1Enabled":True,"pred1Match":"MATCH 1","pred1Market":"Total Goals","pred1Pick":"Over 1.5","pred1Current":0,"pred1Target":2,"pred1Unit":"Goals","pred1Result":"AUTO",
"pred2Enabled":True,"pred2Match":"MATCH 2","pred2Market":"Total Goals","pred2Pick":"Over 1.5","pred2Current":0,"pred2Target":2,"pred2Unit":"Goals","pred2Result":"AUTO",
"pred3Enabled":True,"pred3Match":"MATCH 3","pred3Market":"Total Goals","pred3Pick":"Over 1.5","pred3Current":0,"pred3Target":2,"pred3Unit":"Goals","pred3Result":"AUTO",
"pred4Enabled":True,"pred4Match":"MATCH 4","pred4Market":"Total Goals","pred4Pick":"Over 1.5","pred4Current":0,"pred4Target":2,"pred4Unit":"Goals","pred4Result":"AUTO",
"pred5Enabled":False,"pred5Match":"MATCH 5","pred5Market":"Total Goals","pred5Pick":"Over 1.5","pred5Current":0,"pred5Target":2,"pred5Unit":"Goals","pred5Result":"AUTO",
"pred6Enabled":False,"pred6Match":"MATCH 6","pred6Market":"Total Goals","pred6Pick":"Over 1.5","pred6Current":0,"pred6Target":2,"pred6Unit":"Goals","pred6Result":"AUTO",
"pred7Enabled":False,"pred7Match":"MATCH 7","pred7Market":"Total Goals","pred7Pick":"Over 1.5","pred7Current":0,"pred7Target":2,"pred7Unit":"Goals","pred7Result":"AUTO",
"pred8Enabled":False,"pred8Match":"MATCH 8","pred8Market":"Total Goals","pred8Pick":"Over 1.5","pred8Current":0,"pred8Target":2,"pred8Unit":"Goals","pred8Result":"AUTO"
}
def _elapsed_now():
    elapsed=float(state.get("clockElapsed",0) or 0)
    if state.get("clockRunning") and state.get("clockLastStarted"):
        elapsed += max(0, time.time()-float(state["clockLastStarted"]))
    return elapsed

def _format_clock(elapsed):
    elapsed=max(0,int(elapsed))
    mode=state.get("clockMode","standard")
    if mode=="standard" and elapsed>=5400:
        add=elapsed-5400
        return f"90:00 +{add//60:02d}:{add%60:02d}"
    if mode=="extra" and elapsed>=7200:
        add=elapsed-7200
        return f"120:00 +{add//60:02d}:{add%60:02d}"
    return f"{elapsed//60:02d}:{elapsed%60:02d}"

def _snapshot():
    snap=dict(state)
    elapsed=_elapsed_now()
    snap["clockElapsed"]=int(elapsed)
    snap["clock"]=(state.get("liveClock") if state.get("liveDataMode") and state.get("liveClock") else _format_clock(elapsed))
    return snap


SPORTMONKS_BASE="https://api.sportmonks.com/v3/football"

def _sportmonks_get(path, params=None):
    token=os.environ.get("SPORTMONKS_TOKEN","").strip()
    if not token:
        raise RuntimeError("SPORTMONKS_TOKEN is not configured on Render")
    headers={"Authorization":token}
    r=requests.get(f"{SPORTMONKS_BASE}{path}",params=params or {},headers=headers,timeout=12)
    r.raise_for_status()
    return r.json()

def _current_score(scores):
    out={"home":0,"away":0}
    for item in scores or []:
        if item.get("description")=="CURRENT":
            sc=item.get("score") or {}
            loc=sc.get("participant")
            if loc in out: out[loc]=int(sc.get("goals") or 0)
    return out

def _stat_value(stats, type_id, loc):
    for item in stats or []:
        if item.get("type_id")==type_id and item.get("location")==loc:
            data=item.get("data") or {}
            v=data.get("value",0)
            return 0 if v is None else v
    return 0

def _live_clock(periods):
    active=None
    for p in periods or []:
        if p.get("ticking"):
            active=p
            break
    if not active:
        return ""
    mins=int(active.get("minutes") or 0)
    secs=int(active.get("seconds") or 0)
    base=int(active.get("counts_from") or 0)+int(active.get("period_length") or 0)
    added=active.get("time_added")
    if added and mins>=base:
        return f"{base}+{max(0,mins-base)}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"

def _status_from_fixture(fixture):
    state_obj=fixture.get("state") or {}
    name=(state_obj.get("short_name") or state_obj.get("name") or "").upper()
    periods=fixture.get("periods") or []
    active=next((p for p in periods if p.get("ticking")),None)
    if active:
        t=int(active.get("type_id") or 0)
        if t==1: return "LIVE"
        if t==2: return "LIVE"
        if t in (3,4): return "ET"
        if t==5: return "PENS"
    if "HALF" in name: return "HT"
    if "FULL" in name or "FINISH" in name or "ENDED" in name: return "FT"
    if "PEN" in name: return "PENS"
    if "EXTRA" in name: return "ET"
    if name: return name[:8]
    return "LIVE"

def _format_events(events):
    labels={14:"⚽ GOAL",15:"⚽ OWN GOAL",16:"⚽ PENALTY",17:"❌ MISSED PEN",19:"🟨 YELLOW",20:"🟥 RED",21:"🟥 2ND YELLOW"}
    useful=[e for e in (events or []) if int(e.get("type_id") or 0) in labels]
    useful=sorted(useful,key=lambda e:(int(e.get("sort_order") or 0),int(e.get("minute") or 0)),reverse=True)[:5]
    out=[]
    for e in useful:
        minute=int(e.get("minute") or 0)
        extra=e.get("extra_minute")
        m=f"{minute}+{extra}" if extra else str(minute)
        who=e.get("player_name") or ""
        label=labels.get(int(e.get("type_id") or 0),"EVENT")
        result=e.get("result")
        txt=f"{m}' | {label}"
        if who: txt+=f" - {who}"
        if result: txt+=f" ({result})"
        out.append(txt)
    while len(out)<5: out.append("")
    return out

@app.get("/api/live/inplay")
def live_inplay():
    try:
        payload=_sportmonks_get("/livescores/inplay",{"include":"participants;scores;periods;state"})
        rows=[]
        for f in payload.get("data",[]):
            p=f.get("participants") or []
            home=next((x for x in p if (x.get("meta") or {}).get("location")=="home"),{})
            away=next((x for x in p if (x.get("meta") or {}).get("location")=="away"),{})
            sc=_current_score(f.get("scores"))
            rows.append({"id":f.get("id"),"name":f.get("name"),"home":home.get("name","HOME"),"away":away.get("name","AWAY"),"homeScore":sc["home"],"awayScore":sc["away"],"clock":_live_clock(f.get("periods")),"status":_status_from_fixture(f)})
        return jsonify({"ok":True,"fixtures":rows})
    except Exception as e:
        return jsonify({"ok":False,"error":str(e),"fixtures":[]}),500

@app.post("/api/live/sync")
def live_sync():
    data=request.get_json(silent=True) or {}
    fixture_id=str(data.get("fixture_id") or state.get("liveFixtureId") or "").strip()
    if not fixture_id:
        return jsonify({"ok":False,"error":"Choose a live fixture first"}),400
    try:
        payload=_sportmonks_get(f"/fixtures/{fixture_id}",{"include":"participants;scores;periods;state"})
        f=payload.get("data") or {}
        p=f.get("participants") or []
        home=next((x for x in p if (x.get("meta") or {}).get("location")=="home"),{})
        away=next((x for x in p if (x.get("meta") or {}).get("location")=="away"),{})
        sc=_current_score(f.get("scores"))
        with lock:
            state["liveDataMode"]=True
            state["liveFixtureId"]=fixture_id
            state["liveClock"]=_live_clock(f.get("periods"))
            state["homeTeam"]=home.get("name") or state["homeTeam"]
            state["awayTeam"]=away.get("name") or state["awayTeam"]
            if home.get("image_path"): state["homeLogo"]=home.get("image_path")
            if away.get("image_path"): state["awayLogo"]=away.get("image_path")
            state["homeScore"]=sc["home"]; state["awayScore"]=sc["away"]
            state["matchStatus"]=_status_from_fixture(f)
            return jsonify({"ok":True,"state":_snapshot()})
    except Exception as e:
        return jsonify({"ok":False,"error":str(e)}),500

@app.post("/api/live/stop")
def live_stop():
    with lock:
        state["liveDataMode"]=False
        state["liveFixtureId"]=""
        state["liveClock"]=""
        return jsonify({"ok":True,"state":_snapshot()})

@app.get("/api/state")
def get_state():
    with lock: return jsonify(_snapshot())

@app.post("/api/clock")
def clock_action():
    data=request.get_json(silent=True) or {}
    action=data.get("action","")
    with lock:
        now=time.time()
        elapsed=_elapsed_now()
        if action=="start":
            if not state.get("clockRunning"):
                state["clockElapsed"]=elapsed
                state["clockLastStarted"]=now
                state["clockRunning"]=True
        elif action=="pause":
            state["clockElapsed"]=elapsed
            state["clockLastStarted"]=None
            state["clockRunning"]=False
            if state.get("matchStatus")=="LIVE": state["matchStatus"]="PAUSED"
        elif action=="reset":
            state["clockElapsed"]=0
            state["clockLastStarted"]=None
            state["clockRunning"]=False
            state["clockMode"]="standard"
            state["matchStatus"]="PRE"
            state["penaltyMode"]=False
            state["penaltyHome"]=0
            state["penaltyAway"]=0
        elif action=="halftime":
            state["clockElapsed"]=2700
            state["clockLastStarted"]=None
            state["clockRunning"]=False
            state["clockMode"]="standard"
            state["matchStatus"]="HT"
        elif action=="second_half":
            state["clockElapsed"]=2700
            state["clockLastStarted"]=now
            state["clockRunning"]=True
            state["clockMode"]="standard"
            state["matchStatus"]="LIVE"
        elif action=="extra":
            state["clockElapsed"]=5400
            state["clockLastStarted"]=now
            state["clockRunning"]=True
            state["clockMode"]="extra"
            state["matchStatus"]="ET"
        elif action=="add_minute":
            state["clockElapsed"]=elapsed+60
            state["clockLastStarted"]=now if state.get("clockRunning") else None
        elif action=="subtract_minute":
            state["clockElapsed"]=max(0,elapsed-60)
            state["clockLastStarted"]=now if state.get("clockRunning") else None
        return jsonify(_snapshot())

@app.post("/api/state")
def set_state():
    data=request.get_json(silent=True) or {}
    with lock:
        for k in state:
            if k in data: state[k]=data[k]
        return jsonify(_snapshot())
@app.get("/")
def index(): return send_from_directory('.', 'index.html')
@app.get("/<path:path>")
def static_files(path): return send_from_directory('.', path)
if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT",10000)))
