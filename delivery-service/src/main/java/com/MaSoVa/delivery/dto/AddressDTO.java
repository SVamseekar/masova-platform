package com.MaSoVa.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Address DTO with coordinates
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressDTO {

    private String street;
    private String city;
    private String state;
    private String zipCode;
    private Double latitude;
    private Double longitude;

    public String getFullAddress() {
        return String.format("%s, %s, %s %s", street, city, state, zipCode);
    }
}
