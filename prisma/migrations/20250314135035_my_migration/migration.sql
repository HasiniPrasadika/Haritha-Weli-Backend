/*
  Warnings:

  - The values [RQUEST_REFUND] on the enum `order_events_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [RQUEST_REFUND] on the enum `order_events_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `order_events` MODIFY `status` ENUM('PAYMENT_DONE', 'PENDING', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REQUEST_REFUND', 'REFUND_DONE') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `orders` MODIFY `status` ENUM('PAYMENT_DONE', 'PENDING', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REQUEST_REFUND', 'REFUND_DONE') NOT NULL DEFAULT 'PENDING';
