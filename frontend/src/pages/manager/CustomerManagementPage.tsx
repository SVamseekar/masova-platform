import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Loyalty as LoyaltyIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import {
  useGetAllCustomersQuery,
  useSearchCustomersQuery,
  useGetCustomerByIdQuery,
  useDeactivateCustomerMutation,
  useActivateCustomerMutation,
  useAddNoteMutation,
  useGetCustomerStatsQuery,
  Customer,
  AddCustomerNoteRequest,
} from '../../store/api/customerApi';
import { colors, fontSize, fontWeight, createCard } from '../../theme/neumorphic';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CustomerManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<'GENERAL' | 'COMPLAINT' | 'PREFERENCE' | 'OTHER'>('GENERAL');
  const [tabValue, setTabValue] = useState(0);

  // API queries
  const { data: allCustomers, isLoading: loadingAll } = useGetAllCustomersQuery(undefined, {
    skip: searchQuery.length > 0,
  });

  const { data: searchResults, isLoading: loadingSearch } = useSearchCustomersQuery(
    { query: searchQuery, page: 0, size: 50 },
    { skip: searchQuery.length === 0 }
  );

  const { data: customerDetails } = useGetCustomerByIdQuery(selectedCustomer?.id || '', {
    skip: !selectedCustomer?.id,
  });

  const { data: stats } = useGetCustomerStatsQuery();

  // Mutations
  const [deactivateCustomer] = useDeactivateCustomerMutation();
  const [activateCustomer] = useActivateCustomerMutation();
  const [addNote] = useAddNoteMutation();

  const displayCustomers = searchQuery.length > 0
    ? (searchResults?.content || [])
    : (allCustomers || []);

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const handleToggleActive = async (customer: Customer) => {
    try {
      if (customer.active) {
        await deactivateCustomer(customer.id).unwrap();
      } else {
        await activateCustomer(customer.id).unwrap();
      }
    } catch (error) {
      console.error('Error toggling customer status:', error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCustomer || !newNote.trim()) return;

    try {
      const request: AddCustomerNoteRequest = {
        note: newNote,
        addedBy: 'Manager', // Should come from auth context
        category: noteCategory,
      };

      await addNote({ customerId: selectedCustomer.id, data: request }).unwrap();
      setNewNote('');
      setNoteDialogOpen(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const getLoyaltyTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return '#E5E4E2';
      case 'GOLD': return '#FFD700';
      case 'SILVER': return '#C0C0C0';
      default: return '#CD7F32';
    }
  };

  return (
    <Box sx={{ backgroundColor: colors.surface.background, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: fontWeight.bold, fontSize: fontSize['4xl'], mb: 1 }}>
          Customer Management
        </Typography>
        <Typography variant="body1" sx={{ color: colors.text.secondary }}>
          Manage customer profiles, loyalty programs, and preferences
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ ...createCard(), textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: fontWeight.bold, color: colors.primary.main }}>
                  {stats.totalCustomers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Customers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ ...createCard(), textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: fontWeight.bold, color: colors.success.main }}>
                  {stats.activeCustomers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Customers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ ...createCard(), textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: fontWeight.bold, color: colors.warning.main }}>
                  {stats.highValueCustomers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High Value (>₹10k)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ ...createCard(), textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: fontWeight.bold, color: colors.info.main }}>
                  ₹{Math.round(stats.averageLifetimeValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Lifetime Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Search Bar */}
      <Box sx={{ ...createCard(), p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: colors.text.secondary }} />,
          }}
        />
      </Box>

      {/* Customer Table */}
      <TableContainer component={Paper} sx={{ ...createCard() }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: fontWeight.semiBold }}>Name</TableCell>
              <TableCell sx={{ fontWeight: fontWeight.semiBold }}>Email</TableCell>
              <TableCell sx={{ fontWeight: fontWeight.semiBold }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: fontWeight.semiBold }}>Loyalty Tier</TableCell>
              <TableCell sx={{ fontWeight: fontWeight.semiBold }}>Total Orders</TableCell>
              <TableCell sx={{ fontWeight: fontWeight.semiBold }}>Total Spent</TableCell>
              <TableCell sx={{ fontWeight: fontWeight.semiBold }}>Status</TableCell>
              <TableCell sx={{ fontWeight: fontWeight.semiBold }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(loadingAll || loadingSearch) && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading customers...
                </TableCell>
              </TableRow>
            )}
            {!loadingAll && !loadingSearch && displayCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No customers found
                </TableCell>
              </TableRow>
            )}
            {displayCustomers.map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>{customer.name}</TableCell>
                <TableCell>
                  {customer.email}
                  {customer.emailVerified && (
                    <EmailIcon sx={{ ml: 1, fontSize: 16, color: colors.success.main }} />
                  )}
                </TableCell>
                <TableCell>
                  {customer.phone}
                  {customer.phoneVerified && (
                    <PhoneIcon sx={{ ml: 1, fontSize: 16, color: colors.success.main }} />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.loyaltyInfo.tier}
                    size="small"
                    sx={{
                      backgroundColor: getLoyaltyTierColor(customer.loyaltyInfo.tier),
                      color: '#000',
                      fontWeight: fontWeight.semiBold,
                    }}
                    icon={<LoyaltyIcon />}
                  />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {customer.loyaltyInfo.totalPoints} pts
                  </Typography>
                </TableCell>
                <TableCell>{customer.orderStats.totalOrders}</TableCell>
                <TableCell>₹{Math.round(customer.orderStats.totalSpent)}</TableCell>
                <TableCell>
                  {customer.active ? (
                    <Chip label="Active" size="small" color="success" icon={<ActiveIcon />} />
                  ) : (
                    <Chip label="Inactive" size="small" color="error" icon={<BlockIcon />} />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleViewDetails(customer)} title="View Details">
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleActive(customer)}
                    title={customer.active ? 'Deactivate' : 'Activate'}
                  >
                    {customer.active ? <BlockIcon /> : <ActiveIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Customer Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {customerDetails && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{customerDetails.name}</Typography>
                <Box>
                  <Chip
                    label={customerDetails.loyaltyInfo.tier}
                    sx={{
                      backgroundColor: getLoyaltyTierColor(customerDetails.loyaltyInfo.tier),
                      color: '#000',
                      fontWeight: fontWeight.semiBold,
                      mr: 1,
                    }}
                  />
                  <Chip
                    label={customerDetails.active ? 'Active' : 'Inactive'}
                    color={customerDetails.active ? 'success' : 'error'}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                <Tab label="Profile" />
                <Tab label="Loyalty & Stats" />
                <Tab label="Addresses" />
                <Tab label="Preferences" />
                <Tab label="Notes" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">
                      {customerDetails.email}
                      {customerDetails.emailVerified && ' ✓'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">
                      {customerDetails.phone}
                      {customerDetails.phoneVerified && ' ✓'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1">{customerDetails.gender || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">{customerDetails.dateOfBirth || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Member Since</Typography>
                    <Typography variant="body1">
                      {new Date(customerDetails.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Last Order</Typography>
                    <Typography variant="body1">
                      {customerDetails.lastOrderDate
                        ? new Date(customerDetails.lastOrderDate).toLocaleDateString()
                        : 'Never'}
                    </Typography>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Loyalty Points</Typography>
                    <Typography variant="h4" sx={{ color: colors.primary.main }}>
                      {customerDetails.loyaltyInfo.totalPoints}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Earned: {customerDetails.loyaltyInfo.pointsEarned} |
                      Redeemed: {customerDetails.loyaltyInfo.pointsRedeemed}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Total Orders</Typography>
                    <Typography variant="h4" sx={{ color: colors.success.main }}>
                      {customerDetails.orderStats.totalOrders}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Completed: {customerDetails.orderStats.completedOrders} |
                      Cancelled: {customerDetails.orderStats.cancelledOrders}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Total Spent</Typography>
                    <Typography variant="h4">₹{Math.round(customerDetails.orderStats.totalSpent)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Average Order Value</Typography>
                    <Typography variant="h4">₹{Math.round(customerDetails.orderStats.averageOrderValue)}</Typography>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                {customerDetails.addresses.length === 0 ? (
                  <Typography color="text.secondary">No addresses saved</Typography>
                ) : (
                  <List>
                    {customerDetails.addresses.map((address) => (
                      <React.Fragment key={address.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography>{address.label}</Typography>
                                {address.isDefault && <Chip label="Default" size="small" color="primary" />}
                              </Box>
                            }
                            secondary={
                              <>
                                {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                                {address.city}, {address.state} - {address.postalCode}
                                {address.landmark && ` (${address.landmark})`}
                              </>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Grid container spacing={2}>
                  {customerDetails.preferences.favoriteMenuItems.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Favorite Items
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {customerDetails.preferences.favoriteMenuItems.map((item, idx) => (
                          <Chip key={idx} label={item} size="small" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                  {customerDetails.preferences.cuisinePreferences.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Cuisine Preferences
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {customerDetails.preferences.cuisinePreferences.map((cuisine, idx) => (
                          <Chip key={idx} label={cuisine} size="small" color="primary" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Spice Level</Typography>
                    <Typography variant="body1">{customerDetails.preferences.spiceLevel}</Typography>
                  </Grid>
                  {customerDetails.preferences.dietaryRestrictions.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Dietary Restrictions
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {customerDetails.preferences.dietaryRestrictions.map((restriction, idx) => (
                          <Chip key={idx} label={restriction} size="small" color="warning" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={4}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setNoteDialogOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Add Note
                </Button>
                {customerDetails.notes.length === 0 ? (
                  <Typography color="text.secondary">No notes</Typography>
                ) : (
                  <List>
                    {customerDetails.notes.map((note) => (
                      <React.Fragment key={note.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Chip label={note.category} size="small" />
                                <Typography variant="caption" color="text.secondary">
                                  by {note.addedBy} on {new Date(note.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                            secondary={note.note}
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </TabPanel>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Customer Note</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Category"
            value={noteCategory}
            onChange={(e) => setNoteCategory(e.target.value as any)}
            SelectProps={{ native: true }}
            sx={{ mb: 2, mt: 1 }}
          >
            <option value="GENERAL">General</option>
            <option value="COMPLAINT">Complaint</option>
            <option value="PREFERENCE">Preference</option>
            <option value="OTHER">Other</option>
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter note here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained" disabled={!newNote.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerManagementPage;
