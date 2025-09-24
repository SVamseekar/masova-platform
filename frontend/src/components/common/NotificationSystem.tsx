// src/components/common/NotificationSystem.tsx
import React from 'react';
import { Alert, Snackbar, Stack } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { removeNotification } from '../../store/slices/notificationSlice';

export const NotificationSystem: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector(state => state.notifications);

  const handleClose = (id: string) => {
    dispatch(removeNotification(id));
  };

  return (
    <Stack spacing={2} sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
      {notifications.slice(0, 5).map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHide !== false ? 6000 : null}
          onClose={() => handleClose(notification.id)}
        >
          <Alert
            severity={notification.type}
            onClose={() => handleClose(notification.id)}
            sx={{ minWidth: 300 }}
          >
            {notification.title && <strong>{notification.title}: </strong>}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
};