import React from "react";
import { Box, Heading, Text, Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function Cart() {
  // Replace with real cart logic
  return (
    <Box maxW="container.md" mx="auto" py={10}>
      <Heading mb={6} color="blue.600">Shopping Cart</Heading>
      <Text mb={6}>Your cart is empty.</Text>
      <Button as={Link} to="/" colorScheme="blue">
        Continue Shopping
      </Button>
    </Box>
  );
}

export default Cart;
