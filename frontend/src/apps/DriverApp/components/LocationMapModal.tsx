/**
 * LocationMapModal - Shows driver's current location in an in-app modal
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { colors, spacing, borderRadius, typography, shadows } from '../../../styles/driver-design-tokens';

interface LocationMapModalProps {
  open: boolean;
  onClose: () => void;
  location: { latitude: number; longitude: number };
}

const LocationMapModal: React.FC<LocationMapModalProps> = ({ open, onClose, location }) => {
  const handleOpenInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  const handleOpenInOSM = () => {
    const osmUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=16#map=16/${location.latitude}/${location.longitude}`;
    window.open(osmUrl, '_blank');
  };

  // Generate OpenStreetMap static image URL (using Leaflet-like approach)
  const mapImageUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: borderRadius.lg,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: spacing.base,
          borderBottom: `1px solid ${colors.surface.border}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <MyLocationIcon sx={{ color: colors.primary.green, fontSize: '24px' }} />
          <Typography
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            My Current Location
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: spacing.lg }}>
        {/* Location Coordinates */}
        <Box
          sx={{
            mb: spacing.base,
            p: spacing.base,
            background: colors.surface.backgroundAlt,
            borderRadius: borderRadius.sm,
          }}
        >
          <Typography
            sx={{
              fontSize: typography.fontSize.caption,
              color: colors.text.secondary,
              mb: spacing.xs,
            }}
          >
            GPS Coordinates
          </Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Typography>
        </Box>

        {/* Embedded Map */}
        <Box
          sx={{
            width: '100%',
            height: '400px',
            borderRadius: borderRadius.md,
            overflow: 'hidden',
            boxShadow: shadows.subtle,
            mb: spacing.lg,
            position: 'relative',
            background: colors.surface.backgroundAlt,
          }}
        >
          <iframe
            src={mapImageUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            title="Current Location Map"
          />
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: spacing.md,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenInGoogleMaps}
            sx={{
              flex: 1,
              minWidth: '200px',
              height: '48px',
              background: colors.primary.green,
              color: colors.primary.white,
              borderRadius: borderRadius.sm,
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              textTransform: 'none',
              boxShadow: shadows.subtle,
              '&:hover': {
                background: colors.primary.greenDark,
                boxShadow: shadows.card,
              },
            }}
          >
            Open in Google Maps
          </Button>

          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenInOSM}
            sx={{
              flex: 1,
              minWidth: '200px',
              height: '48px',
              borderColor: colors.surface.borderDark,
              color: colors.text.primary,
              borderRadius: borderRadius.sm,
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.semibold,
              textTransform: 'none',
              '&:hover': {
                borderColor: colors.primary.green,
                background: colors.primary.greenLight,
              },
            }}
          >
            Open in OpenStreetMap
          </Button>
        </Box>

        {/* Info Note */}
        <Box
          sx={{
            mt: spacing.lg,
            p: spacing.base,
            background: colors.semantic.infoBg,
            borderRadius: borderRadius.sm,
            borderLeft: `4px solid ${colors.semantic.info}`,
          }}
        >
          <Typography
            sx={{
              fontSize: typography.fontSize.caption,
              color: colors.text.secondary,
            }}
          >
            This is your current GPS location. For turn-by-turn navigation to a delivery address, use the navigation feature in the Active Deliveries tab.
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LocationMapModal;
