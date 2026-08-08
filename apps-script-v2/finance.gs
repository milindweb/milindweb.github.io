/**
 * finance.gs — MilindWeb Finance module backend.
 *
 * Ported from the standalone PFMS Apps Script (Payroll & Financial Management
 * System) so all salary / financial-year / loans & insurance / major
 * transaction features run against the Milind-Finance spreadsheet
 * (CONFIG.financeSheetId) behind the shared site auth + module guard.
 *
 * Sheet names and headers are kept byte-identical to the original PFMS schema
 * so existing CSV exports (see finance-seed.gs) can be imported as-is.
 */

// ---------- Schema ----------

var FINANCE_SHEETS = {
  SALARY_MONTHLY: 'Salary_Monthly',
  SALARY_VERIFY: 'Salary_Verify',
  FINYEAR_SUMMARY: 'FinYear_Summary',
  LOANS_INSURANCE: 'Loans_Insurance',
  MAJOR_TRANSACTIONS: 'Major_Transactions',
  SETTINGS: 'Settings'
};

var FINANCE_SALARY_HEADERS = [
  'ID','Month','Year',
  'BASIC','DA','TPTA','TPTADA','SOT','DOT','NPS_GC_EARN','TADA','AO_PA','AO_TPTADA','OTARRS','BONUS','EXTRA_EARN','GROSS_EARN',
  'NPS','NPS_GC_DED','CGHS','CGEIS','LFEE','ELWC','LATE','IT','CESS','ABSCENT','R_OT','EXTRA_DED','DEDUCTION_TOTAL',
  'NADKSF','DCRB','NCHCF','NDCB','LWFL','RCOURT','EXTRA_REC','RECOVERY_TOTAL',
  'SINGLE_OT','DOUBLE_OT','NET_PAY','HOME_PAY','REMARK'
];

var FINANCE_FINYEAR_HEADERS = [
  'ID','Period','Assessment_Year',
  'Excel_Gross_Salary','Cumulative_Gross_Salary','Form16_Gross_Salary','Home_Pay_Salary',
  'NPS','NPS_GC','Karanja_Society','Dockyard_Bank','DCRB','ELWC','Over_Time',
  'Amount_Paid_Credited','Amount_Tax_Deducted','Amount_Tax_Deposited','Claimed_Amount','Returned_Amount',
  'LIC','Term_Insurance','Health_Insurance','Loan','Other','Major_Transactions',
  'Total_EMI_Loan_Insurance_Major','Bulk_Other_Income','Home_Pay_Minus_EMI_Loan_Kharcha'
];

var FINANCE_VERIFY_HEADERS = [
  'ID','Year','Assessment_Year','Period_Employer',
  'Excel_Gross_Salary','Slip_Cumulative_Gross','Form16_Gross_Salary',
  'Amount_Paid_Credited','Amount_Tax_Deducted','Amount_Tax_Deposited',
  'Claimed_Amount','Returned_Amount','Remark'
];

var FINANCE_LOAN_HEADERS = ['ID','Type','Amount','Start_Date','End_Date','Notes'];
var FINANCE_TX_HEADERS = ['ID','Date','Description','Amount','Category','Notes'];

// ---------- Spreadsheet / sheet helpers ----------

function financeSS_() {
  return SpreadsheetApp.openById(CONFIG.financeSheetId);
}

function financeList_(sheetName, headers) {
  var sheet = financeSS_().getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    result.push(row);
  }
  return result;
}

function financeAppend_(sheetName, data, headers) {
  var sheet = financeSS_().getSheetByName(sheetName);
  var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ''; });
  sheet.appendRow(row);
  return sheet.getLastRow() - 1;
}

function financeUpdate_(sheetName, id, data, headers) {
  var sheet = financeSS_().getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ''; });
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return true;
    }
  }
  return false;
}

function financeDelete_(sheetName, id) {
  var sheet = financeSS_().getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function financeNextId_(sheetName) {
  var sheet = financeSS_().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var maxId = 0;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && Number(data[i][0]) > maxId) maxId = Number(data[i][0]);
  }
  return maxId + 1;
}

// ---------- Initialization ----------

