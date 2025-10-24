import React from 'react';
import {
  Card as MuiCard,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Stack,
  Box
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Button } from '../../../components/ui/neumorphic';

interface Promotion {
  id: number;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  image: string;
  category: string;
}

interface PromotionCardProps {
  promotion: Promotion;
  onOrderNow: () => void;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onOrderNow }) => {
  return (
    <MuiCard
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 6
        }
      }}
    >
      {/* Image placeholder with gradient */}
      <Box
        sx={{
          height: 200,
          background: `linear-gradient(135deg, ${
            promotion.category === 'Pizza'
              ? '#FF6B6B 0%, #FF8E53 100%'
              : promotion.category === 'Combo'
              ? '#4ECDC4 0%, #44A08D 100%'
              : '#667eea 0%, #764ba2 100%'
          })`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <Typography variant="h3" color="white" fontWeight="bold" sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          {promotion.discount}
        </Typography>
        <Chip
          label={promotion.category}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'white',
            fontWeight: 'bold'
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {promotion.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
          {promotion.description}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {promotion.validUntil}
          </Typography>
        </Stack>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onOrderNow}
          leftIcon={<LocalOfferIcon />}
          style={{ marginTop: 'auto' }}
        >
          Order Now
        </Button>
      </CardContent>
    </MuiCard>
  );
};

export default PromotionCard;
