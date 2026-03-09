"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { getFeaturedProducts } from "../api/productService"
import ProductCard from "../components/ProductCard"
import "./Home.css"

// Existing Bike Image
const BikeImg =
  "https://res.cloudinary.com/devnath/image/upload/v1744708150/6048349564328592553_gunxyz.jpg"

// NEW PROJECTOR IMAGES
const ProjectorImg1 =
  "https://res.cloudinary.com/devnath/image/upload/v1773072764/WhatsApp_Image_2026-03-09_at_4.43.18_PM_1_bvsqc1.jpg"

const ProjectorImg2 =
  "https://res.cloudinary.com/devnath/image/upload/v1773072766/WhatsApp_Image_2026-03-09_at_4.43.08_PM_1_q88slk.jpg"

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [showShareTooltip, setShowShareTooltip] = useState(false)

  const navigate = useNavigate()
  const { addToCart } = useCart()

  // Mercedes Bike Product
  const mercedesBike = {
    id: 12,
    name: "Mercedes-AMG F1® V15 Urban Edition Electric Bike",
    price: 4000.0,
    originalPrice: 4999.99,
    description:
      "Experience the pinnacle of electric biking with this exclusive model, blending high-tech innovation with the luxury and performance you expect from Mercedes-AMG.",
    images: [BikeImg],
    soldOut: false,
    sale: true,
    category: "premium",
    featured: true,
  }

  // NEW PROJECTOR PRODUCT
  const projectorProduct = {
    id: 18,
    name: "Magcubic Smart Portable Projector",
    price: 199.99,
    originalPrice: 399.99,
    description:
      "Compact smart projector with HD projection, portable design, and immersive cinematic viewing. Perfect for home cinema, gaming, and presentations.",
    images: [ProjectorImg1, ProjectorImg2],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: true,
  }

  // Sam's Club Product
  const samsClubProduct = {
    id: 11,
    name: "Sam's Club Clothing Box (Random Brand Pulls)",
    price: 400.0,
    originalPrice: null,
    description:
      "Premium clothing mystery box featuring random brand pulls from Sam's Club.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/Export_photo_1.png?v=1728588280&width=990",
      "https://www.palletbodega.com/cdn/shop/files/Pallet_Dogea_1.png?v=1728588151&width=360",
    ],
    soldOut: false,
    sale: false,
    category: "clothing",
    featured: true,
  }

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setIsLoading(true)
        const products = await getFeaturedProducts()
        setFeaturedProducts(products)
      } catch (error) {
        console.error("Error fetching featured products:", error)
        setError("Failed to load products.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  const handleAddToCart = (product) => {
    addToCart(product, quantity)
  }

  const handleBuyNow = (product) => {
    addToCart(product, quantity)
    navigate("/cart")
  }

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
  }

  return (
    <div className="home-page">
      <div className="container">

        {/* MERCEDES BIKE HERO */}
        <div className="hero-product">
          <div className="hero-content">
            <div className="hero-badge">NEW ARRIVAL</div>
            <h1 className="hero-title">{mercedesBike.name}</h1>
            <p className="hero-description">{mercedesBike.description}</p>

            <div className="hero-price">$4,000.00 USD</div>

            <div className="hero-actions">
              <button
                className="hero-button primary"
                onClick={() => navigate("/product/12")}
              >
                View Details
              </button>

              <button
                className="hero-button secondary"
                onClick={() => handleBuyNow(mercedesBike)}
              >
                Buy Now
              </button>
            </div>
          </div>

          <div className="hero-media">
            <img
              src={BikeImg}
              alt="Mercedes AMG Bike"
              className="hero-image"
            />
          </div>
        </div>


        {/* PROJECTOR HERO */}
        <div className="hero-product">
          <div className="hero-content">
            <div className="hero-badge sale">SALE</div>

            <h1 className="hero-title">{projectorProduct.name}</h1>

            <p className="hero-description">
              Portable smart projector for home cinema and entertainment.
            </p>

            <div className="hero-price">$199.99 USD</div>

            <div className="hero-actions">
              <button
                className="hero-button primary"
                onClick={() => navigate("/product/18")}
              >
                View Details
              </button>

              <button
                className="hero-button secondary"
                onClick={() => handleBuyNow(projectorProduct)}
              >
                Buy Now
              </button>
            </div>
          </div>

          <div className="hero-media">
            <img
              src={ProjectorImg1}
              alt="Magcubic Projector"
              className="hero-image"
            />
          </div>
        </div>


        {/* FEATURED PRODUCTS GRID */}
        <div className="products-section">
          <h2 className="section-title">Featured Products</h2>

          <div className="products-grid">
            {isLoading ? (
              [...Array(4)].map((_, index) => (
                <div key={index} className="product-skeleton">
                  <div className="skeleton-image"></div>
                  <div className="skeleton-title"></div>
                  <div className="skeleton-price"></div>
                </div>
              ))
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="no-products-message">
                No featured products available.
              </div>
            )}
          </div>
        </div>


        {/* SAMS CLUB PRODUCT */}
        <div className="featured-product">
          <div className="featured-product-grid">

            <div className="featured-product-image">
              <img
                src="https://www.palletbodega.com/cdn/shop/files/Export_photo_1.png?v=1728588280&width=990"
                alt="Sam's Club Clothing Box"
              />
            </div>

            <div className="featured-product-details">
              <h2 className="featured-product-title">
                Sam's Club Clothing Box
              </h2>

              <div className="featured-product-price">$400.00 USD</div>

              <div className="featured-product-actions">
                <div className="quantity-selector">
                  <button onClick={decreaseQuantity}>-</button>

                  <input
                    type="number"
                    value={quantity}
                    min="1"
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />

                  <button onClick={increaseQuantity}>+</button>
                </div>

                <button
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(samsClubProduct)}
                >
                  Add to cart
                </button>

                <button
                  className="shop-pay-btn"
                  onClick={() => handleBuyNow(samsClubProduct)}
                >
                  Buy Now
                </button>
              </div>

              <Link to="/product/11" className="view-details-link">
                View full details →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Home

