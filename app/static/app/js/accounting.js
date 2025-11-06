
// Accounting page specific variables
let currentDate = new Date();
let selectedDate = null;
let activeInput = null;
let isScanned = false;

const vietnamTextCalenda = {
        months: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", 
             "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
    daysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
}

// Initialize accounting page when loaded
if (currentPage === 'accounting' || !currentPage) {
    initializeAccountingPage();
}

function initializeAccountingPage() {
    // Wait for DOM to be ready
    setTimeout(() => {
        initializeAccountingEventListeners();
        updateDateInputs('today');
    }, 100);
}

// Initialize accounting-specific event listeners
function initializeAccountingEventListeners() {
    // Date presets
    const datePresets = document.querySelectorAll('.date-preset');
    datePresets.forEach(preset => {
        preset.addEventListener('click', function() {
            datePresets.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const presetType = this.getAttribute('data-preset');
            updateDateInputs(presetType);
            
            // Reset scan state when changing dates
            isScanned = false;
            const tableContainer = document.getElementById('dataTableContainer');
            if (tableContainer) {
                tableContainer.style.display = 'none';
            }
        });
    });

    // Date inputs
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    
    if (fromDate) {
        fromDate.addEventListener('click', function() {
            activeInput = 'from';
            showCalendar();
        });
    }
    
    if (toDate) {
        toDate.addEventListener('click', function() {
            activeInput = 'to';
            showCalendar();
        });
    }

    // Calendar events
    const calendarModal = document.getElementById('calendarModal');
    const cancelDate = document.getElementById('cancelDate');
    const confirmDate = document.getElementById('confirmDate');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');

    if (cancelDate) cancelDate.addEventListener('click', hideCalendar);
    //if (confirmDate) confirmDate.addEventListener('click', confirmDateSelection);
    if (prevMonth) prevMonth.addEventListener('click', () => changeMonth(-1));
    if (nextMonth) nextMonth.addEventListener('click', () => changeMonth(1));

    // Close calendar when clicking outside
    if (calendarModal) {
        calendarModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideCalendar();
            }
        });
    }

    // Action buttons
    const scanBtn = document.getElementById('scanBtn');
    const reportBtn = document.getElementById('reportBtn');
    
    if (scanBtn) scanBtn.addEventListener('click', performScan);
    if (reportBtn) reportBtn.addEventListener('click', createReport);


    
}

// Update date inputs based on preset
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
            fromDate.setDate(today.getDate() - today.getDay()+1);
            toDate = new Date(today);
            break;
        case 'lastweek':
            fromDate = new Date(today);
            fromDate.setDate(today.getDate() - today.getDay() - 6);
            toDate = new Date(fromDate);
            toDate.setDate(fromDate.getDate() + 6);
            break;
        default:
            fromDate = new Date(today);
            toDate = new Date(today);
    }
    
    fromInput.value = formatDate(fromDate);
    toInput.value = formatDate(toDate);
}

// Format date for display
// function formatDate(date) {
//     const options = { year: 'numeric', month: 'short', day: 'numeric' };
//     return date.toLocaleDateString('en-US', options);
// }


function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Show calendar modal
function showCalendar() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.classList.add('show');
        generateCalendar();
    }
}

// Hide calendar modal
function hideCalendar() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.classList.remove('show');
    }
    selectedDate = null;
}

// Generate calendar grid
function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');
    
    if (!grid || !title) return;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    //title.textContent = `${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    title.textContent = `${vietnamTextCalenda.months[month]} ${year}` // chinh sua sang tieng viet tai day
    
    // Clear previous calendar
    grid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']; // chinh sua sang tieng viet tai day
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.color = '#666';
        dayHeader.style.padding = '10px';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.fontSize = '12px';
        grid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate calendar days
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = date.getDate();
        
        if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        if (date.toDateString() === new Date().toDateString()) {
            dayElement.style.background = '#e6f3ff';
            dayElement.style.fontWeight = 'bold';
        }
        
        // dayElement.addEventListener('click', function() {
        //     document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
        //     this.classList.add('selected');
        //     selectedDate = new Date(date);
        // });



        dayElement.addEventListener('click', function() {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    this.classList.add('selected');
    selectedDate = new Date(date);
    
    // Add these lines to immediately update the input and hide the modal:
    if (activeInput) {
        const input = document.getElementById(activeInput === 'from' ? 'fromDate' : 'toDate');
        if (input) {
            input.value = formatDate(selectedDate);
            
            // Reset scan state when changing dates
            isScanned = false;
            const tableContainer = document.getElementById('dataTableContainer');
            if (tableContainer) {
                tableContainer.style.display = 'none';
            }
        }
    }
    hideCalendar(); // Close the modal immediately after selection
});



        
        grid.appendChild(dayElement);
    }
}

// Change calendar month
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar();
}



async function loadStatisticData(fromDate, toDate){
    try {

        //const url = new URL(window.location.href);
        // if (fromDate && toDate){
        //     url.searchParams.append('from_date', fromDate);
        //     url.searchParams.append('to_date', toDate);
        // }
        console.log(fromDate, toDate);
        const response = await fetch(`/api-get-statistic?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`, 
        {
            headers:{
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });
        
        //add to fix generate fail data
        const tableBody = document.getElementById('statsTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        //add

        if(!response.ok){
                console.error('Server error:', response.status, response.statusText);
                const errorData = await response.text();
            console.error('Error details:', errorData);
            throw new Error(`Http error! status: ${response.status}` );
            

        }
        const data = await response.json();
        //console.log(data);
        if(data && data.length> 0){
            //console.log(data.data);
            return data
        }
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        throw error; 
    }
}





async function getSimplifiedStats(fromDate, toDate) {

  const fullData = await loadStatisticData(fromDate,toDate);
  
  return simplifyStatisticData(fullData);
}

// làm rõ vấn đề ở đây => vấn đề: cần custom lại data theo hai hàm này


// Perform scan operation



function performScan() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    // console.log(fromDate);
    // console.log(toDate);
    
    // if (!fromDate || !toDate) {
    //     showNotification('Please select date range', 'warning');
    //     return;
    // }
    
    // Show loading state
    const scanBtn = document.getElementById('scanBtn');
    const originalText = scanBtn.textContent;
    scanBtn.textContent = '🔄 Scanning...';
    scanBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Generate sample data
        // const sampleData = generateSampleData();
        // populateDataTable(sampleData);


        getSimplifiedStats(fromDate,toDate).then(data => {
            populateDataTable(data); 
  
            });

        
        // Show table
        const tableContainer = document.getElementById('dataTableContainer');
        if (tableContainer) {
            tableContainer.style.display = 'block';
        }
        
        isScanned = true;
        scanBtn.textContent = originalText;
        scanBtn.disabled = false;
        
    }, 1500);
}

