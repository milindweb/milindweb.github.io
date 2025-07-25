let allEmployees = [];

async function fetchSheetData() {
  const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTUzccXs1hKfHcoGHyFg0_LsVpKRhzLuAk5GwTZUr_jT4JmOHdPtUGQmAkUOiWY-w/pub?output=csv";

  const response = await fetch(sheetURL);
  const data = await response.text();
  const rows = data.split("\n").map(row => row.split(","));
  const headers = rows[0];
  allEmployees = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header.trim()] = row[i]?.trim());
    return obj;
  });
  renderTable(allEmployees);
  updateButtonCounts();
}

function renderTable(data) {
  const container = document.getElementById("employeeTableContainer");
  if (!container) return;

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headers = Object.keys(data[0]);

  thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  data.forEach(row => {
    const tr = document.createElement("tr");
    headers.forEach(h => {
      const td = document.createElement("td");
      td.textContent = row[h];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.innerHTML = "";
  container.appendChild(table);
}

function filterSearch() {
  const searchValue = document.getElementById("searchBox").value.toLowerCase();
  const filtered = allEmployees.filter(emp =>
    emp["Name"].toLowerCase().includes(searchValue) ||
    emp["Tokan No."].toLowerCase().includes(searchValue) ||
    emp["Location"].toLowerCase().includes(searchValue)
  );
  renderTable(filtered);
}

function filterByRank(rank) {
  const filtered = allEmployees.filter(emp => emp["Rank"] === rank);
  renderTable(filtered);
}

function filterByGrade(grade) {
  const filtered = allEmployees.filter(emp => emp["Rank"].includes(grade));
  renderTable(filtered);
}

function filterByCombined(mainDepts, grade) {
  const depts = mainDepts.split("+");
  const filtered = allEmployees.filter(emp =>
    depts.some(d => emp["Rank"].includes(d.trim())) && emp["Rank"].includes(grade)
  );
  renderTable(filtered);
}

function updateButtonCounts() {
  const counts = {};
  allEmployees.forEach(emp => {
    const rank = emp["Rank"];
    counts[rank] = (counts[rank] || 0) + 1;
  });

  document.querySelectorAll(".menu-section button").forEach(btn => {
    const label = btn.textContent;
    if (counts[label]) {
      btn.textContent = `${label} (${counts[label]})`;
    }
  });
}

document.addEventListener("DOMContentLoaded", fetchSheetData);
