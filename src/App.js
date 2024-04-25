import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [haikus, setHaikus] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Set withCredentials to true for all Axios requests
    axios.defaults.withCredentials = true;

    fetchUserInfo();
  }, []);

  const fetchUserInfo = () => {
    axios.get('https://api.stru.ai/user_info')
      .then(response => {
        setUserInfo(response.data);
      })
      .catch(error => {
        console.error('Error fetching user info:', error);
      });
  };

  const handleGenerateHaiku = () => {
    axios.get('https://api.stru.ai/gen_haiku')
      .then(response => {
        const newHaiku = response.data.haiku;
        setHaikus(prevHaikus => [...prevHaikus, newHaiku]);
      })
      .catch(error => {
        console.error('Error generating haiku:', error);
      });
  };

  const handleLogout = () => {
    axios.get('https://api.stru.ai/logout')
      .then(() => {
        window.location.href = 'http://localhost:3000';
      })
      .catch(error => {
        console.error('Error logging out:', error);
      });
  };

  return (
    <div>
      <h1>App Page</h1>
      {userInfo && (
        <div>
          <h2>Hello, {userInfo.given_name}!</h2>
          <img src={userInfo.picture} alt="User" style={{ borderRadius: '50%', width: '100px', height: '100px' }} />
        </div>
      )}
      <button onClick={handleGenerateHaiku}>Generate Haiku</button>
      <ul>
        {haikus.map((haiku, index) => (
          <li key={index}>{haiku}</li>
        ))}
      </ul>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default App;
