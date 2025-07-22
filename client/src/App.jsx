import { Box } from "@chakra-ui/react"
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home.jsx"
import CreatePage from "./pages/CreatePage.jsx"
import Navbar from "./component/Navbar.jsx"   

const Demo = () => {
  return (
    <Box minH={"100vh"}>
      {/* Add the Navbar here */}
      <Navbar />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePage />} />
      </Routes>
    </Box>
  )
}
export default Demo
