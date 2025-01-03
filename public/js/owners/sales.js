document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // For inactive tabs
            tabs.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // For active tabs
            tab.classList.add('active');
            const targetContentId = `${tab.id.replace('-tab', '')}-content`;
            document.getElementById(targetContentId).classList.add('active');
        });
    });

    // Set default tab 
    document.getElementById('total-sales-tab').classList.add('active');
    document.getElementById('total-sales-container').classList.add('active');

    loadTotalSales();
    fetchSalesByProduct();
    renderTransactions();
});

// Load Total Sales Overview
async function loadTotalSales() {
    try {
        const response = await fetch('/owner/api/sales-overview');
        const salesData = await response.json();

        if (response.ok) {
            updateTotalSalesOverview(salesData);
        } else {
            alert('Error fetching total sales data');
        }
    } catch (error) {
        console.error('Error fetching total sales data:', error);
        alert('Error fetching total sales data');
    }
}

// Update the Total Sales Overview on the page
function updateTotalSalesOverview(data) {
    const totalSalesContainer = document.getElementById('total-sales-container');
    
    const dayData = data.day;
    const weekData = data.week;
    const monthData = data.month;
    const yearData = data.year;

    totalSalesContainer.innerHTML = `
        <h2>Total Sales Overview</h2>
        <div class="sales-metric">
            <h3>Today</h3>
            <p>Total Revenue: $${parseInt(dayData.total_revenue).toFixed(2)}</p>
            <p>Number of Sales: ${dayData.number_of_sales}</p>
        </div>
        <div class="sales-metric">
            <h3>This Week</h3>
            <p>Total Revenue: $${parseInt(weekData.total_revenue).toFixed(2)}</p>
            <p>Number of Sales: ${weekData.number_of_sales}</p>
        </div>
        <div class="sales-metric">
            <h3>This Month</h3>
            <p>Total Revenue: $${parseInt(monthData.total_revenue).toFixed(2)}</p>
            <p>Number of Sales: ${monthData.number_of_sales}</p>
        </div>
        <div class="sales-metric">
            <h3>This Year</h3>
            <p>Total Revenue: $${parseInt(yearData.total_revenue).toFixed(2)}</p>
            <p>Number of Sales: ${yearData.number_of_sales}</p>
        </div>
    `;
}

// Fetch and sales by product
async function fetchSalesByProduct() {
    try {
        const response = await fetch('/owner/api/sales-by-product');
        const data = await response.json();
        
        let tableRows = '';
        
        data.forEach(product => {
            tableRows += `
                <tr>
                    <td>${product.product_name}</td>
                    <td>${product.total_units_sold}</td>
                    <td>$${parseInt(product.total_revenue).toFixed(2)}</td>
                </tr>
            `;
        });
        
        document.querySelector('#salesByProductTable tbody').innerHTML = tableRows;
    } catch (error) {
        console.error('Error fetching sales by product:', error);
    }
}

// Fetch sales transactions 
async function fetchSalesTransactions() {
    try {
        const response = await fetch('/owner/api/sales-transactions');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching sales transactions:', error);
    }
}

// Render sales transactions
async function renderTransactions() {
    const transactions = await fetchSalesTransactions();
    const tableBody = document.querySelector('#salesTransactionsTable tbody');

    tableBody.innerHTML = '';

    let tableRows = '';
    transactions.forEach(transaction => {
        tableRows += `
            <tr>
                <td>${transaction.order_id}</td>
                <td>${new Date(transaction.sale_date).toLocaleString()}</td>
                <td>${transaction.product_name}</td>
                <td>${transaction.quantity}</td>
                <td>${parseInt(transaction.sale_price).toFixed(2)}</td>
                <td>${transaction.customer_name || 'N/A'}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableRows;
}
