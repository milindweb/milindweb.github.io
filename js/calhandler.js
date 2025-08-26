// calhandler.js - Financial Calculator Handler

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to calculator items
    const calcItems = document.querySelectorAll('.calc-item');
    calcItems.forEach(item => {
        item.addEventListener('click', function() {
            const calcId = this.getAttribute('data-calc');
            showCalculator(calcId);
        });
    });

    // Initialize any calculator-specific setups
    initializeCalculators();
});

// Function to show calculator based on selection
function showCalculator(calcId) {
    // Hide the calculator list
    document.getElementById('calculatorList').style.display = 'none';
    
    // Hide all calculator views
    const calcViews = document.querySelectorAll('.calculator-view');
    calcViews.forEach(view => {
        view.style.display = 'none';
    });
    
    // Show the selected calculator
    const selectedCalc = document.getElementById(calcId + 'Calc');
    if (selectedCalc) {
        selectedCalc.style.display = 'block';
        // Scroll to the calculator
        selectedCalc.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to show the calculator list
function showCalculatorList() {
    // Show the calculator list
    document.getElementById('calculatorList').style.display = 'flex';
    
    // Hide all calculator views
    const calcViews = document.querySelectorAll('.calculator-view');
    calcViews.forEach(view => {
        view.style.display = 'none';
    });
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize calculator specific setups
function initializeCalculators() {
    // Set up input validation for numeric fields
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Allow only numbers and decimal point
            this.value = this.value.replace(/[^0-9.]/g, '');
            
            // Ensure only one decimal point
            if ((this.value.match(/\./g) || []).length > 1) {
                this.value = this.value.substring(0, this.value.lastIndexOf('.'));
            }
        });
    });
}

