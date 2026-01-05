import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env early so this config works even before main.js calls dotenv
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const CLOUDINARY_URL = (process.env.CLOUDINARY_URL || "").trim();
const CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const API_KEY = (process.env.CLOUDINARY_API_KEY || "").trim();
const API_SECRET = (process.env.CLOUDINARY_API_SECRET || "").trim();

const isCloudinaryEnabled =
  Boolean(CLOUDINARY_URL) || (Boolean(CLOUD_NAME) && Boolean(API_KEY) && Boolean(API_SECRET));

if (isCloudinaryEnabled) {
  if (CLOUDINARY_URL) {
    cloudinary.config(CLOUDINARY_URL);
  } else {
    cloudinary.config({
      cloud_name: CLOUD_NAME,
      api_key: API_KEY,
      api_secret: API_SECRET,
      secure: true,
    });
  }
} else {
  console.warn(
    "[cloudinary] Missing credentials. Upload endpoints will be disabled until CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET are set."
  );
}

export { isCloudinaryEnabled };
export default cloudinary;
