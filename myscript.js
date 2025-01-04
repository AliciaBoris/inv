let inventory = []; // Initialize as an empty array
let totalProfit = 0;
let totalInventoryCost = 0;
let totalQuantity = 0;
let currentPage = 1;
const rowsPerPage = 10;

function paginateTable() {
    const rows = Array.from(document.querySelectorAll("#itemTableBody tr"));
    const totalRows = rows.length;
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    rows.forEach((row, index) => {
        row.style.display = index >= startIndex && index < endIndex ? "" : "none";
    });

    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = endIndex >= totalRows;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        paginateTable();
    }
}

function nextPage() {
    const totalRows = document.querySelectorAll("#itemTableBody tr").length;
    if (currentPage * rowsPerPage < totalRows) {
        currentPage++;
        paginateTable();
    }
}

// Ensure pagination buttons exist in HTML
window.onload = function() {
    fetchInventory();
    paginateTable();
};

function fetchInventory() {
    fetch("http://localhost:3000/api/items") // Fetch data from backend
        .then(response => response.json())
        .then(data => {
            inventory = data; // Store fetched items in the inventory array
            updateTable(); // Populate the table
            updateSummary(); // Ensure the summary updates with stored data
        })
        .catch(error => {
            console.error("Error fetching inventory:", error);
            alert("Failed to load inventory. Please check your backend.");
        });
}

// Ensure summary is updated on page load
window.onload = function() {
    fetchInventory();
};


function updateTable() {
    const tableBody = document.getElementById("itemTableBody");
    tableBody.innerHTML = ""; // Clear table before repopulating

    inventory.forEach(item => {
        // Convert values to numbers before using toFixed()
        const costPrice = parseFloat(item.CostPrice);
        const sellingPrice = parseFloat(item.SellingPrice);
        const profit = parseFloat(item.Profit);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.ItemName}</td>
            <td>${item.AddedDateTime}</td>
            <td>₦${costPrice.toFixed(2)}</td>
            <td>₦${sellingPrice.toFixed(2)}</td>
            <td>${item.Quantity}</td>
            <td>₦${profit.toFixed(2)}</td>
            <td>${item.Barcode}</td>
            <td>
                <button onclick="sellItem(this, '${item.Barcode}', ${item.Quantity})">Sell</button>
                <button onclick="updateItem(this)">Update</button>
                <button onclick="deleteItem(this)">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    paginateTable(); // Ensure pagination is applied
}

// Function to generate QR codes for each item
function generateQrCode(qrCodeText, callback) {
    const qrCanvas = document.createElement("canvas"); // Create a canvas element

    // Generate the QR Code and render it on the canvas
    QRCode.toCanvas(qrCanvas, qrCodeText, { width: 100, height: 100 }, (error) => {
        if (error) {
            console.error("QR Code generation error:", error);
            return;
        }

        // Execute the callback with the generated QR Code canvas
        callback(qrCanvas);
    });
}

// Function to print all QR codes
function printQrCodes() {
    const qrWindow = window.open("", "_blank");

    qrWindow.document.write(`
        <html>
        <head>
            <title>Print QR Codes</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                }
                .qr-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    margin-top: 20px;
                }
                .qr-container div {
                    margin: 15px;
                }
            </style>
        </head>
        <body>
            <h1>Inventory QR Codes</h1>
            <div class="qr-container" id="qrContainer"></div>
        </body>
        </html>
    `);

    const qrContainer = qrWindow.document.getElementById("qrContainer");

    inventory.forEach(item => {
        const qrCode = generateQrCode(item);
        qrContainer.appendChild(qrCode);
    });

    qrWindow.document.close();
    qrWindow.focus();

    setTimeout(() => {
        qrWindow.print();
        qrWindow.close();
    }, 1000);
}

function generateQrCode() {
    return `QR-${Date.now()}`; // Generate a unique QR code using timestamp
}

function generateAndDisplayQrCode() {
    let barcodeField = document.getElementById("barcodeInput");
    let qrCode = generateQrCode();
    
    if (barcodeField) {
        barcodeField.value = qrCode; // Set the generated QR code in the input field
    }
}

function addItem() {
    const itemName = document.getElementById("itemName").value;
    const addedDateTime = new Date().toISOString().slice(0, 19).replace("T", " ");
    const costPrice = parseFloat(document.getElementById("itemCostPrice").value);
    const sellingPrice = parseFloat(document.getElementById("itemSellingPrice").value);
    const quantity = parseInt(document.getElementById("itemQuantity").value);
    
    let barcodeField = document.getElementById("barcodeInput");
    let barcode = barcodeField ? barcodeField.value.trim() : "";

    if (!barcode) {
        alert("⚠ Please generate a QR code before adding the item.");
        return;
    }

    fetch("http://localhost:3000/api/add-item", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            itemName,
            addedDateTime,
            costPrice,
            sellingPrice,
            quantity,
            barcode,
        }),
    })
        .then(response => response.json())
        .then(data => {
            alert("Item added successfully!");
            fetchInventory(); // Refresh table after adding new item

            // Clear form and QR code input
            document.getElementById("barcodeInput").value = "";
            document.getElementById("itemName").value = "";
            document.getElementById("itemCostPrice").value = "";
            document.getElementById("itemSellingPrice").value = "";
            document.getElementById("itemQuantity").value = "";
        })
        .catch(error => {
            console.error("Error adding item:", error);
            alert("Failed to add item.");
        });

    inventory.push(item);
    updateTable();
    updateSummary();

}