function financeEnsureSheets_() {
  var ss = financeSS_();
  var configs = [
    { name: FINANCE_SHEETS.SALARY_MONTHLY, headers: FINANCE_SALARY_HEADERS },
    { name: FINANCE_SHEETS.SALARY_VERIFY, headers: FINANCE_VERIFY_HEADERS },
    { name: FINANCE_SHEETS.FINYEAR_SUMMARY, headers: FINANCE_FINYEAR_HEADERS },
    { name: FINANCE_SHEETS.LOANS_INSURANCE, headers: FINANCE_LOAN_HEADERS },
    { name: FINANCE_SHEETS.MAJOR_TRANSACTIONS, headers: FINANCE_TX_HEADERS },
    { name: FINANCE_SHEETS.SETTINGS, headers: ['key', 'value'] }
  ];
  configs.forEach(function (cfg) {
    var sh = getSheet_(ss, cfg.name);
    ensureHeader_(sh, cfg.headers);
  });

  var settings = ss.getSheetByName(FINANCE_SHEETS.SETTINGS);
  if (settings.getLastRow() < 2) {
    settings.appendRow(['app_name', 'Finance']);
    settings.appendRow(['current_year', '2026-2027']);
    settings.appendRow(['current_assessment_year', '2026-2027']);
  }
}

// Public: idempotent sheet setup (mirrors PFMS setupSheets).
function financeSetupSheets() {
  financeEnsureSheets_();
  return 'Finance sheets ready';
}

// ---------- Salary calculations ----------

function financeCalcEarnings_(row) {
  var fields = ['BASIC','DA','TPTA','TPTADA','SOT','DOT','NPS_GC_EARN','TADA','AO_PA','AO_TPTADA','OTARRS','BONUS','EXTRA_EARN'];
  var total = 0;
  fields.forEach(function (f) { total += Number(row[f]) || 0; });
  return total;
}

function financeCalcDeductions_(row) {
  var fields = ['NPS','NPS_GC_DED','CGHS','CGEIS','LFEE','ELWC','LATE','IT','CESS','ABSCENT','R_OT','EXTRA_DED'];
  var total = 0;
  fields.forEach(function (f) { total += Number(row[f]) || 0; });
  return total;
}

function financeCalcRecoveries_(row) {
  var fields = ['NADKSF','DCRB','NCHCF','NDCB','LWFL','RCOURT','EXTRA_REC'];
  var total = 0;
  fields.forEach(function (f) { total += Number(row[f]) || 0; });
  return total;
}

function financeComputeSalary_(row) {
  row.GROSS_EARN = financeCalcEarnings_(row);
  row.DEDUCTION_TOTAL = financeCalcDeductions_(row);
  row.RECOVERY_TOTAL = financeCalcRecoveries_(row);
  row.NET_PAY = Number(row.GROSS_EARN) - Number(row.DEDUCTION_TOTAL);
  row.HOME_PAY = Number(row.NET_PAY) - Number(row.RECOVERY_TOTAL);
  return row;
}

// ---------- CRUD — Monthly Salary ----------

function financeMonthlySalaryList(year) {
  var all = financeList_(FINANCE_SHEETS.SALARY_MONTHLY, FINANCE_SALARY_HEADERS);
  if (year) return all.filter(function (r) { return String(r.Year) === String(year); });
  return all;
}

function financeMonthlySalaryGet(id) {
  var all = financeList_(FINANCE_SHEETS.SALARY_MONTHLY, FINANCE_SALARY_HEADERS);
  for (var i = 0; i < all.length; i++) {
    if (Number(all[i].ID) === Number(id)) return all[i];
  }
  return null;
}

function financeSalarySave(data) {
  data = data || {};
  financeComputeSalary_(data);
  if (data.ID) {
    financeUpdate_(FINANCE_SHEETS.SALARY_MONTHLY, data.ID, data, FINANCE_SALARY_HEADERS);
    return { success: true, id: data.ID, action: 'updated' };
  }
  data.ID = financeNextId_(FINANCE_SHEETS.SALARY_MONTHLY);
  financeAppend_(FINANCE_SHEETS.SALARY_MONTHLY, data, FINANCE_SALARY_HEADERS);
  return { success: true, id: data.ID, action: 'created' };
}

function financeSalaryDelete(id) {
  return { success: financeDelete_(FINANCE_SHEETS.SALARY_MONTHLY, id) };
}

