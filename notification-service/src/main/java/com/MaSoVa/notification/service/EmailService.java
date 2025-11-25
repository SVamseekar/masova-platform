package com.MaSoVa.notification.service;

import com.MaSoVa.notification.config.SendGridConfig;
import com.MaSoVa.notification.entity.Notification;
import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final SendGridConfig sendGridConfig;

    public EmailService(SendGridConfig sendGridConfig) {
        this.sendGridConfig = sendGridConfig;
    }

    public boolean sendEmail(Notification notification) {
        if (!sendGridConfig.isEnabled()) {
            logger.warn("SendGrid is disabled, email not sent");
            return false;
        }

        try {
            String toEmail = notification.getRecipientEmail();
            if (toEmail == null || toEmail.isEmpty()) {
                logger.error("Recipient email is missing");
                return false;
            }

            Email from = new Email(sendGridConfig.getFromEmail(), sendGridConfig.getFromName());
            Email to = new Email(toEmail);
            String subject = notification.getTitle();
            Content content = new Content("text/html", notification.getMessage());

            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridConfig.getApiKey());
            Request request = new Request();

            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.info("Email sent successfully to {}", toEmail);
                return true;
            } else {
                logger.error("Failed to send email. Status: {}, Body: {}",
                    response.getStatusCode(), response.getBody());
                return false;
            }

        } catch (IOException e) {
            logger.error("Failed to send email: {}", e.getMessage(), e);
            return false;
        }
    }

    public boolean sendBulkEmail(String[] emails, String subject, String content) {
        if (!sendGridConfig.isEnabled()) {
            logger.warn("SendGrid is disabled, bulk email not sent");
            return false;
        }

        int successCount = 0;
        for (String emailAddress : emails) {
            try {
                Email from = new Email(sendGridConfig.getFromEmail(), sendGridConfig.getFromName());
                Email to = new Email(emailAddress);
                Content emailContent = new Content("text/html", content);

                Mail mail = new Mail(from, subject, to, emailContent);

                SendGrid sg = new SendGrid(sendGridConfig.getApiKey());
                Request request = new Request();

                request.setMethod(Method.POST);
                request.setEndpoint("mail/send");
                request.setBody(mail.build());

                Response response = sg.api(request);

                if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                    logger.info("Bulk email sent successfully to {}", emailAddress);
                    successCount++;
                } else {
                    logger.error("Failed to send bulk email to {}. Status: {}",
                        emailAddress, response.getStatusCode());
                }

            } catch (IOException e) {
                logger.error("Failed to send bulk email to {}: {}", emailAddress, e.getMessage());
            }
        }

        logger.info("Bulk email completed: {}/{} successful", successCount, emails.length);
        return successCount > 0;
    }

    public boolean sendTemplateEmail(String toEmail, String subject, String htmlContent) {
        if (!sendGridConfig.isEnabled()) {
            logger.warn("SendGrid is disabled, template email not sent");
            return false;
        }

        try {
            Email from = new Email(sendGridConfig.getFromEmail(), sendGridConfig.getFromName());
            Email to = new Email(toEmail);
            Content content = new Content("text/html", htmlContent);

            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(sendGridConfig.getApiKey());
            Request request = new Request();

            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            return response.getStatusCode() >= 200 && response.getStatusCode() < 300;

        } catch (IOException e) {
            logger.error("Failed to send template email: {}", e.getMessage(), e);
            return false;
        }
    }
}
