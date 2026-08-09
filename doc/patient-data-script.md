/*******************************************************
 * SECTION 2: View + Edit All Patient Data (for patientdata.html)
 * This part is fully independent — does NOT affect form submission.
 *******************************************************/

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === "read") {
      return getAllPatients();
    }
    return ContentService.createTextOutput("Invalid action");
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fetch all rows from Sheet1 and return as JSON
 */
function getAllPatients() {
  var sheet = SpreadsheetApp.openById("1L0OqLtzT9X-WlU3HT4H7OSmhsQ1rKYNSwbKO4IcxxWw").getSheetByName("Sheet1");
  var data = sheet.getDataRange().getValues();
  var headers = data.shift(); // remove first row as header

  var jsonData = data.map(function(row) {
    var record = {};
    headers.forEach(function(h, i) {
      record[h] = row[i];
    });
    return record;
  });

  return ContentService
    .createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests from patientdata.html for editing/updating all rows
 */
function updateAll(updatedData) {
  try {
    var sheet = SpreadsheetApp.openById("1L0OqLtzT9X-WlU3HT4H7OSmhsQ1rKYNSwbKO4IcxxWw").getSheetByName("Sheet1");
    var headers = sheet.getDataRange().getValues()[0];
    var range = sheet.getRange(2, 1, updatedData.length, headers.length);

    // Convert JSON array back to 2D array
    var newValues = updatedData.map(function(obj) {
      return headers.map(function(h) {
        return obj[h] || "";
      });
    });

    range.setValues(newValues);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Data updated successfully!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests for patientdata.html Save button
 * (called with JSON: { action: "updateAll", data: [...] })
 */
function doPost(e) {
  // keep your original doPost for form submission
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === "updateAll") {
      return updateAll(data.data);
    }
  } catch (err) {
    // fall through to your original function
  }

  // if not updateAll, run your existing patient form code
  return savePatientData(e);
}

/**
 * Extracted your existing patient save logic here so it remains untouched.
 */
function savePatientData(e) {
  try {
    var sheet = SpreadsheetApp.openById("1L0OqLtzT9X-WlU3HT4H7OSmhsQ1rKYNSwbKO4IcxxWw").getSheetByName("Sheet1");
    var data = JSON.parse(e.postData.contents);
    var date = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy HH:mm");

    sheet.appendRow([
      data.opdNo,
      data.mobileNo,
      data.patientName,
      data.gender,
      data.age,
      data.doctorName,
      data.department,
      data.symptoms,
      data.weight,
      data.bp,
      data.pulse,
      data.respiratoryRate,
      data.spO2,
      data.temp,
      data.sugar,
      data.testDetails,
      data.testReports,
      data.diagnosis,
      data.prescription,
      data.treatmentNote,
      data.advice,
      data.effectAfterTreatment,
      data.drRemarks,
      data.drFees,
      date
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Patient data saved", data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log("Error in savePatientData: " + err);
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


/*******************************************************
 * SECTION 3: Update Only Selected Patient (for profile.html)
 * This part is independent — does NOT affect Section 1 or 2.
 *******************************************************/

/**
 * Update only selected patient's records (by patientName or opdNo)
 * Called with: { action: "updatePatient", data: [...] }
 */
function updatePatient(selectedData) {
  try {
    var sheet = SpreadsheetApp.openById("1L0OqLtzT9X-WlU3HT4H7OSmhsQ1rKYNSwbKO4IcxxWw").getSheetByName("Sheet1");
    var allData = sheet.getDataRange().getValues();
    var headers = allData.shift(); // first row = headers

    // Loop through each updated record for this patient
    selectedData.forEach(function (updatedRecord) {
      for (var i = 0; i < allData.length; i++) {
        var row = allData[i];
        var record = {};
        headers.forEach(function (h, j) { record[h] = row[j]; });

        // Match by OPD No or Patient Name (case-insensitive)
        if (
          (record.opdNo && record.opdNo.toString().trim().toLowerCase() === updatedRecord.opdNo.toString().trim().toLowerCase()) ||
          (record.patientName && record.patientName.trim().toLowerCase() === updatedRecord.patientName.trim().toLowerCase())
        ) {
          // Replace that row with updated values
          var newRow = headers.map(function (h) {
            return updatedRecord[h] || "";
          });
          sheet.getRange(i + 2, 1, 1, newRow.length).setValues([newRow]);
          break; // stop after first match
        }
      }
    });

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success", message: "Selected patient data updated successfully!" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Add new handler for updatePatient in doPost()
 * (Do NOT remove your original doPost — just extend it)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === "updateAll") {
      return updateAll(data.data);
    }
    if (data.action === "updatePatient") {
      return updatePatient(data.data);
    }
  } catch (err) {
    // fallback to your existing patient submission
  }

  return savePatientData(e);
}




/*******************************************************
 * SECTION 2: View + Edit All Patient Data (for patientdata.html)
 * This part is fully independent — does NOT affect form submission.
 *******************************************************/

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === "read") {
      return getAllPatients();
    }
    return ContentService.createTextOutput("Invalid action");
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Fetch all rows from Sheet1 and return as JSON
 */
function getAllPatients() {
  var sheet = SpreadsheetApp.openById("1kA70nQ5o-6chRge5kJnf6StbBnd1G_wNe60-hoFhUgM").getSheetByName("Sheet1");
  var data = sheet.getDataRange().getValues();
  var headers = data.shift(); // remove first row as header

  var jsonData = data.map(function(row) {
    var record = {};
    headers.forEach(function(h, i) {
      record[h] = row[i];
    });
    return record;
  });

  return ContentService
    .createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests from patientdata.html for editing/updating all rows
 */
function updateAll(updatedData) {
  try {
    var sheet = SpreadsheetApp.openById("1kA70nQ5o-6chRge5kJnf6StbBnd1G_wNe60-hoFhUgM").getSheetByName("Sheet1");
    var headers = sheet.getDataRange().getValues()[0];
    var range = sheet.getRange(2, 1, updatedData.length, headers.length);

    // Convert JSON array back to 2D array
    var newValues = updatedData.map(function(obj) {
      return headers.map(function(h) {
        return obj[h] || "";
      });
    });

    range.setValues(newValues);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Data updated successfully!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests for patientdata.html Save button
 * (called with JSON: { action: "updateAll", data: [...] })
 */
function doPost(e) {
  // keep your original doPost for form submission
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === "updateAll") {
      return updateAll(data.data);
    }
  } catch (err) {
    // fall through to your original function
  }

  // if not updateAll, run your existing patient form code
  return savePatientData(e);
}

/**
 * Extracted your existing patient save logic here so it remains untouched.
 */
function savePatientData(e) {
  try {
    var sheet = SpreadsheetApp.openById("1kA70nQ5o-6chRge5kJnf6StbBnd1G_wNe60-hoFhUgM").getSheetByName("Sheet1");
    var data = JSON.parse(e.postData.contents);
    var date = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy HH:mm");

    sheet.appendRow([
      data.opdNo,
      data.mobileNo,
      data.patientName,
      data.gender,
      data.age,
      data.doctorName,
      data.department,
      data.symptoms,
      data.weight,
      data.bp,
      data.pulse,
      data.respiratoryRate,
      data.spO2,
      data.temp,
      data.sugar,
      data.testDetails,
      data.testReports,
      data.diagnosis,
      data.prescription,
      data.treatmentNote,
      data.advice,
      data.effectAfterTreatment,
      data.drRemarks,
      data.drFees,
      date
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Patient data saved", data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log("Error in savePatientData: " + err);
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


/*******************************************************
 * SECTION 3: Update Only Selected Patient (for profile.html)
 * This part is independent — does NOT affect Section 1 or 2.
 *******************************************************/

/**
 * Update only selected patient's records (by patientName or opdNo)
 * Called with: { action: "updatePatient", data: [...] }
 */
function updatePatient(selectedData) {
  try {
    var sheet = SpreadsheetApp.openById("1kA70nQ5o-6chRge5kJnf6StbBnd1G_wNe60-hoFhUgM").getSheetByName("Sheet1");
    var allData = sheet.getDataRange().getValues();
    var headers = allData.shift(); // first row = headers

    // Loop through each updated record for this patient
    selectedData.forEach(function (updatedRecord) {
      for (var i = 0; i < allData.length; i++) {
        var row = allData[i];
        var record = {};
        headers.forEach(function (h, j) { record[h] = row[j]; });

        // Match by OPD No or Patient Name (case-insensitive)
        if (
          (record.opdNo && record.opdNo.toString().trim().toLowerCase() === updatedRecord.opdNo.toString().trim().toLowerCase()) ||
          (record.patientName && record.patientName.trim().toLowerCase() === updatedRecord.patientName.trim().toLowerCase())
        ) {
          // Replace that row with updated values
          var newRow = headers.map(function (h) {
            return updatedRecord[h] || "";
          });
          sheet.getRange(i + 2, 1, 1, newRow.length).setValues([newRow]);
          break; // stop after first match
        }
      }
    });

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success", message: "Selected patient data updated successfully!" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: err.toString() })
    ).
setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Add new handler for updatePatient in doPost()
 * (Do NOT remove your original doPost — just extend it)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === "updateAll") {
      return updateAll(data.data);
    }
    if (data.action === "updatePatient") {
      return updatePatient(data.data);
    }
  } catch (err) {
    // fallback to your existing patient submission
  }

  return savePatientData(e);
}