// Create report
function createReport() {
    
}

function formatNumberString(str) {
  // Parse the string to a number to remove any trailing .00
  const num = parseFloat(str);
  
  // Format the number with commas as thousand separators and no decimal places
  return num.toLocaleString('en-US', {
    maximumFractionDigits: 0
  });
}




function showShareholderModal() {
    const modal = document.getElementById('shareholderModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function cleanFloatString(str) {  // convert 100.0 to 100, 20.0 to 20 for percentage
    const num = parseFloat(str);
    return Number.isInteger(num) ? num.toString() : num.toString();
}



function generateMultiRowPhanTram(phantram_list, giaonhan_list) {
    if (!Array.isArray(phantram_list) || !Array.isArray(giaonhan_list)) {
        console.error('Expected two arrays but received:', typeof phantram_list, typeof giaonhan_list);
        return '';
    }
    
    const maxLength = Math.max(phantram_list.length, giaonhan_list.length);
    
    return Array.from({ length: maxLength }, (_, index) => {
        const phantram = phantram_list[index];
        const giaonhan_value = giaonhan_list[index];
        
        // Process name
        let phantram_value = '';
        if (typeof phantram === 'string') {
            const phantram_parse = parseFloat(phantram);
            phantram_value = Number.isInteger(phantram_parse) ? Math.round(phantram_parse) : phantram_parse;
            //phantram_value = phantram;
        } else if (phantram && phantram.phantram !== undefined) {
            phantram_value = phantram.phantram;
        } else if (phantram === undefined || phantram === null) {
            phantram_value = ''; // Empty for missing name
        } else {
            console.warn('Invalid name structure:', phantram);
            phantram_value = '';
        }
        
        // Process role
        let roleValue = '';
        if (typeof giaonhan_value === 'string') {
            roleValue = giaonhan_value;
        } else if (giaonhan_value && giaonhan_value.phantram !== undefined) {
            roleValue = giaonhan_value.phantram;
        } else if (giaonhan_value === undefined || giaonhan_value === null) {
            roleValue = ''; // Empty for missing role
        } else {
            console.warn('Invalid role structure:', giaonhan_value);
            roleValue = '';
        }
        
        // Combine name and role with space
        const combinedText = [phantram_value, roleValue].filter(Boolean).join(' ');
        
        return `<div>${combinedText}</div>`;
    })
    .join('');
}
function generateMultiRowThanhVien(data) {
    if (!Array.isArray(data)) {
        console.error('Expected an array but received:', typeof data);
        return '';
    }
    
    return data
        .map(item => {
            // Handle string values directly
            if (typeof item === 'string') {
                return `<div>${item}</div>`;
            }
            // Handle original object format for backward compatibility
            else if (item && item.thanhvien !== undefined) {
                return `<div>${item.thanhvien}</div>`;
            }
            console.warn('Invalid item structure:', item);
            return '';
        })
        .join('');
}

function generateMultiRowThanhTien(data) {
    if (!Array.isArray(data)) {
        console.error('Expected an array but received:', typeof data);
        return '';
    }
    
    return data
        .map(item => {
            // Handle string numbers, object format, and direct number values
            let value;
            if (typeof item === 'string') {
                value = parseFloat(item);
            } else if (typeof item === 'object' && item !== null && item.thanhtien !== undefined) {
                value = parseFloat(item.thanhtien);
            } else if (typeof item === 'number') {
                value = item;
            } else {
                console.warn('Invalid item structure:', item);
                return '';
            }
            
            if (isNaN(value)) {
                console.warn('Invalid number value:', item);
                return '';
            }
            
            // Apply displayValue function logic
            if (value === null || value === undefined) return '';
            if (value === 0) return '0';
            
            const formattedValue = Number(value).toLocaleString('en-US', {maximumFractionDigits: 0});
            
            if (value < 0) {
                return `<div style="color: red;">${formattedValue}</div>`;
            } else {
                return `<div>${formattedValue}</div>`;
            }
        })
        .join('');
}




// map các biến được gửi từ django thành các biến để hiển thị lên giao diện
function simplifyStatisticData(fullData) {
    if(!fullData||!Array.isArray(fullData)){
        return [];
    }
  return fullData.map(item => ({
    id: item.customer_is,
    name: item.customer_name,
    thangthua: item.thangthua,
    tong: item.tongcuoc,
    laive: item.laive,
    thanhvien: item.codong,
    phantram: item.phantram,
    thanhtien: item.thanhtien, 
    giaonhan: item.giaonhan,

  }));
}


function showDetailModal(arrayvalue) {
     const modal = document.getElementById('detailModal');
     modal.style.display = 'block';
    console.log(modal);



    
    //console.log(arrayvalue[0].id);
    console.log(arrayvalue[0].thanhvien)
    console.log(arrayvalue[0].thanhvien);
    console.log(arrayvalue[0].giaonhan);
    console.log(arrayvalue[0].customerName);

    


    // Set modal title with value and index
    document.querySelector('.modal-header h2').textContent = "Sửa Cổ Đông";
    
    // You can pre-fill inputs or set data attributes here
    document.getElementById('inputValue1').value = arrayvalue[0].thanhvien;
    document.getElementById('inputValue2').value = parseFloat(arrayvalue[0].phantram);

    
    if(arrayvalue[0].giaonhan === "(Giao +)"){
        document.getElementById('toggleSwitch').checked = false; 
    }else if(arrayvalue[0].giaonhan === "(Nhận -)"){
        document.getElementById('toggleSwitch').checked = true; 

    }

    
    
    // Store current value for later use
    modal.setAttribute('data-current-codong', arrayvalue[0].thanhvien);
    modal.setAttribute('data-current-customer', arrayvalue[0].customerName);
    modal.setAttribute('data-current-phantram', arrayvalue[0].phantram);
    modal.setAttribute('data-current-giaonhan', arrayvalue[0].giaonhan);

    const closeModel = document.getElementById('close-modal')
    closeModel.addEventListener('click', function(){
        closeDetailModal();
    });
    const cancelModalDetail = document.getElementById('huyDetailModal');
        cancelModalDetail.addEventListener('click', function(){
        closeDetailModal();
    });

   

}



function closeDetailModal() {
        document.getElementById('detailModal').style.display = 'none';
}



const update_codong = document.getElementById('update_codong');
update_codong.addEventListener('click', async function(){
    const update_modal = document.getElementById('detailModal');

    const customer = update_modal.getAttribute('data-current-customer');
    const codong = update_modal.getAttribute('data-current-codong');
    const oldphantram = update_modal.getAttribute('data-current-phantram');
    const oldgiaonhan = update_modal.getAttribute('data-current-giaonhan');

    const new_phantram = document.getElementById('inputValue2').value;
    const new_giaonhan = document.getElementById('toggleSwitch').checked;
    const csrftoken = getCookie('csrftoken');

    const fromDate = document.getElementById('fromDate').value;

    console.log(" du lieu cu: ",codong, oldphantram,oldgiaonhan);
    console.log(" du lieu moi: ",codong, new_phantram,new_giaonhan);

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
                oldphantram: oldphantram,
                oldgiaonhan: oldgiaonhan,
                new_phantram: new_phantram,
                new_giaonhan: new_giaonhan, 
                fromDate: fromDate
            })
        })

        if(!response.ok){
            console.log("error with response");
        }else{
            console.log("update thanh cong");
            showNotification("Sửa cổ đông thành công", 'success');
            closeDetailModal();
        }

    }catch(error){
        console.log(error);
    }


})


