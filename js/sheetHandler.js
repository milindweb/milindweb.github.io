const sheetID = "1_qwciFgPC98jL9-4j4p7qLTK639xF0Gkrddp9E4bGQo";
const sheetName = "Sheet1";
const query = encodeURIComponent("SELECT *");
const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?sheet=${sheetName}&tq=${query}`;

window.onload = function () {
  fetch(url)
    .then(res => res.text())
    .then(rep => {
      const data = JSON.parse(rep.substr(47).slice(0, -2));
      const table = document.createElement("table");
      table.border = "1";
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";

      const header = document.createElement("tr");
      data.table.cols.forEach(col => {
        const th = document.createElement("th");
        th.innerText = col.label;
        th.style.background = "#0078D4";
        th.style.color = "#fff";
        th.style.padding = "8px";
        header.appendChild(th);
      });
      table.appendChild(header);

      data.table.rows.forEach(row => {
        const tr = document.createElement("tr");
        row.c.forEach(cell => {
          const td = document.createElement("td");
          td.innerText = cell ? cell.v : "";
          td.style.padding = "6px";
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });

      document.getElementById("employeeTableContainer").appendChild(table);
    })
    .catch(err => {
      document.getElementById("employeeTableContainer").innerText =
        "Failed to load data. Check Sheet ID or permissions.";
      console.error(err);
    });
};