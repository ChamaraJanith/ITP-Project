import { Box } from "@chakra-ui/react"
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import CreatePage from "./pages/Register.jsx"
import Navbar from "./component/Navbar.jsx"   
import Chatbot from "./AI/Chatbot.jsx"
import Login from "./pages/Login.jsx"
import Register from "./pages/Register.jsx"

const Demo = () => {
  return (
    <Box minH={"100vh"}>
      {/* Add the Navbar here */}
      <Navbar />

      <div>
        <Chatbot/>
      </div>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register />} />
      </Routes>
    </Box>

    
  )

}
export default Demo
