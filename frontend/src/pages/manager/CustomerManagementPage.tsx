import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetAllCustomersQuery,
  useSearchCustomersQuery,
  useDeactivateCustomerMutation,
  useActivateCustomerMutation,
  useAddNoteMutation,
  useGetCustomerStatsQuery,
  Customer,
  AddCustomerNoteRequest,
} from '../../store/api/customerApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';

const CustomerManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<'GENERAL' | 'COMPLAINT' | 'PREFERENCE' | 'OTHER'>('GENERAL');
  const [activeTab, setActiveTab] = useState(0);

  // API queries
  const { data: allCustomers, isLoading: loadingAll } = useGetAllCustomersQuery(undefined, {
    skip: searchQuery.length > 0,
  });

  const { data: searchResults, isLoading: loadingSearch } = useSearchCustomersQuery(
    { query: searchQuery, page: 0, size: 50 },
    { skip: searchQuery.length === 0 }
  );

  const { data: stats } = useGetCustomerStatsQuery();

  // Mutations
  const [deactivateCustomer] = useDeactivateCustomerMutation();
  const [activateCustomer] = useActivateCustomerMutation();
  const [addNote] = useAddNoteMutation();

  const displayCustomers = searchQuery.length > 0
    ? (searchResults?.content || [])
    : (allCustomers || []);

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
        addedBy: currentUser?.name || 'Manager',
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

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: colors.surface.background,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing[6],
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  };

  const statCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[5],
    textAlign: 'center',
  };

  const statValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginBottom: spacing[1],
  };

  const statLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  };

  const searchContainerStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[4],
    marginBottom: spacing[6],
  };

  const searchInputStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    border: 'none',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.background,
    color: colors.text.primary,
    ...createNeumorphicSurface('inset', 'sm', 'base'),
  };

  const tableCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: 0,
    overflow: 'hidden',
  };

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const tableHeaderStyles: React.CSSProperties = {
    backgroundColor: colors.surface.elevated,
    borderBottom: `2px solid ${colors.surface.border}`,
  };

  const tableHeaderCellStyles: React.CSSProperties = {
    padding: spacing[4],
    textAlign: 'left',
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const tableCellStyles: React.CSSProperties = {
    padding: spacing[4],
    borderBottom: `1px solid ${colors.surface.border}`,
    fontSize: typography.fontSize.sm,
  };

  const badgeStyles = (color: string): React.CSSProperties => ({
    ...createBadge(),
    backgroundColor: color,
    color: '#000',
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  });

  const modalOverlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyles: React.CSSProperties = {
    ...createCard('lg', 'xl'),
    backgroundColor: colors.surface.background,
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: spacing[6],
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[2],
    marginBottom: spacing[4],
    borderBottom: `2px solid ${colors.surface.border}`,
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: isActive ? colors.primary.main : colors.text.secondary,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? `3px solid ${colors.primary.main}` : '3px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader title="Customer Management" showBackButton={true} />

        <div>
          <h1 style={titleStyles}>Customer Management</h1>
          <p style={subtitleStyles}>Manage customer profiles, loyalty programs, and preferences</p>

          {/* Statistics Cards */}
          {stats && (
            <div style={statsGridStyles}>
              <div style={statCardStyles}>
                <div style={statValueStyles}>{stats.totalCustomers}</div>
                <div style={statLabelStyles}>Total Customers</div>
              </div>
              <div style={statCardStyles}>
                <div style={{ ...statValueStyles, color: colors.success.main }}>{stats.activeCustomers}</div>
                <div style={statLabelStyles}>Active Customers</div>
              </div>
              <div style={statCardStyles}>
                <div style={{ ...statValueStyles, color: colors.warning.main }}>{stats.highValueCustomers}</div>
                <div style={statLabelStyles}>High Value (&gt;₹10k)</div>
              </div>
              <div style={statCardStyles}>
                <div style={{ ...statValueStyles, color: colors.info.main }}>₹{Math.round(stats.averageLifetimeValue)}</div>
                <div style={statLabelStyles}>Avg Lifetime Value</div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div style={searchContainerStyles}>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyles}
            />
          </div>

          {/* Customer Table */}
          <div style={tableCardStyles}>
            <table style={tableStyles}>
              <thead style={tableHeaderStyles}>
                <tr>
                  <th style={tableHeaderCellStyles}>Name</th>
                  <th style={tableHeaderCellStyles}>Email</th>
                  <th style={tableHeaderCellStyles}>Phone</th>
                  <th style={tableHeaderCellStyles}>Loyalty Tier</th>
                  <th style={tableHeaderCellStyles}>Orders</th>
                  <th style={tableHeaderCellStyles}>Total Spent</th>
                  <th style={tableHeaderCellStyles}>Status</th>
                  <th style={tableHeaderCellStyles}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(loadingAll || loadingSearch) && (
                  <tr>
                    <td colSpan={8} style={{ ...tableCellStyles, textAlign: 'center', padding: spacing[8] }}>
                      Loading customers...
                    </td>
                  </tr>
                )}
                {!loadingAll && !loadingSearch && displayCustomers.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ ...tableCellStyles, textAlign: 'center', padding: spacing[8] }}>
                      No customers found
                    </td>
                  </tr>
                )}
                {displayCustomers.map((customer) => (
                  <tr key={customer.id} style={{ cursor: 'pointer' }}>
                    <td style={tableCellStyles}>{customer.name}</td>
                    <td style={tableCellStyles}>
                      {customer.email} {customer.emailVerified && <span style={{ color: colors.success.main }}>✓</span>}
                    </td>
                    <td style={tableCellStyles}>
                      {customer.phone} {customer.phoneVerified && <span style={{ color: colors.success.main }}>✓</span>}
                    </td>
                    <td style={tableCellStyles}>
                      <span style={badgeStyles(getLoyaltyTierColor(customer.loyaltyInfo.tier))}>
                        {customer.loyaltyInfo.tier}
                      </span>
                      <span style={{ marginLeft: spacing[2], fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                        {customer.loyaltyInfo.totalPoints} pts
                      </span>
                    </td>
                    <td style={tableCellStyles}>{customer.orderStats.totalOrders}</td>
                    <td style={tableCellStyles}>₹{Math.round(customer.orderStats.totalSpent)}</td>
                    <td style={tableCellStyles}>
                      <span style={badgeStyles(customer.active ? colors.success.main : colors.error.main)}>
                        {customer.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tableCellStyles}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setDetailsOpen(true);
                        }}
                        style={{ marginRight: spacing[2] }}
                      >
                        View
                      </Button>
                      <Button
                        variant={customer.active ? 'danger' : 'success'}
                        size="sm"
                        onClick={() => handleToggleActive(customer)}
                      >
                        {customer.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {detailsOpen && selectedCustomer && (
        <div style={modalOverlayStyles} onClick={() => setDetailsOpen(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: spacing[4] }}>
              <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[2] }}>
                {selectedCustomer.name}
              </h2>
              <div style={{ display: 'flex', gap: spacing[2] }}>
                <span style={badgeStyles(getLoyaltyTierColor(selectedCustomer.loyaltyInfo.tier))}>
                  {selectedCustomer.loyaltyInfo.tier}
                </span>
                <span style={badgeStyles(selectedCustomer.active ? colors.success.main : colors.error.main)}>
                  {selectedCustomer.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div style={tabsContainerStyles}>
              {['Profile', 'Loyalty & Stats', 'Addresses', 'Preferences', 'Notes'].map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(index)}
                  style={tabButtonStyles(activeTab === index)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ marginBottom: spacing[4] }}>
              {activeTab === 0 && (
                <div>
                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Email</div>
                    <div>{selectedCustomer.email} {selectedCustomer.emailVerified && '✓'}</div>
                  </div>
                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Phone</div>
                    <div>{selectedCustomer.phone} {selectedCustomer.phoneVerified && '✓'}</div>
                  </div>
                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Gender</div>
                    <div>{selectedCustomer.gender || 'Not specified'}</div>
                  </div>
                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Member Since</div>
                    <div>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div>
                  <div style={{ marginBottom: spacing[4] }}>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Loyalty Points</div>
                    <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary.main }}>
                      {selectedCustomer.loyaltyInfo.totalPoints}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                      Earned: {selectedCustomer.loyaltyInfo.pointsEarned} | Redeemed: {selectedCustomer.loyaltyInfo.pointsRedeemed}
                    </div>
                  </div>
                  <div style={{ marginBottom: spacing[4] }}>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Total Orders</div>
                    <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.success.main }}>
                      {selectedCustomer.orderStats.totalOrders}
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                      Completed: {selectedCustomer.orderStats.completedOrders} | Cancelled: {selectedCustomer.orderStats.cancelledOrders}
                    </div>
                  </div>
                  <div style={{ marginBottom: spacing[4] }}>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Total Spent</div>
                    <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold }}>
                      ₹{Math.round(selectedCustomer.orderStats.totalSpent)}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div>
                  {selectedCustomer.addresses.length === 0 ? (
                    <div style={{ color: colors.text.tertiary }}>No addresses saved</div>
                  ) : (
                    selectedCustomer.addresses.map((address) => (
                      <div key={address.id} style={{ marginBottom: spacing[3], padding: spacing[3], ...createCard('sm', 'base') }}>
                        <div style={{ fontWeight: typography.fontWeight.semibold, marginBottom: spacing[1] }}>
                          {address.label} {address.isDefault && <span style={badgeStyles(colors.primary.main)}>Default</span>}
                        </div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                          {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                          {address.city}, {address.state} - {address.postalCode}
                          {address.landmark && ` (${address.landmark})`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 3 && (
                <div>
                  {selectedCustomer.preferences.favoriteMenuItems.length > 0 && (
                    <div style={{ marginBottom: spacing[3] }}>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[2] }}>Favorite Items</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                        {selectedCustomer.preferences.favoriteMenuItems.map((item, idx) => (
                          <span key={idx} style={badgeStyles(colors.primary.light)}>{item}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Spice Level</div>
                    <div>{selectedCustomer.preferences.spiceLevel}</div>
                  </div>
                </div>
              )}

              {activeTab === 4 && (
                <div>
                  <Button variant="primary" size="sm" onClick={() => setNoteDialogOpen(true)} style={{ marginBottom: spacing[4] }}>
                    Add Note
                  </Button>
                  {selectedCustomer.notes.length === 0 ? (
                    <div style={{ color: colors.text.tertiary }}>No notes</div>
                  ) : (
                    selectedCustomer.notes.map((note) => (
                      <div key={note.id} style={{ marginBottom: spacing[3], padding: spacing[3], ...createCard('sm', 'base') }}>
                        <div style={{ marginBottom: spacing[2] }}>
                          <span style={badgeStyles(colors.info.main)}>{note.category}</span>
                          <span style={{ marginLeft: spacing[2], fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                            by {note.addedBy} on {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: typography.fontSize.sm }}>{note.note}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setDetailsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {noteDialogOpen && (
        <div style={modalOverlayStyles} onClick={() => setNoteDialogOpen(false)}>
          <div style={{ ...modalStyles, maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>
              Add Customer Note
            </h3>

            <div style={{ marginBottom: spacing[4] }}>
              <label style={{ display: 'block', marginBottom: spacing[2], fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Category
              </label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value as any)}
                style={{ ...searchInputStyles, width: '100%' }}
              >
                <option value="GENERAL">General</option>
                <option value="COMPLAINT">Complaint</option>
                <option value="PREFERENCE">Preference</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: spacing[4] }}>
              <label style={{ display: 'block', marginBottom: spacing[2], fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Note
              </label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter note here..."
                rows={4}
                style={{ ...searchInputStyles, width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddNote} disabled={!newNote.trim()}>Add Note</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerManagementPage;
