// Configuration
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1_qwciFgPC98jL9-4j4p7qLTK639xF0Gkrddp9E4bGQo/export?format=csv";

// Data structure
let allEmployees = [];
let filteredEmployees = [];
let activeFilter = { type: null, value: null };

// DOM Elements
const filtersContainer = document.getElementById('filters-container');
const tableContainer = document.querySelector('.table-container');
const employeeCount = document.getElementById('employee-count');

// Initialize the application
function init() {
    loadData();
}

// Load data from Google Sheets
function loadData() {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            allEmployees = results.data;
            filteredEmployees = [...allEmployees];
            
            // Remove loading indicators
            filtersContainer.innerHTML = '';
            tableContainer.innerHTML = '';
            
            // Update employee count
            employeeCount.textContent = filteredEmployees.length;
            
            // Render UI components
            renderFilters();
            renderTable();
        },
        error: function(error) {
            console.error("Error loading data:", error);
            filtersContainer.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Error loading data. Please try again later.</p></div>';
            tableContainer.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Error loading data. Please try again later.</p></div>';
        }
    });
}

// Render filter menu
function renderFilters() {
    // Group employees by post and then by rank
    const postGroups = {};
    
    allEmployees.forEach(employee => {
        const post = employee.Post || 'Other';
        const rank = employee.Rank || 'Unknown';
        
        if (!postGroups[post]) {
            postGroups[post] = { count: 0, ranks: {} };
        }
        
        postGroups[post].count++;
        
        if (!postGroups[post].ranks[rank]) {
            postGroups[post].ranks[rank] = 0;
        }
        
        postGroups[post].ranks[rank]++;
    });
    
    // Generate combined groups
    const combinedGroups = {
        "Fitter Electrical + Fitter Electronics": {
            count: 0,
            ranks: {}
        },
        "Fitter General Mechanic + Fitter Armament": {
            count: 0,
            ranks: {}
        }
    };
    
    // Calculate combined group counts
    ["Fitter Electrical", "Fitter Electronics"].forEach(post => {
        if (postGroups[post]) {
            combinedGroups["Fitter Electrical + Fitter Electronics"].count += postGroups[post].count;
            
            Object.keys(postGroups[post].ranks).forEach(rank => {
                if (!combinedGroups["Fitter Electrical + Fitter Electronics"].ranks[rank]) {
                    combinedGroups["Fitter Electrical + Fitter Electronics"].ranks[rank] = 0;
                }
                combinedGroups["Fitter Electrical + Fitter Electronics"].ranks[rank] += postGroups[post].ranks[rank];
            });
        }
    });
    
    ["Fitter General Mechanic", "Fitter Armament"].forEach(post => {
        if (postGroups[post]) {
            combinedGroups["Fitter General Mechanic + Fitter Armament"].count += postGroups[post].count;
            
            Object.keys(postGroups[post].ranks).forEach(rank => {
                if (!combinedGroups["Fitter General Mechanic + Fitter Armament"].ranks[rank]) {
                    combinedGroups["Fitter General Mechanic + Fitter Armament"].ranks[rank] = 0;
                }
                combinedGroups["Fitter General Mechanic + Fitter Armament"].ranks[rank] += postGroups[post].ranks[rank];
            });
        }
    });
    
    // Create HTML for filters
    let filtersHTML = '';
    
    // Add "All" filter
    filtersHTML += `
        <div class="filter-item ${activeFilter.type === null ? 'active' : ''}" 
             onclick="applyFilter(null, null)">
            <i class="fas fa-folder-open"></i> All Employees
            <span class="count">${allEmployees.length}</span>
        </div>
    `;
    
    // Add individual posts
    Object.keys(postGroups).sort().forEach(post => {
        filtersHTML += `
            <div class="filter-item main-category ${activeFilter.type === 'post' && activeFilter.value === post ? 'active' : ''}" 
                 onclick="applyFilter('post', '${post}')">
                <i class="fas fa-folder"></i> ${post}
                <span class="count">${postGroups[post].count}</span>
            </div>
        `;
        
        // Add ranks for this post
        Object.keys(postGroups[post].ranks).sort().forEach(rank => {
            filtersHTML += `
                <div class="filter-item sub-category ${activeFilter.type === 'rank' && activeFilter.value === rank && activeFilter.post === post ? 'active' : ''}" 
                     onclick="applyFilter('rank', '${rank}', '${post}')">
                    ${rank}
                    <span class="count">${postGroups[post].ranks[rank]}</span>
                </div>
            `;
        });
    });
    
    // Add combined groups
    Object.keys(combinedGroups).forEach(combinedPost => {
        filtersHTML += `
            <div class="filter-item main-category ${activeFilter.type === 'combined' && activeFilter.value === combinedPost ? 'active' : ''}" 
                 onclick="applyFilter('combined', '${combinedPost}')">
                <i class="fas fa-folder-plus"></i> ${combinedPost}
                <span class="count">${combinedGroups[combinedPost].count}</span>
            </div>
        `;
        
        // Add ranks for combined group
        Object.keys(combinedGroups[combinedPost].ranks).sort().forEach(rank => {
            filtersHTML += `
                <div class="filter-item sub-category ${activeFilter.type === 'combined_rank' && activeFilter.value === rank && activeFilter.post === combinedPost ? 'active' : ''}" 
                     onclick="applyFilter('combined_rank', '${rank}', '${combinedPost}')">
                    ${rank}
                    <span class="count">${combinedGroups[combinedPost].ranks[rank]}</span>
                </div>
            `;
        });
    });
    
    filtersContainer.innerHTML = filtersHTML;
}

