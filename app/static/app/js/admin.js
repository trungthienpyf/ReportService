// ==================== FORMATTING FUNCTIONS ====================

const displayValue = (value) => {
    if (value === null || value === undefined) return '';
    if (value === 0) return '0';

    if (value < 0) {
        return `<span style="color: red">${Number(value).toLocaleString('en-US', {maximumFractionDigits: 0})}</span>`;
    }

    return Number(value).toLocaleString('en-US', {maximumFractionDigits: 0});
};

const formatPercentage = (percentage) => {
    if (percentage === null || percentage === undefined) return '';
    
    // Convert to number and handle both string and number inputs
    const num = parseFloat(percentage);
    if (isNaN(num)) return percentage.toString();
    
    // Remove decimal for integer values, keep for decimal values
    if (Number.isInteger(num)) {
        return num.toString();
    } else {
        return num.toString();
    }
};

// ==================== DATE SELECTION VARIABLES ====================
let currentDate = new Date();
let selectedDate = null;
let activeInput = null;

const vietnamTextCalenda = {
    months: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
             "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
    daysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
};

// ==================== DATE FUNCTIONS ====================

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
}

function updateDateInputs(preset) {
    const today = new Date();
    const fromInput = document.getElementById('fromDate');
    const toInput = document.getElementById('toDate');
    
    if (!fromInput || !toInput) return;
    
    let fromDate, toDate;
    
    switch(preset) {
        case 'yesterday':
            fromDate = new Date(today);
            fromDate.setDate(today.getDate() - 1);
            toDate = new Date(fromDate);
            break;
        case 'today':
            fromDate = new Date(today);
            toDate = new Date(today);
            break;
        case 'thisweek':
            fromDate = new Date(today);
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            fromDate.setDate(today.getDate() + diffToMonday);
            toDate = new Date(today);
            break;
        case 'lastweek':
            fromDate = new Date(today);
            const lastWeekStart = new Date(today);
            lastWeekStart.setDate(today.getDate() - today.getDay() - 6);
            fromDate = lastWeekStart;
            toDate = new Date(fromDate);
            toDate.setDate(fromDate.getDate() + 6);
            break;
        default:
            fromDate = new Date(today);
            toDate = new Date(today);
    }
    
    fromInput.value = formatDate(fromDate);
    toInput.value = formatDate(toDate);
    
    const tableContainer = document.getElementById('dataTableContainer');
    if (tableContainer) {
        tableContainer.style.display = 'none';
    }
}

function showCalendar(inputType) {
    activeInput = inputType;
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.classList.add('show');
        generateCalendar();
    }
}

function hideCalendar() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.classList.remove('show');
    }
    selectedDate = null;
    activeInput = null;
}

function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');
    
    if (!grid || !title) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    title.textContent = `${vietnamTextCalenda.months[month]} ${year}`;
    
    grid.innerHTML = '';
    
    vietnamTextCalenda.daysShort.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();
        
        if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        const activeInputElement = document.getElementById(activeInput === 'from' ? 'fromDate' : 'toDate');
        if (activeInputElement && activeInputElement.value) {
            const selectedDate = parseDate(activeInputElement.value);
            if (date.toDateString() === selectedDate.toDateString()) {
                dayElement.classList.add('selected');
            }
        }
        
        dayElement.addEventListener('click', function() {
            document.querySelectorAll('.calendar-day').forEach(d => {
                d.classList.remove('selected');
            });
            
            this.classList.add('selected');
            selectedDate = new Date(date);
            
            if (activeInput && selectedDate) {
                const input = document.getElementById(activeInput === 'from' ? 'fromDate' : 'toDate');
                if (input) {
                    input.value = formatDate(selectedDate);
                    
                    const tableContainer = document.getElementById('dataTableContainer');
                    if (tableContainer) {
                        tableContainer.style.display = 'none';
                    }
                }
            }
            
            hideCalendar();
        });
        
        grid.appendChild(dayElement);
    }
}

function getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        
        return cookieValue || '';
    }


// copy and paste to admin.js to create report
const reportBtn = document.getElementById('reportBtn');
reportBtn.addEventListener('click', async function(){

    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const user = document.getElementById('username').textContent;
    console.log(fromDate, toDate, user);

    try{
        const response = await fetch('/createReport/', {
        method:'POST',
        headers:{
        'Content-Type': 'application/json',
            'X-CSRFToken':getCSRFToken()

        },
        body:JSON.stringify({
            fromDate:fromDate,
            toDate:toDate,
            user:user

        })
        

    })

    const data = await response.json()
    if (!response){
        console.log("Reponse Faild")
    }
    else{


        const originalText = this.textContent;
        this.textContent = '📄 Đang Tạo...';
        this.disabled = true;
        setTimeout(() => {
        this.textContent = originalText;
        this.disabled = false;
        showNotification('Tạo báo cáo thành công', 'success');
    }, 2000)
        
        return;
    }
    

    }catch{
        console.log("fetch Data with path faild")
    }

})

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar();
}

// ==================== EVENT LISTENERS ====================

