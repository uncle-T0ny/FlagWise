import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Community {
  id: string;
  rules: string[];
}

interface ValidationResult {
  isValid: boolean;
  violatedRule?: string;
}

interface ScanResult {
  message: string;
  isValid: boolean;
  violatedRule?: string;
}

type TabType = 'create' | 'manage' | 'validate';
type ValidationMode = 'single' | 'url';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('validate');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Initialize dark mode from localStorage or default to true
  const getInitialDarkMode = (): boolean => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      return savedDarkMode === 'true';
    }
    return true; // Default to dark mode
  };

  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);

  const [newCommunityId, setNewCommunityId] = useState<string>('');
  const [newCommunityRules, setNewCommunityRules] = useState<string>('');
  const [updateRules, setUpdateRules] = useState<string>('');

  // Validation mode state
  const [validationMode, setValidationMode] = useState<ValidationMode>('single');
  const [communityUrl, setCommunityUrl] = useState<string>('');
  const [urlGuidelines, setUrlGuidelines] = useState<string>('');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showActiveRules, setShowActiveRules] = useState<boolean>(true);

  // Ref for scrolling to results
  const resultsPanelRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Apply dark mode class to document and save to localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await fetch(`${API_URL}/community`);
      const data = await response.json();
      setCommunities(data);
      if (data.length > 0 && !selectedCommunityId) {
        setSelectedCommunityId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };

  // Update textarea when community selection changes
  useEffect(() => {
    const community = communities.find(c => c.id === selectedCommunityId);
    if (community) {
      setUpdateRules(community.rules.join('\n'));
    } else {
      setUpdateRules('');
    }
  }, [selectedCommunityId, communities]);

  const createCommunity = async () => {
    if (!newCommunityId) {
      alert('Please enter community ID');
      return;
    }

    const rulesArray = newCommunityRules
      ? newCommunityRules.split('\n').filter(rule => rule.trim() !== '')
      : undefined;

    try {
      const response = await fetch(`${API_URL}/community`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newCommunityId,
          rules: rulesArray
        }),
      });

      if (response.ok) {
        setNewCommunityId('');
        setNewCommunityRules('');
        fetchCommunities();
        alert('Community created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Error creating community');
    }
  };

  const handleSetRules = async () => {
    if (!selectedCommunityId || !updateRules) {
      alert('Please select a community and enter rules');
      return;
    }

    const rulesArray = updateRules.split('\n').filter(rule => rule.trim() !== '');

    try {
      const response = await fetch(`${API_URL}/community/${selectedCommunityId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: rulesArray }),
      });

      if (response.ok) {
        setUpdateRules('');
        fetchCommunities();
        alert('Rules updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error setting rules:', error);
      alert('Error setting rules');
    }
  };

  const checkMessage = async () => {
    if (!selectedCommunityId || !message) {
      alert('Please select a community and enter a message');
      return;
    }

    setIsLoading(true);
    setValidationResult(null);

    try {
      const response = await fetch(`${API_URL}/community/${selectedCommunityId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
        // Scroll to results panel after validation
        setTimeout(() => {
          resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error checking message:', error);
      alert('Error checking message');
    } finally {
      setIsLoading(false);
    }
  };

  const scanCommunityUrl = async () => {
    if (!communityUrl || !urlGuidelines) {
      alert('Please enter both the community URL and guidelines');
      return;
    }

    setIsScanning(true);
    setScanResults([]);

    try {
      const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: communityUrl,
          guidelines: urlGuidelines.split('\n').filter(g => g.trim() !== '')
        }),
      });

      if (response.ok) {
        const results = await response.json();
        setScanResults(results);
        // Scroll to results panel after scan
        setTimeout(() => {
          resultsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error scanning URL:', error);
      alert('Error scanning community URL');
    } finally {
      setIsScanning(false);
    }
  };

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navItems = [
    { id: 'validate' as TabType, label: 'Validate', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    )},
    { id: 'create' as TabType, label: 'Create', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    )},
    { id: 'manage' as TabType, label: 'Manage', icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    )}
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/flagwise-logo.png" alt="FlagWise" className="logo-image" />
          </div>

          <nav className="nav-menu">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <a
              href="https://github.com/uncle-T0ny/FlagWise"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
              aria-label="View on GitHub"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <button
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {activeTab === 'validate' && (
            <div className="validate-layout">
              {/* Configuration Panel */}
              <div className="panel config-panel">
                <div className="panel-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span>Configuration</span>
                </div>
                <p className="panel-description">
                  {validationMode === 'single'
                    ? 'Select a community and enter a message to validate'
                    : 'Enter your community guidelines and the URL to scan for violations'}
                </p>

                {/* Validation Mode Toggle */}
                <div className="mode-toggle">
                  <button
                    className={`mode-btn ${validationMode === 'single' ? 'active' : ''}`}
                    onClick={() => setValidationMode('single')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Single Message
                  </button>
                  <button
                    className={`mode-btn ${validationMode === 'url' ? 'active' : ''}`}
                    onClick={() => setValidationMode('url')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    Community URL
                  </button>
                </div>

                {validationMode === 'single' ? (
                  <>
                    <div className="form-group">
                      <label>Community</label>
                      <select
                        value={selectedCommunityId}
                        onChange={(e) => setSelectedCommunityId(e.target.value)}
                      >
                        <option value="">-- Select a Community --</option>
                        {communities.map(community => (
                          <option key={community.id} value={community.id}>
                            {community.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCommunity && selectedCommunity.rules.length > 0 && (
                      <div className="rules-preview">
                        <button
                          className="rules-toggle"
                          onClick={() => setShowActiveRules(!showActiveRules)}
                        >
                          <span>Active Rules ({selectedCommunity.rules.length})</span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={showActiveRules ? 'chevron-up' : 'chevron-down'}
                          >
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                        {showActiveRules && (
                          <ul>
                            {selectedCommunity.rules.map((rule, index) => (
                              <li key={index}>{rule}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="form-group">
                      <label>Message to Validate</label>
                      <textarea
                        placeholder="Enter the message you want to check against community rules..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                      />
                      <span className="char-count">{message.length} characters</span>
                    </div>

                    <button
                      className={`primary-btn ${isLoading ? 'loading' : ''}`}
                      onClick={checkMessage}
                      disabled={isLoading || !selectedCommunityId || !message}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {isLoading ? 'Validating...' : 'Validate Message'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Community Guidelines</label>
                      <textarea
                        placeholder="Paste your community guidelines here...  Example: - No hate speech or discrimination - No spam or self-promotion - Be respectful to other members - No sharing of personal information - Keep discussions on-topic"
                        value={urlGuidelines}
                        onChange={(e) => setUrlGuidelines(e.target.value)}
                        rows={8}
                      />
                      <span className="char-count">{urlGuidelines.length} characters</span>
                    </div>

                    <div className="form-group">
                      <label>Community URL</label>
                      <div className="url-input-wrapper">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        <input
                          type="url"
                          placeholder="https://news.ycombinator.com or https://reddit.com/r/..."
                          value={communityUrl}
                          onChange={(e) => setCommunityUrl(e.target.value)}
                        />
                      </div>
                      <span className="helper-text">Supports Hacker News, Reddit, and other public forums</span>
                    </div>

                    <button
                      className={`primary-btn ${isScanning ? 'loading' : ''}`}
                      onClick={scanCommunityUrl}
                      disabled={isScanning || !communityUrl || !urlGuidelines}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                      {isScanning ? 'Scanning...' : 'Start Scan'}
                    </button>
                  </>
                )}
              </div>

              {/* Results Panel */}
              <div className="panel results-panel" ref={resultsPanelRef}>
                <div className="panel-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <span>{validationMode === 'single' ? 'Validation Result' : 'Moderation Report'}</span>
                </div>
                <p className="panel-description">
                  {validationMode === 'single'
                    ? 'Result will appear here after validation'
                    : 'Results will appear here after scanning'}
                </p>

                {validationMode === 'single' ? (
                  validationResult ? (
                    <div className={`result-card ${validationResult.isValid ? 'valid' : 'invalid'}`}>
                      <div className="result-icon">
                        {validationResult.isValid ? (
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                        ) : (
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        )}
                      </div>
                      <h3>{validationResult.isValid ? 'Message is Valid' : 'Violation Detected'}</h3>
                      {!validationResult.isValid && validationResult.violatedRule && (
                        <p className="violated-rule">
                          <strong>Violated Rule:</strong> {validationResult.violatedRule}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                      </svg>
                      <p className="empty-title">No Validation Results</p>
                      <p className="empty-description">Select a community and enter a message to validate</p>
                    </div>
                  )
                ) : (
                  scanResults.length > 0 ? (
                    <div className="scan-results">
                      {scanResults.map((result, index) => (
                        <div key={index} className={`scan-result-item ${result.isValid ? 'valid' : 'invalid'}`}>
                          <div className="scan-result-status">
                            {result.isValid ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                            )}
                          </div>
                          <div className="scan-result-content">
                            <p className="scan-message">{result.message}</p>
                            {!result.isValid && result.violatedRule && (
                              <p className="scan-violation">Violated: {result.violatedRule}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                      </svg>
                      <p className="empty-title">No Scan Results</p>
                      <p className="empty-description">Configure your guidelines and URL to start scanning</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="single-panel-layout">
              <div className="panel">
                <div className="panel-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Create New Community</span>
                </div>
                <p className="panel-description">Set up a new community with custom moderation rules</p>

                <div className="form-group">
                  <label>Community ID</label>
                  <input
                    type="text"
                    placeholder="Enter a unique community identifier"
                    value={newCommunityId}
                    onChange={(e) => setNewCommunityId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Initial Rules (Optional)</label>
                  <textarea
                    placeholder="Enter initial rules (one per line)&#10;Example:&#10;- No hate speech or discrimination&#10;- No spam or self-promotion&#10;- Be respectful to other members"
                    value={newCommunityRules}
                    onChange={(e) => setNewCommunityRules(e.target.value)}
                    rows={8}
                  />
                </div>
                <button className="primary-btn" onClick={createCommunity} disabled={!newCommunityId}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Community
                </button>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="single-panel-layout">
              <div className="panel">
                <div className="panel-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span>Manage Community Rules</span>
                </div>
                <p className="panel-description">Update moderation rules for an existing community</p>

                <div className="form-group">
                  <label>Select Community</label>
                  <select
                    value={selectedCommunityId}
                    onChange={(e) => setSelectedCommunityId(e.target.value)}
                  >
                    <option value="">-- Select a Community --</option>
                    {communities.map(community => (
                      <option key={community.id} value={community.id}>
                        {community.id}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCommunity && (
                  <>
                    <div className="form-group">
                      <label>Rules (one per line)</label>
                      <textarea
                        placeholder="Enter rules (one per line)"
                        value={updateRules}
                        onChange={(e) => setUpdateRules(e.target.value)}
                        rows={12}
                      />
                    </div>
                    <button className="primary-btn" onClick={handleSetRules}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Update Rules
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
