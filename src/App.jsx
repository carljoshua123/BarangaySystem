import React, { useEffect, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import FileReport from './pages/FileReport';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import RequestPage from './pages/RequestPage';
import HistoryPage from './pages/HistoryPage';
import ContactPage from './pages/ContactPage';
import FloatingMessage from './components/FloatingMessage';
import './App.css';

const adminNavigation = [
  ['dashboard', 'Dashboard'],
  ['messages', 'Messages'],
  ['assisted-request', 'Assisted Request'],
  ['analytics', 'Analytics'],
  ['report', 'Report'],
  ['emergency', 'Emergency'],
  ['incident', 'Incident'],
  ['anonymous-reports', 'Anonymous Reports'],
  ['requests', 'All Requests'],
  ['residence', 'Residence']
];

export default function App() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(null);
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const activeAdminView = user?.role === 'admin' && !adminNavigation.some(([view]) => view === currentView)
    ? 'dashboard'
    : currentView;

  const handleLoginSuccess = (userData, userToken) => {
    setPendingLogin({ userData, userToken });
  };

  const confirmLogin = () => {
    if (!pendingLogin) return;
    const { userData, userToken } = pendingLogin;
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    setCurrentView(userData.role === 'admin' ? 'dashboard' : 'home');
    setPendingLogin(null);
  };

  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    localStorage.clear();
    setToken('');
    setUser(null);
    setCurrentView('login');
    setShowLogoutConfirmation(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const renderPublicPage = () => {
    if (currentView === 'about') return <AboutPage />;
    if (currentView === 'request') return <RequestPage />;
    if (currentView === 'history') return <HistoryPage />;
    return <HomePage />;
  };

  const renderAuthenticatedView = () => {
    if (!user) {
      return <div className="section-placeholder"><h1>Please log in again</h1></div>;
    }

    if (user.role === 'resident' && (currentView === 'home' || currentView === 'about' || currentView === 'request' || currentView === 'history')) {
      return renderPublicPage();
    }

    if (currentView === 'analytics') {
      return (
        <section className="section-placeholder">
          <p className="welcome-kicker">Insights</p>
          <h1>Community Analytics</h1>
          <p>Analytics will appear here as more barangay reports and resident activity are recorded.</p>
        </section>
      );
    }

    if (user.role === 'admin' && (currentView === 'report' || currentView === 'emergency' || currentView === 'incident')) {
      return <AdminDashboard activeView={currentView} />;
    }

    if (currentView === 'report' || currentView === 'emergency' || currentView === 'incident') {
      const category = currentView === 'emergency' ? 'Emergency' : currentView === 'incident' ? 'Incident' : undefined;
      return <FileReport key={currentView} initialCategory={category} />;
    }

    return user.role === 'admin' ? <AdminDashboard activeView={currentView} /> : <FileReport />;
  };

  return (
    <div className={`app-shell ${theme}-theme min-h-screen flex flex-col`}>
      {/* Professional Navbar combining Bootstrap & Tailwind */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 shadow-md">
        <div className="container-fluid">
          <a className="navbar-brand font-bold text-lg text-white flex items-center gap-2" href="#">
            🏛️ BarangayConnect Portal
          </a>
          <div className="navbar-actions d-flex align-items-center gap-3">
            <button
              onClick={toggleTheme}
              className="theme-toggle btn btn-sm"
              type="button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '☾ Light' : '☀ Light'}
            </button>
            {token && user && (
              <span className="user-badge badge px-3 py-2 text-sm uppercase">
                {user.role} : {user.fullName}
              </span>
            )}
            {token && user && user.role !== 'admin' && (
              <button onClick={handleLogout} className="header-logout-btn btn btn-sm">
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main View Router Container */}
      <main className="app-main flex-grow container-fluid py-5">
        {!token ? (
          <div className="auth-layout row align-items-center">
            <div className="welcome-column col-12 col-lg-6">
              <div className="welcome-panel">
                <p className="welcome-kicker">Barangay 125</p>
                <h1>Welcome to Barangay 125</h1>
                <p className="welcome-copy">
                  Connect with your community, stay informed, and access essential barangay services in one place.
                </p>
              </div>
            </div>
            <div className="auth-column col-12 col-lg-6 col-xl-5">
              <div className="auth-card card shadow-lg border-0 rounded-xl p-4">
                <div className="flex justify-center mb-4 border-b pb-3">
                  <button 
                    onClick={() => setCurrentView('login')} 
                    className={`mx-2 px-4 py-2 font-semibold rounded-lg transition ${currentView === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setCurrentView('register')} 
                    className={`mx-2 px-4 py-2 font-semibold rounded-lg transition ${currentView === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    Create Account
                  </button>
                </div>
                {currentView === 'login' ? (
                  <Login onLoginSuccess={handleLoginSuccess} />
                ) : (
                  <Register switchToLogin={() => setCurrentView('login')} />
                )}
              </div>
            </div>
          </div>
        ) : (
            <div className={`authenticated-layout ${user.role === 'resident' ? 'resident-layout' : ''}`}>
            {user.role === 'admin' && (
              <aside className="app-sidebar" aria-label="Main navigation">
                <div className="sidebar-nav">
                  <p className="sidebar-label">Workspace</p>
                  {adminNavigation.map(([view, label]) => (
                    <button
                      key={view}
                      type="button"
                      className={`sidebar-link ${activeAdminView === view ? 'active' : ''}`}
                      aria-current={activeAdminView === view ? 'page' : undefined}
                      onClick={() => setCurrentView(view)}
                    >
                      <span className="sidebar-icon" aria-hidden="true">{view === 'dashboard' ? '▦' : view === 'messages' ? '✉' : view === 'assisted-request' ? '＋' : view === 'analytics' ? '◒' : view === 'report' ? '＋' : view === 'emergency' ? '!' : view === 'incident' ? '△' : view === 'anonymous-reports' ? '◉' : '⌂'}</span>
                      {label}
                    </button>
                  ))}
                </div>

                <button type="button" className="sidebar-logout" onClick={handleLogout}>
                  Logout
                </button>
              </aside>
            )}

            {user.role === 'resident' && (
              <nav className="resident-public-nav">
                <button type="button" className={currentView === 'home' ? 'resident-nav-item active' : 'resident-nav-item'} onClick={() => setCurrentView('home')}>
                  Home
                </button>
                <button type="button" className={currentView === 'about' ? 'resident-nav-item active' : 'resident-nav-item'} onClick={() => setCurrentView('about')}>
                  About
                </button>
                <button type="button" className={currentView === 'report' ? 'resident-nav-item active' : 'resident-nav-item'} onClick={() => setCurrentView('report')}>
                  Report
                </button>
                <button type="button" className={currentView === 'request' ? 'resident-nav-item active' : 'resident-nav-item'} onClick={() => setCurrentView('request')}>
                  Request
                </button>
                <button type="button" className={currentView === 'history' ? 'resident-nav-item active' : 'resident-nav-item'} onClick={() => setCurrentView('history')}>
                  History
                </button>
              </nav>
            )}

            <section className="authenticated-content">
              {renderAuthenticatedView()}
            </section>
          </div>
        )}
      </main>
      {token && user?.role === 'resident' && <FloatingMessage />}
      {pendingLogin && (
        <div className="auth-feedback-backdrop" role="presentation" onClick={() => setPendingLogin(null)}>
          <section
            className="auth-feedback-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-confirmation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="auth-feedback-kicker">Welcome</p>
            <h2 id="login-confirmation-title">Sign-in successful</h2>
            <p>Continue to your {pendingLogin.userData.role === 'admin' ? 'admin' : 'resident'} account?</p>
            <div>
              <button type="button" className="logout-cancel-button" onClick={() => setPendingLogin(null)}>Cancel</button>
              <button type="button" className="auth-feedback-continue" onClick={confirmLogin}>Continue</button>
            </div>
          </section>
        </div>
      )}
      {showLogoutConfirmation && (
        <div className="logout-confirmation-backdrop" role="presentation" onClick={() => setShowLogoutConfirmation(false)}>
          <section
            className="logout-confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-confirmation-title"
            aria-describedby="logout-confirmation-description"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="logout-confirmation-title">Confirm logout</h2>
            <p id="logout-confirmation-description">Are you sure you want to logout?</p>
            <div>
              <button type="button" className="logout-cancel-button" onClick={() => setShowLogoutConfirmation(false)}>
                Cancel
              </button>
              <button type="button" className="logout-confirm-button" onClick={confirmLogout}>
                Logout
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}