function initializeDateEventListeners() {
    const datePresets = document.querySelectorAll('.date-preset');
    datePresets.forEach(preset => {
        preset.addEventListener('click', function() {
            datePresets.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const presetType = this.getAttribute('data-preset');
            updateDateInputs(presetType);
        });
    });

    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    
    if (fromDateInput) {
        fromDateInput.addEventListener('click', function() {
            showCalendar('from');
        });
    }
    
    if (toDateInput) {
        toDateInput.addEventListener('click', function() {
            showCalendar('to');
        });
    }

    const calendarModal = document.getElementById('calendarModal');
    const cancelDateBtn = document.getElementById('cancelDate');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    if (cancelDateBtn) cancelDateBtn.addEventListener('click', hideCalendar);
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));

    if (calendarModal) {
        calendarModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideCalendar();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideCalendar();
        }
    });
}

// ==================== API CALL ====================

async function fetchStatisticsData() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    
    if (!fromDate || !toDate) {
        alert('Vui lòng chọn khoảng thời gian');
        return;
    }
    
    try {
        const scanBtn = document.getElementById('scanBtn');
        scanBtn.disabled = true;
        scanBtn.textContent = 'Đang tải...';
        
        const response = await fetch(`/api-get-statistic?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const dataTableContainer = document.getElementById('dataTableContainer');
        dataTableContainer.style.display = 'block';
        
        renderData(data);
        
    } catch (error) {
        console.error('Error fetching statistics:', error);
        alert('Lỗi khi tải dữ liệu: ' + error.message);
    } finally {
        const scanBtn = document.getElementById('scanBtn');
        scanBtn.disabled = false;
        scanBtn.textContent = '🔍 Quét';
    }
}

// ==================== TABLE RENDERING ====================

function renderData(data) {
    const dataTableBody = document.getElementById('dataTableBody');
    dataTableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        dataTableBody.innerHTML = '<tr><td colspan="11" class="no-data-row">Không có dữ liệu</td></tr>';
        return;
    }
    
    data.forEach(machine => {
        // Create machine header row
        const machineHeaderRow = document.createElement('tr');
        machineHeaderRow.classList.add('machine-header-row', 'clickable-row');
        machineHeaderRow.dataset.machineId = machine.id;
        machineHeaderRow.innerHTML = `
            <td colspan="11" class="machine-header">
                <span class="expand-icon">▶</span>
                <strong>${machine.username}</strong> | 
                Tổng Thắng Thua: ${displayValue(machine.thangthua)} | 
                Tổng Cược: ${displayValue(machine.tongcuoc)} |
                Lai về : ${displayValue(machine.laive)}
            </td>
        `;
        dataTableBody.appendChild(machineHeaderRow);
        
        // Create customer rows (initially hidden)
        if (machine.customersList && machine.customersList.length > 0) {
            machine.customersList.forEach(customer => {
                if (customer.customer_id === 0 && customer.customer_name === 'total') {
                    return; // Skip total rows for now
                }
                
                // const customerRow = createCustomerRow(customer, machine.id);
                const customerRow = createCustomerRow(customer, machine);
                customerRow.classList.add('customer-row', 'hidden');
                customerRow.dataset.machineId = machine.id;
                dataTableBody.appendChild(customerRow);
            });
        }
    });
    
    // Add click event listeners for expand/collapse
    initializeRowInteractions();
}

function createCustomerRow(customer, machine) {
    const row = document.createElement('tr');
    row.classList.add('customer-row');
    row.dataset.customerId = customer.customer_id;
    row.dataset.machineId = machine.machineId;
    
    // Format percentage column with giaonhan (using formatPercentage function)
    let percentageHtml = '';
    if (customer.phantram && customer.giaonhan && customer.phantram.length > 0) {
        percentageHtml = customer.phantram.map((percent, index) => {
            const formattedPercent = formatPercentage(percent);
            const giaonhan = customer.giaonhan[index] || '';
            return `${formattedPercent} ${giaonhan}`;
        }).join('<br>');
    }
    
    // Format member column (codong only)
    let memberHtml = '';
    if (customer.codong && customer.codong.length > 0) {
        memberHtml = customer.codong.join('<br>');
    }
    
    // Format total amount column (thanhtien only) - using displayValue function
    let totalAmountHtml = '';
    if (customer.thanhtien && customer.thanhtien.length > 0) {
        totalAmountHtml = customer.thanhtien.map(amount => displayValue(amount)).join('<br>');
    }
    
    // Create view buttons based on number of members
    let viewButtonsHtml = '';
    if (customer.codong && customer.codong.length > 0) {
        customer.codong.forEach((member, index) => {
            const percentage = customer.phantram && customer.phantram[index] ? customer.phantram[index] : '';
            const giaonhan = customer.giaonhan && customer.giaonhan[index] ? customer.giaonhan[index] : '';
            
            viewButtonsHtml += `
                <button class="action-btn-small view-btn" id = "update-btn"
                        data-customer-id="${customer.customer_id}"
                        data-customer-name="${customer.customer_name}"
                        data-member="${member}"
                        data-machine="${machine.username}"
                        data-percentage="${percentage}"
                        data-giaonhan="${giaonhan}">
                    👁️
                </button>
                <br>
            `;
        });
    }
    



    // Create delete buttons based on number of members
    // let deleteButtonsHtml = '';
    // if (customer.codong && customer.codong.length > 0) {
    //     customer.codong.forEach((member, index) => {
    //         deleteButtonsHtml += `
    //             <button class="action-btn-small delete-btn" 
    //                     data-customer-id="${customer.customer_id}"
    //                     data-member="${member}">
    //                 🗑️
    //             </button>
    //             <br>
    //         `;
    //     });
    // }


    // Create delete buttons based on number of members
    let deleteButtonsHtml = '';
    if (customer.codong && customer.codong.length > 0) {
        customer.codong.forEach((member, index) => {
            const percentage = customer.phantram && customer.phantram[index] ? customer.phantram[index] : '';
            const giaonhan = customer.giaonhan && customer.giaonhan[index] ? customer.giaonhan[index] : '';
            
            deleteButtonsHtml += `
                <button class="action-btn-small delete-btn" id ="deletebtn" 
                        data-customer-id="${customer.customer_id}"
                        data-customer-name="${customer.customer_name}"
                        data-machine-name="${machine.username}"
                        data-giaonhan="${giaonhan}"
                        data-member="${member}"
                        data-percentage="${percentage}">
                    🗑️
                </button>
                <br>
            `;
        });
    }




    
    // Plus button for adding shareholders
    const plusButtonHtml = `
        <button class="action-btn-small add-shareholder-btn" id="plusbtn"
                data-customer-id="${customer.customer_id}"
                data-customer-name="${customer.customer_name}"
                data-machine-name="${machine.username}"
                data-customer-thangthua = "${customer.thangthua}"
                onclick = "showAddShareholderModal('${customer.customer_id}', '${customer.customer_name}', '${machine.username}', '${customer.thangthua}')"
                >
                
            ➕
        </button>
    `;
    
    row.innerHTML = `
        <td>${customer.customer_id}</td>
        <td>${customer.customer_name}</td>
        <td>${displayValue(customer.thangthua)}</td>
        <td>${displayValue(customer.tongcuoc)}</td>
        <td>${displayValue(customer.laive)}</td>
        <td>${memberHtml}</td>
        <td>${percentageHtml}</td>
        <td>${totalAmountHtml}</td>
        <td class="view-buttons-cell">${viewButtonsHtml}</td>
        <td class="delete-buttons-cell">${deleteButtonsHtml}</td>
        <td class="function-buttons-cell">${plusButtonHtml}</td>
    `;
    
    return row;
}

function initializeRowInteractions() {
    // Machine row click to expand/collapse customers
    document.querySelectorAll('.machine-header-row').forEach(row => {
        row.addEventListener('click', function() {
            const machineId = this.dataset.machineId;
            const customerRows = document.querySelectorAll(`.customer-row[data-machine-id="${machineId}"]`);
            const expandIcon = this.querySelector('.expand-icon');
            
            customerRows.forEach(customerRow => {
                customerRow.classList.toggle('hidden');
            });
            
            // Toggle expand icon
            if (expandIcon.textContent === '▶') {
                expandIcon.textContent = '▼';
            } else {
                expandIcon.textContent = '▶';
            }
        });
    });
    
    // View button click
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const member = this.dataset.member;
            const percentage = this.dataset.percentage;
            const giaonhan = this.dataset.giaonhan;
            console.log(member, percentage, giaonhan);
            
            showDetailModal(member, percentage, giaonhan);
        });
    });
    




    // Delete button click
