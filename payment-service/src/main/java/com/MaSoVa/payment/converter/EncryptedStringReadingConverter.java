package com.MaSoVa.payment.converter;

import com.MaSoVa.payment.service.PiiEncryptionService;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

/**
 * MongoDB reading converter for encrypted PII fields.
 * Automatically decrypts values when reading from database.
 *
 * Note: This converter is not used directly - encryption is handled
 * via the EncryptedPiiField wrapper class for type safety.
 */
@Component
@ReadingConverter
public class EncryptedStringReadingConverter implements Converter<String, String> {

    @SuppressWarnings("unused")
    private final PiiEncryptionService encryptionService;

    public EncryptedStringReadingConverter(PiiEncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    @Override
    public String convert(@NonNull String source) {
        // Don't auto-convert all strings - only specific fields should be encrypted
        // This converter exists as a utility but actual encryption/decryption
        // is handled explicitly in the service layer
        return source;
    }
}
