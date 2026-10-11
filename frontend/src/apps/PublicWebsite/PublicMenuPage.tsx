import MenuPage from '../../pages/customer/MenuPage';

/** Public and signed-in customers use the same store-scoped menu. */
export default function PublicMenuPage() {
  return <MenuPage hideStaffLogin showPublicNav />;
}
