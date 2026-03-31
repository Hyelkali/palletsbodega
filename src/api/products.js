// Product images would typically be stored in a CDN or Firebase Storage
// For now, we'll use placeholder images

const BikeVideo = "https://res.cloudinary.com/devnath/video/upload/v1744635384/Bikee_ldgiv1.mp4"

const products = [
  {
    id: 17,
    name: "Dell Alienware M16 R2 Gaming Laptop",
    price: 1150.0,
    originalPrice: 2499.99,
    description: `
<h2>Dell Alienware M16 R2 Gaming Laptop</h2>

<p>Take your gaming experience to the next level with the power and advanced features of this Dell Alienware PC. This machine can handle every task thrown at it from latest games to intense computer processes plus it has the new Windows AI Copilot function.</p>

<h3>Key Features</h3>
<ul>
  <li><strong>Processor:</strong> 14th Gen Intel Core Ultra 7 155H Processor (up to 5.5 GHz, 16 Cores, 22 CPU Threads)</li>
  <li><strong>Memory:</strong> 32GB RAM (DDR5-5600MHz)</li>
  <li><strong>Storage:</strong> 1TB SSD</li>
  <li><strong>Graphics:</strong> Nvidia GeForce RTX 4070 (8GB)</li>
  <li><strong>Screen:</strong> 16.0" IPS QHD+ Display (2560 X 1600), 300 Nits</li>
  <li><strong>Keyboard:</strong> 4 Zone RGB Keyboard Lightening</li>
  <li><strong>Operating System:</strong> Windows 11 Home</li>
  <li><strong>Camera:</strong> Wide Vision 1080p camera with integrated Microphone</li>
  <li><strong>Color:</strong> Dark Metallic Moon</li>
</ul>

<h3>What's in the box</h3>
<ul>
  <li>Dell Alienware M16 R2 Gaming Laptop</li>
  <li>230W Power Adapter</li>
  <li>Warranty leaflet + Instruction Guide</li>
</ul>

<h3>Specifications</h3>
<ul>
  <li><strong>SKU:</strong> DE168CL80H2TONAFAMZ</li>
  <li><strong>Product Line:</strong> Newmountain</li>
  <li><strong>Model:</strong> Dell Alienware M16 R2 Gaming Laptop</li>
  <li><strong>Production Country:</strong> United States</li>
  <li><strong>Size (L x W x H cm):</strong> 14.33 x 9.82 x 0.93</li>
  <li><strong>Weight (kg):</strong> 4</li>
  <li><strong>Certifications:</strong> Eco Friendly</li>
  <li><strong>Color:</strong> Dark Metallic Moon</li>
  <li><strong>Main Material:</strong> Aluminium</li>
</ul>
`,
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231947.jpg-De6Megp02uze4tJvOBol06FTJy1xZN.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231948.jpg-rYbjJHjAhDd9UHgcnTPrQxRu2oTxB3.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231950.jpg-AerIEi5QJC4LK5nPltEvwqGEru465K.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231949.jpg-u2AoDfTEJsrne5RueTcReSI5VLr7Lq.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231953.jpg-yLMv4Hso3gvkaERbblHRKbTvHdpft7.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231951.jpg-36QGm1tcetQPYdoZRMZNkAiBxzBQEH.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231952.jpg-9zhzIKJD0q75d4E06hNqu3j7atAqHt.jpeg",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: true,
  },
  {
    id: 16,
    name: "Apple iPhone 16 - Ultramarine",
    price: 650.0,
    originalPrice: 799.99,
    description: `
<h2>Apple iPhone 16 - Ultramarine</h2>

<p>BUILT FOR APPLE INTELLIGENCE - Apple Intelligence is the personal intelligence system that helps you write, express yourself, and get things done effortlessly. With groundbreaking privacy protections, it gives you peace of mind that no one else can access your data. Coming fall 2024.</p>

<h3>Key Features</h3>
<ul>
  <li><strong>Manufacturer:</strong> Apple</li>
  <li><strong>Operating System:</strong> iOS 18</li>
  <li><strong>Rear Camera:</strong> 48MP</li>
  <li><strong>Front Camera:</strong> 12MP</li>
  <li><strong>RAM:</strong> 8GB</li>
  <li><strong>Internal Memory:</strong> 256GB</li>
  <li><strong>SIM Type:</strong> Nano SIM</li>
  <li><strong>Screen Size:</strong> 6.1 Inches</li>
  <li><strong>Processor:</strong> Apple A18</li>
  <li><strong>Battery Capacity:</strong> Li-Ion 3,651 mAh, Non-Removable</li>
  <li><strong>Charging:</strong> Wired</li>
</ul>

<h3>Specifications</h3>
<ul>
  <li><strong>SKU:</strong> AP044MP689PE5NAFAMZ</li>
  <li><strong>Product Line:</strong> Just Fones</li>
  <li><strong>Model:</strong> iPhone 16</li>
  <li><strong>Weight (kg):</strong> 0.5</li>
  <li><strong>Color:</strong> Ultramarine</li>
</ul>
`,
images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231964.jpg-jrryYGOIS10Q2JqmaaJ1bVq0hT7TUg.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231959.jpg-BZwJ9gp3Zx4OK8sqPiILDI8zppb8YH.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231966.jpg-EACEjOebHNgTZJYWln5ewEEzXd5Spc.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231969.jpg-1DIhY4tpzezZ407lgxAypl2dJpzqzY.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231967.jpg-5gNB0jUOxnFm1C30QsakOyEDxIRXuj.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231968.jpg-lsTwtUfuJAj6g5KSgZLCSo6yq2Zr6J.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231965.jpg-3BIij1zF8bnZrADdqByjc6NmCEk5hT.jpeg",
],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: true,
  },
  {
    id: 15,
    name: "PlayStation 5 Pro Console",
    price: 500.0,
    originalPrice: 599.99,
    description: `
<h2>PlayStation 5 Pro Console</h2>

<p>The PlayStation 5 Pro (PS5 Pro) is Sony's most advanced gaming console, delivering unparalleled performance and visual fidelity. Equipped with a powerful GPU featuring 67% more compute units and 28% faster memory than the base PS5, it offers up to 45% faster rendering for smoother gameplay.</p>

<p>Experience ultra-high-definition gaming with AI-enhanced resolution through PlayStation® Spectral Super Resolution (PSSR), providing super sharp image clarity on your 4K TV.</p>

<p>Advanced ray tracing technology delivers next-level realism with ray-traced reflections, shadows, and high-quality global illumination. The PS5 Pro supports higher and more consistent frame rates, ensuring silky smooth gameplay on 60Hz and 120Hz displays. With a 2TB ultra-high-speed SSD, it offers ample storage for your game library and reduces load times significantly.</p>

<p>Please note, the PS5 Pro is an all-digital console with no disc drive; a detachable disc drive is available separately.</p>

<h3>Key Features</h3>
<ul>
  <li><strong>Enhanced GPU Performance:</strong> 67% more compute units and 28% faster memory for up to 45% faster rendering.</li>
  <li><strong>PlayStation® Spectral Super Resolution (PSSR):</strong> AI-enhanced resolution for ultra-high-definition play with astonishing detail.</li>
  <li><strong>Advanced Ray Tracing:</strong> Realistic reflections, shadows, and global illumination.</li>
  <li><strong>Optimized Console Performance:</strong> Supports 60Hz and 120Hz displays for higher and more consistent frame rates.</li>
  <li><strong>2TB Ultra-High-Speed SSD:</strong> Ample storage with significantly reduced load times.</li>
  <li><strong>All-Digital Console:</strong> No disc drive included; detachable disc drive available separately.</li>
</ul>

<h3>What's in the box</h3>
<ul>
  <li>PlayStation 5 Pro Console</li>
  <li>DualSense Wireless Controller</li>
  <li>HDMI Cable</li>
  <li>AC Power Cord</li>
  <li>USB Cable</li>
  <li>Quick Start Guide</li>
</ul>

<h3>Specifications</h3>
<ul>
  <li><strong>SKU:</strong> SO521EC6A0W5VNAFAMZ</li>
  <li><strong>Weight (kg):</strong> 3.1</li>
  <li><strong>Color:</strong> White</li>
</ul>
`,
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231970.jpg-XAqXHydzyK4ZOdoTT9fCJ9G70yxXOe.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231973.jpg-L2Vjq1Aa6yVtSPpaFjU9dYChCQPuIV.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231971.jpg-hGXGof2IhbiWmoMlWvAubkVp7tot13.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231972.jpg-Dr18Y7GtYnhGwSskhOFCiZgOrXwbkQ.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231957.jpg-jc8gHj0kxKehjfQ52YGnxRk2VQPKpS.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5767251724401231974.jpg-UyIwjKmGkg099tFF7PpVunRWbnLYDp.jpeg",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: true,
  },
  {
    id: 14,
    name: "RAY-BAN | META WAYFARER",
    price: 250.0,
    originalPrice: 299.99,
    description: `
<h2>RAY-BAN | META WAYFARER</h2>

<p>Experience the iconic Wayfarer design with cutting-edge technology. The Ray-Ban Meta Wayfarer combines classic style with smart features for the modern lifestyle.</p>

<h3>SPECIFICATIONS</h3>
<ul>
  <li><strong>BRIDGE & NOSEPADS:</strong> High Bridge Fit</li>
  <li><strong>FRAME:</strong> Shiny Black</li>
  <li><strong>LENSES:</strong> G-15 Green</li>
</ul>

<h3>SMART FEATURES</h3>

<h4>META AI</h4>
<p>Use your voice to spark your creativity, get information, and control your glasses just by saying "Hey Meta". Ask Meta AI to learn something new, simplify daily tasks, or translate languages on the go. Learn the history of a landmark, translate a sign, or get recipes based on what's in your fridge. It can also scan QR codes, or note and recall information for later.</p>

<h4>AUDIO</h4>
<p>Seamlessly switch between your favorite tracks, calls, and surroundings with discreet, open-ear speakers. They're custom built to deliver extended bass and high maximum volume for a rich listening experience, even in noisy or windy environments. Everything is for your ears only, thanks to improved directional audio.</p>

<h4>CAMERA</h4>
<p>Capture exactly what you see and hear with the new ultra-wide 12 MP camera and five-mic system. Take high-quality photos and immersive videos and share it all to Facebook and Instagram. Toggle between your phone and glasses camera when you videocall or livestream, so that everyone can experience your unique view of the world.</p>

<h3>PACKAGE INCLUDES</h3>
<ul>
  <li>Ray-Ban Meta Wayfarer Sunglasses</li>
  <li>Premium Leather Case</li>
  <li>Cleaning Cloth</li>
  <li>USB-C Charging Cable</li>
  <li>Safety & Warranty Information</li>
  <li>Quick Start Guide</li>
</ul>

<p>Authentic Ray-Ban product with full manufacturer warranty.</p>
`,
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6035180314130760906.jpg-0w9KS57XLoDRSJV9Cr6zuaJ19pQri7.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6035180314130760903.jpg-enSFIMgLLwnMHKj0d6iQZtdgSfkXK0.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6035180314130760908.jpg-Zf4NGdcBeunJA1i3WHuGTo1TDTUWRn.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6035180314130760904.jpg-RxlMHIjJO35rtLkdpCCmdpsjDLu8B3.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6035180314130760907.jpg-cqC3IhraErFGxtOIhbSunwWx06aQ5h.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6035180314130760905.jpg-WamJcxZvpzsWYCS8HcSTUKaUvlCzZt.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6035180314130760902.jpg-P5ioTs8UHVxAB1wV8qVsUrqdwY1KxY.jpeg",
    ],
    soldOut: false,
    sale: true,
    category: "accessories",
    featured: true,
  },
  {
    id: 13,
    name: "Ray-Ban Wayfarer Sunglasses in Green",
    price: 250.0,
    originalPrice: 299.99,
    description:
      "Founded in 1937, the house of Ray Ban has maintained its devotion to quality and technology, which has helped to establish the brand's legacy of authenticity. From designing for Us army pilots, to mass production, Ray Ban has always offered technologically advanced lenses for protecting the eyes while showing off style. Without a doubt, Ray Ban is still the best selling sunglasses brand in the world.",
    images: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6028206957984335480.jpg-GaqVgMNlWTWKZGOmlcG7SF9mmyrL93.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6028206957984335478.jpg-lkOrygN2qQd9GLCt2yQ9F2t63Zq9gz.jpeg",
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6028206957984335479.jpg-TydH3y4OYGidBLC1ZFjnEPKBR2ONhS.jpeg",
    ],
    soldOut: false,
    sale: true,
    category: "accessories",
    featured: false, // Not featured on home page as requested
  },
  {
    id: 12,
    name: "Mercedes-AMG F1® V15 Urban Edition Electric Bike",
    price: 4000.0,
    originalPrice: 4999.99,
    description:
      'Experience the pinnacle of electric biking with this exclusive model, blending high-tech innovation with the luxury and performance you expect from Mercedes-AMG. Perfect for the avid cyclist and motorsport enthusiast alike! At the intersection of function, form, and performance is the Mercedes-AMG F1® V15 Urban Edition, a full-carbon aggressive commuter bike that features custom integrated carbon handlebars and deep section wheels. A limited offering, its livery matches the design of the F1®team\'s race car and embodies its mantra — "All in performance."',
    images: [
      "https://res.cloudinary.com/devnath/image/upload/v1744708150/6048349564328592553_gunxyz.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1744635381/Bike_t4t9jn.png",
      "https://res.cloudinary.com/devnath/image/upload/v1744708150/6048349564328592555_uubcq2.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1744708149/6048349564328592558_ld4c0w.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1744708151/6048349564328592552_xuja2e.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1744708150/6048349564328592554_tl0afa.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1744708150/6048349564328592557_crxnhh.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1744708150/6048349564328592551_nqtewy.jpg",
    ],
    video: BikeVideo,
    soldOut: false,
    sale: true,
    category: "premium",
    featured: true,
  },
  {
    id: 18,
    name: "Magcubic Smart Portable Projector",
    price: 199.99,
    originalPrice: 399.99,
    description: `
<h2>Magcubic Smart Portable Projector</h2>

<p>Enjoy cinema-style projection anywhere with this compact, smart, battery-powered projector. Ideal for movies, gaming, and presentations with up to 1080p resolution and Bluetooth audio support.</p>

<h3>Key Features</h3>
<ul>
  <li><strong>Display:</strong> Up to 1080p Full HD</li>
  <li><strong>Brightness:</strong> 250 ANSI Lumens</li>
  <li><strong>Battery:</strong> Up to 2.5 hours on battery</li>
  <li><strong>Connectivity:</strong> HDMI, USB, Wi-Fi, Bluetooth</li>
  <li><strong>Smart OS:</strong> Built-in Android for streaming apps</li>
  <li><strong>Speakers:</strong> Built-in stereo speakers</li>
</ul>

<h3>In the box</h3>
<ul>
  <li>Magcubic Smart Portable Projector</li>
  <li>Power Adapter</li>
  <li>HDMI Cable</li>
  <li>Remote Control</li>
  <li>User Manual</li>
</ul>
`,
    images: [
      "https://res.cloudinary.com/devnath/image/upload/v1773072766/WhatsApp_Image_2026-03-09_at_4.43.09_PM_kfi7cg.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1773072766/WhatsApp_Image_2026-03-09_at_4.43.08_PM_1_q88slk.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1773072765/WhatsApp_Image_2026-03-09_at_4.43.18_PM_txuntv.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1773072766/WhatsApp_Image_2026-03-09_at_4.43.11_PM_iudljm.jpg",
      "https://res.cloudinary.com/devnath/image/upload/v1773072766/WhatsApp_Image_2026-03-09_at_4.43.13_PM_y5htrs.jpg",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: true,
  },
  {
    id: 19,
    name: "Premium 10-Piece BDSM Bondage Kit – Leather Restraints, Collar, Gag & Silicone Toys Set",
    price: 200.0,
    originalPrice: 250.0,
    description: `
<h2>Premium 10-Piece BDSM Bondage Kit</h2>

<p>Explore deeper intimacy and control with this premium BDSM bondage kit, designed for both beginners and experienced users. This all-in-one set includes high-quality restraints, sensory tools, and body-safe silicone accessories to enhance every experience.</p>

<p>Crafted with durable materials and adjustable fittings, this kit offers comfort, control, and versatility for a wide range of play styles. Perfect for couples looking to explore bondage, restraint, and sensory stimulation in a safe and exciting way.</p>

<h3>Key Features</h3>
<ul>
  <li>Premium Materials: Faux leather, stainless steel hardware, body-safe silicone</li>
  <li>Adjustable Fit: Suitable for most body sizes</li>
  <li>Multi-Function Kit: Combines restraint + stimulation tools</li>
  <li>Beginner Friendly: Easy to use and safe for first-time users</li>
  <li>Discreet & Portable: Easy to store and travel with</li>
</ul>

<h3>Specifications</h3>
<table>
  <tr><th>Feature</th><th>Details</th></tr>
  <tr><td>Material</td><td>PU leather / silicone / metal</td></tr>
  <tr><td>Color</td><td>Black</td></tr>
  <tr><td>Pieces</td><td>10 items</td></tr>
  <tr><td>Power</td><td>Rechargeable (for vibrators)</td></tr>
  <tr><td>Waterproof</td><td>Some components</td></tr>
  <tr><td>Gender</td><td>Unisex</td></tr>
</table>
`,
    images: ["/new.jpeg"],
    soldOut: false,
    sale: false,
    category: "adult",
    featured: true,
  },
  {
    id: 1,
    name: "Auto Clicker for Phone",
    price: 82.99,
    originalPrice: 39.99,
    description:
      "Automate repetitive tasks on your phone with this convenient auto clicker. Perfect for games and applications that require repeated tapping.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/Screenshot_2024-10-31_at_10.23.55_AM.png?v=1730388270?height=400&width=400&text=Auto+Clicker+1",
      "https://www.palletbodega.com/cdn/shop/files/Screenshot_2024-10-31_at_10.23.40_AM.png?v=1730388271?height=400&width=400&text=Auto+Clicker+2",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: false,
  },
  {
    id: 2,
    name: "Drone with Camera Foldable Mini Drone",
    price: 245.99,
    originalPrice: 179.99,
    description:
      "Foldable mini drone for kids and beginners with camera, gesture selfie, one key start, 360° flips, and 1020mAh rechargeable battery. Supports connecting to TV and two players. Perfect birthday gift toy.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/Screenshot2024-11-19at12.14.16PM.png?v=1732040289&width=1066?height=400&width=400&text=Drone+1",
      "https://www.palletbodega.com/cdn/shop/files/Screenshot2024-11-19at12.14.32PM.png?v=1732040289&width=1066?height=400&width=400&text=Drone+2",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: false,
  },
  {
    id: 3,
    name: "Handheld Game Console",
    price: 84.99,
    originalPrice: 49.99,
    description:
      "Portable retro game console with 400 classical FC games and intelligent screen charging case. Relive your childhood with this compact gaming device.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/1_0f57c4e2-92bb-4174-9893-03883ac8ddbf.png?v=1731615681&width=1066",
      "https://www.palletbodega.com/cdn/shop/files/2.png?v=1731615681&width=1066",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: false,
  },
  {
    id: 4,
    name: "Limited Edition Makeup Mystery Boxes",
    price: 89.0,
    originalPrice: null,
    description:
      "Surprise yourself with our limited edition makeup mystery boxes. Each box contains a curated selection of premium makeup products worth much more than the purchase price.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/makeuponly.png?v=1727724881&width=720?height=400&width=400&text=Makeup+Box+1",
      "https://www.palletbodega.com/cdn/shop/files/DSC09378.jpg?v=1727723560&width=720?height=400&width=400&text=Makeup+Box+2",
    ],
    soldOut: false,
    sale: false,
    category: "beauty",
    featured: true,
  },
  {
    id: 5,
    name: "Noise Cancelling Bluetooth Earbuds",
    price: 98.99,
    originalPrice: 89.99,
    description:
      "White noise cancelling bluetooth earbuds with big touch intelligent screen charging case. Enjoy crystal clear audio without distractions.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/51akeWHcI2L.jpg?v=1730388825&width=720?height=400&width=400&text=Earbuds+1",
      "https://www.palletbodega.com/cdn/shop/files/61N0PqzMY7L.jpg?v=1730388825&width=720?height=400&width=400&text=Earbuds+2",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: false,
  },
  {
    id: 6,
    name: "Pallet Bodega -Large Box-",
    price: 189.99,
    originalPrice: null,
    description:
      "Our large mystery box contains a variety of premium products across multiple categories. Each box is carefully curated to ensure maximum value and excitement.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/Large_PIC.png?v=1726955743?height=400&width=400&text=Large+Box+1",
    ],
    soldOut: false,
    sale: false,
    category: "mystery",
    featured: true,
  },
  {
    id: 7,
    name: "Pallet Bodega -Medium Box-",
    price: 137.99,
    originalPrice: null,
    description:
      "Our medium mystery box offers a balanced selection of quality products at a great value. Perfect for those who want to try something new without committing to the large box.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/pallet_bode_med.png?v=1726955400?height=400&width=400&text=Medium+Box+1",
    ],
    soldOut: false,
    sale: false,
    category: "mystery",
    featured: true,
  },
  {
    id: 8,
    name: "Pallet Bodega -Small Box-",
    price: 99.0,
    originalPrice: null,
    description:
      "Our small mystery box is an affordable way to experience the thrill of unboxing surprise products. Great as a gift or a treat for yourself.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/Pallet_bd_small_0debe103-5c59-499f-9275-af1d837bb680.png?v=1726955439&width=533",
    ],
    soldOut: false,
    sale: false,
    category: "mystery",
    featured: true,
  },
  {
    id: 9,
    name: "Portable Wireless Speaker",
    price: 99.99,
    originalPrice: 89.99,
    description:
      "Compact wireless speaker with powerful sound and long battery life. Perfect for outdoor activities, travel, or home use.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/IMG_0272_2.jpg?v=1732582318&width=940?height=400&width=400&text=Speaker+1",
      "https://www.palletbodega.com/cdn/shop/files/1_2.png?v=1732582375&width=940?height=400&width=400&text=Speaker+2",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: false,
  },
  {
    id: 10,
    name: "Power Bank Wireless Charger 10000mAh",
    price: 87.99,
    originalPrice: 59.99,
    description:
      "10000mAh power bank with built-in 3 solar panels for fast charging. This solar charger is perfect for outdoor activities and emergency situations.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/Screenshot2024-11-19at11.21.33AM.png?v=1732037137&width=533?height=400&width=400&text=Power+Bank+1",
      "https://www.palletbodega.com/cdn/shop/files/Screenshot2024-11-19at11.22.22AM.png?v=1732037137&width=533?height=400&width=400&text=Power+Bank+2",
    ],
    soldOut: false,
    sale: true,
    category: "electronics",
    featured: false,
  },
  {
    id: 11,
    name: "Sam's Club Clothing Box (Random Brand Pulls)",
    price: 400.0,
    originalPrice: null,
    description:
      "Premium clothing mystery box featuring random brand pulls from Sam's Club. Each box contains a variety of clothing items from well-known brands at a fraction of the retail price.",
    images: [
      "https://www.palletbodega.com/cdn/shop/files/Export_photo_1.png?v=1728588280&width=990?height=400&width=400&text=Clothing+Box+1",
      "https://www.palletbodega.com/cdn/shop/files/Pallet_Dogea_1.png?v=1728588151&width=360",
    ],
    soldOut: false,
    sale: false,
    category: "clothing",
    featured: true,
  },
]

// API functions remain the same
export const getAllProducts = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  return [...products]
}

export const getProductById = async (id) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  const product = products.find((p) => p.id === Number.parseInt(id))

  if (!product) {
    throw new Error("Product not found")
  }

  return product
}

export const getFeaturedProducts = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  return products.filter((p) => p.featured)
}

export const getProductsByCategory = async (category) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  return products.filter((p) => p.category === category)
}

export const getProductsOnSale = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  return products.filter((p) => p.sale)
}

export const searchProducts = async (query) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (!query || query.trim() === "") {
    return []
  }

  const searchTerm = query.toLowerCase().trim()
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm),
  )
}
