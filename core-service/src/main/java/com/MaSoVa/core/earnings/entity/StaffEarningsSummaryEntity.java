package com.MaSoVa.core.earnings.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "staff_earnings_summary",
    schema = "core_schema",
    uniqueConstraints = @UniqueConstraint(name = "uq_earnings_employee_week", columnNames = {"employee_id", "week_start"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffEarningsSummaryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "employee_id", nullable = false, length = 36)
    private String employeeId;

    @Column(name = "store_id", nullable = false, length = 36)
    private String storeId;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "week_end", nullable = false)
    private LocalDate weekEnd;

    @Builder.Default
    @Column(name = "hours_worked", nullable = false, precision = 6, scale = 2)
    private BigDecimal hoursWorked = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "base_pay_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePayInr = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tips_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal tipsInr = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Version
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
    }

    public BigDecimal getTotalInr() {
        return basePayInr.add(tipsInr);
    }
}
