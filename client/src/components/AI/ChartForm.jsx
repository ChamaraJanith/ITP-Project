import React, { useRef } from "react";

const ChartForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {
  const inputRef = useRef();

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const userMessage = inputRef.current.value.trim();
    if (!userMessage) return;
    inputRef.current.value = "";

    // Update chat history with user message
    setChatHistory((history) => [...history, { role: "user", text: userMessage }]);

    // Simulate bot response after a delay
    setTimeout(() => {
      // Add a thinking message to the chat history
      setChatHistory((history) => [
        ...history,
        { role: "model", text: "Thinking..." },
      ]);

      // Call the function to generate bot response with the current chat history
      generateBotResponse([...chatHistory, { role: "user", text: `using the details provide above, please address this query: ${userMessage} `}]);
    }, 600);
  };

  return (
    <form action="#" className="chat-form" onSubmit={handleFormSubmit}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Message..."
        className="message-input"
        required
      />
      <button className="material-symbols-rounded">arrow_upward</button>
    </form>
  );
};

export default ChartForm;