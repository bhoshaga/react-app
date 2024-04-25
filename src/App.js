import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [haikus, setHaikus] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchUserInfo();
  }, []);

  const fetchUserInfo = () => {
    const token = localStorage.getItem('token');

    if (token) {
      axios.get('https://api.stru.ai/user_info', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(response => {
          setUserInfo(response.data);
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
        });
    }
  };

  const handleGenerateHaiku = () => {
    const token = localStorage.getItem('token');

    if (token) {
      axios.get('https://api.stru.ai/gen_haiku', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(response => {
          const newHaiku = response.data.haiku;
          setHaikus(prevHaikus => [...prevHaikus, newHaiku]);
        })
        .catch(error => {
          console.error('Error generating haiku:', error);
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = 'https://haikulanding.netlify.app';
  };

  return (
    <div>
      <h1>App Page</h1>
      {userInfo ? (
        <div>
          <h2>Hello, {userInfo.given_name}!</h2>
          <img src={userInfo.picture} alt="User" style={{ borderRadius: '50%', width: '100px', height: '100px' }} />
          <button onClick={handleGenerateHaiku}>Generate Haiku</button>
          <ul>
            {haikus.map((haiku, index) => (
              <li key={index}>{haiku}</li>
            ))}
          </ul>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Please log in to access the app.</p>
      )}
    </div>
  );
};

export default App;