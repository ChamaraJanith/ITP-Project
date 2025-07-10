import React from "react";
import { Box, Flex, Button, HStack, Spacer, IconButton } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUser } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  return (
    <Box bg="blue.600" px={4} color="white" boxShadow="md">
      <Flex h={16} alignItems="center">
        <HStack spacing={8}>
          <Button as={Link} to="/" variant="ghost" color="white" fontWeight="bold">
            ShopLogo
          </Button>
          <Button as={Link} to="/category/mobiles" variant="ghost" color="white">
            Mobiles
          </Button>
          <Button as={Link} to="/category/laptops" variant="ghost" color="white">
            Laptops
          </Button>
        </HStack>
        <Spacer />
        <HStack spacing={4}>
          <IconButton
            icon={<FaShoppingCart />}
            variant="ghost"
            color="white"
            aria-label="Cart"
            onClick={() => navigate("/cart")}
          />
          <IconButton
            icon={<FaUser />}
            variant="ghost"
            color="white"
            aria-label="Account"
            onClick={() => navigate("/account")}
          />
        </HStack>
      </Flex>
    </Box>
  );
}

export default Navbar;
