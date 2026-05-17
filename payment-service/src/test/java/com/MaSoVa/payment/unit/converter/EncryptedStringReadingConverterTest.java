package com.MaSoVa.payment.unit.converter;

import com.MaSoVa.payment.converter.EncryptedStringReadingConverter;
import com.MaSoVa.payment.service.PiiEncryptionService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class EncryptedStringReadingConverterTest {

    @Test
    void convert_returnsSourceUnchanged() {
        PiiEncryptionService encryptionService = mock(PiiEncryptionService.class);
        EncryptedStringReadingConverter converter = new EncryptedStringReadingConverter(encryptionService);

        String result = converter.convert("some-value");

        assertThat(result).isEqualTo("some-value");
    }

    @Test
    void convert_returnsEmptyStringUnchanged() {
        PiiEncryptionService encryptionService = mock(PiiEncryptionService.class);
        EncryptedStringReadingConverter converter = new EncryptedStringReadingConverter(encryptionService);

        String result = converter.convert("");

        assertThat(result).isEmpty();
    }
}
