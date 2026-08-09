function hideUnusedRowsAndColumns() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var maxRows = sheet.getMaxRows();
  var maxCols = sheet.getMaxColumns();

  if (lastRow < maxRows) {
    sheet.hideRows(lastRow + 1, maxRows - lastRow);
  }
  if (lastCol < maxCols) {
    sheet.hideColumns(lastCol + 1, maxCols - lastCol);
  }
}
