import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { initializeMobileEnhancements } from './mobileEnhancements';

// Set up axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

// Auth Context
const AuthContext = React.createContext();

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    
    // Initialize mobile enhancements
    initializeMobileEnhancements();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post('/api/login', credentials);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await fetchUser();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/register', userData);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await fetchUser();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/matches/:id" element={<MatchDetailPage />} />
              <Route path="/matches/:id/stats" element={<MatchStatsPage />} />
              <Route path="/create-match" element={
                <ProtectedRoute>
                  <CreateMatchPage />
                </ProtectedRoute>
              } />
              <Route path="/score/:id" element={
                <ProtectedRoute>
                  <ScoringPage />
                </ProtectedRoute>
              } />
              <Route path="/teams" element={
                <ProtectedRoute>
                  <TeamsPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

// Header Component
// Enhanced Mobile-Responsive Header Component
function Header() {
  const { user, logout } = React.useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <span className="text-3xl">🏏</span>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Cricklytics</h1>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <a 
              href="/" 
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </a>
            <a 
              href="/matches" 
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors relative group"
            >
              Matches
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </a>
            {user && (
              <>
                <a 
                  href="/create-match" 
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors relative group"
                >
                  Create Match
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                </a>
                <a 
                  href="/teams" 
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors relative group"
                >
                  Teams
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                </a>
              </>
            )}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <a
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 font-medium transition-colors"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
                >
                  Register
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3 pt-4">
              <a 
                href="/" 
                onClick={closeMobileMenu}
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md font-medium transition-colors"
              >
                🏠 Home
              </a>
              <a 
                href="/matches" 
                onClick={closeMobileMenu}
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md font-medium transition-colors"
              >
                🏏 Matches
              </a>
              {user && (
                <>
                  <a 
                    href="/create-match" 
                    onClick={closeMobileMenu}
                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md font-medium transition-colors"
                  >
                    ➕ Create Match
                  </a>
                  <a 
                    href="/teams" 
                    onClick={closeMobileMenu}
                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md font-medium transition-colors"
                  >
                    👥 Teams
                  </a>
                </>
              )}
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-md">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.role}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { logout(); closeMobileMenu(); }}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-md font-medium transition-colors"
                    >
                      🚪 Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <a
                      href="/login"
                      onClick={closeMobileMenu}
                      className="block w-full text-center border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-md font-medium transition-colors"
                    >
                      🔑 Login
                    </a>
                    <a
                      href="/register"
                      onClick={closeMobileMenu}
                      className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md font-medium transition-colors"
                    >
                      🚀 Register
                    </a>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        ></div>
      )}
    </header>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user } = React.useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

// Home Page Component - Enhanced Public Landing Page
function HomePage() {
  const { user } = React.useContext(AuthContext);
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [statsData, setStatsData] = useState({});

  useEffect(() => {
    fetchLiveMatches();
    fetchRecentMatches();
    fetchGlobalStats();
  }, []);

  const fetchLiveMatches = async () => {
    try {
      const response = await axios.get('/api/matches?status=live');
      setLiveMatches(response.data.slice(0, 3)); // Show top 3 live matches
    } catch (error) {
      console.error('Error fetching live matches:', error);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      const response = await axios.get('/api/matches?status=completed&limit=6');
      setRecentMatches(response.data);
    } catch (error) {
      console.error('Error fetching recent matches:', error);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const response = await axios.get('/api/stats/global');
      setStatsData(response.data);
    } catch (error) {
      console.error('Error fetching global stats:', error);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20 px-8 rounded-2xl mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            🏏 Welcome to Cricklytics
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Your complete cricket scoring and analytics platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <>
                <a href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105">
                  Start Scoring
                </a>
                <a href="/matches" className="border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all">
                  Browse Matches
                </a>
              </>
            )}
          </div>
        </div>
        <div className="absolute top-10 right-10 opacity-20 text-8xl animate-bounce">🏏</div>
        <div className="absolute bottom-10 left-10 opacity-20 text-6xl animate-pulse">📊</div>
      </div>

      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              🔴 Live Matches
              <span className="ml-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                LIVE
              </span>
            </h2>
            <a href="/matches" className="text-blue-600 hover:text-blue-800 font-semibold">
              View All →
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {liveMatches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Platform Features */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Why Choose Cricklytics?
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <FeatureCard 
            icon="📊" 
            title="Live Scoring" 
            description="Real-time ball-by-ball scoring with instant updates"
            color="bg-blue-50 border-blue-200"
          />
          <FeatureCard 
            icon="🤖" 
            title="AI Analytics" 
            description="Smart insights and Man of the Match predictions"
            color="bg-purple-50 border-purple-200"
          />
          <FeatureCard 
            icon="📈" 
            title="Statistics" 
            description="Comprehensive stats and performance metrics"
            color="bg-green-50 border-green-200"
          />
          <FeatureCard 
            icon="📱" 
            title="Mobile Ready" 
            description="Score matches on any device, anywhere"
            color="bg-orange-50 border-orange-200"
          />
        </div>
      </div>

      {/* Global Statistics */}
      <div className="mb-12 bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Platform Statistics
        </h2>
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <StatCard title="Total Matches" value={statsData.totalMatches || 0} icon="🏏" />
          <StatCard title="Balls Bowled" value={statsData.totalBalls || 0} icon="⚾" />
          <StatCard title="Runs Scored" value={statsData.totalRuns || 0} icon="🏃" />
          <StatCard title="Active Users" value={statsData.activeUsers || 0} icon="👥" />
        </div>
      </div>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Recent Matches</h2>
            <a href="/matches" className="text-blue-600 hover:text-blue-800 font-semibold">
              View All →
            </a>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentMatches.map((match) => (
              <RecentMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-8 rounded-2xl text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Scoring?</h2>
        <p className="text-lg mb-6 opacity-90">
          Join thousands of scorers and bring your cricket matches to life
        </p>
        {!user && (
          <a href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 inline-block">
            Get Started Free
          </a>
        )}
      </div>
    </div>
  );
}

// Enhanced Feature Card Component
function FeatureCard({ icon, title, description, color }) {
  return (
    <div className={`${color} border-2 p-6 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

// Live Match Card Component
function LiveMatchCard({ match }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{match.name}</h3>
        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs animate-pulse">LIVE</span>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="font-semibold">{match.team1}</span>
          <span>{match.team1_score || '0/0'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">{match.team2}</span>
          <span>{match.team2_score || 'Yet to bat'}</span>
        </div>
      </div>
      <a 
        href={`/matches/${match.id}`} 
        className="block text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
      >
        View Live
      </a>
    </div>
  );
}

// Recent Match Card Component  
function RecentMatchCard({ match }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border hover:border-blue-200">
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2">{match.name}</h3>
        <p className="text-sm text-gray-500">{match.date} • {match.venue}</p>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="font-semibold">{match.team1}</span>
          <span>{match.team1_score}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">{match.team2}</span>
          <span>{match.team2_score}</span>
        </div>
      </div>
      {match.result && (
        <p className="text-sm font-semibold text-green-600 mb-3">{match.result}</p>
      )}
      <a 
        href={`/matches/${match.id}`} 
        className="block text-center bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition-colors"
      >
        View Details
      </a>
    </div>
  );
}

// Statistics Card Component
function StatCard({ title, value, icon }) {
  return (
    <div className="p-4">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-blue-600 mb-1">{value.toLocaleString()}</div>
      <div className="text-gray-600 font-medium">{title}</div>
    </div>
  );
}

// Login Page Component
function LoginPage() {
  const { login } = React.useContext(AuthContext);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials);
    if (result.success) {
      window.location.href = '/';
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to Cricklytics</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Username
          </label>
          <input
            type="text"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p className="text-center mt-4 text-gray-600">
        Don't have an account?{' '}
        <a href="/register" className="text-blue-500 hover:underline">
          Register here
        </a>
      </p>
    </div>
  );
}

// Register Page Component
function RegisterPage() {
  const { register } = React.useContext(AuthContext);
  const [userData, setUserData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(userData);
    if (result.success) {
      window.location.href = '/';
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Register for Cricklytics</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Username
          </label>
          <input
            type="text"
            value={userData.username}
            onChange={(e) => setUserData({...userData, username: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({...userData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={userData.password}
              onChange={(e) => setUserData({...userData, password: e.target.value})}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p className="text-center mt-4 text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="text-blue-500 hover:underline">
          Login here
        </a>
      </p>
    </div>
  );
}

// Matches Page Component
// Enhanced Matches Page with Public Viewing Portal
function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/matches');
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedMatches = matches
    .filter(match => {
      const matchesFilter = filter === 'all' || match.status === filter;
      const matchesSearch = searchTerm === '' || 
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team2.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.venue.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'venue':
          return a.venue.localeCompare(b.venue);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const getStatusInfo = (status) => {
    switch (status) {
      case 'setup': 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-300', 
          icon: '⚙️', 
          label: 'Setup' 
        };
      case 'live': 
        return { 
          color: 'bg-red-100 text-red-800 border-red-300', 
          icon: '🔴', 
          label: 'Live',
          pulse: true
        };
      case 'completed': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-300', 
          icon: '✅', 
          label: 'Completed' 
        };
      case 'paused': 
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-300', 
          icon: '⏸️', 
          label: 'Paused' 
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-300', 
          icon: '❓', 
          label: 'Unknown' 
        };
    }
  };

  const getMatchTypeInfo = (matchType) => {
    switch (matchType) {
      case 'T20':
        return { color: 'bg-blue-100 text-blue-800', icon: '⚡' };
      case 'ODI':
        return { color: 'bg-purple-100 text-purple-800', icon: '🏏' };
      case 'Test':
        return { color: 'bg-green-100 text-green-800', icon: '🕐' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: '🏏' };
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner w-16 h-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🏏 Cricket Matches</h1>
            <p className="text-gray-600">Discover live and completed cricket matches</p>
          </div>
          {user && (
            <a
              href="/create-match"
              className="btn-primary mt-4 md:mt-0 inline-flex items-center"
            >
              <span className="mr-2">➕</span>
              Create New Match
            </a>
          )}
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search matches, teams, or venues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="venue">Sort by Venue</option>
              <option value="status">Sort by Status</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'live', 'completed', 'setup', 'paused'].map(status => {
            const count = status === 'all' ? matches.length : matches.filter(m => m.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                  filter === status
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'all' && '📋'}
                {status === 'live' && '🔴'}
                {status === 'completed' && '✅'}
                {status === 'setup' && '⚙️'}
                {status === 'paused' && '⏸️'}
                <span className="ml-2">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span className="ml-2 bg-black bg-opacity-20 px-2 py-1 rounded-full text-xs">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Results */}
      {filteredAndSortedMatches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <div className="text-8xl mb-6 animate-bounce">🏏</div>
          <h3 className="text-2xl font-bold text-gray-600 mb-4">
            {searchTerm ? 'No matches found' : (filter === 'all' ? 'No matches yet' : `No ${filter} matches`)}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? `We couldn't find any matches matching "${searchTerm}". Try adjusting your search terms.`
              : (filter === 'all' 
                ? 'Be the first to create a match and start scoring!' 
                : `No matches with status "${filter}" found. Try selecting a different filter.`)}
          </p>
          {user && !searchTerm && filter === 'all' && (
            <a
              href="/create-match"
              className="btn-primary inline-flex items-center"
            >
              <span className="mr-2">➕</span>
              Create Your First Match
            </a>
          )
          }
        </div>
      ) : (
        <div className={`${viewMode === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}`}>
          {filteredAndSortedMatches.map((match) => (
            viewMode === 'grid' ? (
              <EnhancedMatchCard key={match.id} match={match} getStatusInfo={getStatusInfo} getMatchTypeInfo={getMatchTypeInfo} />
            ) : (
              <EnhancedMatchListItem key={match.id} match={match} getStatusInfo={getStatusInfo} getMatchTypeInfo={getMatchTypeInfo} />
            )
          ))}
        </div>
      )}
    </div>
  );
}

