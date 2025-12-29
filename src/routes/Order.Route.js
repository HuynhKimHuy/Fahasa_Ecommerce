import express from "express";
import OrderController from "../controllers/OrderController.js";

const OrderRoute = express.Router();

OrderRoute.get("/checkout", OrderController.checkout);
OrderRoute.post("/", OrderController.create);
OrderRoute.get("/success/:id", OrderController.success);

export default OrderRoute;
