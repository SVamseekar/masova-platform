import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import axios from '../utils/axios';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface GdprRequest {
  id: string;
  requestType: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
  dueDate: string;
}

export const GdprRequests: React.FC = () => {
  const [requests, setRequests] = useState<GdprRequest[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      fetchRequests();
    }
  }, [userId]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`/api/gdpr/request/user/${userId}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleCreateRequest = async (requestType: string) => {
    setSelectedType(requestType);
    setOpenDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      await axios.post('/api/gdpr/request', {
        userId,
        requestType: selectedType,
        reason,
      });

      setMessage({ type: 'success', text: 'Request submitted successfully!' });
      setOpenDialog(false);
      setReason('');
      fetchRequests();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit request' });
    } finally {
      setLoading(false);
    }
  };

  const requestTypes = [
    {
      type: 'ACCESS',
      title: 'Access My Data',
      description: 'Download a copy of all personal data we have about you',
      icon: <VisibilityIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      type: 'RECTIFICATION',
      title: 'Update My Data',
      description: 'Request corrections to your personal information',
      icon: <EditIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      type: 'ERASURE',
      title: 'Delete My Data',
      description: 'Request deletion of your personal data (Right to be Forgotten)',
      icon: <DeleteIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
    {
      type: 'DATA_PORTABILITY',
      title: 'Export My Data',
      description: 'Receive your data in a portable, machine-readable format',
      icon: <DownloadIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      type: 'RESTRICT_PROCESSING',
      title: 'Restrict Processing',
      description: 'Limit how we use your personal data',
      icon: <SwapHorizIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="h3" fontWeight={700} gutterBottom>
        Your Data Rights (GDPR)
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Under GDPR, you have full control over your personal data. Submit a request below
        to exercise your rights. We will respond within 30 days.
      </Typography>

      {message && (
        <Alert
          severity={message.type}
          onClose={() => setMessage(null)}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <Typography variant="h5" fontWeight={600} gutterBottom mt={4}>
        Submit a New Request
      </Typography>

      <Grid container spacing={3} mb={6}>
        {requestTypes.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.type}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      color: item.color,
                      backgroundColor: `${item.color}20`,
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                    }}
                  >
                    {item.icon}
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleCreateRequest(item.type)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    backgroundColor: item.color,
                    '&:hover': {
                      backgroundColor: item.color,
                      filter: 'brightness(0.9)',
                    },
                  }}
                >
                  Submit Request
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" fontWeight={600} gutterBottom mt={6}>
        My Request History
      </Typography>

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary">
            No requests submitted yet
          </Typography>
        </Paper>
      ) : (
        <List>
          {requests.map((request) => (
            <Paper key={request.id} sx={{ mb: 2, p: 3, borderRadius: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Request Type
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {request.requestType.replace('_', ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Chip
                    label={request.status}
                    color={getStatusColor(request.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted
                  </Typography>
                  <Typography variant="body2">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(request.dueDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  {request.completedAt && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        {new Date(request.completedAt).toLocaleDateString()}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Paper>
          ))}
        </List>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedType && requestTypes.find((t) => t.type === selectedType)?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please provide a reason for your request (optional but helpful for processing):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason (Optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Alert severity="info" sx={{ mt: 3 }}>
            We will process your request within 30 days as required by GDPR. You will receive
            a confirmation email shortly.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
