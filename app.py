from flask import Flask, request, jsonify, send_from_directory
import os, threading
app=Flask(__name__, static_folder='.')
lock=threading.Lock()
state={"homeTeam":"HOME TEAM","awayTeam":"AWAY TEAM","homeScore":0,"awayScore":0,"clock":"00:00"}
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
