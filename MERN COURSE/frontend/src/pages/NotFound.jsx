import React from "react";
import { Box, Heading, Text, Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <Box minH="60vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <Heading color="red.500" mb={4}>404</Heading>
      <Text fontSize="xl" mb={6}>Page Not Found</Text>
      <Button as={Link} to="/" colorScheme="blue">
        Go to Home
      </Button>
    </Box>
  );
}

export default NotFound;
