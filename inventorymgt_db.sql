USE inventorymgt;

DROP PROCEDURE IF EXISTS AddItem;
DROP PROCEDURE IF EXISTS SellItem;
DROP PROCEDURE IF EXISTS UpdateItem;
DROP PROCEDURE IF EXISTS DeleteItem;

CREATE TABLE IF NOT EXISTS Items (
    ItemID INT AUTO_INCREMENT PRIMARY KEY,
    ItemName VARCHAR(255) NOT NULL,
    AddedDateTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CostPrice DECIMAL(10, 2) NOT NULL,
    SellingPrice DECIMAL(10, 2) NOT NULL,
    Quantity INT NOT NULL,
    Profit DECIMAL(10, 2) DEFAULT 0,
    Barcode VARCHAR(255) NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Sales (
    SaleID INT AUTO_INCREMENT PRIMARY KEY,
    ItemID INT NOT NULL,
    QuantitySold INT NOT NULL,
    SaleDateTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TotalProfit DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (ItemID) REFERENCES Items(ItemID) ON DELETE CASCADE
);

DELIMITER //
CREATE PROCEDURE AddItem(
    IN p_ItemName VARCHAR(255),
    IN p_AddedDateTime DATETIME,
    IN p_CostPrice DECIMAL(10,2),
    IN p_SellingPrice DECIMAL(10,2),
    IN p_Quantity INT,
    IN p_Barcode VARCHAR(255)
)
BEGIN
    -- Ensure NULL values are replaced with empty string
    IF p_Barcode IS NULL THEN
        SET p_Barcode = '';
    END IF;

    INSERT INTO Items (ItemName, AddedDateTime, CostPrice, SellingPrice, Quantity, Barcode)
    VALUES (p_ItemName, p_AddedDateTime, p_CostPrice, p_SellingPrice, p_Quantity, p_Barcode);
END //

DELIMITER //

DELIMITER //
CREATE PROCEDURE SellItem(
    IN p_ItemID INT,
    IN p_QuantitySold INT
)
BEGIN
    DECLARE v_SellingPrice DECIMAL(10, 2);
    DECLARE v_CostPrice DECIMAL(10, 2);
    DECLARE v_Quantity INT;
    DECLARE v_Profit DECIMAL(10, 2);

    -- Check if the item exists
    IF NOT EXISTS (SELECT 1 FROM Items WHERE ItemID = p_ItemID) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Item with the given ID does not exist.';
    END IF;

    -- Fetch current item details
    SELECT SellingPrice, CostPrice, Quantity INTO v_SellingPrice, v_CostPrice, v_Quantity
    FROM Items WHERE ItemID = p_ItemID;

    -- Check if there is sufficient stock
    IF v_Quantity < p_QuantitySold THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for sale.';
    END IF;

    -- Calculate profit for the sale
    SET v_Profit = (v_SellingPrice - v_CostPrice) * p_QuantitySold;

    -- Insert sale record
    INSERT INTO Sales (ItemID, QuantitySold, TotalProfit)
    VALUES (p_ItemID, p_QuantitySold, v_Profit);

    -- Update item quantity and profit
    UPDATE Items
    SET Quantity = v_Quantity - p_QuantitySold,
        Profit = Profit + v_Profit
    WHERE ItemID = p_ItemID;
END //
DELIMITER //

DELIMITER //
CREATE PROCEDURE UpdateItem(
    IN p_ItemID INT,
    IN p_ItemName VARCHAR(255),
    IN p_CostPrice DECIMAL(10, 2),
    IN p_SellingPrice DECIMAL(10, 2),
    IN p_Quantity INT
)
BEGIN
    -- Check if the item exists
    IF NOT EXISTS (SELECT 1 FROM Items WHERE ItemID = p_ItemID) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Item with the given ID does not exist.';
    END IF;

    -- Perform the update
    UPDATE Items
    SET 
        ItemName = p_ItemName,
        AddedDateTime = p_AddedDateTime,
        CostPrice = p_CostPrice,
        SellingPrice = p_SellingPrice,
        Quantity = p_Quantity
    WHERE ItemID = p_ItemID;
END //
DELIMITER //

DELIMITER //
CREATE PROCEDURE DeleteItem(IN p_ItemID INT)
BEGIN
    -- Check if the item exists
    IF NOT EXISTS (SELECT 1 FROM Items WHERE ItemID = p_ItemID) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Item with the given ID does not exist.';
    END IF;

    -- Perform the deletion
    DELETE FROM Items WHERE ItemID = p_ItemID;
END //
DELIMITER //

GRANT ALL PRIVILEGES ON inventorymgt.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

SELECT * FROM items;

DELETE FROM Items WHERE Barcode = '';
