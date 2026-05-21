import { useEffect, useState } from 'react';
import { getGuestSide } from './utils/storage';
import Splash from './components/Splash';
import MainView from './components/MainView';
import AdminLogin from './components/Admin/AdminLogin';
import AdminView from './components/Admin/AdminView';

function App() {
  const [guestSide, setGuestSideState] = useState<'groom' | 'bride' | null>(null);

  useEffect(() => {
    setGuestSideState(getGuestSide());
  }, []);

  const handleSelectSide = (side: 'groom' | 'bride') => {
    setGuestSideState(side);
  };

  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const isAdminAuthenticated = localStorage.getItem('admin_auth') === 'true';
  const [isAdminAuth, setIsAdminAuth] = useState(isAdminAuthenticated);

  if (isAdminRoute) {
    if (!isAdminAuth) {
      return <AdminLogin onSuccess={() => setIsAdminAuth(true)} />;
    }
    return <AdminView />;
  }

  if (!guestSide) {
    return <Splash onSelectSide={handleSelectSide} />;
  }

  return <MainView />;
}

export default App;
