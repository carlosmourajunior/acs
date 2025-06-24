import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const theme = useTheme();

  return (
    <Box mb={4}>
      <Typography
        variant="h4"
        color={theme.palette.primary.main}
        fontWeight="bold"
        sx={{ mb: 1 }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subtitle1" color={theme.palette.text.secondary}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default Header;
