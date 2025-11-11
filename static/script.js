from flask import Flask, jsonify, request, render_template
from threading import Lock

app = Flask(__name__, static_folder='static')
LOCK = Lock()


# Paging Simulation (unchanged)


class PageReplacementSim:
    def __init__(self, refs, frames, algo):
        self.refs = refs
        self.frames = frames
        self.algo = algo.upper()
        self.page_table = {
            p: {"valid": False, "frame": None, "last_access": None, "access_count": 0}
            for p in set(refs)
        }
        self.memory = [None] * frames
        self.time = 0
        self.pointer = 0
        self.finished = False
        self.next_index = 0
        self.last_event = None

    def snapshot(self):
        return {
            "memory": self.memory,
            "page_table": self.page_table,
            "time": self.time,
            "event": self.last_event
        }

    def step(self):
        if self.finished:
            return {"done": True, "state": self.snapshot()}

        if self.next_index >= len(self.refs):
            self.finished = True
            self.last_event = "Simulation finished"
            return {"done": True, "state": self.snapshot()}

        page = self.refs[self.next_index]
        self.time += 1
        self.last_event = None
        victim = None

        if self.page_table[page]["valid"]:
            self.page_table[page]["last_access"] = self.time
            self.page_table[page]["access_count"] += 1
            self.last_event = f"Page {page} already in memory (hit)"
        else:
            if None in self.memory:
                frame_index = self.memory.index(None)
            else:
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

                self.page_table[victim]["valid"] = False
                self.page_table[victim]["frame"] = None

            self.memory[frame_index] = page
            self.page_table[page]["valid"] = True
            self.page_table[page]["frame"] = frame_index
            self.page_table[page]["last_access"] = self.time
            self.page_table[page]["access_count"] = 1
            self.last_event = f"Page fault -> Loaded {page} into frame {frame_index}"

            if victim:
                self.last_event += f" (Replaced {victim})"

        self.next_index += 1
        return {"done": False, "state": self.snapshot(), "event": self.last_event}

    def run_to_end(self):
        while not self.finished:
            self.step()


SIM = None   # paging simulation instance



# Segmentation Simulation 


class SegmentationSim:
    def __init__(self, segments):
        self.segments = {
            s["id"]: {"base": s["base"], "limit": s["limit"]}
            for s in segments
        }
        self.last_event = None

    def translate(self, seg_id, offset):
        if seg_id not in self.segments:
            self.last_event = f"Fault → Invalid segment {seg_id}"
            return None

        seg = self.segments[seg_id]

        if offset > seg["limit"]:
            self.last_event = f"Fault → Offset {offset} > limit {seg['limit']}"
            return None

        physical = seg["base"] + offset
        self.last_event = (
            f"Translated (seg={seg_id}, off={offset}) → physical={physical}"
        )
        return physical

    def snapshot(self):
        return {
            "segments": self.segments,
            "event": self.last_event
        }


SEG_SIM = None   # segmentation simulation instance



# ROUTES


@app.route('/')
def index():
    return render_template('index.html')


# ----- Paging -----
@app.route('/init', methods=['POST'])
def init():
    global SIM, SEG_SIM
    data = request.json
    
    # Check if segmentation mode
    if data.get("mode") == "segmentation":
        SEG_SIM = SegmentationSim(data["segments"])
        return jsonify({"status": "initialized", "state": SEG_SIM.snapshot()})
    
    # Paging mode (default)
    SIM = PageReplacementSim(
        refs=list(map(int, data['refs'].split())),
        frames=int(data['frames']),
        algo=data['algo']
    )
    return jsonify({"status": "initialized", "state": SIM.snapshot()})


@app.route('/step', methods=['POST'])
def step():
    global SIM
    with LOCK:
        if SIM is None:
            return jsonify({"error": "not initialized"}), 400
        result = SIM.step()
        return jsonify(result)


@app.route('/run', methods=['POST'])
def run_all():
    global SIM
    if SIM is None:
        return jsonify({"error": "not initialized"}), 400
    SIM.run_to_end()
    return jsonify({"status": "done", "state": SIM.snapshot()})


@app.route('/snapshot', methods=['GET'])
def snapshot():
    global SIM
    if SIM is None:
        return jsonify({"error": "not initialized"}), 400
    if SIM.finished and SIM.last_event != "Simulation finished":
        SIM.last_event = "Simulation finished"
    return jsonify({"state": SIM.snapshot()})


# ----- Segmentation -----
@app.route('/init_seg', methods=['POST'])
def init_seg():
    global SEG_SIM
    data = request.json
    SEG_SIM = SegmentationSim(data["segments"])
    return jsonify({"status": "initialized", "state": SEG_SIM.snapshot()})


@app.route('/translate', methods=['POST'])
def translate():
    global SEG_SIM
    if SEG_SIM is None:
        return jsonify({"error": "Segmentation not initialized"}), 400

    data = request.json
    seg = data["segment"]
    off = data["offset"]

    paddr = SEG_SIM.translate(seg, off)
    return jsonify({"physical": paddr, "state": SEG_SIM.snapshot()})



if __name__ == '__main__':
    app.run(debug=True)
