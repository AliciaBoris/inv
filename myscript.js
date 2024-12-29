
let totalProfit = 0;
let totalInventoryCost = 0;
let totalQuantity = 0;
let currentPage = 1;
const rowsPerPage = 10;

function paginateTable() {
    const rows = document.querySelectorAll('#itemTableBody tr');
    const totalPages = Math.ceil(rows.length / itemsPerPage);

    rows.forEach((row, index) => {
        row.style.display = index >= (currentPage - 1) * itemsPerPage && index < currentPage * itemsPerPage ? '' : 'none';
    });

    document.getElementById('pagination').innerHTML = `
        <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;
}

function changePage(direction) {
    currentPage += direction;
    paginateTable();
}


// Generate Barcodes as Images
function generateBarcode(barcodeValue) {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, barcodeValue, { format: "CODE128", displayValue: false });
    return canvas.toDataURL();
}


function addItem() {
    const itemName = document.getElementById('itemName').value;
    const itemCostPrice = parseFloat(document.getElementById('itemCostPrice').value);
    const itemSellingPrice = parseFloat(document.getElementById('itemSellingPrice').value);
    const itemQuantity = parseInt(document.getElementById('itemQuantity').value);

    if (!itemName || isNaN(itemCostPrice) || isNaN(itemSellingPrice) || isNaN(itemQuantity)) {
        alert('Please fill out all fields.');
        return;
    }

    const currentDateTime = new Date().toLocaleString();
    const barcode = Date.now().toString(); // Unique barcode
    const barcodeImage = generateBarcode(barcode);

    totalQuantity += itemQuantity;
    totalInventoryCost += itemCostPrice * itemQuantity;

    const table = document.getElementById('itemTableBody');
    const row = document.createElement('tr');
    row.dataset.barcode = barcode;

    row.innerHTML = `
        <td>${itemName}</td>
        <td>${currentDateTime}</td>
        <td>₦${itemCostPrice.toFixed(2)}</td>
        <td>₦${itemSellingPrice.toFixed(2)}</td>
        <td>${itemQuantity}</td>
        <td>₦0.00</td>
        <td>
            <div>
                <img src="${barcodeImage}" alt="Barcode" />
                <p>${itemName}</p>
            </div>
        </td>
        <td>
            <button onclick="sellItem(this)">Sell</button>
            <button onclick="updateItem(this)">Update</button>
            <button onclick="deleteItem(this)">Delete</button>
        </td>
    `;

    table.appendChild(row);
    updateSummary();
    paginateTable();
    clearForm();
}

function sellItem(button) {
    const row = button.closest('tr');
    const quantityCell = row.cells[4];
    const profitCell = row.cells[5];
    const costPrice = parseFloat(row.cells[2].textContent.replace('₦', ''));
    const sellingPrice = parseFloat(row.cells[3].textContent.replace('₦', ''));
    const quantity = parseInt(quantityCell.textContent);

    const quantityToSell = parseInt(prompt('Enter the number of items to sell:', '1'));

    if (isNaN(quantityToSell) || quantityToSell <= 0 || quantityToSell > quantity) {
        alert('Invalid quantity entered.');
        return;
    }

    const profit = (sellingPrice - costPrice) * quantityToSell;

    quantityCell.textContent = quantity - quantityToSell;
    profitCell.textContent = `₦${(parseFloat(profitCell.textContent.replace('₦', '')) + profit).toFixed(2)}`;
    totalQuantity -= quantityToSell;
    totalProfit += profit;
    totalInventoryCost -= costPrice * quantityToSell;

    // Generate Sales Report
    alert(`Sales Report:
     Item: ${row.cells[0].textContent}
     Quantity Sold: ${quantityToSell}
     Total Profit: ₦${profit.toFixed(2)}`);

    if (quantity - quantityToSell === 0) {
        row.remove();
    }

    updateSummary();{
        document.getElementById('totalProfit').textContent = `₦${totalProfit.toFixed(2)}`;
        document.getElementById('totalInventoryCost').textContent = `₦${totalInventoryCost.toFixed(2)}`;
        document.getElementById('totalQuantity').textContent = totalQuantity;
    }
    
    // Generate Receipt
    generateReceipt(row.cells[0].textContent, row.dataset.barcode, quantityToSell, profit);

    if (quantity - quantityToSell === 0) {
        row.remove();
        paginateTable();
    }

    function updateSummary() {
        document.getElementById('totalProfit').textContent = `₦${totalProfit.toFixed(2)}`;
        document.getElementById('totalInventoryCost').textContent = `₦${totalInventoryCost.toFixed(2)}`;
        document.getElementById('totalQuantity').textContent = totalQuantity;
    }
 
}

function updateItem(button) {
    const row = button.closest('tr');
    const newName = prompt('Enter new item name:', row.cells[0].textContent);
    const newCostPrice = parseFloat(prompt('Enter new cost price:', row.cells[2].textContent.replace('₦', '')));
    const newSellingPrice = parseFloat(prompt('Enter new selling price:', row.cells[3].textContent.replace('₦', '')));
    const newQuantity = parseInt(prompt('Enter new quantity:', row.cells[4].textContent));

    if (!newName || isNaN(newCostPrice) || isNaN(newSellingPrice) || isNaN(newQuantity)) {
        alert('Invalid input. Update aborted.');
        return;
    }

    row.cells[0].textContent = newName;
    row.cells[2].textContent = `₦${newCostPrice.toFixed(2)}`;
    row.cells[3].textContent = `₦${newSellingPrice.toFixed(2)}`;
    row.cells[4].textContent = newQuantity;

    function updateSummary() {
        document.getElementById('totalProfit').textContent = `₦${totalProfit.toFixed(2)}`;
        document.getElementById('totalInventoryCost').textContent = `₦${totalInventoryCost.toFixed(2)}`;
        document.getElementById('totalQuantity').textContent = totalQuantity;
    }
    
}

function deleteItem(button) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const row = button.closest('tr');
    const quantity = parseInt(row.cells[4].textContent);
    const costPrice = parseFloat(row.cells[2].textContent);

    totalQuantity -= quantity;
    totalInventoryCost -= costPrice * quantity;

    row.remove();
    paginateTable();
    updateSummary();
}

function updateSummary() {
    document.getElementById('totalProfit').textContent = `₦${totalProfit.toFixed(2)}`;
    document.getElementById('totalInventoryCost').textContent = `₦${totalInventoryCost.toFixed(2)}`;
    document.getElementById('totalQuantity').textContent = totalQuantity;
}


function paginateTable() {
    const rows = Array.from(document.querySelectorAll("#itemTableBody tr"));
    const maxRows = 10;
    rows.forEach((row, index) => {
        row.style.display = index >= (currentPage - 1) * maxRows && index < currentPage * maxRows ? "" : "none";
    });
}

function clearForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemCostPrice').value = '';
    document.getElementById('itemSellingPrice').value = '';
    document.getElementById('itemQuantity').value = '';
}

function searchByBarcode() {
    const searchValue = document.getElementById("barcodeInput").value.trim();
    const rows = document.querySelectorAll("#itemTableBody tr");

    rows.forEach((row) => {
        const barcodeCell = row.cells[6].textContent.trim();
        if (barcodeCell.includes(searchValue)) {
            row.style.display = ""; // Show row if match found
        } else {
            row.style.display = "none"; // Hide row if no match
        }
    });
}

function searchItems() {
    const searchInput = document.getElementById("searchInput").value.trim().toLowerCase();
    const rows = document.querySelectorAll("#itemTableBody tr");
    let found = false;

    rows.forEach((row) => {
        const itemName = row.cells[0].textContent.toLowerCase();
        if (itemName.includes(searchInput)) {
            row.style.display = ""; // Show row if match found
            found = true;
        } else {
            row.style.display = "none"; // Hide row if no match
        }
    });

    // Display message if no items found
    if (!found) {
        alert("Item not found.");
    }

    // Clear search input after search
    document.getElementById("searchInput").value = "";
}



function goToDate() {
    const dateInput = document.getElementById("dateInput").value;
    if (!dateInput) {
        alert("Please select a valid date.");
        return;
    }

    const rows = document.querySelectorAll("#itemTableBody tr");
    let found = false;

    rows.forEach((row) => {
        const rowDate = row.cells[1].textContent.split(",")[0]; // Extract the date part
        if (rowDate === dateInput) {
            row.style.display = ""; // Show row if date matches
            found = true;
        } else {
            row.style.display = "none"; // Hide row if no match
        }
    });

    // Display message if no rows match the selected date
    if (!found) {
        alert("No items found for the selected date.");
    }

    // Clear the date input after the search
    document.getElementById("dateInput").value = "";
}


function printBarcode(button) {
    if (!button) {
        alert("Button reference not provided for printing barcode.");
        return;
    }

    const row = button.closest('tr');
    if (!row) {
        alert("Row could not be found.");
        return;
    }

    const barcodeDiv = row.cells[6]?.innerHTML; // Ensure `cells[6]` exists.
    if (!barcodeDiv) {
        alert("Barcode information is missing.");
        return;
    }

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <html>
        <head>
            <title>Print Barcode</title>
        </head>
        <body>
            <h2>Item Barcode</h2>
            <div>${barcodeDiv}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 1000);
}


function generateReceipt(itemName, barcode, quantitySold, profit) {
    const receiptWindow = window.open("", "_blank");
    receiptWindow.document.write(`
        <html>
        <head>
            <title>Sales Receipt</title>
        </head>
        <body>
            <h1>Receipt</h1>
            <p>Item: ${itemName}</p>
            <p>Barcode: ${barcode}</p>
            <p>Quantity Sold: ${quantitySold}</p>
            <p>Profit: ₦${profit.toFixed(2)}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
        </body>
        </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
}

