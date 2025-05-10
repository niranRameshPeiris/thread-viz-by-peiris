document.getElementById('uploadForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData();
  const files = document.getElementById('dumps').files;
  for (const file of files) formData.append('dumps', file);

  fetch('/upload', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(r => {
      if (r.success) {
        document.getElementById('thread-table').innerHTML = '';
        document.getElementById('stack-display').innerHTML = '';
        loadData();
      }
    });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('dumps').value = '';
  fetch('/reset', { method: 'POST' })
    .then(res => res.json())
    .then(r => {
      if (r.success) {
        document.getElementById('thread-table').innerHTML = '';
        document.getElementById('stack-display').innerHTML = '';
        alert('Reset complete.');
      }
    });
});

const analysisBtn = document.createElement('a');
analysisBtn.href = '/analysis.html';
analysisBtn.className = 'btn';
analysisBtn.style.marginTop = '8px';
analysisBtn.textContent = 'Advanced Analysis ->';
document.getElementById('uploadForm').appendChild(analysisBtn);

function loadData() {
  fetch('/data/grouped_threads.json')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('thread-table');
      container.innerHTML = '';

      const timestamps = Array.from(
        new Set(Object.values(data).flatMap(arr => arr.map(d => d.timestamp)))
      ).sort();

      const stackColorMap = {};
      const getColor = (hash) => {
        if (!stackColorMap[hash]) {
          const hue = Object.keys(stackColorMap).length * 37 % 360;
          stackColorMap[hash] = `hsl(${hue}, 60%, 75%)`;
        }
        return stackColorMap[hash];
      };

      const extractMethod = (stack) => {
        const at = stack.find(l => l.startsWith('at '));
        const m = at?.match(/\.([a-zA-Z0-9_]+)\(/);
        return m?.[1] || 'unknown';
      };

      const formatTime = (ts) => {
        const match = ts.match(/(\d{4}-\d{2}-\d{2})_(\d{2}):(\d{2}):(\d{2})/);
        return match ? `${match[2]}:${match[3]}:${match[4]}` : ts;
      };

      const stateColorMap = {
        NEW: '#999',
        RUNNABLE: '#28a745',
        BLOCKED: '#dc3545',
        WAITING: '#ffc107',
        TIMED_WAITING: '#17a2b8',
        TERMINATED: '#343a40'
      };

      const threads = Object.keys(data).sort();

      const table = document.createElement('table');
      table.className = 'thread-table';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const thName = document.createElement('th');
      thName.textContent = 'Thread Name';
      thName.className = 'sticky-left';
      headerRow.appendChild(thName);

      timestamps.forEach(ts => {
        const th = document.createElement('th');
        th.textContent = formatTime(ts);
        th.className = 'timestamp-cell';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');

      threads.forEach(threadKey => {
        const dumpMap = {};
        data[threadKey].forEach(d => dumpMap[d.timestamp] = d);

        const row = document.createElement('tr');
        const nameTd = document.createElement('td');
        nameTd.className = 'sticky-left thread-name';
        nameTd.title = threadKey;

        const nameDiv = document.createElement('div');
        nameDiv.textContent = threadKey;
        nameDiv.style.fontWeight = 'bold';

        const meta = data[threadKey]?.[0];
        const infoDiv = document.createElement('div');
        infoDiv.textContent = meta ? `TID: ${meta.tid} | NID: ${meta.nid}` : '';
        infoDiv.style.fontSize = '11px';
        infoDiv.style.color = '#555';

        nameTd.appendChild(nameDiv);
        nameTd.appendChild(infoDiv);
        row.appendChild(nameTd);

        timestamps.forEach(ts => {
          const td = document.createElement('td');
          const dump = dumpMap[ts];

          if (dump) {
            const box = document.createElement('div');
            box.className = 'cell-box';

            const stateDiv = document.createElement('div');
            stateDiv.textContent = dump.state;
            stateDiv.className = 'state-block';
            stateDiv.style.backgroundColor = stateColorMap[dump.state] || '#aaa';

            const methodDiv = document.createElement('div');
            methodDiv.textContent = extractMethod(dump.stack);
            methodDiv.className = 'method-name';
            methodDiv.style.backgroundColor = getColor(dump.stackHash);

            box.appendChild(stateDiv);
            box.appendChild(methodDiv);
            td.appendChild(box);

            td.style.cursor = 'pointer';
            td.addEventListener('click', () => {
              document.querySelectorAll('.selected-cell').forEach(el => el.classList.remove('selected-cell'));
              td.classList.add('selected-cell');
            
              const stack = document.getElementById('stack-display');
              stack.innerHTML = `<button onclick=\"this.parentElement.style.display='none'\">✖</button><pre>
<strong>Thread:</strong> ${threadKey}
<strong>TID:</strong> ${dump.tid}
<strong>NID:</strong> ${dump.nid}
<strong>Timestamp:</strong> ${formatTime(dump.timestamp)}
<strong>Hash:</strong> ${dump.stackHash}
            
              ${dump.stack.join('\n')}</pre>`;
              stack.style.display = 'block';
            });
          }

          row.appendChild(td);
        });

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      container.appendChild(table);
    });
}

loadData();
