import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, List, ListItem, ListItemText,
  ListItemButton, Chip, CircularProgress, Typography
} from '@mui/material';
import { useGetAvailableDriversQuery } from '../../store/api/deliveryApi';
import { useAssignDriverMutation } from '../../store/api/orderApi';
import { useAppSelector } from '../../store/hooks';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';

interface AssignDriverModalProps {
  open: boolean;
  orderId: string;
  onClose: () => void;
  onAssigned: (driverId: string, driverName: string) => void;
}

export const AssignDriverModal = ({ open, orderId, onClose, onAssigned }: AssignDriverModalProps) => {
  const [search, setSearch] = useState('');
  const [assignError, setAssignError] = useState('');
  const storeId = useAppSelector(selectSelectedStoreId) ?? '';

  const { data: drivers = [], isLoading, isError } = useGetAvailableDriversQuery(storeId, {
    skip: !open || !storeId,
    pollingInterval: open ? 15000 : 0,
  });

  const [assignDriver, { isLoading: assigning }] = useAssignDriverMutation();

  const filtered = search
    ? drivers.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()))
    : drivers;

  const handleAssign = async (driverId: string, driverName: string) => {
    setAssignError('');
    try {
      await assignDriver({ orderId, driverId }).unwrap();
      onAssigned(driverId, driverName);
      onClose();
    } catch {
      setAssignError('Failed to assign driver. Please try again.');
    }
  };

  const handleClose = () => {
    setSearch('');
    setAssignError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Driver</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search drivers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
          size="small"
        />
        {assignError && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>{assignError}</Typography>
        )}
        {isLoading ? (
          <CircularProgress size={28} sx={{ display: 'block', mx: 'auto', my: 2 }} />
        ) : isError ? (
          <Typography color="error" variant="body2" sx={{ py: 2, textAlign: 'center' }}>
            Could not load drivers. Please try again.
          </Typography>
        ) : (
          <List dense>
            {filtered.map(driver => {
              const isAvailable = !driver.status || driver.status === 'AVAILABLE' || driver.status === 'ONLINE';
              return (
                <ListItem key={driver.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleAssign(driver.id, driver.name)}
                    disabled={assigning}
                  >
                    <ListItemText
                      primary={driver.name}
                      secondary={driver.activeDeliveries != null
                        ? `${driver.activeDeliveries} active deliveries`
                        : undefined}
                    />
                    <Chip
                      label={isAvailable ? 'Available' : 'Busy'}
                      color={isAvailable ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
            {filtered.length === 0 && !isLoading && (
              <ListItem>
                <ListItemText
                  primary="No available drivers"
                  secondary={search ? 'Try a different search term' : 'No drivers are currently available'}
                />
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={assigning}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignDriverModal;
