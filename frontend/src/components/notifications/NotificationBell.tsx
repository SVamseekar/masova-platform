import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useGetUnreadCountQuery } from '../../store/api/notificationApi';
import { useAppSelector } from '../../store/hooks';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import NotificationList from './NotificationList';

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const user = useAppSelector((state) => state.auth.user);

  const { data: unreadCount, isLoading } = useGetUnreadCountQuery(user?.id || '', {
    skip: !user?.id,
    pollingInterval: 30000, // Poll every 30 seconds
  });

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const bellButtonStyle = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    width: 48,
    height: 48,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '6px 6px 12px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 0.9)',
    },
    '&:active': {
      transform: 'scale(0.98)',
      boxShadow: 'inset 3px 3px 6px rgba(0, 0, 0, 0.15), inset -3px -3px 6px rgba(255, 255, 255, 0.7)',
    },
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={bellButtonStyle}
        aria-label="notifications"
      >
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#e53e3e',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.75rem',
                minWidth: 20,
                height: 20,
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(229, 62, 62, 0.4)',
              },
            }}
          >
            <NotificationsIcon
              sx={{
                color: unreadCount && unreadCount > 0 ? '#e53e3e' : '#666666',
                fontSize: 24,
              }}
            />
          </Badge>
        )}
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            ...createNeumorphicSurface('raised', 'md', 'xl'),
            width: 420,
            maxHeight: 600,
            mt: 1,
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#333333' }}>
              Notifications
            </Typography>
            {unreadCount && unreadCount > 0 && (
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(229, 62, 62, 0.1)',
                  color: '#e53e3e',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {unreadCount} new
              </Box>
            )}
          </Box>
          <Divider sx={{ my: 1 }} />
        </Box>

        <NotificationList onClose={handleClose} />
      </Popover>
    </>
  );
};

export default NotificationBell;
