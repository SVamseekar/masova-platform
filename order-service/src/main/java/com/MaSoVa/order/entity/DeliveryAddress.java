package com.MaSoVa.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryAddress {

    private String street;
    private String city;
    private String state;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private String landmark;
}
