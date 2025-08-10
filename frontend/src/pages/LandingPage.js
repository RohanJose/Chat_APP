import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getOnlineCount } from '../services/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1234);

  useEffect(() => {
    const fetchOnlineCount = async () => {
      try {
        const data = await getOnlineCount();
        setOnlineCount(data.total);
      } catch (error) {
        console.error('Error fetching online count:', error);
      }
    };

    fetchOnlineCount();
    // Update every 30 seconds
    const interval = setInterval(fetchOnlineCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartChat = (chatType) => {
    if (!isAnonymous && !username.trim()) {
      alert('Please enter a username');
      return;
    }
    
    const finalUsername = isAnonymous ? `Anonymous_${Math.random().toString(36).substr(2, 6)}` : username;
    localStorage.setItem('chatUsername', finalUsername);
    localStorage.setItem('isAnonymous', isAnonymous.toString());
    
    navigate(`/${chatType}-chat`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img src="/logo.svg" alt="Stranger Chat" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stranger Chat</h1>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online: {onlineCount.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chat Mode Selection - Moved to Top */}
        <div className="mb-12">
                      <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Your Chat Experience
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Connect with strangers through video or text chat. Your choice, your experience.
              </p>
            </div>

          {/* Chat Mode Buttons */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <button
              onClick={() => {
                setIsAnonymous(true);
                handleStartChat('video');
              }}
              className="group relative bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-blue-200 dark:border-blue-600 hover:border-blue-300 dark:hover:border-blue-500 rounded-2xl p-8 shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Video Chat</h3>
                  <p className="text-gray-600 dark:text-gray-300">Face-to-face conversations with real-time video and audio</p>
                </div>
                <div className="text-sm text-blue-600 font-medium">Start Video Chat →</div>
              </div>
            </button>

            <button
              onClick={() => {
                setIsAnonymous(true);
                handleStartChat('text');
              }}
              className="group relative bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-green-200 dark:border-green-600 hover:border-green-300 dark:hover:border-green-500 rounded-2xl p-8 shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Text Chat</h3>
                  <p className="text-gray-600 dark:text-gray-300">Quick and easy text-based conversations</p>
                </div>
                <div className="text-sm text-green-600 font-medium">Start Text Chat →</div>
              </div>
            </button>
          </div>

          {/* Login Option */}
          <div className="text-center mt-8">
            <button
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Sign in with username</span>
            </button>
          </div>
        </div>

        {/* App Description and Features */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Connect with People Around the World
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Experience meaningful conversations with strangers through secure video and text chat. 
            Join thousands of users making new connections every day.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure & Private</h3>
            <p className="text-gray-600 dark:text-gray-300">Your conversations are encrypted and your identity is protected.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Global Community</h3>
            <p className="text-gray-600 dark:text-gray-300">Connect with people from different countries and cultures.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Instant Connection</h3>
            <p className="text-gray-600 dark:text-gray-300">Start chatting immediately with our smart matching system.</p>
          </div>
        </div>

        {/* Login Modal */}
        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full transition-colors duration-300">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Choose Your Identity</h2>
              
              {/* Anonymous Option */}
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  id="anonymous"
                  name="identity"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="anonymous" className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                  Chat as Anonymous
                </label>
              </div>

              {/* Username Option */}
              <div className="flex items-center mb-6">
                <input
                  type="radio"
                  id="username"
                  name="identity"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="username" className="ml-3 text-gray-700 dark:text-gray-300 font-medium">
                  Use Username
                </label>
              </div>

              {!isAnonymous && (
                <input
                  type="text"
                  placeholder="Enter your username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogin(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!isAnonymous && !username.trim()) {
                      alert('Please enter a username');
                      return;
                    }
                    handleStartChat('video');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-16">
          <p className="flex items-center justify-center space-x-2">
            <span>🔒</span>
            <span>Your privacy and security are our top priorities</span>
            <span>🔒</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
