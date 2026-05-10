// 后端统一价格引擎，根据商家配置计算套餐、加购、蛋白升级、路费、折扣、税和总价。

function normalizePromoCode(code, normalizeMode = "lowercase") {
  const raw = String(code || "").trim();
  if (!raw) return "";

  if (normalizeMode === "lowercase") {
    return raw.toLowerCase();
  }

  return raw;
}

function parseBirthdayInput(birthday) {
  if (!birthday?.month || !birthday?.day || !birthday?.year) {
    return null;
  }

  const monthMap = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
  };

  const monthNumber = monthMap[String(birthday.month).toLowerCase()];
  const dayNumber = Number(birthday.day);
  const yearNumber = Number(birthday.year);

  if (!monthNumber || !dayNumber || !yearNumber) {
    return null;
  }

  return {
    month: monthNumber,
    day: dayNumber,
    year: yearNumber,
  };
}

function parseEventDate(eventDate) {
  if (!eventDate) return null;

  const parsed = new Date(`${eventDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function getBirthdayThisYearDate(eventDateObj, birthdayParsed) {
  return new Date(
    eventDateObj.getFullYear(),
    birthdayParsed.month - 1,
    birthdayParsed.day,
    12,
    0,
    0,
  );
}

function getDayDifference(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

function isBirthdayWithinWindow(eventDateObj, birthdayParsed, windowDays) {
  const sameYearBirthday = getBirthdayThisYearDate(
    eventDateObj,
    birthdayParsed,
  );

  const prevYearBirthday = new Date(
    eventDateObj.getFullYear() - 1,
    birthdayParsed.month - 1,
    birthdayParsed.day,
    12,
    0,
    0,
  );

  const nextYearBirthday = new Date(
    eventDateObj.getFullYear() + 1,
    birthdayParsed.month - 1,
    birthdayParsed.day,
    12,
    0,
    0,
  );

  const diffs = [
    Math.abs(getDayDifference(eventDateObj, sameYearBirthday)),
    Math.abs(getDayDifference(eventDateObj, prevYearBirthday)),
    Math.abs(getDayDifference(eventDateObj, nextYearBirthday)),
  ];

  return Math.min(...diffs) <= Number(windowDays || 0);
}

function getAgeOnEventDate(eventDateObj, birthdayParsed) {
  let age = eventDateObj.getFullYear() - birthdayParsed.year;

  const hasHadBirthdayThisYear =
    eventDateObj.getMonth() + 1 > birthdayParsed.month ||
    (eventDateObj.getMonth() + 1 === birthdayParsed.month &&
      eventDateObj.getDate() >= birthdayParsed.day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

function getPromoCodeDiscount(form, merchant) {
  const promoField = merchant?.promotions?.promoCodeField;
  const codes = merchant?.promotions?.codes || [];

  if (!promoField?.enabled) {
    return {
      amount: 0,
      label: "",
      code: "",
    };
  }

  const normalizedInput = normalizePromoCode(
    form?.shared?.promoCode,
    promoField.normalize,
  );

  if (!normalizedInput) {
    return {
      amount: 0,
      label: "",
      code: "",
    };
  }

  const matchedCode = codes.find((item) => {
    if (!item.active) return false;

    if (item.caseSensitive) {
      return (
        String(item.code || "").trim() ===
        String(form?.shared?.promoCode || "").trim()
      );
    }

    return (
      normalizePromoCode(item.code, promoField.normalize) === normalizedInput
    );
  });

  if (!matchedCode) {
    return {
      amount: 0,
      label: "",
      code: normalizedInput,
    };
  }

  if (matchedCode.type === "flat_amount") {
    return {
      amount: Number(matchedCode.amountOff || 0),
      label: matchedCode.label || matchedCode.code || "",
      code: normalizedInput,
    };
  }

  return {
    amount: 0,
    label: matchedCode.label || matchedCode.code || "",
    code: normalizedInput,
  };
}

function getBirthdayDiscount(
  form,
  merchant,
  selectedPackage,
  subtotalBeforeDiscount,
) {
  const birthdayPromo = merchant?.promotions?.birthdayPromo;

  if (!birthdayPromo?.enabled) {
    return {
      amount: 0,
      label: "",
      appliedTo: "",
      ageOnEventDate: null,
      isEligible: false,
    };
  }

  const birthdayParsed = parseBirthdayInput(form?.shared?.birthday);
  const eventDateObj = parseEventDate(form?.event?.date);

  if (!birthdayParsed || !eventDateObj) {
    return {
      amount: 0,
      label: "",
      appliedTo: "",
      ageOnEventDate: null,
      isEligible: false,
    };
  }

  const threshold = Number(birthdayPromo.orderThreshold || 0);

  if (Number(subtotalBeforeDiscount || 0) < threshold) {
    return {
      amount: 0,
      label: "",
      appliedTo: "",
      ageOnEventDate: null,
      isEligible: false,
    };
  }

  const withinWindow = isBirthdayWithinWindow(
    eventDateObj,
    birthdayParsed,
    birthdayPromo.birthdayWindowDays,
  );

  if (!withinWindow) {
    return {
      amount: 0,
      label: "",
      appliedTo: "",
      ageOnEventDate: null,
      isEligible: false,
    };
  }

  const ageOnEventDate = getAgeOnEventDate(eventDateObj, birthdayParsed);
  const isAdultBirthdayGuest = ageOnEventDate >= 12;

  const amount = isAdultBirthdayGuest
    ? Number(selectedPackage?.adultPrice || 0)
    : Number(selectedPackage?.kidPrice || 0);

  return {
    amount,
    label: isAdultBirthdayGuest
      ? "Birthday FREE adult meal applied"
      : "Birthday FREE kid meal applied",
    appliedTo: isAdultBirthdayGuest ? "adult" : "kid",
    ageOnEventDate,
    isEligible: true,
  };
}

function calculateTravelFee(form, merchant) {
  const travelFeeConfig = merchant?.travelFee || {};
  const model = travelFeeConfig.model || "distance_threshold_plus_per_mile";
  const travelMiles = Number(form?.event?.travelMiles || 0);

  if (model === "custom_quote" || model === "manual_only") {
    return {
      travelMiles:
        Number.isNaN(travelMiles) || travelMiles < 0 ? 0 : travelMiles,
      travelFee: 0,
      extraMiles: 0,
      travelFeeStatus: "manual_review_required",
      travelFeeLabel:
        travelFeeConfig.customerVisibleNote ||
        travelFeeConfig.helperText ||
        "Travel fee may apply and will be confirmed by staff.",
      travelFeeModel: model,
    };
  }

  if (Number.isNaN(travelMiles) || travelMiles < 0) {
    return {
      travelMiles: 0,
      travelFee: 0,
      extraMiles: 0,
      travelFeeStatus: "invalid_distance",
      travelFeeLabel: "Travel distance must be 0 or greater.",
      travelFeeModel: model,
    };
  }

  const freeMiles = Number(travelFeeConfig.freeMiles || 0);
  const pricePerMileOverFreeLimit = Number(
    travelFeeConfig.pricePerMileOverFreeLimit || 0,
  );
  const minimumFee = Number(travelFeeConfig.minimumFee || 0);
  const baseFeeOverFreeLimit = Number(
    travelFeeConfig.baseFeeOverFreeLimit || 0,
  );

  const extraMiles = Math.max(0, travelMiles - freeMiles);

  let travelFee = 0;

  if (model === "distance_threshold_plus_base_and_per_mile") {
    travelFee =
      extraMiles > 0
        ? baseFeeOverFreeLimit + extraMiles * pricePerMileOverFreeLimit
        : 0;
  } else {
    travelFee = minimumFee + extraMiles * pricePerMileOverFreeLimit;
  }

  return {
    travelMiles,
    travelFee,
    extraMiles,
    travelFeeStatus: travelFee > 0 ? "calculated" : "included",
    travelFeeLabel:
      travelFee > 0
        ? `Travel fee calculated for ${extraMiles} extra miles.`
        : "Travel fee included within service radius.",
    travelFeeModel: model,
  };
}

function getTaxRate(merchant) {
  if (!merchant?.tax?.collectTax) {
    return 0;
  }

  const fallbackRates = merchant?.tax?.fallbackRates || {};

  return Number(
    fallbackRates.nycCombinedRate ||
      fallbackRates.ncFallbackRate ||
      fallbackRates.scFallbackRate ||
      fallbackRates.vaFallbackRate ||
      0,
  );
}

function emptyPricing() {
  return {
    packageId: "",
    packageName: "",

    adultCount: 0,
    kidCount: 0,

    adultSubtotal: 0,
    kidSubtotal: 0,

    addOnTotal: 0,
    proteinUpgradeTotal: 0,

    effectiveGuestCount: 0,

    basePrice: 0,
    travelMiles: 0,
    extraMiles: 0,
    travelFee: 0,
    travelFeeStatus: "not_calculated",
    travelFeeLabel: "",
    travelFeeModel: "",

    subtotalBeforeDiscount: 0,
    promoCodeDiscount: 0,
    birthdayDiscount: 0,
    totalDiscount: 0,
    appliedDiscountLabel: "",
    birthdayDiscountAppliedTo: "",
    birthdayGuestAgeOnEventDate: null,
    subtotal: 0,

    tax: 0,
    total: 0,
    totalPrice: 0,

    deposit: 0,

    depositMode: "none",
    optionalDepositLabel: "",
  };
}

function calculatePricing(form, merchant) {
  if (!merchant || !merchant.packages?.length) {
    return emptyPricing();
  }

  const selectedPackage =
    merchant.packages.find((p) => p.id === form.selection?.packageId) || null;

  if (!selectedPackage) {
    const travelSummary = calculateTravelFee(form, merchant);

    return {
      ...emptyPricing(),
      adultCount: Number(form.event?.adultCount) || 0,
      kidCount: Number(form.event?.kidCount) || 0,
      effectiveGuestCount:
        (Number(form.event?.adultCount) || 0) +
        (Number(form.event?.kidCount) || 0),
      travelMiles: travelSummary.travelMiles,
      extraMiles: travelSummary.extraMiles,
      travelFee: travelSummary.travelFee,
      travelFeeStatus: travelSummary.travelFeeStatus,
      travelFeeLabel: travelSummary.travelFeeLabel,
      travelFeeModel: travelSummary.travelFeeModel,
    };
  }

  const adultCount = Number(form.event?.adultCount || 0);
  const kidCount = Number(form.event?.kidCount || 0);

  const minGuests =
    selectedPackage?.rules?.minGuests || merchant?.booking?.minimumGuests || 10;

  const totalGuests = adultCount + kidCount;
  const effectiveGuestCount = Math.max(totalGuests, minGuests);

  const adultSubtotal = adultCount * Number(selectedPackage?.adultPrice || 0);
  const kidSubtotal = kidCount * Number(selectedPackage?.kidPrice || 0);
  const basePrice = adultSubtotal + kidSubtotal;

  let addOnTotal = 0;

  const allAddOns = [
    ...(merchant.extraProteinCatalog || []),
    ...(merchant.addOns || []),
  ];

  const submittedAddOns =
    form.addOns || form.selection?.addOns || {};

  if (allAddOns.length) {
    for (const addOn of allAddOns) {
      const quantity = Number(submittedAddOns[addOn.id] || 0);
      addOnTotal += quantity * Number(addOn.unitPrice || 0);
    }
  }

  const proteinCatalog = merchant?.proteinCatalog || [];
  const upgradeFeeMap = proteinCatalog.reduce((map, protein) => {
    map[protein.id] = Number(protein.upgradeFee || 0);
    return map;
  }, {});

  const adultProteins = form.selection?.proteins?.adult || {};
  const kidProteins = form.selection?.proteins?.kid || {};

  const includedAdultSlots =
    adultCount * (String(selectedPackage?.name || "").includes("3") ? 3 : 2);

  const includedKidSlots = kidCount;

  const totalAdultSelections = Object.values(adultProteins).reduce(
    (total, value) => total + Number(value || 0),
    0,
  );

  const totalKidSelections = Object.values(kidProteins).reduce(
    (total, value) => total + Number(value || 0),
    0,
  );

  const extraAdultSelections = Math.max(
    0,
    totalAdultSelections - includedAdultSlots,
  );

  const extraKidSelections = Math.max(0, totalKidSelections - includedKidSlots);

  const totalExtraSelections = extraAdultSelections + extraKidSelections;

  const premiumProteinIds = ["filet-mignon", "lobster-tail"];

  let premiumExtraSelections = 0;

  for (const [proteinId, quantity] of Object.entries(adultProteins)) {
    if (premiumProteinIds.includes(proteinId)) {
      premiumExtraSelections += Number(quantity || 0);
    }
  }

  for (const [proteinId, quantity] of Object.entries(kidProteins)) {
    if (premiumProteinIds.includes(proteinId)) {
      premiumExtraSelections += Number(quantity || 0);
    }
  }

  premiumExtraSelections = Math.min(
    premiumExtraSelections,
    totalExtraSelections,
  );

  const regularExtraSelections = totalExtraSelections - premiumExtraSelections;

  const extraRegularProteinTotal = regularExtraSelections * 10;
  const extraPremiumProteinTotal = premiumExtraSelections * 15;

  addOnTotal += extraRegularProteinTotal;
  addOnTotal += extraPremiumProteinTotal;

  let proteinUpgradeTotal = 0;

  for (const [proteinId, quantity] of Object.entries(adultProteins)) {
    proteinUpgradeTotal +=
      Number(quantity || 0) * Number(upgradeFeeMap[proteinId] || 0);
  }

  for (const [proteinId, quantity] of Object.entries(kidProteins)) {
    proteinUpgradeTotal +=
      Number(quantity || 0) * Number(upgradeFeeMap[proteinId] || 0);
  }

  const travelSummary = calculateTravelFee(form, merchant);
  const travelFee = travelSummary.travelFee;

  const subtotalBeforeDiscount =
    basePrice + addOnTotal + proteinUpgradeTotal + travelFee;

  const promoCodeDiscount = getPromoCodeDiscount(form, merchant);

  const birthdayDiscount = getBirthdayDiscount(
    form,
    merchant,
    selectedPackage,
    subtotalBeforeDiscount,
  );

  const allowStacking = !!merchant?.promotions?.allowStacking;

  let appliedPromoDiscount = 0;
  let appliedBirthdayDiscount = 0;
  let appliedDiscountLabel = "";

  if (allowStacking) {
    appliedPromoDiscount = promoCodeDiscount.amount;
    appliedBirthdayDiscount = birthdayDiscount.amount;
  } else {
    if (birthdayDiscount.amount > 0) {
      appliedBirthdayDiscount = birthdayDiscount.amount;
      appliedDiscountLabel = birthdayDiscount.label;
    } else if (promoCodeDiscount.amount > 0) {
      appliedPromoDiscount = promoCodeDiscount.amount;
      appliedDiscountLabel =
        promoCodeDiscount.label || "Promo code discount applied";
    }
  }

  const totalDiscount = appliedPromoDiscount + appliedBirthdayDiscount;
  const subtotal = Math.max(0, subtotalBeforeDiscount - totalDiscount);

  let deposit = 0;
  let optionalDepositLabel = "";

  if (
    merchant?.payment?.depositMode === "optional" &&
    merchant?.payment?.optionalDeposit?.enabled
  ) {
    deposit = Number(merchant.payment.optionalDeposit.value || 0);
    optionalDepositLabel = merchant.payment.optionalDeposit.label || "";
  }

  if (merchant?.payment?.depositMode === "required") {
    deposit = Number(merchant?.payment?.requiredDeposit?.value || 0);
  }

  const taxRate = getTaxRate(merchant);
  const tax = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return {
    packageId: selectedPackage.id,
    packageName: selectedPackage.name,

    adultCount,
    kidCount,

    adultSubtotal,
    kidSubtotal,

    addOnTotal,
    proteinUpgradeTotal,
    extraRegularProteinTotal,
    extraPremiumProteinTotal,
    regularExtraSelections,
    premiumExtraSelections,
    totalExtraSelections,

    effectiveGuestCount,

    basePrice,
    travelMiles: travelSummary.travelMiles,
    extraMiles: travelSummary.extraMiles,
    travelFee,
    travelFeeStatus: travelSummary.travelFeeStatus,
    travelFeeLabel: travelSummary.travelFeeLabel,
    travelFeeModel: travelSummary.travelFeeModel,

    subtotalBeforeDiscount,
    promoCodeDiscount: appliedPromoDiscount,
    birthdayDiscount: appliedBirthdayDiscount,
    totalDiscount,
    appliedDiscountLabel,
    birthdayDiscountAppliedTo: birthdayDiscount.appliedTo || "",
    birthdayGuestAgeOnEventDate: birthdayDiscount.ageOnEventDate,
    subtotal,
    tax,

    deposit,
    total,
    totalPrice: total,

    depositMode: merchant?.payment?.depositMode || "none",
    optionalDepositLabel,

    pricingBreakdown: {
      package: {
        adultSubtotal,
        kidSubtotal,
        total: basePrice,
      },

      extraProteins: {
        regularSelections: regularExtraSelections,
        premiumSelections: premiumExtraSelections,
        regularTotal: extraRegularProteinTotal,
        premiumTotal: extraPremiumProteinTotal,
        total: extraRegularProteinTotal + extraPremiumProteinTotal,
      },

      upgrades: {
        proteinUpgradeTotal,
      },

      addOns: {
        total: addOnTotal,
        items: Object.entries(form.addOns || {}).map(([id, quantity]) => ({
          id,
          quantity,
        })),
      },

      travel: {
        miles: travelSummary.travelMiles,
        extraMiles: travelSummary.extraMiles,
        fee: travelFee,
        status: travelSummary.travelFeeStatus,
      },

      discounts: {
        promoCodeDiscount: appliedPromoDiscount,
        birthdayDiscount: appliedBirthdayDiscount,
        total: totalDiscount,
      },

      tax: {
        rate: taxRate,
        amount: tax,
      },

      totals: {
        subtotalBeforeDiscount,
        subtotal,
        total,
      },
    },
  };
}
module.exports = {
  calculatePricing,
};
