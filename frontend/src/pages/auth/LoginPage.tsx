import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { User } from '../../types/user';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const validationSchema = yup.object({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue 
  } = useForm<LoginFormData>({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      dispatch(loginStart());
      
      // Mock API call - replace with actual UserService.login(data)
      const mockResponse: LoginResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          type: data.email.includes('manager') ? 'MANAGER' : 
                data.email.includes('staff') ? 'STAFF' :
                data.email.includes('driver') ? 'DRIVER' : 'CUSTOMER',
          name: data.email.split('@')[0].replace('.', ' '),
          email: data.email,
          phone: '+91 9876543210',
          storeId: 'store-1',
          createdAt: new Date().toISOString(),
          isActive: true,
        }
      };
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(loginSuccess({
        accessToken: mockResponse.accessToken,
        refreshToken: mockResponse.refreshToken,
        user: mockResponse.user,
      }));

      // Navigate based on user role
      switch (mockResponse.user.type) {
        case 'CUSTOMER':
          navigate('/customer');
          break;
        case 'MANAGER':
        case 'ASSISTANT_MANAGER':
          navigate('/manager');
          break;
        case 'STAFF':
          navigate('/kitchen');
          break;
        case 'DRIVER':
          navigate('/driver');
          break;
        default:
          navigate('/customer');
      }
    } catch (error: any) {
      dispatch(loginFailure(error.message || 'Login failed'));
    }
  };

  // Demo accounts for testing
  const demoAccounts = [
    { type: 'Manager', email: 'manager@dominos.com', password: 'manager123' },
    { type: 'Staff', email: 'staff@dominos.com', password: 'staff123' },
    { type: 'Customer', email: 'customer@dominos.com', password: 'customer123' },
    { type: 'Driver', email: 'driver@dominos.com', password: 'driver123' },
  ];

  const handleDemoLogin = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
    onSubmit({ email, password });
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Demo Accounts */}
          <Grid item xs={12} md={6}>
            <Box sx={{ pr: { md: 4 } }}>
              <Typography variant="h3" component="h1" gutterBottom color="primary" fontWeight="bold">
                Domino's Restaurant Management System
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                Comprehensive restaurant operations platform with role-based access control
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Demo Accounts
              </Typography>
              <Grid container spacing={2}>
                {demoAccounts.map((account) => (
                  <Grid item xs={12} sm={6} key={account.type}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { 
                          boxShadow: 2,
                          borderColor: 'primary.main'
                        }
                      }}
                      onClick={() => handleDemoLogin(account.email, account.password)}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 2 }}>
                        <PersonIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {account.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {account.email}
                        </Typography>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          sx={{ mt: 1 }}
                          disabled={loading}
                        >
                          Login as {account.type}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 2,
              }}
            >
              <RestaurantIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography component="h1" variant="h4" gutterBottom fontWeight="bold">
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Enter your credentials to access the system
              </Typography>

              {error && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
                <TextField
                  {...register('email')}
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={loading}
                />
                <TextField
                  {...register('password')}
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={loading}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" align="center">
                Use demo accounts above for quick access to different user roles
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default LoginPage;