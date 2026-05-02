// 定义 HibachiNearby 商家的后端 booking 配置、价格规则、通知、支付和业务规则。

const hibachiNearbyConfig = {
  slug: "hibachinearby",
  preset: "hibachi",

  website: "https://hibachinearby.com",
  thankYouRedirectUrl: "https://hibachinearby.com/thank-you/",

  business: {
    name: "HibachiNearby",
    address: "5506 Supreme Drive, Raleigh, NC 27606",
    phone: "(646) 339-2225",
    email: "hibachinearby@gmail.com",
    website: "https://hibachinearby.com",
    logoUrl: "/logos/hibachinearby.png",
    homeBaseLabel: "Raleigh, NC",
  },

  branding: {
    businessName: "HibachiNearby",
    invoiceTitle: "HibachiNearby Invoice",
    emailSenderName: "HibachiNearby",
    logoUrl: "/logos/hibachinearby.png",
    primaryColor: "#111827",
  },

  notifications: {
    fromEmail: "ShuiLink Booking <booking@shuilink.com>",

    merchantEmails: [
      "hibachinearby@gmail.com",
      "2235869122@qq.com",
      "shuilin9108@gmail.com",
    ],
  },

  payments: {
    stripeDepositLink:
      "https://buy.stripe.com/aFabJ32Dj3QE27k8Qe3wQ02",
  },

  integrations: {
    resend: {
      enabled: true,
      fromEmail: "ShuiLink Booking <booking@shuilink.com>",
      merchantNotificationEmail: "hibachinearby@gmail.com",
    },

    googleSheets: {
      enabled: true,
      spreadsheetId: "",
      sheetName: "HibachiNearby Bookings",
      webhookUrl:
        process.env.HIBACHINEARBY_GOOGLE_SHEET_WEBHOOK_URL || "",
    },

    googleCalendar: {
      enabled: false,
      calendarId: "",
      webhookUrl:
        process.env.HIBACHINEARBY_GOOGLE_CALENDAR_WEBHOOK_URL || "",
    },

    stripe: {
      enabled: true,
      depositPaymentLink:
        "https://buy.stripe.com/aFabJ32Dj3QE27k8Qe3wQ02",
    },
  },

  serviceCoverage: {
    model: "multi_state_service_area",
    originAddress: "5506 Supreme Drive, Raleigh, NC 27606",
    maxDriveTimeMinutes: 180,
    supportsOutOfAreaInquiry: true,
    notes:
      "Service is generally available across North Carolina, South Carolina, and Virginia depending on date, travel distance, and event size.",
  },

  seoLocations: {
    featured: [
      "Charlotte, NC",
      "Raleigh, NC",
      "Durham, NC",
      "Greensboro, NC",
      "Winston-Salem, NC",
      "Fayetteville, NC",
      "Wilmington, NC",
      "Kill Devil Hills, NC",
      "Myrtle Beach, SC",
      "Charleston, SC",
      "Columbia, SC",
      "Virginia Beach, VA",
    ],
    purpose:
      "Private hibachi catering SEO targeting across North Carolina, South Carolina, and Virginia",
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

  addOns: [
    {
      id: "extra-regular-protein",
      label: "Extra Regular Protein",
      unitPrice: 10,
      unitLabel: "each",
      choices: [
        "Chicken",
        "Steak",
        "Shrimp",
        "Scallops",
        "Salmon",
        "Tofu",
        "Squid",
      ],
    },

    {
      id: "extra-premium-protein",
      label: "Extra Premium Protein",
      unitPrice: 15,
      unitLabel: "each",
      choices: ["Filet Mignon", "Lobster Tail"],
    },

    {
      id: "fried-rice",
      label: "Fried Rice",
      unitPrice: 5,
      unitLabel: "order",
    },

    {
      id: "stir-fried-noodles",
      label: "Stir Fried Noodles",
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
    model: "custom_quote",
    enabled: true,
    requiresManualReview: true,

    inputLabel: "Event Location / Estimated Distance *",
    inputPlaceholder: "Enter your city, address, or estimated distance",

    helperText:
      "Travel fee may apply depending on distance, traffic, tolls, chef availability, and event size. Our team will confirm the final travel fee after reviewing your request.",

    customerVisibleNote:
      "Travel fee may apply and will be confirmed by staff after reviewing your event location.",
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
      stripePaymentLink:
        "https://buy.stripe.com/aFabJ32Dj3QE27k8Qe3wQ02",
    },

    tipOptions: [20, 25, 30],

    notes:
      "Deposit is optional. Our team will confirm availability and final pricing before requiring any additional payment.",
  },

  tax: {
    collectTax: false,
    model: "destination_based_sales_tax",

    fallbackRates: {
      ncFallbackRate: 0.0725,
      scFallbackRate: 0.0725,
      vaFallbackRate: 0.06,
    },

    notes:
      "Tax handling should be based on destination/address jurisdiction.",
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
          "HibachiNearby is not responsible for any property damage during the event.",
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
      title: "Book Your HibachiNearby Private Hibachi Experience",
      subtitle:
        "Private hibachi catering near you across North Carolina, South Carolina, and Virginia for birthdays, backyard parties, vacations, graduations, and special events.",
      submitLabel: "Request My Booking",
      depositHint:
        "A $50 optional deposit can help secure your spot faster, but it is not required to submit a request.",
      notice:
        "Final pricing may be adjusted based on travel distance, guest count, package rules, add-ons, promotions, and any applicable tax.",
    },

    thankYouPage: {
      title: "Thank you — your booking request has been submitted.",
      subtitle:
        "Our team will review your details and reach out shortly to confirm availability and final booking details.",
    },
  },

  theme: {
    primaryColor: "#111827",
    cardRadius: "18px",
  },
};

module.exports = hibachiNearbyConfig;