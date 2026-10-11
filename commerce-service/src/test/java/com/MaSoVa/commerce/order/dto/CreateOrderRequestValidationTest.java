package com.MaSoVa.commerce.order.dto;

import com.MaSoVa.commerce.order.entity.Order.OrderType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CreateOrderRequest item validation")
class CreateOrderRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private CreateOrderRequest.OrderItemRequest item(String name, String notes) {
        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("menu-1");
        item.setName(name);
        item.setQuantity(1);
        item.setPrice(8.90);
        item.setNotes(notes);
        return item;
    }

    private Set<String> itemViolations(CreateOrderRequest.OrderItemRequest item) {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setItems(List.of(item));
        request.setOrderType(OrderType.TAKEAWAY);
        return validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .filter(path -> path.startsWith("items["))
                .collect(java.util.stream.Collectors.toSet());
    }

    @Test
    @DisplayName("accepts an item with a short kitchen note")
    void acceptsShortNote() {
        assertThat(itemViolations(item("Masala Dosa", "Spice: medium. No onions"))).isEmpty();
    }

    @Test
    @DisplayName("rejects a kitchen note longer than 200 characters")
    void rejectsLongNote() {
        assertThat(itemViolations(item("Masala Dosa", "x".repeat(201)))).containsExactly("items[0].notes");
    }

    @Test
    @DisplayName("rejects an item without a name, because item constraints now cascade")
    void rejectsMissingName() {
        assertThat(itemViolations(item(" ", null))).containsExactly("items[0].name");
    }
}
