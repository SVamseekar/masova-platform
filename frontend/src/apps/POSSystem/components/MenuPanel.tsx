// src/apps/POSSystem/components/MenuPanel.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useGetMenuItemsQuery } from '../../../store/api/menuApi';
import { CURRENCY } from '../../../config/business-config';

interface MenuPanelProps {
  onAddItem: (item: any, quantity?: number) => void;
}

const CATEGORIES = [
  'ALL',
  'STARTERS',
  'MAIN_COURSE',
  'BREADS',
  'DESSERTS',
  'BEVERAGES',
];

const MenuPanel: React.FC<MenuPanelProps> = ({ onAddItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { data: menuItems = [], isLoading, error } = useGetMenuItemsQuery();

  // Filter menu items
  const filteredItems = menuItems.filter((item: any) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    const isAvailable = item.availability;

    return matchesSearch && matchesCategory && isAvailable;
  });

  // Quick add popular items
  const popularItems = menuItems
    .filter((item: any) => item.isPopular && item.availability)
    .slice(0, 4);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          <RestaurantIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Menu Items
        </Typography>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onChange={(_, value) => setSelectedCategory(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40 }}
        >
          {CATEGORIES.map((category) => (
            <Tab
              key={category}
              label={category.replace('_', ' ')}
              value={category}
              sx={{ minHeight: 40, py: 1 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Popular Items Quick Add */}
      {!searchTerm && selectedCategory === 'ALL' && popularItems.length > 0 && (
        <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            🔥 Popular Items
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {popularItems.map((item: any) => (
              <Chip
                key={item.id}
                label={`${item.name} (${CURRENCY.format(item.price)})`}
                onClick={() => onAddItem(item)}
                onDelete={() => onAddItem(item)}
                deleteIcon={<AddIcon />}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Menu Items Grid */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error">
            Failed to load menu items. Please try again.
          </Alert>
        )}

        {!isLoading && !error && filteredItems.length === 0 && (
          <Alert severity="info">
            {searchTerm
              ? 'No menu items found matching your search.'
              : 'No available items in this category.'}
          </Alert>
        )}

        <Grid container spacing={1.5}>
          {filteredItems.map((item: any) => (
            <Grid item xs={12} key={item.id}>
              <Card
                sx={{
                  display: 'flex',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
                onClick={() => onAddItem(item)}
              >
                {/* Image */}
                {item.image && (
                  <CardMedia
                    component="img"
                    sx={{ width: 80, height: 80, objectFit: 'cover' }}
                    image={item.image}
                    alt={item.name}
                  />
                )}

                {/* Content */}
                <CardContent sx={{ flex: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        {item.name}
                        {item.isPopular && (
                          <Chip
                            label="Popular"
                            size="small"
                            color="warning"
                            sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                      </Typography>
                      {item.description && (
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                          {item.description}
                        </Typography>
                      )}
                      <Typography variant="body2" fontWeight="bold" color="primary" sx={{ mt: 0.5 }}>
                        {CURRENCY.format(item.price)}
                      </Typography>
                    </Box>

                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddItem(item);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>

                  {/* Tags */}
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    {item.isVegetarian && (
                      <Chip
                        label="Veg"
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.65rem',
                          backgroundColor: '#4caf50',
                          color: 'white',
                        }}
                      />
                    )}
                    {item.isSpicy && (
                      <Chip
                        label="🌶️ Spicy"
                        size="small"
                        sx={{ height: 16, fontSize: '0.65rem' }}
                      />
                    )}
                    {item.cuisine && (
                      <Chip
                        label={item.cuisine}
                        size="small"
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.65rem' }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Footer with item count */}
      <Box
        sx={{
          p: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: '#f9f9f9',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {filteredItems.length} items available
        </Typography>
      </Box>
    </Box>
  );
};

export default MenuPanel;
