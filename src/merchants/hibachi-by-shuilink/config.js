// 定义 Hibachi By ShuiLink 商家的前端 booking 配置、价格规则、文案和跳转链接。

const hibachiByShuilinkConfig = {
  slug: "hibachi-by-shuilink",
  preset: "hibachi",

  website: "https://www.shuilink.com/hibachi/index.html",
  thankYouRedirectUrl: "/thank-you/hibachi-by-shuilink",

  business: {
    name: "Hibachi By ShuiLink",
    address: "5301 8th Ave, Brooklyn, NY 11220",
    phone: "631-371-2706",
    email: "hibachi@shuilink.com",
    logoUrl: "/logos/hibachi-by-shuilink-logo-dark.png",
    homeBaseLabel: "Brooklyn, NY",
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
    { id: "steak", label: "Steak", category: "regular", upgradeFee: 0 },
    { id: "shrimp", label: "Shrimp", category: "regular", upgradeFee: 0 },
    { id: "salmon", label: "Salmon", category: "regular", upgradeFee: 0 },
    { id: "tofu", label: "Tofu", category: "regular", upgradeFee: 0 },
    { id: "scallops", label: "Scallops", category: "regular", upgradeFee: 0 },
    { id: "squid", label: "Squid", category: "regular", upgradeFee: 0 },
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
      adult: {
        label: "Adult Protein Selection",
      },
      kid: {
        label: "Kid Protein Selection",
      },
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
      "Distance from our Brooklyn base (5301 8th Ave). First 30 miles included. Beyond 30 miles, a $30 base travel fee applies plus $1 per additional mile.",
  },

  integrations: {
    googleCalendar: {
      enabled: true,
      calendarId:
        "c_ed992f55f916fa3dc3fb434c9792427119482ebe0c50c91ea492337edb8c12e5@group.calendar.google.com",
    },
    googleSheets: {
      enabled: true,
      spreadsheetId: "1JgWe66BEEHWqzQG7PFdBxPoL4Mu-JJmhoL29gGZxoIw",
      sheetName: "Bookings",
    },
    resend: {
      enabled: true,
      fromEmail: "hibachi@shuilink.com",
      merchantNotificationEmail: "hibachi@shuilink.com",
    },
  },

  notifications: {
    fromEmail: "hibachi@shuilink.com",
    merchantEmails: ["hibachi@shuilink.com"],
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
      stripePaymentLink: "https://buy.stripe.com/cNiaEXcSP0JD0FT2c88Zq04",
    },
    tipOptions: [20, 25, 30],
    notes:
      "Deposit is optional. Our team will confirm availability and final pricing before requiring any additional payment.",
  },

  tax: {
    collectTax: false,
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
          "Hibachi By ShuiLink is not responsible for any property damage during the event.",
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
      title: "Book Your Hibachi By ShuiLink Experience",
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
    primaryColor: "#111827",
    cardRadius: "18px",
  },
};

module.exports = hibachiByShuilinkConfig;
