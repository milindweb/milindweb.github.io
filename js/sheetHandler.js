// Replace with your live Google Sheets CSV URL
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv";

let employeeData = [];

// Format dates to dd MMM yyyy
function formatDate(dateStr) {
  if (!dateStr || dateStr.trim() === "") return "";
  const parts = dateStr.split(/[-/]/);
  let day, month, year;

  if (parts[0].length === 4) {
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else {
    day = parts[0];
    month = parts[1];
    year = parts[2];
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day.padStart(2, "0")} ${months[parseInt(month, 10) - 1]} ${year}`;
}

// Fetch data
function fetchDataAndBuildTable() {
  Papa.parse(SHEET_URL, {
    download: true,
    header: true,
    complete: function (results) {
      employeeData = results.data;
      buildTable(employeeData);
      updateCounts(employeeData);
    },
  });
}

// Build main employee table
function buildTable(data) {
  const table = document.getElementById("employeeTable");
  table.innerHTML = "";

  if (data.length === 0) {
    table.innerHTML = "<tr><td colspan='100%'>No records found</td></tr>";
    document.getElementById("count-total").textContent = "0";
    return;
  }

  const headers = Object.keys(data[0]);
  const headerRow = document.createElement("tr");

  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  data.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((key) => {
      const td = document.createElement("td");
      const lowerKey = key.toLowerCase();
      td.textContent = lowerKey.includes("date") ? formatDate(row[key]) : row[key];
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  document.getElementById("count-total").textContent = data.length;
}

// Update rank counters
function updateCounts(data) {
  const rankCounters = {
    "Tradesman Mate": 0,
    "Fitter Electrical": 0,
    "Fitter Electronics": 0,
    "Fitter General Mechanic": 0,
    "Armament Fitter": 0,
    "Other Fitters": 0,
  };

  data.forEach((row) => {
    const rank = row.Rank || "";
    if (rankCounters[rank] !== undefined) rankCounters[rank]++;
  });

  document.getElementById("count-tradesman").textContent = rankCounters["Tradesman Mate"];
  document.getElementById("count-elec").textContent = rankCounters["Fitter Electrical"];
  document.getElementById("count-elec-sk").textContent = rankCounters["Fitter Electronics"];
  document.getElementById("count-gen").textContent = rankCounters["Fitter General Mechanic"];
  document.getElementById("count-arm").textContent = rankCounters["Armament Fitter"];
  document.getElementById("count-other").textContent = rankCounters["Other Fitters"];

  // Combined rank groups
  document.getElementById("count-combined-elec").textContent =
    rankCounters["Fitter Electrical"] + rankCounters["Fitter Electronics"];
  document.getElementById("count-combined-arm").textContent =
    rankCounters["Fitter General Mechanic"] + rankCounters["Armament Fitter"];
}

// Live search by Name, Rank, or Token
function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filtered = employeeData.filter((row) =>
    (row.Name || "").toLowerCase().includes(input) ||
    (row.Rank || "").toLowerCase().includes(input) ||
    (row["Tokan No."] || "").toLowerCase().includes(input)
  );

  buildTable(filtered);
}

// Filter by exact match rank
function filterByRank(rankName) {
  const filtered = employeeData.filter((row) => row.Rank === rankName);
  buildTable(filtered);
}

// Filter group + sub-level like HSK1 in Electrical
function filterByPartialRank(group, level) {
  const filtered = employeeData.filter(
    (row) => row.Rank.includes(group) && row.Rank.includes(level)
  );
  buildTable(filtered);
}

// Combined group filter
function filterByCombined(groups, level) {
  const filtered = employeeData.filter(
    (row) => groups.some((g) => row.Rank.includes(g)) && row.Rank.includes(level)
  );
  buildTable(filtered);
}

// Export to CSV
function exportToExcel() {
  let csv = "";
  const rows = document.querySelectorAll("#employeeTable tr");
  rows.forEach((row) => {
    const cols = row.querySelectorAll("td, th");
    const rowData = [...cols].map((col) => `"${col.innerText}"`).join(",");
    csv += rowData + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "EmployeeList.csv";
  link.click();
}

// Print
function printTable() {
  window.print();
}

// Initialize everything
fetchDataAndBuildTable();
