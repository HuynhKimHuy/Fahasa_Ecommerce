import express from "express";
import BookController from "../controllers/BookController.js";
import multer from "multer";

const CreateDBRoute = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const uploadMiddleware = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.single("coverImage")(req, res, next);
  }
  return next();
};

CreateDBRoute.post("/", uploadMiddleware, BookController.create);

export default CreateDBRoute;
