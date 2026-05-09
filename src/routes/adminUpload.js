// 后台文件上传 API：用于上传商家 logo 到 Cloudinary。

const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { requireAdminUser } = require("../middleware/adminAuth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post(
  "/logo",
  requireAdminUser,
  upload.single("logo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No logo file uploaded.",
        });
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "hibachifinder/merchant-logos",
            resource_type: "image",
            transformation: [
              { width: 600, height: 600, crop: "limit" },
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          },
        );

        stream.end(req.file.buffer);
      });

      return res.status(200).json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("LOGO UPLOAD ERROR:", error);

      return res.status(500).json({
        success: false,
        error: "Logo upload failed.",
        details: error.message,
      });
    }
  },
);

module.exports = router;