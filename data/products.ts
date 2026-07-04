export interface Review {
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Specs {
  warranty: string;
  materials: string;
  dimensions: string;
}

export interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  originalPrice: number;
  description: string;
  mainImage: string;
  alternateImages: string[];
  rating: number;
  specs: Specs;
  reviews: Review[];
}

export const initialProducts: Product[] = [
  {
    id: 1,
    title: "AeroSound Max",
    category: "Electronics",
    price: 299.99,
    originalPrice: 349.99,
    description: "Experience absolute acoustical tranquility. The AeroSound Max headphones features top-tier hybrid active noise cancellation, custom responsive dynamic audio diaphragms, 45 hours of heavy-duty continuous playback, and ultra-ergonomic protein leather earmuffs.",
    mainImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80",
    alternateImages: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=300&h=300&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&h=300&q=80"
    ],
    rating: 4.8,
    specs: {
      warranty: "2-Year Manufacturer Warranty",
      materials: "Recycled aluminum and memory foam",
      dimensions: "186mm x 165mm x 80mm"
    },
    reviews: [
      { author: "Alex Mercer", rating: 5, date: "2026-06-15", comment: "The soundstage is wide and active noise isolation works perfect on my flights!" },
      { author: "Sarah Connor", rating: 4, date: "2026-06-11", comment: "Comfortable over several continuous hours of work. Strong battery." }
    ]
  },
  {
    id: 2,
    title: "Chronos Mesh Minimalist",
    category: "Fashion",
    price: 149.00,
    originalPrice: 199.00,
    description: "A signature modern look that defines sophistication. Featuring high-precision Swiss movement architecture, dynamic mineral glass lens housing, and a bespoke surgical-grade stainless steel mesh strap that is fully self-adjustable.",
    mainImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&h=600&q=80",
    alternateImages: [
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=300&h=300&q=80"
    ],
    rating: 4.5,
    specs: {
      warranty: "1-Year Warranty",
      materials: "316L Surgical Stainless Steel",
      dimensions: "40mm dial width, 8mm thickness"
    },
    reviews: [
      { author: "Evelyn K.", rating: 5, date: "2026-05-30", comment: "Super sleek look, looks extremely rich under soft warm lighting." }
    ]
  },
  {
    id: 3,
    title: "Lumina Smart Ambient Lamp",
    category: "Home",
    price: 79.50,
    originalPrice: 99.00,
    description: "Transform your surrounding workspace into custom ambient zones. Outfitted with comprehensive smart home hub integrations, dynamic RGB gradient transition animations, custom schedule configurations, and voice assistant trigger arrays.",
    mainImage: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&h=600&q=80",
    alternateImages: [
      "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=300&h=300&q=80"
    ],
    rating: 4.2,
    specs: {
      warranty: "1-Year Smart Protection",
      materials: "Satin-brushed polymers",
      dimensions: "220mm Height, 90mm Diameter"
    },
    reviews: [
      { author: "Daniel H.", rating: 4, date: "2026-06-02", comment: "Syncs instantly with my Google Home configuration. Great visual depth." }
    ]
  },
  {
    id: 4,
    title: "Terra Organic Cotton Hoodie",
    category: "Fashion",
    price: 59.00,
    originalPrice: 75.00,
    description: "Luxurious comfort crafted sustainably. Made using 100% GOTS-certified heavyweight organic cotton. Double-lined cozy hood, robust heavy metallic aglets, and dropped shoulder seam detailing for optimal streetwear silhouette structures.",
    mainImage: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&h=600&q=80",
    alternateImages: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=300&h=300&q=80"
    ],
    rating: 4.7,
    specs: {
      warranty: "Lifetime stitch guarantee",
      materials: "100% Certified Organic Cotton (420 GSM)",
      dimensions: "True-to-size boxy modern cut"
    },
    reviews: [
      { author: "Marcus V.", rating: 5, date: "2026-06-21", comment: "Insanely thick fabric. Feels incredibly high quality compared to fast fashion." }
    ]
  },
  {
    id: 5,
    title: "Zenith Mechanical Keyboard",
    category: "Electronics",
    price: 189.99,
    originalPrice: 220.00,
    description: "Elevate your typing acoustics. Built with dynamic linear hot-swappable switches, genuine premium walnut wood integrated wrist support base, double-shot PBT custom profile keycaps, and custom dynamic multi-zone backlight layouts.",
    mainImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&h=600&q=80",
    alternateImages: [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=300&h=300&q=80"
    ],
    rating: 4.9,
    specs: {
      warranty: "2-Year Limited Warranty",
      materials: "Solid walnut wood housing, PBT keycaps",
      dimensions: "320mm x 115mm x 35mm"
    },
    reviews: [
      { author: "Code Master", rating: 5, date: "2026-06-18", comment: "The stock stabilization and lubing is incredible. Deep acoustic 'thock' sounds." }
    ]
  },
  {
    id: 6,
    title: "Apex Carbon Active Sneakers",
    category: "Fashion",
    price: 120.00,
    originalPrice: 150.00,
    description: "Lighter than air, designed for maximum kinetic response. Integrating custom dual-density EVA high-rebound compound midsoles and fully engineered breathable mesh outer skins that form-fit directly onto your feet contours.",
    mainImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=600&q=80",
    alternateImages: [
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=300&h=300&q=80"
    ],
    rating: 4.6,
    specs: {
      warranty: "6-Month performance guarantee",
      materials: "Woven nylon fibers and Carbon Fiber insole",
      dimensions: "Standard men's and women's scaling"
    },
    reviews: [
      { author: "Runner Girl", rating: 4, date: "2026-04-10", comment: "Very snappy spring action on roads. Great arch support." }
    ]
  },
  {
    id: 7,
    title: "Vibe Insulated Flask",
    category: "Home",
    price: 34.99,
    originalPrice: 42.00,
    description: "Keep cold beverages icy chill for up to 36 hours. Engineered with dual-wall food-grade stainless vacuum technologies. Durable exterior powder-coat finishes that guarantee premium grippy holds and anti-sweat performances.",
    mainImage: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&h=600&q=80",
    alternateImages: [
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=300&h=300&q=80"
    ],
    rating: 4.4,
    specs: {
      warranty: "Lifetime warranty on vacuum leaks",
      materials: "18/8 Pro-Grade Stainless Steel",
      dimensions: "950ml capacity"
    },
    reviews: [
      { author: "Hiker Joe", rating: 5, date: "2026-05-15", comment: "Survived falling down a rocky slope and kept my water ice cold for 2 days!" }
    ]
  },
  {
    id: 8,
    title: "Sentry RFID Leather Wallet",
    category: "Fashion",
    price: 45.00,
    originalPrice: 55.00,
    description: "High security meets minimalist lifestyle profiles. Outfitted with high-potency integrated Faraday cage RFID-blocking fabrics. Holds up to 8 cards and paper currency inside an elegant matte full grain leather construction.",
    mainImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&h=600&q=80",
    alternateImages: [
      "https://images.unsplash.com/photo-1588444839799-beca81d4efe9?auto=format&fit=crop&w=300&h=300&q=80"
    ],
    rating: 4.3,
    specs: {
      warranty: "5-Year Leather degradation warranty",
      materials: "Full grain vegetable-tanned leather",
      dimensions: "100mm x 65mm x 12mm"
    },
    reviews: [
      { author: "Clara S.", rating: 4, date: "2026-06-29", comment: "Holds everything tightly. Minimal pocket bulge. Elegant texture." }
    ]
  }
];
