-- ============================================================================
-- CampusBite: start fresh
-- Run in MySQL Workbench. TAKE A BACKUP FIRST (Server menu > Data Export).
-- Deleted rows cannot be brought back.
-- ============================================================================
USE campusbite;

-- Workbench blocks DELETE without WHERE unless this is off
SET SQL_SAFE_UPDATES = 0;

-- ---------------------------------------------------------------------------
-- PART A  (run this)
-- Deletes ALL order history: every student's orders and every shop's
-- orders / revenue. Student accounts, admin accounts, shops and items stay.
-- The next order will be #1 again.
-- ---------------------------------------------------------------------------
DELETE FROM order_items;
DELETE FROM orders;
ALTER TABLE order_items AUTO_INCREMENT = 1;
ALTER TABLE orders      AUTO_INCREMENT = 1;

-- ---------------------------------------------------------------------------
-- PART B  (OPTIONAL: only if you also want to delete all accounts)
-- To run it, delete the two dashes at the start of each line below.
-- This removes ALL students, ALL admins, their shops and items.
-- Photos stay in server\uploads\items until you delete them by hand.
-- ---------------------------------------------------------------------------
-- DELETE FROM items;
-- DELETE FROM places;
-- DELETE FROM admins;
-- DELETE FROM users;
-- ALTER TABLE items  AUTO_INCREMENT = 1;
-- ALTER TABLE places AUTO_INCREMENT = 1;
-- ALTER TABLE admins AUTO_INCREMENT = 1;
-- ALTER TABLE users  AUTO_INCREMENT = 1;

-- ---------------------------------------------------------------------------
-- PART C  (OPTIONAL: if you kept your items, put their stock back)
-- Change 50 to the quantity you want. Test orders had reduced the stock.
-- ---------------------------------------------------------------------------
-- UPDATE items SET quantity = 50;

SET SQL_SAFE_UPDATES = 1;

-- Check: all of these should now show 0 (or only what you kept)
SELECT (SELECT COUNT(*) FROM orders)      AS orders,
       (SELECT COUNT(*) FROM order_items) AS order_items,
       (SELECT COUNT(*) FROM users)       AS students,
       (SELECT COUNT(*) FROM admins)      AS admins,
       (SELECT COUNT(*) FROM items)       AS items;