document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const customerId = this.dataset.customerId;
        const customerName = this.dataset.customerName;
        const machineName = this.dataset.machineName;
        const member = this.dataset.member;
        const percentage = this.dataset.percentage;
        const giaonhan = this.dataset.giaonhan;
        console.log(member);
        
        showDeleteModal(customerId, customerName, machineName, member, percentage, giaonhan);
    });
});


    
    // Add shareholder button click
    // document.querySelectorAll('.add-shareholder-btn').forEach(btn => {
    //     btn.addEventListener('click', function(e) {
    //         e.stopPropagation();
    //         const customerId = this.dataset.customerId;
    //         const customerName = this.dataset.customerName;
    //         const machineName = this.dataset.machineName;
    //         showAddShareholderModal(customerId, customerName, machineName);
    //     });
    // });
}


const update_btn= document.getElementById('update_codong');
update_btn.addEventListener('click', async function () {
    const update_btn =document.getElementById('update-btn');
    const customer = update_btn.getAttribute('data-customer-name');
    const oldphantram = update_btn.getAttribute('data-percentage');
    const oldgiaonhan = update_btn.getAttribute('data-giaonhan');
    const codong = document.getElementById('inputValue1').value;
    const machine =update_btn.getAttribute('data-machine');
    
    const new_phantram = document.getElementById('inputValue2').value;
    const new_giaonhan = document.getElementById('toggleSwitch').checked;
    const fromDate = document.getElementById('fromDate').value;
    const csrftoken = getCookie('csrftoken');
    
    console.log(machine, customer,codong, oldphantram, oldgiaonhan);
    console.log(codong,new_phantram, new_giaonhan);
    try{
        const response = await fetch(`/api-update-shareholder/`, {
            method: 'PUT',
            headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken, // if using Django CSRF protection
            },
            body: JSON.stringify({
                tenKhachHang: customer,
                codong: codong,
                machine:machine,
                oldphantram: oldphantram,
                oldgiaonhan: oldgiaonhan,
                new_phantram: new_phantram,
                new_giaonhan: new_giaonhan, 
                fromDate: fromDate
            })
        })

        if(!response.ok){
            console.log("error with URL");
        }
        else{
            showNotification("Cập nhật thành công", 'success');
            closeDetailModel();
            console.log("update thanh cong");
        }

    }catch(error){
        console.log(error);
    }

    
})



