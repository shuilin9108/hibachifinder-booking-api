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
    0
  );
}

function getDayDifference(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

function isBirthdayWithinWindow(eventDateObj, birthdayParsed, windowDays) {
  const sameYearBirthday = getBirthdayThisYearDate(eventDateObj, birthdayParsed);

  const prevYearBirthday = new Date(
    eventDateObj.getFullYear() - 1,
    birthdayParsed.month - 1,
    birthdayParsed.day,
    12,
    0,
    0
  );

  const nextYearBirthday = new Date(
    eventDateObj.getFullYear() + 1,
    birthdayParsed.month - 1,
    birthdayParsed.day,
    12,
    0,
    0
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
    promoField.normalize
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

    return normalizePromoCode(item.code, promoField.normalize) === normalizedInput;
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

function getBirthdayDiscount(form, merchant, selectedPackage, subtotalBeforeDiscount) {
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
    birthdayPromo.birthdayWindowDays
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
  const travelMiles = Number(form?.event?.travelMiles || 0);

  if (Number.isNaN(travelMiles) || travelMiles < 0) {
    return {
      travelMiles: 0,
      travelFee: 0,
      extraMiles: 0,
    };
  }

  const freeMiles = Number(merchant?.travelFee?.freeMiles || 0);
  const pricePerMileOverFreeLimit = Number(
    merchant?.travelFee?.pricePerMileOverFreeLimit || 0
  );
  const minimumFee = Number(merchant?.travelFee?.minimumFee || 0);

  const extraMiles = Math.max(0, travelMiles - freeMiles);
  const travelFee = minimumFee + extraMiles * pricePerMileOverFreeLimit;

  return {
    travelMiles,
    travelFee,
    extraMiles,
  };
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

    subtotalBeforeDiscount: 0,
    promoCodeDiscount: 0,
    birthdayDiscount: 0,
    totalDiscount: 0,
    appliedDiscountLabel: "",
    birthdayDiscountAppliedTo: "",
    birthdayGuestAgeOnEventDate: null,
    subtotal: 0,

    deposit: 0,
    total: 0,

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
    return {
      ...emptyPricing(),
      adultCount: Number(form.event?.adultCount) || 0,
      kidCount: Number(form.event?.kidCount) || 0,
      effectiveGuestCount:
        (Number(form.event?.adultCount) || 0) +
        (Number(form.event?.kidCount) || 0),
      travelMiles: Number(form.event?.travelMiles || 0) || 0,
    };
  }

  const adultCount = Number(form.event?.adultCount || 0);
  const kidCount = Number(form.event?.kidCount || 0);

  const minGuests =
    selectedPackage?.rules?.minGuests ||
    merchant?.booking?.minimumGuests ||
    10;

  const totalGuests = adultCount + kidCount;
  const effectiveGuestCount = Math.max(totalGuests, minGuests);

  const adultSubtotal = adultCount * Number(selectedPackage?.adultPrice || 0);
  const kidSubtotal = kidCount * Number(selectedPackage?.kidPrice || 0);
  const basePrice = adultSubtotal + kidSubtotal;

  let addOnTotal = 0;
  if (merchant.addOns && form.addOns) {
    for (const addOn of merchant.addOns) {
      const quantity = Number(form.addOns[addOn.id] || 0);
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
    subtotalBeforeDiscount
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

  const taxRate = merchant?.tax?.collectTax
    ? Number(merchant?.tax?.fallbackRates?.nycCombinedRate || 0)
    : 0;

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

    effectiveGuestCount,

    basePrice,
    travelMiles: travelSummary.travelMiles,
    extraMiles: travelSummary.extraMiles,
    travelFee,

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
  };
}

module.exports = {
  calculatePricing,
};