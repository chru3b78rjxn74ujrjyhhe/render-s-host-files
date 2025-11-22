import os
import json
import threading
import time
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# -------------------------------------------------------
# FILE PATHS
# -------------------------------------------------------
STATE_FILE = "data/state.json"
LATEST_FILE = "data/latest.json"
CALIB_FILE = "data/calibration.csv"
HISTORY_FILE = "data/history.csv"


# -------------------------------------------------------
# STATE MANAGEMENT
# -------------------------------------------------------
def load_state():
    try:
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    except:
        return {"mode": "normal", "collecting": False, "message": "Reset"}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=4)


# -------------------------------------------------------
# CALIBRATION CONTROL
# -------------------------------------------------------
def toggle_calibration():
    state = load_state()

    if not state["collecting"]:
        # Start calibration
        state["mode"] = "calibration"
        state["collecting"] = True
        state["message"] = "Calibration started"

        # Clear old calibration file
        if os.path.exists(CALIB_FILE):
            os.remove(CALIB_FILE)

    else:
        # Stop calibration
        state["collecting"] = False
        state["mode"] = "normal"
        state["message"] = "Calibration stopped"

    save_state(state)
    print("CALIB STATE:", state)


# -------------------------------------------------------
# TRAINING CONTROL
# -------------------------------------------------------
def run_training():
    state = load_state()
    state["mode"] = "training"
    state["collecting"] = False
    state["message"] = "Training started"
    save_state(state)

    print("TRAINING STARTED...")

    os.system("python3 train_lstm.py")

    state["mode"] = "normal"
    state["message"] = "Training complete"
    save_state(state)

    print("TRAINING COMPLETE")


# -------------------------------------------------------
# ROUTES — PAGES
# -------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/flood")
def flood():
    return render_template("flood.html")

@app.route("/landslide")
def landslide():
    return render_template("landslide.html")

@app.route("/camera")
def camera():
    return render_template("camera.html")


# -------------------------------------------------------
# API — BUTTON ACTIONS FROM WEBSITE
# -------------------------------------------------------
@app.route("/api/calibration", methods=["POST"])
def api_calibration():
    toggle_calibration()
    return jsonify({"status": "ok", "msg": "Calibration toggled"})

@app.route("/api/train", methods=["POST"])
def api_train():
    threading.Thread(target=run_training, daemon=True).start()
    return jsonify({"status": "ok", "msg": "Training started"})


# -------------------------------------------------------
# API — STATE + LIVE ML OUTPUT
# -------------------------------------------------------
@app.route("/api/state")
def api_state():
    return jsonify(load_state())

@app.route("/api/combined")
def api_combined():
    try:
        with open(LATEST_FILE) as f:
            return jsonify(json.load(f))
    except:
        return jsonify({
            "landslide": 0,
            "flood": 0,
            "combined": 0,
            "timestamp": "NA"
        })


@app.route("/api/notifications")
def api_notifications():
    return jsonify([])


# -------------------------------------------------------
# START SERVER
# -------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
