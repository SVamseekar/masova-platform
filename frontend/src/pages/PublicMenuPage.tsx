import React from 'react';
import MenuPage from './customer/MenuPage';

// Public menu page - no authentication required
const PublicMenuPage: React.FC = () => {
  return <MenuPage />;
};

export default PublicMenuPage;