// New function to show add shareholder modal
function showAddShareholderModal(customerId, customerName, machineName, thangthua) {
    const modal = document.getElementById('investorAdditionModal');
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Update modal title to show which customer we're adding investor for
    const modalTitle = document.getElementById('investorAdditionTitle');
    if (modalTitle) {
        modalTitle.textContent = `Thêm Cổ Đông cho: ${customerName}`;
    }
    
    // Set the hidden fields with customer data
    document.getElementById('investorCustomerId').value = customerId;
    document.getElementById('investorCustomerName').value = customerName;
    document.getElementById('investorMachineName').value = machineName;
    document.getElementById('investorDeliveryModeToggle').checked=true;
    
    document.getElementById('thangthuaValue').value=thangthua;
    
    console.log(`Adding investor for customer: ${customerName} (ID: ${customerId}) on machine: ${machineName} with thangthua ${thangthua}`);
}

function initializeInvestorAdditionHandlers() {
    // Investor addition modal close handlers
    const investorModal = document.getElementById('investorAdditionModal');
    const closeInvestorModal = document.getElementById('closeInvestorAddition');
    const cancelInvestor = document.getElementById('cancelInvestorAddition');
    
    if (closeInvestorModal) {
        closeInvestorModal.addEventListener('click', function() {
            investorModal.style.display = 'none';
            restfromAddShareholder()
        });
    }
    
    if (cancelInvestor) {
        cancelInvestor.addEventListener('click', function() {
            investorModal.style.display = 'none';
            restfromAddShareholder();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === investorModal) {
            investorModal.style.display = 'none';
            restfromAddShareholder();
        }
    });
    
    // Create New Investor Toggle Handler
    const createNewToggle = document.getElementById('investorCreateNewToggle');
    const newSectionArea = document.getElementById('investorNewSectionArea');
    const investorSelect = document.getElementById('investorNameSelect');
    const investorNameInput = document.getElementById('investorNewNameInput');
    
    if (createNewToggle && newSectionArea && investorSelect && investorNameInput) {
        createNewToggle.addEventListener('change', function() {
            if (this.checked) {
                newSectionArea.style.display = 'block';
                investorSelect.style.display = 'none';
                investorNameInput.style.display = 'block';
            } else {
                newSectionArea.style.display = 'none';
                investorSelect.style.display = 'block';
                investorNameInput.style.display = 'none';
            }
        });
    }
    
    // View Book Toggle Handler
    const viewBookToggle = document.getElementById('investorViewBookToggle');
    const passwordArea = document.getElementById('investorPasswordArea');
    
    if (viewBookToggle && passwordArea) {
        viewBookToggle.addEventListener('change', function() {
            if (this.checked) {
                passwordArea.style.display = 'block';
            } else {
                passwordArea.style.display = 'none';
            }
        });
    }
    
    function restfromAddShareholder(){
        document.getElementById('investorPercentageValue').value='';
        document.getElementById('investorCreateNewToggle').checked=false;

        document.getElementById('investorNameSelect').style.display='block';

        document.getElementById('investorNewNameInput').style.display='None';
        document.getElementById('investorNewNameInput').value='';
        document.getElementById('investorDeliveryModeToggle').checked=true;

        const select_sh = document.getElementById('investorNameSelect');
        select_sh.selectedIndex=0;

        document.getElementById('investorNewSectionArea').style.display='None';


        



    }

    // Add submit handler for investor addition form
    const submitInvestorBtn = document.getElementById('submitInvestorAddition');
    if (submitInvestorBtn) {
        submitInvestorBtn.addEventListener('click', async function() {
            const customerId = document.getElementById('investorCustomerId').value;
            const customerName = document.getElementById('investorCustomerName').value;
            const machineName = document.getElementById('investorMachineName').value;
            const investorName = document.getElementById('investorNameSelect').value;
            const investorPercentage = document.getElementById('investorPercentageValue').value;
            const deliveryMode = document.getElementById('investorDeliveryModeToggle').checked;
            const createNew = document.getElementById('investorCreateNewToggle').checked;
            const newInvestorName = document.getElementById('investorNewNameInput').value;
            const viewBook = document.getElementById('investorViewBookToggle').checked;
            const password = document.getElementById('investorPasswordField').value;
            const fromDate = document.getElementById('fromDate').value;
            // const plus_button = document.getElementById('plusbtn');
            // const thangthua = plus_button.getAttribute('data-customer-thangthua');
            const thangthuavalue = document.getElementById('thangthuaValue').value;
            
            
            // Determine which investor name to use
            const finalInvestorName = createNew ? newInvestorName : investorName;
            
            // Add your logic to save the investor here
            console.log(`Adding investor: ${finalInvestorName} (${investorPercentage}%) for customer: ${customerName} on machine: ${machineName}`);
            console.log(`Giao Nhan: ${deliveryMode}`);
            console.log(`Delivery mode: ${deliveryMode ? 'Giao' : 'Nhận'}`);
            console.log(`Create new: ${createNew}`);
            console.log(`View book: ${viewBook}`);
            console.log(`Phan tram: ${investorPercentage}`);
            // console.log(`thang thua:${thangthua}`);
            console.log(`thang thua moi :${thangthuavalue}`);
            




            try{
                
                const response = await fetch(`/api-add-shareholderadmin/`,{
                 method: 'POST',
                    headers:{
                        'Content-Type': 'application/json',
                        'X-CSRFToken':getCSRFToken()

                    },
                    body: JSON.stringify({
                        
                        tenKhachHang: customerName,
                        machine:machineName,
                        thangthua:thangthuavalue,
                        codong: investorName,
                        phantram: investorPercentage,
                        giaonhan:deliveryMode,
                        isNewShareholder: createNew, // boolean
                        tencodong_moi: newInvestorName,
                        fromDate:fromDate,
                        password:viewBook? password:''
                    })
            });

            const data = await response.json();
            if(!response.ok){
                    console.error("API error:", data);
                
            }
            else{
                showNotification("Thêm cổ đông thành công", 'success');
                restfromAddShareholder();
            }

            }catch (error){
                console.error("Fetch error:", error);
            }
            
            // Close the modal after submission
            investorModal.style.display = 'none';
            
            // Optionally refresh the data or update the UI
             fetchStatisticsData();
        });
    }
}