function financeSalaryYears() {
  var all = financeList_(FINANCE_SHEETS.SALARY_MONTHLY, FINANCE_SALARY_HEADERS);
  var years = {};
  all.forEach(function (r) { if (r.Year) years[String(r.Year)] = true; });
  return Object.keys(years).sort();
}

// ---------- CRUD — Salary Verify (Form 16) ----------

function financeSalaryVerifyList(year) {
  var all = financeList_(FINANCE_SHEETS.SALARY_VERIFY, FINANCE_VERIFY_HEADERS);
  if (year) return all.filter(function (r) { return String(r.Year) === String(year); });
  return all;
}

function financeSalaryVerifySave(data) {
  data = data || {};
  if (data.ID) {
    financeUpdate_(FINANCE_SHEETS.SALARY_VERIFY, data.ID, data, FINANCE_VERIFY_HEADERS);
    return { success: true, id: data.ID, action: 'updated' };
  }
  data.ID = financeNextId_(FINANCE_SHEETS.SALARY_VERIFY);
  financeAppend_(FINANCE_SHEETS.SALARY_VERIFY, data, FINANCE_VERIFY_HEADERS);
  return { success: true, id: data.ID, action: 'created' };
}

function financeSalaryVerifyDelete(id) {
  return { success: financeDelete_(FINANCE_SHEETS.SALARY_VERIFY, id) };
}

// ---------- CRUD — Financial Year Summary ----------

function financeFinYearList() {
  return financeList_(FINANCE_SHEETS.FINYEAR_SUMMARY, FINANCE_FINYEAR_HEADERS);
}

function financeFinYearSave(data) {
  data = data || {};
  if (data.ID) {
    financeUpdate_(FINANCE_SHEETS.FINYEAR_SUMMARY, data.ID, data, FINANCE_FINYEAR_HEADERS);
    return { success: true, id: data.ID, action: 'updated' };
  }
  data.ID = financeNextId_(FINANCE_SHEETS.FINYEAR_SUMMARY);
  financeAppend_(FINANCE_SHEETS.FINYEAR_SUMMARY, data, FINANCE_FINYEAR_HEADERS);
  return { success: true, id: data.ID, action: 'created' };
}

function financeFinYearDelete(id) {
  return { success: financeDelete_(FINANCE_SHEETS.FINYEAR_SUMMARY, id) };
}

// ---------- CRUD — Loans & Insurance ----------

function financeLoansList() {
  return financeList_(FINANCE_SHEETS.LOANS_INSURANCE, FINANCE_LOAN_HEADERS);
}

function financeLoanSave(data) {
  data = data || {};
  if (data.ID) {
    financeUpdate_(FINANCE_SHEETS.LOANS_INSURANCE, data.ID, data, FINANCE_LOAN_HEADERS);
    return { success: true, id: data.ID, action: 'updated' };
  }
  var existing = financeList_(FINANCE_SHEETS.LOANS_INSURANCE, FINANCE_LOAN_HEADERS);
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].Type === data.Type && Number(existing[i].Amount) === Number(data.Amount) && existing[i].Start_Date === data.Start_Date) {
      return { success: false, message: 'Duplicate entry already exists' };
    }
  }
  data.ID = financeNextId_(FINANCE_SHEETS.LOANS_INSURANCE);
  financeAppend_(FINANCE_SHEETS.LOANS_INSURANCE, data, FINANCE_LOAN_HEADERS);
  return { success: true, id: data.ID, action: 'created' };
}

function financeLoanDelete(id) {
  return { success: financeDelete_(FINANCE_SHEETS.LOANS_INSURANCE, id) };
}

// ---------- CRUD — Major Transactions ----------

function financeTxList() {
  return financeList_(FINANCE_SHEETS.MAJOR_TRANSACTIONS, FINANCE_TX_HEADERS);
}

