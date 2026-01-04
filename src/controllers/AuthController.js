import User from "../model/user.js";
import { hashPassword, verifyPassword } from "../helpers/auth.helper.js";

const safeRedirect = (value) => {
  if (!value || typeof value !== "string") {
    return "/";
  }
  return value.startsWith("/") ? value : "/";
};

const buildSessionUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
});

const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

class AuthController {
  constructor() {
    this.renderLogin = this.renderLogin.bind(this);
    this.renderRegister = this.renderRegister.bind(this);
    this.showLogin = this.showLogin.bind(this);
    this.login = this.login.bind(this);
    this.showRegister = this.showRegister.bind(this);
    this.register = this.register.bind(this);
    this.showLogout = this.showLogout.bind(this);
    this.logout = this.logout.bind(this);
  }

  renderLogin(res, payload = {}) {
    return res.render("auth/Login", {
      error: "",
      message: "",
      status: "",
      email: "",
      redirect: "/",
      ...payload,
    });
  }

  renderRegister(res, payload = {}) {
    return res.render("auth/Register", {
      errors: [],
      fullName: "",
      email: "",
      adminCode: "",
      redirect: "/",
      ...payload,
    });
  }

  showLogin(req, res) {
    const redirect = safeRedirect(req.query.redirect ?? "/");
    const message = typeof req.query.message === "string" ? req.query.message : "";
    const status =
      req.query.status === "success"
        ? "success"
        : req.query.status === "error"
          ? "error"
          : message
            ? "success"
            : "";
    return this.renderLogin(res, { redirect, message, status });
  }

  async login(req, res, next) {
    try {
      const email = (req.body.email ?? "").trim().toLowerCase();
      const password = req.body.password ?? "";
      const redirectTarget = safeRedirect(req.body.redirect ?? req.query.redirect ?? "/");

      if (!email || !password) {
        return this.renderLogin(res, {
          error: "Vui lòng nhập email và mật khẩu.",
          email,
          redirect: redirectTarget,
        });
      }
      if (email && !emailPattern.test(email)) {
        return this.renderLogin(res, {
          error: "Email không đúng định dạng. Vui lòng kiểm tra lại.",
          email,
          redirect: redirectTarget,
        });
      }

      const user = await User.findOne({ email });
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return this.renderLogin(res, {
          error: "Email hoặc mật khẩu không chính xác.",
          email,
          redirect: redirectTarget,
        });
      }

      if (!user.isActive) {
        return this.renderLogin(res, {
          error: "Tài khoản của bạn đang bị khoá. Vui lòng liên hệ quản trị viên.",
          email,
          redirect: redirectTarget,
        });
      }

      const finalRedirect = user.role === "admin" ? "/admin/books" : redirectTarget;
      return req.session.regenerate((sessionError) => {
        if (sessionError) {
          return next(sessionError);
        }
        req.session.user = buildSessionUser(user);
        return req.session.save((saveError) => {
          if (saveError) {
            return next(saveError);
          }
          return res.redirect(finalRedirect);
        });
      });
    } catch (error) {
      next(error);
    }
  }

  showRegister(req, res) {
    const redirect = safeRedirect(req.query.redirect ?? "/");
    return this.renderRegister(res, { redirect });
  }

  async register(req, res, next) {
    try {
      const fullName = (req.body.fullName ?? "").trim();
      const email = (req.body.email ?? "").trim().toLowerCase();
      const password = req.body.password ?? "";
      const confirmPassword = req.body.confirmPassword ?? "";
      const adminCode = (req.body.adminCode ?? "").trim();
      const redirectTarget = safeRedirect(req.body.redirect ?? req.query.redirect ?? "/");

      const errors = [];
      if (!fullName) {
        errors.push("Họ tên là bắt buộc.");
      }
      if (!email) {
        errors.push("Email là bắt buộc.");
      } else if (!emailPattern.test(email)) {
        errors.push("Email không đúng định dạng.");
      }
      if (!password) {
        errors.push("Mật khẩu là bắt buộc.");
      }
      if (password && password.length < 6) {
        errors.push("Mật khẩu tối thiểu 6 ký tự.");
      }
      if (password !== confirmPassword) {
        errors.push("Mật khẩu xác nhận không khớp.");
      }

      if (errors.length) {
        return this.renderRegister(res, {
          errors,
          fullName,
          email,
          redirect: redirectTarget,
          adminCode,
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        errors.push("Email này đã được đăng ký trước đó.");
        return this.renderRegister(res, {
          errors,
          fullName,
          email,
          redirect: redirectTarget,
          adminCode,
        });
      }

      const passwordHash = hashPassword(password);
      const role =
        adminCode && adminCode === process.env.ADMIN_ACCESS_CODE ? "admin" : "user";

      const finalRedirect = role === "admin" ? "/admin/books" : redirectTarget;
      const user = await User.create({ fullName, email, passwordHash, role });

      return req.session.regenerate((sessionError) => {
        if (sessionError) {
          return next(sessionError);
        }
        req.session.user = buildSessionUser(user);
        return req.session.save((saveError) => {
          if (saveError) {
            return next(saveError);
          }
          return res.redirect(finalRedirect);
        });
      });
    } catch (error) {
      next(error);
    }
  }

  showLogout(req, res) {
    const user = req.session?.user;
    if (!user) {
      return res.redirect("/auth/login?status=error&message=Bạn cần đăng nhập trước.");
    }
    return res.render("auth/Logout", { user });
  }

  async logout(req, res, next) {
    try {
      const message = encodeURIComponent("Bạn đã đăng xuất thành công.");
      if (!req.session) {
        return res.redirect(`/auth/login?status=success&message=${message}`);
      }
      return req.session.destroy((sessionError) => {
        if (sessionError) {
          return next(sessionError);
        }
        res.clearCookie("connect.sid");
        return res.redirect(`/auth/login?status=success&message=${message}`);
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
