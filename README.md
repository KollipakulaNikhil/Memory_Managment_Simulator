# 🧠 Memory Management Simulator

A **web-based Memory Management Simulator** that visually demonstrates **page replacement algorithms** — **FIFO**, **LRU**, and **LFU** — using a clean interactive interface.

This simulator helps you understand how operating systems manage **virtual memory**, handle **page faults**, and replace pages in frames based on different strategies.

---

## 🚀 Features

- 🔁 Simulates **FIFO**, **LRU**, and **LFU** page replacement algorithms  
- 🧩 Step-by-step or full-run simulation  
- 📊 Real-time visualization of memory frames  
- 🧮 Page table with metadata:
  - Valid bit  
  - Frame number  
  - Last access time  
  - Access count  
- 💬 Live event log tracking hits, faults, and replacements  
- 🌈 Clean and modern dark UI built with pure HTML, CSS, and JS  

---
## 🎓 Learning Outcomes
By using or exploring this project, you will:
- Understand how page replacement algorithms work internally  
- Learn how operating systems handle memory and page faults  
- Gain experience in building Flask-based interactive web apps  
- Strengthen your understanding of frontend-backend communication (via JSON APIs)


## 🏗️ Project Structure
```
memory-management-simulator/
│
├── app.py # Flask backend handling simulation logic and routes
├── templates/
│ └── index.html # Frontend HTML structure
├── static/
│ ├── style.css # UI styling (Dark theme)
│ └── script.js # Frontend logic and API communication
└── README.md # Project documentation


```
---

## ⚙️ Installation and Setup

### Prerequisites
Make sure you have:
- Python **3.8+**
- Flask installed

### Setup Steps

```bash
# 1️⃣ Clone the repository
git clone https://github.com/<your-username>/memory-management-simulator.git

# 2️⃣ Navigate to the project folder
cd memory-management-simulator

# 3️⃣ Install Flask
pip install flask

# 4️⃣ Run the Flask app
python app.py

🧮 How It Works

Enter Input

Reference string (e.g., 3 2 1 3 4)

Number of frames

Choose an algorithm: FIFO, LRU, or LFU

Simulation Options

▶️ Initialize Simulation — start/reset simulator

⏭️ Next Step — simulate one page request at a time

⚡ Run Full Simulation — complete all steps automatically

📸 Get Snapshot — view current memory and page table state

Outputs

Memory grid showing loaded pages and replacements

Page table updating with every request

Event log detailing hits, misses, and replacements

🧩 Algorithms Implemented
🟢 FIFO (First-In-First-Out)

Replaces the oldest loaded page when memory is full.

🔵 LRU (Least Recently Used)

Replaces the page that was least recently accessed.

🔴 LFU (Least Frequently Used)

Replaces the page with the lowest access count.

📸 Example

Input:

Reference string: 3 2 1 3 4
Frames: 3
Algorithm: LRU

Output:

> Page fault → Loaded 3 into frame 0
> Page fault → Loaded 2 into frame 1
> Page fault → Loaded 1 into frame 2
> Page 3 already in memory (hit)
> Page fault → Loaded 4 into frame 1 (Replaced 2)
Simulation finished

🧰 Tech Stack

Frontend: HTML, CSS, JavaScript

Backend: Flask (Python)

Communication: Fetch API (JSON)
