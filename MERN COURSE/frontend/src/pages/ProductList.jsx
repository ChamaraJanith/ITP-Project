import React from "react";
import { useParams, Link } from "react-router-dom";
import { Box, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import ProductCard from "../components/ProductCard";

// Mock data for demonstration
const PRODUCTS = {
  mobiles: [
    { id: "m1", name: "iPhone 14", price: 79999, image: "/images/iphone14.jpg" },
    { id: "m2", name: "Samsung Galaxy S23", price: 69999, image: "/images/galaxy-s23.jpg" },
  ],
  laptops: [
    { id: "l1", name: "MacBook Pro", price: 129999, image: "/images/macbookpro.jpg" },
    { id: "l2", name: "Dell XPS 13", price: 99999, image: "/images/dellxps13.jpg" },
  ],
};

function ProductList() {
  const { category } = useParams();
  const products = PRODUCTS[category] || [];

  return (
    <Box maxW="container.lg" mx="auto" py={10}>
      <Heading mb={6} color="blue.600" textTransform="capitalize">
        {category} for Sale
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <Text>No products found.</Text>
        )}
      </SimpleGrid>
    </Box>
  );
}

export default ProductList;