function closeDetailModel(){
    const modal = document.getElementById('detailModal');
    modal.style.display = 'none'
}


function showDetailModal(member, percentage, giaonhan) {
    const modal = document.getElementById('detailModal');
    const memberInput = document.getElementById('inputValue1');
    const percentageInput = document.getElementById('inputValue2');
    const toggleSwitch = document.getElementById('toggleSwitch');
    
    if (memberInput) memberInput.value = member || '';
    
    // Format percentage for modal display (remove % symbol)
    if (percentageInput) {
        const formattedPercentage = formatPercentage(percentage);
        percentageInput.value = formattedPercentage || '';
    }
    
    // Set toggle based on giaonhan
    if (toggleSwitch) {
        // If giaonhan contains "Giao" or starts with " (Giao", toggle off (delivery)
        // If giaonhan contains "Nhận" or starts with " (Nhận", toggle on (receive)
        const isReceive = giaonhan && (giaonhan.includes('Nhận') || giaonhan.includes('nhan'));
        toggleSwitch.checked = isReceive;
        
        // Update toggle label
        updateToggleLabel(isReceive);
    }
    
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Add toggle change event
    if (toggleSwitch) {
        toggleSwitch.onchange = function() {
            updateToggleLabel(this.checked);
        };
    }
}

function updateToggleLabel(isReceive) {
    const toggleLabel = document.querySelector('.switch-label');
    if (toggleLabel) {
        toggleLabel.textContent = isReceive ? 'Nhận' : 'Giao';
    }
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


function showDeleteModal(customerId, customerName, machineName, member, percentage, giaonhan) {
    const modal = document.getElementById('deleteModal');
    const reportNameSpan = document.getElementById('reportName');
    
    if (reportNameSpan) {
        reportNameSpan.textContent = `${member} (Customer ID: ${customerId})`;
    }
    
    if (modal) {
        modal.style.display = 'block';
    }
    
    // Add confirm delete event
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async function() {
            // Add your delete logic here
            const deletebtn = document.getElementById('deletebtn');
            //const giaonhan = deletebtn.getAttribute('data-giaonhan');

            const fromDate = document.getElementById('fromDate').value;
            const csrftoken = getCookie('csrftoken');
            console.log(member);
            console.log(percentage);
            console.log(customerName);
            console.log(machineName);
            console.log(giaonhan);


            try{
            const response = await fetch(`/api-delete-shareholder/`,{
                method:"DELETE",
                headers:{
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json'

                }, 
                body:JSON.stringify({
                    machine: machineName,
                    tenKhachHang:customerName, 
                    phantram: percentage,
                    giaonhan: giaonhan,
                    codong: member,
                    fromDate:fromDate
                })
            })

            if(!response.ok){
                console.log("Error with send data for delete")
            }else{
                console.log("delete Thanh Cong");
                showNotification('Xóa cổ đông thành công', 'success');
                modal.style.display = 'none';
                fetchStatisticsData();
            }

        }catch{
            console.log("fetch api delete faild");

        }

        };
    }
}



// ==================== MODAL CLOSE HANDLERS ====================

function initializeModalHandlers() {
    // Detail modal close handlers
    const detailModal = document.getElementById('detailModal');
    const closeDetailModal = document.getElementById('close-modal');
    const huyDetailModal = document.getElementById('huyDetailModal');
    
    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', function() {
            detailModal.style.display = 'none';
        });
    }
    
    if (huyDetailModal) {
        huyDetailModal.addEventListener('click', function() {
            detailModal.style.display = 'none';
        });
    }
    
    // Delete modal close handlers
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModal = document.getElementById('xDeleteModel');
    const cancelDelete = document.getElementById('cancelDelete');
    
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }
    
    if (cancelDelete) {
        cancelDelete.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === detailModal) {
            detailModal.style.display = 'none';
        }
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });
}