function toggleTableVisibility() {
    const tableWrapper = document.getElementById('tableWrapper');
    const isVisible = tableWrapper.style.display !== 'none';
    tableWrapper.style.display = isVisible ? 'none' : 'block';
}

function updateSummary() {
    document.getElementById('totalProfit').textContent = `₦${totalProfit.toFixed(2)}`;
    document.getElementById('totalInventoryCost').textContent = `₦${totalInventoryCost.toFixed(2)}`;
    document.getElementById('totalQuantity').textContent = totalQuantity;
}




function triggerCamera() {
    const scannerDiv = document.getElementById("qr-reader") || document.createElement("div");
    if (!document.getElementById("qr-reader")) {
        scannerDiv.id = "qr-reader";
        document.body.appendChild(scannerDiv);
    }

    const html5QrCode = new Html5Qrcode("qr-reader");

    html5QrCode.start(
        { facingMode: "environment" }, // Use the back camera
        {
            fps: 10, // Frames per second
            qrbox: { width: 250, height: 250 }, // Scanner box dimensions
        },
        (decodedText) => {
            alert(`Scanned Barcode: ${decodedText}`);
            document.getElementById("barcodeInput").value = decodedText; // Autofill the barcode input
            html5QrCode.stop();
            scannerDiv.remove(); // Remove the scanner div after scanning
        },
        (error) => {
            console.warn(`Scanning error: ${error}`);
        }
    ).catch((err) => {
        alert("Camera access denied or not available.");
        console.error(err);
    });
}

