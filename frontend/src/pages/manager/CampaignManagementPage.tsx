import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import AppHeader from '../../components/common/AppHeader';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import {
  Box,
  Container,
  Typography,
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
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import {
  Add as AddIcon,
  Campaign as CampaignIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ExecuteIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import {
  useGetAllCampaignsQuery,
  useExecuteCampaignMutation,
  useCancelCampaignMutation,
  useDeleteCampaignMutation,
  Campaign,
  CampaignStatus,
} from '../../store/api/notificationApi';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';
import { format } from 'date-fns';
import CampaignBuilder from '../../components/notifications/CampaignBuilder';

const CampaignManagementPage: React.FC = () => {
  const { handleBack } = useSmartBackNavigation();
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCampaign, setMenuCampaign] = useState<Campaign | null>(null);

  // Get storeId
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const { data: campaignsData, isLoading, refetch } = useGetAllCampaignsQuery({ storeId, page, size: 20 }, { skip: !storeId });
  const [executeCampaign] = useExecuteCampaignMutation();
  const [cancelCampaign] = useCancelCampaignMutation();
  const [deleteCampaign] = useDeleteCampaignMutation();

  const campaigns = campaignsData?.content || [];

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleNewCampaign = () => {
    setSelectedCampaign(null);
    setIsBuilderOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsBuilderOpen(true);
    handleMenuClose();
  };

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleExecuteCampaign = async (campaign: Campaign) => {
    try {
      await executeCampaign(campaign.id).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to execute campaign:', error);
    }
    handleMenuClose();
  };

  const handleCancelCampaign = async (campaign: Campaign) => {
    try {
      await cancelCampaign(campaign.id).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to cancel campaign:', error);
    }
    handleMenuClose();
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (window.confirm(`Are you sure you want to delete campaign "${campaign.name}"?`)) {
      try {
        await deleteCampaign(campaign.id).unwrap();
        refetch();
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, campaign: Campaign) => {
    setAnchorEl(event.currentTarget);
    setMenuCampaign(campaign);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCampaign(null);
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.DRAFT:
        return '#666666';
      case CampaignStatus.SCHEDULED:
        return '#f59e0b';
      case CampaignStatus.SENDING:
        return '#0066cc';
      case CampaignStatus.SENT:
        return '#10b981';
      case CampaignStatus.CANCELLED:
        return '#ef4444';
      case CampaignStatus.FAILED:
        return '#dc2626';
      default:
        return '#666666';
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS':
        return '#e53e3e';
      case 'EMAIL':
        return '#0066cc';
      case 'PUSH':
        return '#10b981';
      case 'IN_APP':
        return '#f59e0b';
      default:
        return '#666666';
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    switch (currentTab) {
      case 0:
        return true; // All
      case 1:
        return campaign.status === CampaignStatus.DRAFT;
      case 2:
        return campaign.status === CampaignStatus.SCHEDULED;
      case 3:
        return campaign.status === CampaignStatus.SENDING || campaign.status === CampaignStatus.SENT;
      default:
        return true;
    }
  });

  const calculateSuccessRate = (campaign: Campaign) => {
    if (campaign.sent === 0) return 0;
    return ((campaign.delivered / campaign.sent) * 100).toFixed(1);
  };

  const calculateOpenRate = (campaign: Campaign) => {
    if (campaign.delivered === 0) return 0;
    return ((campaign.opened / campaign.delivered) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppHeader title="Campaign Management" showBackButton={true} onBack={handleBack} showManagerNav={true} />
      <Container maxWidth="xl" sx={{ py: 4, paddingTop: '80px' }}>
        {/* Header */}
        <Box
        sx={{
          ...createNeumorphicSurface('raised', 'md', '2xl'),
          p: 4,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              ...createNeumorphicSurface('raised', 'sm', 'lg'),
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <CampaignIcon sx={{ color: '#e53e3e', fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#333333' }}>
              Campaign Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and manage notification campaigns
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewCampaign}
          sx={{
            ...createNeumorphicSurface('raised', 'md', 'xl'),
            backgroundColor: '#e53e3e',
            color: 'white',
            px: 3,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            border: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#c02e2e',
              transform: 'translateY(-2px)',
              boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.2), -4px -4px 12px rgba(255, 255, 255, 0.9)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          }}
        >
          New Campaign
        </Button>
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          ...createNeumorphicSurface('flat', 'md', 'xl'),
          mb: 3,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minWidth: 120,
            },
            '& .Mui-selected': {
              color: '#e53e3e !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#e53e3e',
              height: 3,
            },
          }}
        >
          <Tab label="All Campaigns" />
          <Tab label="Drafts" />
          <Tab label="Scheduled" />
          <Tab label="Sent" />
        </Tabs>
      </Paper>

      {/* Campaigns Table */}
      <TableContainer
        component={Paper}
        sx={{
          ...createNeumorphicSurface('flat', 'md', 'xl'),
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 700 }}>Campaign Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Channel</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Recipients</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Success Rate</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Open Rate</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No campaigns found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#fafafa',
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {campaign.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {campaign.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={campaign.channel}
                      size="small"
                      sx={{
                        backgroundColor: `${getChannelColor(campaign.channel)}15`,
                        color: getChannelColor(campaign.channel),
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={campaign.status}
                      size="small"
                      sx={{
                        backgroundColor: `${getStatusColor(campaign.status)}15`,
                        color: getStatusColor(campaign.status),
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{campaign.totalRecipients || 0}</Typography>
                  </TableCell>
                  <TableCell>
                    {campaign.status === CampaignStatus.SENDING && (
                      <Box sx={{ width: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(campaign.sent / (campaign.totalRecipients || 1)) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#0066cc',
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {campaign.sent} / {campaign.totalRecipients}
                        </Typography>
                      </Box>
                    )}
                    {campaign.status === CampaignStatus.SENT && (
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                        Complete
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {campaign.sent > 0 ? (
                      <Typography variant="body2">{calculateSuccessRate(campaign)}%</Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {campaign.delivered > 0 ? (
                      <Typography variant="body2">{calculateOpenRate(campaign)}%</Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(campaign.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, campaign)}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => menuCampaign && handleViewCampaign(menuCampaign)}>
          <ViewIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        {menuCampaign?.status === CampaignStatus.DRAFT && (
          <>
            <MenuItem onClick={() => menuCampaign && handleEditCampaign(menuCampaign)}>
              <EditIcon sx={{ mr: 1, fontSize: 20 }} />
              Edit
            </MenuItem>
            <MenuItem onClick={() => menuCampaign && handleExecuteCampaign(menuCampaign)}>
              <ExecuteIcon sx={{ mr: 1, fontSize: 20 }} />
              Execute Now
            </MenuItem>
          </>
        )}
        {(menuCampaign?.status === CampaignStatus.SCHEDULED ||
          menuCampaign?.status === CampaignStatus.SENDING) && (
          <MenuItem onClick={() => menuCampaign && handleCancelCampaign(menuCampaign)}>
            <CancelIcon sx={{ mr: 1, fontSize: 20 }} />
            Cancel
          </MenuItem>
        )}
        {(menuCampaign?.status === CampaignStatus.DRAFT ||
          menuCampaign?.status === CampaignStatus.CANCELLED ||
          menuCampaign?.status === CampaignStatus.FAILED) && (
          <MenuItem onClick={() => menuCampaign && handleDeleteCampaign(menuCampaign)}>
            <DeleteIcon sx={{ mr: 1, fontSize: 20, color: '#ef4444' }} />
            <Typography color="error">Delete</Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Campaign Builder Dialog */}
      <Dialog
        open={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            ...createNeumorphicSurface('raised', 'lg', '2xl'),
          },
        }}
      >
        <CampaignBuilder
          campaign={selectedCampaign}
          onClose={() => {
            setIsBuilderOpen(false);
            refetch();
          }}
        />
      </Dialog>

      {/* View Campaign Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            ...createNeumorphicSurface('raised', 'lg', '2xl'),
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingIcon sx={{ mr: 1, color: '#e53e3e' }} />
            Campaign Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCampaign && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {selectedCampaign.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedCampaign.description}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Subject:
                </Typography>
                <Typography variant="body2">{selectedCampaign.subject}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Message:
                </Typography>
                <Typography variant="body2">{selectedCampaign.message}</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Channel:
                  </Typography>
                  <Chip
                    label={selectedCampaign.channel}
                    size="small"
                    sx={{
                      backgroundColor: `${getChannelColor(selectedCampaign.channel)}15`,
                      color: getChannelColor(selectedCampaign.channel),
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={selectedCampaign.status}
                    size="small"
                    sx={{
                      backgroundColor: `${getStatusColor(selectedCampaign.status)}15`,
                      color: getStatusColor(selectedCampaign.status),
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Recipients:
                  </Typography>
                  <Typography variant="h6">{selectedCampaign.totalRecipients || 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Sent:
                  </Typography>
                  <Typography variant="h6">{selectedCampaign.sent}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Delivered:
                  </Typography>
                  <Typography variant="h6">{selectedCampaign.delivered}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Failed:
                  </Typography>
                  <Typography variant="h6">{selectedCampaign.failed}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Opened:
                  </Typography>
                  <Typography variant="h6">{selectedCampaign.opened}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Clicked:
                  </Typography>
                  <Typography variant="h6">{selectedCampaign.clicked}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
};

export default withPageStoreContext(CampaignManagementPage, 'campaigns');
