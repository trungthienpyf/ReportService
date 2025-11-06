// Global variables
let currentPage = 'accounting';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeBaseEventListeners();
    //loadPage('accounting'); // Default page
});

// Initialize base event listeners
function initializeBaseEventListeners() {
    // Sidebar toggle
    const toggleBtn = document.getElementById('toggleBtn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarClose = document.getElementById('sidebarClose');
    
    toggleBtn.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            // Mobile: show/hide sidebar
            sidebar.classList.toggle('show');
            document.getElementById('mobileOverlay').classList.toggle('show');
        } else {
            // Desktop: collapse/expand sidebar
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    });

    // Sidebar close button (mobile only)
    sidebarClose.addEventListener('click', function() {
        sidebar.classList.remove('show');
        document.getElementById('mobileOverlay').classList.remove('show');
    });

    // Mobile overlay click
    const mobileOverlay = document.getElementById('mobileOverlay');
    mobileOverlay.addEventListener('click', function() {
        sidebar.classList.remove('show');
        this.classList.remove('show');
    });

    // User dropdown
    const username = document.getElementById('username');
    const userDropdown = document.getElementById('userDropdown');
    
    username.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        userDropdown.classList.remove('show');
    });

    // Close sidebar when clicking on menu items (mobile only)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Close sidebar on mobile after selecting menu item
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
                document.getElementById('mobileOverlay').classList.remove('show');
            }
        });
    });

    //Sub navigation tabs
    const subNavItems = document.querySelectorAll('.sub-nav-item');
    subNavItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            if (page !== currentPage) {
                subNavItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                loadPage(page);
            }
        });
    });

    // Window resize handler
    window.addEventListener('resize', function() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (window.innerWidth > 768) {
            // Desktop: remove mobile classes and restore desktop state
            sidebar.classList.remove('show');
            document.getElementById('mobileOverlay').classList.remove('show');
            
            // Maintain collapsed state if it was collapsed before
            if (sidebar.classList.contains('collapsed')) {
                mainContent.classList.add('expanded');
            } else {
                mainContent.classList.remove('expanded');
            }
        } else {
            // Mobile: ensure sidebar is hidden and remove expanded state
            sidebar.classList.remove('show');
            document.getElementById('mobileOverlay').classList.remove('show');
            mainContent.classList.remove('expanded');
        }
    });



    const navItems = document.querySelectorAll('.sub-nav-item');
    
    // Add click event listeners to each item
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });

}

// Load page content dynamically
// async function loadPage(pageName) {
//     try {
//         // Update current page
//         currentPage = pageName;
        
//         // Update active tab
//         const subNavItems = document.querySelectorAll('.sub-nav-item');
//         subNavItems.forEach(item => {
//             if (item.getAttribute('data-page') === pageName) {
//                 item.classList.add('active');
//             } else {
//                 item.classList.remove('active');
//             }
//         });

//         // Load HTML content
//         const response = await fetch(`${pageName}.html`);
//         const html = await response.text();
//         document.getElementById('pageContent').innerHTML = html;

//         // Update CSS
//         const pageCss = document.getElementById('page-css');
//         pageCss.href = `${pageName}.css`;

//         // Load and execute page-specific JavaScript
//         const pageJs = document.getElementById('page-js');
//         if (pageJs.src) {
//             // Remove existing script
//             pageJs.remove();
//             const newScript = document.createElement('script');
//             newScript.id = 'page-js';
//             newScript.src = `${pageName}.js`;
//             document.body.appendChild(newScript);
//         } else {
//             pageJs.src = `${pageName}.js`;
//         }

//     } catch (error) {
//         console.error('Error loading page:', error);
//         document.getElementById('pageContent').innerHTML = `
//             <div style="text-align: center; padding: 50px; color: #999;">
//                 <h3>Error loading page</h3>
//                 <p>Could not load ${pageName} page content.</p>
//             </div>
//         `;
//     }
// }

// Utility functions that might be needed across pages
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = '#48bb78';
            break;
        case 'error':
            notification.style.background = '#f56565';
            break;
        case 'warning':
            notification.style.background = '#ed8936';
            break;
        default:
            notification.style.background = '#667eea';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Add animation keyframes if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function confirmAction(message, callback) {
    const isConfirmed = confirm(message);
    if (isConfirmed && typeof callback === 'function') {
        callback();
    }
    return isConfirmed;
}