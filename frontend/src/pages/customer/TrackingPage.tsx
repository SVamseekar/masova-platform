import React from 'react';
import { Container, Typography, Box, Button, Card, CardContent, Stepper, Step, StepLabel, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAppSelector } from '../../store/hooks';

interface TrackingPageProps {
  onBackToMenu: () => void;
}

const TrackingPage: React.FC<TrackingPageProps> = ({ onBackToMenu }) => {
  const currentUser = useAppSelector(state => state.auth.user);

  // Mock order tracking data - in real app, this would come from API
  const orderSteps = [
    { label: 'Order Placed', completed: true },
    { label: 'Preparing', completed: true },
    { label: 'In Oven', completed: false },
    { label: 'Ready for Pickup/Delivery', completed: false },
    { label: 'Delivered', completed: false },
  ];

  const activeStep = orderSteps.findIndex(step => !step.completed);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Alert severity="success" sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold">Order Placed Successfully!</Typography>
        <Typography>Your order has been received and is being prepared.</Typography>
      </Alert>

      <Card>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Track Your Order</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Order #12345 • Estimated delivery: 30-35 mins
          </Typography>

          <Stepper activeStep={activeStep} orientation="vertical">
            {orderSteps.map((step, index) => (
              <Step key={step.label} completed={step.completed}>
                <StepLabel
                  StepIconComponent={() => (
                    step.completed ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: 2,
                          borderColor: index === activeStep ? 'primary.main' : 'grey.300',
                          bgcolor: index === activeStep ? 'primary.main' : 'transparent'
                        }}
                      />
                    )
                  )}
                >
                  <Typography variant="h6">{step.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.completed ? 'Completed' : index === activeStep ? 'In Progress' : 'Pending'}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Thank you for ordering with MaSoVa!
            </Typography>
            <Button variant="contained" size="large" onClick={onBackToMenu}>
              Order More
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TrackingPage;
