# -------------------------------
# Memory Management Simulator
# Flask Backend Application
# -------------------------------
# Author: [Your Name]
# Description: Simulates page replacement algorithms (FIFO, LRU, LFU)
# and exposes REST API endpoints to step through or run the full simulation.
# -------------------------------

from flask import Flask, jsonify, request, render_template
from threading import Lock

# Initialize Flask app and thread lock for safe multi-access
app = Flask(__name__, static_folder='static')
LOCK = Lock()


# -------------------------------
# Simulation Class
# -------------------------------
class PageReplacementSim:
    """
    Handles simulation logic for page replacement algorithms.
    Supported algorithms: FIFO, LRU, LFU
    """

    def __init__(self, refs, frames, algo):
        # Initialize simulation parameters
        self.refs = refs                   # Page reference string (list of integers)
        self.frames = frames               # Total available frames
        self.algo = algo.upper()           # Algorithm name (FIFO/LRU/LFU)

        # Page table structure: holds status of each page
        self.page_table = {
            p: {"valid": False, "frame": None, "last_access": None, "access_count": 0}
            for p in set(refs)
        }

        # Memory frames initialized as empty
        self.memory = [None] * frames
        self.time = 0                      # Logical time counter
        self.pointer = 0                   # Used for FIFO replacement
        self.finished = False              # Flag to check if simulation completed
        self.next_index = 0                # Current reference index
        self.last_event = None             # Stores last simulation event for UI display

    def snapshot(self):
        """
        Returns current snapshot of the simulation state.
        Used for frontend visualization.
        """
        return {
            "memory": self.memory,
            "page_table": self.page_table,
            "time": self.time,
            "event": self.last_event
        }

    def step(self):
        """
        Executes one step of the simulation.
        Returns JSON structure with current state and event info.
        """
        if self.finished:
            return {"done": True, "state": self.snapshot}

        # Stop if reference string is fully processed
        if self.next_index >= len(self.refs):
            self.finished = True
            self.last_event = "Simulation finished"
            return {"done": True, "state": self.snapshot()}

        page = self.refs[self.next_index]
        self.time += 1
        self.last_event = None
        victim = None

        # If page already in memory → hit
        if self.page_table[page]["valid"]:
            self.page_table[page]["last_access"] = self.time
            self.page_table[page]["access_count"] += 1
            self.last_event = f"Page {page} already in memory (hit)"
        else:
            # If free frame exists → use it
            if None in self.memory:
                frame_index = self.memory.index(None)
            else:
                # Otherwise, apply replacement policy
                if self.algo == "FIFO":
                    victim = self.memory[self.pointer]
                    frame_index = self.pointer
                    self.pointer = (self.pointer + 1) % self.frames
                elif self.algo == "LRU":
                    victim = min(
                        (p for p in self.page_table if self.page_table[p]["valid"]),
                        key=lambda p: self.page_table[p]["last_access"]
                    )
                    frame_index = self.page_table[victim]["frame"]
                elif self.algo == "LFU":
                    victim = min(
                        (p for p in self.page_table if self.page_table[p]["valid"]),
                        key=lambda p: self.page_table[p]["access_count"]
                    )
                    frame_index = self.page_table[victim]["frame"]
                else:
                    raise ValueError("Invalid algorithm")

                # Invalidate the victim page
                self.page_table[victim]["valid"] = False
                self.page_table[victim]["frame"] = None

            # Load new page into memory
            self.memory[frame_index] = page
            self.page_table[page]["valid"] = True
            self.page_table[page]["frame"] = frame_index
            self.page_table[page]["last_access"] = self.time
            self.page_table[page]["access_count"] = 1
            self.last_event = f"Page fault -> Loaded {page} into frame {frame_index}"

            if victim:
                self.last_event += f" (Replaced {victim})"

        # Move to next page reference
        self.next_index += 1
        return {"done": False, "state": self.snapshot(), "event": self.last_event}

    def run_to_end(self):
        """
        Runs the simulation to completion (for automatic full-run mode).
        """
        while not self.finished:
            self.step()


# Global variable to store active simulation
SIM = None


# -------------------------------
# Flask Routes (API Endpoints)
# -------------------------------

@app.route('/')
def index():
    """Render the main UI page."""
    return render_template('index.html')


@app.route('/init', methods=['POST'])
def init():
    """Initialize the simulation with user-provided input."""
    global SIM
    data = request.json
    SIM = PageReplacementSim(
        refs=list(map(int, data['refs'].split())),
        frames=int(data['frames']),
        algo=data['algo']
    )
    return jsonify({"status": "initialized", "state": SIM.snapshot()})


@app.route('/step', methods=['POST'])
def step():
    """Perform one simulation step."""
    global SIM
    with LOCK:
        if SIM is None:
            return jsonify({"error": "not initialized"}), 400
        result = SIM.step()
        return jsonify(result)


@app.route('/run', methods=['POST'])
def run_all():
    """Run the simulation until all page references are processed."""
    global SIM
    if SIM is None:
        return jsonify({"error": "not initialized"}), 400
    SIM.run_to_end()
    return jsonify({"status": "done", "state": SIM.snapshot()})


@app.route('/snapshot', methods=['GET'])
def snapshot():
    """Return current snapshot of the simulation state."""
    global SIM
    if SIM is None:
        return jsonify({"error": "not initialized"}), 400
    if SIM.finished and SIM.last_event != "Simulation finished":
        SIM.last_event = "Simulation finished"
    return jsonify({"state": SIM.snapshot()})


# -------------------------------
# Run the Flask app
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True)
