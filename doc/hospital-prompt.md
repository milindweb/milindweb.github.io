Build a complete Personal Salary & Financial Management System as a 2-file Google Apps Script SPA (Code.gs + index.html) using Google Sheets as the database.

This software is for personal use only with a single-user login. Every month, I manually enter all salary details exactly as shown on my official salary slip. My salary fields, yearly summary fields, Form 16/ITR details, loans, LIC, insurance, major transactions, and other financial records are already defined in my data list. Use every field exactly as provided without skipping, renaming, or combining any salary component.

The application should automatically calculate Gross, Deductions, Recoveries, Net Pay, Home Pay, yearly totals, and comparisons. It should automatically generate monthly and yearly financial summaries and dashboards from the entered data. I do not want daily expense tracking. I only record major financial transactions such as home construction, mobile purchase, medical expenses, marriage expenses, family support, loans, insurance, and other important financial events.

The dashboard should help me understand my financial position month-wise and year-wise, including salary growth, overtime, deductions, recoveries, loans, insurance, major transactions, Form 16 comparison, and available Home Pay after commitments. The UI should be modern, responsive, fast, and professional with sidebar navigation, charts, searchable tables, loading popups, toast notifications, dark/light mode, and automatic Google Sheet creation. Generate clean, modular, production-ready code using only Code.gs and index.html. I will provide the complete salary field list and data structure separately, and the application must implement every field exactly as given.

Based on your requirements, the final prompt will likely include:

Complete project overview
Complete database (every sheet)
Every salary field (100% of the list you provided)
All calculations and formulas
Monthly workflow
Yearly workflow
Dashboard requirements
Charts
Login
Settings
UI design
Output requirements

That will easily exceed the maximum size of one response.

The best approach

We'll create one Master Prompt split into logical parts, for example:

Part 1: Project Overview, Domain, Login, Sheets, Database Structure
Part 2: Complete Salary Module (every salary component you listed)
Part 3: Form 16, ITR, Tax, Financial Year Summary
Part 4: Loans, Insurance, Major Transactions, Dashboard
Part 5: Charts, UI, Design, Output

When combined, these parts form one complete prompt with nothing skipped.

I will keep every field exactly as you wrote it, including:

Earnings
BASIC
DA
TPTA
TPTADA
SOT
DOT
NPS GC
TADA
A/O P&A
A/O TPTA&DA
OTARRS
BONUS
EXTRA
GROSS
Deductions
NPS
NPS GC
CGHS
CGEIS
LFEE
ELWC
LATE
IT
CESS
ABSCENT
R/OT
EXTRA
DEDUCTION
Recoveries
NADKSF
DCRB
NCHCF
NDCB
LWFL
RCOURT
EXTRA
RECOVERY
Salary Summary
SINGLE OT
DOUBLE OT
GROSS
DEDUCTION
NET PAY
RECOVERY
HOME PAY
REMARK
Salary Verification
Gross Salary (Excel)
Cumulative Gross (Salary Slip)
Gross Salary (Form 16)
Income Tax
Assessment Year
Period with the Employer
Amount Paid / Credited
Amount of Tax Deducted
Amount of Tax Deposited / Remitted
Claimed Amount
Returned Amount
Remark
Financial Details
LIC
Term Insurance
Health Insurance
Loan
Other
Major Transaction
Financial Year Summary
Period with the Employer
Assessment Year
Excel Gross Salary
Cumulative Gross Salary
Form 16 Gross Salary
Home Pay Salary
NPS
NPS-GC
Karanja Society
Dockyard Bank
DCRB
ELWC
Over Time
Amount Paid / Credited
Amount of Tax Deducted
Amount of Tax Deposited / Remitted
Claimed Amount
Returned Amount
LIC
Term Insurance
Health Insurance
Loan
Other
Major Transactions
Total EMI / Loan / Insurance / Major
Bulk Other Income
Home Pay - EMI / Loan / Kharcha

Phase 1 - Foundation
Login
Forgot Password (OTP)
Dashboard
Sidebar
Settings
Google Sheet auto creation
Activity Logs
Phase 2 - Salary Module ⭐ (Most Important)

Exactly like your salary slip.

Earnings
BASIC
DA
TPTA
TPTADA
SOT
DOT
NPS GC
TADA
A/O P&A
A/O TPTA&DA
OTARRS
BONUS
EXTRA
GROSS
Deductions
NPS
NPS GC
CGHS
CGEIS
LFEE
ELWC
LATE
IT
CESS
ABSCENT
R/OT
EXTRA
DEDUCTION
Recoveries
NADKSF
DCRB
NCHCF
NDCB
LWFL
RCOURT
EXTRA
RECOVERY
OT
SINGLE OT
DOUBLE OT
Summary
GROSS
DEDUCTION
NET PAY
RECOVERY
HOME PAY
REMARK

Everything auto-calculated.

Phase 3 - Financial Year
Gross Salary (Excel)
Cumulative Gross (Salary Slip)
Gross Salary (Form 16)
Assessment Year
Period with Employer
Amount Paid / Credited
Amount of Tax Deducted
Amount of Tax Deposited
Claimed Amount
Returned Amount
Remark

Auto generated.

Phase 4 - Finance
LIC
Term Insurance
Health Insurance
Loan
Other
Major Transactions
Phase 5 - Year Summary

Exactly like your Excel.

Excel Gross Salary
Cumulative Gross Salary
Form16 Gross Salary
Home Pay Salary
NPS
NPS GC
Karanja Society
Dockyard Bank
DCRB
ELWC
Over Time
Amount Paid / Credited
Amount of Tax Deducted
Amount of Tax Deposited
Claimed Amount
Returned Amount
LIC
Term Insurance
Health Insurance
Loan
Other
Major Transactions
Total EMI / Loan / Insurance / Major
Bulk Other Income
Home Pay - EMI / Loan / Kharcha
Phase 6 - Dashboard
Monthly
Salary Card
Earnings Card
Deductions Card
Recoveries Card
OT Card
Loan Card
Insurance Card
Major Transaction Card
Home Pay Card
Yearly
Salary Growth
OT Trend
Home Pay Trend
Major Transactions
Loan Summary
Insurance Summary
Tax Summary
Gross Comparison
UI

Not Excel-like.

Professional Admin Dashboard.

Blue Theme
Dashboard Cards
Charts
Modern Tables
Search
Filters
Mobile Responsive
Google Sheets
Users
Settings
Salary
FinancialYear
Form16
MajorTransactions
Loans
Insurance
ActivityLogs

No unnecessary sheets.

Final Output

Only

Code.gs
index.html

Everything else inside these two files.