import React from "react";
import { Box, Image, Heading, Text, Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" boxShadow="md" p={5}>
      <Image src={product.image} alt={product.name} borderRadius="md" mb={4} />
      <Heading fontSize="lg" mb={2} color="blue.600">
        {product.name}
      </Heading>
      <Text fontWeight="bold" color="gray.700">
        ₹{product.price}
      </Text>
      <Button
        as={Link}
        to={`/product/${product.id}`}
        mt={4}
        colorScheme="blue"
        variant="outline"
        width="100%"
      >
        View Details
      </Button>
    </Box>
  );
}

export default ProductCard;