let salesTransactions = []; // To store all transactions

function sellItem(button) {
    const row = button.closest('tr');
    const quantityCell = row.cells[4];
    const profitCell = row.cells[5];
    const costPrice = parseFloat(row.cells[2].textContent.replace('₦', ''));
    const sellingPrice = parseFloat(row.cells[3].textContent.replace('₦', ''));
    const quantity = parseInt(quantityCell.textContent);

    const quantityToSell = parseInt(prompt('Enter the number of items to sell:', '1'));

    if (isNaN(quantityToSell) || quantityToSell <= 0 || quantityToSell > quantity) {
        alert('Invalid quantity entered.');
        return;
    }

    const profit = (sellingPrice - costPrice) * quantityToSell;

    // Update cell values and totals
    quantityCell.textContent = quantity - quantityToSell;
    profitCell.textContent = `₦${(parseFloat(profitCell.textContent.replace('₦', '')) + profit).toFixed(2)}`;
    totalQuantity -= quantityToSell;
    totalProfit += profit;
    totalInventoryCost -= costPrice * quantityToSell;

    // Generate Sales Report
    alert(`Sales Report:
Item: ${row.cells[0].textContent}
Quantity Sold: ${quantityToSell}
Total Profit: ₦${profit.toFixed(2)}`);

    if (quantity - quantityToSell === 0) {
        row.remove(); // Remove the row if quantity is zero
    }

    // Update summary and pagination
    updateSummary();
    paginateTable();
}


  
    function updateSummary() {
        document.getElementById('totalProfit').textContent = `₦${totalProfit.toFixed(2)}`;
        document.getElementById('totalInventoryCost').textContent = `₦${totalInventoryCost.toFixed(2)}`;
        document.getElementById('totalQuantity').textContent = totalQuantity;
    }
    