function generateButtonDetail(phantramArray, giaonhanArray, thanhvienArray, customerName) { 
    // If phantram is not an array or is empty, return empty string
    if (!Array.isArray(phantramArray) || phantramArray.length === 0) {
        return '';
    }   
    if (!Array.isArray(giaonhanArray) || giaonhanArray.length === 0) {
        return '';
    }   
    
    if (!Array.isArray(thanhvienArray) || thanhvienArray.length === 0) {
        return '';
    }   

    let buttonsHTML = `<div class="vertical-buttons">`;
    //console.log(thanhvienArray.length);
    for(let i=0; i<thanhvienArray.length; i++){

            const detailValues = JSON.stringify([{
            //'id':value.id,
            'thanhvien':thanhvienArray[i],
            'phantram':phantramArray[i],
            'giaonhan':giaonhanArray[i],
            'customerName': customerName

        }]);
        const escapedDetailValues = detailValues.replace(/"/g, '&quot;');
        //console.log(escapedDetailValues)

        buttonsHTML += `<button class="detail-btn" style="background-color: #745cb8;" 
                                         onclick="showDetailModal(${escapedDetailValues})">xem</button>`;
    }
    
    buttonsHTML += `</div>`;
    
    return buttonsHTML;
}


function showModalComfirmDelete(arrayvalue){
    const modalDelete = document.getElementById('deleteModal');
    modalDelete.style.display = 'block';
    
    console.log(arrayvalue[0].tenKhachHang)
    console.log(arrayvalue[0].thanhvien)
    console.log(arrayvalue[0].giaonhan)
    console.log(arrayvalue[0].phantram)

    const buttonDelete = document.getElementById('confirmDelete');
    buttonDelete.addEventListener('click',async function(){
        const tenKhachHang = arrayvalue[0].tenKhachHang;
        const thanhvien = arrayvalue[0].thanhvien;
        const phantram = arrayvalue[0].phantram;
        const giaonhan = arrayvalue[0].giaonhan;
        const fromDate = document.getElementById('fromDate').value;
        const csrftoken = getCookie('csrftoken');

        console.log(tenKhachHang);
        console.log(thanhvien)
        console.log(fromDate);

        try{
            const response = await fetch(`/api-delete-shareholder/`,{
                method:"DELETE",
                headers:{
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json'

                }, 
                body:JSON.stringify({
                    tenKhachHang:tenKhachHang, 
                    phantram: phantram,
                    giaonhan: giaonhan,
                    codong: thanhvien,
                    fromDate:fromDate
                })
            })

            if(!response.ok){
                console.log("Error with send data for delete")
            }else{
                console.log("delete Thanh Cong");
                modalDelete.style.display = 'none';
            }

        }catch{
            console.log("fetch api delete faild");

        }
    })




    const closeDeleteModal = document.getElementById('cancelDelete');
    closeDeleteModal.addEventListener('click', function(){
        modalDelete.style.display = 'none';
    });
    const xDeleteModal = document.getElementById('xDeleteModel');
    xDeleteModal.addEventListener('click', function(){
        modalDelete.style.display = 'none';
    })

}



function generateButtonDelete(thanhvienArray, tenKhachHang, giaonhan, phantram) { 
    // If phantram is not an array or is empty, return empty string
    if (!Array.isArray(thanhvienArray) || thanhvienArray.length === 0) {
        return '';
    }
    
    let buttonsHTML = `<div class="vertical-buttons">`;
    
    for(let i=0; i<thanhvienArray.length; i++){

            const detailValues = JSON.stringify([{
            //'id':value.id,
            'tenKhachHang': tenKhachHang,
            'thanhvien':thanhvienArray[i],
            'giaonhan': giaonhan[i],
            'phantram': phantram[i]

        }]);
        const escapedDetailValues = detailValues.replace(/"/g, '&quot;');
        //console.log(escapedDetailValues)

       buttonsHTML += `<button class="detail-btn" style="background-color: red;" 
                                         onclick="showModalComfirmDelete(${escapedDetailValues})"><i class="fa fa-trash"></i></button>`;
    }
    
    buttonsHTML += `</div>`;
    
    return buttonsHTML;
}


// Populate data table with results
function populateDataTable(data) {
    // add
    const tableBody = document.getElementById('statsTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    //add
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let index= 1;

    data.forEach(row => {
        const tr = document.createElement('tr');


        //const displayValue = (value) => (value === null || value === undefined) ? '' : value;

            const displayValue = (value) => {
            if (value === null || value === undefined) return '';
            if (value === 0) return '0';
    
            if (value < 0) {
                return `<span style="color: red">${Number(value).toLocaleString('en-US', {maximumFractionDigits: 0})}</span>`;
                }
    
            return Number(value).toLocaleString('en-US', {maximumFractionDigits: 0});
};
        tr.innerHTML = `
            <td>${index}</td>
            <td>${row.name}</td>
            <td ${row.thangthua <0 ? 'style = "color:red;"':''}>${displayValue(row.thangthua)}</td>
            <td>${displayValue(row.tong)}</td>
            <td>${displayValue(row.laive)}</td>
            <td id="td-thanhvien">${generateMultiRowThanhVien(row.thanhvien)}</td>
            <td>${generateMultiRowPhanTram(row.phantram, row.giaonhan)}</td>
            <td>${generateMultiRowThanhTien(row.thanhtien)}</td>
            <td id="button-detail">${generateButtonDetail(row.phantram, row.giaonhan, row.thanhvien, row.name)}</td>
            <td id="button-delete">${generateButtonDelete(row.thanhvien, row.name, row.giaonhan, row.phantram)}</td>
            <td><button class="open-modal-btn" onclick="showShareholderModal()">+</button></td>

        `;
        index+=1;


        
        tbody.appendChild(tr);
    });
}



// them co dong

let id =null;
let tenKhachHang=null;
let tongcuoc = null;
let thangthua =null;
document.addEventListener('DOMContentLoaded', function(){
    
    document.getElementById("statsTable").addEventListener('click', function(e){

        if (e.target.classList.contains('open-modal-btn')){
            const row = e.target.closest('tr');
            const cells = row.querySelectorAll('td');
    
             id = cells[0].textContent;
             tenKhachHang = cells[1].textContent;
             thangthua = cells[2].textContent;
             tongcuoc = cells[3].textContent;
        }

    })
})




// Function to hide shareholder modal
function hideShareholderModal() {
    const modal = document.getElementById('shareholderModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto'; // Restore background scrolling
        
        // Reset form
        resetShareholderForm();
    }
}

// Function to reset form
function resetShareholderForm() {
    // Reset inputs
    document.getElementById('shareholderSelect').value = '';
    document.getElementById('percentageInput').value = '';
    //document.getElementById('newShareholderInput').value = 'Nguyen Van A';
    document.getElementById('passwordInput').value = '';
    
    // Reset toggles
    document.getElementById('createNewToggle').checked = false;
    document.getElementById('passwordToggle').checked = false;
    document.getElementById('toggleSwitch_1').checked = false;
    
    // Hide sections
    document.getElementById('newShareholderSection').style.display = 'none';
    document.getElementById('passwordSection').style.display = 'none';

    document.getElementById('shareholderInputSection').style.display='none';
    document.getElementById('shareholderSelection').style.display='block';


}

// Add event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Close modal events
    const closeBtn = document.getElementById('closeShareholderModal');
    const cancelBtn = document.getElementById('cancelShareholderBtn');
    const modal = document.getElementById('shareholderModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideShareholderModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideShareholderModal);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideShareholderModal();
            }
        });
    }
    
    // Create new shareholder toggle
    const createNewToggle = document.getElementById('createNewToggle');
    const newShareholderSection = document.getElementById('newShareholderSection');
    const shareholderSelection = document.getElementById('shareholderSelection');
    const newShareholderInput = document.getElementById('shareholderInputSection');
    
    if (createNewToggle && newShareholderSection) {
        createNewToggle.addEventListener('change', function() {
            if (this.checked) {
                shareholderSelection.style.display='none';
                newShareholderInput.style.display='block';
                newShareholderSection.style.display = 'block';
                newShareholderSection.classList.add('show');

            } else {
                newShareholderSection.style.display = 'none';
                newShareholderSection.classList.remove('show');
                shareholderSelection.style.display='block';
                newShareholderInput.style.display='none';
                // Reset password toggle when hiding
                document.getElementById('passwordToggle').checked = false;
                document.getElementById('passwordSection').style.display = 'none';
            }
        });
    }
    
    // Password toggle
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordSection = document.getElementById('passwordSection');
    
    if (passwordToggle && passwordSection) {
        passwordToggle.addEventListener('change', function() {
            if (this.checked) {
                passwordSection.style.display = 'block';
                passwordSection.classList.add('show');
            } else {
                passwordSection.style.display = 'none';
                passwordSection.classList.remove('show');
            }
        });
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
    // Add shareholder button
    const addBtn = document.getElementById('addShareholderBtn');
    if (addBtn) {
        addBtn.addEventListener('click', async function() {
            // Get form values
            //const shareholderSelect = document.getElementById('shareholderSelect');
            const percentage = document.getElementById('percentageInput').value;
            const createNew = document.getElementById('createNewToggle').checked;
            const userAuthenticated = document.getElementById('userAuthenticatedInput').value; //user that is authenticated no01, test1...
            const passwordRequired = document.getElementById('passwordToggle').checked;
            const password = document.getElementById('passwordInput').value;
            var agreed = document.getElementById('toggleSwitch_1').checked;
            const fromDate = document.getElementById('fromDate').value;
            const newShareholderName =document.getElementById('newShareholderNameInput').value;

            let shareholderName = ""
            if(createNew){
                
                shareholderName = document.getElementById('newShareholderNameInput').value;
                
                if(!shareholderName.trim()){
                    console.log("Vui lòng nhập tên cổ đông mới!");
                    return;
                }
                if(passwordRequired && !password){
                    console.log("vui lòng nhập mật khẩu");
                    return;
                }

                
            }else{
                const shareholderSelect = document.getElementById('shareholderSelect');
                shareholderName = shareholderSelect.options[shareholderSelect.selectedIndex].text;

                if (shareholderSelect.selectedIndex===0){
                    console.log("Vui lòng chọn cổ đông!");
                    return;
                }
            }
            
            
            // Basic validation
            if (!percentage) {
                //console.log(percentage);
                alert('Vui lòng nhập phần trăm!');
                return;
            }
            
            if (!createNew && !shareholderSelect) {
                alert('Vui lòng chọn cổ đông!');
                return;
            }
            // if(shareholderSelect){
            //     console(shareholderSelect);
            //     return
            // }
            
            if (createNew) {
                if (!newShareholderName.trim()) {
                    alert('Vui lòng nhập tên cổ đông mới!');
                    return;
                }
                
                if (passwordRequired && !password) {
                    alert('Vui lòng nhập mật khẩu!');
                    return;
                }
                
                // if (!agreed) {
                //     alert('Vui lòng đồng ý với các điều khoản!');
                //     return;
                // }

                
            }
            

            try {
                const response = await fetch(`/api-create-shareholder/`, {
                    method: 'POST',
                    headers:{
                        'Content-Type': 'application/json',
                        'X-CSRFToken':getCSRFToken()

                    }, 
                    body: JSON.stringify({
                        id: id,
                        tenKhachHang: tenKhachHang,
                        user:userAuthenticated,
                        tongcuoc: tongcuoc,
                        thangthua: thangthua,
                        codong: shareholderName,
                        codong_moi: newShareholderName,
                        phantram: percentage,
                        giaonhan:agreed,
                        isNewShareholder: createNew,
                        fromDate:fromDate,
                        password:passwordRequired? password:''
                    })
                });

                const data = await response.json();
                console.log(response);
                if(!response.ok){
                    console.error('Server error:', response.status, response.statusText);

                    
                    throw new Error(data.error || " Update khong thanh cong");
                    
                }
                else{
                    hideShareholderModal();
                    return;
                }
            }catch (error){
                console.log("error", error);
            }
            // Process the form (you can add your logic here)
            console.log(
                shareholderName,
                percentage,
                createNew,
                fromDate,
                passwordRequired,
                password,
                agreed, 
                id,
                tenKhachHang,
                thangthua,
                tongcuoc
            );
            
            // Show success message and hide modal
            //alert('Thêm cổ đông thành công!');
            hideShareholderModal();
        });
    }






    // Keyboard events
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('shareholderModal');
        if (modal && modal.classList.contains('show') && e.key === 'Escape') {
            hideShareholderModal();
        }
    });
});



function getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        
        return cookieValue || '';
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




// const update_codong = document.getElementById('update_codong');
// update_codong.addEventListener('click', function (){

    

// })


// có thể dùng về sau

// const themkhachbtn = document.getElementById('addByHand');
// themkhachbtn.addEventListener('click', function(){
//     const modalThemKhach = document.getElementById('themkhachModal');
//     modalThemKhach.style.display = 'block';

//     const themKhachBtn = document.getElementById('themkhach');
//     themKhachBtn.addEventListener('click', async function(){

//         const customerSelect = document.getElementById('customerSelect');
//         customerName = customerSelect.options[customerSelect.selectedIndex].text;

//         const shareholderThemSelect = document.getElementById('shareholderthemSelect');


//         shareholderThemName = shareholderThemSelect.options[shareholderThemSelect.selectedIndex].text;
//         const fromDate = document.getElementById('fromDate').value;
//         var thangthua = document.getElementById('thangthua').value;
//         var tongcuoc = document.getElementById('tongcuoc').value;
//         var laive = document.getElementById('laive').value;
        



        
//         console.log(customerName, shareholderThemName, thangthua);
//         try{

//             const response = await fetch(`/api-add-customer/`, {
//                 method: 'POST',
//                 headers:{
//                     'Content-Type': 'application/json',
//                     'X-CSRFToken':getCSRFToken()