// Apply filter to employee data
function applyFilter(type, value, post = null) {
    activeFilter = { type, value, post };
    
    if (type === null) {
        // Show all employees
        filteredEmployees = [...allEmployees];
    } else if (type === 'post') {
        // Filter by post
        filteredEmployees = allEmployees.filter(emp => emp.Post === value);
    } else if (type === 'rank' && post) {
        // Filter by rank within a specific post
        filteredEmployees = allEmployees.filter(emp => 
            emp.Post === post && emp.Rank === value
        );
    } else if (type === 'combined') {
        // Filter by combined group
        if (value === "Fitter Electrical + Fitter Electronics") {
            filteredEmployees = allEmployees.filter(emp => 
                emp.Post === "Fitter Electrical" || emp.Post === "Fitter Electronics"
            );
        } else if (value === "Fitter General Mechanic + Fitter Armament") {
            filteredEmployees = allEmployees.filter(emp => 
                emp.Post === "Fitter General Mechanic" || emp.Post === "Fitter Armament"
            );
        }
    } else if (type === 'combined_rank' && post) {
        // Filter by rank within a combined group
        if (post === "Fitter Electrical + Fitter Electronics") {
            filteredEmployees = allEmployees.filter(emp => 
                (emp.Post === "Fitter Electrical" || emp.Post === "Fitter Electronics") && 
                emp.Rank === value
            );
        } else if (post === "Fitter General Mechanic + Fitter Armament") {
            filteredEmployees = allEmployees.filter(emp => 
                (emp.Post === "Fitter General Mechanic" || emp.Post === "Fitter Armament") && 
                emp.Rank === value
            );
        }
    }
    
    // Update employee count
    employeeCount.textContent = filteredEmployees.length;
    
    // Update UI
    renderFilters();
    renderTable();
}