// Ensure searchByBarcode also works with QR codes
function searchByQrCode() {
    const qrInput = document.getElementById("searchQrInput").value.trim();

    if (!qrInput) {
        alert("Please enter a QR Code.");
        return;
    }

    // Search in full inventory, not just displayed rows
    const foundItem = inventory.find(item => item.Barcode === qrInput);

    if (foundItem) {
        alert(`Item Found: ${foundItem.ItemName}, Quantity: ${foundItem.Quantity}`);
    } else {
        alert("No item found with this QR Code.");
    }
}

// Function to add items with properly formatted QR Code in the table
function addItem() {
    const itemName = document.getElementById("itemName").value;
    const addedDateTime = new Date().toISOString().slice(0, 19).replace("T", " ");
    const costPrice = parseFloat(document.getElementById("itemCostPrice").value);
    const sellingPrice = parseFloat(document.getElementById("itemSellingPrice").value);
    const quantity = parseInt(document.getElementById("itemQuantity").value);
    
    fetch("http://localhost:3000/api/add-item", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            itemName,
            addedDateTime,
            costPrice,
            sellingPrice,
            quantity
        }),
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById("barcodeInput").value = data.barcode; // Update UI with correct barcode
            alert("Item added successfully!");
            fetchInventory(); // Refresh table after adding new item
        })
        .catch(error => {
            console.error("Error adding item:", error);
            alert("Failed to add item.");
        });

    labelCode.textContent = qrCodeText;

    qrCodeCell.appendChild(qrCanvas);
    qrCodeCell.appendChild(labelName);
    qrCodeCell.appendChild(labelCode);

    table.appendChild(row);

    // Update summary
    totalQuantity += itemQuantity;
    totalInventoryCost += itemCostPrice * itemQuantity;
    updateSummary();

    // Clear the form
    clearForm();

}

function sellItem(button) {
    const row = button.parentElement.parentElement;
    const itemName = row.cells[0].textContent;
    const sellingPrice = parseFloat(row.cells[3].textContent.replace('₦', ''));
    const costPrice = parseFloat(row.cells[2].textContent.replace('₦', ''));
    const quantityCell = row.cells[4];
    const profitCell = row.cells[5];

    let quantity = parseInt(quantityCell.textContent);
    if (quantity === 0) {
        alert("No more items left to sell.");
        return;
    }

    const quantityToSell = parseInt(prompt(`Enter quantity to sell for ${itemName} (Available: ${quantity}):`));
    if (isNaN(quantityToSell) || quantityToSell <= 0 || quantityToSell > quantity) {
        alert("Invalid quantity.");
        return;
    }

    const profit = (sellingPrice - costPrice) * quantityToSell;
    quantity -= quantityToSell;
    quantityCell.textContent = quantity;
    profitCell.textContent = `₦${(parseFloat(profitCell.textContent.replace('₦', '')) + profit).toFixed(2)}`;

    totalQuantity -= quantityToSell;
    totalProfit += profit;

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
        fetch("http://localhost:3000/api/add-item", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                itemName,
                costPrice,
                sellingPrice,
                quantity,
            }),
        })
            .then((response) => response.text())
            .then((message) => {
                alert(message);
            })
            .catch((error) => {
                console.error("Error adding item:", error);
                alert("Failed to add item.");
            });
    }
    
    // Optionally, generate receipt only on request
    const generateReceipt = confirm("Do you want to view the receipt for this sale?");
    if (generateReceipt) {
        viewReceiptForSale(itemName, quantityToSell, profit);
    }

    if (quantity === 0) {
        row.remove();
    }
}
function saveSale(itemName, quantity, totalProfit) {
    fetch("http://localhost:3000/api/sales", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            item_name: itemName,
            quantity: quantity,
            total_profit: totalProfit,
        }),
    })
        .then((response) => {
            if (response.ok) {
                alert("Sale saved successfully.");
            } else {
                response.text().then((text) => alert("Error: " + text));
            }
        })
        .catch((error) => {
            console.error("Fetch error:", error);
            alert("Failed to save sale.");
        });
}

