import User from "../model/user.js";
import { hashPassword } from "../helpers/auth.helper.js";
import mongoose from "mongoose";
import Order from "../model/order.js";

const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

class UserController {
  async adminList(req, res, next) {
    try {
      const users = await User.find().lean().sort({ createdAt: -1 });
      const stats = users.reduce(
        (acc, user) => {
          acc.total += 1;
          if (user.role === "admin") acc.admins += 1;
          if (user.role !== "admin") acc.customers += 1;
          if (user.isActive) acc.active += 1;
          else acc.locked += 1;
          return acc;
        },
        { total: 0, admins: 0, customers: 0, active: 0, locked: 0 }
      );

      const viewUsers = users.map((user) => ({
        ...user,
        createdAtLabel: user.createdAt
          ? new Date(user.createdAt).toLocaleString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh" })
          : "",
        statusLabel: user.isActive ? "Hoạt động" : "Đã khoá",
        statusTone: user.isActive ? "success" : "danger",
        roleLabel: user.role === "admin" ? "Admin" : "Khách",
      }));

      return res.render("admin/UserList", {
        users: viewUsers,
        stats,
        navActive: "users",
        pageScript: "admin.js",
        message: req.query.message,
        status: req.query.status,
      });
    } catch (error) {
      next(error);
    }
  }

  showCreateForm(req, res) {
    return res.render("admin/UserForm", {
      navActive: "users",
      formTitle: "Tạo người dùng",
      action: "/admin/users",
      user: {},
      pageScript: "admin.js",
    });
  }

  async create(req, res, next) {
    try {
      const { fullName, email, password, role = "user", isActive } = req.body;
      const errors = [];
      if (!fullName) errors.push("Họ tên là bắt buộc.");
      if (!email) errors.push("Email là bắt buộc.");
      if (email && !emailPattern.test(email)) errors.push("Email không đúng định dạng.");
      if (!password || password.length < 6) errors.push("Mật khẩu tối thiểu 6 ký tự.");

      if (errors.length) {
        return res.render("admin/UserForm", {
          navActive: "users",
          formTitle: "Tạo người dùng",
          action: "/admin/users",
          user: { fullName, email, role, isActive: Boolean(isActive) },
          errors,
          pageScript: "admin.js",
        });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.render("admin/UserForm", {
          navActive: "users",
          formTitle: "Tạo người dùng",
          action: "/admin/users",
          user: { fullName, email, role, isActive: Boolean(isActive) },
          errors: ["Email đã tồn tại."],
          pageScript: "admin.js",
        });
      }

      const passwordHash = hashPassword(password);
      await User.create({
        fullName,
        email,
        role,
        passwordHash,
        isActive: Boolean(isActive),
      });

      return res.redirect("/admin/users?status=success&message=Tạo người dùng thành công");
    } catch (error) {
      next(error);
    }
  }

  async showEditForm(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect("/admin/users?status=error&message=Không tìm thấy người dùng");
      }
      const user = await User.findById(id).lean();
      if (!user) {
        return res.redirect("/admin/users?status=error&message=Không tìm thấy người dùng");
      }
      return res.render("admin/UserForm", {
        navActive: "users",
        formTitle: "Chỉnh sửa người dùng",
        action: `/admin/users/${id}`,
        user,
        pageScript: "admin.js",
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect("/admin/users?status=error&message=Không tìm thấy người dùng");
      }
      const { fullName, email, password, role = "user", isActive } = req.body;
      const user = await User.findById(id);
      if (!user) {
        return res.redirect("/admin/users?status=error&message=Không tìm thấy người dùng");
      }

      const errors = [];
      if (!fullName) errors.push("Họ tên là bắt buộc.");
      if (!email) errors.push("Email là bắt buộc.");
      if (email && !emailPattern.test(email)) {
        errors.push("Email không đúng định dạng.");
      }
      if (password && password.length > 0 && password.length < 6) {
        errors.push("Mật khẩu tối thiểu 6 ký tự.");
      }

      if (errors.length) {
        return res.render("admin/UserForm", {
          navActive: "users",
          formTitle: "Chỉnh sửa người dùng",
          action: `/admin/users/${id}`,
          user: { _id: id, fullName, email, role, isActive: Boolean(isActive) },
          errors,
          pageScript: "admin.js",
        });
      }

      // prevent duplicate email
      const duplicateEmail = await User.findOne({ email, _id: { $ne: id } });
      if (duplicateEmail) {
        return res.render("admin/UserForm", {
          navActive: "users",
          formTitle: "Chỉnh sửa người dùng",
          action: `/admin/users/${id}`,
          user: { _id: id, fullName, email, role, isActive: Boolean(isActive) },
          errors: ["Email đã tồn tại."],
          pageScript: "admin.js",
        });
      }

      user.fullName = fullName;
      user.email = email;
      user.role = role;
      user.isActive = Boolean(isActive);
      if (password && password.length >= 6) {
        user.passwordHash = hashPassword(password);
      }
      await user.save();

      return res.redirect("/admin/users?status=success&message=Cập nhật người dùng thành công");
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect("/admin/users?status=error&message=Không tìm thấy người dùng");
      }
      await User.deleteOne({ _id: id });
      return res.redirect("/admin/users?status=success&message=Đã xoá người dùng");
    } catch (error) {
      next(error);
    }
  }

  async viewOrders(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.redirect("/admin/users?status=error&message=Không tìm thấy người dùng");
      }

      const user = await User.findById(id).lean();
      if (!user) {
        return res.redirect("/admin/users?status=error&message=Không tìm thấy người dùng");
      }

      const ordersRaw = await Order.find({ email: user.email }).lean().sort({ createdAt: -1 });
      const statusMap = {
        pending: { label: "Đơn mới", tone: "warning" },
        confirmed: { label: "Đã xác nhận", tone: "info" },
        shipping: { label: "Đang giao", tone: "info" },
        completed: { label: "Hoàn tất", tone: "success" },
        canceled: { label: "Đã huỷ", tone: "danger" },
      };

      const orders = ordersRaw.map((order) => ({
        ...order,
        createdAtLabel: order.createdAt
          ? new Date(order.createdAt).toLocaleString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh" })
          : "",
        statusLabel: statusMap[order.status]?.label ?? "Đơn mới",
        statusTone: statusMap[order.status]?.tone ?? "warning",
        itemCount: order.items?.length ?? 0,
      }));

      return res.render("admin/UserOrders", {
        navActive: "users",
        user,
        orders,
        pageScript: "admin.js",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
