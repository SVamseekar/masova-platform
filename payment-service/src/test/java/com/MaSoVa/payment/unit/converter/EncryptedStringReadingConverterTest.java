package com.MaSoVa.payment.unit.converter;

import com.MaSoVa.payment.converter.EncryptedStringReadingConverter;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EncryptedStringReadingConverterTest {

    private final EncryptedStringReadingConverter converter = new EncryptedStringReadingConverter();

    @Test
    void convert_returnsSourceUnchanged() {
        String result = converter.convert("some-value");

        assertThat(result).isEqualTo("some-value");
    }

    @Test
    void convert_returnsEmptyStringUnchanged() {
        String result = converter.convert("");

        assertThat(result).isEmpty();
    }
}
