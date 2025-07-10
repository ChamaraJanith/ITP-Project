import React from "react";
import { useParams, Link } from "react-router-dom";
import { Box, Heading, Text, Button, Image } from "@chakra-ui/react";

// Example mock product data
const PRODUCTS = {
  m1: { name: "iPhone 14", price: 79999, image: "/images/iphone14.jpg", desc: "Latest Apple iPhone." },
  m2: { name: "Samsung Galaxy S23", price: 69999, image: "/images/galaxy-s23.jpg", desc: "Flagship Samsung phone." },
  l1: { name: "MacBook Pro", price: 129999, image: "/images/macbookpro.jpg", desc: "Apple's premium laptop." },
  l2: { name: "Dell XPS 13", price: 99999, image: "/images/dellxps13.jpg", desc: "High-end Dell ultrabook." },
};

function ProductDetails() {
  const { id } = useParams();
  const product = PRODUCTS[id];

  if (!product) {
    return <Box p={8}><Text>Product not found.</Text></Box>;
  }

  return (
    <Box maxW="lg" mx="auto" py={10} textAlign="center">
      <Image src={product.image} alt={product.name} borderRadius="md" mb={6} />
      <Heading mb={2}>{product.name}</Heading>
      <Text mb={4} color="gray.600">{product.desc}</Text>
      <Text fontSize="xl" fontWeight="bold" mb={6}>₹{product.price}</Text>
      <Button colorScheme="blue" as={Link} to="/cart">
        Add to Cart
      </Button>
    </Box>
  );
}

export default ProductDetails;