// "use client"

// import { useState, useEffect } from "react"
// import { useNavigate, Link } from "react-router-dom"
// import { useCart } from "../context/CartContext"
// import { getFeaturedProducts } from "../api/productService"
// import ProductCard from "../components/ProductCard"
// import "./Home.css"
// // Use the same paths as defined in the products.js file for consistency
// const BikeImg = "https://res.cloudinary.com/devnath/image/upload/v1744708150/6048349564328592553_gunxyz.jpg"


// const Home = () => {
//   const [featuredProducts, setFeaturedProducts] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState("")
//   const [quantity, setQuantity] = useState(1)
//   const [showShareTooltip, setShowShareTooltip] = useState(false)
//   const navigate = useNavigate()
//   const { addToCart } = useCart()

//   // Mercedes AMG bike product data (hardcoded for direct access)
//   const mercedesBike = {
//     id: 12,
//     name: "Mercedes-AMG F1® V15 Urban Edition Electric Bike",
//     price: 4000.0,
//     originalPrice: 4999.99,
//     description:
//       "Experience the pinnacle of electric biking with this exclusive model, blending high-tech innovation with the luxury and performance you expect from Mercedes-AMG.",
//     images: [BikeImg, BikeImg],
//     soldOut: false,
//     sale: true,
//     category: "premium",
//     featured: true,
//   }

//   // Sam's Club product data (hardcoded for direct access)
//   const samsClubProduct = {
//     id: 11,
//     name: "Sam's Club Clothing Box (Random Brand Pulls)",
//     price: 400.0,
//     originalPrice: null,
//     description:
//       "Premium clothing mystery box featuring random brand pulls from Sam's Club. Each box contains a variety of clothing items from well-known brands at a fraction of the retail price.",
//     images: [
//       "https://www.palletbodega.com/cdn/shop/files/Export_photo_1.png?v=1728588280&width=990",
//       "https://www.palletbodega.com/cdn/shop/files/Pallet_Dogea_1.png?v=1728588151&width=360",
//     ],
//     soldOut: false,
//     sale: false,
//     category: "clothing",
//     featured: true,
//   }

//   useEffect(() => {
//     const fetchFeaturedProducts = async () => {
//       try {
//         setIsLoading(true)
//         const products = await getFeaturedProducts()
//         setFeaturedProducts(products)
//       } catch (error) {
//         console.error("Error fetching featured products:", error)
//         setError("Failed to load products. Please try again later.")
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchFeaturedProducts()
//   }, [])

//   const handleViewProduct = (id) => {
//     navigate(`/product/${id}`)
//   }

//   const decreaseQuantity = () => {
//     if (quantity > 1) {
//       setQuantity(quantity - 1)
//     }
//   }

//   const increaseQuantity = () => {
//     setQuantity(quantity + 1)
//   }

//   const handleAddToCart = (product) => {
//     addToCart(product, quantity)
//     // Show a brief confirmation message or toast here if desired
//   }

//   const handleBuyNow = (product) => {
//     addToCart(product, quantity)
//     navigate("/cart")
//   }

//   const handleShare = () => {
//     const productUrl = `${window.location.origin}/product/11`

//     // Use the Web Share API if available
//     if (navigator.share) {
//       navigator
//         .share({
//           title: samsClubProduct.name,
//           text: samsClubProduct.description,
//           url: productUrl,
//         })
//         .catch((err) => {
//           console.error("Error sharing:", err)
//           // Fallback to clipboard copy
//           copyToClipboard(productUrl)
//         })
//     } else {
//       // Fallback for browsers that don't support Web Share API
//       copyToClipboard(productUrl)
//     }
//   }

