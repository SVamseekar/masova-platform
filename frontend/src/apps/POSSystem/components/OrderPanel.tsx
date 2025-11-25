// src/apps/POSSystem/components/OrderPanel.tsx
import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  RestaurantMenu as DineInIcon,
  Takeout as TakeoutIcon,
  DeliveryDining as DeliveryIcon,
  DeleteSweep as ClearIcon,
} from '@mui/icons-material';
import { CURRENCY, calculateOrderTotal, calculateTax, calculateDeliveryFee } from '../../../config/business-config';

interface OrderPanelProps {
  items: any[];
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onUpdateInstructions: (menuItemId: string, instructions: string) => void;
  onNewOrder: () => void;
  orderType: 'DINE_IN' | 'PICKUP' | 'DELIVERY';
  onOrderTypeChange: (type: 'DINE_IN' | 'PICKUP' | 'DELIVERY') => void;
  selectedTable?: string | null;
  onTableSelect: (table: string | null) => void;
}

const OrderPanel: React.FC<OrderPanelProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateInstructions,
  onNewOrder,
  orderType,
  onOrderTypeChange,
  selectedTable,
  onTableSelect,
}) => {
  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = calculateTax(subtotal);
  const deliveryFee = orderType === 'DELIVERY' ? calculateDeliveryFee(subtotal) : 0;
  const total = calculateOrderTotal(subtotal, orderType);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <CartIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Current Order
          </Typography>
          {items.length > 0 && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={onNewOrder}
              color="error"
              variant="outlined"
            >
              Clear
            </Button>
          )}
        </Box>

        {/* Order Type Selection */}
        <ToggleButtonGroup
          value={orderType}
          exclusive
          onChange={(_, value) => value && onOrderTypeChange(value)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="DINE_IN">
            <DineInIcon sx={{ mr: 0.5 }} />
            Dine In
          </ToggleButton>
          <ToggleButton value="PICKUP">
            <TakeoutIcon sx={{ mr: 0.5 }} />
            Pickup
          </ToggleButton>
          <ToggleButton value="DELIVERY">
            <DeliveryIcon sx={{ mr: 0.5 }} />
            Delivery
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Table Number (for Dine In) */}
        {orderType === 'DINE_IN' && (
          <TextField
            fullWidth
            size="small"
            label="Table Number"
            value={selectedTable || ''}
            onChange={(e) => onTableSelect(e.target.value)}
            placeholder="Enter table number"
          />
        )}
      </Box>

      {/* Order Items List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {items.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No items in order. Select items from the menu to get started.
          </Alert>
        ) : (
          <List disablePadding>
            {items.map((item, index) => (
              <React.Fragment key={item.menuItemId}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <ListItem
                  disablePadding
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    py: 1,
                  }}
                >
                  {/* Item Name and Price */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {CURRENCY.format(item.price)} each
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {CURRENCY.format(item.price * item.quantity)}
                    </Typography>
                  </Box>

                  {/* Quantity Controls */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Chip
                        label={item.quantity}
                        size="small"
                        color="primary"
                        sx={{ minWidth: 40 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemoveItem(item.menuItemId)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Special Instructions */}
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Special instructions (optional)"
                    value={item.specialInstructions || ''}
                    onChange={(e) =>
                      onUpdateInstructions(item.menuItemId, e.target.value)
                    }
                    multiline
                    rows={1}
                    sx={{ mt: 0.5 }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Order Summary */}
      {items.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderTop: 2,
            borderColor: 'divider',
            backgroundColor: '#f9f9f9',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Subtotal:</Typography>
            <Typography variant="body2">{CURRENCY.format(subtotal)}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Tax (5%):</Typography>
            <Typography variant="body2">{CURRENCY.format(tax)}</Typography>
          </Box>

          {orderType === 'DELIVERY' && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Delivery Fee:</Typography>
              <Typography variant="body2">
                {deliveryFee === 0 ? 'FREE' : CURRENCY.format(deliveryFee)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Total:
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              {CURRENCY.format(total)}
            </Typography>
          </Box>

          {/* Item Count */}
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            {items.length} item{items.length !== 1 ? 's' : ''} •{' '}
            {items.reduce((sum, item) => sum + item.quantity, 0)} total quantity
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrderPanel;
