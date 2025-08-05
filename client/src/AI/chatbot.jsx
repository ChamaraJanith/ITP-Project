import { useState, useEffect, useRef } from 'react';
import ChatbotIcon from "./ChatbotIcon";
import "./chatbot.css";
import ChartForm from "./ChartForm";
import ChatMessage from "./ChatMessage";
import { companyInfo } from './companyInfo';

function Chatbot() {
  const [chatHistory, setChatHistory] = useState([
    { hideInChat: true, role: "model", text: JSON.stringify(companyInfo) },
    { role: "model", text: "👋 Hey there!\nHow can I help you today?" }
  ]);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatBodyRef = useRef();

  // Calling backend and updating chat history
  const generateBotResponse = async (history) => {
    const updateHistory = (text, isError = false) => {
      setChatHistory((prev) => [
        ...prev.filter((msg) => msg.text !== "Thinking..."),
        { role: "model", text, isError }
      ]);
    };

    history = history.map(({ role, text }) => ({ role, parts: [{ text }] }));
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: history })
    };
    try {
      const response = await fetch(import.meta.env.VITE_API_URL, requestOptions);
      const text = await response.text();
      if (!text) throw new Error("Empty response from server");
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) { throw new Error("Invalid JSON from server"); }
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch response");
      const apiResponseText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/\*\*|__|\*/g, "").trim() || "No response";
      updateHistory(apiResponseText);
    } catch (error) {
      updateHistory(error.message, true);
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [chatHistory]);

  return (
    <div className={`container ${showChatbot ? "show-chatbot" : ''}`}>
      {/* Toggler Button */}
      <button
        onClick={() => setShowChatbot(prev => !prev)}
        id="chatbot-toggler"
        aria-label={showChatbot ? "Close Chatbot" : "Open Chatbot"}
      >
        <span className="material-symbols-rounded" style={{fontSize:24, transition:'opacity 0.2s'}}>
          {showChatbot ? "close" : "chat"}
        </span>
      </button>
      <div className="chatbot-popup">
        {/* Chatbot Header */}
        <div className="chatbot-header">
          <div className="header-info">
            <ChatbotIcon />
            <h2 className="logo-text" style={{
              maxWidth: '180px', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis'
            }}>Chatbot</h2>
          </div>
          <button
            onClick={() => setShowChatbot(prev => !prev)}
            className="material-symbols-rounded"
            style={{ fontSize: "2rem", background: "none" }}
            aria-label="Minimize"
          >
            {showChatbot ? "keyboard_arrow_down" : "keyboard_arrow_up"}
          </button>
        </div>
        {/* Chatbot Body */}
        <div ref={chatBodyRef} className="chat-body">
          {chatHistory.map((chat, index) => (
            <ChatMessage key={index} chat={chat} />
          ))}
        </div>
        {/* Chatbot Footer/Input */}
        <div className="chat-footer">
          <form
            className="chat-form"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
            onSubmit={async (e) => {
              e.preventDefault();
              const message = e.target.elements.message.value.trim();
              if (!message) return;
              setChatHistory((hist) => [
                ...hist,
                { role: "user", text: message }
              ]);
              setTimeout(() => {
                setChatHistory((hist) => [
                  ...hist,
                  { role: "model", text: "Thinking..." }
                ]);
              }, 100);
              e.target.reset();
              await generateBotResponse([
                ...chatHistory,
                { role: "user", text: message }
              ]);
            }}
          >
            <input
              className="message-input"
              name="message"
              placeholder="Message..."
              autoComplete="off"
              style={{ paddingRight: "48px" }}
            />
            <button type="submit" aria-label="Send">
              <span className="material-symbols-rounded">arrow_upward</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
