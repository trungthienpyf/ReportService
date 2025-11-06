// Report page specific functions

// Initialize report page when loaded
if (currentPage === 'report') {
    initializeReportPage();
}

function initializeReportPage() {
    setTimeout(() => {
        initializeReportEventListeners();
    }, 100);
}

function initializeReportEventListeners() {
    // Add report button
    const addReportBtn = document.getElementById('addReportBtn');
    if (addReportBtn) {
        addReportBtn.addEventListener('click', function() {
            generateNewReport();
        });
    }
}

// Download report
function downloadReport(reportId) {
    const reportRow = event.target.closest('tr');
    const reportName = reportRow.querySelector('td:first-child').textContent;
    
    // Show loading state
    const downloadBtn = event.target;
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Downloading...';
    downloadBtn.disabled = true;
    
    // Simulate download process
    setTimeout(() => {
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
        showNotification(`Report "${reportName}" downloaded successfully`, 'success');
        
        // In a real application, you would trigger actual file download
        // For example: window.open(`/api/reports/${reportId}/download`);
        console.log(`Downloading report ID: ${reportId}, Name: ${reportName}`);
    }, 2000);
}

// Delete report
function deleteReport(reportId) {
    const reportRow = event.target.closest('tr');
    const reportName = reportRow.querySelector('td:first-child').textContent;
    
    confirmAction(
        `Are you sure you want to delete report "${reportName}"?`,
        function() {
            // Simulate API call to delete report
            setTimeout(() => {
                reportRow.remove();
                showNotification(`Report "${reportName}" has been deleted`, 'success');
            }, 500);
        }
    );
}

// Generate new report
function generateNewReport() {
    const addReportBtn = document.getElementById('addReportBtn');
    const originalText = addReportBtn.textContent;
    
    // Show loading state
    addReportBtn.textContent = '⏳ Generating...';
    addReportBtn.disabled = true;
    
    // Simulate report generation
    setTimeout(() => {
        const newReport = {
            name: `Generated Report ${Date.now()}`,
            dateCreated: new Date().toISOString().split('T')[0]
        };
        
        addReportToTable(newReport);
        
        addReportBtn.textContent = originalText;
        addReportBtn.disabled = false;
        
        showNotification('New report generated successfully', 'success');
    }, 3000);
}

// Add report to table
function addReportToTable(reportData) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    const newRow = document.createElement('tr');
    const reportId = Date.now(); // Simple ID generation for demo
    
    newRow.innerHTML = `
        <td>${reportData.name}</td>
        <td>${reportData.dateCreated}</td>
        <td>
            <button class="action-btn-small download-btn" onclick="downloadReport(${reportId})">Download</button>
            <button class="action-btn-small delete-btn" onclick="deleteReport(${reportId})">Delete</button>
        </td>
    `;
    
    // Insert at the top of the table (most recent first)
    tbody.insertBefore(newRow, tbody.firstChild);
}

// Search/filter reports
function filterReports(searchTerm) {
    const rows = document.querySelectorAll('#reportTableBody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('td:first-child').textContent.toLowerCase();
        const date = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        
        if (name.includes(searchTerm.toLowerCase()) || date.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Sort reports by date
function sortReportsByDate(ascending = true) {
    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;
    
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        const dateA = new Date(a.querySelector('td:nth-child(2)').textContent);
        const dateB = new Date(b.querySelector('td:nth-child(2)').textContent);
        
        return ascending ? dateA - dateB : dateB - dateA;
    });
    
    // Clear tbody and append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    
    showNotification(`Reports sorted by date (${ascending ? 'oldest first' : 'newest first'})`, 'info');
}

// Export reports data
function exportReportsData() {
    const rows = document.querySelectorAll('#reportTableBody tr');
    const data = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            data.push({
                name: cells[0].textContent,
                dateCreated: cells[1].textContent
            });
        }
    });
    
    console.log('Reports data:', data);
    showNotification('Reports data exported to console', 'success');
    
    // In a real application, you might convert to CSV or Excel
    return data;
}

// Get report statistics
function getReportStatistics() {
    const rows = document.querySelectorAll('#reportTableBody tr');
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let totalReports = rows.length;
    let reportsThisWeek = 0;
    let reportsThisMonth = 0;
    
    rows.forEach(row => {
        const dateCell = row.querySelector('td:nth-child(2)');
        if (dateCell) {
            const reportDate = new Date(dateCell.textContent);
            
            if (reportDate >= lastWeek) {
                reportsThisWeek++;
            }
            if (reportDate >= lastMonth) {
                reportsThisMonth++;
            } 
        }
    });
    
    const stats = {
        total: totalReports,
        thisWeek: reportsThisWeek,
        thisMonth: reportsThisMonth
    };
    
    console.log('Report statistics:', stats);
    showNotification(`Statistics: ${stats.total} total, ${stats.thisWeek} this week, ${stats.thisMonth} this month`, 'info');
    
    return stats;
}



function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function viewReportDetail(reportId){
    window.location.href = `/report/detail/${reportId}/`;
}

// report.js

// Function to show the confirmation modal
function showDeleteConfirmation(reportId, reportName) {
    // Create modal elements
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'deleteConfirmationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Xác Nhận Xóa</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <p>Bạn có chắc chắn muốn xóa báo cáo "<strong>${reportName}</strong>"?</p>
                <p>Không thể hoàn tác hành động này</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelDelete">Hủy</button>
                <button class="btn btn-danger" id="confirmDelete">Xóa</button>
            </div>
        </div>
    `;
    
    // Add modal to the page
    document.body.appendChild(modal);
    
    // Show the modal
    modal.style.display = 'block';
    
    // Close modal when clicking on X
    modal.querySelector('.close').addEventListener('click', function() {
        closeModal();
    });
    
    // Close modal when clicking cancel
    modal.querySelector('#cancelDelete').addEventListener('click', function() {
        closeModal();
    });
    
    // Confirm deletion
    modal.querySelector('#confirmDelete').addEventListener('click', function() {
        performDelete(reportId);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    function closeModal() {
        modal.style.display = 'none';
        document.body.removeChild(modal);
    }
}

// Function to perform the actual deletion via AJAX
function performDelete(reportId) {
    // Get CSRF token for Django
    const csrftoken = getCookie('csrftoken');
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmDelete');
    confirmBtn.textContent = 'Deleting...';
    confirmBtn.disabled = true;
    
    // Send DELETE request
    fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.error || 'Xóa báo cáo thất bại');
            });
        }
        return response.json();
    })
    .then(data => {
        // Close the modal
        const modal = document.getElementById('deleteConfirmationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.removeChild(modal);
        }
        
        // Remove the report row from the table
        const row = document.querySelector(`tr[data-report-id="${reportId}"]`);
        if (row) {
            row.remove();
        }
        
        // Show success message
        showNotification('Xóa báo cáo thành công!', 'success');
    })
    .catch(error => {
        // Show error message
        showNotification(error.message || 'Lỗi xóa báo cáo', 'error');
        
        // Reset button state
        const confirmBtn = document.getElementById('confirmDelete');
        if (confirmBtn) {
            confirmBtn.textContent = 'Delete';
            confirmBtn.disabled = false;
        }
    });
}

// Function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Function to show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Update the deleteReport function to use the modal
function deleteReport(reportId, reportName) {
    // Get report name from the table row
    if (!reportName) {
        const row = document.querySelector(`tr[data-report-id="${reportId}"]`);
        if (row) {
            reportName = row.querySelector('td:first-child').textContent;
        }
    }
    
    // Show confirmation modal
    showDeleteConfirmation(reportId, reportName);
}