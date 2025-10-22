import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Stack,
  ButtonGroup,
  CircularProgress,
} from '@mui/material';
import {
  useGetAvailableMenuQuery,
  useGetMenuByCuisineQuery,
  useLazySearchMenuQuery,
  Cuisine,
  MenuCategory,
  MenuItem,
  DietaryType,
  SpiceLevel,
} from '../../store/api/menuApi';
import { useAppDispatch } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';

const MenuPage: React.FC = () => {
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | null>(null);

  const dispatch = useAppDispatch();

  // Fetch menu based on filters
  const { data: allMenu, isLoading: loadingAll } = useGetAvailableMenuQuery(undefined, {
    skip: selectedCuisine !== 'ALL',
  });

  const { data: cuisineMenu, isLoading: loadingCuisine } = useGetMenuByCuisineQuery(
    selectedCuisine as Cuisine,
    { skip: selectedCuisine === 'ALL' }
  );

  const [searchMenu, { data: searchResults, isLoading: loadingSearch }] = useLazySearchMenuQuery();

  // Determine which menu to display
  const menuItems = searchTerm
    ? searchResults || []
    : selectedCuisine === 'ALL'
    ? allMenu || []
    : cuisineMenu || [];

  const isLoading = loadingAll || loadingCuisine || loadingSearch;

  // Filter by dietary preferences and category
  const filteredMenu = menuItems.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (selectedDietary && !item.dietaryInfo?.includes(selectedDietary)) return false;
    return true;
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim().length > 2) {
      searchMenu(value);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    dispatch(addToCart({
      id: item.id,
      name: item.name,
      price: item.basePrice / 100,
      quantity: 1,
      imageUrl: item.imageUrl,
    }));
  };

  const formatPrice = (priceInPaise: number) => {
    return `₹${(priceInPaise / 100).toFixed(2)}`;
  };

  const getDietaryBadgeColor = (dietary: DietaryType): 'success' | 'error' | 'warning' | 'default' => {
    switch (dietary) {
      case DietaryType.VEGETARIAN:
        return 'success';
      case DietaryType.VEGAN:
        return 'success';
      case DietaryType.NON_VEGETARIAN:
        return 'error';
      case DietaryType.JAIN:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSpiceLevelEmoji = (spiceLevel?: SpiceLevel) => {
    switch (spiceLevel) {
      case SpiceLevel.MILD:
        return '🌶️';
      case SpiceLevel.MEDIUM:
        return '🌶️🌶️';
      case SpiceLevel.HOT:
        return '🌶️🌶️🌶️';
      case SpiceLevel.EXTRA_HOT:
        return '🌶️🌶️🌶️🌶️';
      default:
        return '';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" fontWeight={700} gutterBottom>
          Our Menu
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Explore our multi-cuisine delights
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for dishes..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ bgcolor: 'background.paper' }}
        />
      </Box>

      {/* Cuisine Filters */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Cuisine:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant={selectedCuisine === 'ALL' ? 'contained' : 'outlined'}
            onClick={() => setSelectedCuisine('ALL')}
            size="small"
          >
            All
          </Button>
          {Object.values(Cuisine).map((cuisine) => (
            <Button
              key={cuisine}
              variant={selectedCuisine === cuisine ? 'contained' : 'outlined'}
              onClick={() => setSelectedCuisine(cuisine)}
              size="small"
            >
              {cuisine.replace(/_/g, ' ')}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Dietary Filters */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Dietary:
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant={selectedDietary === null ? 'contained' : 'outlined'}
            onClick={() => setSelectedDietary(null)}
            size="small"
          >
            All
          </Button>
          <Button
            variant={selectedDietary === DietaryType.VEGETARIAN ? 'contained' : 'outlined'}
            onClick={() => setSelectedDietary(DietaryType.VEGETARIAN)}
            size="small"
          >
            Vegetarian
          </Button>
          <Button
            variant={selectedDietary === DietaryType.VEGAN ? 'contained' : 'outlined'}
            onClick={() => setSelectedDietary(DietaryType.VEGAN)}
            size="small"
          >
            Vegan
          </Button>
          <Button
            variant={selectedDietary === DietaryType.NON_VEGETARIAN ? 'contained' : 'outlined'}
            onClick={() => setSelectedDietary(DietaryType.NON_VEGETARIAN)}
            size="small"
          >
            Non-Veg
          </Button>
        </Stack>
      </Box>

      {/* Menu Items Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredMenu.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No items found. Try adjusting your filters.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredMenu.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                {item.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.imageUrl}
                    alt={item.name}
                  />
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h3" fontWeight={600}>
                      {item.name}
                    </Typography>
                    {item.isRecommended && (
                      <Chip label="⭐ Recommended" size="small" color="warning" />
                    )}
                  </Box>

                  {item.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {item.description}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    {item.dietaryInfo?.map((dietary) => (
                      <Chip
                        key={dietary}
                        label={dietary}
                        size="small"
                        color={getDietaryBadgeColor(dietary)}
                      />
                    ))}
                    {item.spiceLevel && item.spiceLevel !== SpiceLevel.NONE && (
                      <Chip label={getSpiceLevelEmoji(item.spiceLevel)} size="small" />
                    )}
                  </Stack>

                  {item.preparationTime && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      ⏱️ {item.preparationTime} mins
                    </Typography>
                  )}

                  {item.variants && item.variants.length > 0 && (
                    <Typography variant="caption" color="text.secondary" display="block" fontStyle="italic">
                      + {item.variants.length} size options available
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {formatPrice(item.basePrice)}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAddToCart(item)}
                  >
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MenuPage;