// Function to view receipt for a specific sale
function viewReceiptForSale(itemName, quantitySold, profit) {
    const receiptContent = `
        <h1>Receipt</h1>
        <p>Item: ${itemName}</p>
        <p>Quantity Sold: ${quantitySold}</p>
        <p>Total Profit: ₦${profit.toFixed(2)}</p>
        <p>Date: ${new Date().toLocaleString()}</p>
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
        let totalProfit = 0;
        let totalInventoryCost = 0;
        let totalQuantity = 0;
    
        inventory.forEach(item => {
            totalProfit += parseFloat(item.Profit);
            totalInventoryCost += parseFloat(item.CostPrice) * parseInt(item.Quantity);
            totalQuantity += parseInt(item.Quantity);
        });
    
        document.getElementById("totalProfit").textContent = `₦${totalProfit.toFixed(2)}`;
        document.getElementById("totalInventoryCost").textContent = `₦${totalInventoryCost.toFixed(2)}`;
        document.getElementById("totalQuantity").textContent = totalQuantity;
    }
    
}

function deleteItem(button) {
    const row = button.closest("tr");
    const barcode = row.cells[6].textContent; // Get barcode from table

    if (!confirm("Are you sure you want to delete this item?")) return;

    fetch(`http://localhost:3000/api/delete-item/${barcode}`, {
        method: "DELETE",
    })
        .then((response) => response.json())
        .then((data) => {
            alert(data.message);
            fetchInventory(); // Refresh table after deleting item
        })
        .catch((error) => {
            console.error("Error deleting item:", error);
            alert("Failed to delete item.");
        });
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

