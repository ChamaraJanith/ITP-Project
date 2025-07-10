import React from "react";
import { Box, Heading, Text, Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function Account() {
  // Replace with real user/account logic
  return (
    <Box maxW="container.md" mx="auto" py={10}>
      <Heading mb={6} color="blue.600">Account</Heading>
      <Text mb={6}>Please log in to view your account.</Text>
      <Button as={Link} to="/" colorScheme="blue">
        Back to Home
      </Button>
    </Box>
  );
}

export default Account;
