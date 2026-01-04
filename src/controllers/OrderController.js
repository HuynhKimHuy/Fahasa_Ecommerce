import mongoose from "mongoose";
import Order from "../model/order.js";
import Book from "../model/product.js";
import { refreshCartWithLatestPrices } from "../helpers/cart.helper.js";

const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const vnPhonePattern = /^(0|\+84)(3[2-9]|5[6|8|9]|7[06-9]|8[1-5]|9[0-9])[0-9]{7}$/;

class OrderController {
  async checkout(req, res) {
    const cart = await refreshCartWithLatestPrices(req);
    if (!cart.items.length) {
      return res.redirect("/cart");
    }
    return res.render("cart/Checkout", {
      cart,
      form: {
        customerName: "",
        email: "",
        phone: "",
        detailAddress: "",
        province: "",
        district: "",
        ward: "",
        note: "",
        paymentMethod: "cod",
      },
    });
  }

  async create(req, res, next) {
    let cart = null;
    let session = null;
    try {
      cart = await refreshCartWithLatestPrices(req);
      if (!cart.items.length) {
        return res.redirect("/cart");
      }

      const customerName = req.body.customerName?.trim() || "";
      const email = req.body.email?.trim() || "";
      const phone = req.body.phone?.trim() || "";
      const detailAddress = req.body.detailAddress?.trim() || req.body.address?.trim() || "";
      const province = req.body.province?.trim() || "";
      const district = req.body.district?.trim() || "";
      const ward = req.body.ward?.trim() || "";
      const note = req.body.note?.trim() || "";
      const paymentMethod = req.body.paymentMethod === "card" ? "card" : "cod";

      const errors = [];
      if (!customerName || !email || !phone || !detailAddress || !province || !district || !ward) {
        errors.push("Vui lòng điền đầy đủ thông tin nhận hàng.");
      }
      if (email && !emailPattern.test(email)) {
        errors.push("Email không đúng định dạng. Vui lòng nhập theo mẫu ten@domain.com.");
      }
      if (phone && !vnPhonePattern.test(phone)) {
        errors.push("Số điện thoại phải thuộc định dạng Việt Nam (bắt đầu bằng 0 hoặc +84).");
      }
      const addressParts = [detailAddress, ward, district, province].map((part) => part.trim()).filter(Boolean);
      const address = addressParts.join(", ");

      if (errors.length) {
        return res.render("cart/Checkout", {
          cart,
          errors,
          form: { customerName, email, phone, detailAddress, province, district, ward, note, paymentMethod },
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
            user: req.session?.user?.id,
            customerName,
            email,
            phone,
            address,
            shipping: {
              detailAddress,
              ward,
              district,
              province,
              fullAddress: address,
            },
            province,
            district,
            ward,
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
          cart: cart ?? (await refreshCartWithLatestPrices(req)),
          errors: [error.message],
          form: {
            customerName: req.body.customerName,
            email: req.body.email,
            phone: req.body.phone,
            detailAddress: req.body.detailAddress ?? req.body.address,
            province: req.body.province,
            district: req.body.district,
            ward: req.body.ward,
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
            ? new Date(order.createdAt).toLocaleString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh" })
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
