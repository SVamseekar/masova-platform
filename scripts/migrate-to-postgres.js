/**
 * One-time MongoDB → PostgreSQL data migration script (Phase 2, Task 2.8)
 *
 * PURPOSE: Backfill historical MongoDB data into PostgreSQL after dual-write
 *          has been running cleanly for at least one week.
 *
 * SAFETY:
 *   - Idempotent: skips rows already present (identified by mongo_id).
 *   - Read-only on MongoDB; write-only on PostgreSQL.
 *   - Never issues physical DELETEs on either side.
 *   - Financial tables (orders, transactions, refunds, purchase_orders,
 *     waste_records) use ON CONFLICT (mongo_id) DO NOTHING.
 *   - Tables without mongo_id (order_items, purchase_order_items) are
 *     wrapped in per-section BEGIN/COMMIT so partial failures are rollbackable.
 *
 * RUN:
 *   MONGO_URL=mongodb://192.168.50.88:27017 \
 *   PG_URL=postgresql://masova:masova_secret@192.168.50.88:5432/masova_db \
 *   node scripts/migrate-to-postgres.js
 *
 * DEPENDENCIES:
 *   npm install mongodb pg --save-dev   (inside scripts/)
 */

'use strict';

const { MongoClient } = require('mongodb');
const { Client: PgClient } = require('pg');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.50.88:27017';
const PG_URL    = process.env.PG_URL    || 'postgresql://masova:masova_secret@192.168.50.88:5432/masova_db';

// ─── helpers ──────────────────────────────────────────────────────────────────