//                 },
//                 body:JSON.stringify({
//                     tenKhachHang:customerName,
//                     codong:shareholderThemName,
//                     fromDate: fromDate,
//                     tongcuoc:tongcuoc,
//                     laive:laive,
//                     thangthua: thangthua
//                 })
//             });

//             if(!response.ok){
//                 console.log("Lỗi response")
//             }else{

//                 customerSelect.selectedIndex = 0; // Reset to first option
//                 shareholderThemSelect.selectedIndex = 0;
//                 thangthua.value='';
                
//                 modalThemKhach.style.display='none';
//                 window.location.reload();
//                 return;
//             }

//         }catch{
//             console.log("lỗi với api path");

//         }

//     })


//     const huyThemKhach = document.getElementById('huythemkhachModal');
//     huyThemKhach.addEventListener('click', function(){
//         modalThemKhach.style.display='none';
//     })

//     const closeThemKhach = document.getElementById('close-modalthemkhach');
//         closeThemKhach.addEventListener('click', function(){
//         modalThemKhach.style.display='none';
//     })
// })




const themkhachbtn = document.getElementById('addByHand');
    themkhachbtn.addEventListener('click', function(){
        const modalThemKhach = document.getElementById('themkhachModal');
        modalThemKhach.style.display = 'block';

        // Toggle new customer input based on checkbox
        const createNewCustomerCheckbox = document.getElementById('createNewCustomer');
        const newCustomerInputContainer = document.getElementById('newCustomerInputContainer');
        const customerSelect = document.getElementById('customerSelect');
        
        createNewCustomerCheckbox.addEventListener('change', function() {
            if (this.checked) {
                newCustomerInputContainer.style.display = 'block';
                customerSelect.disabled = true;
                customerSelect.selectedIndex = 0;
            } else {
                newCustomerInputContainer.style.display = 'none';
                customerSelect.disabled = false;
                document.getElementById('newCustomerName').value = '';
            }
        });

        const themKhachBtn = document.getElementById('themkhach');
        themKhachBtn.addEventListener('click', async function(){
            let customerName;
            const createNewCustomer = document.getElementById('createNewCustomer').checked;
            
            if (createNewCustomer) {
                // Get the new customer name from the input
                customerName = document.getElementById('newCustomerName').value.trim();
                if (!customerName) {
                    alert('Vui lòng nhập tên khách hàng mới');
                    return;
                }
            } else {
                // Get the customer from the select dropdown
                customerName = customerSelect.options[customerSelect.selectedIndex].text;
                if (!customerName || customerName === 'Chọn Khách...') {
                    alert('Vui lòng chọn khách hàng');
                    return;
                }
            }

            //const shareholderThemSelect = document.getElementById('shareholderthemSelect');
            //const shareholderThemName = shareholderThemSelect.options[shareholderThemSelect.selectedIndex].text;
            const fromDate = document.getElementById('fromDate').value;
            const thangthua = document.getElementById('thangthua').value;
            const tongcuoc = document.getElementById('tongcuoc').value;
            const laive = document.getElementById('laive').value;
            
            console.log('New Customer:', createNewCustomer);
            console.log('Customer Name:', customerName);
            //console.log('Shareholder:', shareholderThemName);
            console.log('Thang Thua:', thangthua);
            
            try {
                const response = await fetch(`/api-add-customer/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken()
                    },
                    body: JSON.stringify({
                        tenKhachHang: customerName,
                        //codong: shareholderThemName,
                        fromDate: fromDate,
                        tongcuoc: tongcuoc,
                        laive: laive,
                        thangthua: thangthua,
                        isNewCustomer: createNewCustomer
                    })
                });

                if(!response.ok) {
                    console.log("Lỗi response");
                }else{
                    // Reset form
                    customerSelect.selectedIndex = 0;
                    //shareholderThemSelect.selectedIndex = 0;
                    document.getElementById('thangthua').value = '';
                    document.getElementById('tongcuoc').value = '';
                    document.getElementById('laive').value = '';
                    document.getElementById('createNewCustomer').checked = false;
                    document.getElementById('newCustomerName').value = '';
                    newCustomerInputContainer.style.display = 'none';
                    customerSelect.disabled = false;
                    
                    modalThemKhach.style.display = 'none';
                    showNotification('Thêm Khách Thành Công', 'success');
                    // window.location.reload();
                    performScan();

                    return;
                }
            } catch(error) {
                console.log("Lỗi với api path:", error);
            }
        });

        const huyThemKhach = document.getElementById('huythemkhachModal');
        huyThemKhach.addEventListener('click', function(){
            modalThemKhach.style.display = 'none';
        });

        const closeThemKhach = document.getElementById('close-modalthemkhach');
        closeThemKhach.addEventListener('click', function(){
            modalThemKhach.style.display = 'none';
        });
    });





// tạo ngày mới handler



/// ==================== NEW DAY MODAL FUNCTIONALITY ====================

// Helper function to format number with commas
// function formatNumberWithCommas(value) {
//     // Check if number is negative
//     let isNegative = value.startsWith('-');
    
//     // Remove all non-digit and non-comma characters except minus at start
//     let cleaned = value.replace(/[^\d,]/g, '');
    
//     // Split by comma to handle decimal part
//     let parts = cleaned.split(',');
    
//     // Format the integer part with thousand separators
//     if (parts[0]) {
//         parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
//     }
    
//     // Limit to only one comma and rejoin
//     let formatted = parts.length > 2 ? parts[0] + ',' + parts.slice(1).join('') : parts.join(',');
    
//     // Add minus sign back if it was negative
//     return isNegative ? '-' + formatted : formatted;
// }

// // Helper function to parse formatted number to decimal
// function parseFormattedNumber(value) {
//     // Remove thousand separators (dots) and replace comma with dot for decimal
//     return value.replace(/\./g, '').replace(',', '.');
// }

// // Function to validate and format input
// function handleNumberInput(input) {
//     let cursorPosition = input.selectionStart;
//     let oldValue = input.value;
//     let oldLength = oldValue.length;
    
//     // Format the value
//     let formattedValue = formatNumberWithCommas(input.value);
//     input.value = formattedValue;
    
//     // Adjust cursor position after formatting
//     let newLength = formattedValue.length;
//     let lengthDiff = newLength - oldLength;
//     input.setSelectionRange(cursorPosition + lengthDiff, cursorPosition + lengthDiff);
// }

// // Get modal elements
// const newDayModal = document.getElementById('newDayModal');
// const newDayBtn = document.getElementById('newdayCreateBtn');
// const closeNewDayModal = document.getElementById('close-newday-modal');
// const cancelNewDayBtn = document.getElementById('cancel-newday-btn');
// const saveNewDayBtn = document.getElementById('save-newday-btn');
// const newDayTableBody = document.getElementById('newDayTableBody');

// // Customer list from Django template context
// let customerList = [];

// // Function to get customer list from the page
// function getCustomerList() {
//     // Parse customer list from the select element in themkhachModal
//     const customerSelect = document.getElementById('customerSelect');
//     if (customerSelect) {
//         customerList = Array.from(customerSelect.options)
//             .filter(option => option.value !== '')
//             .map(option => ({
//                 name: option.textContent.trim(),
//                 value: option.value
//             }));
//     }
//     return customerList;
// }

// // Function to populate the table with customers
// function populateNewDayTable() {
//     const customers = getCustomerList();
//     newDayTableBody.innerHTML = ''; // Clear existing rows

//     if (customers.length === 0) {
//         newDayTableBody.innerHTML = `
//             <tr>
//                 <td colspan="3" style="text-align: center; padding: 20px; color: #6c757d;">
//                     Không có khách hàng nào được tìm thấy
//                 </td>
//             </tr>
//         `;
//         return;
//     }

//     customers.forEach((customer, index) => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//             <td>
//                 <input type="text" 
//                        class="newday-customer-name" 
//                        value="${customer.name}" 
//                        data-customer-value="${customer.value}"
//                        readonly>
//             </td>
//             <td>
//                 <input type="text" 
//                        class="newday-input newday-thangthua" 
//                        placeholder="Nhập thắng thua..."
//                        inputmode="decimal"
//                        data-customer="${customer.value}">
//             </td>
//             <td>
//                 <input type="text" 
//                        class="newday-input newday-tongcuoc" 
//                        placeholder="Nhập tổng cược..."
//                        inputmode="decimal"
//                        data-customer="${customer.value}">
//             </td>
//         `;
//         newDayTableBody.appendChild(row);
        
//         // Add event listeners for number formatting
//         const thangThuaInput = row.querySelector('.newday-thangthua');
//         const tongCuocInput = row.querySelector('.newday-tongcuoc');
        
//         thangThuaInput.addEventListener('input', function(e) {
//             handleNumberInput(e.target);
//         });
        
//         tongCuocInput.addEventListener('input', function(e) {
//             handleNumberInput(e.target);
//         });
        
//         // Prevent non-numeric keys except comma, backspace, delete, arrow keys
//         [thangThuaInput, tongCuocInput].forEach(input => {
//             input.addEventListener('keydown', function(e) {
//                 const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
//                 const isNumber = /^[0-9]$/.test(e.key);
//                 const isComma = e.key === ',';
//                 const isMinus = e.key === '-';
                
//                 // Allow minus only at the beginning
//                 if (isMinus && (input.selectionStart !== 0 || input.value.includes('-'))) {
//                     e.preventDefault();
//                     return;
//                 }
                
//                 if (!allowedKeys.includes(e.key) && !isNumber && !isComma && !isMinus) {
//                     e.preventDefault();
//                 }
                
//                 // Prevent multiple commas
//                 if (isComma && input.value.includes(',')) {
//                     e.preventDefault();
//                 }
//             });
            
//             // Prevent paste of non-numeric content
//             input.addEventListener('paste', function(e) {
//                 e.preventDefault();
//                 const pastedText = (e.clipboardData || window.clipboardData).getData('text');
//                 const cleanedText = pastedText.replace(/[^\d,-]/g, '');
//                 document.execCommand('insertText', false, cleanedText);
//             });
//         });
//     });
// }

// // Open modal
// if (newDayBtn) {
//     newDayBtn.addEventListener('click', function(e) {
//         e.preventDefault();
//         populateNewDayTable();
//         newDayModal.style.display = 'block';
//         document.body.style.overflow = 'hidden'; // Prevent background scrolling
//     });
// }

// // Close modal functions
// function closeNewDayModalFunc() {
//     newDayModal.style.display = 'none';
//     document.body.style.overflow = 'auto'; // Restore scrolling
//     // Clear all input values
//     const inputs = newDayTableBody.querySelectorAll('.newday-input');
//     inputs.forEach(input => input.value = '');
// }

// if (closeNewDayModal) {
//     closeNewDayModal.addEventListener('click', closeNewDayModalFunc);
// }

// if (cancelNewDayBtn) {
//     cancelNewDayBtn.addEventListener('click', closeNewDayModalFunc);
// }

// // Close modal when clicking outside
// window.addEventListener('click', function(event) {
//     if (event.target === newDayModal) {
//         closeNewDayModalFunc();
//     }
// });

// // Save button functionality
// if (saveNewDayBtn) {
//     saveNewDayBtn.addEventListener('click',  async function(e) {
//         e.preventDefault();
        
//         // Collect data from all rows
//         const rows = newDayTableBody.querySelectorAll('tr');
//         const customerData = [];
//         let hasEmptyFields = false;
        
//         rows.forEach(row => {
//             const customerNameInput = row.querySelector('.newday-customer-name');
//             const thangThuaInput = row.querySelector('.newday-thangthua');
//             const tongCuocInput = row.querySelector('.newday-tongcuoc');
            
//             if (customerNameInput && thangThuaInput && tongCuocInput) {
//                 const thangThua = thangThuaInput.value.trim();
//                 const tongCuoc = tongCuocInput.value.trim();
                
//                 // Only include rows where at least one field is filled
//                 if (thangThua !== '' || tongCuoc !== '') {
//                     // Check if both fields are filled
//                     if (thangThua === '' || tongCuoc === '') {
//                         hasEmptyFields = true;
//                         // Highlight the empty field
//                         if (thangThua === '') {
//                             thangThuaInput.style.borderColor = '#dc3545';
//                         }
//                         if (tongCuoc === '') {
//                             tongCuocInput.style.borderColor = '#dc3545';
//                         }
//                     } else {
//                         customerData.push({
//                             customer_name: customerNameInput.value,
//                             customer_value: customerNameInput.dataset.customerValue,
//                             thangthua: parseFloat(parseFormattedNumber(thangThua)),
//                             tongcuoc: parseFloat(parseFormattedNumber(tongCuoc))
//                         });
//                     }
//                 }
//             }
//         });
        
//         if (hasEmptyFields) {
//             alert('Vui lòng điền đầy đủ cả Thắng Thua và Tổng Cược cho các khách hàng đã nhập một trong hai trường!');
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
        
//         // Get current date
//         const today = new Date();
//         const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
//         const fromDate = document.getElementById('fromDate').value;
        
//         // Prepare data to send
//         const dataToSend = {
//             //date: formattedDate,
//             date: fromDate,
//             customers: customerData
//         };
        
//         console.log('Data to send:', dataToSend);
        
//         // Send data to backend


//         fetch('/api-create-new-day/', {  // Update this URL to match your Django URL pattern
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCookie('csrftoken') // Get CSRF token
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
//             alert('Dữ liệu đã được lưu thành công!');
//             closeNewDayModalFunc();
//             // Optionally refresh the data table or page
//             // location.reload(); // Uncomment if you want to reload the page
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             alert('Có lỗi xảy ra khi lưu dữ liệu: ' + error.message);
//         });
//     });
// }

// // Helper function to get CSRF token from cookies
// function getCookie(name) {
//     let cookieValue = null;
//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }

// // Initialize on page load - only prepare customer list, don't show modal
// document.addEventListener('DOMContentLoaded', function() {
//     getCustomerList();
//     // Make sure modal is hidden on page load
//     if (newDayModal) {
//         newDayModal.style.display = 'none';
//     }
// });






/// ==================== NEW DAY MODAL FUNCTIONALITY ====================

//// ==================== NEW DAY MODAL FUNCTIONALITY ====================

// Get modal elements
const newDayModal = document.getElementById('newDayModal');
const newDayBtn = document.getElementById('newdayCreateBtn');
const closeNewDayModal = document.getElementById('close-newday-modal');
const cancelNewDayBtn = document.getElementById('cancel-newday-btn');
const saveNewDayBtn = document.getElementById('save-newday-btn');
const newDayTableBody = document.getElementById('newDayTableBody');

// Customer list from Django template context
let customerList = [];

// Function to get customer list from the page
function getCustomerList() {
    // Parse customer list from the select element in themkhachModal
    const customerSelect = document.getElementById('customerSelect');
    if (customerSelect) {
        customerList = Array.from(customerSelect.options)
            .filter(option => option.value !== '')
            .map(option => ({
                name: option.textContent.trim(),
                value: option.value
            }));
    }
    return customerList;
}

// Function to populate the table with customers
function populateNewDayTable() {
    const customers = getCustomerList();
    newDayTableBody.innerHTML = ''; // Clear existing rows

    if (customers.length === 0) {
        newDayTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #6c757d;">
                    Không có khách hàng nào được tìm thấy
                </td>
            </tr>
        `;
        return;
    }

    customers.forEach((customer, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" 
                       class="newday-customer-name" 
                       value="${customer.name}" 
                       data-customer-value="${customer.value}"
                       readonly>
            </td>
            <td>
                <input type="text" 
                       class="newday-input newday-thangthua" 
                       placeholder="Nhập thắng thua..."
                       inputmode="decimal"
                       data-customer="${customer.value}">
            </td>
            <td>
                <input type="text" 
                       class="newday-input newday-tongcuoc" 
                       placeholder="Nhập tổng cược..."
                       inputmode="decimal"
                       data-customer="${customer.value}">
            </td>
            <td>
                <input type="text" 
                       class="newday-input newday-laive" 
                       placeholder="Nhập lãi về..."
                       inputmode="decimal"
                       data-customer="${customer.value}">
            </td>
        `;
        newDayTableBody.appendChild(row);
        
        // Add event listeners for input validation
        const thangThuaInput = row.querySelector('.newday-thangthua');
        const tongCuocInput = row.querySelector('.newday-tongcuoc');
        const laiVeInput = row.querySelector('.newday-laive');
        
        // Only allow numbers, comma, minus sign, and decimal point
        [thangThuaInput, tongCuocInput, laiVeInput].forEach(input => {
            input.addEventListener('keydown', function(e) {
                const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.'];
                const isNumber = /^[0-9]$/.test(e.key);
                const isDecimal = e.key === '.' || e.key === ',';
                const isMinus = e.key === '-';
                
                // Allow minus only at the beginning
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
}

// Open modal
if (newDayBtn) {
    newDayBtn.addEventListener('click', function(e) {
        e.preventDefault();
        populateNewDayTable();
        newDayModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });
}

// Close modal functions
function closeNewDayModalFunc() {
    newDayModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
    // Clear all input values
    const inputs = newDayTableBody.querySelectorAll('.newday-input');
    inputs.forEach(input => input.value = '');
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
//     saveNewDayBtn.addEventListener('click',  async function(e) {
//         e.preventDefault();
        
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
//                             thangthua: thangThua, // Keep as-is, no conversion
//                             tongcuoc: tongCuoc,   // Keep as-is, no conversion
//                             laive: laiVe          // Keep as-is, no conversion
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
        
//         // Get current date
//         const today = new Date();
//         const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
//         const fromDate = document.getElementById('fromDate').value;
        
//         // Prepare data to send
//         const dataToSend = {
//             //date: formattedDate,
//             date: fromDate,
//             customers: customerData
//         };
        
//         console.log('Data to send:', dataToSend);
        
//         // Send data to backend
//         fetch('/api-create-new-day/', {  // Update this URL to match your Django URL pattern
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': getCookie('csrftoken') // Get CSRF token
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
//             showNotification("Thêm dữ liệu thành công", 'success');
//             closeNewDayModalFunc();
//             // Optionally refresh the data table or page
//             // location.reload(); // Uncomment if you want to reload the page
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             alert('Có lỗi xảy ra khi lưu dữ liệu: ' + error.message);
//         });
//     });
// }


if (saveNewDayBtn) {
    saveNewDayBtn.addEventListener('click',  async function(e) {
        e.preventDefault();
        
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
                    // Check if thangThua field is filled (required)
                    // tongCuoc and laiVe can be empty
                    if (thangThua === '') {
                        hasEmptyFields = true;
                        // Highlight only the required empty field
                        thangThuaInput.style.borderColor = '#dc3545';
                    } else {
                        customerData.push({
                            customer_name: customerNameInput.value,
                            customer_value: customerNameInput.dataset.customerValue,
                            thangthua: thangThua, // Keep as-is, no conversion
                            tongcuoc: tongCuoc,   // Can be empty
                            laive: laiVe          // Can be empty
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
        
        // Get current date
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const fromDate = document.getElementById('fromDate').value;
        
        // Prepare data to send
        const dataToSend = {
            //date: formattedDate,
            date: fromDate,
            customers: customerData
        };
        
        console.log('Data to send:', dataToSend);
        
        // Send data to backend
        fetch('/api-create-new-day/', {  // Update this URL to match your Django URL pattern
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') // Get CSRF token
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
            showNotification("Thêm dữ liệu thành công", 'success');
            closeNewDayModalFunc();
            // Optionally refresh the data table or page
            // location.reload(); // Uncomment if you want to reload the page
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

// Initialize on page load - only prepare customer list, don't show modal
document.addEventListener('DOMContentLoaded', function() {
    getCustomerList();
    // Make sure modal is hidden on page load
    if (newDayModal) {
        newDayModal.style.display = 'none';
    }
});