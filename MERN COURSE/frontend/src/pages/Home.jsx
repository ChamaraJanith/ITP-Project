import React from "react";
import { Box, Heading, Text, Button, Stack } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <Box
      minH="80vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      bgGradient="linear(to-r, cyan.400, blue.500)"
      color="white"
      textAlign="center"
      py={20}
    >
      <Heading fontSize={{ base: "3xl", md: "5xl" }} fontWeight="bold">
        Welcome to the Mobile & Laptop Shop!
      </Heading>
      <Text fontSize="xl" mt={4} mb={8}>
        Discover the latest devices at unbeatable prices.
      </Text>
      <Stack direction={{ base: "column", md: "row" }} spacing={6}>
        <Button as={Link} to="/category/mobiles" colorScheme="whiteAlpha" bg="white" color="blue.500">
          Shop Mobiles
        </Button>
        <Button as={Link} to="/category/laptops" colorScheme="whiteAlpha" bg="white" color="blue.500">
          Shop Laptops
        </Button>
      </Stack>
    </Box>
  );
}

export default Home;