function financeTxSave(data) {
  data = data || {};
  if (data.ID) {
    financeUpdate_(FINANCE_SHEETS.MAJOR_TRANSACTIONS, data.ID, data, FINANCE_TX_HEADERS);
    return { success: true, id: data.ID, action: 'updated' };
  }
  var existing = financeList_(FINANCE_SHEETS.MAJOR_TRANSACTIONS, FINANCE_TX_HEADERS);
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].Date === data.Date && existing[i].Description === data.Description && Number(existing[i].Amount) === Number(data.Amount)) {
      return { success: false, message: 'Duplicate transaction already exists' };
    }
  }
  data.ID = financeNextId_(FINANCE_SHEETS.MAJOR_TRANSACTIONS);
  financeAppend_(FINANCE_SHEETS.MAJOR_TRANSACTIONS, data, FINANCE_TX_HEADERS);
  return { success: true, id: data.ID, action: 'created' };
}

function financeTxDelete(id) {
  return { success: financeDelete_(FINANCE_SHEETS.MAJOR_TRANSACTIONS, id) };
}

// ---------- Dashboard ----------

function financeDashboard() {
  var salaryData = financeList_(FINANCE_SHEETS.SALARY_MONTHLY, FINANCE_SALARY_HEADERS);
  var finYearData = financeList_(FINANCE_SHEETS.FINYEAR_SUMMARY, FINANCE_FINYEAR_HEADERS);
  var loanData = financeList_(FINANCE_SHEETS.LOANS_INSURANCE, FINANCE_LOAN_HEADERS);
  var txData = financeList_(FINANCE_SHEETS.MAJOR_TRANSACTIONS, FINANCE_TX_HEADERS);

  var totalGross = 0, totalDed = 0, totalNet = 0, totalHome = 0, totalRecovery = 0;
  var totalNPS = 0, totalNPSGC = 0;
  var totalSingleOTAmt = 0, totalDoubleOTAmt = 0;
  var totalSingleOTHrs = 0, totalDoubleOTHrs = 0;

  salaryData.forEach(function (r) {
    totalGross += Number(r.GROSS_EARN) || 0;
    totalDed += Number(r.DEDUCTION_TOTAL) || 0;
    totalNet += Number(r.NET_PAY) || 0;
    totalHome += Number(r.HOME_PAY) || 0;
    totalRecovery += Number(r.RECOVERY_TOTAL) || 0;
    totalNPS += Number(r.NPS) || 0;
    totalNPSGC += Number(r.NPS_GC_DED) || 0;
    totalSingleOTHrs += Number(r.SINGLE_OT) || 0;
    totalDoubleOTHrs += Number(r.DOUBLE_OT) || 0;
    totalSingleOTAmt += Number(r.SOT) || 0;
    totalDoubleOTAmt += Number(r.DOT) || 0;
  });

  var totalLoanAmt = 0, totalLIC = 0, totalIns = 0, totalOtherLI = 0;
  loanData.forEach(function (r) {
    var amt = Number(r.Amount) || 0;
    if (r.Type === 'LIC') totalLIC += amt;
    else if (r.Type === 'Term_Insurance' || r.Type === 'Health_Insurance') totalIns += amt;
    else if (r.Type === 'Loan') totalLoanAmt += amt;
    else if (r.Type === 'Other') totalOtherLI += amt;
  });

  var totalTx = 0;
  txData.forEach(function (r) { totalTx += Number(r.Amount) || 0; });

  var totalLiabilities = totalLoanAmt + totalLIC + totalIns + totalOtherLI + totalTx;
  var finYearGainLoss = totalHome - totalLiabilities;
  finYearData.sort(function (a, b) {
    return (b.Assessment_Year || '').localeCompare(a.Assessment_Year || '');
  });
  var latestFinYear = finYearData.length > 0 ? finYearData[0] : null;

  return {
    salary: {
      totalGross: totalGross,
      totalDeduction: totalDed,
      totalNetPay: totalNet,
      totalHomePay: totalHome,
      totalRecovery: totalRecovery,
      monthCount: salaryData.length
    },
    nps: {
      employee: totalNPS,
      employer: totalNPSGC,
      total: totalNPS + totalNPSGC
    },
    overtime: {
      totalHours: totalSingleOTHrs + totalDoubleOTHrs,
      singleHours: totalSingleOTHrs,
      doubleHours: totalDoubleOTHrs,
      singleAmount: totalSingleOTAmt,
      doubleAmount: totalDoubleOTAmt,
      totalAmount: totalSingleOTAmt + totalDoubleOTAmt
    },
    loans: {
      totalLoan: totalLoanAmt,
      totalLIC: totalLIC,
      totalInsurance: totalIns,
      totalOther: totalOtherLI,
      totalAll: totalLoanAmt + totalLIC + totalIns + totalOtherLI
    },
    transactions: {
      total: totalTx,
      count: txData.length
    },
    finYear: {
      totalLiabilities: totalLiabilities,
      gainLoss: finYearGainLoss,
      latest: latestFinYear
    },
    salaryTrend: salaryData.slice(-12)
  };
}

