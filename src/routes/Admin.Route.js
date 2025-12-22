import express from "express";
import AdminController from "../controllers/AdminController.js";
import { requireAdmin } from "../middlewares/auth.middleware.js";

const AdminRoute = express.Router();

AdminRoute.use(requireAdmin);

AdminRoute.get("/", (req, res) => res.redirect("/admin/books"));
AdminRoute.get("/books", AdminController.list);
AdminRoute.get("/books/new", AdminController.showCreateForm);
AdminRoute.post("/books", AdminController.create);
AdminRoute.get("/books/:id/edit", AdminController.showEditForm);
AdminRoute.post("/books/:id", AdminController.update);
AdminRoute.post("/books/:id/delete", AdminController.delete);

export default AdminRoute;
