from flask import Flask, request, jsonify, send_from_directory
import os, threading, time
app=Flask(__name__, static_folder='.')
lock=threading.Lock()
state={
"homeTeam":"HOME TEAM","awayTeam":"AWAY TEAM","homeLogo":"","awayLogo":"","homeScore":0,"awayScore":0,"clock":"00:00",
"clockElapsed":0,"clockRunning":False,"clockLastStarted":None,"clockMode":"standard",
"possessionHome":"50","possessionAway":"50","shotsHome":"0","shotsAway":"0",
"sotHome":"0","sotAway":"0","cornersHome":"0","cornersAway":"0",
"foulsHome":"0","foulsAway":"0","yellowHome":"0","yellowAway":"0","redHome":"0","redAway":"0",
"event1":"00'  |","event2":"00'  |","event3":"00'  |","event4":"00'  |","event5":"00'  |",
"match1":"MATCH 1  •  00:00","match2":"MATCH 2  •  00:00","match3":"MATCH 3  •  00:00",
"match4":"MATCH 4  •  00:00","match5":"MATCH 5  •  00:00"
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
        elif action=="reset":
            state["clockElapsed"]=0
            state["clockLastStarted"]=None
            state["clockRunning"]=False
            state["clockMode"]="standard"
        elif action=="extra":
            state["clockElapsed"]=5400
            state["clockLastStarted"]=now
            state["clockRunning"]=True
            state["clockMode"]="extra"
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
