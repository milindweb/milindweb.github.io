function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  var data = JSON.parse(e.postData.contents);
  var date = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy HH:mm");
  
  sheet.appendRow([date, data.service, data.name, data.email, data.phone, data.message]);
  
  return ContentService
    .createTextOutput(JSON.stringify({"result":"success","data": data}))
    .setMimeType(ContentService.MimeType.JSON);
}

