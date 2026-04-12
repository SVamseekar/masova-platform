package com.MaSoVa.commerce.order.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import com.MaSoVa.shared.enums.OrderSource;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "orders")
@CompoundIndexes({
    @CompoundIndex(def = "{'storeId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'customerId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'assignedDriverId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'customerId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'orderType': 1, 'status': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'orderSource': 1, 'createdAt': -1}")
})
public class Order {

    @Id
    private String id;

    @Version
    private Long version;

    @Indexed(unique = true)
    private String orderNumber;

    private String customerId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;  // Store email directly for notifications (walk-in customers)

    @Indexed
    private String storeId;

    private List<OrderItem> items;

    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal tax;
    private BigDecimal total;

    // Global-2: EU VAT fields — null for India stores (use tax field instead)
    private String vatCountryCode;

    // Global-3: currency — null for India legacy orders (INR assumed)
    private String currency;
    private BigDecimal totalNetAmount;
    private BigDecimal totalVatAmount;
    private BigDecimal totalGrossAmount;
    private com.MaSoVa.shared.model.VatBreakdown vatBreakdown;

    @Indexed
    private OrderStatus status;

    private OrderType orderType;

    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private String paymentTransactionId;

    private Priority priority;

    private Integer preparationTime;
    private LocalDateTime estimatedDeliveryTime;

    private DeliveryAddress deliveryAddress;

    private String assignedDriverId;

    // Driver details - populated when needed (not persisted in DB)
    // Used for frontend display without additional API calls
    @org.springframework.data.annotation.Transient
    private DriverInfo assignedDriver;

    private String specialInstructions;
    private String tableNumber;        // DINE_IN table identifier
    private Integer guestCount;        // DINE_IN guest count

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    private LocalDateTime cancelledAt;
    private String cancellationReason;

    // Kitchen workflow timestamps
    private LocalDateTime receivedAt;
    private LocalDateTime preparingStartedAt;
    private LocalDateTime ovenStartedAt;
    private LocalDateTime bakedAt;
    private LocalDateTime readyAt;        // When order is ready (READY status for all order types)
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;

    // Proof of Delivery (POD) fields - DELIV-002
    private String deliveryOtp;                    // 4-digit OTP for delivery verification
    private LocalDateTime deliveryOtpGeneratedAt;  // When OTP was generated
    private LocalDateTime deliveryOtpExpiresAt;    // OTP expiry (15 min from generation)
    private String deliveryProofType;              // OTP, SIGNATURE, PHOTO, CONTACTLESS
    private String deliveryPhotoUrl;               // URL to delivery confirmation photo
    private String deliverySignatureUrl;           // URL to customer signature
    private Boolean contactlessDelivery;           // If true, skip OTP verification
    private String deliveryNotes;                  // Driver notes at delivery

    // Quality checkpoints
    private List<QualityCheckpoint> qualityCheckpoints;

    // Actual preparation time tracking (in minutes)
    private Integer actualPreparationTime;
    private Integer actualOvenTime;

    // Make-table workflow
    private String assignedMakeTableStation;
    private String assignedKitchenStaffId;
    private String assignedKitchenStaffName;
    private LocalDateTime assignedToKitchenAt;

    // POS staff tracking - for staff performance metrics
    @Indexed
    private String createdByStaffId;     // POS staff who created the order
    private String createdByStaffName;   // For quick display

    // Tip fields — optional, captured at order completion
    private java.math.BigDecimal tipAmountINR;    // Customer tip amount (null = no tip)
    private String tipRecipientStaffId;           // Direct tip recipient (null = pool)

    // Global-6: Delivery aggregator fields
    // orderSource is MASOVA for all direct orders; set to platform for staff-entered aggregator orders
    @Indexed
    private OrderSource orderSource = OrderSource.MASOVA;   // default — never null

