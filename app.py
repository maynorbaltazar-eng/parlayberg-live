from flask import Flask, request, jsonify, send_from_directory
import os, threading
app=Flask(__name__, static_folder='.')
lock=threading.Lock()
state={
"homeTeam":"HOME TEAM","awayTeam":"AWAY TEAM","homeScore":0,"awayScore":0,"clock":"00:00",
"possessionHome":"50","possessionAway":"50","shotsHome":"0","shotsAway":"0",
"sotHome":"0","sotAway":"0","cornersHome":"0","cornersAway":"0",
"foulsHome":"0","foulsAway":"0","yellowHome":"0","yellowAway":"0","redHome":"0","redAway":"0",
"event1":"00'  |","event2":"00'  |","event3":"00'  |","event4":"00'  |","event5":"00'  |",
"match1":"MATCH 1  •  00:00","match2":"MATCH 2  •  00:00","match3":"MATCH 3  •  00:00",
"match4":"MATCH 4  •  00:00","match5":"MATCH 5  •  00:00"
}
@app.get("/api/state")
def get_state():
    with lock: return jsonify(state)
@app.post("/api/state")
def set_state():
    data=request.get_json(silent=True) or {}
    with lock:
        for k in state:
            if k in data: state[k]=data[k]
        return jsonify(state)
@app.get("/")
def index(): return send_from_directory('.', 'index.html')
@app.get("/<path:path>")
def static_files(path): return send_from_directory('.', path)
if __name__=="__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT",10000)))
