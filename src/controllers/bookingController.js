// 负责处理 booking API 请求，把前端提交的订单交给 bookingService 处理。

import { createBookingService } from "../services/bookingService.js";
import { getMerchantConfig } from "../core/merchants/getMerchantConfig.js";

export async function createBookingController(req, res, next) {
  try {
    const merchantSlug =
      req.body?.merchantSlug ||
      req.body?.merchant ||
      req.params?.merchantSlug ||
      req.query?.merchant;

    if (!merchantSlug) {
      return res.status(400).json({
        success: false,
        message: "Missing merchant slug",
      });
    }

    const merchantConfig = getMerchantConfig(merchantSlug);

    if (!merchantConfig) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const booking = await createBookingService({
      bookingData: req.body,
      merchantConfig,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    next(error);
  }
}