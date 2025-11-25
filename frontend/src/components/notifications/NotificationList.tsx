import React from 'react';
import {
  Box,
  List,
  ListItem,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon,
  RateReview as ReviewIcon,
  Warning as AlertIcon,
  Campaign as PromoIcon,
} from '@mui/icons-material';
import {
  useGetUnreadNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  Notification,
  NotificationType,
} from '../../store/api/notificationApi';
import { useAppSelector } from '../../store/hooks';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  onClose?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const user = useAppSelector((state) => state.auth.user);

  const { data: notifications = [], isLoading } = useGetUnreadNotificationsQuery(user?.id || '', {
    skip: !user?.id,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_CONFIRMED:
      case NotificationType.ORDER_PREPARING:
      case NotificationType.ORDER_READY:
        return <OrderIcon sx={{ color: '#e53e3e' }} />;
      case NotificationType.ORDER_DELIVERED:
      case NotificationType.DRIVER_ASSIGNED:
      case NotificationType.DRIVER_ARRIVED:
        return <DeliveryIcon sx={{ color: '#0066cc' }} />;
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYMENT_FAILED:
        return <PaymentIcon sx={{ color: '#10b981' }} />;
      case NotificationType.REVIEW_REQUEST:
        return <ReviewIcon sx={{ color: '#f59e0b' }} />;
      case NotificationType.PROMOTIONAL:
        return <PromoIcon sx={{ color: '#8b5cf6' }} />;
      default:
        return <AlertIcon sx={{ color: '#666666' }} />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_CREATED:
      case NotificationType.ORDER_CONFIRMED:
        return '#e53e3e';
      case NotificationType.ORDER_DELIVERED:
        return '#10b981';
      case NotificationType.PAYMENT_SUCCESS:
        return '#10b981';
      case NotificationType.PAYMENT_FAILED:
        return '#ef4444';
      case NotificationType.PROMOTIONAL:
        return '#8b5cf6';
      default:
        return '#0066cc';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.readAt === null) {
      await markAsRead(notification.id);
    }
    // Could navigate to relevant page based on notification type
    onClose?.();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await markAllAsRead(user.id);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No new notifications
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ px: 2, pb: 1 }}>
        <Button
          size="small"
          startIcon={<DoneAllIcon />}
          onClick={handleMarkAllRead}
          sx={{
            fontSize: '0.75rem',
            textTransform: 'none',
            color: '#e53e3e',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(229, 62, 62, 0.1)',
            },
          }}
        >
          Mark all as read
        </Button>
      </Box>

      <List sx={{ maxHeight: 450, overflow: 'auto', p: 0 }}>
        {notifications.map((notification) => (
          <ListItem
            key={notification.id}
            sx={{
              ...createNeumorphicSurface('flat', 'sm', 'md'),
              m: 1,
              p: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: notification.readAt ? '#fafafa' : '#ffffff',
              borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.1), -2px -2px 6px rgba(255, 255, 255, 0.9)',
              },
            }}
            onClick={() => handleNotificationClick(notification)}
          >
            <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
              <Box
                sx={{
                  ...createNeumorphicSurface('raised', 'sm', 'lg'),
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getNotificationIcon(notification.type)}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: '#333333',
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {notification.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#666666',
                    display: 'block',
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {notification.message}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Chip
                    label={notification.type.replace('_', ' ')}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      backgroundColor: `${getNotificationColor(notification.type)}15`,
                      color: getNotificationColor(notification.type),
                      border: 'none',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#999999', fontSize: '0.7rem' }}>
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              </Box>

              <IconButton
                size="small"
                onClick={(e) => handleDelete(e, notification.id)}
                sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default NotificationList;
