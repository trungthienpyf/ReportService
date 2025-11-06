document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('dataTable');
    const modal = document.getElementById('infoModal');
    const addBtn = document.getElementById('modalAddButton');
    const closeBtn = document.getElementById('modalCloseButton');
    const shareholderInput = document.getElementById('shareholder');
    const percentageInput = document.getElementById('percentage');
    
    let currentRowId = null;

    // Handle row button clicks
    table.addEventListener('click', function(e) {
        if (e.target.classList.contains('row-btn')) {
            const row = e.target.closest('tr');
            currentRowId = row.cells[0].textContent; // Get ID from first column
            modal.style.display = 'block';
        }
    });

    // Handle Add Shareholder button
    addBtn.addEventListener('click', async function() {
        const shareholder = shareholderInput.value.trim();
        const percentage = parseFloat(percentageInput.value.trim());

        if (!shareholder || isNaN(percentage) || percentage < 0 || percentage > 100) {
            alert('Please enter valid shareholder name and percentage (0-100)');
            return;
        }

        try {
            const response = await fetch('/api-update-shareholder/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    id: currentRowId,
                    shareholder: shareholder,
                    percentage: percentage
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update the table with new data
                updateTableRow(data);
                
                // Close modal and clear inputs
                closeModal();
                
                // Show success message (optional)
                alert('Shareholder added successfully!');
            } else {
                throw new Error(data.error || 'Failed to update shareholder');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        }
    });

    // Update table row with new data
    function updateTableRow(updatedData) {
        const rows = table.getElementsByTagName('tr');
        
        // Find the row with matching ID (skip header row)
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].cells[0].textContent === updatedData.id.toString()) {
                // Update shareholder and percentage cells
                // If cells don't exist, create them
                let shareholderCell = rows[i].cells[5];
                let percentageCell = rows[i].cells[6];
                
                if (!shareholderCell) {
                    shareholderCell = rows[i].insertCell(5);
                    percentageCell = rows[i].insertCell(6);
                }
                
                shareholderCell.textContent = updatedData.shareholder;
                percentageCell.textContent = updatedData.percentage + '%';
                break;
            }
        }
    }

    // Close modal and reset form
    function closeModal() {
        modal.style.display = 'none';
        shareholderInput.value = '';
        percentageInput.value = '';
    }

    // Close modal handlers
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });

    // CSRF token helper
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
});