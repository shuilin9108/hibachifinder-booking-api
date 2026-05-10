// Kobe Hibachi Catering 商家配置，控制该商家的 booking、价格、页面、通知、支付和集成规则。

const kobeConfig = {
  slug: "kobe",
  preset: "hibachi",

  website: "https://www.kobehibachicatering.com",
  thankYouRedirectUrl: "https://www.kobehibachicatering.com/thank-you/",

  business: {
    name: "Kobe Hibachi Catering",
    address: "5301 8th Ave, Brooklyn, NY 11220",
    phone: "(347) 793-6589",
    email: "kobehibachicatering@gmail.com",
    website: "https://www.kobehibachicatering.com",
    logoUrl: "/logos/kobe.png",
    homeBaseLabel: "Brooklyn, NY",
  },

  branding: {
    businessName: "Kobe Hibachi Catering",
    invoiceTitle: "Kobe Hibachi Catering Invoice",
    emailSenderName: "Kobe Hibachi Catering",
    logoUrl: "/logos/kobe.png",
    primaryColor: "#111827",
  },

  notifications: {
    fromEmail: "ShuiLink Booking <booking@shuilink.com>",
    merchantEmails: [
      "kobehibachicatering@gmail.com",
      "shuilin9108@gmail.com",
      "Zjxinnn@gmail.com",
      "jasonzheng2016@gmail.com",
    ],
  },

  payments: {
    stripeDepositLink: "https://buy.stripe.com/9B6eVeabl5qXfbQ85Y2kw00",
  },

  integrations: {
    resend: {
      enabled: true,
      fromEmail: "ShuiLink Booking <booking@shuilink.com>",
      merchantNotificationEmail: "kobehibachicatering@gmail.com",
    },

googleSheets: {
  enabled: true,
  spreadsheetId: "11BxhSfPYJ9genpsAxBvpiaLgTXGKvgpnYD-B_bSzEhk",
  sheetName: "Bookings",
  webhookUrl: process.env.KOBE_GOOGLE_SHEET_WEBHOOK_URL || "",
},

googleCalendar: {
  enabled: true,
  calendarId:
    "c_94fcff40fa42b40823b0b8e330c0886f641a2191f559b5379cbde463cdf24084@group.calendar.google.com",
  calendarUrl:
    "https://calendar.google.com/calendar/u/0/r?cid=c_94fcff40fa42b40823b0b8e330c0886f641a2191f559b5379cbde463cdf24084@group.calendar.google.com",
  webhookUrl: "",
},

    stripe: {
      enabled: true,
      depositPaymentLink: "https://buy.stripe.com/9B6eVeabl5qXfbQ85Y2kw00",
    },
  },

  serviceCoverage: {
    model: "travel_time_radius",
    originAddress: "5301 8th Ave, Brooklyn, NY 11220",
    maxDriveTimeMinutes: 180,
    supportsOutOfAreaInquiry: true,
    notes:
      "Service is generally available within about 3 hours of NYC depending on date, traffic, and event size.",
  },

  seoLocations: {
    featured: [
      "Brooklyn, NY",
      "Manhattan, NY",
      "Queens, NY",
      "Staten Island, NY",
      "Jersey City, NJ",
      "Hoboken, NJ",
      "Fort Lee, NJ",
      "Edgewater, NJ",
      "Great Neck, NY",
      "Greenwich, CT",
      "Stamford, CT",
      "Scarsdale, NY",
      "White Plains, NY",
    ],
    purpose: "SEO and marketing visibility",
  },

  businessHours: {
    timezone: "America/New_York",
    slotIntervalMinutes: 30,
    weeklySchedule: {
      sunday: { isOpen: true, open: "10:00", close: "22:00" },
      monday: { isOpen: true, open: "10:00", close: "22:00" },
      tuesday: { isOpen: true, open: "10:00", close: "22:00" },
      wednesday: { isOpen: true, open: "10:00", close: "22:00" },
      thursday: { isOpen: true, open: "10:00", close: "22:00" },
      friday: { isOpen: true, open: "10:00", close: "22:00" },
      saturday: { isOpen: true, open: "10:00", close: "22:00" },
    },
  },

  proteinCatalog: [
    { id: "chicken", label: "Chicken", category: "regular", upgradeFee: 0 },
    { id: "shrimp", label: "Shrimp", category: "regular", upgradeFee: 0 },
    { id: "steak", label: "Steak", category: "regular", upgradeFee: 0 },
    { id: "salmon", label: "Salmon", category: "regular", upgradeFee: 0 },
    { id: "tofu", label: "Tofu", category: "regular", upgradeFee: 0 },
    { id: "scallops", label: "Scallops", category: "regular", upgradeFee: 0 },
    {
      id: "filet-mignon",
      label: "Filet Mignon",
      category: "premium",
      upgradeFee: 5,
    },
    {
      id: "lobster-tail",
      label: "Lobster Tail",
      category: "premium",
      upgradeFee: 10,
    },
  ],

  proteinSelection: {
    enabled: true,
    groups: {
      adult: { label: "Adult Protein Selection" },
      kid: { label: "Kid Protein Selection" },
    },
    allowDeferredSelection: true,
  },

  packages: [
    {
      id: "two-protein",
      name: "2-Protein Package",
      pricingModel: "per_person",
      adultPrice: 50,
      kidPrice: 30,
      rules: {
        proteinsIncludedPerGuest: 2,
        minGuests: 10,
        maxGuests: 49,
      },
    },
    {
      id: "three-protein",
      name: "3-Protein Package",
      pricingModel: "per_person",
      adultPrice: 60,
      kidPrice: 40,
      rules: {
        proteinsIncludedPerGuest: 3,
        minGuests: 10,
        maxGuests: 49,
      },
    },
    {
      id: "large-party-two-protein",
      name: "Large Party 2-Protein Package",
      pricingModel: "per_person",
      adultPrice: 30,
      kidPrice: 20,
      rules: {
        proteinsIncludedPerGuest: 2,
        minGuests: 50,
        maxGuests: null,
      },
    },
  ],


  extraProteinCatalog: [
  ],

  addOns: [
    {
      id: "fried-rice",
      label: "Fried Rice",
      unitPrice: 5,
      unitLabel: "order",
    },
    {
      id: "stir-fried-noodles",
      label: "Fried Noodles",
      unitPrice: 5,
      unitLabel: "order",
    },
    {
      id: "edamame",
      label: "Edamame",
      unitPrice: 5,
      unitLabel: "order",
    },
    {
      id: "gyoza",
      label: "Gyoza (6 pieces)",
      unitPrice: 8,
      unitLabel: "order",
    },
  ],

  travelFee: {
    model: "distance_threshold_plus_base_and_per_mile",
    freeMiles: 30,
    baseFeeOverFreeLimit: 30,
    pricePerMileOverFreeLimit: 1,
    minimumFee: 0,
    inputLabel: "Estimated Travel Distance (miles) *",
    inputPlaceholder: "Enter miles",
    helperText:
      "First 30 miles included. After 30 miles, a $30 travel fee applies plus $1 per additional mile.",
  },

  payment: {
    depositMode: "optional",
    optionalDeposit: {
      enabled: true,
      type: "fixed",
      value: 50,
      label: "Optional $50 Deposit",
      incentive:
        "Pay $50 now to secure your spot faster and get priority scheduling.",
      stripePaymentLink: "https://buy.stripe.com/9B6eVeabl5qXfbQ85Y2kw00",
    },
    tipOptions: [20, 25, 30],
    notes:
      "Deposit is optional. Our team will confirm availability and final pricing before requiring any additional payment.",
  },

  tax: {
    collectTax: true,
    model: "destination_based_sales_tax",
    fallbackRates: {
      nyStateBaseRate: 0.04,
      nycCombinedRate: 0.08875,
    },
    notes: "Tax handling should be based on destination/address jurisdiction.",
  },

  promotions: {
    allowStacking: false,

    promoCodeField: {
      enabled: true,
      label: "Promo Code (Optional)",
      placeholder: "Enter promo code",
      normalize: "lowercase",
    },

    birthdayPromo: {
      enabled: true,
      id: "birthday-free-meal",
      type: "birthday_free_if_order_over_threshold",
      label: "FREE birthday guest meal (optional)",
      descriptionLines: [
        "Add your birthday to see if you qualify",
        "Valid within ±7 days of the event",
        "Order must be over $800.00",
        "Valid ID verification required",
      ],
      orderThreshold: 800,
      birthdayWindowDays: 7,
      appliesTo: "one_adult_meal",
      combinable: false,
    },

    codes: [
      {
        code: "welcome50",
        type: "flat_amount",
        amountOff: 50,
        combinable: false,
        active: true,
        caseSensitive: false,
        label: "Welcome $50 Off",
      },
    ],
  },

  sharedFields: {
    heardAboutEnabled: true,
    specialRequestsEnabled: true,
    allergiesEnabled: true,
    allergiesOptions: [
      "No known allergies",
      "Shellfish",
      "Peanuts",
      "Tree Nuts",
      "Dairy",
      "Eggs",
      "Soy",
      "Gluten",
      "Sesame",
      "Fish",
      "Other",
    ],
  },

  antiSpam: {
    enabled: true,
    challenges: [
      {
        id: "sum-1",
        question: "What is 2 + 7?",
        acceptedAnswers: ["9", "nine"],
      },
      {
        id: "sum-2",
        question: "What is 3 + 6?",
        acceptedAnswers: ["9", "nine"],
      },
    ],
  },

  termsAndAgreements: {
    title: "Terms & Agreements",
    items: [
      {
        id: "property-damage",
        label:
          "Kobe Hibachi Catering is not responsible for any property damage during the event.",
        required: true,
      },
      {
        id: "travel-fee",
        label:
          "I understand that a travel fee may apply based on event location.",
        required: true,
      },
    ],
  },

  booking: {
    addressRequired: true,
    notesEnabled: true,
    emailOptional: true,
    minimumOrderTotal: 500,
    minimumOrderMessage:
      "Minimum booking total is $500. Please add guests, upgrade package, or add-ons before submitting.",
  },

  content: {
    bookingPage: {
      title: "Book Your Kobe Hibachi Experience",
      subtitle:
        "Private hibachi catering across NYC and surrounding areas, with service generally available within about 3 hours of New York City.",
      submitLabel: "Request My Booking",
      depositHint:
        "A $50 optional deposit can help secure your spot faster, but it is not required to submit a request.",
      notice:
        "Final pricing may be adjusted based on travel distance, guest count, package rules, add-ons, promotions, and any applicable tax.",
    },

    thankYouPage: {
      title: "Thank you — your booking request has been submitted.",
      subtitle:
        "Our team will review your details and reach out shortly to confirm availability, pricing, and any optional deposit or final payment details.",
    },
  },

theme: {
  primaryColor: "#dc2626",
  secondaryColor: "#111111",
  accentColor: "#f97316",

  backgroundColor: "#fff7f5",
  cardBackground: "#ffffff",

  textColor: "#111111",
  mutedTextColor: "#6b7280",

  borderRadius: "22px",
  cardRadius: "22px",
},
};

module.exports = kobeConfig;
