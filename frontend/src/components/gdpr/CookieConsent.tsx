import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CookieConsent: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setOpen(true);
    } else {
      try {
        setPreferences(JSON.parse(consent));
      } catch (error) {
        setOpen(true);
      }
    }
  }, []);

  const handleAcceptAll = async () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };

    await saveConsent(allAccepted);
    setPreferences(allAccepted);
    localStorage.setItem('cookie_consent', JSON.stringify(allAccepted));
    setOpen(false);
  };

  const handleRejectAll = async () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };

    await saveConsent(onlyNecessary);
    setPreferences(onlyNecessary);
    localStorage.setItem('cookie_consent', JSON.stringify(onlyNecessary));
    setOpen(false);
  };

  const handleSavePreferences = async () => {
    await saveConsent(preferences);
    localStorage.setItem('cookie_consent', JSON.stringify(preferences));
    setOpen(false);
    setShowDetails(false);
  };

  const saveConsent = async (prefs: CookiePreferences) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      if (prefs.analytics) {
        await axios.post('/api/gdpr/consent/grant', {
          userId,
          consentType: 'ANALYTICS_TRACKING',
          version: '1.0',
          consentText: 'User consented to analytics tracking',
        });
      }

      if (prefs.marketing) {
        await axios.post('/api/gdpr/consent/grant', {
          userId,
          consentType: 'MARKETING_COMMUNICATIONS',
          version: '1.0',
          consentText: 'User consented to marketing communications',
        });
      }

      if (prefs.functional) {
        await axios.post('/api/gdpr/consent/grant', {
          userId,
          consentType: 'PERSONALIZATION',
          version: '1.0',
          consentText: 'User consented to personalization features',
        });
      }
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  };

  const handlePreferenceChange = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return;

    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!open) return null;

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 3,
          zIndex: 9999,
          borderRadius: '16px 16px 0 0',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Box maxWidth="1200px" mx="auto">
          <Typography variant="h6" gutterBottom fontWeight={600}>
            🍪 We Value Your Privacy
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            We use cookies and similar technologies to enhance your browsing experience,
            personalize content, and analyze our traffic. We comply with GDPR and respect
            your privacy choices.{' '}
            <Link
              component="button"
              onClick={() => navigate('/privacy-policy')}
              sx={{ textDecoration: 'none' }}
            >
              Read our Privacy Policy
            </Link>
          </Typography>

          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={handleAcceptAll}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Accept All
            </Button>
            <Button
              variant="outlined"
              onClick={handleRejectAll}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Reject All
            </Button>
            <Button
              variant="text"
              onClick={() => setShowDetails(true)}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Customize
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Cookie Preferences</DialogTitle>
        <DialogContent>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.necessary}
                  disabled
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Necessary Cookies (Always Active)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Essential for the website to function properly. Cannot be disabled.
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.functional}
                  onChange={() => handlePreferenceChange('functional')}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Functional Cookies
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enable personalized features and remember your preferences.
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.analytics}
                  onChange={() => handlePreferenceChange('analytics')}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Analytics Cookies
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Help us understand how you use our website to improve your experience.
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.marketing}
                  onChange={() => handlePreferenceChange('marketing')}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Marketing Cookies
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used to show you relevant advertisements and promotional content.
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePreferences}>
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
