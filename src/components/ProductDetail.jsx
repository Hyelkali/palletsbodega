"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getProductById } from "../api/products"
import { useCart } from "../context/CartContext"
import "./ProductDetail.css"

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [addedToCart, setAddedToCart] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const productInfoRef = useRef(null)

  // Add meta viewport tag to prevent zooming
  useEffect(() => {
    // Check if the viewport meta tag exists
    let viewportMeta = document.querySelector('meta[name="viewport"]')

    // If it doesn't exist, create it
    if (!viewportMeta) {
      viewportMeta = document.createElement("meta")
      viewportMeta.name = "viewport"
      document.head.appendChild(viewportMeta)
    }

    // Set the content to prevent user scaling/zooming
    viewportMeta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"

    // Cleanup function to restore original viewport settings
    return () => {
      viewportMeta.content = "width=device-width, initial-scale=1.0"
    }
  }, [])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const data = await getProductById(Number.parseInt(id))
        setProduct(data)
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Product not found or failed to load.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()

    // Reset scroll position when product changes
    if (productInfoRef.current) {
      productInfoRef.current.scrollTop = 0
    }
  }, [id])

  const handleQuantityChange = (e) => {
    const value = Number.parseInt(e.target.value)
    if (value > 0) {
      setQuantity(value)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity)
      setAddedToCart(true)

      // Reset the "Added to cart" message after 3 seconds
      setTimeout(() => {
        setAddedToCart(false)
      }, 3000)
    }
  }

  const nextImage = () => {
    if (product && product.images) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product && product.images) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + product.images.length) % product.images.length)
    }
  }

  const selectImage = (index) => {
    setCurrentImageIndex(index)
  }

  if (isLoading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="product-detail-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-price"></div>
              <div className="skeleton-description"></div>
              <div className="skeleton-button"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="product-error">
            <h2>{error || "Product not found"}</h2>
            <button onClick={() => navigate("/catalog")} className="back-button">
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="product-detail-page">
      <div className="container" style={{ padding: "0 10px", maxWidth: "100%" }}>
        <div className="product-detail">
          <div className="product-images" style={{ width: "100%", margin: "0 auto" }}>
            <div
              className="main-image"
              style={{ width: "100%", display: "flex", justifyContent: "center", position: "relative" }}
            >
              <button className="image-nav prev" onClick={prevImage} aria-label="Previous image">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <img
                src={product.images[currentImageIndex] || "/placeholder.svg?height=600&width=600"}
                alt={product.name}
                style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }}
              />
              <button className="image-nav next" onClick={nextImage} aria-label="Next image">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              {product.soldOut && <span className="product-badge sold-out">Sold out</span>}
              {product.sale && <span className="product-badge sale">Sale</span>}
            </div>

            {/* Thumbnail navigation for products with multiple images */}
            {product.images.length > 1 && (
              <div
                className="product-thumbnails"
                style={{
                  display: "flex",
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  gap: "8px",
                  padding: "10px 0",
                  justifyContent: "center",
                }}
              >
                {product.images.map((img, index) => (
                  <img
                    key={index}
                    src={img || "/placeholder.svg"}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className={`image-thumbnail ${currentImageIndex === index ? "active" : ""}`}
                    onClick={() => selectImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-info" ref={productInfoRef}>
            <h1 className="product-name">{product.name}</h1>

            <div className="product-price">
              {product.originalPrice && product.originalPrice > product.price ? (
                <>
                  <span className="price-sale">${product.price.toFixed(2)} USD</span>
                  <span className="price-original">${product.originalPrice.toFixed(2)} USD</span>
                </>
              ) : (
                <span className="price-regular">${product.price.toFixed(2)} USD</span>
              )}
            </div>

            <div className="product-description" dangerouslySetInnerHTML={{ __html: product.description }}></div>

            <div className="product-actions">
              <div className="quantity-selector">
                <button className="quantity-btn decrease" onClick={decreaseQuantity} disabled={product.soldOut}>
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                  className="quantity-input"
                  disabled={product.soldOut}
                />
                <button className="quantity-btn increase" onClick={increaseQuantity} disabled={product.soldOut}>
                  +
                </button>
              </div>

              <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={product.soldOut}>
                {product.soldOut ? "Sold Out" : "Add to Cart"}
              </button>

              {addedToCart && (
                <div className="added-to-cart">
                  ✓ Added to cart! <button onClick={() => navigate("/cart")}>View Cart</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
