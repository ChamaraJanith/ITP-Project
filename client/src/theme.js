// src/theme.js
import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: "#e3f2fd",
    100: "#bbdefb",
    200: "#90caf9",
    300: "#64b5f6",
    400: "#42a5f5",
    500: "#2196f3", // Primary
    600: "#1e88e5",
    700: "#1976d2",
    800: "#1565c0",
    900: "#0d47a1",
  },
  darkBg: "#18181b",
  darkSurface: "#23232a",
  darkCard: "#28293d",
  darkAccent: "#00bcd4",
};

const fonts = {
  heading: "'Poppins', sans-serif",
  body: "'Inter', sans-serif",
};

const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === "dark" ? colors.darkBg : "gray.50",
      color: props.colorMode === "dark" ? "gray.100" : "gray.800",
      fontFamily: fonts.body,
    },
    "*::selection": {
      bg: "brand.500",
      color: "white",
    },
  }),
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: "bold",
      borderRadius: "md",
      _focus: { boxShadow: "0 0 0 2px #2196f3" },
    },
    variants: {
      solid: (props) => ({
        bg: props.colorMode === "dark" ? "brand.500" : "brand.600",
        color: "white",
        _hover: {
          bg: props.colorMode === "dark" ? "brand.400" : "brand.700",
        },
      }),
      outline: (props) => ({
        borderColor: "brand.500",
        color: props.colorMode === "dark" ? "brand.200" : "brand.600",
        _hover: {
          bg: props.colorMode === "dark" ? "brand.800" : "brand.50",
        },
      }),
    },
  },
  Input: {
    variants: {
      filled: (props) => ({
        field: {
          bg: props.colorMode === "dark" ? colors.darkSurface : "gray.100",
          color: props.colorMode === "dark" ? "gray.100" : "gray.800",
          _hover: {
            bg: props.colorMode === "dark" ? colors.darkCard : "gray.200",
          },
        },
      }),
    },
  },
  Card: {
    baseStyle: {
      bg: "darkCard",
      color: "gray.100",
      borderRadius: "lg",
      boxShadow: "md",
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
});

export default theme;