// SIP Calculator Function
function calculateSIP() {
    const monthlyInvestment = parseFloat(document.getElementById('sipMonthly').value) || 0;
    const annualRate = (parseFloat(document.getElementById('sipRate').value) || 0) / 100;
    const years = parseInt(document.getElementById('sipYears').value) || 0;
    
    if (monthlyInvestment <= 0 || annualRate <= 0 || years <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    const totalInvestment = monthlyInvestment * months;
    
    // Future Value of SIP formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    const futureValue = monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const returns = futureValue - totalInvestment;
    
    document.getElementById('sipTotalInvestment').textContent = `₹${formatCurrency(totalInvestment)}`;
    document.getElementById('sipReturns').textContent = `₹${formatCurrency(returns)}`;
    document.getElementById('sipTotalValue').textContent = `₹${formatCurrency(futureValue)}`;
}

// Lumpsum Investment Calculator
function calculateLumpsum() {
    const principal = parseFloat(document.getElementById('lumpsumAmount').value) || 0;
    const annualRate = (parseFloat(document.getElementById('lumpsumRate').value) || 0) / 100;
    const years = parseInt(document.getElementById('lumpsumYears').value) || 0;
    
    if (principal <= 0 || annualRate <= 0 || years <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    // Future Value = P(1 + r)^n
    const futureValue = principal * Math.pow(1 + annualRate, years);
    const returns = futureValue - principal;
    
    document.getElementById('lumpsumReturns').textContent = `₹${formatCurrency(returns)}`;
    document.getElementById('lumpsumTotalValue').textContent = `₹${formatCurrency(futureValue)}`;
}

// Mutual Fund Return Calculator
function calculateMutualFund() {
    const initialInvestment = parseFloat(document.getElementById('mfInitial').value) || 0;
    const monthlyInvestment = parseFloat(document.getElementById('mfMonthly').value) || 0;
    const annualRate = (parseFloat(document.getElementById('mfRate').value) || 0) / 100;
    const years = parseInt(document.getElementById('mfYears').value) || 0;
    
    if ((initialInvestment <= 0 && monthlyInvestment <= 0) || annualRate <= 0 || years <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    
    // Calculate future value of initial investment
    const futureValueInitial = initialInvestment * Math.pow(1 + annualRate, years);
    
    // Calculate future value of monthly investments (SIP)
    let futureValueMonthly = 0;
    if (monthlyInvestment > 0) {
        futureValueMonthly = monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    }
    
    const totalValue = futureValueInitial + futureValueMonthly;
    const totalInvestment = initialInvestment + (monthlyInvestment * months);
    const returns = totalValue - totalInvestment;
    
    document.getElementById('mfTotalInvestment').textContent = `₹${formatCurrency(totalInvestment)}`;
    document.getElementById('mfReturns').textContent = `₹${formatCurrency(returns)}`;
    document.getElementById('mfTotalValue').textContent = `₹${formatCurrency(totalValue)}`;
}

// Inflation Impact Calculator
function calculateInflation() {
    const currentAmount = parseFloat(document.getElementById('inflCurrent').value) || 0;
    const inflationRate = (parseFloat(document.getElementById('inflRate').value) || 0) / 100;
    const years = parseInt(document.getElementById('inflYears').value) || 0;
    
    if (currentAmount <= 0 || inflationRate <= 0 || years <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    // Future Value = Current Amount / (1 + inflation rate)^years
    const futureValue = currentAmount / Math.pow(1 + inflationRate, years);
    const reduction = currentAmount - futureValue;
    
    document.getElementById('inflFutureValue').textContent = `₹${formatCurrency(futureValue)}`;
    document.getElementById('inflReduction').textContent = `₹${formatCurrency(reduction)}`;
    document.getElementById('inflPercentage').textContent = `${(reduction/currentAmount * 100).toFixed(2)}%`;
}

// EMI Calculator Function
function calculateEMI() {
    const principal = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = (parseFloat(document.getElementById('interestRate').value) || 0) / 100 / 12; // Monthly interest rate
    const tenure = parseInt(document.getElementById('loanTenure').value) || 0;
    
    if (principal <= 0 || interestRate <= 0 || tenure <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    // EMI formula: [P x R x (1+R)^N]/[(1+R)^N-1]
    const emi = principal * interestRate * Math.pow(1 + interestRate, tenure) / (Math.pow(1 + interestRate, tenure) - 1);
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - principal;
    
    document.getElementById('emiValue').textContent = `₹${formatCurrency(emi)}`;
    document.getElementById('totalInterest').textContent = `₹${formatCurrency(totalInterest)}`;
    document.getElementById('totalPayment').textContent = `₹${formatCurrency(totalPayment)}`;
    
    // Generate amortization table
    generateAmortizationTable(principal, interestRate, tenure, emi);
    document.getElementById('amortizationTable').style.display = 'block';
}

// Generate Amortization Table for EMI Calculator
function generateAmortizationTable(principal, monthlyRate, tenure, emi) {
    let balance = principal;
    let tableHTML = '';
    
    for (let month = 1; month <= tenure; month++) {
        const interest = balance * monthlyRate;
        const principalPaid = emi - interest;
        balance -= principalPaid;
        
        // Ensure balance doesn't go negative
        if (balance < 0) {
            balance = 0;
        }
        
        tableHTML += `
            <tr>
                <td>${month}</td>
                <td>₹${emi.toFixed(2)}</td>
                <td>₹${principalPaid.toFixed(2)}</td>
                <td>₹${interest.toFixed(2)}</td>
                <td>₹${balance.toFixed(2)}</td>
            </tr>
        `;
        
        // If balance is zero, break out of the loop
        if (balance <= 0) {
            break;
        }
    }
    
    document.getElementById('amortizationBody').innerHTML = tableHTML;
}

// Loan Calculator (Simple)
function calculateLoan() {
    const principal = parseFloat(document.getElementById('loanPrincipal').value) || 0;
    const interestRate = (parseFloat(document.getElementById('loanInterest').value) || 0) / 100;
    const years = parseInt(document.getElementById('loanTerm').value) || 0;
    
    if (principal <= 0 || interestRate <= 0 || years <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    const totalInterest = principal * interestRate * years;
    const totalPayment = principal + totalInterest;
    const monthlyPayment = totalPayment / (years * 12);
    
    document.getElementById('loanMonthly').textContent = `₹${formatCurrency(monthlyPayment)}`;
    document.getElementById('loanTotalInterest').textContent = `₹${formatCurrency(totalInterest)}`;
    document.getElementById('loanTotalPayment').textContent = `₹${formatCurrency(totalPayment)}`;
}

// Home Loan vs Rent Comparison Calculator
function calculateHomeLoanVsRent() {
    const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
    const loanAmount = parseFloat(document.getElementById('homeLoanAmount').value) || 0;
    const interestRate = (parseFloat(document.getElementById('homeLoanInterest').value) || 0) / 100 / 12;
    const loanTerm = parseInt(document.getElementById('homeLoanTerm').value) || 0;
    const monthlyRent = parseFloat(document.getElementById('monthlyRent').value) || 0;
    const rentIncrease = (parseFloat(document.getElementById('rentIncrease').value) || 0) / 100;
    const investmentReturn = (parseFloat(document.getElementById('investmentReturn').value) || 0) / 100;
    
    if (homePrice <= 0 || loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0 || monthlyRent <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    // Calculate EMI for home loan
    const emi = loanAmount * interestRate * Math.pow(1 + interestRate, loanTerm) / (Math.pow(1 + interestRate, loanTerm) - 1);
    
    // Calculate total cost of home ownership
    const downPayment = homePrice - loanAmount;
    let totalOwnershipCost = downPayment;
    
    // Calculate total rent paid over the loan term with annual increases
    let totalRentPaid = 0;
    let currentRent = monthlyRent;
    
    for (let year = 1; year <= Math.ceil(loanTerm / 12); year++) {
        for (let month = 1; month <= 12; month++) {
            totalRentPaid += currentRent;
            if ((year - 1) * 12 + month >= loanTerm) break;
        }
        currentRent *= (1 + rentIncrease);
    }
    
    // Calculate investment opportunity cost
    const investmentGain = downPayment * Math.pow(1 + investmentReturn, loanTerm / 12);
    
    // Update results
    document.getElementById('homeLoanEmi').textContent = `₹${formatCurrency(emi)}`;
    document.getElementById('totalOwnershipCost').textContent = `₹${formatCurrency(totalOwnershipCost)}`;
    document.getElementById('totalRentPaid').textContent = `₹${formatCurrency(totalRentPaid)}`;
    document.getElementById('investmentGain').textContent = `₹${formatCurrency(investmentGain - downPayment)}`;
    
    // Recommendation
    const recommendation = totalOwnershipCost + (emi * loanTerm) < totalRentPaid ? 
        "Buying a home is more financially beneficial." : "Renting is more financially beneficial.";
    document.getElementById('homeRentRecommendation').textContent = recommendation;
}

// Fixed Deposit Calculator
function calculateFD() {
    const principal = parseFloat(document.getElementById('fdPrincipal').value) || 0;
    const interestRate = (parseFloat(document.getElementById('fdInterest').value) || 0) / 100;
    const tenure = parseInt(document.getElementById('fdTenure').value) || 0;
    const compoundFrequency = parseInt(document.getElementById('fdCompound').value) || 1;
    
    if (principal <= 0 || interestRate <= 0 || tenure <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    // Calculate maturity amount
    const n = compoundFrequency; // compounding frequency per year
    const maturityAmount = principal * Math.pow(1 + interestRate/n, n * (tenure/12));
    const interestEarned = maturityAmount - principal;
    
    document.getElementById('fdMaturityAmount').textContent = `₹${formatCurrency(maturityAmount)}`;
    document.getElementById('fdInterestEarned').textContent = `₹${formatCurrency(interestEarned)}`;
}

// Recurring Deposit Calculator
function calculateRD() {
    const monthlyDeposit = parseFloat(document.getElementById('rdMonthly').value) || 0;
    const interestRate = (parseFloat(document.getElementById('rdInterest').value) || 0) / 100;
    const tenure = parseInt(document.getElementById('rdTenure').value) || 0;
    
    if (monthlyDeposit <= 0 || interestRate <= 0 || tenure <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    // RD formula: M = R * [(1+i)^n - 1] / (1 - (1+i)^(-1/3))
    const i = interestRate / 4; // quarterly compounding
    const n = tenure / 3; // number of quarters
    const maturityAmount = monthlyDeposit * ((Math.pow(1 + i, n) - 1) / (1 - Math.pow(1 + i, -1/3)));
    const totalDeposit = monthlyDeposit * tenure;
    const interestEarned = maturityAmount - totalDeposit;
    
    document.getElementById('rdMaturityAmount').textContent = `₹${formatCurrency(maturityAmount)}`;
    document.getElementById('rdInterestEarned').textContent = `₹${formatCurrency(interestEarned)}`;
    document.getElementById('rdTotalDeposit').textContent = `₹${formatCurrency(totalDeposit)}`;
}

// Sukanya Samriddhi Yojana Calculator
function calculateSSY() {
    const yearlyDeposit = parseFloat(document.getElementById('ssyYearly').value) || 0;
    const interestRate = (parseFloat(document.getElementById('ssyInterest').value) || 0) / 100;
    const startAge = parseInt(document.getElementById('ssyAge').value) || 0;
    
    if (yearlyDeposit <= 0 || interestRate <= 0 || startAge <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    // SSY calculation (simplified)
    const years = 21 - startAge; // Account matures when girl turns 21
    let balance = 0;
    
    for (let year = 1; year <= years; year++) {
        balance += yearlyDeposit; // Add yearly deposit
        balance *= (1 + interestRate); // Apply interest
    }
    
    const totalDeposit = yearlyDeposit * years;
    const interestEarned = balance - totalDeposit;
    
    document.getElementById('ssyMaturityAmount').textContent = `₹${formatCurrency(balance)}`;
    document.getElementById('ssyInterestEarned').textContent = `₹${formatCurrency(interestEarned)}`;
    document.getElementById('ssyTotalDeposit').textContent = `₹${formatCurrency(totalDeposit)}`;
}

// Income Tax Calculator
function calculateIncomeTax() {
    const income = parseFloat(document.getElementById('taxIncome').value) || 0;
    const deductions = parseFloat(document.getElementById('taxDeductions').value) || 0;
    const exemptions = parseFloat(document.getElementById('taxExemptions').value) || 0;
    const regime = document.querySelector('input[name="taxRegime"]:checked').value;
    
    if (income <= 0) {
        alert("Please enter valid income value.");
        return;
    }
    
    // Calculate taxable income
    const taxableIncome = income - deductions - exemptions;
    
    // Calculate tax based on selected regime (simplified)
    let tax = 0;
    
    if (regime === 'old') {
        // Old tax regime slabs (simplified)
        if (taxableIncome > 1000000) {
            tax = 112500 + (taxableIncome - 1000000) * 0.3;
        } else if (taxableIncome > 500000) {
            tax = 12500 + (taxableIncome - 500000) * 0.2;
        } else if (taxableIncome > 250000) {
            tax = (taxableIncome - 250000) * 0.05;
        }
    } else {
        // New tax regime slabs (simplified)
        if (taxableIncome > 1500000) {
            tax = 112500 + (taxableIncome - 1500000) * 0.3;
        } else if (taxableIncome > 1200000) {
            tax = 67500 + (taxableIncome - 1200000) * 0.2;
        } else if (taxableIncome > 900000) {
            tax = 22500 + (taxableIncome - 900000) * 0.15;
        } else if (taxableIncome > 600000) {
            tax = (taxableIncome - 600000) * 0.1;
        } else if (taxableIncome > 300000) {
            tax = (taxableIncome - 300000) * 0.05;
        }
    }
    
    // Add cess
    const cess = tax * 0.04;
    const totalTax = tax + cess;
    
    document.getElementById('taxableIncome').textContent = `₹${formatCurrency(taxableIncome)}`;
    document.getElementById('taxAmount').textContent = `₹${formatCurrency(tax)}`;
    document.getElementById('taxCess').textContent = `₹${formatCurrency(cess)}`;
    document.getElementById('taxTotal').textContent = `₹${formatCurrency(totalTax)}`;
    document.getElementById('taxEffectiveRate').textContent = `${((totalTax / income) * 100).toFixed(2)}%`;
}

// Capital Gains Tax Calculator
function calculateCapitalGains() {
    const purchasePrice = parseFloat(document.getElementById('cgPurchasePrice').value) || 0;
    const salePrice = parseFloat(document.getElementById('cgSalePrice').value) || 0;
    const holdingPeriod = parseInt(document.getElementById('cgHoldingPeriod').value) || 0;
    const assetType = document.getElementById('cgAssetType').value;
    
    if (purchasePrice <= 0 || salePrice <= 0 || holdingPeriod <= 0) {
        alert("Please enter valid values for all fields.");
        return;
    }
    
    const gain = salePrice - purchasePrice;
    let tax = 0;
    let taxRate = 0;
    
    if (gain > 0) {
        if (assetType === 'equity') {
            if (holdingPeriod > 12) {
                // LTCG on equity
                tax = gain * 0.1;
                taxRate = 10;
            } else {
                // STCG on equity
                tax = gain * 0.15;
                taxRate = 15;
            }
        } else {
            // Non-equity assets
            if (holdingPeriod > 24) {
                // LTCG on non-equity
                tax = gain * 0.2;
                taxRate = 20;
            } else {
                // STCG on non-equity - added to income
                taxRate = 'As per income tax slab';
                document.getElementById('cgTaxAmount').textContent = 'Added to income as per slab';
                document.getElementById('cgTaxRate').textContent = 'As per income tax slab';
                document.getElementById('cgGainAmount').textContent = `₹${formatCurrency(gain)}`;
                return;
            }
        }
    }
    
    document.getElementById('cgGainAmount').textContent = `₹${formatCurrency(gain)}`;
    document.getElementById('cgTaxAmount').textContent = `₹${formatCurrency(tax)}`;
    document.getElementById('cgTaxRate').textContent = `${taxRate}%`;
}

// Utility function to format currency values
function formatCurrency(value) {
    if (value >= 10000000) {
        return (value / 10000000).toFixed(2) + ' Cr';
    } else if (value >= 100000) {
        return (value / 100000).toFixed(2) + ' L';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(2) + ' K';
    } else {
        return value.toFixed(2);
    }
}