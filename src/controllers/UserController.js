import User from "../model/user.js";

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
          ? new Date(user.createdAt).toLocaleString("vi-VN", { hour12: false })
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
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