const themkhachbtn = document.getElementById('addByHand');
themkhachbtn.addEventListener('click', function(){
    const modalThemKhach = document.getElementById('themkhachModal');
    modalThemKhach.style.display = 'block';

    // Scan button functionality
    const scanCustomerBtn = document.getElementById('scanCustomerBtn');
    const machineSelect = document.getElementById('machineSelect_themkhach');
    
    scanCustomerBtn.addEventListener('click', async function() {
        selectedMachine = machineSelect.options[machineSelect.selectedIndex].text; // Get the value, not text
        console.log(selectedMachine);
        
        if (!selectedMachine || selectedMachine === '') {
            alert('Vui lòng chọn máy trước khi quét');
            return;
        }

        scanCustomerBtn.disabled = true;
        scanCustomerBtn.textContent = 'Đang quét...';

        try {
            const response = await fetch('/api-get-customer/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    machine: selectedMachine
                })
            });

            const data = await response.json();
            
            if (data.success) {
                const customerSelect = document.getElementById('customerSelect');
                // Clear existing options except the first one
                customerSelect.innerHTML = '<option value="">Chọn Khách...</option>';
                
                // Add new customers from response
                data.customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.value || customer.id;
                    option.textContent = customer.name;
                    customerSelect.appendChild(option);
                });
                
                showNotification('Quét khách hàng thành công', 'success');
            } else {
                showNotification('Lỗi khi quét khách hàng: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Lỗi khi quét:', error);
            showNotification('Lỗi kết nối khi quét', 'error');
        } finally {
            scanCustomerBtn.disabled = false;
            scanCustomerBtn.textContent = 'Quét';
        }
    });

    // New customer checkbox functionality
    const newCustomerCheckbox = document.getElementById('newCustomerCheckbox');
    const newCustomerInput = document.getElementById('newCustomerInput');
    const existingCustomerSection = document.getElementById('existingCustomerSection');

    newCustomerCheckbox.addEventListener('change', function() {
        if (this.checked) {
            newCustomerInput.style.display = 'block';
            existingCustomerSection.style.display = 'none';
        } else {
            newCustomerInput.style.display = 'none';
            existingCustomerSection.style.display = 'block';
        }
    });

    // Add customer functionality
    const themKhachBtn = document.getElementById('themkhach');
    themKhachBtn.addEventListener('click', async function() {
        const machineSelect = document.getElementById('machineSelect_themkhach');
        const machineName = machineSelect.options[machineSelect.selectedIndex].text; // Keep text for display
        const fromDate = document.getElementById('fromDate').value;
        const thangthua = document.getElementById('thangthua_themtay').value;
        const tongcuoc = document.getElementById('tongcuoc').value;
        //const phantram = document.getElementById('phantram').value;
        const laive = document.getElementById('laive').value;

        let customerName;
        if (newCustomerCheckbox.checked) {
            customerName = document.getElementById('newCustomerName').value;
            if (!customerName) {
                showNotification('Vui lòng nhập tên khách mới', 'error');
                return;
            }
        } else {
            const customerSelect = document.getElementById('customerSelect');
            const selectedCustomerValue = customerSelect.value;
            if (!selectedCustomerValue || selectedCustomerValue === '') {
                showNotification('Vui lòng chọn khách hàng', 'error');
                return;
            }
            customerName = customerSelect.options[customerSelect.selectedIndex].text;
        }

        if (!machineName || machineName === 'Chọn Máy...') {
            showNotification('Vui lòng chọn máy', 'error');
            return;
        }

        try {
            const response = await fetch('/api-add-customer/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    tenmay: machineName,
                    tenKhachHang: customerName,
                    //phantram: phantram,
                    fromDate: fromDate,
                    tongcuoc: tongcuoc,
                    laive: laive,
                    is_new_customer: newCustomerCheckbox.checked,
                    thangthua: thangthua
                })
            });

            if (response.ok) {
                // Reset form
                machineSelect.selectedIndex = 0;
                document.getElementById('customerSelect').selectedIndex = 0;
                document.getElementById('newCustomerName').value = '';
                newCustomerCheckbox.checked = false;
                newCustomerInput.style.display = 'none';
                existingCustomerSection.style.display = 'block';
                document.getElementById('thangthua_themtay').value = '';
                document.getElementById('tongcuoc').value = '';
                //document.getElementById('phantram').value = '';
                document.getElementById('laive').value = '';
                
                showNotification('Thêm Khách Thành công', 'success');
                modalThemKhach.style.display = 'none';
                fetchStatisticsData();
                // window.location.reload();
            } else {
                showNotification('Lỗi khi thêm khách', 'error');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showNotification('Lỗi kết nối', 'error');
        }
    });

    // Close modal functionality
    const huyThemKhach = document.getElementById('huythemkhachModal');
    huyThemKhach.addEventListener('click', function() {
        modalThemKhach.style.display = 'none';
    });

    const closeThemKhach = document.getElementById('close-modalthemkhach');
    closeThemKhach.addEventListener('click', function() {
        modalThemKhach.style.display = 'none';
    });
});





// Helper function for notifications (make sure this exists)



// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    initializeDateEventListeners();
    initializeModalHandlers();
    initializeInvestorAdditionHandlers();
    updateDateInputs('today');
    
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', fetchStatisticsData);
    }
});









// Get modal elements
const newDayModal = document.getElementById('newDayModal');
const newDayBtn = document.getElementById('newdayCreateBtn');
const closeNewDayModal = document.getElementById('close-newday-modal');
const cancelNewDayBtn = document.getElementById('cancel-newday-btn');
const saveNewDayBtn = document.getElementById('save-newday-btn');
const newDayTableBody = document.getElementById('newDayTableBody');
const machineSelect = document.getElementById('machineSelect');
const scanCustomersBtn = document.getElementById('scanCustomersBtn');
const customerTableContainer = document.getElementById('customerTableContainer');
const scanStatus = document.getElementById('scanStatus');

// Customer list from API
let customerList = [];

