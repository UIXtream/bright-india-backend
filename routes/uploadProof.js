import express from "express";
import multer from "multer";
import { Readable } from "stream";
import verifyToken from "../middleware/auth.js";
import cloudinary from "../utils/cloudinary.js";
import PaymentProof from "../models/PaymentProof.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload-proof", verifyToken, upload.single("screenshot"), async (req, res) => {
  try {
    const { amount } = req.body;
    const fileBuffer = req.file.buffer;

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "paymentProofs", // 📁 Cloudinary folder
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ success: false, message: "Upload failed" });
        }

        // Save proof in DB
        const proof = new PaymentProof({
          userId: req.user.id,
          amount,
          screenshotUrl: result.secure_url,
          status: "Pending"
        });

        await proof.save();

        res.json({
          success: true,
          message: "Screenshot uploaded successfully",
          url: result.secure_url,
        });
      }
    );

    Readable.from(fileBuffer).pipe(stream);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
