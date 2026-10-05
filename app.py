from flask import Flask, request, jsonify, send_from_directory
import os, threading, time
app=Flask(__name__, static_folder='.')
lock=threading.Lock()
state={
"homeTeam":"HOME TEAM","awayTeam":"AWAY TEAM","homeLogo":"","awayLogo":"","homeScore":0,"awayScore":0,"clock":"00:00","matchStatus":"PRE",
"clockElapsed":0,"clockRunning":False,"clockLastStarted":None,"clockMode":"standard","penaltyMode":False,"penaltyHome":0,"penaltyAway":0,
"possessionHome":"50","possessionAway":"50","shotsHome":"0","shotsAway":"0",
"sotHome":"0","sotAway":"0","cornersHome":"0","cornersAway":"0",
"foulsHome":"0","foulsAway":"0","yellowHome":"0","yellowAway":"0","redHome":"0","redAway":"0",
"event1":"00'  |","event2":"00'  |","event3":"00'  |","event4":"00'  |","event5":"00'  |",
"match1Home":"HOME 1","match1Away":"AWAY 1","match1HomeScore":0,"match1AwayScore":0,"match1Status":"00:00",
"match2Home":"HOME 2","match2Away":"AWAY 2","match2HomeScore":0,"match2AwayScore":0,"match2Status":"00:00",
"match3Home":"HOME 3","match3Away":"AWAY 3","match3HomeScore":0,"match3AwayScore":0,"match3Status":"00:00",
"match4Home":"HOME 4","match4Away":"AWAY 4","match4HomeScore":0,"match4AwayScore":0,"match4Status":"00:00",
"match5Home":"HOME 5","match5Away":"AWAY 5","match5HomeScore":0,"match5AwayScore":0,"match5Status":"00:00"
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
    snap["clock"]=_format_clock(elapsed)
    return snap

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