// Function to View or Send Receipt for a Sale
function viewReceipt() {
    const transactionIndex = parseInt(prompt("Enter the transaction index (e.g., 0 for the first transaction):"));
    if (isNaN(transactionIndex)) {
        alert("Invalid input. Please enter a number.");
        return;
    }

    const sale = salesTransactions[transactionIndex];
    if (!sale) {
        alert('Transaction not found. Please ensure the index is correct.');
        return;
    }

    const receiptContent = `
        <h1>Receipt</h1>
        <p>Item: ${sale.itemName}</p>
        <p>Barcode: ${sale.barcode}</p>
        <p>Quantity Sold: ${sale.quantitySold}</p>
        <p>Profit: ₦${sale.profit.toFixed(2)}</p>
        <p>Date: ${sale.date}</p>
    `;

    const receiptWindow = window.open("", "_blank");
    receiptWindow.document.write(`
        <html>
        <head>
            <title>Receipt</title>
        </head>
        <body>${receiptContent}</body>
        </html>
    `);
    receiptWindow.document.close();
}

function listTransactions() {
    if (salesTransactions.length === 0) {
        alert("No transactions found.");
        return;
    }

    let transactionList = "Available Transactions:\n";
    salesTransactions.forEach((sale, index) => {
        transactionList += `Index ${index}: ${sale.itemName}, Date: ${sale.date}\n`;
    });

    alert(transactionList);
}

function viewReceiptWithIndex() {
    listTransactions();
    viewReceipt();
    const salesTransactions = [
        { itemName: "Product A", barcode: "12345", quantitySold: 2, profit: 100, date: "2024-12-26 10:00:00" },
        { itemName: "Product B", barcode: "67890", quantitySold: 1, profit: 200, date: "2024-12-26 11:00:00" }
    ];
    
}


    // Send via email placeholder
    const emailAddress = prompt("Enter an email address to send this receipt:");
    if (emailAddress) {
        alert(`Receipt sent to ${emailAddress} (This is a placeholder, integrate email API for real functionality).`);
    }

// Function to Send Daily Sales Report via Email
function sendDailySalesReport() {
    const today = new Date().toISOString().split("T")[0]; // Get today's date
    const todaySales = salesTransactions.filter((sale) => sale.date.startsWith(today));

    if (todaySales.length === 0) {
        alert('No sales transactions found for today.');
        return;
    }

    let reportContent = `<h1>Daily Sales Report</h1>`;
    todaySales.forEach((sale, index) => {
        reportContent += `
            <h2>Transaction ${index + 1}</h2>
            <p>Item: ${sale.itemName}</p>
            <p>Barcode: ${sale.barcode}</p>
            <p>Quantity Sold: ${sale.quantitySold}</p>
            <p>Profit: ₦${sale.profit.toFixed(2)}</p>
            <p>Date: ${sale.date}</p>
            <hr />
        `;
    });

    const reportWindow = window.open("", "_blank");
    reportWindow.document.write(`
        <html>
        <head>
            <title>Daily Sales Report</title>
        </head>
        <body>${reportContent}</body>
        </html>
    `);
    reportWindow.document.close();

    // Send via email placeholder
    const emailAddress = prompt("Enter an email address to send the sales report:");
    if (emailAddress) {
        alert(`Sales report sent to ${emailAddress} (This is a placeholder, integrate email API for real functionality).`);
    }
}