function searchByQrCode() {
    const qrInput = document.getElementById("searchQrInput").value.trim();

    if (!qrInput) {
        alert("Please enter a QR Code.");
        return;
    }

    // Search in full inventory, not just displayed rows
    const foundItem = inventory.find(item => item.Barcode === qrInput);

    if (foundItem) {
        alert(`Item Found: ${foundItem.ItemName}, Quantity: ${foundItem.Quantity}`);

        // Move found item to the top of the table
        inventory = inventory.filter(item => item.Barcode !== qrInput);
        inventory.unshift(foundItem);
        updateTable(); // Refresh table with new order

        // Highlight the row for visibility
        setTimeout(() => {
            const rows = document.querySelectorAll("#itemTableBody tr");
            rows[0].style.backgroundColor = "yellow"; // Highlight the first row
            setTimeout(() => {
                rows[0].style.backgroundColor = "";
            }, 3000);
        }, 100);
    } else {
        alert("No item found with this QR Code.");
    }

    // Clear search input after search
    document.getElementById("searchQrInput").value = "";
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

function printQrCodes() {
    const startRange = parseInt(prompt("Enter the start index of items to print (e.g., 1 for the first item):"));
    const endRange = parseInt(prompt("Enter the end index of items to print (e.g., 10 for the 10th item):"));

    if (isNaN(startRange) || isNaN(endRange) || startRange < 1 || endRange < startRange) {
        alert("Invalid range. Please enter valid start and end indices.");
        return;
    }

    const rows = Array.from(document.querySelectorAll("#itemTableBody tr"));
    if (rows.length === 0) {
        alert("No items available to print QR codes.");
        return;
    }

    if (startRange > rows.length || endRange > rows.length) {
        alert("Specified range exceeds the number of available items.");
        return;
    }

    const qrWindow = window.open("", "_blank");

    if (!qrWindow || qrWindow.closed || typeof qrWindow.closed === "undefined") {
        alert("Popup blocked! Please allow popups for this website.");
        return;
    }

    qrWindow.document.write(`
        <html>
        <head>
            <title>Print QR Codes</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
                .qr-container { 
                    display: flex; 
                    flex-wrap: wrap; 
                    justify-content: center; 
                    gap: 20px; 
                }
                .qr-code { 
                    margin: 10px; 
                    text-align: center; 
                }
                .qr-code canvas { 
                    display: block; 
                    margin: 0 auto; 
                }
                .qr-code p { 
                    margin: 5px 0 0; 
                    font-size: 14px; 
                }
            </style>
        </head>
        <body>
            <h1>QR Codes</h1>
            <div class="qr-container" id="qrContainer"></div>
        </body>
        </html>
    `);

    const qrContainer = qrWindow.document.getElementById("qrContainer");

    rows.slice(startRange - 1, endRange).forEach((row) => {
        const itemName = row.cells[0].textContent; // Item name
        const qrCodeText = row.cells[6]?.textContent.trim(); // Retrieve QR code text
    
        if (!qrCodeText) {
            console.error(`Missing QR Code for row ${row.rowIndex}`);
            return;
        }
    
        const qrDiv = document.createElement("div");
        qrDiv.className = "qr-code";
    
        const qrCanvas = document.createElement("canvas");
        QRCode.toCanvas(qrCanvas, qrCodeText, { width: 100, height: 100 }, (error) => {
            if (error) {
                console.error("QR Code generation error:", error);
            }
        });
    
        const label = document.createElement("p");
        label.textContent = itemName;
    
        qrDiv.appendChild(qrCanvas);
        qrDiv.appendChild(label);
        qrContainer.appendChild(qrDiv);
    });
    

    qrWindow.document.close();
    qrWindow.focus();

    setTimeout(() => {
        qrWindow.print();
        qrWindow.close();
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
            <p>: ${barcode}</p>
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
            qrbox: { width: 400, height: 400 }, // Scanning box dimensions
            supportedFormats: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
            ],
        },
        (decodedText) => {
            alert(`Scanned Barcode: ${decodedText}`);
            document.getElementById("barcodeInput").value = decodedText; // Autofill the barcode input
            html5QrCode.stop();
            scannerDiv.remove();

            // Automatically call up the item and sell it
            searchAndSellItem(decodedText);
        },
        (error) => {
            console.warn(`Scanning error: ${error}`);
        }
    ).catch((err) => {
        alert("Camera access denied or not available.");
        console.error(err);
    });
}

function searchAndSellItem(barcode) {
    const rows = document.querySelectorAll("#itemTableBody tr");
    let found = false;

    rows.forEach((row) => {
        const rowBarcode = row.cells[6]?.textContent.trim(); // Assuming barcode is in the 6th cell
        if (rowBarcode === barcode) {
            found = true;

            // Extract item details
            const itemName = row.cells[0].textContent;
            const quantityCell = row.cells[4];
            const profitCell = row.cells[5];
            const costPrice = parseFloat(row.cells[2].textContent.replace('₦', ''));
            const sellingPrice = parseFloat(row.cells[3].textContent.replace('₦', ''));
            const quantity = parseInt(quantityCell.textContent);

            // Prompt for quantity to sell
            const quantityToSell = parseInt(prompt(`Enter the quantity to sell for ${itemName}:`, '1'));
            if (isNaN(quantityToSell) || quantityToSell <= 0 || quantityToSell > quantity) {
                alert('Invalid quantity entered.');
                return;
            }

            // Update the inventory
            const profit = (sellingPrice - costPrice) * quantityToSell;
            quantityCell.textContent = quantity - quantityToSell;
            profitCell.textContent = `₦${(parseFloat(profitCell.textContent.replace('₦', '')) + profit).toFixed(2)}`;
            totalQuantity -= quantityToSell;
            totalProfit += profit;
            totalInventoryCost -= costPrice * quantityToSell;

            // Generate a sales report
            alert(`Sales Report:
Item: ${itemName}
Quantity Sold: ${quantityToSell}
Total Profit: ₦${profit.toFixed(2)}`);

            // If quantity becomes 0, remove the row
            if (quantity - quantityToSell === 0) {
                row.remove();
            }

            // Update the summary
            updateSummary();
        }
    });

    if (!found) {
        alert('Item not found in inventory.');
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
