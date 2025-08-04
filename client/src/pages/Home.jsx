import React from 'react';
import MedicalNavbar from '../components/NavBar';
import ChatBot from '../AI/chatbot.jsx'; // <-- Import here

const Home = () => (
  <div>
    <MedicalNavbar />
    {/* Other home content here */}

    {/* AI Chatbot Section */}
    <ChatBot /> 

    {/* You can add more content below */}
  </div>
);

export default Home;