function str(v)  { return v != null ? String(v)  : null; }
function bool(v) { return v != null ? Boolean(v) : null; }
function num(v)  { return v != null ? Number(v)  : null; }
function jsonb(v) {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

function report(label, total, migrated, skipped, errors) {
  console.log(`  ${label}: ${migrated} migrated, ${skipped} already present/conflict, ${errors} errors (total: ${total})`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  const mongo = new MongoClient(MONGO_URL);
  const pg    = new PgClient({ connectionString: PG_URL });

  await mongo.connect();
  await pg.connect();

  const db = mongo.db('masova_db');
  console.log('Connected to MongoDB and PostgreSQL.\n');

  // ── 1. users (core_schema — public schema, no prefix) ──────────────────────
  console.log('=== [1/8] users ===');
  {
    const docs = await db.collection('users').find({}).toArray();
    let migrated = 0, skipped = 0, errors = 0;
    for (const u of docs) {
      const mongoId = u._id.toString();
      const { rows: exists } = await pg.query('SELECT id FROM users WHERE mongo_id = $1', [mongoId]);
      if (exists.length > 0) { skipped++; continue; }
      try {
        const { rows: inserted } = await pg.query(
          `INSERT INTO users
             (mongo_id, user_type, name, email, phone, password_hash,
              store_id, employee_role, employee_status, employee_pin_hash,
              pin_suffix, terminal_id, is_kiosk_account, is_active,
              last_login, deleted_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
           ON CONFLICT (email) DO NOTHING
           RETURNING id`,
          [
            mongoId,
            str(u.type) || 'CUSTOMER',
            str(u.name),
            str(u.email),
            str(u.phone),
            str(u.password),
            str(u.storeId),
            str(u.employeeDetails?.role),
            str(u.employeeDetails?.status),
            str(u.employeeDetails?.pinHash),
            str(u.employeeDetails?.pinSuffix),
            str(u.terminalId),
            bool(u.isKioskAccount) ?? false,
            bool(u.active) ?? true,
            u.lastLogin    || null,
            u.deletedAt    || null,
            u.createdAt    || new Date(),
            u.updatedAt    || new Date(),
          ]
        );
        if (inserted.length > 0) {
          migrated++;
        } else {
          console.warn(`  WARN user ${u.email}: email conflict (duplicate Mongo docs) — skipped`);
          skipped++;
        }
      } catch (e) {
        console.warn(`  WARN user ${u.email}: ${e.message}`);
        errors++;
      }
    }
    report('users', docs.length, migrated, skipped, errors);
  }

  // ── 2. orders (commerce_schema) ────────────────────────────────────────────
  console.log('\n=== [2/8] orders ===');
  {
    const docs = await db.collection('orders').find({}).toArray();
    let migrated = 0, skipped = 0, errors = 0;
    for (const o of docs) {
      const mongoId = o._id.toString();
      const { rows: exists } = await pg.query('SELECT id FROM commerce_schema.orders WHERE mongo_id = $1', [mongoId]);
      if (exists.length > 0) { skipped++; continue; }
      try {
        const { rows: inserted } = await pg.query(
          `INSERT INTO commerce_schema.orders
             (mongo_id, order_number, customer_id, customer_name, customer_phone,
              customer_email, store_id, status, order_type, payment_status,
              payment_method, payment_transaction_id, priority,
              subtotal, delivery_fee, tax, total, special_instructions,
              table_number, guest_count, assigned_driver_id,
              created_by_staff_id, created_by_staff_name, preparation_time,
              estimated_delivery_time,
              delivery_address, delivery_otp, delivery_proof_type, delivery_proof_url,
              cancellation_reason, received_at, preparing_started_at, ready_at,
              dispatched_at, delivered_at, cancelled_at, deleted_at,
              created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
                   $19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39)
           ON CONFLICT (mongo_id) DO NOTHING
           RETURNING id`,
          [
            mongoId,
            str(o.orderNumber),
            str(o.customerId),
            str(o.customerName),
            str(o.customerPhone),
            str(o.customerEmail),
            str(o.storeId),
            str(o.status),
            str(o.orderType),
            str(o.paymentStatus) || 'PENDING',
            str(o.paymentMethod),
            str(o.paymentTransactionId),
            str(o.priority) || 'NORMAL',
            num(o.subtotal),
            num(o.deliveryFee) ?? 0,
            num(o.tax) ?? 0,
            num(o.total),
            str(o.specialInstructions),
            str(o.tableNumber),
            num(o.guestCount),
            str(o.assignedDriverId),
            str(o.createdByStaffId),
            str(o.createdByStaffName),
            num(o.preparationTime),
            o.estimatedDeliveryTime  || null,
            jsonb(o.deliveryAddress),
            str(o.deliveryOtp),
            str(o.deliveryProofType),
            str(o.deliveryProofUrl),
            str(o.cancellationReason),
            o.receivedAt             || null,
            o.preparingStartedAt     || null,
            o.readyAt                || null,
            o.dispatchedAt           || null,
            o.deliveredAt            || null,
            o.cancelledAt            || null,
            o.deletedAt              || null,
            o.createdAt              || new Date(),
            o.updatedAt              || new Date(),
          ]
        );
        if (inserted.length > 0) migrated++; else skipped++;
      } catch (e) {
        console.warn(`  WARN order ${o.orderNumber}: ${e.message}`);
        errors++;
      }
    }
    report('orders', docs.length, migrated, skipped, errors);
  }

  // ── 3. order_items (commerce_schema) — no mongo_id; wrapped in transaction ─
  console.log('\n=== [3/8] order_items ===');
  {
    const orders = await db.collection('orders').find({ items: { $exists: true, $ne: [] } }).toArray();
    let migrated = 0, skipped = 0, errors = 0, total = 0;
    await pg.query('BEGIN');
    try {
      for (const o of orders) {
        const mongoOrderId = o._id.toString();
        const { rows: orderRows } = await pg.query(
          'SELECT id FROM commerce_schema.orders WHERE mongo_id = $1', [mongoOrderId]
        );
        if (orderRows.length === 0) continue;
        const pgOrderId = orderRows[0].id;

        for (const item of (o.items || [])) {
          total++;
          if (!item.menuItemId) {
            console.warn(`  WARN order ${o.orderNumber}: item '${item.name}' has no menuItemId — skipped`);
            errors++;
            continue;
          }
          // Surrogate uniqueness: same item+variant on the same order
          const { rows: existing } = await pg.query(
            `SELECT id FROM commerce_schema.order_items
             WHERE order_id = $1 AND menu_item_id = $2 AND name = $3
               AND (variant = $4 OR (variant IS NULL AND $4::text IS NULL))`,
            [pgOrderId, str(item.menuItemId), str(item.name), str(item.variant)]
          );
          if (existing.length > 0) { skipped++; continue; }
          try {
            await pg.query(
              `INSERT INTO commerce_schema.order_items
                 (order_id, menu_item_id, name, quantity, price, variant, customizations, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [
                pgOrderId,
                str(item.menuItemId),
                str(item.name),
                num(item.quantity),
                num(item.price),
                str(item.variant),
                jsonb(item.customizations),
                o.createdAt || new Date(),
              ]
            );
            migrated++;
          } catch (e) {
            console.warn(`  WARN order_item '${item.name}' on ${o.orderNumber}: ${e.message}`);
            errors++;
          }
        }
      }
      await pg.query('COMMIT');
    } catch (e) {
      await pg.query('ROLLBACK');
      console.error('  ERROR: order_items section rolled back due to unexpected error:', e.message);
      errors++;
    }
    report('order_items', total, migrated, skipped, errors);
  }

  // ── 4. transactions (payment_schema) ───────────────────────────────────────
  console.log('\n=== [4/8] transactions ===');
  {
    const docs = await db.collection('transactions').find({}).toArray();
    let migrated = 0, skipped = 0, errors = 0;
    for (const t of docs) {
      const mongoId = t._id.toString();
      const { rows: exists } = await pg.query('SELECT id FROM payment_schema.transactions WHERE mongo_id = $1', [mongoId]);
      if (exists.length > 0) { skipped++; continue; }
      try {
        const { rows: inserted } = await pg.query(
          `INSERT INTO payment_schema.transactions
             (mongo_id, order_id, razorpay_order_id, razorpay_payment_id,
              razorpay_signature, amount, status, payment_method,
              customer_id, customer_email, customer_phone, store_id,
              error_code, error_description, error_source, error_step, error_reason,
              receipt, currency, reconciled, reconciled_at, reconciled_by,
              paid_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
           ON CONFLICT (mongo_id) DO NOTHING
           RETURNING id`,
          [
            mongoId,
            str(t.orderId),
            str(t.razorpayOrderId),
            str(t.razorpayPaymentId),
            str(t.razorpaySignature),
            num(t.amount),
            str(t.status),
            str(t.paymentMethod),
            str(t.customerId),
            str(t.customerEmail),
            str(t.customerPhone),
            str(t.storeId),
            str(t.errorCode),
            str(t.errorDescription),
            str(t.errorSource),
            str(t.errorStep),
            str(t.errorReason),
            str(t.receipt),
            str(t.currency) || 'INR',
            bool(t.reconciled) ?? false,
            t.reconciledAt || null,
            str(t.reconciledBy),
            t.paidAt     || null,
            t.createdAt  || new Date(),
            t.updatedAt  || new Date(),
          ]
        );
        if (inserted.length > 0) migrated++; else skipped++;
      } catch (e) {
        console.warn(`  WARN transaction ${mongoId}: ${e.message}`);
        errors++;
      }
    }
    report('transactions', docs.length, migrated, skipped, errors);
  }

  // ── 5. refunds (payment_schema) ────────────────────────────────────────────
  console.log('\n=== [5/8] refunds ===');
  {
    const docs = await db.collection('refunds').find({}).toArray();
    let migrated = 0, skipped = 0, errors = 0;
    for (const r of docs) {
      const mongoId = r._id.toString();
      const { rows: exists } = await pg.query('SELECT id FROM payment_schema.refunds WHERE mongo_id = $1', [mongoId]);
      if (exists.length > 0) { skipped++; continue; }

      // Resolve PG transaction id: try mongo_id first, then fall back to order_id
      let pgTxId = null;
      if (r.transactionId) {
        const { rows: txRows } = await pg.query(
          'SELECT id FROM payment_schema.transactions WHERE mongo_id = $1', [str(r.transactionId)]
        );
        if (txRows.length > 0) pgTxId = txRows[0].id;
      }
      if (!pgTxId && r.orderId) {
        // Fallback: resolve via denormalized order_id
        const { rows: txRows } = await pg.query(
          'SELECT id FROM payment_schema.transactions WHERE order_id = $1', [str(r.orderId)]
        );
        if (txRows.length > 0) pgTxId = txRows[0].id;
      }
      if (!pgTxId) {
        console.warn(`  WARN refund ${mongoId}: parent transaction not resolvable (transactionId=${r.transactionId}, orderId=${r.orderId}) — skipped`);
        errors++;
        continue;
      }

      try {
        const { rows: inserted } = await pg.query(
          `INSERT INTO payment_schema.refunds
             (mongo_id, transaction_id, order_id, store_id,
              razorpay_refund_id, razorpay_payment_id, amount, status, type,
              reason, initiated_by, customer_id,
              error_code, error_description, speed, notes,
              processed_at, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
           ON CONFLICT (mongo_id) DO NOTHING
           RETURNING id`,
          [
            mongoId,
            pgTxId,
            str(r.orderId),
            str(r.storeId),
            str(r.razorpayRefundId),
            str(r.razorpayPaymentId),
            num(r.amount),
            str(r.status),
            str(r.type),
            str(r.reason),
            str(r.initiatedBy),
            str(r.customerId),
            str(r.errorCode),
            str(r.errorDescription),
            str(r.speed),
            str(r.notes),
            r.processedAt || null,
            r.createdAt   || new Date(),
            r.updatedAt   || new Date(),
          ]
        );
        if (inserted.length > 0) migrated++; else skipped++;
      } catch (e) {
        console.warn(`  WARN refund ${mongoId}: ${e.message}`);
        errors++;
      }
    }
    report('refunds', docs.length, migrated, skipped, errors);
  }

  // ── 6. suppliers (logistics_schema) ────────────────────────────────────────
  console.log('\n=== [6/8] suppliers ===');
  {
    const docs = await db.collection('suppliers').find({}).toArray();
    let migrated = 0, skipped = 0, errors = 0;
    for (const s of docs) {
      const mongoId = s._id.toString();
      const { rows: exists } = await pg.query('SELECT id FROM logistics_schema.suppliers WHERE mongo_id = $1', [mongoId]);
      if (exists.length > 0) { skipped++; continue; }
      try {
        const { rows: inserted } = await pg.query(
          `INSERT INTO logistics_schema.suppliers
             (mongo_id, supplier_code, supplier_name, contact_person, phone_number,
              email, alternate_phone,
              address_line1, address_line2, city, state, pincode, country,
              gst_number, pan_number, business_type,
              payment_terms, credit_days, credit_limit,
              bank_name, account_number, ifsc_code, bank_branch,
              categories_supplied,
              total_orders, completed_orders, cancelled_orders,
              on_time_delivery_rate, quality_rating, total_purchase_value,
              average_lead_time_days, minimum_order_quantity,
              status, is_preferred, notes, website, last_order_date,
              created_at, updated_at, created_by, last_updated_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
                   $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41)
           ON CONFLICT (supplier_code) DO NOTHING
           RETURNING id`,
          [
            mongoId,
            str(s.supplierCode),
            str(s.supplierName),
            str(s.contactPerson),
            str(s.phoneNumber),
            str(s.email),
            str(s.alternatePhone),
            str(s.addressLine1),
            str(s.addressLine2),
            str(s.city),
            str(s.state),
            str(s.pincode),
            str(s.country) || 'India',
            str(s.gstNumber),
            str(s.panNumber),
            str(s.businessType),
            str(s.paymentTerms),
            num(s.creditDays),
            num(s.creditLimit),
            str(s.bankName),
            str(s.accountNumber),
            str(s.ifscCode),
            str(s.bankBranch),
            jsonb(s.categoriesSupplied),
            num(s.totalOrders) ?? 0,
            num(s.completedOrders) ?? 0,
            num(s.cancelledOrders) ?? 0,
            num(s.onTimeDeliveryRate) ?? 100.00,
            num(s.qualityRating) ?? 5.0,
            num(s.totalPurchaseValue) ?? 0,
            num(s.averageLeadTimeDays),
            num(s.minimumOrderQuantity),
            str(s.status) || 'ACTIVE',
            bool(s.isPreferred) ?? false,
            str(s.notes),
            str(s.website),
            s.lastOrderDate || null,
            s.createdAt     || new Date(),
            s.updatedAt     || new Date(),
            str(s.createdBy),
            str(s.lastUpdatedBy),
          ]
        );
        if (inserted.length > 0) {
          migrated++;
        } else {
          console.warn(`  WARN supplier ${s.supplierCode}: supplier_code conflict — skipped`);
          skipped++;
        }
      } catch (e) {
        console.warn(`  WARN supplier ${s.supplierCode}: ${e.message}`);
        errors++;
      }
    }
    report('suppliers', docs.length, migrated, skipped, errors);
  }

  // ── 7. inventory_items (logistics_schema) ──────────────────────────────────
  console.log('\n=== [7/8] inventory_items ===');
  {
    const docs = await db.collection('inventoryItems').find({}).toArray();
    let migrated = 0, skipped = 0, errors = 0;
    for (const item of docs) {
      const mongoId = item._id.toString();
      const { rows: exists } = await pg.query('SELECT id FROM logistics_schema.inventory_items WHERE mongo_id = $1', [mongoId]);
      if (exists.length > 0) { skipped++; continue; }

      // Resolve PG supplier id if set
      let pgSupplierId = null;
      if (item.primarySupplierId) {
        const { rows: sup } = await pg.query(
          'SELECT id FROM logistics_schema.suppliers WHERE mongo_id = $1', [str(item.primarySupplierId)]
        );
        pgSupplierId = sup.length > 0 ? sup[0].id : null;
      }

      try {
        const { rows: inserted } = await pg.query(
          `INSERT INTO logistics_schema.inventory_items
             (mongo_id, store_id, item_name, item_code, category, unit,
              current_stock, reserved_stock, minimum_stock, maximum_stock, reorder_quantity,
              unit_cost, average_cost, last_purchase_cost,
              primary_supplier_id, alternative_supplier_ids,
              is_perishable, expiry_date, shelf_life_days,
              batch_tracked, current_batch_number,
              status, auto_reorder, description, storage_location, notes, last_updated_by,
              created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
           ON CONFLICT (mongo_id) DO NOTHING
           RETURNING id`,
          [
            mongoId,
            str(item.storeId),
            str(item.itemName),
            str(item.itemCode),
            str(item.category),
            str(item.unit),
            num(item.currentStock) ?? 0,
            num(item.reservedStock) ?? 0,
            num(item.minimumStock),
            num(item.maximumStock),
            num(item.reorderQuantity),
            num(item.unitCost),
            num(item.averageCost),
            num(item.lastPurchaseCost),
            pgSupplierId,
            jsonb(item.alternativeSupplierIds),
            bool(item.isPerishable) ?? false,
            item.expiryDate || null,
            num(item.shelfLifeDays),
            bool(item.batchTracked) ?? false,
            str(item.currentBatchNumber),
            str(item.status) || 'AVAILABLE',
            bool(item.autoReorder) ?? false,
            str(item.description),
            str(item.storageLocation),
            str(item.notes),
            str(item.lastUpdatedBy),
            item.createdAt || new Date(),
            item.updatedAt || new Date(),
          ]
        );
        if (inserted.length > 0) migrated++; else skipped++;
      } catch (e) {
        console.warn(`  WARN inventory_item ${item.itemName} (${mongoId}): ${e.message}`);
        errors++;
      }
    }
    report('inventory_items', docs.length, migrated, skipped, errors);
  }

  // ── 8. purchase_orders + purchase_order_items (logistics_schema) ───────────
  // purchase_order_items has no mongo_id so is wrapped in a per-PO transaction.
  console.log('\n=== [8/8] purchase_orders + purchase_order_items ===');
  {
    const docs = await db.collection('purchaseOrders').find({}).toArray();
    let poMigrated = 0, poSkipped = 0, poErrors = 0;
    let itemMigrated = 0, itemSkipped = 0, itemErrors = 0, itemTotal = 0;

    for (const po of docs) {
      const mongoId = po._id.toString();
      const { rows: exists } = await pg.query(
        'SELECT id FROM logistics_schema.purchase_orders WHERE mongo_id = $1', [mongoId]
      );

      let pgPoId;
      if (exists.length > 0) {
        pgPoId = exists[0].id;
        poSkipped++;
      } else {
        // Resolve PG supplier id
        let pgSupplierId = null;
        if (po.supplierId) {
          const { rows: sup } = await pg.query(
            'SELECT id FROM logistics_schema.suppliers WHERE mongo_id = $1', [str(po.supplierId)]
          );
          pgSupplierId = sup.length > 0 ? sup[0].id : null;
        }

        try {
          const { rows: inserted } = await pg.query(
            `INSERT INTO logistics_schema.purchase_orders
               (mongo_id, order_number, store_id, supplier_id, supplier_name,
                order_date, expected_delivery_date, actual_delivery_date,
                status, subtotal, tax_amount, shipping_cost, discount_amount,
                total_amount, payment_status,
                requested_by, approved_by, approved_at, rejection_reason,
                received_by, received_at, receiving_notes,
                auto_generated, notes, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
             ON CONFLICT (order_number) DO NOTHING
             RETURNING id`,
            [
              mongoId,
              str(po.orderNumber),
              str(po.storeId),
              pgSupplierId,
              str(po.supplierName),
              po.orderDate             || null,
              po.expectedDeliveryDate  || null,
              po.actualDeliveryDate    || null,
              str(po.status) || 'DRAFT',
              num(po.subtotal) ?? 0,
              num(po.taxAmount) ?? 0,
              num(po.shippingCost) ?? 0,
              num(po.discountAmount) ?? 0,
              num(po.totalAmount) ?? 0,
              str(po.paymentStatus) || 'PENDING',
              str(po.requestedBy),
              str(po.approvedBy),
              po.approvedAt   || null,
              str(po.rejectionReason),
              str(po.receivedBy),
              po.receivedAt   || null,
              str(po.receivingNotes),
              bool(po.autoGenerated) ?? false,
              str(po.notes),
              po.createdAt    || new Date(),
              po.updatedAt    || new Date(),
            ]
          );
          if (inserted.length > 0) {
            pgPoId = inserted[0].id;
            poMigrated++;
          } else {
            // ON CONFLICT (order_number) — a different Mongo doc shares the same order number
            console.warn(`  WARN purchase_order ${po.orderNumber}: order_number conflict (duplicate Mongo docs) — using existing PG row`);
            const { rows: existing } = await pg.query(
              'SELECT id FROM logistics_schema.purchase_orders WHERE order_number = $1', [str(po.orderNumber)]
            );
            pgPoId = existing.length > 0 ? existing[0].id : null;
            poSkipped++;
          }
        } catch (e) {
          console.warn(`  WARN purchase_order ${po.orderNumber}: ${e.message}`);
          poErrors++;
          continue;
        }
      }

      if (!pgPoId) continue;

      // Insert line items in a transaction so partial failure is rollbackable
      await pg.query('BEGIN');
      try {
        for (const item of (po.items || [])) {
          itemTotal++;

          // Resolve inventory_item_id to PG UUID (not raw Mongo ObjectId)
          // Fallback to null (FK is nullable) — never pass a Mongo ObjectId string into a UUID column
          let pgInventoryItemId = null;
          if (item.inventoryItemId) {
            const { rows: inv } = await pg.query(
              'SELECT id FROM logistics_schema.inventory_items WHERE mongo_id = $1', [str(item.inventoryItemId)]
            );
            if (inv.length > 0) {
              pgInventoryItemId = inv[0].id;
            } else {
              console.warn(`  WARN purchase_order_item '${item.itemName}' on ${po.orderNumber}: inventory_item not found in PG — inserting with null FK`);
            }
          }

          // Surrogate uniqueness: (purchase_order_id, inventory_item_id, item_name)
          const { rows: existingItem } = await pg.query(
            `SELECT id FROM logistics_schema.purchase_order_items
             WHERE purchase_order_id = $1 AND inventory_item_id = $2 AND item_name = $3`,
            [pgPoId, pgInventoryItemId, str(item.itemName)]
          );
          if (existingItem.length > 0) { itemSkipped++; continue; }

          await pg.query(
            `INSERT INTO logistics_schema.purchase_order_items
               (purchase_order_id, inventory_item_id, item_name, item_code,
                quantity, unit, unit_price, total_price, received_quantity, notes,
                created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
              pgPoId,
              pgInventoryItemId,
              str(item.itemName),
              str(item.itemCode),
              num(item.quantity),
              str(item.unit),
              num(item.unitPrice),
              num(item.totalPrice),
              num(item.receivedQuantity) ?? 0,
              str(item.notes),
              po.createdAt || new Date(),
              po.updatedAt || new Date(),
            ]
          );
          itemMigrated++;
        }
        await pg.query('COMMIT');
      } catch (e) {
        await pg.query('ROLLBACK');
        console.warn(`  WARN purchase_order_items for ${po.orderNumber}: rolled back — ${e.message}`);
        itemErrors++;
      }
    }

    report('purchase_orders',      docs.length, poMigrated,   poSkipped,   poErrors);
    report('purchase_order_items', itemTotal,   itemMigrated, itemSkipped, itemErrors);
  }

  // ── waste_records (logistics_schema) ───────────────────────────────────────
  console.log('\n=== waste_records ===');
  {
    const docs = await db.collection('wasteRecords').find({}).toArray();
    let migrated = 0, skipped = 0, errors = 0;
    for (const w of docs) {
      const mongoId = w._id.toString();
      const { rows: exists } = await pg.query('SELECT id FROM logistics_schema.waste_records WHERE mongo_id = $1', [mongoId]);
      if (exists.length > 0) { skipped++; continue; }

      // Resolve PG inventory_item id if set
      let pgItemId = null;
      if (w.inventoryItemId) {
        const { rows: inv } = await pg.query(
          'SELECT id FROM logistics_schema.inventory_items WHERE mongo_id = $1', [str(w.inventoryItemId)]
        );
        pgItemId = inv.length > 0 ? inv[0].id : null;
      }

      try {
        const { rows: inserted } = await pg.query(
          `INSERT INTO logistics_schema.waste_records
             (mongo_id, store_id, inventory_item_id, item_name, item_code,
              quantity, unit, unit_cost, total_cost,
              waste_category, waste_reason, waste_date,
              reported_by, approved_by, approved_at,
              preventable, prevention_notes, batch_number, notes,
              created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
           ON CONFLICT (mongo_id) DO NOTHING
           RETURNING id`,
          [
            mongoId,
            str(w.storeId),
            pgItemId,
            str(w.itemName),
            str(w.itemCode),
            num(w.quantity),
            str(w.unit),
            num(w.unitCost),
            num(w.totalCost),
            str(w.wasteCategory),
            str(w.wasteReason),
            w.wasteDate  || new Date(),
            str(w.reportedBy),
            str(w.approvedBy),
            w.approvedAt || null,
            bool(w.preventable) ?? false,
            str(w.preventionNotes),
            str(w.batchNumber),
            str(w.notes),
            w.createdAt  || new Date(),
            w.createdAt  || new Date(), // waste_records have no updatedAt in Mongo
          ]
        );
        if (inserted.length > 0) migrated++; else skipped++;
      } catch (e) {
        console.warn(`  WARN waste_record ${mongoId}: ${e.message}`);
        errors++;
      }
    }
    report('waste_records', docs.length, migrated, skipped, errors);
  }

  await mongo.close();
  await pg.end();
  console.log('\n✅ Migration complete. Review WARNs above before proceeding to cutover.');
}

migrate().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