//   const copyToClipboard = (text) => {
//     navigator.clipboard
//       .writeText(text)
//       .then(() => {
//         setShowShareTooltip(true)
//         setTimeout(() => setShowShareTooltip(false), 2000)
//       })
//       .catch((err) => {
//         console.error("Failed to copy: ", err)
//       })
//   }

//   return (
//     <div className="home-page">
//       <div className="container">
//         {/* Mercedes AMG Featured Product */}
//         <div className="hero-product">
//           <div className="hero-content">
//             <div className="hero-badge">NEW ARRIVAL</div>
//             <h1 className="hero-title">Mercedes-AMG F1® V15 Urban Edition</h1>
//             <p className="hero-description">
//               Experience the pinnacle of electric biking with this exclusive model, blending high-tech innovation with
//               the luxury and performance you expect from Mercedes-AMG.
//             </p>
//             <div className="hero-price">$4,000.00 USD</div>
//             <div className="hero-actions">
//               <button className="hero-button primary" onClick={() => navigate("/product/12")}>
//                 View Details
//               </button>
//               <button
//                 className="hero-button secondary"
//                 onClick={() => {
//                   addToCart(mercedesBike, 1)
//                   navigate("/cart")
//                 }}
//               >
//                 Buy Now
//               </button>
//             </div>
//           </div>
//           <div className="hero-media">
//               {/* <img
//                 src={BikeImg || "/placeholder.svg"}
//                 alt="Mercedes-AMG F1 V15 Urban Edition Electric Bike"
//                 className="hero-image"
//               /> */}
//           </div>
//         </div>

//         {/* Featured Products Section */}
//         <div className="products-section">
//           <h2 className="section-title">Featured Products</h2>
//           <div className="products-grid">
//             {isLoading ? (
//               // Loading skeletons
//               [...Array(4)].map((_, index) => (
//                 <div key={index} className="product-skeleton">
//                   <div className="skeleton-image"></div>
//                   <div className="skeleton-title"></div>
//                   <div className="skeleton-price"></div>
//                 </div>
//               ))
//             ) : error ? (
//               <div className="error-message">{error}</div>
//             ) : featuredProducts && featuredProducts.length > 0 ? (
//               // Product cards
//               featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)
//             ) : (
//               <div className="no-products-message">No featured products available at the moment.</div>
//             )}
//           </div>
//         </div>

//         {/* Sam's Club Featured Product */}
//         <div className="featured-product">
//           <div className="featured-product-grid">
//             <div className="featured-product-image">
//               <img
//                 src="https://www.palletbodega.com/cdn/shop/files/Export_photo_1.png?v=1728588280&width=990"
//                 alt="Sam's Club Clothing Box"
//                 onError={(e) => {
//                   e.target.onerror = null
//                   e.target.src = "/placeholder.jpg"
//                 }}
//               />
//             </div>

//             <div className="featured-product-details">
//               <div className="featured-product-header">
//                 <span className="featured-product-vendor">PALLET BODEGA</span>
//                 <h2 className="featured-product-title">Sam's Club Clothing Box (Random Brand Pulls)</h2>
//               </div>

//               <div className="featured-product-price">
//                 <span>$400.00 USD</span>
//               </div>

//               <div className="featured-product-actions">
//                 <div className="quantity-selector">
//                   <button className="quantity-btn decrease" onClick={decreaseQuantity}>
//                     -
//                   </button>
//                   <input
//                     type="number"
//                     value={quantity}
//                     onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
//                     min="1"
//                     className="quantity-input"
//                   />
//                   <button className="quantity-btn increase" onClick={increaseQuantity}>
//                     +
//                   </button>
//                 </div>

//                 <button className="add-to-cart-btn" onClick={() => handleAddToCart(samsClubProduct)}>
//                   Add to cart
//                 </button>

//                 <button className="shop-pay-btn" onClick={() => handleBuyNow(samsClubProduct)}>
//                   Buy with <span className="shop-pay-text">Shop</span>
//                   <span className="shop-pay-text-bold">Pay</span>
//                 </button>

//                 <button className="more-payment-options" onClick={() => handleBuyNow(samsClubProduct)}>
//                   More payment options
//                 </button>
//               </div>

//               <div className="featured-product-footer">
//                 <div className="share-button-container">
//                   <button className="share-btn" onClick={handleShare}>
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       width="16"
//                       height="16"
//                       viewBox="0 0 24 24"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     >
//                       <circle cx="18" cy="5" r="3"></circle>
//                       <circle cx="6" cy="12" r="3"></circle>
//                       <circle cx="18" cy="19" r="3"></circle>
//                       <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
//                       <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
//                     </svg>
//                     Share
//                   </button>
//                   {showShareTooltip && <div className="share-tooltip">Link copied to clipboard!</div>}
//                 </div>

//                 <Link to="/product/11" className="view-details-link">
//                   View full details →
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Home
