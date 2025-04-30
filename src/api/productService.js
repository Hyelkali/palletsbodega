// src/api/productService.js

import { getAllProducts } from "./products"

export const getFeaturedProducts = async () => {
  try {
    const allProducts = await getAllProducts()
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    return allProducts.filter((p) => p.featured)
  } catch (error) {
    console.error("Error fetching featured products:", error)
    throw error
  }
}