    private String aggregatorOrderId;      // Reference number from aggregator platform
    private java.math.BigDecimal aggregatorCommission;    // Calculated from configured commission %
    private java.math.BigDecimal aggregatorNetPayout;     // grossAmount - aggregatorCommission

    // Constructors
    public Order() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(BigDecimal deliveryFee) { this.deliveryFee = deliveryFee; }

    public BigDecimal getTax() { return tax; }
    public void setTax(BigDecimal tax) { this.tax = tax; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public BigDecimal getTotalNetAmount() { return totalNetAmount; }
    public void setTotalNetAmount(BigDecimal totalNetAmount) { this.totalNetAmount = totalNetAmount; }

    public BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }

    public BigDecimal getTotalGrossAmount() { return totalGrossAmount; }
    public void setTotalGrossAmount(BigDecimal totalGrossAmount) { this.totalGrossAmount = totalGrossAmount; }

    public com.MaSoVa.shared.model.VatBreakdown getVatBreakdown() { return vatBreakdown; }
    public void setVatBreakdown(com.MaSoVa.shared.model.VatBreakdown vatBreakdown) { this.vatBreakdown = vatBreakdown; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { this.paymentTransactionId = paymentTransactionId; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public Integer getPreparationTime() { return preparationTime; }
    public void setPreparationTime(Integer preparationTime) { this.preparationTime = preparationTime; }

    public LocalDateTime getEstimatedDeliveryTime() { return estimatedDeliveryTime; }
    public void setEstimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) { this.estimatedDeliveryTime = estimatedDeliveryTime; }

    public DeliveryAddress getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(DeliveryAddress deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getAssignedDriverId() { return assignedDriverId; }
    public void setAssignedDriverId(String assignedDriverId) { this.assignedDriverId = assignedDriverId; }

    public DriverInfo getAssignedDriver() { return assignedDriver; }
    public void setAssignedDriver(DriverInfo assignedDriver) { this.assignedDriver = assignedDriver; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }
    public Integer getGuestCount() { return guestCount; }
    public void setGuestCount(Integer guestCount) { this.guestCount = guestCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }

    public LocalDateTime getPreparingStartedAt() { return preparingStartedAt; }
    public void setPreparingStartedAt(LocalDateTime preparingStartedAt) { this.preparingStartedAt = preparingStartedAt; }

    public LocalDateTime getOvenStartedAt() { return ovenStartedAt; }
    public void setOvenStartedAt(LocalDateTime ovenStartedAt) { this.ovenStartedAt = ovenStartedAt; }

    public LocalDateTime getBakedAt() { return bakedAt; }
    public void setBakedAt(LocalDateTime bakedAt) { this.bakedAt = bakedAt; }

    public LocalDateTime getReadyAt() { return readyAt; }
    public void setReadyAt(LocalDateTime readyAt) { this.readyAt = readyAt; }

    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public List<QualityCheckpoint> getQualityCheckpoints() { return qualityCheckpoints; }
    public void setQualityCheckpoints(List<QualityCheckpoint> qualityCheckpoints) { this.qualityCheckpoints = qualityCheckpoints; }

    public Integer getActualPreparationTime() { return actualPreparationTime; }
    public void setActualPreparationTime(Integer actualPreparationTime) { this.actualPreparationTime = actualPreparationTime; }

    public Integer getActualOvenTime() { return actualOvenTime; }
    public void setActualOvenTime(Integer actualOvenTime) { this.actualOvenTime = actualOvenTime; }

    public String getAssignedMakeTableStation() { return assignedMakeTableStation; }
    public void setAssignedMakeTableStation(String assignedMakeTableStation) { this.assignedMakeTableStation = assignedMakeTableStation; }

    public String getAssignedKitchenStaffId() { return assignedKitchenStaffId; }
    public void setAssignedKitchenStaffId(String assignedKitchenStaffId) { this.assignedKitchenStaffId = assignedKitchenStaffId; }

    public String getAssignedKitchenStaffName() { return assignedKitchenStaffName; }
    public void setAssignedKitchenStaffName(String assignedKitchenStaffName) { this.assignedKitchenStaffName = assignedKitchenStaffName; }

    public LocalDateTime getAssignedToKitchenAt() { return assignedToKitchenAt; }
    public void setAssignedToKitchenAt(LocalDateTime assignedToKitchenAt) { this.assignedToKitchenAt = assignedToKitchenAt; }

    public String getCreatedByStaffId() { return createdByStaffId; }
    public void setCreatedByStaffId(String createdByStaffId) { this.createdByStaffId = createdByStaffId; }

    public String getCreatedByStaffName() { return createdByStaffName; }
    public void setCreatedByStaffName(String createdByStaffName) { this.createdByStaffName = createdByStaffName; }

    public java.math.BigDecimal getTipAmountINR() { return tipAmountINR; }
    public void setTipAmountINR(java.math.BigDecimal tipAmountINR) { this.tipAmountINR = tipAmountINR; }

    public String getTipRecipientStaffId() { return tipRecipientStaffId; }
    public void setTipRecipientStaffId(String tipRecipientStaffId) { this.tipRecipientStaffId = tipRecipientStaffId; }

    public OrderSource getOrderSource() { return orderSource; }
    public void setOrderSource(OrderSource orderSource) { this.orderSource = orderSource; }

    public String getAggregatorOrderId() { return aggregatorOrderId; }
    public void setAggregatorOrderId(String aggregatorOrderId) { this.aggregatorOrderId = aggregatorOrderId; }

    public java.math.BigDecimal getAggregatorCommission() { return aggregatorCommission; }
    public void setAggregatorCommission(java.math.BigDecimal aggregatorCommission) { this.aggregatorCommission = aggregatorCommission; }

    public java.math.BigDecimal getAggregatorNetPayout() { return aggregatorNetPayout; }
    public void setAggregatorNetPayout(java.math.BigDecimal aggregatorNetPayout) { this.aggregatorNetPayout = aggregatorNetPayout; }

    // Proof of Delivery getters/setters
    public String getDeliveryOtp() { return deliveryOtp; }
    public void setDeliveryOtp(String deliveryOtp) { this.deliveryOtp = deliveryOtp; }

    public LocalDateTime getDeliveryOtpGeneratedAt() { return deliveryOtpGeneratedAt; }
    public void setDeliveryOtpGeneratedAt(LocalDateTime deliveryOtpGeneratedAt) { this.deliveryOtpGeneratedAt = deliveryOtpGeneratedAt; }

    public LocalDateTime getDeliveryOtpExpiresAt() { return deliveryOtpExpiresAt; }
    public void setDeliveryOtpExpiresAt(LocalDateTime deliveryOtpExpiresAt) { this.deliveryOtpExpiresAt = deliveryOtpExpiresAt; }

    public String getDeliveryProofType() { return deliveryProofType; }
    public void setDeliveryProofType(String deliveryProofType) { this.deliveryProofType = deliveryProofType; }

    public String getDeliveryPhotoUrl() { return deliveryPhotoUrl; }
    public void setDeliveryPhotoUrl(String deliveryPhotoUrl) { this.deliveryPhotoUrl = deliveryPhotoUrl; }

    public String getDeliverySignatureUrl() { return deliverySignatureUrl; }
    public void setDeliverySignatureUrl(String deliverySignatureUrl) { this.deliverySignatureUrl = deliverySignatureUrl; }

    public Boolean getContactlessDelivery() { return contactlessDelivery; }
    public void setContactlessDelivery(Boolean contactlessDelivery) { this.contactlessDelivery = contactlessDelivery; }

    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Order order = new Order();

        public Builder id(String id) { order.id = id; return this; }
        public Builder orderNumber(String orderNumber) { order.orderNumber = orderNumber; return this; }
        public Builder customerId(String customerId) { order.customerId = customerId; return this; }
        public Builder customerName(String customerName) { order.customerName = customerName; return this; }
        public Builder customerPhone(String customerPhone) { order.customerPhone = customerPhone; return this; }
        public Builder customerEmail(String customerEmail) { order.customerEmail = customerEmail; return this; }
        public Builder storeId(String storeId) { order.storeId = storeId; return this; }
        public Builder items(List<OrderItem> items) { order.items = items; return this; }
        public Builder subtotal(BigDecimal subtotal) { order.subtotal = subtotal; return this; }
        public Builder deliveryFee(BigDecimal deliveryFee) { order.deliveryFee = deliveryFee; return this; }
        public Builder tax(BigDecimal tax) { order.tax = tax; return this; }
        public Builder total(BigDecimal total) { order.total = total; return this; }
        public Builder status(OrderStatus status) { order.status = status; return this; }
        public Builder orderType(OrderType orderType) { order.orderType = orderType; return this; }
        public Builder paymentStatus(PaymentStatus paymentStatus) { order.paymentStatus = paymentStatus; return this; }
        public Builder paymentMethod(PaymentMethod paymentMethod) { order.paymentMethod = paymentMethod; return this; }
        public Builder priority(Priority priority) { order.priority = priority; return this; }
        public Builder preparationTime(Integer preparationTime) { order.preparationTime = preparationTime; return this; }
        public Builder estimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) { order.estimatedDeliveryTime = estimatedDeliveryTime; return this; }
        public Builder deliveryAddress(DeliveryAddress deliveryAddress) { order.deliveryAddress = deliveryAddress; return this; }
        public Builder specialInstructions(String specialInstructions) { order.specialInstructions = specialInstructions; return this; }
        public Builder receivedAt(LocalDateTime receivedAt) { order.receivedAt = receivedAt; return this; }
        public Builder qualityCheckpoints(List<QualityCheckpoint> qualityCheckpoints) { order.qualityCheckpoints = qualityCheckpoints; return this; }
        public Builder createdByStaffId(String createdByStaffId) { order.createdByStaffId = createdByStaffId; return this; }
        public Builder createdByStaffName(String createdByStaffName) { order.createdByStaffName = createdByStaffName; return this; }

        public Order build() { return order; }
    }