// ---------- Financial year utilities ----------

function financeAvailableAssessmentYears() {
  var salaryData = financeList_(FINANCE_SHEETS.SALARY_MONTHLY, FINANCE_SALARY_HEADERS);
  var years = {};
  salaryData.forEach(function (r) {
    var m = (r.Month || '').toLowerCase();
    var y = parseInt(r.Year, 10);
    if (!y || isNaN(y)) return;
    var startYear, endYear;
    if (['apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m) >= 0) {
      startYear = y; endYear = y + 1;
    } else if (['jan','feb','mar'].indexOf(m) >= 0) {
      startYear = y - 1; endYear = y;
    } else {
      return;
    }
    years[startYear + '-' + endYear] = true;
  });
  return Object.keys(years).sort();
}

function financeFinYearMonthly(assessmentYear) {
  var parts = assessmentYear ? assessmentYear.split('-') : null;
  var startYear = parts ? parseInt(parts[0], 10) : 0;
  var endYear = parts ? parseInt(parts[1], 10) : 0;

  var salaryData = financeList_(FINANCE_SHEETS.SALARY_MONTHLY, FINANCE_SALARY_HEADERS);
  var filtered = [];

  salaryData.forEach(function (r) {
    if (!assessmentYear) { filtered.push(r); return; }
    var m = (r.Month || '').toLowerCase();
    var y = parseInt(r.Year, 10);
    var match = false;
    if (['apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m) >= 0 && y === startYear) match = true;
    if (['jan','feb','mar'].indexOf(m) >= 0 && y === endYear) match = true;
    if (match) filtered.push(r);
  });

  return filtered.map(function (r) {
    return {
      month: r.Month || '',
      year: r.Year || '',
      gross: Number(r.GROSS_EARN) || 0,
      deduction: Number(r.DEDUCTION_TOTAL) || 0,
      netPay: Number(r.NET_PAY) || 0,
      homePay: Number(r.HOME_PAY) || 0,
      recovery: Number(r.RECOVERY_TOTAL) || 0
    };
  });
}

function financeMonthlyTrend() {
  var all = financeList_(FINANCE_SHEETS.SALARY_MONTHLY, FINANCE_SALARY_HEADERS);
  return all.map(function (r) {
    return {
      month: r.Month + ' ' + r.Year,
      gross: Number(r.GROSS_EARN) || 0,
      netPay: Number(r.NET_PAY) || 0,
      homePay: Number(r.HOME_PAY) || 0
    };
  });
}

function financeFinancialYearList() {
  var data = financeList_(FINANCE_SHEETS.FINYEAR_SUMMARY, FINANCE_FINYEAR_HEADERS);
  return data.map(function (r) {
    return {
      id: r.ID,
      period: r.Period,
      assessmentYear: r.Assessment_Year
    };
  });
}

function financeAutoComputeFinYear(assessmentYear) {
  var parts = String(assessmentYear || '').split('-');
  var startYear = parseInt(parts[0], 10);
  var endYear = parseInt(parts[1], 10);

  var result = {
    Assessment_Year: assessmentYear,
    Period: '01 Apr ' + startYear + '  To  31 Mar ' + endYear,
    Excel_Gross_Salary: 0, Cumulative_Gross_Salary: 0, Form16_Gross_Salary: 0, Home_Pay_Salary: 0,
    NPS: 0, NPS_GC: 0, Karanja_Society: 0, Dockyard_Bank: 0, DCRB: 0, ELWC: 0, Over_Time: 0,
    Amount_Paid_Credited: 0, Amount_Tax_Deducted: 0, Amount_Tax_Deposited: 0, Claimed_Amount: 0, Returned_Amount: 0,
    LIC: 0, Term_Insurance: 0, Health_Insurance: 0, Loan: 0, Other: 0, Major_Transactions: 0,
    Total_EMI_Loan_Insurance_Major: 0, Bulk_Other_Income: 0, Home_Pay_Minus_EMI_Loan_Kharcha: 0
  };

  var salaryData = financeList_(FINANCE_SHEETS.SALARY_MONTHLY, FINANCE_SALARY_HEADERS);
  salaryData.forEach(function (r) {
    var m = (r.Month || '').toLowerCase();
    var y = parseInt(r.Year, 10);
    var match = false;
    if (['apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(m) >= 0 && y === startYear) match = true;
    if (['jan','feb','mar'].indexOf(m) >= 0 && y === endYear) match = true;
    if (!match) return;

    result.Excel_Gross_Salary += Number(r.GROSS_EARN) || 0;
    result.Home_Pay_Salary += Number(r.HOME_PAY) || 0;
    result.NPS += Number(r.NPS) || 0;
    result.NPS_GC += Number(r.NPS_GC_DED) || 0;
    result.ELWC += Number(r.ELWC) || 0;
    result.Over_Time += (Number(r.SINGLE_OT) || 0) + (Number(r.DOUBLE_OT) || 0);
  });

  var loanData = financeList_(FINANCE_SHEETS.LOANS_INSURANCE, FINANCE_LOAN_HEADERS);
  loanData.forEach(function (r) {
    var amt = Number(r.Amount) || 0;
    if (r.Type === 'LIC') result.LIC += amt;
    else if (r.Type === 'Term_Insurance') result.Term_Insurance += amt;
    else if (r.Type === 'Health_Insurance') result.Health_Insurance += amt;
    else if (r.Type === 'Loan') result.Loan += amt;
    else if (r.Type === 'Other') result.Other += amt;
  });

  var txData = financeList_(FINANCE_SHEETS.MAJOR_TRANSACTIONS, FINANCE_TX_HEADERS);
  txData.forEach(function (r) { result.Major_Transactions += Number(r.Amount) || 0; });

  result.Total_EMI_Loan_Insurance_Major =
    result.LIC + result.Term_Insurance + result.Health_Insurance + result.Loan + result.Other + result.Major_Transactions;

  return result;
}

// ---------- Settings ----------

function financeSettingsGet() {
  var data = financeList_(FINANCE_SHEETS.SETTINGS, ['key', 'value']);
  var settings = {};
  data.forEach(function (r) { settings[r.key] = r.value; });
  return settings;
}

function financeSettingSave(key, value) {
  var sheet = financeSS_().getSheetByName(FINANCE_SHEETS.SETTINGS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return { success: true };
    }
  }
  sheet.appendRow([key, value]);
  return { success: true };
}

// ---------- CSV import / export ----------

function financeExportCsv(sheetName) {
  var sheet = financeSS_().getSheetByName(sheetName);
  if (!sheet) return '';
  var data = sheet.getDataRange().getValues();
  var csv = '';
  data.forEach(function (row) {
    csv += row.map(function (cell) {
      var s = String(cell);
      if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',') + '\n';
  });
  return csv;
}

function financeKeyCols_(sheetName) {
  if (sheetName === FINANCE_SHEETS.SALARY_MONTHLY) return [1, 2];         // Month, Year
  if (sheetName === FINANCE_SHEETS.SALARY_VERIFY) return [2];             // Assessment_Year
  if (sheetName === FINANCE_SHEETS.FINYEAR_SUMMARY) return [2];           // Assessment_Year
  if (sheetName === FINANCE_SHEETS.LOANS_INSURANCE) return [1, 2, 3];     // Type, Amount, Start_Date
  if (sheetName === FINANCE_SHEETS.MAJOR_TRANSACTIONS) return [1, 2, 3];  // Date, Description, Amount
  return null;
}

function financeMakeKey_(row, colIndices) {
  return colIndices.map(function (i) { return String(row[i] || '').trim().toLowerCase(); }).join('|');
}

function financeImportCsv(sheetName, csvText) {
  var sheet = financeSS_().getSheetByName(sheetName);
  if (!sheet) return { success: false, message: 'Sheet not found' };

  var lines = String(csvText || '').split('\n').filter(function (l) { return l.trim(); });
  if (lines.length < 1) return { success: false, message: 'Empty CSV' };

  var rows = lines.map(function (line) {
    var result = [], current = '', inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += c;
      }
    }
    result.push(current);
    return result;
  });

  if (rows.length < 2) return { success: true, count: 0 };

  var existingData = sheet.getDataRange().getValues();
  var hasHeader = existingData.length > 0;
  var headerRow = hasHeader ? existingData[0] : rows[0];

  var keyCols = financeKeyCols_(sheetName);
  var existingMap = {};

  if (hasHeader && keyCols) {
    for (var i = 1; i < existingData.length; i++) {
      existingMap[financeMakeKey_(existingData[i], keyCols)] = existingData[i];
    }
  }

  var numCols = Math.max(
    headerRow.length,
    rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0)
  );

  function pad(arr, n) {
    var out = arr.slice();
    while (out.length < n) out.push('');
    return out;
  }

  var nextId = financeNextId_(sheetName);
  var updated = 0, inserted = 0;

  for (var i = 1; i < rows.length; i++) {
    var r = pad(rows[i], numCols);
    var key = keyCols ? financeMakeKey_(r, keyCols) : null;

    if (key && existingMap[key]) {
      if (!r[0] || String(r[0]).trim() === '') r[0] = existingMap[key][0];
      for (var j = 0; j < numCols; j++) existingMap[key][j] = r[j];
      updated++;
    } else {
      if (!r[0] || String(r[0]).trim() === '') r[0] = nextId++;
      existingData.push(r);
      inserted++;
    }
  }

  var allRows = [pad(headerRow, numCols)];
  for (var i = 1; i < existingData.length; i++) {
    allRows.push(pad(existingData[i], numCols));
  }

  sheet.clear();
  sheet.getRange(1, 1, allRows.length, numCols).setValues(allRows);
  sheet.getRange(1, 1, 1, numCols).setFontWeight('bold');

  return { success: true, count: rows.length - 1, updated: updated, inserted: inserted };
}

// ---------- Router ----------

/**
 * Finance route (module 'finance'). Called from api.gs after the auth +
 * module guard. The frontend sends { fn, args: [...] } mirroring the old
 * PFMS google.script.run calls (e.g. fn:'getDashboardData').
 */
function financeRoutePost_(body) {
  try {
    financeEnsureSheets_();
    var fn = String(body.fn || '');
    var args = body.args || [];

    var map = {
      setupSheets: financeSetupSheets,
      getDashboardData: financeDashboard,
      getMonthlySalary: financeMonthlySalaryList,
      getMonthlySalaryById: financeMonthlySalaryGet,
      getSalaryYears: financeSalaryYears,
      saveMonthlySalary: financeSalarySave,
      deleteMonthlySalary: financeSalaryDelete,
      getSalaryVerify: financeSalaryVerifyList,
      saveSalaryVerify: financeSalaryVerifySave,
      deleteSalaryVerify: financeSalaryVerifyDelete,
      getFinYearSummary: financeFinYearList,
      saveFinYearSummary: financeFinYearSave,
      deleteFinYearSummary: financeFinYearDelete,
      autoComputeFinYear: financeAutoComputeFinYear,
      getFinYearMonthlyData: financeFinYearMonthly,
      getMonthlyTrend: financeMonthlyTrend,
      getFinancialYearList: financeFinancialYearList,
      getAvailableAssessmentYears: financeAvailableAssessmentYears,
      getLoansInsurance: financeLoansList,
      saveLoanInsurance: financeLoanSave,
      deleteLoanInsurance: financeLoanDelete,
      getMajorTransactions: financeTxList,
      saveMajorTransaction: financeTxSave,
      deleteMajorTransaction: financeTxDelete,
      getSettings: financeSettingsGet,
      saveSetting: financeSettingSave,
      exportSheetAsCSV: financeExportCsv,
      importCSV: financeImportCsv
    };

    var handler = map[fn];
    if (!handler) return fail_('Unknown finance action: ' + fn);

    var result = handler.apply(null, args);
    return json_({ ok: true, data: result });
  } catch (err) {
    log_(err.message || err);
    return fail_(err.message || err);
  }
}