// Enhanced Match Card Component
function EnhancedMatchCard({ match, getStatusInfo, getMatchTypeInfo }) {
  const statusInfo = getStatusInfo(match.status);
  const matchTypeInfo = getMatchTypeInfo(match.match_type);
  const { user } = React.useContext(AuthContext);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Auto-hide notification after 5 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`/api/matches/${match.id}`);
      window.location.reload(); // Refresh the page to show updated list
    } catch (error) {
      console.error('Error deleting match:', error);
      setNotification({ type: 'error', message: 'Failed to delete match. Please try again.' });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const canDelete = user && match.created_by_name === user.username;

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg truncate">{match.name}</h3>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
              <span className="mr-1">{statusInfo.icon}</span>
              {statusInfo.label}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm opacity-90">
          <span>📅 {new Date(match.date).toLocaleDateString()}</span>
          <span>📍 {match.venue}</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${matchTypeInfo.color}`}>
            <span className="mr-1">{matchTypeInfo.icon}</span>
            {match.match_type}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="p-6">
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">
                  {match.team1.charAt(0)}
                </span>
              </div>
              <span className="font-semibold text-gray-900">{match.team1}</span>
            </div>
            <span className="font-mono text-lg font-bold text-gray-700">
              {match.team1_score || '0/0'}
            </span>
          </div>
          
          <div className="flex items-center justify-center">
            <span className="text-gray-400 font-bold">VS</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">
                  {match.team2.charAt(0)}
                </span>
              </div>
              <span className="font-semibold text-gray-900">{match.team2}</span>
            </div>
            <span className="font-mono text-lg font-bold text-gray-700">
              {match.team2_score || 'Yet to bat'}
            </span>
          </div>
        </div>

        {/* Result */}
        {match.result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-semibold text-green-800 text-center">
              🏆 {match.result}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <a
            href={`/matches/${match.id}`}
            className="flex-1 bg-blue-500 text-white text-center py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            View Details
          </a>
          {user && (
            <a
              href={`/score/${match.id}`}
              className={`flex-1 text-white text-center py-2 rounded-lg transition-colors font-medium ${
                match.status === 'live' 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {match.status === 'live' ? '🔴 Score Live' : '📊 Start Scoring'}
            </a>
          )}
        </div>
        
        {/* Delete Button for Match Creator */}
        {canDelete && (
          <div className="mt-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`w-full text-center py-2 rounded-lg font-medium transition-colors ${
                showDeleteConfirm 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {deleting ? 'Deleting...' : showDeleteConfirm ? 'Confirm Delete' : '🗑️ Delete Match'}
            </button>
            {showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full mt-1 text-center py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 max-w-md w-full z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white p-4 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced Match List Item Component
function EnhancedMatchListItem({ match, getStatusInfo, getMatchTypeInfo }) {
  const statusInfo = getStatusInfo(match.status);
  const matchTypeInfo = getMatchTypeInfo(match.match_type);
  const { user } = React.useContext(AuthContext);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Auto-hide notification after 5 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`/api/matches/${match.id}`);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting match:', error);
      setNotification({ type: 'error', message: 'Failed to delete match. Please try again.' });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const canDelete = user && match.created_by_name === user.username;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-3">
            <h3 className="font-bold text-xl text-gray-900">{match.name}</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
              <span className="mr-1">{statusInfo.icon}</span>
              {statusInfo.label}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${matchTypeInfo.color}`}>
              <span className="mr-1">{matchTypeInfo.icon}</span>
              {match.match_type}
            </span>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
            <span>📅 {new Date(match.date).toLocaleDateString()}</span>
            <span>📍 {match.venue}</span>
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xs">
                  {match.team1.charAt(0)}
                </span>
              </div>
              <span className="font-semibold">{match.team1}</span>
              <span className="font-mono font-bold text-gray-700">
                {match.team1_score || '0/0'}
              </span>
            </div>
            
            <span className="text-gray-400 font-bold">VS</span>
            
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-xs">
                  {match.team2.charAt(0)}
                </span>
              </div>
              <span className="font-semibold">{match.team2}</span>
              <span className="font-mono font-bold text-gray-700">
                {match.team2_score || 'Yet to bat'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={`/matches/${match.id}`}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            View Details
          </a>
          {user && (
            <a
              href={`/score/${match.id}`}
              className={`text-white px-4 py-2 rounded-lg transition-colors font-medium ${
                match.status === 'live' 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {match.status === 'live' ? '🔴 Score Live' : '📊 Start Scoring'}
            </a>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showDeleteConfirm 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              } ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {deleting ? 'Deleting...' : showDeleteConfirm ? 'Confirm Delete' : '🗑️ Delete'}
            </button>
          )}
          {showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-gray-500 hover:text-gray-700 px-2 py-2"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 max-w-md w-full z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white p-4 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Teams Management Page
function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data);
      setError(''); // Clear error on successful load
    } catch (error) {
      console.error('Error fetching teams:', error);
      if (error.response?.status === 404) {
        // 404 means no teams exist yet, which is fine
        setTeams([]);
        setError('');
      } else {
        setError('Failed to load teams. Please check if the server is running.');
        setTeams([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamName) => {
    setTeamToDelete(teamName);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    try {
      await axios.delete(`/api/teams/${encodeURIComponent(teamToDelete)}`);
      await fetchTeams();
      setNotification({ type: 'success', message: `Team "${teamToDelete}" deleted successfully.` });
    } catch (error) {
      console.error('Error deleting team:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to delete team';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(err => `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`)
            .join('\n');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setNotification({ type: 'error', message: `${errorMessage}. Please try again.` });
    } finally {
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.players.some(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner w-16 h-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">👥 Team Management</h1>
            <p className="text-gray-600">Manage your cricket teams and players</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary mt-4 md:mt-0 inline-flex items-center"
          >
            <span className="mr-2">➕</span>
            Create New Team
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search teams or players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          {error}
        </div>
      )}

      {/* Teams List */}
      {filteredTeams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <div className="text-8xl mb-6">👥</div>
          <h3 className="text-2xl font-bold text-gray-600 mb-4">
            {searchTerm ? 'No teams found' : 'No teams yet'}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? `We couldn't find any teams matching "${searchTerm}".`
              : 'Create your first team to start managing players and organizing matches.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center"
            >
              <span className="mr-2">➕</span>
              Create Your First Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeams.map((team, index) => (
            <TeamCard 
              key={index} 
              team={team} 
              onEdit={() => {
                setSelectedTeam(team);
                setShowEditModal(true);
              }}
              onDelete={() => handleDeleteTeam(team.name)}
            />
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTeams();
          }}
        />
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <EditTeamModal
          team={selectedTeam}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeam(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTeam(null);
            fetchTeams();
          }}
        />
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 max-w-md w-full z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white p-4 rounded-lg shadow-lg`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete team "{teamToDelete}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTeamToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTeam}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Team Card Component
function TeamCard({ team, onEdit, onDelete }) {
  const [showPlayers, setShowPlayers] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg">{team.name}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-colors"
              title="Edit Team"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-colors"
              title="Delete Team"
            >
              🗑️
            </button>
          </div>
        </div>
        <div className="text-sm opacity-90">
          {team.players.length} players • {team.total_matches} matches
        </div>
        {/* Captain and Vice-Captain */}
        {(team.captain || team.viceCaptain) && (
          <div className="text-xs opacity-80 mt-1">
            {team.captain && <span>👑 {team.captain}</span>}
            {team.captain && team.viceCaptain && <span> • </span>}
            {team.viceCaptain && <span>🥈 {team.viceCaptain}</span>}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Player Summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Players</h4>
            <button
              onClick={() => setShowPlayers(!showPlayers)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              {showPlayers ? 'Hide' : 'Show'} All
            </button>
          </div>
          
          {/* Role Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(() => {
              const roleCounts = {
                'Batter': team.players.filter(p => p.role === 'Batter').length,
                'Bowler': team.players.filter(p => p.role === 'Bowler').length,
                'Allrounder': team.players.filter(p => p.role.includes('Allrounder')).length,
                'Wicketkeeper': team.players.filter(p => p.role.includes('Wicketkeeper')).length
              };
              
              return Object.entries(roleCounts)
                .filter(([role, count]) => count > 0)
                .map(([role, count]) => (
                  <div key={role} className="bg-gray-50 p-2 rounded text-center">
                    <div className="font-semibold">{count}</div>
                    <div className="text-gray-600">{role}s</div>
                  </div>
                ));
            })()}
          </div>
        </div>

        {/* Players List */}
        {showPlayers && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {team.players.map((player, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium flex items-center">
                  {player.name}
                  {player.name === team.captain && <span className="ml-1 text-yellow-500">👑</span>}
                  {player.name === team.viceCaptain && <span className="ml-1 text-gray-400">🥈</span>}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {player.role}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Matches Used */}
        {team.matches_used.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="font-semibold text-sm text-gray-600 mb-2">Recent Matches</h5>
            <div className="space-y-1">
              {team.matches_used.slice(0, 3).map((match, index) => (
                <a
                  key={index}
                  href={`/matches/${match.match_id}`}
                  className="block text-xs text-blue-600 hover:text-blue-800 truncate"
                >
                  {match.match_name}
                </a>
              ))}
              {team.matches_used.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{team.matches_used.length - 3} more matches
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Create Team Modal
function CreateTeamModal({ onClose, onSuccess }) {
  const [teamData, setTeamData] = useState({
    name: '',
    players: [{ name: '', role: 'Batter' }],
    captain: '',
    viceCaptain: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const playerRoles = [
    'Batter',
    'Bowler',
    'Batting Allrounder',
    'Bowling Allrounder',
    'Wicketkeeper',
    'Wicketkeeper-Batter'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!teamData.name.trim()) {
      setError('Team name is required');
      setLoading(false);
      return;
    }

    const validPlayers = teamData.players.filter(p => p.name.trim());
    if (validPlayers.length === 0) {
      setError('At least one player is required');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/teams', {
        name: teamData.name,
        players: validPlayers,
        captain: teamData.captain,
        viceCaptain: teamData.viceCaptain
      });
      onSuccess();
    } catch (error) {
      console.error('Create team error:', error.response?.data);
      
      // Handle different types of errors
      let errorMessage = 'Failed to create team';
      
      if (error.response?.data?.detail) {
        // Check if detail is an array (FastAPI validation errors)
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(err => `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`)
            .join('\n');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    setTeamData(prev => ({
      ...prev,
      players: [...prev.players, { name: '', role: 'Batter' }]
    }));
  };

  const removePlayer = (index) => {
    if (teamData.players.length > 1) {
      setTeamData(prev => ({
        ...prev,
        players: prev.players.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePlayer = (index, field, value) => {
    setTeamData(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create New Team</h2>
                <p className="text-blue-100 text-sm">Build your cricket squad</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 200px)'}}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-start">
                  <span className="text-red-500 text-xl mr-3 flex-shrink-0">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-700 font-medium whitespace-pre-line">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Team Name */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <label className="block text-gray-900 text-lg font-bold mb-3 flex items-center">
                <span className="text-blue-500 mr-2">🏏</span>
                Team Name *
              </label>
              <input
                type="text"
                value={teamData.name}
                onChange={(e) => setTeamData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Enter your team name"
                required
              />
            </div>

            {/* Players */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-gray-900 text-lg font-bold flex items-center">
                  <span className="text-green-500 mr-2">👨‍🏫</span>
                  Team Players *
                </label>
                <button
                  type="button"
                  onClick={addPlayer}
                  disabled={teamData.players.length >= 15}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center"
                >
                  <span className="mr-2">➕</span>
                  Add Player
                </button>
              </div>

              <div className="relative">
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pb-12">
                  {teamData.players.map((player, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Player ${index + 1} name`}
                        />
                        <select
                          value={player.role}
                          onChange={(e) => updatePlayer(index, 'role', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
                        >
                          {playerRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        {teamData.players.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlayer(index)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                            title="Remove player"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Sticky player count at bottom of scrollable area */}
                <div className="absolute bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-200 px-3 py-2 rounded-b-lg">
                  <div className="text-sm text-gray-600 flex items-center">
                    <span className="text-blue-500 mr-2">ℹ️</span>
                    {teamData.players.length}/15 players added
                  </div>
                </div>
              </div>
            </div>

            {/* Captain and Vice-Captain Selection */}
            {teamData.players.filter(p => p.name.trim()).length > 0 && (
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-yellow-500 mr-2">👑</span>
                  Leadership Selection
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                      <span className="text-yellow-500 mr-2">👑</span>
                      Captain
                    </label>
                    <select
                      value={teamData.captain}
                      onChange={(e) => setTeamData(prev => ({ ...prev, captain: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="">Select Captain</option>
                      {teamData.players
                        .filter(player => player.name.trim())
                        .map((player, index) => (
                          <option key={index} value={player.name}>
                            {player.name} ({player.role})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                      <span className="text-gray-500 mr-2">🥈</span>
                      Vice-Captain
                    </label>
                    <select
                      value={teamData.viceCaptain}
                      onChange={(e) => setTeamData(prev => ({ ...prev, viceCaptain: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="">Select Vice-Captain</option>
                      {teamData.players
                        .filter(player => player.name.trim() && player.name !== teamData.captain)
                        .map((player, index) => (
                          <option key={index} value={player.name}>
                            {player.name} ({player.role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 sticky bottom-0 z-10">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
            >
              <span className="mr-2">✖️</span>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !teamData.name.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Create Team
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Team Modal
function EditTeamModal({ team, onClose, onSuccess }) {
  const [teamData, setTeamData] = useState({
    name: team.name,
    players: [...team.players],
    captain: team.captain || '',
    viceCaptain: team.viceCaptain || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const playerRoles = [
    'Batter',
    'Bowler',
    'Batting Allrounder',
    'Bowling Allrounder',
    'Wicketkeeper',
    'Wicketkeeper-Batter'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!teamData.name.trim()) {
      setError('Team name is required');
      setLoading(false);
      return;
    }

    const validPlayers = teamData.players.filter(p => p.name.trim());
    if (validPlayers.length === 0) {
      setError('At least one player is required');
      setLoading(false);
      return;
    }

    try {
      await axios.put(`/api/teams/${encodeURIComponent(team.name)}`, {
        name: teamData.name,
        players: validPlayers,
        captain: teamData.captain,
        viceCaptain: teamData.viceCaptain
      });
      onSuccess();
    } catch (error) {
      console.error('Update team error:', error.response?.data);
      
      // Handle different types of errors
      let errorMessage = 'Failed to update team';
      
      if (error.response?.data?.detail) {
        // Check if detail is an array (FastAPI validation errors)
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(err => `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`)
            .join('\n');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    setTeamData(prev => ({
      ...prev,
      players: [...prev.players, { name: '', role: 'Batter' }]
    }));
  };

  const removePlayer = (index) => {
    if (teamData.players.length > 1) {
      setTeamData(prev => ({
        ...prev,
        players: prev.players.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePlayer = (index, field, value) => {
    setTeamData(prev => ({
      ...prev,
      players: prev.players.map((player, i) => 
        i === index ? { ...player, [field]: value } : player
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <span className="text-2xl">✏️</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Edit Team</h2>
                <p className="text-green-100 text-sm">Update {team.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 200px)'}}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-start">
                  <span className="text-red-500 text-xl mr-3 flex-shrink-0">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-700 font-medium whitespace-pre-line">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Team Name */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <label className="block text-gray-900 text-lg font-bold mb-3 flex items-center">
                <span className="text-green-500 mr-2">🏏</span>
                Team Name *
              </label>
              <input
                type="text"
                value={teamData.name}
                onChange={(e) => setTeamData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                placeholder="Enter team name"
                required
              />
            </div>

            {/* Players */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-gray-900 text-lg font-bold flex items-center">
                  <span className="text-green-500 mr-2">👨‍🏫</span>
                  Team Players *
                </label>
                <button
                  type="button"
                  onClick={addPlayer}
                  disabled={teamData.players.length >= 15}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 disabled:hover:scale-100 flex items-center"
                >
                  <span className="mr-2">➕</span>
                  Add Player
                </button>
              </div>

              <div className="relative">
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pb-12">
                  {teamData.players.map((player, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder={`Player ${index + 1} name`}
                        />
                        <select
                          value={player.role}
                          onChange={(e) => updatePlayer(index, 'role', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent min-w-[160px]"
                        >
                          {playerRoles.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        {teamData.players.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlayer(index)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                            title="Remove player"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Sticky player count at bottom of scrollable area */}
                <div className="absolute bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-200 px-3 py-2 rounded-b-lg">
                  <div className="text-sm text-gray-600 flex items-center">
                    <span className="text-blue-500 mr-2">ℹ️</span>
                    {teamData.players.length}/15 players added
                  </div>
                </div>
              </div>
            </div>

            {/* Captain and Vice-Captain Selection */}
            {teamData.players.filter(p => p.name.trim()).length > 0 && (
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-yellow-500 mr-2">👑</span>
                  Leadership Selection
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                      <span className="text-yellow-500 mr-2">👑</span>
                      Captain
                    </label>
                    <select
                      value={teamData.captain}
                      onChange={(e) => setTeamData(prev => ({ ...prev, captain: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="">Select Captain</option>
                      {teamData.players
                        .filter(player => player.name.trim())
                        .map((player, index) => (
                          <option key={index} value={player.name}>
                            {player.name} ({player.role})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 flex items-center">
                      <span className="text-gray-500 mr-2">🥈</span>
                      Vice-Captain
                    </label>
                    <select
                      value={teamData.viceCaptain}
                      onChange={(e) => setTeamData(prev => ({ ...prev, viceCaptain: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    >
                      <option value="">Select Vice-Captain</option>
                      {teamData.players
                        .filter(player => player.name.trim() && player.name !== teamData.captain)
                        .map((player, index) => (
                          <option key={index} value={player.name}>
                            {player.name} ({player.role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 sticky bottom-0 z-10">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
            >
              <span className="mr-2">✖️</span>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !teamData.name.trim()}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <span className="mr-2">💾</span>
                  Update Team
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Missing Page Components (placeholder implementations)
function MatchDetailPage() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    fetchMatchDetails();
  }, [id]);

  const fetchMatchDetails = async () => {
    try {
      const [matchResponse, statsResponse] = await Promise.all([
        axios.get(`/api/matches/${id}/score`),
        axios.get(`/api/matches/${id}/statistics`).catch(() => ({ data: null })) // Don't fail if stats aren't available
      ]);
      
      setMatch(matchResponse.data);
      setStats(statsResponse.data);
      setError('');
    } catch (error) {
      console.error('Error fetching match:', error);
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const startMatch = async () => {
    try {
      await axios.patch(`/api/matches/${id}/start`);
      fetchMatchDetails(); // Refresh match data
    } catch (error) {
      console.error('Error starting match:', error);
      setError('Failed to start match');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-lg text-gray-600">Loading match...</span>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'Match not found'}</p>
          <div className="mt-4 space-x-4">
            <button
              onClick={() => window.history.back()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
            <a
              href="/matches"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              All Matches
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Match Details</h1>
        <a 
          href="/matches" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ← Back to Matches
        </a>
      </div>

      {/* Match Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{match.match?.name}</h2>
          <div className="flex items-center space-x-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              match.match?.status === 'live' ? 'bg-red-500 bg-opacity-20' : 
              match.match?.status === 'completed' ? 'bg-blue-500 bg-opacity-20' :
              'bg-gray-500 bg-opacity-20'
            }`}>
              {match.match?.status === 'live' ? '🔴 LIVE' : 
               match.match?.status === 'completed' ? '✅ COMPLETED' : 
               '⏸️ ' + match.match?.status?.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 text-sm opacity-90">
          <div>📅 {new Date(match.match?.date).toLocaleDateString()}</div>
          <div>📍 {match.match?.venue}</div>
          <div>🏏 {match.match?.match_type}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Match Status</h3>
            
            {(() => {
              // Determine current innings and batting team
              const currentInnings = match.current_over?.innings || 1;
              const battingTeam = currentInnings === 1 ? match.match?.batting_first : 
                                 (match.match?.batting_first === match.match?.team1 ? match.match?.team2 : match.match?.team1);
              const currentInningsData = match.innings_scores?.[currentInnings];
              const isFirstInnings = currentInnings === 1;
              const matchType = match.match?.match_type || 'T20';
              
              // Get completed innings data (for 2nd innings target calculation)
              const completedInningsData = match.innings_scores?.[1];
              const target = !isFirstInnings && completedInningsData ? completedInningsData.runs + 1 : null;
              const runRate = (() => {
                // Calculate total overs bowled (including partial overs)
                const totalOvers = (currentInningsData?.overs || 0) + ((currentInningsData?.balls_in_current_over || 0) / 6);
                const runs = currentInningsData?.runs || 0;
                
                // If no balls bowled, return 0.00
                if (totalOvers === 0) return '0.00';
                
                // Calculate run rate as runs per over
                return (runs / totalOvers).toFixed(2);
              })();
              
              return (
                <div>
                  {/* Main Score Display */}
                  <div className="text-center mb-6">
                    <h2 className="text-4xl font-bold mb-2 text-blue-600">
                      {battingTeam} {currentInningsData?.runs || 0}/{currentInningsData?.wickets || 0}
                    </h2>
                    <div className="text-xl text-gray-600 mb-2">
                      ({currentInningsData?.overs || 0}.{currentInningsData?.balls_in_current_over || 0} overs)
                    </div>
                    
                    {/* Match Context */}
                    <div className="text-lg font-semibold text-gray-700 mb-1">
                      {isFirstInnings ? 
                        `${battingTeam} 1st Innings` : 
                        `${battingTeam} 2nd Innings`
                      }
                    </div>
                    
                    {/* Current Run Rate */}
                    <div className="text-sm text-gray-600">
                      Current Run Rate: {runRate}
                    </div>
                  </div>
                  
                  {/* Target Information for 2nd Innings */}
                  {!isFirstInnings && target && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-800 mb-1">
                          Target: {target} runs
                        </div>
                        <div className="text-sm text-blue-600">
                          Need {target - (currentInningsData?.runs || 0)} runs to win
                          {matchType !== 'Test' && (
                            <span> from {(() => {
                              const totalOvers = matchType === 'T10' ? 10 : matchType === 'ODI' ? 50 : 20;
                              const ballsRemaining = (totalOvers * 6) - ((currentInningsData?.overs || 0) * 6 + (currentInningsData?.balls_in_current_over || 0));
                              return `${Math.floor(ballsRemaining / 6)}.${ballsRemaining % 6} overs`;
                            })()}</span>
                          )}
                        </div>
                        {matchType !== 'Test' && (
                          <div className="text-sm text-blue-600 mt-1">
                            Required Run Rate: {(() => {
                              const totalOvers = matchType === 'T10' ? 10 : matchType === 'ODI' ? 50 : 20;
                              const oversRemaining = totalOvers - (currentInningsData?.overs || 0) - ((currentInningsData?.balls_in_current_over || 0) / 6);
                              const runsNeeded = target - (currentInningsData?.runs || 0);
                              return oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : 'N/A';
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-600">Match Type</div>
                      <div className="text-lg font-bold">{matchType}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-600">Innings</div>
                      <div className="text-lg font-bold">{currentInnings}{isFirstInnings ? 'st' : 'nd'}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-600">Status</div>
                      <div className={`text-sm font-bold px-2 py-1 rounded ${
                        match.match?.status === 'live' ? 'bg-green-100 text-green-800' :
                        match.match?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {match.match?.status?.toUpperCase()}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-600">Toss</div>
                      <div className="text-sm font-bold">{match.match?.toss_winner || 'TBD'}</div>
                      {match.match?.toss_decision && (
                        <div className="text-xs text-gray-600">({match.match.toss_decision})</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Previous Innings Summary (for 2nd innings) */}
                  {!isFirstInnings && completedInningsData && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-center">
                        <div className="font-semibold text-green-800 mb-1">1st Innings Summary</div>
                        <div className="text-green-700">
                          {match.match?.batting_first}: {completedInningsData.runs}/{completedInningsData.wickets} 
                          ({completedInningsData.overs}.{completedInningsData.balls_in_current_over} overs)
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Key Stats Section - similar to image */}
                  {match.match?.status === 'live' && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Key Stats</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-yellow-700">
                        {/* Show recent balls info */}
                        {match.balls && match.balls.length > 0 && (
                          <div>
                            <span className="font-medium">Last 10 overs:</span> {(() => {
                              const recentBalls = match.balls.slice(-60); // Approximate last 10 overs
                              const runs = recentBalls.reduce((total, ball) => total + (ball.runs || 0) + (ball.extras || 0), 0);
                              const wickets = recentBalls.filter(ball => ball.wicket).length;
                              return `${runs} runs, ${wickets} wkts`;
                            })()}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Toss:</span> {match.match?.toss_winner} ({match.match?.toss_decision || 'chose to bat/bowl'})
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Match Result */}
            {match.match?.result && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-1">Match Result</h4>
                <p className="text-green-700">{match.match.result}</p>
              </div>
            )}
          </div>

          {/* Current Players Stats (Cricbuzz-style) */}
          {match.match?.status === 'live' && match.match_state && stats && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Current Players</h3>
              
              {/* Current Batters */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-blue-600">Batters</h4>
                <div className="space-y-3">
                  {/* Striker */}
                  {match.match_state.current_striker && (() => {
                    const batterStats = stats.batting_statistics.find(b => b.name === match.match_state.current_striker);
                    const isOnStrike = match.match_state.on_strike === 'striker';
                    return (
                      <div className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                        isOnStrike ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{match.match_state.current_striker}</span>
                          {isOnStrike && <span className="text-xs bg-green-600 text-white px-1 rounded">*</span>}
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.runs || 0}</div>
                            <div className="text-xs text-gray-600">R</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.balls || 0}</div>
                            <div className="text-xs text-gray-600">B</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.fours || 0}</div>
                            <div className="text-xs text-gray-600">4s</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.sixes || 0}</div>
                            <div className="text-xs text-gray-600">6s</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.strike_rate || 0}</div>
                            <div className="text-xs text-gray-600">SR</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Non-Striker */}
                  {match.match_state.current_non_striker && (() => {
                    const batterStats = stats.batting_statistics.find(b => b.name === match.match_state.current_non_striker);
                    const isOnStrike = match.match_state.on_strike === 'nonStriker';
                    return (
                      <div className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                        isOnStrike ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{match.match_state.current_non_striker}</span>
                          {isOnStrike && <span className="text-xs bg-green-600 text-white px-1 rounded">*</span>}
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.runs || 0}</div>
                            <div className="text-xs text-gray-600">R</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.balls || 0}</div>
                            <div className="text-xs text-gray-600">B</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.fours || 0}</div>
                            <div className="text-xs text-gray-600">4s</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.sixes || 0}</div>
                            <div className="text-xs text-gray-600">6s</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{batterStats?.strike_rate || 0}</div>
                            <div className="text-xs text-gray-600">SR</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Current Bowler */}
              {match.match_state.current_bowler && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold mb-3 text-purple-600">Bowler</h4>
                  {(() => {
                    const bowlerStats = stats.bowling_statistics.find(b => b.name === match.match_state.current_bowler);
                    const overs = bowlerStats ? (bowlerStats.balls_bowled / 6).toFixed(1) : '0.0';
                    const maidens = 0; // We'd need to calculate this from ball-by-ball data
                    return (
                      <div className="flex justify-between items-center p-3 rounded-lg border-2 border-purple-200 bg-purple-50">
                        <div>
                          <span className="font-semibold">{match.match_state.current_bowler}</span>
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold">{overs}</div>
                            <div className="text-xs text-gray-600">O</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{bowlerStats?.runs_conceded || 0}</div>
                            <div className="text-xs text-gray-600">R</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{maidens}</div>
                            <div className="text-xs text-gray-600">M</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{bowlerStats?.wickets || 0}</div>
                            <div className="text-xs text-gray-600">W</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{bowlerStats?.economy_rate || 0}</div>
                            <div className="text-xs text-gray-600">Econ</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Recent Balls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Recent Balls</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {match.balls && match.balls.length > 0 ? match.balls.slice(-10).reverse().map((ball, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-semibold text-blue-600">
                        {ball.over_number - 1}.{ball.legal_ball_number}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="font-medium">
                        {ball.runs}{ball.extras > 0 && `+${ball.extras}`} runs
                      </span>
                      {ball.wicket && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                          WICKET
                        </span>
                      )}
                      {ball.extras_type && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          {ball.extras_type.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {ball.batsman} vs {ball.bowler}
                    </div>
                    {ball.commentary && (
                      <div className="text-xs text-gray-700 mt-1 italic">
                        {ball.commentary}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No balls recorded yet</p>
                  <p className="text-sm">Match scoring hasn't started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Info & Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Actions</h3>
            <div className="space-y-3">
              {/* Scoring Button */}
              {user && (
                <a
                  href={`/score/${id}`}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-all ${
                    match.match?.status === 'live' 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {match.match?.status === 'live' ? '🔴 Continue Scoring' : '📊 Start Scoring'}
                </a>
              )}
              
              {/* Start Match Button */}
              {user && match.match?.status === 'setup' && (
                <button
                  onClick={startMatch}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  🚀 Start Match
                </button>
              )}
              
              {/* Statistics Button */}
              <a
                href={`/matches/${id}/stats`}
                className="block w-full text-center py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors"
              >
                📈 View Statistics
              </a>
            </div>
          </div>

          {/* Match Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Match Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date(match.match?.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Venue:</span>
                <span className="font-medium">{match.match?.venue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{match.match?.match_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Toss:</span>
                <span className="font-medium">{match.match?.toss_winner || 'Not decided'}</span>
              </div>
              {match.match?.toss_decision && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Decision:</span>
                  <span className="font-medium">{match.match.toss_decision}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Batting First:</span>
                <span className="font-medium">{match.match?.batting_first || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium px-2 py-1 rounded text-xs ${
                  match.match?.status === 'live' ? 'bg-green-100 text-green-800' :
                  match.match?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {match.match?.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Teams</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">
                    {match.match?.team1?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{match.match?.team1}</div>
                  <div className="text-sm text-gray-500">Team 1</div>
                </div>
              </div>
              
              <div className="text-center text-gray-400 font-bold">VS</div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">
                    {match.match?.team2?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{match.match?.team2}</div>
                  <div className="text-sm text-gray-500">Team 2</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchStatsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Match Statistics</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Coming Soon:</strong> Advanced match statistics, analytics, and performance insights.
          </p>
        </div>
      </div>
    </div>
  );
}

function CreateMatchPage() {
  const [matchData, setMatchData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    venue: '',
    matchType: 'T20',
    team1: '',
    team2: '',
    tossWinner: '',
    tossDecision: '',
    battingFirst: ''
  });
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setError(''); // Clear any previous errors
      console.log('Fetching teams from:', `${axios.defaults.baseURL}/api/teams`); // Debug log
      const response = await axios.get('/api/teams');
      console.log('Teams fetched successfully:', response.data); // Debug log
      setAvailableTeams(response.data);
      setError(''); // Clear error on successful load
    } catch (error) {
      console.error('Error fetching teams:', error);
      if (error.response?.status === 404) {
        // 404 means no teams exist yet, which is fine
        setAvailableTeams([]);
        setError('');
      } else {
        setError('Failed to load teams. Please check if the server is running.');
        setAvailableTeams([]);
      }
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!', matchData); // Debug log
    setLoading(true);
    setError('');

    // Validate required fields
    if (!matchData.name || !matchData.venue || !matchData.team1 || !matchData.team2) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate teams are different
    if (matchData.team1 === matchData.team2) {
      setError('Team 1 and Team 2 must be different');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending match data:', matchData); // Debug log
      const response = await axios.post('/api/matches', matchData);
      
      // Show success message
      setSuccess(`Match "${matchData.name}" created successfully!`);
      setError(''); // Clear any previous errors
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        window.location.href = `/matches`;
      }, 2000);
    } catch (error) {
      console.error('Create match error:', error.response?.data); // Debug log
      
      // Handle different types of errors
      let errorMessage = 'Failed to create match';
      
      if (error.response?.data?.detail) {
        // Check if detail is an array (FastAPI validation errors)
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(err => `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`)
            .join('\n');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTeam = (teamName) => {
    return availableTeams.find(team => team.name === teamName);
  };

  // Auto-determine batting first team based on toss winner and decision
  const determineBattingFirst = (tossWinner, tossDecision, team1, team2) => {
    if (!tossWinner || !tossDecision) return '';
    
    if (tossDecision === 'bat') {
      return tossWinner; // Toss winner chose to bat first
    } else if (tossDecision === 'bowl') {
      // Toss winner chose to bowl, so the other team bats first
      return tossWinner === team1 ? team2 : team1;
    }
    return '';
  };

  // Update batting first automatically when toss details change
  React.useEffect(() => {
    if (matchData.tossWinner && matchData.tossDecision) {
      const battingFirst = determineBattingFirst(
        matchData.tossWinner, 
        matchData.tossDecision, 
        matchData.team1, 
        matchData.team2
      );
      if (battingFirst !== matchData.battingFirst) {
        setMatchData(prev => ({ ...prev, battingFirst }));
      }
    }
  }, [matchData.tossWinner, matchData.tossDecision, matchData.team1, matchData.team2]);

  // If teams are still loading, show loading state
  if (teamsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-4 text-lg text-gray-600">Loading teams...</span>
          </div>
        </div>
      </div>
    );
  }

  // If no teams available, show create teams first message
  if (availableTeams.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <div className="text-8xl mb-6">👥</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Teams Available</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You need to create teams first before you can create a match. Teams help organize your players and make match creation easier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/teams"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <span className="mr-2">👥</span>
                Create Your First Team
              </a>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If less than 2 teams available, show message
  if (availableTeams.length < 2) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <div className="text-8xl mb-6">⚠️</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need More Teams</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You need at least 2 teams to create a match. You currently have {availableTeams.length} team(s).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/teams"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
              >
                <span className="mr-2">➕</span>
                Create More Teams
              </a>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create New Match</h1>
          <a
            href="/teams"
            className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center"
          >
            <span className="mr-1">👥</span>
            Manage Teams
          </a>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start">
              <span className="text-red-500 text-xl mr-3 mt-0.5">⚠️</span>
              <div className="flex-1">
                {error.split('\n').map((line, index) => (
                  <div key={index} className="mb-1 last:mb-0">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Match Name *</label>
              <input
                type="text"
                value={matchData.name}
                onChange={(e) => setMatchData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter match name"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Date *</label>
              <input
                type="date"
                value={matchData.date}
                onChange={(e) => setMatchData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Venue *</label>
              <input
                type="text"
                value={matchData.venue}
                onChange={(e) => setMatchData(prev => ({ ...prev, venue: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter venue"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Match Type *</label>
              <select
                value={matchData.matchType}
                onChange={(e) => setMatchData(prev => ({ ...prev, matchType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
              </select>
            </div>
          </div>

          {/* Team Selection */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">👥</span>
              Team Selection
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Team 1 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-gray-700 text-sm font-bold mb-2">Team 1 *</label>
                <select
                  value={matchData.team1}
                  onChange={(e) => setMatchData(prev => ({ ...prev, team1: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Team 1</option>
                  {availableTeams.map(team => (
                    <option key={team.name} value={team.name} disabled={team.name === matchData.team2}>
                      {team.name} ({team.players.length} players)
                    </option>
                  ))}
                </select>
                
                {/* Show selected team details */}
                {matchData.team1 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      <div className="font-semibold">{getSelectedTeam(matchData.team1)?.players.length} Players</div>
                      {getSelectedTeam(matchData.team1)?.captain && (
                        <div>👑 Captain: {getSelectedTeam(matchData.team1)?.captain}</div>
                      )}
                      {getSelectedTeam(matchData.team1)?.viceCaptain && (
                        <div>🥈 Vice-Captain: {getSelectedTeam(matchData.team1)?.viceCaptain}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-gray-700 text-sm font-bold mb-2">Team 2 *</label>
                <select
                  value={matchData.team2}
                  onChange={(e) => setMatchData(prev => ({ ...prev, team2: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Team 2</option>
                  {availableTeams.map(team => (
                    <option key={team.name} value={team.name} disabled={team.name === matchData.team1}>
                      {team.name} ({team.players.length} players)
                    </option>
                  ))}
                </select>
                
                {/* Show selected team details */}
                {matchData.team2 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      <div className="font-semibold">{getSelectedTeam(matchData.team2)?.players.length} Players</div>
                      {getSelectedTeam(matchData.team2)?.captain && (
                        <div>👑 Captain: {getSelectedTeam(matchData.team2)?.captain}</div>
                      )}
                      {getSelectedTeam(matchData.team2)?.viceCaptain && (
                        <div>🥈 Vice-Captain: {getSelectedTeam(matchData.team2)?.viceCaptain}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Toss Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Toss Details (Optional)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Toss Winner</label>
                <select
                  value={matchData.tossWinner}
                  onChange={(e) => setMatchData(prev => ({ ...prev, tossWinner: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select winner</option>
                  {matchData.team1 && <option value={matchData.team1}>{matchData.team1}</option>}
                  {matchData.team2 && <option value={matchData.team2}>{matchData.team2}</option>}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Toss Decision</label>
                <select
                  value={matchData.tossDecision}
                  onChange={(e) => setMatchData(prev => ({ ...prev, tossDecision: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select decision</option>
                  <option value="bat">Bat First</option>
                  <option value="bowl">Bowl First</option>
                </select>
              </div>
            </div>
            
            {/* Toss Summary */}
            {matchData.tossWinner && matchData.tossDecision && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Toss Summary:</strong> {matchData.tossWinner} won the toss and chose to{' '}
                  {matchData.tossDecision === 'bat' ? 'bat first' : 'bowl first'}.{' '}
                  {matchData.battingFirst && (
                    <span className="font-semibold">{matchData.battingFirst} will bat first.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating Match...' : 'Create Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScoringPage() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [currentInnings, setCurrentInnings] = useState(1);
  const [teams, setTeams] = useState([]);
  const [batsmen, setBatsmen] = useState({
    striker: '',
    nonStriker: '',
    onStrike: 'striker' // 'striker' or 'nonStriker'
  });
  const [currentBowler, setCurrentBowler] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [currentBall, setCurrentBall] = useState({
    runs: 0,
    extras: 0,
    extrasType: '',
    wicket: false,
    wicketType: '',
    wicketPlayer: '',
    commentary: ''
  });
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showBatsmanModal, setShowBatsmanModal] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [newBowler, setNewBowler] = useState('');
  const [newBatsman, setNewBatsman] = useState('');
  const [wicketPosition, setWicketPosition] = useState(''); // 'striker' or 'nonStriker'
  const [wicketData, setWicketData] = useState({ type: '', player: '' });

  useEffect(() => {
    fetchMatchDetails();
    fetchTeams();
  }, [id]);

  // Auto-save match state when batsmen, bowler, or innings change
  useEffect(() => {
    if (match && (batsmen.striker || batsmen.nonStriker || currentBowler)) {
      saveMatchState();
    }
  }, [batsmen.striker, batsmen.nonStriker, currentBowler, batsmen.onStrike, currentInnings]);

  const fetchMatchDetails = async () => {
    try {
      const [matchResponse, statsResponse] = await Promise.all([
        axios.get(`/api/matches/${id}/score`),
        axios.get(`/api/matches/${id}/statistics`).catch(() => ({ data: null })) // Don't fail if stats aren't available
      ]);
      
      setMatch(matchResponse.data);
      setStats(statsResponse.data);
      
      // Update current innings from backend
      if (matchResponse.data.current_over) {
        setCurrentInnings(matchResponse.data.current_over.innings);
      }
      
      // Load saved match state
      if (matchResponse.data.match_state) {
        const state = matchResponse.data.match_state;
        setBatsmen({
          striker: state.current_striker || '',
          nonStriker: state.current_non_striker || '',
          onStrike: state.on_strike || 'striker'
        });
        setCurrentBowler(state.current_bowler || '');
        setCurrentInnings(state.current_innings || 1);
      }
      
      setError('');
    } catch (error) {
      console.error('Error fetching match:', error);
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const saveMatchState = async () => {
    try {
      const state = {
        current_striker: batsmen.striker,
        current_non_striker: batsmen.nonStriker,
        current_bowler: currentBowler,
        on_strike: batsmen.onStrike,
        current_innings: currentInnings
      };
      
      await axios.post(`/api/matches/${id}/state`, state);
    } catch (error) {
      console.error('Error saving match state:', error);
      // Don't show error to user as this is background save
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`/api/matches/${id}/teams`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const startMatch = async () => {
    try {
      await axios.patch(`/api/matches/${id}/start`);
      fetchMatchDetails(); // Refresh match data
    } catch (error) {
      console.error('Error starting match:', error);
      setError('Failed to start match');
    }
  };

  const getBattingTeamPlayers = () => {
    if (!teams || teams.length === 0 || !match?.match) return [];
    
    // Determine which team is batting in current innings
    const battingTeam = currentInnings === 1 ? match.match.batting_first : 
                       (match.match.batting_first === match.match.team1 ? match.match.team2 : match.match.team1);
    
    const team = teams.find(t => t.name === battingTeam);
    if (!team) return [];
    
    // Parse players JSON if it's a string
    let players = team.players;
    if (typeof players === 'string') {
      try {
        players = JSON.parse(players);
      } catch (e) {
        console.error('Error parsing team players:', e);
        return [];
      }
    }
    
    return players || [];
  };

  const getBowlingTeamPlayers = () => {
    if (!teams || teams.length === 0 || !match?.match) return [];
    
    // Determine which team is bowling in current innings
    const bowlingTeam = currentInnings === 1 ? 
                       (match.match.batting_first === match.match.team1 ? match.match.team2 : match.match.team1) :
                       match.match.batting_first;
    
    const team = teams.find(t => t.name === bowlingTeam);
    if (!team) return [];
    
    // Parse players JSON if it's a string
    let players = team.players;
    if (typeof players === 'string') {
      try {
        players = JSON.parse(players);
      } catch (e) {
        console.error('Error parsing team players:', e);
        return [];
      }
    }
    
    return players || [];
  };

  const rotateStrike = () => {
    setBatsmen(prev => ({
      ...prev,
      onStrike: prev.onStrike === 'striker' ? 'nonStriker' : 'striker'
    }));
  };

  const checkIfLastOverOfInnings = (matchData, inningsNumber) => {
    // Get match details to determine total overs
    const matchType = matchData.match?.match_type;
    let totalOvers = 20; // Default for T20
    
    if (matchType === 'T10') totalOvers = 10;
    else if (matchType === 'ODI') totalOvers = 50;
    else if (matchType === 'Test') totalOvers = null; // No over limit for test matches
    
    if (!totalOvers) return false; // Test match - no over limit
    
    const inningsData = matchData.innings_scores?.[inningsNumber];
    if (!inningsData) return false;
    
    // Check if we've completed the total overs or if all batsmen are out
    const completedOvers = inningsData.overs;
    const isAllOut = inningsData.wickets >= 10;
    
    return completedOvers >= totalOvers || isAllOut;
  };

  const checkIfLastBallOfInnings = (matchData, inningsNumber) => {
    // Get match details to determine total overs
    const matchType = matchData.match?.match_type;
    let totalOvers = 20; // Default for T20
    
    if (matchType === 'T10') totalOvers = 10;
    else if (matchType === 'ODI') totalOvers = 50;
    else if (matchType === 'Test') totalOvers = null; // No over limit for test matches
    
    if (!totalOvers) return false; // Test match - no over limit
    
    const inningsData = matchData.innings_scores?.[inningsNumber];
    if (!inningsData) return false;
    
    // Check if this is the last ball of the last over
    const completedOvers = inningsData.overs;
    const ballsInCurrentOver = inningsData.balls_in_current_over;
    const isAllOut = inningsData.wickets >= 10;
    
    // Last ball if we're in the final over and this is the 6th ball, or if all out
    return (completedOvers === totalOvers - 1 && ballsInCurrentOver === 5) || isAllOut;
  };

  const handleRunsScored = async (runs, extras = 0, extrasType = '', isWicket = false, wicketDetails = {}) => {
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      // Get current batsman on strike
      const currentBatsman = batsmen.onStrike === 'striker' ? batsmen.striker : batsmen.nonStriker;
      
      if (!currentBatsman || !currentBowler) {
        setError('Please select batsmen and bowler first');
        setSubmitting(false);
        return;
      }

      // Calculate current over and ball from match state
      let currentOverNumber = 1;
      let currentBallNumber = 1;
      
      if (match.innings_scores && match.innings_scores[currentInnings]) {
        const inningsData = match.innings_scores[currentInnings];
        // Cricket overs are 0-indexed in display but 1-indexed in storage
        // Convert to 1-indexed for storage (over 1, over 2, etc.)
        currentOverNumber = inningsData.overs + 1;
        currentBallNumber = inningsData.balls_in_current_over + 1; // Next ball to bowl
      }

      // Determine if this is a legal delivery (counts towards the over)
      const isLegalDelivery = !['wide', 'no-ball'].includes(extrasType);
      let shouldRotateStrike = false;
      
      // Rotate strike for odd runs (both legal deliveries and extras)
      if (runs % 2 === 1) {
        shouldRotateStrike = true;
      }
      
      const ballData = {
        match_id: id,
        innings: currentInnings,
        over_number: currentOverNumber,
        ball_number: currentBallNumber,
        batsman: currentBatsman,
        bowler: currentBowler,
        runs: runs,
        extras: extras,
        extras_type: extrasType || null,
        wicket: isWicket,
        wicket_type: wicketDetails.wicketType || null,
        wicket_player: wicketDetails.wicketPlayer || null,
        commentary: wicketDetails.commentary || `${runs} runs scored`
      };
      
      console.log('Submitting ball data:', ballData);
      
      await axios.post(`/api/matches/${id}/score`, ballData);
      
      // Refresh match data to get updated over/ball counts from backend
      await fetchMatchDetails();
      
      // Check if over is complete after refreshing data
      const refreshedMatch = await axios.get(`/api/matches/${id}/score`);
      const refreshedData = refreshedMatch.data;
      
      // If we just completed the 6th legal ball of an over
      if (isLegalDelivery && refreshedData.innings_scores && refreshedData.innings_scores[currentInnings]) {
        const currentInningsData = refreshedData.innings_scores[currentInnings];
        // If balls_in_current_over is 0 and we have more than 0 total balls, we just completed an over
        if (currentInningsData.balls_in_current_over === 0 && currentInningsData.balls > 0) {
          // Check if this is the final over of the innings
          const isLastOver = checkIfLastOverOfInnings(refreshedData, currentInnings);
          
          // Only show bowler modal if it's not the last over of the innings
          if (!isLastOver) {
            setShowBowlerModal(true);
          }
          shouldRotateStrike = true; // Always rotate strike at end of over
        }
      }
      
      // Rotate strike if needed and no wicket
      if (shouldRotateStrike && !isWicket) {
        rotateStrike();
      }
      
      // Handle wicket - show batsman selection modal
      if (isWicket) {
        const dismissedPosition = batsmen.onStrike;
        setWicketPosition(dismissedPosition);
        
        if (dismissedPosition === 'striker') {
          setBatsmen(prev => ({ ...prev, striker: '', onStrike: 'striker' }));
        } else {
          setBatsmen(prev => ({ ...prev, nonStriker: '', onStrike: 'striker' }));
        }
        
        // Get the refreshed data for checking conditions
        const currentRefreshedData = await axios.get(`/api/matches/${id}/score`);
        const refreshedDataForWicket = currentRefreshedData.data;
        
        // Check if this is the 10th wicket or last ball of innings
        const is10thWicket = refreshedDataForWicket.innings_scores?.[currentInnings]?.wickets >= 10;
        const isLastBallOfInnings = checkIfLastBallOfInnings(refreshedDataForWicket, currentInnings);
        
        // Only show batsman selection modal if it's not the 10th wicket or last ball
        if (!is10thWicket && !isLastBallOfInnings) {
          setShowBatsmanModal(true);
        }
      }
      
      // Reset current ball state for manual mode
      if (!autoSubmit) {
        setCurrentBall({
          runs: 0,
          extras: 0,
          extrasType: '',
          wicket: false,
          wicketType: '',
          wicketPlayer: '',
          commentary: ''
        });
      }
      
      setError('');
    } catch (error) {
      console.error('Error submitting ball:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 400 && error.response?.data?.detail === 'Match is not live') {
        setError('Match is not live. Please start the match first.');
      } else if (error.response?.status === 401) {
        setError('You need to be logged in to score matches.');
      } else {
        setError(`Failed to submit ball: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBowlerSelection = () => {
    if (newBowler) {
      setCurrentBowler(newBowler);
      setNewBowler('');
      setShowBowlerModal(false);
    }
  };

  const handleWicketSubmission = () => {
    if (wicketData.type && wicketData.player) {
      handleRunsScored(0, 0, '', true, { 
        wicketType: wicketData.type, 
        wicketPlayer: wicketData.player, 
        commentary: `${wicketData.player} ${wicketData.type}` 
      });
      setShowWicketModal(false);
      setWicketData({ type: '', player: '' });
    }
  };

  const handleBatsmanSelection = () => {
    if (newBatsman) {
      if (wicketPosition === 'striker') {
        setBatsmen(prev => ({ ...prev, striker: newBatsman }));
      } else {
        setBatsmen(prev => ({ ...prev, nonStriker: newBatsman }));
      }
      setNewBatsman('');
      setShowBatsmanModal(false);
      setWicketPosition('');
    }
  };

  const getAvailableBowlers = () => {
    return getBowlingTeamPlayers().filter(player => player.name !== currentBowler);
  };

  const getAvailableBatsmen = () => {
    return getBattingTeamPlayers().filter(player => 
      player.name !== batsmen.striker && player.name !== batsmen.nonStriker
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-lg text-gray-600">Loading match...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Match not found</h2>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 scoring-interface">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">{match.match?.name}</h1>
          <div className="flex items-center space-x-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              match.match?.status === 'live' ? 'bg-red-500 bg-opacity-20' : 
              match.match?.status === 'completed' ? 'bg-blue-500 bg-opacity-20' :
              'bg-gray-500 bg-opacity-20'
            }`}>
              {match.match?.status === 'live' ? '🔴 LIVE' : 
               match.match?.status === 'completed' ? '✅ COMPLETED' : 
               '⏸️ ' + match.match?.status?.toUpperCase()}
            </span>
            <a
              href="/matches"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Matches
            </a>
          </div>
        </div>
        
        {/* Cricket Match Status Display */}
        <div className="bg-white bg-opacity-10 rounded-lg p-6">
          {(() => {
            // Determine current batting team and innings
            const battingTeam = currentInnings === 1 ? match.match?.batting_first : 
                               (match.match?.batting_first === match.match?.team1 ? match.match?.team2 : match.match?.team1);
            const currentInningsData = match.innings_scores?.[currentInnings];
            const isFirstInnings = currentInnings === 1;
            const matchType = match.match?.match_type || 'T20';
            
            // Get completed innings data (for 2nd innings target calculation)
            const completedInningsData = match.innings_scores?.[1];
            const target = !isFirstInnings && completedInningsData ? completedInningsData.runs + 1 : null;
            const runRate = (() => {
              // Calculate total overs bowled (including partial overs)
              const totalOvers = (currentInningsData?.overs || 0) + ((currentInningsData?.balls_in_current_over || 0) / 6);
              const runs = currentInningsData?.runs || 0;
              
              // If no balls bowled, return 0.00
              if (totalOvers === 0) return '0.00';
              
              // Calculate run rate as runs per over
              return (runs / totalOvers).toFixed(2);
            })();
            
            return (
              <div>
                {/* Main Score Display */}
                <div className="text-center mb-4">
                  <h2 className="text-4xl font-bold mb-2">
                    {battingTeam} {currentInningsData?.runs || 0}/{currentInningsData?.wickets || 0}
                  </h2>
                  <div className="text-lg opacity-90">
                    ({currentInningsData?.overs || 0}.{currentInningsData?.balls_in_current_over || 0} overs)
                  </div>
                  {/* Current Run Rate */}
                  <div className="text-sm opacity-75 mt-1">
                    CRR: {runRate}
                  </div>
                </div>
                
                {/* Match Context */}
                <div className="text-center mb-4">
                  <div className="text-lg font-semibold">
                    {isFirstInnings ? 
                      `${battingTeam} 1st Innings` : 
                      `${battingTeam} 2nd Innings`
                    }
                  </div>
                  
                  {/* Target Information for 2nd Innings */}
                  {!isFirstInnings && target && (
                    <div className="text-sm opacity-90 mt-1">
                      Target: {target} | Need {target - (currentInningsData?.runs || 0)} runs
                      {matchType !== 'Test' && (
                        <span> from {(() => {
                          const totalOvers = matchType === 'T10' ? 10 : matchType === 'ODI' ? 50 : 20;
                          const ballsRemaining = (totalOvers * 6) - ((currentInningsData?.overs || 0) * 6 + (currentInningsData?.balls_in_current_over || 0));
                          return `${Math.floor(ballsRemaining / 6)}.${ballsRemaining % 6} overs`;
                        })()}</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold opacity-75">Match Type</div>
                    <div>{matchType}</div>
                  </div>
                  <div>
                    <div className="font-semibold opacity-75">Innings</div>
                    <div>{currentInnings}{isFirstInnings ? 'st' : 'nd'}</div>
                  </div>
                  {!isFirstInnings && completedInningsData && (
                    <>
                      <div>
                        <div className="font-semibold opacity-75">1st Innings</div>
                        <div>{match.match?.batting_first}: {completedInningsData.runs}/{completedInningsData.wickets}</div>
                      </div>
                      <div>
                        <div className="font-semibold opacity-75">Required RR</div>
                        <div>
                          {(() => {
                            if (matchType === 'Test') return 'N/A';
                            const totalOvers = matchType === 'T10' ? 10 : matchType === 'ODI' ? 50 : 20;
                            const oversRemaining = totalOvers - (currentInningsData?.overs || 0) - ((currentInningsData?.balls_in_current_over || 0) / 6);
                            const runsNeeded = target - (currentInningsData?.runs || 0);
                            return oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : 'N/A';
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Match not live warning */}
      {match.match?.status !== 'live' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-yellow-500 text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-800">Match Not Live</h3>
                <p className="text-yellow-700 text-sm">
                  This match is currently in "{match.match?.status}" status. You need to start the match to begin scoring.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {match.match?.status === 'setup' && (
                <button
                  onClick={startMatch}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  🚀 Start Match
                </button>
              )}
              <a
                href={`/matches/${id}`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                📋 Match Details
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">❌</span>
            <div>
              <h4 className="font-semibold text-red-800">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scoring Panel */}
        <div className="lg:col-span-2">
          <div className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-300 relative ${
            match.match?.status !== 'live' ? 'grayscale opacity-60' : ''
          }`}>
            {/* Disabled Overlay */}
            {match.match?.status !== 'live' && (
              <div className="absolute inset-0 bg-gray-200 bg-opacity-50 rounded-xl flex items-center justify-center z-10">
                <div className="text-center p-6">
                  <div className="text-4xl mb-2">🔒</div>
                  <div className="text-lg font-semibold text-gray-700 mb-1">Scoring Disabled</div>
                  <div className="text-sm text-gray-600">Match must be live to score</div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Ball-by-Ball Scoring</h2>
              <div className="flex items-center space-x-4 text-sm">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  Innings {currentInnings}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  {match.innings_scores && match.innings_scores[currentInnings] ? 
                    `Over ${match.innings_scores[currentInnings].overs}.${match.innings_scores[currentInnings].balls_in_current_over + 1}` :
                    `Over 0.1`
                  }
                </span>
              </div>
            </div>
            
            {/* Current Ball Form */}
            <div className="space-y-4">
              {/* Auto-Submit Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-blue-800">Auto-Submit Mode</h3>
                  <p className="text-sm text-blue-600">Automatically submit balls and rotate strike</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSubmit}
                    onChange={(e) => setAutoSubmit(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {/* Auto-Submit Instructions */}
              {autoSubmit && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🚀 Auto-Submit Active</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Click run buttons to instantly score and submit</li>
                    <li>• Strike rotates automatically on odd runs</li>
                    <li>• Strike rotates at the end of each over</li>
                    <li>• Use quick action buttons for extras</li>
                    <li>• Click "Wicket" for dismissals</li>
                  </ul>
                </div>
              )}

              {/* Batsmen Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <label className="block text-green-800 font-semibold mb-2">
                    Striker {batsmen.onStrike === 'striker' && '⭐'}
                  </label>
                  <select
                    value={batsmen.striker}
                    onChange={(e) => setBatsmen(prev => ({ ...prev, striker: e.target.value }))}
                    disabled={match.match?.status !== 'live'}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      batsmen.onStrike === 'striker' ? 'bg-green-100 border-green-300' : ''
                    } ${match.match?.status !== 'live' ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                  >
                    <option value="">Select Striker</option>
                    {getBattingTeamPlayers()
                      .filter(player => player.name !== batsmen.nonStriker)
                      .map(player => (
                        <option key={player.name} value={player.name}>
                          {player.name} {player.role && `(${player.role})`}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <label className="block text-blue-800 font-semibold mb-2">
                    Non-Striker {batsmen.onStrike === 'nonStriker' && '⭐'}
                  </label>
                  <select
                    value={batsmen.nonStriker}
                    onChange={(e) => setBatsmen(prev => ({ ...prev, nonStriker: e.target.value }))}
                    disabled={match.match?.status !== 'live'}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      batsmen.onStrike === 'nonStriker' ? 'bg-blue-100 border-blue-300' : ''
                    } ${match.match?.status !== 'live' ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                  >
                    <option value="">Select Non-Striker</option>
                    {getBattingTeamPlayers()
                      .filter(player => player.name !== batsmen.striker)
                      .map(player => (
                        <option key={player.name} value={player.name}>
                          {player.name} {player.role && `(${player.role})`}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Manual Strike Rotation */}
              {(batsmen.striker && batsmen.nonStriker) && (
                <div className="flex justify-center">
                  <button
                    onClick={rotateStrike}
                    disabled={match.match?.status !== 'live'}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      match.match?.status !== 'live' 
                        ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                        : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800'
                    }`}
                  >
                    🔄 Rotate Strike
                  </button>
                </div>
              )}

              {/* Bowler Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Current Bowler</label>
                <select
                  value={currentBowler}
                  onChange={(e) => setCurrentBowler(e.target.value)}
                  disabled={match.match?.status !== 'live'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    match.match?.status !== 'live' ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
                  }`}
                >
                  <option value="">Select Bowler</option>
                  {getBowlingTeamPlayers().map(player => (
                    <option key={player.name} value={player.name}>
                      {player.name} {player.role && `(${player.role})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Runs Buttons */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Runs</label>
                <div className="grid grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map(runs => (
                    <button
                      key={runs}
                      onClick={() => {
                        if (autoSubmit && match.match?.status === 'live') {
                          handleRunsScored(runs);
                        } else if (!autoSubmit) {
                          setCurrentBall(prev => ({ ...prev, runs }));
                        }
                      }}
                      disabled={submitting || match.match?.status !== 'live'}
                      className={`py-3 px-4 rounded-lg font-bold transition-all ${
                        submitting || match.match?.status !== 'live' ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' :
                        currentBall.runs === runs && !autoSubmit
                          ? runs === 4 ? 'bg-green-500 text-white' :
                            runs === 6 ? 'bg-purple-500 text-white' :
                            'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      } ${autoSubmit && match.match?.status === 'live' ? 'hover:bg-green-500 hover:text-white' : ''}`}
                    >
                      {runs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Quick Actions</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      if (autoSubmit && match.match?.status === 'live') {
                        handleRunsScored(0, 1, 'wide'); // 0 batting runs, 1 extra
                      } else if (!autoSubmit) {
                        setCurrentBall(prev => ({ ...prev, runs: 0, extrasType: 'wide', extras: 1 }));
                      }
                    }}
                    disabled={submitting || match.match?.status !== 'live'}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      submitting || match.match?.status !== 'live' 
                        ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                        : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    Wide + 1
                  </button>
                  <button
                    onClick={() => {
                      if (autoSubmit && match.match?.status === 'live') {
                        handleRunsScored(0, 1, 'no-ball'); // 0 batting runs, 1 extra
                      } else if (!autoSubmit) {
                        setCurrentBall(prev => ({ ...prev, runs: 0, extrasType: 'no-ball', extras: 1 }));
                      }
                    }}
                    disabled={submitting || match.match?.status !== 'live'}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      submitting || match.match?.status !== 'live' 
                        ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                        : 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                    }`}
                  >
                    No Ball + 1
                  </button>
                  <button
                    onClick={() => {
                      if (autoSubmit && match.match?.status === 'live') {
                        handleRunsScored(1, 0, 'bye'); // 1 run, but as bye (no batting runs)
                      } else if (!autoSubmit) {
                        setCurrentBall(prev => ({ ...prev, runs: 1, extrasType: 'bye', extras: 0 }));
                      }
                    }}
                    disabled={submitting || match.match?.status !== 'live'}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      submitting || match.match?.status !== 'live' 
                        ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    Bye + 1
                  </button>
                  <button
                    onClick={() => {
                      if (autoSubmit && match.match?.status === 'live') {
                        handleRunsScored(1, 0, 'leg-bye'); // 1 run, but as leg-bye (no batting runs)
                      } else if (!autoSubmit) {
                        setCurrentBall(prev => ({ ...prev, runs: 1, extrasType: 'leg-bye', extras: 0 }));
                      }
                    }}
                    disabled={submitting || match.match?.status !== 'live'}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      submitting || match.match?.status !== 'live' 
                        ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    Leg Bye + 1
                  </button>
                </div>
              </div>

              {/* Wicket Button */}
              <div>
                <button
                  onClick={() => {
                    if (autoSubmit && match.match?.status === 'live') {
                      // Show wicket modal for auto-submit mode
                      const currentBatsman = batsmen.onStrike === 'striker' ? batsmen.striker : batsmen.nonStriker;
                      setWicketData({ type: '', player: currentBatsman });
                      setShowWicketModal(true);
                    } else if (!autoSubmit) {
                      setCurrentBall(prev => ({ ...prev, wicket: !prev.wicket }));
                    }
                  }}
                  disabled={submitting || match.match?.status !== 'live'}
                  className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${
                    submitting || match.match?.status !== 'live' ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' :
                    currentBall.wicket && !autoSubmit
                      ? 'bg-red-500 text-white' 
                      : 'bg-red-100 hover:bg-red-200 text-red-800'
                  } ${autoSubmit && match.match?.status === 'live' ? 'hover:bg-red-500 hover:text-white' : ''}`}
                >
                  {autoSubmit ? 'Wicket' : (currentBall.wicket ? 'Wicket ✓' : 'Wicket')}
                </button>
              </div>

              {/* Manual Mode - Extras and Wicket Details */}
              {!autoSubmit && (
                <>
                  {/* Extras */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Extras Type</label>
                      <select
                        value={currentBall.extrasType}
                        onChange={(e) => setCurrentBall(prev => ({ ...prev, extrasType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">No Extras</option>
                        <option value="bye">Bye</option>
                        <option value="leg-bye">Leg Bye</option>
                        <option value="wide">Wide</option>
                        <option value="no-ball">No Ball</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Extra Runs</label>
                      <input
                        type="number"
                        value={currentBall.extras}
                        onChange={(e) => setCurrentBall(prev => ({ ...prev, extras: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Wicket Details */}
                  {currentBall.wicket && (
                    <div className="grid md:grid-cols-2 gap-4 bg-red-50 p-4 rounded-lg">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Wicket Type</label>
                        <select
                          value={currentBall.wicketType}
                          onChange={(e) => setCurrentBall(prev => ({ ...prev, wicketType: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Select Type</option>
                          <option value="bowled">Bowled</option>
                          <option value="caught">Caught</option>
                          <option value="lbw">LBW</option>
                          <option value="stumped">Stumped</option>
                          <option value="run-out">Run Out</option>
                          <option value="hit-wicket">Hit Wicket</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">Player Out</label>
                        <select
                          value={currentBall.wicketPlayer}
                          onChange={(e) => setCurrentBall(prev => ({ ...prev, wicketPlayer: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="">Select Player</option>
                          <option value={batsmen.striker}>{batsmen.striker} (Striker)</option>
                          <option value={batsmen.nonStriker}>{batsmen.nonStriker} (Non-Striker)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Commentary */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Commentary</label>
                    <textarea
                      value={currentBall.commentary}
                      onChange={(e) => setCurrentBall(prev => ({ ...prev, commentary: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Ball commentary..."
                    />
                  </div>
                </>
              )}

              {/* Submit Button - Only show in manual mode */}
              {!autoSubmit && (
                <button
                  onClick={() => {
                    const currentBatsman = batsmen.onStrike === 'striker' ? batsmen.striker : batsmen.nonStriker;
                    handleRunsScored(
                      currentBall.runs, 
                      currentBall.extras, 
                      currentBall.extrasType, 
                      currentBall.wicket, 
                      {
                        wicketType: currentBall.wicketType,
                        wicketPlayer: currentBall.wicketPlayer,
                        commentary: currentBall.commentary
                      }
                    );
                  }}
                  disabled={!batsmen.striker || !batsmen.nonStriker || !currentBowler || match.match?.status !== 'live' || submitting}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 
                   match.match?.status !== 'live' ? 'Match Not Live' : 
                   'Submit Ball'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Match Info Sidebar */}
        <div className="space-y-6">
          {/* Current Match State */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Current State</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">On Strike:</span>
                <span className="font-bold text-green-900">
                  {batsmen.onStrike === 'striker' ? batsmen.striker : batsmen.nonStriker || 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">Non-Striker:</span>
                <span className="font-bold text-blue-900">
                  {batsmen.onStrike === 'striker' ? batsmen.nonStriker : batsmen.striker || 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-purple-800">Bowler:</span>
                <span className="font-bold text-purple-900">
                  {currentBowler || 'Not selected'}
                </span>
              </div>
            </div>
          </div>

          {/* Match Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Match Info</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Venue:</strong> {match.match?.venue}</div>
              <div><strong>Date:</strong> {new Date(match.match?.date).toLocaleDateString()}</div>
              <div><strong>Type:</strong> {match.match?.match_type}</div>
              <div><strong>Toss:</strong> {match.match?.toss_winner || 'Not decided'}</div>
              <div><strong>Decision:</strong> {match.match?.toss_decision || 'N/A'}</div>
              <div><strong>Batting First:</strong> {match.match?.batting_first || 'N/A'}</div>
              <div><strong>Current Innings:</strong> {currentInnings}</div>
              <div><strong>Status:</strong> 
                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                  match.match?.status === 'live' ? 'bg-green-100 text-green-800' :
                  match.match?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {match.match?.status?.toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* Innings Switch */}
            <div className="mt-4 pt-4 border-t">
              <label className="block text-gray-700 font-semibold mb-2">Switch Innings</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentInnings(1)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentInnings === 1 
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  1st Innings
                </button>
                <button
                  onClick={() => setCurrentInnings(2)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentInnings === 2 
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  2nd Innings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ball-by-Ball Commentary - Cricinfo Style */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center">
              <span className="mr-2">🏏</span>
              Ball-by-Ball Commentary
            </h3>
            <div className="text-sm opacity-90">
              Latest {match.balls && match.balls.length > 0 ? Math.min(match.balls.length, 12) : 0} balls
            </div>
          </div>
        </div>
        
        {match.balls && match.balls.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {(() => {
              const sortedBalls = match.balls.slice().reverse();
              const displayBalls = sortedBalls.slice(0, 24); // Show more balls for better context
              const ballsByOver = {};
              
              // Group balls by over
              displayBalls.forEach(ball => {
                const overNum = ball.over_number || ball.over || 1;
                if (!ballsByOver[overNum]) {
                  ballsByOver[overNum] = [];
                }
                ballsByOver[overNum].push(ball);
              });
              
              const overs = Object.keys(ballsByOver).sort((a, b) => b - a);
              
              return overs.map(overNum => {
                const overBalls = ballsByOver[overNum].sort((a, b) => (b.ball_number || b.ball || 1) - (a.ball_number || a.ball || 1));
                const overRuns = overBalls.reduce((total, ball) => total + (ball.runs || 0) + (ball.extras || 0), 0);
                
                // Calculate current over from match data
                const currentOverNum = match.innings_scores && match.innings_scores[currentInnings] 
                  ? match.innings_scores[currentInnings].overs + 1 
                  : 1;
                const isCurrentOver = overNum === currentOverNum;
                
                // Count legal deliveries (not wides or no-balls)
                const legalDeliveries = overBalls.filter(ball => {
                  const extrasType = ball.extras_type || '';
                  return extrasType !== 'wide' && extrasType !== 'no-ball';
                }).length;
                
                // Over is complete if it has 6 legal deliveries or if we're past this over
                const isOverComplete = legalDeliveries >= 6 || (!isCurrentOver && overNum < currentOverNum);
                
                // Get wickets in this over
                const wicketsInOver = overBalls.filter(ball => ball.wicket).length;
                
                // Get boundary count
                const boundaries = overBalls.filter(ball => (ball.runs || 0) === 4).length;
                const sixes = overBalls.filter(ball => (ball.runs || 0) === 6).length;
                
                return (
                  <div key={overNum} className="border-b border-gray-100 last:border-b-0">
                    {/* Over Summary - Only show if over is complete */}
                    {isOverComplete && (
                      <div className={`px-4 py-3 text-sm font-medium ${
                        isCurrentOver ? 'bg-blue-50 text-blue-800 border-l-4 border-l-blue-400' : 'bg-gray-50 text-gray-700'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold">END OF OVER {overNum - 1}</span>
                          <span className="font-bold">{overRuns} runs</span>
                        </div>
                        <div className="flex items-center justify-between text-xs opacity-80">
                          <span>
                            {wicketsInOver > 0 && `${wicketsInOver} wicket${wicketsInOver > 1 ? 's' : ''}`}
                            {wicketsInOver > 0 && (boundaries > 0 || sixes > 0) && ' • '}
                            {boundaries > 0 && `${boundaries} four${boundaries > 1 ? 's' : ''}`}
                            {boundaries > 0 && sixes > 0 && ' • '}
                            {sixes > 0 && `${sixes} six${sixes > 1 ? 'es' : ''}`}
                            {wicketsInOver === 0 && boundaries === 0 && sixes === 0 && 'No boundaries'}
                          </span>
                          <span>
                            {overBalls.length} ball{overBalls.length > 1 ? 's' : ''} 
                            ({legalDeliveries} legal)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Current Over Progress - Only show for incomplete current over */}
                    {!isOverComplete && isCurrentOver && (
                      <div className="px-4 py-2 text-sm font-medium bg-yellow-50 text-yellow-800 border-l-4 border-l-yellow-400">
                        <div className="flex items-center justify-between">
                          <span>OVER {overNum - 1} IN PROGRESS</span>
                          <span className="font-bold">{overRuns} runs • {legalDeliveries}/6 balls</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Balls in this over */}
                    {overBalls.map((ball, ballIndex) => {
                      const ballNum = ball.legal_ball_number || ball.ball || 1;
                      const sequenceNum = ball.ball_number || ballIndex + 1;
                      const runs = ball.runs || 0;
                      const extras = ball.extras || 0;
                      const totalRuns = runs + extras;
                      const isLatest = overNum === (sortedBalls[0]?.over_number || sortedBalls[0]?.over || 1) && 
                                       sequenceNum === (sortedBalls[0]?.ball_number || ballIndex + 1);
                      
                      const formatBallRuns = () => {
                        if (ball.wicket) return 'W';
                        if (totalRuns === 0) return '•';
                        
                        let display = '';
                        if (extras > 0) {
                          const extrasType = ball.extras_type || '';
                          if (extrasType === 'wide') display = `${totalRuns}wd`;
                          else if (extrasType === 'no-ball') display = `${totalRuns}nb`;
                          else if (extrasType === 'bye') display = `${extras}b`;
                          else if (extrasType === 'leg-bye') display = `${extras}lb`;
                          else display = `${totalRuns}`;
                        } else {
                          display = runs.toString();
                        }
                        
                        return display;
                      };
                      
                      const formatBallDescription = () => {
                        if (ball.wicket) {
                          return `${ball.wicket_player || 'Batsman'} ${ball.wicket_type || 'out'}`;
                        }
                        
                        const extrasType = ball.extras_type || '';
                        if (extrasType === 'wide') {
                          return `Wide${totalRuns > 1 ? `, ${totalRuns} runs` : ''}`;
                        }
                        if (extrasType === 'no-ball') {
                          return `No Ball${totalRuns > 1 ? `, ${totalRuns} runs` : ''}`;
                        }
                        if (extrasType === 'bye') {
                          return `${extras} Bye${extras > 1 ? 's' : ''}`;
                        }
                        if (extrasType === 'leg-bye') {
                          return `${extras} Leg Bye${extras > 1 ? 's' : ''}`;
                        }
                        
                        if (totalRuns === 0) return 'Dot ball';
                        if (runs === 1) return '1 run';
                        if (runs === 4) return 'FOUR';
                        if (runs === 6) return 'SIX';
                        return `${runs} runs`;
                      };

                      return (
                        <div
                          key={`${overNum}-${sequenceNum}`}
                          className={`px-4 py-3 border-l-4 transition-all duration-300 ${
                            isLatest 
                              ? 'border-l-green-400 bg-green-50' 
                              : 'border-l-transparent hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Ball Number */}
                            <div className="flex-shrink-0 w-12 text-center">
                              <span className={`inline-block w-8 h-8 rounded-full text-sm font-bold leading-8 ${
                                isLatest ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                              }`}>
                                {['wide', 'no-ball'].includes(ball.extras_type) ? 
                                  `${overNum - 1}.${ballNum}*` : `${overNum - 1}.${ballNum}`}
                              </span>
                            </div>
                            
                            {/* Ball Result */}
                            <div className="flex-shrink-0 w-12 text-center">
                              <span className={`inline-block w-8 h-8 rounded-full text-sm font-bold leading-8 ${
                                ball.wicket ? 'bg-red-500 text-white' :
                                runs === 4 ? 'bg-green-500 text-white' :
                                runs === 6 ? 'bg-purple-500 text-white' :
                                totalRuns === 0 ? 'bg-gray-400 text-white' :
                                'bg-blue-500 text-white'
                              }`}>
                                {formatBallRuns()}
                              </span>
                            </div>
                            
                            {/* Ball Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-600">
                                  {ball.batsman || 'Batsman'} vs {ball.bowler || 'Bowler'}
                                </span>
                                <span className={`text-sm font-bold ${
                                  ball.wicket ? 'text-red-600' :
                                  runs === 4 ? 'text-green-600' :
                                  runs === 6 ? 'text-purple-600' :
                                  'text-gray-700'
                                }`}>
                                  {formatBallDescription()}
                                </span>
                              </div>
                              
                              {ball.commentary && (
                                <div className="text-sm text-gray-600 italic mt-1">
                                  {ball.commentary}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🏏</div>
            <h4 className="text-lg font-semibold mb-2">No balls recorded yet</h4>
            <p className="text-sm">Start scoring to see the ball-by-ball commentary here</p>
            <p className="text-xs mt-1 text-gray-400">Ball-by-ball commentary will appear here in Cricinfo style</p>
          </div>
        )}
      </div>

      {/* Bowler Selection Modal */}
      {showBowlerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏏</div>
              <h3 className="text-xl font-bold text-gray-800">Over Complete!</h3>
              <p className="text-gray-600">Select the next bowler for the new over</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Next Bowler</label>
              <select
                value={newBowler}
                onChange={(e) => setNewBowler(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              >
                <option value="">Select Bowler</option>
                {getAvailableBowlers().map(player => (
                  <option key={player.name} value={player.name}>
                    {player.name} {player.role && `(${player.role})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBowlerModal(false);
                  setNewBowler('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Keep Current Bowler
              </button>
              <button
                onClick={handleBowlerSelection}
                disabled={!newBowler}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Select Bowler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batsman Selection Modal */}
      {showBatsmanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏏</div>
              <h3 className="text-xl font-bold text-red-800">Wicket!</h3>
              <p className="text-gray-600">
                Select the next batsman to replace the {wicketPosition === 'striker' ? 'striker' : 'non-striker'}
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Next Batsman</label>
              <select
                value={newBatsman}
                onChange={(e) => setNewBatsman(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              >
                <option value="">Select Batsman</option>
                {getAvailableBatsmen().map(player => (
                  <option key={player.name} value={player.name}>
                    {player.name} {player.role && `(${player.role})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBatsmanModal(false);
                  setNewBatsman('');
                  setWicketPosition('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBatsmanSelection}
                disabled={!newBatsman}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Select Batsman
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wicket Selection Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏏</div>
              <h3 className="text-xl font-bold text-red-800">Wicket!</h3>
              <p className="text-gray-600">Select the type of dismissal</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Wicket Type</label>
              <select
                value={wicketData.type}
                onChange={(e) => setWicketData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              >
                <option value="">Select Wicket Type</option>
                <option value="bowled">Bowled</option>
                <option value="caught">Caught</option>
                <option value="lbw">LBW</option>
                <option value="stumped">Stumped</option>
                <option value="run-out">Run Out</option>
                <option value="hit-wicket">Hit Wicket</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Player Out</label>
              <select
                value={wicketData.player}
                onChange={(e) => setWicketData(prev => ({ ...prev, player: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Player</option>
                <option value={batsmen.striker}>{batsmen.striker} (Striker)</option>
                <option value={batsmen.nonStriker}>{batsmen.nonStriker} (Non-Striker)</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowWicketModal(false);
                  setWicketData({ type: '', player: '' });
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWicketSubmission}
                disabled={!wicketData.type || !wicketData.player}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Record Wicket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;