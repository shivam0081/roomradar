import React, { useContext, useState, useEffect } from 'react';
import { Navigate, Route, Routes, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import BrowsePage from './pages/BrowsePage';
import MatchesPage from './pages/MatchesPage';
import ShortlistPage from './pages/ShortlistPage';
import ChatPage from './pages/ChatPage';
import CreateRoomPage from './pages/CreateRoomPage';
import BookingsPage from './pages/BookingsPage';
import MyRoomsPage from './pages/MyRoomsPage';
import PageTransition from './components/PageTransition';
import HouseBackground from './components/HouseBackground';
import OwnerGuide from './components/OwnerGuide';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="page">
      <div className="spinner-wrap"><div className="spinner" /></div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function OwnerRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="page">
      <div className="spinner-wrap"><div className="spinner" /></div>
    </div>
  );
  if (!user || user.role !== 'owner') {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="empty-state-icon">🔒</span>
          <h3>Owner Only</h3>
          <p>You must be a house owner to access this page.</p>
        </div>
      </div>
    );
  }
  return children;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function Layout() {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [direction, setDirection] = useState('forward');

  useEffect(() => {
    // Determine 'walking' direction between rooms
    const path = location.pathname;
    
    const getDirection = (from, to) => {
      if (from === to) return 'fade';

      // ── Auth corridor (forward = walk in, backward = walk out) ──
      if (from === '/' && (to === '/login' || to === '/register')) return 'forward';
      if ((from === '/login' || from === '/register') && to === '/') return 'backward';
      if (from === '/login' && to === '/register') return 'right';
      if (from === '/register' && to === '/login') return 'left';

      // ── After login/register → main app (dive forward) ──
      if ((from === '/login' || from === '/register') && to === '/browse') return 'forward';

      // ── Home → Browse (walk into the house) ──
      if (from === '/' && to === '/browse') return 'forward';
      if (from === '/browse' && to === '/') return 'backward';

      // ── Browse → Side rooms (lateral movement) ──
      if (from === '/browse' && to === '/matches') return 'right';
      if (from === '/browse' && to === '/shortlist') return 'right';
      if (from === '/matches' && to === '/browse') return 'left';
      if (from === '/shortlist' && to === '/browse') return 'left';
      if (from === '/matches' && to === '/shortlist') return 'right';
      if (from === '/shortlist' && to === '/matches') return 'left';

      // ── Profile (a personal wing — step left) ──
      if (from === '/browse' && to === '/profile') return 'left';
      if (from === '/profile' && to === '/browse') return 'right';

      // ── Chat (deeper context — step down into conversation) ──
      if (to.startsWith('/chat')) return 'up';
      if (from.startsWith('/chat')) return 'down';

      // ── Management rooms (bookings, my-rooms, create-room — forward deeper) ──
      if (to === '/bookings' || to === '/my-rooms' || to === '/create-room') return 'forward';
      if (from === '/bookings' || from === '/my-rooms' || from === '/create-room') return 'backward';

      return 'fade';
    };

    setDirection(getDirection(prevPath, path));
    setPrevPath(path);

    // Dynamic room theme logic mapping paths to atmospheric gradient themes
    let theme = 'home';
    const currentPath = location.pathname;
    if (currentPath.startsWith('/login') || currentPath.startsWith('/register')) theme = 'auth';
    else if (currentPath.startsWith('/browse') || currentPath.startsWith('/matches') || currentPath.startsWith('/shortlist')) theme = 'main';
    else if (currentPath.startsWith('/bookings') || currentPath.startsWith('/my-rooms') || currentPath.startsWith('/create-room')) theme = 'management';
    else if (currentPath.startsWith('/profile') || currentPath.startsWith('/chat')) theme = 'personal';
    
    document.body.dataset.roomTheme = theme;

    const handleResize = () => {
      if (window.innerWidth > 1024) closeMobile();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [location.pathname]);

  // Cursor dot logic
  const dotRef = React.useRef(null);

  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Dot is instant
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      }
    };

    // Hover state handling
    const handleMouseOver = (e) => {
      const isInteractive = e.target.closest('a, button, input, select, textarea, .card, .feature-card, .tag-interactive');
      if (isInteractive) document.body.classList.add('cursor-hover');
    };
    const handleMouseOut = (e) => {
      const isInteractive = e.target.closest('a, button, input, select, textarea, .card, .feature-card, .tag-interactive');
      if (isInteractive) document.body.classList.remove('cursor-hover');
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  // Mouse tilt effect on cards
  useEffect(() => {
    const handleTilt = (e) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      el.style.transform = `translateY(-6px) scale(1.01) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    };
    const handleTiltReset = (e) => {
      e.currentTarget.style.transform = '';
    };
    const attachTilt = () => {
      const tiltTargets = document.querySelectorAll('.card, .feature-card, .hero-card');
      tiltTargets.forEach((el) => {
        el.addEventListener('mousemove', handleTilt, { passive: true });
        el.addEventListener('mouseleave', handleTiltReset);
      });
      return tiltTargets;
    };
    const els = attachTilt();
    return () => {
      els.forEach((el) => {
        el.removeEventListener('mousemove', handleTilt);
        el.removeEventListener('mouseleave', handleTiltReset);
      });
    };
  }, [location.pathname]);

  // Scroll-reveal: apply .animate-fade-up to cards as they enter viewport
  useEffect(() => {
    const targets = document.querySelectorAll(
      '.card, .feature-card, .hero-card, .auth-card, .filter-section, .chat-header, .messages'
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.pathname]);

  const navLink = (to, label) => (
    <NavLink
      className={({ isActive }) => `nav-item${isActive ? ' active-link' : ''}`}
      to={to}
      onClick={closeMobile}
    >
      {label}
    </NavLink>
  );

  return (
    <div className="app">
      <div ref={dotRef} className="custom-cursor-dot" />
      <OwnerGuide />
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo" onClick={closeMobile}>
            ◉ RoomRadar
          </NavLink>

          <nav className="desktop-nav">
            {!user ? (
              <div className="nav-group">
                {navLink('/login', 'Login')}
                <NavLink to="/register" className="nav-item nav-register" onClick={closeMobile}>
                  Register
                </NavLink>
              </div>
            ) : (
              <div className="nav-group">
                {navLink('/browse', 'Browse')}
                {navLink('/matches', 'Matches')}
                {navLink('/shortlist', 'Shortlist')}
                {navLink('/bookings', 'Bookings')}
                {user.role === 'owner' && navLink('/my-rooms', 'My Rooms')}
                {navLink('/profile', 'Profile')}
                <button className="nav-item nav-logout" onClick={() => { logout(); closeMobile(); }}>
                  Sign out
                </button>
                <div className="user-badge-nav">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="user-avatar-sm-img" />
                  ) : (
                    <div className="user-avatar-sm">{getInitials(user.name)}</div>
                  )}
                </div>
              </div>
            )}
          </nav>

          <button
            className={`mobile-toggle ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="burger" />
          </button>
        </div>

        {/* Mobile Slide-Down Menu */}
        <div className={`mobile-nav-tray ${mobileOpen ? "open" : ""}`}>
          <div className="mobile-links-grid">
            {!user ? (
              <>
                {navLink("/login", "Login")}
                {navLink("/register", "Register")}
              </>
            ) : (
              <>
                {navLink("/browse", "Browse")}
                {navLink("/matches", "Matches")}
                {navLink("/shortlist", "Shortlist")}
                {navLink("/bookings", "Bookings")}
                {user.role === "owner" && navLink("/my-rooms", "My Rooms")}
                {navLink("/profile", "Profile")}
              </>
            )}
          </div>
        </div>
        {mobileOpen && <div className="nav-backdrop" onClick={closeMobile} />}
      </header>

      <main className="main" onClick={closeMobile}>
        <AnimatePresence mode="wait" custom={direction}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition direction={direction}><HomePage /></PageTransition>} />
            <Route path="/login" element={<PageTransition direction={direction}><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition direction={direction}><RegisterPage /></PageTransition>} />
            <Route path="/profile" element={<ProtectedRoute><PageTransition direction={direction}><ProfilePage /></PageTransition></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><PageTransition direction={direction}><BrowsePage /></PageTransition></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><PageTransition direction={direction}><MatchesPage /></PageTransition></ProtectedRoute>} />
            <Route path="/shortlist" element={<ProtectedRoute><PageTransition direction={direction}><ShortlistPage /></PageTransition></ProtectedRoute>} />
            <Route path="/chat/:mode/:id" element={<ProtectedRoute><PageTransition direction={direction}><ChatPage /></PageTransition></ProtectedRoute>} />
            <Route path="/chat/:roomId" element={<ProtectedRoute><PageTransition direction={direction}><ChatPage /></PageTransition></ProtectedRoute>} />
            <Route path="/create-room" element={<ProtectedRoute><OwnerRoute><PageTransition direction={direction}><CreateRoomPage /></PageTransition></OwnerRoute></ProtectedRoute>} />
            <Route path="/edit-room/:id" element={<ProtectedRoute><OwnerRoute><PageTransition direction={direction}><CreateRoomPage /></PageTransition></OwnerRoute></ProtectedRoute>} />
            <Route path="/my-rooms" element={<ProtectedRoute><OwnerRoute><PageTransition direction={direction}><MyRoomsPage /></PageTransition></OwnerRoute></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><PageTransition direction={direction}><BookingsPage /></PageTransition></ProtectedRoute>} />
            <Route path="*" element={
              <PageTransition direction={direction}>
                <div className="page">
                  <div className="empty-state">
                    <span className="empty-state-icon">🔍</span>
                    <h3>Page not found</h3>
                    <p>The page you're looking for doesn't exist.</p>
                  </div>
                </div>
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </main>

      <HouseBackground direction={direction} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
