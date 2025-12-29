import mongoose from "mongoose";
import Order from "../model/order.js";
import Book from "../model/product.js";
import { getCartViewModel, getCartFromSession, saveCartToSession } from "../helpers/cart.helper.js";

class OrderController {
  async checkout(req, res) {
    const cart = getCartViewModel(req);
    if (!cart.items.length) {
      return res.redirect("/cart");
    }
    return res.render("cart/Checkout", {
      cart,
      form: { customerName: "", email: "", phone: "", address: "", note: "", paymentMethod: "cod" },
    });
  }

  async create(req, res, next) {
    let cart = null;
    let session = null;
    try {
      cart = getCartViewModel(req);
      if (!cart.items.length) {
        return res.redirect("/cart");
      }

      const customerName = req.body.customerName?.trim() || "";
      const email = req.body.email?.trim() || "";
      const phone = req.body.phone?.trim() || "";
      const address = req.body.address?.trim() || "";
      const note = req.body.note?.trim() || "";
      const paymentMethod = req.body.paymentMethod === "card" ? "card" : "cod";

      if (!customerName || !email || !phone || !address) {
        return res.render("cart/Checkout", {
          cart,
          errors: ["Vui lòng điền đầy đủ thông tin nhận hàng"],
          form: { customerName, email, phone, address, note, paymentMethod },
        });
      }

      // ensure books still exist and prices are up to date
      const bookIds = cart.items.map((item) => item.bookId);

      session = await mongoose.startSession();
      session.startTransaction();

      const books = await Book.find({ _id: { $in: bookIds } }).session(session);
      const bookMap = new Map(books.map((b) => [String(b._id), b]));

      const items = cart.items.map((item) => {
        const book = bookMap.get(String(item.bookId));
        return {
          book: item.bookId,
          title: item.product.title,
          slug: item.product.slug,
          price: book?.newPrice ?? item.price,
          qty: item.qty,
          coverImage: item.product.coverImage,
        };
      });

      // kiểm tra tồn kho và trừ kho theo giao dịch
      for (const item of items) {
        const book = bookMap.get(String(item.book));
        if (!book || (book.stock ?? 0) < item.qty) {
          const err = new Error(`Sách "${item.title}" không đủ hàng`);
          err.code = "OUT_OF_STOCK";
          throw err;
        }
        const result = await Book.updateOne(
          { _id: item.book, stock: { $gte: item.qty } },
          { $inc: { stock: -item.qty, sold: item.qty } },
          { session }
        );
        if (!result.matchedCount) {
          const err = new Error(`Sách "${item.title}" không đủ hàng`);
          err.code = "OUT_OF_STOCK";
          throw err;
        }
      }

      const [order] = await Order.create(
        [
          {
            customerName,
            email,
            phone,
            address,
            note,
            paymentMethod,
            totalQty: cart.totalQty,
            totalPrice: cart.totalPrice,
            items,
            status: "pending",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      await session.endSession();

      // clear cart
      req.session.cart = null;

      return res.redirect(`/orders/success/${order._id}`);
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
          await session.endSession();
        } catch (rollbackError) {
          // swallow rollback errors to avoid masking original error
        }
      }

      if (error?.code === "OUT_OF_STOCK") {
        return res.render("cart/Checkout", {
          cart: cart ?? getCartViewModel(req),
          errors: [error.message],
          form: {
            customerName: req.body.customerName,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            note: req.body.note,
            paymentMethod: req.body.paymentMethod,
          },
        });
      }
      try {
        next(error);
      } catch (forwardError) {
        // no-op
      }
    }
  }

  async success(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id).lean();
      if (!order) {
        return res.redirect("/collection");
      }
      return res.render("cart/OrderSuccess", { order });
    } catch (error) {
      next(error);
    }
  }

  async adminList(req, res, next) {
    try {
      const orders = await Order.find().lean().sort({ createdAt: -1 });
      const statusMap = {
        pending: { label: "Đơn mới", tone: "warning", deliveryLabel: "Chưa giao", deliveryTone: "warning" },
        confirmed: { label: "Đã xác nhận", tone: "info", deliveryLabel: "Chưa giao", deliveryTone: "warning" },
        shipping: { label: "Đang giao", tone: "info", deliveryLabel: "Đang giao", deliveryTone: "info" },
        completed: { label: "Hoàn tất", tone: "success", deliveryLabel: "Đã giao", deliveryTone: "success" },
        canceled: { label: "Đã huỷ", tone: "danger", deliveryLabel: "Huỷ", deliveryTone: "danger" },
      };

      const viewOrders = orders.map((order) => {
        const statusInfo = statusMap[order.status] ?? statusMap.pending;
        const items = (order.items ?? []).map((item) => ({
          ...item,
          lineTotal: (item.qty ?? 0) * (item.price ?? 0),
        }));

        return {
          ...order,
          items,
          createdAtLabel: order.createdAt
            ? new Date(order.createdAt).toLocaleString("vi-VN", { hour12: false })
            : "",
          statusLabel: statusInfo.label,
          statusTone: statusInfo.tone,
          deliveryLabel: statusInfo.deliveryLabel,
          deliveryTone: statusInfo.deliveryTone,
          paymentMethodLabel: order.paymentMethod === "card" ? "Thanh toán online" : "COD",
        };
      });

      const orderStats = viewOrders.reduce(
        (acc, order) => {
          acc.total += 1;
          acc.pending += order.status === "pending" ? 1 : 0;
          acc.confirmed += order.status === "confirmed" ? 1 : 0;
          acc.shipping += order.status === "shipping" ? 1 : 0;
          acc.completed += order.status === "completed" ? 1 : 0;
          acc.canceled += order.status === "canceled" ? 1 : 0;
          return acc;
        },
        { total: 0, pending: 0, confirmed: 0, shipping: 0, completed: 0, canceled: 0 }
      );
      orderStats.newOrders = orderStats.pending + orderStats.confirmed;
      const lastUpdatedLabel = new Date().toLocaleTimeString("vi-VN", { hour12: false });

      return res.render("admin/OrderList", {
        orders: viewOrders,
        orderStats,
        lastUpdatedLabel,
        pageScript: "admin.js",
        navActive: "orders",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const allowed = ["pending", "confirmed", "shipping", "completed", "canceled"];
      if (!allowed.includes(status)) {
        return res.redirect("/admin/orders?status=error&message=Trạng thái không hợp lệ");
      }
      await Order.findByIdAndUpdate(id, { status });
      return res.redirect("/admin/orders?status=success&message=Cập nhật trạng thái thành công");
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await Order.findByIdAndDelete(id);
      return res.redirect("/admin/orders?status=success&message=Đã xoá đơn hàng");
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
