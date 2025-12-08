// routes/cart.routes.js
import express from "express"
import {
  addToCart,
  showCart,
  updateCartItem,
  removeCartItem,
} from "../controllers/CartController.js"

const router = express.Router()

// Thêm vào giỏ
router.post("/add/:bookId", addToCart)

// Xem giỏ
router.get("/", showCart)

// Cập nhật số lượng
router.post("/update/:bookId", updateCartItem)

// Xoá item
router.post("/remove/:bookId", removeCartItem)

export default router
