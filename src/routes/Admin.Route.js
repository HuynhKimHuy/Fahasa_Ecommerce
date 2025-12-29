import express from "express";
import AdminController from "../controllers/AdminController.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";
import OrderController from "../controllers/OrderController.js";
import UserController from "../controllers/UserController.js";

const AdminRoute = express.Router();

AdminRoute.use(requireAdmin);

AdminRoute.get("/", (req, res) => res.redirect("/admin/books"));
AdminRoute.get("/books", AdminController.list);
AdminRoute.get("/books/new", AdminController.showCreateForm);
AdminRoute.post("/books", AdminController.create);
AdminRoute.get("/books/:id/edit", AdminController.showEditForm);
AdminRoute.post("/books/:id", AdminController.update);
AdminRoute.post("/books/:id/delete", AdminController.delete);
AdminRoute.get("/orders", OrderController.adminList);
AdminRoute.post("/orders/:id/status", OrderController.updateStatus);
AdminRoute.post("/orders/:id/delete", OrderController.delete);
AdminRoute.get("/users", UserController.adminList);

export default AdminRoute;