// Function to get customers from backend
async function getCustomersByMachine(machineName) {
    try {
        showScanStatus('loading', 'Đang quét khách hàng...');
        
        const response = await fetch('/api-get-customer/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                machine: machineName
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        showScanStatus('success', `Đã tìm thấy ${data.customers.length} khách hàng`);
        
        return data.customers;
        
    } catch (error) {
        console.error('Error fetching customers:', error);
        showScanStatus('error', 'Lỗi khi quét khách hàng');
        return [];
    }
}

// Function to show scan status
function showScanStatus(type, message) {
    scanStatus.textContent = message;
    scanStatus.className = 'scan-status';
    scanStatus.classList.add(type);
    
    if (type === 'success') {
        setTimeout(() => {
            scanStatus.style.display = 'none';
        }, 3000);
    }
}

// Function to populate the table with customers
function populateNewDayTable(customers) {
    newDayTableBody.innerHTML = '';

    if (customers.length === 0) {
        newDayTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #6c757d;">
                    Không có khách hàng nào được tìm thấy
                </td>
            </tr>
        `;
        customerTableContainer.style.display = 'block';
        return;
    }

    customers.forEach((customer, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" 
                       class="newday-customer-name" 
                       value="${customer.name}" 
                       data-customer-value="${customer.id || customer.value}"
                       readonly>
            </td>
            <td>
                <input type="text" 
                       class="newday-input newday-thangthua" 
                       placeholder="Nhập thắng thua..."
                       inputmode="decimal"
                       data-customer="${customer.id || customer.value}">
            </td>
            <td>
                <input type="text" 
                       class="newday-input newday-tongcuoc" 
                       placeholder="Nhập tổng cược..."
                       inputmode="decimal"
                       data-customer="${customer.id || customer.value}">
            </td>
            <td>
                <input type="text" 
                       class="newday-input newday-laive" 
                       placeholder="Nhập lãi về..."
                       inputmode="decimal"
                       data-customer="${customer.id || customer.value}">
            </td>
        `;
        newDayTableBody.appendChild(row);
        
        // Add input validation
        const thangThuaInput = row.querySelector('.newday-thangthua');
        const tongCuocInput = row.querySelector('.newday-tongcuoc');
        const laiVeInput = row.querySelector('.newday-laive');
        
        [thangThuaInput, tongCuocInput, laiVeInput].forEach(input => {
            input.addEventListener('keydown', function(e) {
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.'];
                const isNumber = /^[0-9]$/.test(e.key);
                const isDecimal = e.key === '.' || e.key === ',';
                const isMinus = e.key === '-';
                
                if (isMinus && (input.selectionStart !== 0 || input.value.includes('-'))) {
                    e.preventDefault();
                    return;
                }
                
                if (!allowedKeys.includes(e.key) && !isNumber && !isDecimal && !isMinus) {
                    e.preventDefault();
                }
            });
        });
    });
    
    customerTableContainer.style.display = 'block';
}

// Scan button event listener
if (scanCustomersBtn) {
    scanCustomersBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const selectedMachine = machineSelect.value;
        
        if (!selectedMachine) {
            alert('Vui lòng chọn máy trước khi quét!');
            machineSelect.focus();
            return;
        }
        
        scanCustomersBtn.disabled = true;
        scanCustomersBtn.textContent = 'Đang quét...';
        
        try {
            customerList = await getCustomersByMachine(selectedMachine);
            populateNewDayTable(customerList);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            scanCustomersBtn.disabled = false;
            scanCustomersBtn.textContent = 'Quét Khách Hàng';
        }
    });
}

// Open modal
if (newDayBtn) {
    newDayBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // No need to populate machine select anymore - it's already populated by Django template
        newDayModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Reset table and selections
        customerTableContainer.style.display = 'none';
        newDayTableBody.innerHTML = '';
        machineSelect.value = ''; // Reset selection
        scanStatus.style.display = 'none';
    });
}

// Close modal functions
function closeNewDayModalFunc() {
    newDayModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    // Clear all input values
    const inputs = newDayTableBody.querySelectorAll('.newday-input');
    inputs.forEach(input => input.value = '');
    customerTableContainer.style.display = 'none';
}

if (closeNewDayModal) {
    closeNewDayModal.addEventListener('click', closeNewDayModalFunc);
}

if (cancelNewDayBtn) {
    cancelNewDayBtn.addEventListener('click', closeNewDayModalFunc);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === newDayModal) {
        closeNewDayModalFunc();
    }
});

// Save button functionality
// if (saveNewDayBtn) {
//     saveNewDayBtn.addEventListener('click', async function(e) {
//         e.preventDefault();
        

//         const selectedMachine = machineSelect.value;
//         if (!selectedMachine) {
//             alert('Vui lòng chọn máy trước khi lưu dữ liệu!');
//             machineSelect.focus();
//             return;
//         }
//         // Collect data from all rows
//         const rows = newDayTableBody.querySelectorAll('tr');
//         const customerData = [];
//         let hasEmptyFields = false;
        
//         rows.forEach(row => {
//             const customerNameInput = row.querySelector('.newday-customer-name');
//             const thangThuaInput = row.querySelector('.newday-thangthua');
//             const tongCuocInput = row.querySelector('.newday-tongcuoc');
//             const laiVeInput = row.querySelector('.newday-laive');
            
//             if (customerNameInput && thangThuaInput && tongCuocInput && laiVeInput) {
//                 const thangThua = thangThuaInput.value.trim();
//                 const tongCuoc = tongCuocInput.value.trim();
//                 const laiVe = laiVeInput.value.trim();
                
