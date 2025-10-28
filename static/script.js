const grid = document.getElementById('memoryGrid');
const logDiv = document.getElementById('eventLog');
let lastState = null;

function appendLog(text) {
  logDiv.innerHTML += `<div>> ${text}</div>`;
  logDiv.scrollTop = logDiv.scrollHeight;
}

function renderSnapshot(snap) {
  grid.innerHTML = '';  // Clear existing grid
  snap.memory.forEach((val, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = val !== null ? val : '';  // Show page number if not null
    grid.appendChild(cell);
  });

  // Highlight changes between last state and current snapshot
  if (lastState && snap.memory) {
    snap.memory.forEach((val, i) => {
      if (lastState.memory[i] !== val) {
        const cells = document.querySelectorAll('.cell');
        if (lastState.memory[i] !== null && val === null) {
          // A page was replaced
          cells[i].classList.add('replaced');
        } else {
          // A page was loaded
          cells[i].classList.add('active');
        }
        // Remove highlight after 1 second
        setTimeout(() => cells[i].classList.remove('active', 'replaced'), 1000);
      }
    });
  }
  lastState = snap;

  // Update Page Table
  const tbody = document.querySelector('#pageTable tbody');
  tbody.innerHTML = '';  // Clear existing table rows
  Object.entries(snap.page_table || {}).forEach(([p, info]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p}</td>
      <td>${info.valid}</td>
      <td>${info.frame !== null ? info.frame : '-'}</td>
      <td>${info.last_access !== null ? info.last_access : '-'}</td>
      <td>${info.access_count}</td>`;
    tbody.appendChild(tr);
  });

  // If there's an event in the snapshot, log it
  if (snap.event && !logDiv.innerHTML.includes("Simulation finished")) {
    appendLog(snap.event);  // Append the event message from the backend
  }
}

// Initialize the simulation
document.getElementById('initBtn').onclick = async () => {
  const refs = document.getElementById('refs').value.trim();
  const frames = document.getElementById('frames').value.trim();
  const algo = document.getElementById('algo').value;

  if (!refs || !frames || !algo) {
    appendLog('Error: All fields are required');
    return;
  }

  const res = await fetch('/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refs, frames, algo })
  });

  const data = await res.json();
  if (data.error) {
    appendLog('Error: ' + data.error);
    return;
  }

  renderSnapshot(data.state);
  appendLog('Initialized simulation');
};

// Step through the simulation
document.getElementById('stepBtn').onclick = async () => {
  const res = await fetch('/step', { method: 'POST' });
  const data = await res.json();
  if (data.error) {
    appendLog('Error: ' + data.error);
    return;
  }

  renderSnapshot(data.state);
  if (data.done) {
    appendLog('Simulation finished');
  }
};

// Run the full simulation
document.getElementById('runBtn').onclick = async () => {
  appendLog('Running full simulation...');
  const res = await fetch('/run', { method: 'POST' });
  const data = await res.json();
  renderSnapshot(data.state);
  appendLog('Run complete');
};

// Get a snapshot of the current state
document.getElementById('snapBtn').onclick = async () => {
  const res = await fetch('/snapshot');
  const data = await res.json();
  if (data.error) {
    appendLog('Error: ' + data.error);
    return;
  }

  renderSnapshot(data);
  if (data.event && !logDiv.innerHTML.includes("Simulation finished")) {
    appendLog(data.event);  // Append the event message from the backend
  }
};
