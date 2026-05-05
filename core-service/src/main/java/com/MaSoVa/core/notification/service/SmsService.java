package com.MaSoVa.core.notification.service;

import com.MaSoVa.core.notification.config.TwilioConfig;
import com.MaSoVa.core.notification.entity.Notification;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SmsService {
    private static final Logger logger = LoggerFactory.getLogger(SmsService.class);

    private final TwilioConfig twilioConfig;

    public SmsService(TwilioConfig twilioConfig) {
        this.twilioConfig = twilioConfig;
    }

    public boolean sendSms(Notification notification) {
        if (!twilioConfig.isEnabled()) {
            logger.warn("Twilio is disabled, SMS not sent - marking as skipped");
            return true; // Return true to prevent retries when service is intentionally disabled
        }

        try {
            String toPhone = notification.getRecipientPhone();
            if (toPhone == null || toPhone.isEmpty()) {
                logger.error("Recipient phone number is missing");
                return false;
            }

            // Ensure phone number is in E.164 format
            if (!toPhone.startsWith("+")) {
                toPhone = "+1" + toPhone; // Default to US if no country code
            }

            Message message = Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(twilioConfig.getPhoneNumber()),
                    notification.getMessage()
            ).create();

            logger.info("SMS sent successfully to {} with SID: {}", toPhone, message.getSid());
            return true;

        } catch (Exception e) {
            logger.error("Failed to send SMS: {}", e.getMessage(), e);
            return false;
        }
    }

    public boolean sendBulkSms(String[] phoneNumbers, String message) {
        if (!twilioConfig.isEnabled()) {
            logger.warn("Twilio is disabled, bulk SMS not sent - marking as skipped");
            return true; // Return true to prevent retries when service is intentionally disabled
        }

        int successCount = 0;
        for (String phoneNumber : phoneNumbers) {
            try {
                String toPhone = phoneNumber;
                if (!toPhone.startsWith("+")) {
                    toPhone = "+1" + toPhone;
                }

                Message msg = Message.creator(
                        new PhoneNumber(toPhone),
                        new PhoneNumber(twilioConfig.getPhoneNumber()),
                        message
                ).create();

                logger.info("Bulk SMS sent to {} with SID: {}", toPhone, msg.getSid());
                successCount++;

            } catch (Exception e) {
                logger.error("Failed to send bulk SMS to {}: {}", phoneNumber, e.getMessage());
            }
        }

        logger.info("Bulk SMS completed: {}/{} successful", successCount, phoneNumbers.length);
        return successCount > 0;
    }
}
