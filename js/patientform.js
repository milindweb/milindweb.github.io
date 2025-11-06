// 1. JavaScript Integration
// Load JSON data for autocomplete
async function loadJSONData() {
    try {
        // Load departments
        const deptResponse = await fetch('data/dept.json');
        const departments = await deptResponse.json();
        populateDatalist('departmentList', departments.map(dept => dept.department));
        
        // Load doctors
        const drResponse = await fetch('data/drname.json');
        const doctors = await drResponse.json();
        populateDatalist('doctorNameList', doctors.doctors);
        
        // Load complaints
        const complaintResponse = await fetch('data/complaint.json');
        const complaints = await complaintResponse.json();
        populateDatalist('chiefComplaintList', [complaints.chiefComplaint]);
        // Add sub-symptoms logic here
        
        // Load lab tests
        const labResponse = await fetch('data/labtest.json');
        const labTests = await labResponse.json();
        // Add test category and test name logic here
        
        // Load medicine list
        const medResponse = await fetch('data/medlist.json');
        const medicines = await medResponse.json();
        // Add form available and prescription logic here
        
    } catch (error) {
        console.error('Error loading JSON data:', error);
    }
}

function populateDatalist(datalistId, options) {
    const datalist = document.getElementById(datalistId);
    datalist.innerHTML = '';
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        datalist.appendChild(optionElement);
    });
}

// 2. Google Sheets Integration
// Submit form data to Google Sheets
async function submitToGoogleSheet(formData) {
    const webAppURL = 'https://script.google.com/macros/s/AKfycbw5Fq8xJeXjPilVb01Iz4lArtrgfq5jd8A55U8Zjp3taVRkni20QrXgHiYa1eEUN1ly/exec';
    
    try {
        const response = await fetch(webAppURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'create',
                ...formData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Patient data saved successfully! OPD No: ' + result.opdNo);
            // Clear form or redirect
        } else {
            alert('Error saving data: ' + result.error);
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('Failed to save data. Please try again.');
    }
}

// 3. Enhanced Form Data Preparation:
function prepareFormData() {
    const form = document.getElementById('patientForm');
    const formData = new FormData(form);
    const data = {};
    
    // Process single-value fields
    const singleFields = ['patientName', 'mobileNo', 'date', 'opdNo', 'gender', 'age', 
                         'department', 'doctorName', 'chiefComplaint', 'subSymptoms', 
                         'specificComplaint', 'weight', 'bp', 'pulse', 'temp', 'sugar', 
                         'diagnosis', 'advice', 'effectAfterTreatment', 'drNoteRemarks', 
                         'totalAmount', 'billRemark'];
    
    singleFields.forEach(field => {
        data[field] = formData.get(field) || '';
    });
    
    // Process multi-row sections (join with newlines)
    data['testCategory'] = formData.getAll('testCategory[]').join('\n');
    data['testName'] = formData.getAll('testName[]').join('\n');
    data['normalRange'] = formData.getAll('normalRange[]').join('\n');
    data['reports'] = formData.getAll('reports[]').join('\n');
    data['testRemark'] = formData.getAll('testRemark[]').join('\n');
    
    data['formAvailable'] = formData.getAll('formAvailable[]').join('\n');
    data['prescription'] = formData.getAll('prescription[]').join('\n');
    data['treatmentNote'] = formData.getAll('treatmentNote[]').join('\n');
    
    data['billDescription'] = formData.getAll('billDescription[]').join('\n');
    data['rate'] = formData.getAll('rate[]').join('\n');
    data['quantity'] = formData.getAll('quantity[]').join('\n');
    data['discount'] = formData.getAll('discount[]').join('\n');
    data['amount'] = formData.getAll('amount[]').join('\n');
    
    return data;
}










