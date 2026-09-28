package com.MaSoVa.payment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions.BigDecimalRepresentation;

/**
 * Store BigDecimal money as Decimal128, as MongoDB recommends for monetary data.
 * The Spring Data default is a string, which breaks $inc and numeric $expr comparisons.
 */
@Configuration
public class PaymentMongoConfig {

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return MongoCustomConversions.create(adapter -> adapter.bigDecimal(BigDecimalRepresentation.DECIMAL128));
    }
}
