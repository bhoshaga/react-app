import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

const App = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUserInfo = () => {
    axios.get('https://api.stru.ai/user_info', { withCredentials: true })
      .then(response => {
        setUserInfo(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        if (error.response && error.response.status === 401) {
          setUserInfo(null);
          setIsLoading(false);
        } else {
          console.error('Error fetching user info:', error);
          setIsLoading(false);
        }
      });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const userMessage = { text: input, sender: 'User' };
    setMessages(messages => [...messages, userMessage]);
    setInput('');
  
    const response = await fetch('https://api.stru.ai/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "userID": `${userInfo.email}`,
        "sessionID": "93848bcf-0676-491e-8801-0861585c7d3e",
        "message": input
      }),
      credentials: 'include',
    });
  
    let receivedText = '';
    let model = '';
    let buttons = [];
    setMessages(messages => [...messages, { text: '', sender: 'Assistant', model, buttons }]);
  
    const reader = response.body.getReader();
    const processText = async ({ done, value }) => {
      if (done) {
        return;
      }
      
      const chunk = new TextDecoder("utf-8").decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.type === 'text') {
              receivedText += parsedData.value;
              setMessages(messages => {
                const lastMessage = messages[messages.length - 1];
                return [
                  ...messages.slice(0, -1),
                  { ...lastMessage, text: receivedText }
                ];
              });
            } else if (parsedData.type === 'model') {
              model = parsedData.value;
            } else if (parsedData.type === 'button') {
              buttons.push(parsedData);
            }
          } catch (error) {
            console.error('Error parsing server event:', error);
          }
        }
      }
      reader.read().then(processText);
    };
    reader.read().then(processText);
  };
  
  const handleLogout = () => {
    axios.get('https://api.stru.ai/logout', { withCredentials: true })
      .then(() => {
        setUserInfo(null);
      })
      .catch(error => {
        console.error('Error logging out:', error);
      });
  };

  const handleLogin = () => {
    window.location.href = 'https://api.stru.ai/login';
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
  };

  const handleDownload = (fileId) => {
    // Implement the logic to handle file downloads based on the fileId
    console.log('Downloading file:', fileId);
  };

  if (isLoading) {
    return (
      <div className="App">
        <h1>Loading...</h1>
        <progress />
      </div>
    );
  }

  return (
    <div className="App">
      {userInfo ? (
        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender === 'User' ? 'user' : 'assistant'}`}>
                <div className="avatar">{msg.sender === 'User' ? 'U' : 'A'}</div>
                <div className="message-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        const code = String(children).replace(/\n$/, '');
                        return !inline && match ? (
                          <div className="code-block">
                            <SyntaxHighlighter
                              children={code}
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            />
                            <button 
                              className="copy-button"
                              onClick={() => copyToClipboard(code)}
                            >
                              Copy
                            </button>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                {msg.model && (
                  <div className="model-container">
                    <button className="model-button">{msg.model}</button>
                  </div>
                )}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="button-container">
                    {msg.buttons.map((button, idx) => (
                      <button 
                        key={idx}
                        className={`download-button ${button.file_id.split('_')[0]}`}
                        onClick={() => handleDownload(button.file_id)}
                      >
                        {button.value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="input-area">
            <form onSubmit={handleSendMessage}>
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div className="login-container">
          <p>Please login to chat.</p>
          <button onClick={handleLogin}>Login with Google</button>  
        </div>
      )}
    </div>
  );
};

export default App;