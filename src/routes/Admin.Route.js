import express from "express";
import AdminController from "../controllers/AdminController.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import OrderController from "../controllers/OrderController.js";
import UserController from "../controllers/UserController.js";
import multer from "multer";
import Book from "../model/product.js";

const AdminRoute = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

AdminRoute.use(requireAdmin);

// Provide categories to header/nav on all admin pages
AdminRoute.use(async (req, res, next) => {
  try {
    const categoriesRaw = await Book.distinct("category");
    res.locals.categories = (categoriesRaw || []).map((name) => ({
      name: typeof name === "string" ? name : "",
      value: typeof name === "string" ? name : "",
    }));
  } catch (error) {
    console.error("Cannot preload categories for admin nav:", error);
    res.locals.categories = [];
  }
  next();
});

AdminRoute.get("/", (req, res) => res.redirect("/admin/books"));
AdminRoute.get("/books", AdminController.list);
AdminRoute.get("/books/new", AdminController.showCreateForm);
AdminRoute.post("/books", upload.single("coverImage"), AdminController.create);
AdminRoute.get("/books/:id/edit", AdminController.showEditForm);
AdminRoute.post("/books/:id", upload.single("coverImage"), AdminController.update);
AdminRoute.post("/books/:id/delete", AdminController.delete);
AdminRoute.get("/orders", OrderController.adminList);
AdminRoute.post("/orders/:id/status", OrderController.updateStatus);
AdminRoute.post("/orders/:id/delete", OrderController.delete);
AdminRoute.get("/users", UserController.adminList);
AdminRoute.get("/users/new", UserController.showCreateForm);
AdminRoute.post("/users", UserController.create);
AdminRoute.get("/users/:id/edit", UserController.showEditForm);
AdminRoute.post("/users/:id", UserController.update);
AdminRoute.post("/users/:id/delete", UserController.delete);
AdminRoute.get("/users/:id/orders", UserController.viewOrders);

export default AdminRoute;
