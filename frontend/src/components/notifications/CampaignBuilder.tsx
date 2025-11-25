import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Alert,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useScheduleCampaignMutation,
  Campaign,
  NotificationChannel,
  SegmentType,
} from '../../store/api/notificationApi';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { useAppSelector } from '../../store/hooks';

interface CampaignBuilderProps {
  campaign?: Campaign | null;
  onClose: () => void;
}

const CampaignBuilder: React.FC<CampaignBuilderProps> = ({ campaign, onClose }) => {
  const user = useAppSelector((state) => state.auth.user);

  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState<NotificationChannel>(NotificationChannel.EMAIL);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [segmentType, setSegmentType] = useState<SegmentType>(SegmentType.ALL_CUSTOMERS);
  const [scheduledFor, setScheduledFor] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [createCampaign, { isLoading: isCreating }] = useCreateCampaignMutation();
  const [updateCampaign, { isLoading: isUpdating }] = useUpdateCampaignMutation();
  const [scheduleCampaign, { isLoading: isScheduling }] = useScheduleCampaignMutation();

  const steps = ['Campaign Details', 'Message Content', 'Target Audience', 'Schedule & Send'];

  // Load campaign data if editing
  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setDescription(campaign.description);
      setChannel(campaign.channel);
      setSubject(campaign.subject);
      setMessage(campaign.message);
      setSegmentType(campaign.segment?.type || SegmentType.ALL_CUSTOMERS);
      if (campaign.scheduledFor) {
        setScheduledFor(campaign.scheduledFor);
        setSendImmediately(false);
      }
    }
  }, [campaign]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!name.trim()) newErrors.name = 'Campaign name is required';
        if (!description.trim()) newErrors.description = 'Description is required';
        break;
      case 1:
        if (channel === NotificationChannel.EMAIL && !subject.trim()) {
          newErrors.subject = 'Subject is required for email campaigns';
        }
        if (!message.trim()) newErrors.message = 'Message is required';
        if (message.length < 10) newErrors.message = 'Message must be at least 10 characters';
        break;
      case 2:
        // Segment validation (if needed)
        break;
      case 3:
        if (!sendImmediately && !scheduledFor) {
          newErrors.scheduledFor = 'Please select a date and time or choose to send immediately';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSaveDraft = async () => {
    try {
      const campaignData = {
        name,
        description,
        channel,
        subject,
        message,
        segment: { type: segmentType },
        createdBy: user?.id || '',
      };

      if (campaign) {
        await updateCampaign({ id: campaign.id, campaign: campaignData }).unwrap();
      } else {
        await createCampaign(campaignData).unwrap();
      }

      onClose();
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    try {
      const campaignData = {
        name,
        description,
        channel,
        subject,
        message,
        segment: { type: segmentType },
        createdBy: user?.id || '',
      };

      let campaignId = campaign?.id;

      if (!campaignId) {
        const newCampaign = await createCampaign(campaignData).unwrap();
        campaignId = newCampaign.id;
      } else {
        await updateCampaign({ id: campaignId, campaign: campaignData }).unwrap();
      }

      if (sendImmediately) {
        // Campaign will be executed immediately (handled by backend)
        await scheduleCampaign({ id: campaignId, scheduledFor: new Date().toISOString() }).unwrap();
      } else if (scheduledFor) {
        await scheduleCampaign({ id: campaignId, scheduledFor }).unwrap();
      }

      onClose();
    } catch (error) {
      console.error('Failed to create/schedule campaign:', error);
    }
  };

  const getChannelIcon = (ch: NotificationChannel) => {
    switch (ch) {
      case NotificationChannel.SMS:
        return '📱';
      case NotificationChannel.EMAIL:
        return '📧';
      case NotificationChannel.PUSH:
        return '🔔';
      case NotificationChannel.IN_APP:
        return '💬';
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              label="Campaign Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  ...createNeumorphicSurface('inset', 'sm', 'md'),
                },
              }}
            />
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              multiline
              rows={3}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  ...createNeumorphicSurface('inset', 'sm', 'md'),
                },
              }}
            />
            <FormControl
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  ...createNeumorphicSurface('inset', 'sm', 'md'),
                },
              }}
            >
              <InputLabel>Channel</InputLabel>
              <Select value={channel} onChange={(e) => setChannel(e.target.value as NotificationChannel)} label="Channel">
                {Object.values(NotificationChannel).map((ch) => (
                  <MenuItem key={ch} value={ch}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{getChannelIcon(ch)}</span>
                      <span>{ch}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            {channel === NotificationChannel.EMAIL && (
              <TextField
                fullWidth
                label="Email Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                error={!!errors.subject}
                helperText={errors.subject}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    ...createNeumorphicSurface('inset', 'sm', 'md'),
                  },
                }}
              />
            )}
            <TextField
              fullWidth
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              error={!!errors.message}
              helperText={errors.message || `${message.length} characters`}
              multiline
              rows={8}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  ...createNeumorphicSurface('inset', 'sm', 'md'),
                },
              }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                You can use placeholders like {'{customerName}'}, {'{orderNumber}'}, etc.
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Select Target Audience
            </Typography>
            <RadioGroup value={segmentType} onChange={(e) => setSegmentType(e.target.value as SegmentType)}>
              {Object.values(SegmentType).map((type) => (
                <FormControlLabel
                  key={type}
                  value={type}
                  control={<Radio sx={{ color: '#e53e3e', '&.Mui-checked': { color: '#e53e3e' } }} />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {type.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getSegmentDescription(type)}
                      </Typography>
                    </Box>
                  }
                  sx={{
                    ...createNeumorphicSurface('flat', 'sm', 'md'),
                    p: 2,
                    mb: 2,
                    borderRadius: '12px',
                    '&:hover': {
                      backgroundColor: '#fafafa',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Schedule Campaign
            </Typography>

            <RadioGroup value={sendImmediately ? 'immediate' : 'scheduled'} onChange={(e) => setSendImmediately(e.target.value === 'immediate')}>
              <FormControlLabel
                value="immediate"
                control={<Radio sx={{ color: '#e53e3e', '&.Mui-checked': { color: '#e53e3e' } }} />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Send Immediately
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Campaign will be sent as soon as you click "Send Campaign"
                    </Typography>
                  </Box>
                }
                sx={{
                  ...createNeumorphicSurface('flat', 'sm', 'md'),
                  p: 2,
                  mb: 2,
                  borderRadius: '12px',
                }}
              />
              <FormControlLabel
                value="scheduled"
                control={<Radio sx={{ color: '#e53e3e', '&.Mui-checked': { color: '#e53e3e' } }} />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Schedule for Later
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Choose a specific date and time
                    </Typography>
                  </Box>
                }
                sx={{
                  ...createNeumorphicSurface('flat', 'sm', 'md'),
                  p: 2,
                  mb: 2,
                  borderRadius: '12px',
                }}
              />
            </RadioGroup>

            {!sendImmediately && (
              <TextField
                fullWidth
                type="datetime-local"
                label="Schedule Date & Time"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                error={!!errors.scheduledFor}
                helperText={errors.scheduledFor}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().slice(0, 16),
                }}
                sx={{
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    ...createNeumorphicSurface('inset', 'sm', 'md'),
                  },
                }}
              />
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ ...createNeumorphicSurface('flat', 'md', 'lg'), p: 3, backgroundColor: '#f9fafb' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Campaign Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Channel:
                  </Typography>
                  <Chip
                    label={channel}
                    size="small"
                    sx={{
                      backgroundColor: '#e53e3e',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Audience:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {segmentType.replace(/_/g, ' ')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const getSegmentDescription = (type: SegmentType): string => {
    switch (type) {
      case SegmentType.ALL_CUSTOMERS:
        return 'Send to all registered customers';
      case SegmentType.NEW_CUSTOMERS:
        return 'Customers who registered in the last 30 days';
      case SegmentType.FREQUENT_CUSTOMERS:
        return 'Customers with 5+ orders in the last 90 days';
      case SegmentType.INACTIVE_CUSTOMERS:
        return 'Customers with no orders in the last 90 days';
      case SegmentType.HIGH_VALUE_CUSTOMERS:
        return 'Customers with total spend over $500';
      case SegmentType.CUSTOM:
        return 'Define custom filters';
      default:
        return '';
    }
  };

  return (
    <>
      <DialogTitle>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {campaign ? 'Edit Campaign' : 'Create New Campaign'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ minHeight: 400 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveDraft}
          disabled={isCreating || isUpdating}
          startIcon={<SaveIcon />}
          sx={{
            textTransform: 'none',
            color: '#666666',
          }}
        >
          Save Draft
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} startIcon={<BackIcon />} sx={{ textTransform: 'none' }}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            endIcon={<NextIcon />}
            variant="contained"
            sx={{
              ...createNeumorphicSurface('raised', 'sm', 'md'),
              backgroundColor: '#e53e3e',
              color: 'white',
              textTransform: 'none',
              border: 'none',
              '&:hover': {
                backgroundColor: '#c02e2e',
              },
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isUpdating || isScheduling}
            startIcon={sendImmediately ? <SendIcon /> : <ScheduleIcon />}
            variant="contained"
            sx={{
              ...createNeumorphicSurface('raised', 'sm', 'md'),
              backgroundColor: '#e53e3e',
              color: 'white',
              textTransform: 'none',
              border: 'none',
              '&:hover': {
                backgroundColor: '#c02e2e',
              },
            }}
          >
            {sendImmediately ? 'Send Campaign' : 'Schedule Campaign'}
          </Button>
        )}
      </DialogActions>
    </>
  );
};

export default CampaignBuilder;