// Render employee table with all columns
function renderTable() {
    if (filteredEmployees.length === 0) {
        tableContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-database"></i>
                <p>No employees found matching the selected criteria</p>
            </div>
        `;
        return;
    }
    
    let tableHTML = `
        <table id="employee-table">
            <thead>
                <tr>
                    <th data-sort="SrNo">SrNo</th>
                    <th data-sort="Name">Name</th>
                    <th data-sort="Post">Post</th>
                    <th data-sort="Rank">Rank</th>
                    <th data-sort="Tokan No">Token No</th>
                    <th data-sort="Category">Category</th>
                    <th data-sort="Location">Location</th>
                    <th data-sort="Date of Birth">Date of Birth</th>
                    <th data-sort="Date of Retirement">Retirement Date</th>
                    <th data-sort="Date of Appointment">Appointment Date</th>
                    <th data-sort="Date of Regular">Regularization Date</th>
                    <th data-sort="Dept Qualify Examination">Dept Qualify Exam</th>
                    <th data-sort="Date of Tradesman Mate">Tradesman Mate Date</th>
                    <th data-sort="Date of USL">USL Date</th>
                    <th data-sort="Date of SSK">SSK Date</th>
                    <th data-sort="Date of SK">SK Date</th>
                    <th data-sort="Date of HSK 2">HSK2 Date</th>
                    <th data-sort="Date of HSK 1">HSK1 Date</th>
                    <th data-sort="Date of MCM">MCM Date</th>
                    <th data-sort="Remark">Remark</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredEmployees.forEach(emp => {
        tableHTML += `
            <tr>
                <td>${emp.SrNo || ''}</td>
                <td>${emp.Name || ''}</td>
                <td>${emp.Post || ''}</td>
                <td>${emp.Rank || ''}</td>
                <td>${emp['Tokan No'] || ''}</td>
                <td>${emp.Category || ''}</td>
                <td>${emp.Location || ''}</td>
                <td>${emp['Date of Birth'] || ''}</td>
                <td>${emp['Date of Retirement'] || ''}</td>
                <td>${emp['Date of Appointment'] || ''}</td>
                <td>${emp['Date of Regular'] || ''}</td>
                <td>${emp['Dept Qualify Examination'] || ''}</td>
                <td>${emp['Date of Tradesman Mate'] || ''}</td>
                <td>${emp['Date of USL'] || ''}</td>
                <td>${emp['Date of SSK'] || ''}</td>
                <td>${emp['Date of SK'] || ''}</td>
                <td>${emp['Date of HSK 2'] || ''}</td>
                <td>${emp['Date of HSK 1'] || ''}</td>
                <td>${emp['Date of MCM'] || ''}</td>
                <td>${emp.Remark || ''}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
    
    // Add sorting functionality
    document.querySelectorAll('#employee-table th').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            sortTable(column);
        });
    });
}

// Sort table by column
function sortTable(column) {
    const table = document.getElementById('employee-table');
    const headers = table.querySelectorAll('th');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Remove existing sort indicators
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Determine sort direction
    const currentHeader = table.querySelector(`th[data-sort="${column}"]`);
    const isAsc = currentHeader.classList.contains('sort-asc');
    const direction = isAsc ? -1 : 1;
    
    // Update sort indicator
    currentHeader.classList.toggle('sort-asc', !isAsc);
    currentHeader.classList.toggle('sort-desc', isAsc);
    
    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.querySelector(`td:nth-child(${Array.from(headers).findIndex(h => h.getAttribute('data-sort') === column) + 1}`).textContent;
        const bValue = b.querySelector(`td:nth-child(${Array.from(headers).findIndex(h => h.getAttribute('data-sort') === column) + 1}`).textContent;
        
        // Try to compare as numbers if possible
        if (!isNaN(aValue) && !isNaN(bValue)) {
            return (parseFloat(aValue) - parseFloat(bValue)) * direction;
        }
        
        // Compare as dates (simple format detection)
        const dateRegex = /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/;
        const aDateMatch = aValue.match(dateRegex);
        const bDateMatch = bValue.match(dateRegex);
        
        if (aDateMatch && bDateMatch) {
            const aDate = new Date(`${aDateMatch[3]}-${aDateMatch[2]}-${aDateMatch[1]}`);
            const bDate = new Date(`${bDateMatch[3]}-${bDateMatch[2]}-${bDateMatch[1]}`);
            return (aDate - bDate) * direction;
        }
        
        // Default to string comparison
        return aValue.localeCompare(bValue) * direction;
    });
    
    // Re-append rows in sorted order
    rows.forEach(row => tbody.appendChild(row));
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', init);

// Expose applyFilter for HTML onclick
window.applyFilter = applyFilter;