//                 // Only include rows where at least one field is filled
//                 if (thangThua !== '' || tongCuoc !== '' || laiVe !== '') {
//                     // Check if all fields are filled when at least one has data
//                     if (thangThua === '' || tongCuoc === '' || laiVe === '') {
//                         hasEmptyFields = true;
//                         // Highlight the empty fields
//                         if (thangThua === '') {
//                             thangThuaInput.style.borderColor = '#dc3545';
//                         }
//                         if (tongCuoc === '') {
//                             tongCuocInput.style.borderColor = '#dc3545';
//                         }
//                         if (laiVe === '') {
//                             laiVeInput.style.borderColor = '#dc3545';
//                         }
//                     } else {
//                         customerData.push({
//                             customer_name: customerNameInput.value,
//                             customer_value: customerNameInput.dataset.customerValue,
//                             thangthua: thangThua,
//                             tongcuoc: tongCuoc,
//                             laive: laiVe
//                         });
//                     }
//                 }
//             }
//         });
        
//         if (hasEmptyFields) {
//             alert('Vui lòng điền đầy đủ cả Thắng Thua, Tổng Cược và Lãi Về cho các khách hàng đã nhập ít nhất một trường!');
//             // Reset border color after 3 seconds
//             setTimeout(() => {
//                 const allInputs = newDayTableBody.querySelectorAll('.newday-input');
//                 allInputs.forEach(input => input.style.borderColor = '#dee2e6');
//             }, 3000);
//             return;
//         }
        
//         if (customerData.length === 0) {
//             alert('Vui lòng nhập dữ liệu cho ít nhất một khách hàng!');
//             return;
//         }
        
//         const fromDate = document.getElementById('fromDate').value;
        
//         // Prepare data to send
//         const dataToSend = {
//             machine: selectedMachine,
//             date: fromDate,
//             customers: customerData
//         };
        
//         console.log('Data to send:', dataToSend);
        
//         // Send data to backend
//         fetch('/api-create-new-day/', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCookie('csrftoken')
//             },
//             body: JSON.stringify(dataToSend)
//         })
//         .then(response => {
//             if (!response.ok) {
//                 return response.json().then(err => {
//                     throw new Error(err.message || 'Network response was not ok');
//                 });
//             }
//             return response.json();
//         })
//         .then(data => {
//             console.log('Success:', data);
//             // alert('Dữ liệu đã được lưu thành công!');
//             showNotification('Thêm dữ liệu thành công', 'success');
//             closeNewDayModalFunc();
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             alert('Có lỗi xảy ra khi lưu dữ liệu: ' + error.message);
//         });
//     });
// }

if (saveNewDayBtn) {
    saveNewDayBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        

        const selectedMachine = machineSelect.value;
        if (!selectedMachine) {
            alert('Vui lòng chọn máy trước khi lưu dữ liệu!');
            machineSelect.focus();
            return;
        }
        // Collect data from all rows
        const rows = newDayTableBody.querySelectorAll('tr');
        const customerData = [];
        let hasEmptyFields = false;
        
        rows.forEach(row => {
            const customerNameInput = row.querySelector('.newday-customer-name');
            const thangThuaInput = row.querySelector('.newday-thangthua');
            const tongCuocInput = row.querySelector('.newday-tongcuoc');
            const laiVeInput = row.querySelector('.newday-laive');
            
            if (customerNameInput && thangThuaInput && tongCuocInput && laiVeInput) {
                const thangThua = thangThuaInput.value.trim();
                const tongCuoc = tongCuocInput.value.trim();
                const laiVe = laiVeInput.value.trim();
                
                // Only include rows where at least one field is filled
                if (thangThua !== '' || tongCuoc !== '' || laiVe !== '') {
                    // Check only thangThua field is required
                    // tongCuoc and laiVe can be empty
                    if (thangThua === '') {
                        hasEmptyFields = true;
                        // Highlight only the required empty field
                        thangThuaInput.style.borderColor = '#dc3545';
                    } else {
                        customerData.push({
                            customer_name: customerNameInput.value,
                            customer_value: customerNameInput.dataset.customerValue,
                            thangthua: thangThua,
                            tongcuoc: tongCuoc,  // Can be empty string
                            laive: laiVe         // Can be empty string
                        });
                    }
                }
            }
        });
        
        if (hasEmptyFields) {
            alert('Vui lòng điền đầy đủ trường Thắng Thua cho các khách hàng đã nhập dữ liệu!');
            // Reset border color after 3 seconds
            setTimeout(() => {
                const allInputs = newDayTableBody.querySelectorAll('.newday-input');
                allInputs.forEach(input => input.style.borderColor = '#dee2e6');
            }, 3000);
            return;
        }
        
        if (customerData.length === 0) {
            alert('Vui lòng nhập dữ liệu cho ít nhất một khách hàng!');
            return;
        }
        
        const fromDate = document.getElementById('fromDate').value;
        
        // Prepare data to send
        const dataToSend = {
            machine: selectedMachine,
            date: fromDate,
            customers: customerData
        };
        
        console.log('Data to send:', dataToSend);
        
        // Send data to backend
        fetch('/api-create-new-day/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(dataToSend)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Network response was not ok');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            // alert('Dữ liệu đã được lưu thành công!');
            showNotification('Thêm dữ liệu thành công', 'success');
            closeNewDayModalFunc();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi lưu dữ liệu: ' + error.message);
        });
    });
}




// Helper function to get CSRF token from cookies
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Make sure modal is hidden on page load
    if (newDayModal) {
        newDayModal.style.display = 'none';
    }
    
    // Debug: Check if machine select is properly populated
    console.log('Machine select options:', machineSelect ? machineSelect.options.length : 'No machine select found');
});