window.addEventListener('DOMContentLoaded', () => {
    const precheck = document.getElementById('precheck');
    const form = document.getElementById('analyzeForm');
    const result = document.getElementById('result');
  
    fetch('/data/grouped_threads.json')
      .then(res => {
        if (!res.ok) throw new Error('Missing grouped_threads.json');
        form.style.display = 'block';
      })
      .catch(() => {
        precheck.innerHTML = `<p style="color:red">⚠️ Please run analysis on the main page before using this tool.</p>
        <a class="btn" href="/">← Go to Main Page</a>`;
      });
  
    form.addEventListener('submit', e => {
      e.preventDefault();
      result.innerHTML = '';
      const duration = document.getElementById('duration').value;
  
      Promise.all([
        fetch(`/analyze?type=stack&duration=${duration}`).then(r => r.json()),
        fetch(`/analyze?type=state&duration=${duration}`).then(r => r.json())
      ]).then(([stackData, stateData]) => {
        displayResults('🧵 Same Stack for Too Long', stackData.results, 'Stack Hash');
        displayResults('🔄 Same State for Too Long', stateData.results, 'State');
      }).catch(err => {
        result.innerHTML = `<p style='color:red'>Error: ${err.message}</p>`;
      });
    });
  
    document.getElementById('resetBtn').addEventListener('click', () => {
      document.getElementById('duration').value = '';
      result.innerHTML = '';
    });
  
    function displayResults(title, data, labelTitle) {
      const section = document.createElement('div');
      section.innerHTML = `<h3>${title}</h3>`;
  
      if (!data.length) {
        section.innerHTML += `<p>✅ No issues found.</p>`;
        result.appendChild(section);
        return;
      }
  
      const table = document.createElement('table');
      table.className = 'result-table';
  
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>Thread Name</th>
          <th>TID</th>
          <th>NID</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Duration</th>
          <th>${labelTitle}</th>
        </tr>
      `;
      table.appendChild(thead);
  
      const tbody = document.createElement('tbody');
  
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.thread}</td>
          <td>${item.tid}</td>
          <td>${item.nid}</td>
          <td>${formatTime(item.start)}</td>
          <td>${formatTime(item.end)}</td>
          <td><span class="badge duration">${item.duration}</span></td>
          <td><span class="badge">${item.value}</span></td>
        `;
        tbody.appendChild(row);
      });
  
      table.appendChild(tbody);
      section.appendChild(table);
      result.appendChild(section);
    }
  
    function formatTime(filename) {
      const match = filename.match(/(\d{4}-\d{2}-\d{2})[-_](\d{2}):(\d{2}):(\d{2})/);
      return match ? `${match[2]}:${match[3]}:${match[4]}` : filename;
    }

    window.addEventListener('scroll', () => {
        const btn = document.getElementById('toTopBtn');
        if (btn) {
          btn.style.display = window.scrollY > 300 ? 'block' : 'none';
        }
      });

  });
  
  