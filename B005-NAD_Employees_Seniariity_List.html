<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>B005 - NAD Employees Seniority List</title>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background-color: var(--bg); color: var(--text); transition: background 0.3s, color 0.3s; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
    th { background: #f0f0f0; cursor: pointer; position: sticky; top: 0; z-index: 1; }
    mark { background-color: yellow; }
    input, button, select { margin: 5px 0; padding: 6px; }
    .buttons { margin-top: 10px; }
    .filters { margin-bottom: 10px; }
    .dark th, .dark td { border-color: #555; }
    .dark th { background: #333; color: #fff; }
    @media (max-width: 768px) {
      table, th, td { font-size: 12px; }
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <h2>NAD Employees Seniority List</h2>

  <div class="filters">
    🔍 <input type="text" id="searchInput" placeholder="Search by Name, Rank or Token" onkeyup="searchTable()" />
    🏢 Department:
    <select id="deptFilter" onchange="applyFilters()">
      <option value="">All</option>
    </select>
    🎖️ Rank:
    <select id="rankFilter" onchange="applyFilters()">
      <option value="">All</option>
    </select>
    📅 From: <input type="date" id="fromDate" onchange="applyFilters()" />
    📅 To: <input type="date" id="toDate" onchange="applyFilters()" />
    🌓 <button onclick="toggleDarkMode()">Toggle Dark Mode</button>
  </div>

  <div class="buttons">
    <button onclick="exportTableToExcel()">📥 Export to Excel</button>
    <button onclick="exportTableToPDF()">📄 Export to PDF</button>
    <button onclick="printTable()">🖨️ Print Table</button>
  </div>

  <p id="filteredCount">Loading data...</p>

  <table id="employeeTable"></table>

  <script>
    const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfI97rNmhShZMYblAR6Y7XVR7HH-9cmqGlrw5a8q1YArBDgGTdVZ8lYkhrjGMy5N8W4ZzW5BRwlQhB/pub?gid=0&single=true&output=csv";

    let employeeData = [];
    let currentSortColumn = "";
    let sortAsc = true;

    const root = document.documentElement;

    function formatDate(dateStr) {
      if (!dateStr || dateStr.trim() === "") return "";
      const parts = dateStr.split(/[-/]/);
      let day, month, year;

      if (parts[0].length === 4) {
        year = parts[0]; month = parts[1]; day = parts[2];
      } else {
        day = parts[0]; month = parts[1]; year = parts[2];
      }

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day.padStart(2, "0")} ${months[parseInt(month, 10) - 1]} ${year}`;
    }

    function fetchDataAndBuildTable() {
      Papa.parse(SHEET_URL, {
        download: true,
        header: true,
        complete: function (results) {
          employeeData = results.data;
          populateDropdowns(employeeData);
          applyFilters();
        }
      });
    }

    function populateDropdowns(data) {
      const deptSet = new Set();
      const rankSet = new Set();
      data.forEach(row => {
        if (row["Category"]) deptSet.add(row["Category"]);
        if (row["Rank"]) rankSet.add(row["Rank"]);
      });

      const deptFilter = document.getElementById("deptFilter");
      const rankFilter = document.getElementById("rankFilter");
      [...deptSet].sort().forEach(v => deptFilter.innerHTML += `<option value="${v}">${v}</option>`);
      [...rankSet].sort().forEach(v => rankFilter.innerHTML += `<option value="${v}">${v}</option>`);
    }

    function buildTable(data) {
      const table = document.getElementById("employeeTable");
      table.innerHTML = "";

      if (!data.length) {
        table.innerHTML = "<tr><td colspan='100%'>No data available</td></tr>";
        return;
      }

      const headers = Object.keys(data[0]);
      const headerRow = document.createElement("tr");
      headers.forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        th.onclick = () => sortTableBy(h);
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      data.forEach(row => {
        const tr = document.createElement("tr");
        headers.forEach(key => {
          const td = document.createElement("td");
          const value = row[key];
          td.textContent = key.toLowerCase().includes("date") ? formatDate(value) : value;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });

      document.getElementById("filteredCount").textContent = `Showing ${data.length} employee(s)`;
    }

    function sortTableBy(column) {
      sortAsc = column === currentSortColumn ? !sortAsc : true;
      currentSortColumn = column;
      employeeData.sort((a, b) => {
        const valA = a[column] || "";
        const valB = b[column] || "";
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
      applyFilters();
    }

    function searchTable() { applyFilters(); }

    function applyFilters() {
      const input = document.getElementById("searchInput").value.toLowerCase();
      const dept = document.getElementById("deptFilter").value;
      const rank = document.getElementById("rankFilter").value;
      const from = document.getElementById("fromDate").value;
      const to = document.getElementById("toDate").value;

      const filtered = employeeData.filter(row => {
        const textMatch = Object.values(row).some(v => v?.toLowerCase().includes(input));
        const deptMatch = !dept || row["Category"] === dept;
        const rankMatch = !rank || row["Rank"] === rank;

        const dob = row["Date of Birth"] || "";
        const dobDate = new Date(dob);
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;
        const dateMatch = (!from || dobDate >= fromDate) && (!to || dobDate <= toDate);

        return textMatch && deptMatch && rankMatch && dateMatch;
      });

      buildTable(filtered);
    }

    function exportTableToExcel() {
      const table = document.getElementById("employeeTable");
      const tableHTML = table.outerHTML.replace(/ /g, "%20");
      const filename = "employee_data.xls";

      const downloadLink = document.createElement("a");
      document.body.appendChild(downloadLink);
      downloadLink.href = "data:application/vnd.ms-excel," + tableHTML;
      downloadLink.download = filename;
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    function exportTableToPDF() {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      const table = document.getElementById("employeeTable");
      pdf.html(table, {
        callback: () => pdf.save("employee_data.pdf")
      });
    }

    function printTable() {
      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write("<html><head><title>Print Employee Data</title></head><body>");
      printWindow.document.write(document.getElementById("employeeTable").outerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }

    function toggleDarkMode() {
      const dark = document.body.classList.toggle("dark");
      localStorage.setItem("darkMode", dark);
    }

    function applyDarkModeSetting() {
      if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark");
      }
    }

    applyDarkModeSetting();
    fetchDataAndBuildTable();
  </script>
</body>
</html>
