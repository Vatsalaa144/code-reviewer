import { useState, useEffect } from "react";
import "prismjs/themes/prism-tomorrow.css";
import Editor from "react-simple-code-editor";
import prism from "prismjs";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from "axios";

import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [code, setCode] = useState('');
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    prism.highlightAll();
  }, []);

  async function reviewCode() {
    if (isLoading || !code.trim()) return;
    
    setIsLoading(true);
    setReview('Analyzing your code...');
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://code-reviewer-ggok.onrender.com';
    
    try {
      const response = await axios.post(
        `${baseUrl}/ai/get-review`,
        { code },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 second timeout
        }
      );
      setReview(response.data);
    } catch (error) {
      const message = error?.response?.data || error?.message || 'Unknown error';
      console.error('Error reviewing code:', message, error);
      
      let errorMessage = '## ⚠️ Review Error\n\n';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please try again with shorter code or check your connection.';
      } else if (error?.response?.status === 404) {
        errorMessage += 'API endpoint not found. Please check if the backend server is running.';
      } else if (error?.response?.status >= 500) {
        errorMessage += 'Server error occurred. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage += 'No internet connection. Please check your network and try again.';
      } else {
        errorMessage += `Could not get review: ${String(message)}`;
      }
      
      setReview(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    // Allow Ctrl+Enter or Cmd+Enter to trigger review
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      reviewCode();
    }
  };

  return (
    <>
      <main>
        <div className="left">
          <div className={`code ${code.trim() ? 'has-content' : ''}`}>
            {!code.trim() && (
              <div className="code-placeholder">
                <div className="main-text">
                  Copy and Paste Your <span className="highlight">CODE</span> Here
                </div>
                <div className="sub-text">
                  To Review It
                </div>
              </div>
            )}
            <Editor
              value={code}
              onValueChange={(code) => setCode(code)}
              onKeyDown={handleKeyDown}
              highlight={(code) =>
                prism.highlight(code, prism.languages.javascript, "javascript")
              }
              padding={10}
              placeholder=""
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
                fontSize: 14,
                lineHeight: 1.6,
                height: "100%",
                width: "100%",
                outline: "none",
                resize: "none",
                backgroundColor: "transparent",
                color: "#e2e8f0",
                caretColor: "#667eea",
              }}
              textareaClassName="code-textarea"
            />
          </div>
          <button 
            onClick={reviewCode} 
            disabled={isLoading || !code.trim()}
            className={`review ${isLoading ? 'loading' : ''}`}
            title={isLoading ? 'Analyzing...' : 'Click to review code (Ctrl+Enter)'}
            aria-label={isLoading ? 'Analyzing code' : 'Review code'}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              'Review'
            )}
          </button>
        </div>
        <div className={`right ${isLoading ? 'loading' : ''}`}>
          <Markdown 
            rehypePlugins={[rehypeHighlight]}
            components={{
              // Custom renderer for code blocks to ensure proper styling
              code: ({node, inline, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <pre className={className} {...props}>
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {review}
          </Markdown>
        </div>
      </main>

      <style jsx>{`
        .spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .review.loading {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .review:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2) !important;
        }

        .code-textarea::placeholder {
          color: #718096 !important;
          opacity: 0.8;
        }
      `}</style>
    </>
  );
}

export default App;