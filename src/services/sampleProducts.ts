import { ExtractedProduct } from '../types/extension';

export interface SampleScenario {
  id: string;
  name: string;
  expectedRisk: 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' | 'VERY HIGH RISK';
  description: string;
  product: ExtractedProduct;
}

export const SAMPLE_PRODUCTS: SampleScenario[] = [
  {
    id: 'headphones-official',
    name: 'Sony WH-1000XM5 ANC Headphones (Verified Flagship Store)',
    expectedRisk: 'LOW RISK',
    description: 'Realistic authentic retail item with verified merchant, thousands of balanced reviews, and official manufacturer warranty.',
    product: {
      url: 'https://authorized-electronics.com/dp/B09XS7JWHH',
      domain: 'authorized-electronics.com',
      title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones - Black',
      currentPrice: 28990,
      originalPrice: 34990,
      currency: '₹',
      discountPercent: 17,
      isDiscountCalculated: true,
      priceUnavailable: false,
      rating: 4.6,
      reviewCount: 4820,
      reviews: [
        { author: 'Karthik N.', rating: 5, text: 'Superb noise cancellation during flights. Sound signature is neutral and battery easily lasts 30 hours.', verifiedPurchase: true },
        { author: 'Meera R.', rating: 4, text: 'Comfort is top tier for long meetings. Touch sensor controls can be slightly sensitive in cold weather.', verifiedPurchase: true },
        { author: 'Dev P.', rating: 5, text: 'Replaced my XM3 with this. Multi-point connection switches seamlessly between laptop and phone.', verifiedPurchase: true }
      ],
      seller: {
        name: 'Official Sony Authorized Direct Retail Pvt Ltd',
        rating: 4.8,
        reviewsCount: 38400,
        tenure: '7+ years',
        businessAddress: 'Cyber City, Sector 24, Gurugram, India',
        isVerified: true
      },
      policies: {
        returnAvailable: true,
        returnWindowDays: 14,
        refundPolicyText: '14-Day Free Replacement & Refund for defective units',
        warrantyText: '1-Year Sony Official Domestic Warranty',
        replacementAvailable: true
      },
      description: 'Equipped with two processors and 8 microphones for unprecedented noise cancellation. Auto NC Optimizer automatically optimizes sound based on wearing conditions and environment. Industry-leading call quality with 4 beamforming microphones.',
      specifications: {
        'Driver Unit': '30mm, dome type (CCAW Voice coil)',
        'Frequency Response': '4 Hz - 40,000 Hz',
        'Battery Life': 'Max. 30 hrs (NC ON)',
        'Bluetooth': 'v5.2, LDAC, AAC, SBC'
      },
      extractedVia: 'json-ld',
      missingFields: []
    }
  },
  {
    id: 'charger-scam',
    name: '“Never-Ending Free Power” 100W Solar Pocket Pod (High Risk)',
    expectedRisk: 'VERY HIGH RISK',
    description: 'Extreme 94% markdown, unverified seller, absolute pseudoscientific claims, and zero return policy.',
    product: {
      url: 'https://flash-deal-blaster.xyz/products/quantum-solar-pocket',
      domain: 'flash-deal-blaster.xyz',
      title: 'QuantumSolar 100W Miracle Pocket Power Station - Never Pay for Electricity Again!',
      currentPrice: 399,
      originalPrice: 6999,
      currency: '₹',
      discountPercent: 94,
      isDiscountCalculated: true,
      priceUnavailable: false,
      rating: 5.0,
      reviewCount: 4,
      reviews: [
        { author: 'John D.', rating: 5, text: 'Great device quality is super nice power is magical!' },
        { author: 'Mike R.', rating: 5, text: 'Great device quality is super nice power is miracle!' },
        { author: 'Sarah T.', rating: 5, text: 'Super amazing charge very nice recommend buy fast!' }
      ],
      seller: {
        name: 'QuickDrop Logistics Outlet',
        rating: 2.4,
        reviewsCount: 12,
        isVerified: false
      },
      policies: {
        returnAvailable: false,
        refundPolicyText: 'Final Sale - Absolutely no returns or refunds once dispatched',
        warrantyText: undefined
      },
      description: 'Miracle quantum generator banned by electric utilities! 100% cure for your power bills. Guaranteed overnight free infinite electricity anywhere in the world. Secret military technology revealed to the public.',
      specifications: {},
      extractedVia: 'selectors',
      missingFields: ['Seller rating', 'Return policy', 'Specifications']
    }
  },
  {
    id: 'smartwatch-moderate',
    name: 'ProFit Active Smartwatch with Heart Rate (Moderate Risk)',
    expectedRisk: 'MODERATE RISK',
    description: 'Promotional 65% markdown from a third-party seller with formulaic reviews, but valid 7-day return policy.',
    product: {
      url: 'https://trendygadgets-deal.in/fit-smartwatch-v2',
      domain: 'trendygadgets-deal.in',
      title: 'ProFit Active Smartwatch with SpO2, Heart Rate, Bluetooth Calling & 100 Sports Modes',
      currentPrice: 1499,
      originalPrice: 4299,
      currency: '₹',
      discountPercent: 65,
      isDiscountCalculated: true,
      priceUnavailable: false,
      rating: 4.2,
      reviewCount: 34,
      reviews: [
        { author: 'Amit S.', rating: 5, text: 'Very good watch nice display and battery is good.' },
        { author: 'Rohan V.', rating: 5, text: 'Very good watch nice display and battery is super.' },
        { author: 'Pooja K.', rating: 4, text: 'Step tracking is decent, calling works fine indoors.' }
      ],
      seller: {
        name: 'SmartTrend Enterprise',
        rating: 3.6,
        reviewsCount: 95,
        isVerified: false
      },
      policies: {
        returnAvailable: true,
        returnWindowDays: 7,
        refundPolicyText: '7 Days Return for transit damage or defective units',
        warrantyText: '3 Months Seller Warranty'
      },
      description: 'Stay connected on the go with the ProFit Active Smartwatch. Featuring 1.85 inch HD display, 24/7 continuous health monitoring, custom watch faces, and water resistant IP68 casing.',
      specifications: {
        'Display': '1.85 inch TFT LCD',
        'Water Resistance': 'IP68',
        'Battery Life': 'Up to 5 Days'
      },
      extractedVia: 'meta-tags',
      missingFields: ['Verified seller credentials']
    }
  }
];
