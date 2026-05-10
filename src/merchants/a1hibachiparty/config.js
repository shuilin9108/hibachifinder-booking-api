// A1 Hibachi Party 商家配置，控制该商家的 booking、价格、页面、通知、支付和集成规则。

const a1hibachipartyConfig = {
  slug: "a1hibachiparty",
  preset: "hibachi",

  website: "https://www.a1hibachiparty.com",
  thankYouRedirectUrl: "https://www.a1hibachiparty.com/thank-you.html",

  business: {
    name: "A1 Hibachi Party",
    address: "5102 7th Ave, Brooklyn, NY 11220",
    phone: "(646) 358-2225 / (646) 204-6895",
    email: "a1hibachiparty@gmail.com",
    website: "https://www.a1hibachiparty.com",
    logoUrl: "/logos/a1hibachiparty.png",
    homeBaseLabel: "Brooklyn, NY",
  },

  branding: {
    businessName: "A1 Hibachi Party",
    invoiceTitle: "A1 Hibachi Party Invoice",
    emailSenderName: "A1 Hibachi Party",
    logoUrl: "/logos/a1hibachiparty.png",
    primaryColor: "#dc2626",
  },

  notifications: {
    fromEmail: "ShuiLink Booking <booking@shuilink.com>",
    merchantEmails: [
      "a1hibachiparty@gmail.com",
      "shuilin9108@gmail.com",
      "Yuangao202121@gmail.com",
    ],
  },

  payments: {
    stripeDepositLink: "https://buy.stripe.com/8x2eVd00q61PgiUg1WfjG01",
  },

  integrations: {
    resend: {
      enabled: true,
      fromEmail: "ShuiLink Booking <booking@shuilink.com>",
      merchantNotificationEmail: "a1hibachiparty@gmail.com",
    },

googleSheets: {
  enabled: true,
  spreadsheetId: "1MydHE6XhZZ5z6irda54fTkPxLCQs7Yg_QN9QVzhNTwk",
  sheetName: "Bookings",
  webhookUrl: process.env.A1HIBACHIPARTY_GOOGLE_SHEET_WEBHOOK_URL || "",
},

googleCalendar: {
  enabled: true,
  calendarId:
    "c_b5a5d74b77f681b0831c3091e61b5fb009f8941e4ad3addcdc08f915f5ab90d0@group.calendar.google.com",
  calendarUrl:
    "https://calendar.google.com/calendar/u/0/r?cid=c_b5a5d74b77f681b0831c3091e61b5fb009f8941e4ad3addcdc08f915f5ab90d0@group.calendar.google.com",
  webhookUrl: "",
},

    stripe: {
      enabled: true,
      depositPaymentLink: "https://buy.stripe.com/8x2eVd00q61PgiUg1WfjG01",
    },
  },

  serviceCoverage: {
    model: "travel_time_radius",
    originAddress: "5102 7th Ave, Brooklyn, NY 11220",
    maxDriveTimeMinutes: 180,
    supportsOutOfAreaInquiry: true,
    notes:
      "Service is generally available within about 3 hours of NYC depending on traffic and event size.",
  },

  seoLocations: {
    featured: [
      "Manhattan, NY",
      "Brooklyn, NY",
      "Queens, NY",
      "Staten Island, NY",
      "White Plains, NY",
      "Scarsdale, NY",
      "Stamford, CT",
      "Greenwich, CT",
      "Jersey City, NJ",
      "Short Hills, NJ",
      "Philadelphia, PA",
      "Gladwyne, PA",
    ],
    purpose:
      "High-income luxury hibachi catering SEO targeting across NYC, NY, NJ, CT, and PA",
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
    { id: "extra-chicken", label: "Extra Chicken", proteinId: "chicken", unitPrice: 10 },
    { id: "extra-steak", label: "Extra Steak", proteinId: "steak", unitPrice: 10 },
    { id: "extra-shrimp", label: "Extra Shrimp", proteinId: "shrimp", unitPrice: 10 },
    { id: "extra-salmon", label: "Extra Salmon", proteinId: "salmon", unitPrice: 10 },
    { id: "extra-scallops", label: "Extra Scallops", proteinId: "scallops", unitPrice: 10 },
    { id: "extra-filet-mignon", label: "Extra Filet Mignon", proteinId: "filet-mignon", unitPrice: 15 },
    { id: "extra-lobster-tail", label: "Extra Lobster Tail", proteinId: "lobster-tail", unitPrice: 20 },
  ],

  addOns: [
    {
      id: "extra-chicken",
      label: "Extra Chicken",
      unitPrice: 10,
      unitLabel: "each",
    },
    {
      id: "extra-steak",
      label: "Extra Steak",
      unitPrice: 10,
      unitLabel: "each",
    },
    {
      id: "extra-shrimp",
      label: "Extra Shrimp",
      unitPrice: 10,
      unitLabel: "each",
    },
    {
      id: "extra-scallops",
      label: "Extra Scallops",
      unitPrice: 10,
      unitLabel: "each",
    },
    {
      id: "extra-salmon",
      label: "Extra Salmon",
      unitPrice: 10,
      unitLabel: "each",
    },
    { id: "extra-tofu", label: "Extra Tofu", unitPrice: 10, unitLabel: "each" },
    {
      id: "extra-filet-mignon",
      label: "Extra Filet Mignon",
      unitPrice: 15,
      unitLabel: "each",
    },
    {
      id: "extra-lobster-tail",
      label: "Extra Lobster Tail",
      unitPrice: 15,
      unitLabel: "each",
    },
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
      stripePaymentLink: "https://buy.stripe.com/8x2eVd00q61PgiUg1WfjG01",
    },
    tipOptions: [20, 25, 30],
    notes:
      "Deposit is optional. Final availability and pricing will be confirmed by our team.",
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
          "A1 Hibachi Party is not responsible for any property damage during the event.",
        required: true,
      },
      {
        id: "travel-fee",
        label:
          "I understand that a travel fee may apply depending on event location.",
        required: true,
      },
    ],
  },

  booking: {
    addressRequired: true,
    notesEnabled: true,
    emailOptional: true,
    minimumOrderTotal: 500,
    minimumOrderMessage: "Minimum booking subtotal is $500 before submitting.",
  },

  content: {
    bookingPage: {
      title: "Book Your A1 Hibachi Party Experience",
      subtitle:
        "Private outdoor hibachi catering for birthdays, backyard parties, family events, and unforgettable celebrations.",
      submitLabel: "Request My Booking",
      depositHint:
        "Optional $50 deposit available for faster priority scheduling.",
      notice:
        "Final pricing may vary based on travel, guest count, add-ons, taxes, and selected upgrades.",
    },
    thankYouPage: {
      title: "Thank you — your booking request has been submitted.",
      subtitle:
        "Our team will review your request and contact you shortly to confirm availability and final details.",
    },
  },

theme: {
  primaryColor: "#ef4444",
  secondaryColor: "#050505",
  accentColor: "#ff7a00",

  backgroundColor: "#fff7f2",
  cardBackground: "#ffffff",

  textColor: "#111111",
  mutedTextColor: "#6b7280",

  borderRadius: "22px",
  cardRadius: "22px",
},
};

module.exports = a1hibachipartyConfig;
