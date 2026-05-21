import { useEffect, useState } from 'react';
import { getGuestSide } from './utils/storage';
import Splash from './components/Splash';
import MainView from './components/MainView';
import AdminLogin from './components/Admin/AdminLogin';
import AdminView from './components/Admin/AdminView';
import WelcomeModal from './components/WelcomeModal';

function App() {
  const [guestSide, setGuestSideState] = useState<'groom' | 'bride' | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setGuestSideState(getGuestSide());
  }, []);

  useEffect(() => {
    if (guestSide && !localStorage.getItem('has_seen_welcome')) {
      setShowWelcome(true);
    }
  }, [guestSide]);

  const handleSelectSide = (side: 'groom' | 'bride') => {
    setGuestSideState(side);
  };

  const handleCloseWelcome = () => {
    localStorage.setItem('has_seen_welcome', 'true');
    setShowWelcome(false);
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

  return (
    <>
      <MainView />
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
    </>
  );
}

export default App;
