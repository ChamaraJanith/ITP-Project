const ChatbotIcon = () => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="50" 
      height="50" 
      viewBox="0 0 100 100"
      fill="none"
    >
      {/* Chat bubble background */}
      <circle 
        cx="50" 
        cy="45" 
        r="35" 
        fill="#EA580C" 
        stroke="#FB923C" 
        strokeWidth="2"
      />
      
      {/* Subtle inner glow */}
      <circle 
        cx="50" 
        cy="45" 
        r="30" 
        fill="none" 
        stroke="#FDBA74" 
        strokeWidth="1"
        opacity="0.3"
      />
      
      {/* Medical cross */}
      <rect 
        x="46" 
        y="28" 
        width="8" 
        height="20" 
        rx="2" 
        fill="white"
      />
      <rect 
        x="38" 
        y="36" 
        width="24" 
        height="8" 
        rx="2" 
        fill="white"
      />
      
      {/* Chat dots */}
      <circle cx="40" cy="58" r="2.5" fill="#FED7AA" />
      <circle cx="50" cy="58" r="2.5" fill="#FED7AA" />
      <circle cx="60" cy="58" r="2.5" fill="#FED7AA" />
      
      {/* Heart pulse line */}
      <path 
        d="M25 85 L35 85 L38 78 L42 92 L46 72 L50 85 L75 85" 
        stroke="#059669" 
        strokeWidth="2.5" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ChatbotIcon
