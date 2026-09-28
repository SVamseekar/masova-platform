package com.MaSoVa.core.notification.service;

import com.MaSoVa.core.notification.config.TwilioConfig;
import com.MaSoVa.core.notification.entity.Notification;
import com.twilio.exception.TwilioException;
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

            // This is a multi-country platform (India + 12 EU countries) with no reliable way to
            // guess the right calling code here — silently defaulting to any one country (the old
            // code assumed US) would misdial for every other country, so reject instead.
            //
            // NOTE: registration-side validation (UserCreateRequest, CreateCustomerRequest,
            // Customer, UpdateCustomerRequest — all "^\+?[1-9]\d{6,14}$") makes the leading "+"
            // OPTIONAL, so this branch is reachable for legitimately-registered users, not just
            // bad/legacy data. Tightening that regex to require "+" is the real fix; not done
            // here since it touches registration/customer-update validation used by the frontend
            // and mobile apps, whose current phone-input behavior (with vs. without "+") wasn't
            // verified — a rejection here is logged and recoverable (resend once the number is
            // corrected), whereas a wrong validation tightening could reject valid signups.
            if (!toPhone.startsWith("+")) {
                logger.error("Cannot send SMS to userId={}: recipient phone is not in E.164 format "
                        + "(missing country code): {}", notification.getUserId(), toPhone);
                return false;
            }

            Message message = Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(twilioConfig.getPhoneNumber()),
                    notification.getMessage()
            ).create();

            logger.info("SMS sent successfully to {} with SID: {}", toPhone, message.getSid());
            return true;

        } catch (TwilioException e) {
            // A genuine Twilio-side failure (rejected number, account/config issue, connection
            // error) — expected to happen occasionally, handled by returning false. Anything else
            // (e.g. a bug in this method) is left to propagate so NotificationService's own
            // catch attributes it properly instead of this swallowing it as a generic SMS failure.
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
                    // See sendSms's note: this can be a legitimately-registered number, not just
                    // bad data — registration validation doesn't require a leading "+" today.
                    logger.error("Skipping bulk SMS recipient not in E.164 format (missing country code): {}", toPhone);
                    continue;
                }

                Message msg = Message.creator(
                        new PhoneNumber(toPhone),
                        new PhoneNumber(twilioConfig.getPhoneNumber()),
                        message
                ).create();

                logger.info("Bulk SMS sent to {} with SID: {}", toPhone, msg.getSid());
                successCount++;

            } catch (TwilioException e) {
                logger.error("Failed to send bulk SMS to {}: {}", phoneNumber, e.getMessage());
            }
        }

        logger.info("Bulk SMS completed: {}/{} successful", successCount, phoneNumbers.length);
        return successCount > 0;
    }
}