    // Enums
    public enum OrderStatus {
        RECEIVED,          // Initial state for all orders
        PREPARING,         // Kitchen started work
        OVEN,              // In oven (for items that need baking)
        BAKED,             // Finished baking
        READY,             // Ready for pickup/serving/dispatch
        DISPATCHED,        // Awaiting driver pickup
        OUT_FOR_DELIVERY,  // Driver assigned and en route
        DELIVERED,         // Delivered to customer (DELIVERY final state)
        SERVED,            // Served to table (DINE_IN final state)
        COMPLETED,         // Picked up by customer (TAKEAWAY final state)
        CANCELLED          // Cancelled order
    }

    public enum OrderType {
        DINE_IN,
        TAKEAWAY,
        DELIVERY
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        REFUNDED
    }

    public enum PaymentMethod {
        CASH,
        CARD,
        UPI,
        WALLET,
        AGGREGATOR_COLLECTED
    }

    public enum Priority {
        NORMAL,
        URGENT
    }

    // Nested class for driver information (not persisted, populated on-demand)
    public static class DriverInfo {
        private String id;
        private String firstName;
        private String lastName;
        private String phone;
        private String phoneNumber; // Alias for compatibility
        private String email;

        public DriverInfo() {}

        public DriverInfo(String id, String firstName, String lastName, String phone, String email) {
            this.id = id;
            this.firstName = firstName;
            this.lastName = lastName;
            this.phone = phone;
            this.phoneNumber = phone;
            this.email = email;
        }

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) {
            this.phone = phone;
            this.phoneNumber = phone;
        }

        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
            this.phone = phoneNumber;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}
