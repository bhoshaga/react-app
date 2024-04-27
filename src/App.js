import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    const reader = response.body.getReader();
    const processText = async ({ done, value }) => {
      if (done) return;
      
      const chunk = new TextDecoder("utf-8").decode(value);
      receivedText += chunk;
      setMessages(messages => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.sender === 'Assistant') {
          return [
            ...messages.slice(0, -1),
            { ...lastMessage, text: lastMessage.text + chunk },
          ];
        } else {
          return [...messages, { text: chunk, sender: 'Assistant' }];  
        }
      });
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

  if (isLoading) {
    return (
      <div>
        <h1>Loading...</h1>
        <progress />
      </div>
    );
  }

  return (
    <div className="chat-container">
      {userInfo ? (
        <>
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          children={String(children).replace(/\n$/, '')}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        />
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
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage}>
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <p>Please login to chat.</p>
          <button onClick={handleLogin}>Login with Google</button>  
        </>
      )}
    </div>
  );
};

export default App;