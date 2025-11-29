import { useState, useEffect } from 'react'
import './App.css'

interface Community {
  id: string;
  rules: string[];
}

interface ValidationResult {
  isValid: boolean;
  violatedRule?: string;
}

type TabType = 'create' | 'manage' | 'validate';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [newCommunityId, setNewCommunityId] = useState<string>('');
  const [newCommunityRules, setNewCommunityRules] = useState<string>('');
  const [updateRules, setUpdateRules] = useState<string>('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  return (
    <div className="app">
      <h1>FlagWise - Community Content Moderator</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Community
        </button>
        <button
          className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Rules
        </button>
        <button
          className={`tab ${activeTab === 'validate' ? 'active' : ''}`}
          onClick={() => setActiveTab('validate')}
        >
          Validate Message
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'create' && (
          <div className="section">
            <h2>Create New Community</h2>
            <input
              type="text"
              placeholder="Community ID"
              value={newCommunityId}
              onChange={(e) => setNewCommunityId(e.target.value)}
            />
            <textarea
              placeholder="Enter initial rules (one per line) - Optional"
              value={newCommunityRules}
              onChange={(e) => setNewCommunityRules(e.target.value)}
              rows={6}
            />
            <button onClick={createCommunity}>Create Community</button>
          </div>
        )}

        {activeTab === 'manage' && (
          <>
            <div className="section">
              <h2>Select Community</h2>
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
              <div className="section">
                <h2>Manage Rules</h2>
                <p className="helper-text">Edit the rules below (one per line)</p>
                <textarea
                  placeholder="Enter rules (one per line)"
                  value={updateRules}
                  onChange={(e) => setUpdateRules(e.target.value)}
                  rows={12}
                />
                <button onClick={handleSetRules}>Update Rules</button>
              </div>
            )}
          </>
        )}

        {activeTab === 'validate' && (
          <>
            <div className="section">
              <h2>Select Community</h2>
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
                <div className="section">
                  <h2>Community Rules</h2>
                  <div className="rules-list">
                    {selectedCommunity.rules.length === 0 ? (
                      <p>No rules set for this community</p>
                    ) : (
                      <ul>
                        {selectedCommunity.rules.map((rule, index) => (
                          <li key={index}>{rule}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="section">
                  <h2>Validate Message</h2>
                  <textarea
                    placeholder="Enter message to validate"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                  />
                  <button onClick={checkMessage} disabled={isLoading} className={isLoading ? 'loading' : ''}>
                    {isLoading ? 'Checking...' : 'Verify Message'}
                  </button>

                  {validationResult && (
                    <div className={`result ${validationResult.isValid ? 'valid' : 'invalid'}`}>
                      <h3>{validationResult.isValid ? '✓ Message is Valid' : '✗ Message Violates Rules'}</h3>
                      {!validationResult.isValid && validationResult.violatedRule && (
                        <p><strong>Violated Rule:</strong> {validationResult.violatedRule}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
