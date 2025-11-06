// Member page specific functions

// Initialize member page when loaded
if (currentPage === 'member') {
    initializeMemberPage();
}

function initializeMemberPage() {
    setTimeout(() => {
        initializeMemberEventListeners();
    }, 100);
}

function initializeMemberEventListeners() {
    // Add member button
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', function() {
            showNotification('Add member functionality would be implemented here', 'info');
        });
    }
}

// View member details
function viewMember(memberId) {
    // In a real application, you would navigate to a member detail page
    // or show a modal with member information
    showNotification(`Viewing member ID: ${memberId}`, 'info');
    
    // Simulate navigation to member detail page
    console.log(`Navigating to member detail page for ID: ${memberId}`);
    
    // Example of what you might do:
    // window.location.href = `member-detail.html?id=${memberId}`;
    // or show a modal with member details
}

// Delete member
function deleteMember(memberId) {
    const memberRow = event.target.closest('tr');
    const memberName = memberRow.querySelector('td:first-child').textContent;
    
    confirmAction(
        `Are you sure you want to delete member "${memberName}"?`,
        function() {
            // Simulate API call to delete member
            setTimeout(() => {
                memberRow.remove();
                showNotification(`Member "${memberName}" has been deleted`, 'success');
            }, 500);
        }
    );
}

// Add new member (could be expanded to show a form modal)
function addNewMember() {
    // This would typically open a modal or navigate to an add member form
    showNotification('Add new member form would open here', 'info');
    
    // Example of adding a new row (for demonstration)
    // In a real app, this would be done after form submission
    const sampleMember = {
        name: 'New Member',
        page: 'Dashboard',
        type: 'delivery',
        percentage: '0%'
    };
    
    // You could call addMemberToTable(sampleMember) here
}

// Function to add member to table (utility function)
function addMemberToTable(memberData) {
    const tbody = document.getElementById('memberTableBody');
    if (!tbody) return;
    
    const newRow = document.createElement('tr');
    const memberId = Date.now(); // Simple ID generation for demo
    
    newRow.innerHTML = `
        <td>${memberData.name}</td>
        <td>${memberData.page}</td>
        <td>
            <span class="delivery-badge ${memberData.type}">${memberData.type === 'delivery' ? 'Delivery' : 'Receipt'}</span>
        </td>
        <td>${memberData.percentage}</td>
        <td>
            <button class="action-btn-small view-btn" onclick="viewMember(${memberId})">View</button>
            <button class="action-btn-small delete-btn" onclick="deleteMember(${memberId})">Delete</button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    showNotification('Member added successfully', 'success');
}

// Search/filter members (could be added as enhancement)
function filterMembers(searchTerm) {
    const rows = document.querySelectorAll('#memberTableBody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('td:first-child').textContent.toLowerCase();
        const page = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        
        if (name.includes(searchTerm.toLowerCase()) || page.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Export members data (utility function)
function exportMembersData() {
    const rows = document.querySelectorAll('#memberTableBody tr');
    const data = [];
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
            data.push({
                name: cells[0].textContent,
                page: cells[1].textContent,
                type: cells[2].textContent.trim(),
                percentage: cells[3].textContent
            });
        }
    });
    
    console.log('Members data:', data);
    showNotification('Members data exported to console', 'success');
    
    // In a real application, you might convert to CSV or Excel
    return data;
}



// Edit member function
function editMember(shareholderId) {
    event.stopPropagation();
    // Implement edit functionality
    console.log('Edit shareholder:', shareholderId);
    // You can redirect to an edit page or show an edit modal
    // window.location.href = `/edit-shareholder/${shareholderId}/`;
}

// Delete member function
function deleteMember(shareholderId) {
    event.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa cổ đông này?')) {
        // Implement delete functionality
        console.log('Delete shareholder:', shareholderId);
        // You can make an AJAX call to delete the shareholder
        // fetch(`/delete-shareholder/${shareholderId}/`, { method: 'DELETE' })
        // .then(response => {
        //     if (response.ok) {
        //         location.reload();
        //     }
        // });
    }
}