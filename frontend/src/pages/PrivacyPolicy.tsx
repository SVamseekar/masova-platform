import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';
import StorageIcon from '@mui/icons-material/Storage';
import ShareIcon from '@mui/icons-material/Share';
import LockIcon from '@mui/icons-material/Lock';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h3" fontWeight={700}>
            Privacy Policy
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Last Updated:</strong> January 1, 2025
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Effective Date:</strong> January 1, 2025
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          <GavelIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          1. Introduction
        </Typography>
        <Typography variant="body1" paragraph>
          MaSoVa Restaurant Management System ("we", "our", or "us") is committed to
          protecting your privacy and complying with the General Data Protection Regulation
          (GDPR) and other applicable data protection laws. This Privacy Policy explains how
          we collect, use, store, and protect your personal data.
        </Typography>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          2. Data Controller Information
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Data Controller:</strong> MaSoVa Restaurant Management System
          <br />
          <strong>Contact Email:</strong> privacy@masova.com
          <br />
          <strong>Data Protection Officer:</strong> dpo@masova.com
          <br />
          <strong>Address:</strong> [Your Business Address]
        </Typography>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          3. Personal Data We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          We collect and process the following categories of personal data:
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Account Information"
              secondary="Name, email address, phone number, password (encrypted)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Order Information"
              secondary="Order history, delivery addresses, payment information"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Usage Data"
              secondary="IP address, browser type, device information, pages visited"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Communication Data"
              secondary="Customer support messages, feedback, reviews"
            />
          </ListItem>
        </List>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          4. Legal Basis for Processing
        </Typography>
        <Typography variant="body1" paragraph>
          We process your personal data on the following legal bases:
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="• Contract Performance: To provide our services and fulfill orders" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Legitimate Interest: To improve our services and prevent fraud" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Legal Obligation: To comply with tax and regulatory requirements" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Consent: For marketing communications and analytics (where applicable)" />
          </ListItem>
        </List>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          5. How We Use Your Data
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="• Process and fulfill your orders" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Communicate with you about your orders and account" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Improve our services and user experience" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Send marketing communications (with your consent)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Comply with legal obligations" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Prevent fraud and ensure security" />
          </ListItem>
        </List>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          <ShareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          6. Data Sharing and Third Parties
        </Typography>
        <Typography variant="body1" paragraph>
          We may share your data with:
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Payment Processors"
              secondary="To process payments securely (e.g., Razorpay, Stripe)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Delivery Partners"
              secondary="To fulfill delivery orders"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Cloud Service Providers"
              secondary="For secure data storage and hosting"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Analytics Providers"
              secondary="To understand usage patterns (with your consent)"
            />
          </ListItem>
        </List>
        <Typography variant="body1" paragraph>
          We ensure all third parties comply with GDPR through Data Processing Agreements (DPAs).
        </Typography>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          7. Your GDPR Rights
        </Typography>
        <Typography variant="body1" paragraph>
          Under GDPR, you have the following rights:
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Right to Access"
              secondary="Request a copy of your personal data"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Right to Rectification"
              secondary="Correct inaccurate or incomplete data"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Right to Erasure (Right to be Forgotten)"
              secondary="Request deletion of your personal data"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Right to Data Portability"
              secondary="Receive your data in a machine-readable format"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Right to Restrict Processing"
              secondary="Limit how we use your data"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Right to Object"
              secondary="Object to processing based on legitimate interests"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Right to Withdraw Consent"
              secondary="Withdraw consent for data processing at any time"
            />
          </ListItem>
        </List>

        <Box mt={3}>
          <Button
            variant="contained"
            onClick={() => navigate('/gdpr-requests')}
            sx={{ mr: 2, borderRadius: 3, textTransform: 'none' }}
          >
            Manage My Data
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/contact')}
            sx={{ borderRadius: 3, textTransform: 'none' }}
          >
            Contact DPO
          </Button>
        </Box>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          8. Data Retention
        </Typography>
        <Typography variant="body1" paragraph>
          We retain your personal data only for as long as necessary:
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="• Account data: Until account deletion + 30 days" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Order history: 7 years (tax and legal requirements)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Marketing consents: 2 years from last interaction" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Audit logs: 6 years (compliance requirements)" />
          </ListItem>
        </List>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          9. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We implement industry-standard security measures including:
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="• End-to-end encryption for data transmission" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Encrypted storage for sensitive data" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Regular security audits and penetration testing" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Access controls and authentication" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Data breach notification procedures" />
          </ListItem>
        </List>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          10. International Data Transfers
        </Typography>
        <Typography variant="body1" paragraph>
          Your data may be transferred outside the European Economic Area (EEA). We ensure
          adequate protection through:
        </Typography>
        <List>
          <ListItem>
            <ListItemText primary="• Standard Contractual Clauses (SCCs)" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Adequacy decisions by the European Commission" />
          </ListItem>
          <ListItem>
            <ListItemText primary="• Data Processing Agreements with third parties" />
          </ListItem>
        </List>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          11. Cookies and Tracking
        </Typography>
        <Typography variant="body1" paragraph>
          We use cookies and similar technologies. You can manage your cookie preferences
          through our cookie consent banner or in your browser settings.
        </Typography>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          12. Children's Privacy
        </Typography>
        <Typography variant="body1" paragraph>
          Our services are not intended for children under 16. We do not knowingly collect
          data from children.
        </Typography>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          13. Changes to This Policy
        </Typography>
        <Typography variant="body1" paragraph>
          We may update this Privacy Policy from time to time. We will notify you of
          significant changes via email or through our platform.
        </Typography>

        <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
          14. Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          For privacy-related questions or to exercise your rights:
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Email:</strong> privacy@masova.com
          <br />
          <strong>Data Protection Officer:</strong> dpo@masova.com
          <br />
          <strong>Supervisory Authority:</strong> You have the right to lodge a complaint
          with your local data protection authority.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Box textAlign="center" mt={4}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/')}
            sx={{ borderRadius: 3, textTransform: 'none', px: 4 }}
          >
            Return to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
