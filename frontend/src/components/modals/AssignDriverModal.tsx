import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, List, ListItem, ListItemText,
  ListItemButton, Chip, CircularProgress, Typography
} from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import { selectAuth } from '../../store/slices/authSlice';

interface Driver {
  id: string;
  name: string;
  available: boolean;
  currentOrders: number;
}

interface AssignDriverModalProps {
  open: boolean;
  orderId: string;
  onClose: () => void;
  onAssigned: (driverId: string, driverName: string) => void;
}

export const AssignDriverModal = ({ open, orderId, onClose, onAssigned }: AssignDriverModalProps) => {
  const [search, setSearch] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState('');
  const auth = useAppSelector(selectAuth);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setDrivers([]);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    const token = auth.accessToken || '';
    fetch(`/api/users?type=DRIVER&search=${encodeURIComponent(search)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load drivers');
        return r.json();
      })
      .then(data => setDrivers(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setError('Could not load drivers. Please try again.'))
      .finally(() => setLoading(false));
  }, [open, search, auth.accessToken]);

  const handleAssign = async (driver: Driver) => {
    setAssigning(driver.id);
    const token = auth.accessToken || '';
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ assignedDriverId: driver.id })
      });
      if (!res.ok) throw new Error('Assignment failed');
      onAssigned(driver.id, driver.name);
      onClose();
    } catch {
      setError('Failed to assign driver. Please try again.');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>
        )}
        {loading ? (
          <CircularProgress size={28} sx={{ display: 'block', mx: 'auto', my: 2 }} />
        ) : (
          <List dense>
            {drivers.map(driver => (
              <ListItem key={driver.id} disablePadding>
                <ListItemButton
                  onClick={() => handleAssign(driver)}
                  disabled={!!assigning}
                >
                  <ListItemText
                    primary={driver.name}
                    secondary={driver.currentOrders > 0 ? `${driver.currentOrders} active orders` : 'No active orders'}
                  />
                  <Chip
                    label={driver.available ? 'Available' : 'Busy'}
                    color={driver.available ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: assigning === driver.id ? 1 : 0 }}
                  />
                  {assigning === driver.id && <CircularProgress size={18} />}
                </ListItemButton>
              </ListItem>
            ))}
            {drivers.length === 0 && !loading && (
              <ListItem>
                <ListItemText primary="No drivers found" secondary="Try a different search term" />
              </ListItem>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={!!assigning}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignDriverModal;
