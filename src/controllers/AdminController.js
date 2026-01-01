import Book from "../model/product.js";
import Order from "../model/order.js";
import { normalizeBooksList } from "../helpers/book.helper.js";
import cloudinary from "../config/cloudinary.js";

const createSlug = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const formatDateLabel = (value) => {
  if (!value) {
    return "-";
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const buildRecentBooks = (books = []) =>
  books.slice(0, 4).map((book) => ({
    id: book._id,
    title: book.title,
    slug: book.slug,
    price: book.newPrice,
    stock: book.stock,
    updatedAtLabel: formatDateLabel(book.updatedAt ?? book.createdAt),
    statusTag: book.isFlashSale
      ? "Flash sale"
      : book.isActive
        ? "Đang hoạt động"
        : "Ẩn",
  }));

const LOW_STOCK_THRESHOLD = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Đang hiển thị" },
  { value: "hidden", label: "Đang ẩn" },
  { value: "flash", label: "Flash sale" },
  { value: "highlight", label: "Nổi bật" },
  { value: "low-stock", label: "Sắp hết hàng" },
];

const normalizeStatus = (value = "all") => {
  const match = STATUS_OPTIONS.find((option) => option.value === value);
  return match ? match.value : "all";
};

const buildStatusFilter = (status) => {
  switch (status) {
    case "active":
      return { isActive: true };
    case "hidden":
      return { isActive: false };
    case "flash":
      return { isFlashSale: true };
    case "highlight":
      return { isHighlight: true };
    case "low-stock":
      return { stock: { $lt: LOW_STOCK_THRESHOLD } };
    default:
      return {};
  }
};

const buildSearchFilter = (keyword = "") => {
  const normalized = keyword.trim();
  if (!normalized) {
    return null;
  }
  const regex = new RegExp(normalized, "i");
  return {
    $or: [{ title: regex }, { author: regex }, { slug: regex }, { category: regex }],
  };
};

const buildStats = (books = []) => {
  let totalStock = 0;
  let totalRevenue = 0;
  let activeCount = 0;
  let highlightCount = 0;
  let flashSaleCount = 0;
  let lowStockCount = 0;

  books.forEach((book) => {
    const stock = Number(book.stock) || 0;
    const sold = Number(book.sold) || 0;
    const price = Number(book.newPrice) || 0;
    totalStock += stock;
    totalRevenue += sold * price;
    if (book.isActive) activeCount += 1;
    if (book.isHighlight) highlightCount += 1;
    if (book.isFlashSale) flashSaleCount += 1;
    if (stock < LOW_STOCK_THRESHOLD) {
      lowStockCount += 1;
    }
  });

  return {
    totalBooks: books.length,
    totalStock,
    totalRevenue,
    activeCount,
    highlightCount,
    flashSaleCount,
    lowStockCount,
  };
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === "string") {
    return value === "on" || value === "true";
  }
  return Boolean(value);
};

const CLOUDINARY_FOLDER = "stories";

const toText = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

async function uploadCoverImage(file) {
  if (!file?.buffer?.length) return null;
  const dataUri = `data:${file.mimetype || "image/jpeg"};base64,${file.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: CLOUDINARY_FOLDER,
    resource_type: "image",
  });
  return result.secure_url;
}

class AdminController {
  constructor() {
    this.list = this.list.bind(this);
    this.showCreateForm = this.showCreateForm.bind(this);
    this.create = this.create.bind(this);
    this.showEditForm = this.showEditForm.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.buildPayload = this.buildPayload.bind(this);
  }

  async list(req, res, next) {
    try {
      const selectedCategory =
        typeof req.query.category === "string" ? req.query.category : "all";
      const selectedStatus = normalizeStatus(req.query.status);
      const keyword = typeof req.query.q === "string" ? req.query.q.trim() : "";

      const andFilters = [];
      if (selectedCategory && selectedCategory !== "all") {
        if (selectedCategory === "__empty__") {
          andFilters.push({
            $or: [{ category: { $exists: false } }, { category: "" }, { category: null }],
          });
        } else {
          andFilters.push({ category: selectedCategory });
        }
      }
      const statusFilter = buildStatusFilter(selectedStatus);
      if (Object.keys(statusFilter).length) {
        andFilters.push(statusFilter);
      }
      const searchFilter = buildSearchFilter(keyword);
      if (searchFilter) {
        andFilters.push(searchFilter);
      }
      const filters = andFilters.length ? { $and: andFilters } : {};

      const [allBooksRaw, filteredBooksRaw, categoriesRaw, ordersRaw] = await Promise.all([
        Book.find().lean().sort({ createdAt: -1 }),
        Book.find(filters).lean().sort({ createdAt: -1 }),
        Book.aggregate([
          {
            $group: {
              _id: "$category",
              total: { $sum: 1 },
              activeCount: { $sum: { $cond: ["$isActive", 1, 0] } },
              flashSaleCount: { $sum: { $cond: ["$isFlashSale", 1, 0] } },
              highlightCount: { $sum: { $cond: ["$isHighlight", 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Order.find().lean().sort({ createdAt: -1 }).limit(10),
      ]);

      const allBooks = normalizeBooksList(allBooksRaw);
      const books = normalizeBooksList(filteredBooksRaw);
      const stats = buildStats(allBooks);
      const recentBooks = buildRecentBooks(books);
      const statusMap = {
        pending: { label: "Đơn mới", tone: "warning", deliveryLabel: "Chưa giao", deliveryTone: "warning" },
        confirmed: { label: "Đã xác nhận", tone: "info", deliveryLabel: "Chưa giao", deliveryTone: "warning" },
        shipping: { label: "Đang giao", tone: "info", deliveryLabel: "Đang giao", deliveryTone: "info" },
        completed: { label: "Hoàn tất", tone: "success", deliveryLabel: "Đã giao", deliveryTone: "success" },
        canceled: { label: "Đã huỷ", tone: "danger", deliveryLabel: "Huỷ", deliveryTone: "danger" },
      };
      const orders = (ordersRaw ?? []).map((order) => {
        const statusInfo = statusMap[order.status] ?? statusMap.pending;
        return {
          ...order,
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
      const orderStats = orders.reduce(
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
      const lastOrderUpdatedLabel = new Date().toLocaleTimeString("vi-VN", { hour12: false });

      const categories = categoriesRaw.map((category) => {
        const rawName = typeof category._id === "string" ? category._id.trim() : "";
        return {
          name: rawName || "Chưa phân loại",
          value: rawName || "__empty__",
          total: category.total,
          activeCount: category.activeCount,
          flashSaleCount: category.flashSaleCount,
          highlightCount: category.highlightCount,
        };
      });
      const { message, status } = req.query;
      return res.render("admin/BookList", {
        books,
        stats,
        recentBooks,
        categories,
        filters: {
          category: selectedCategory,
          status: selectedStatus,
          q: keyword,
        },
        statusOptions: STATUS_OPTIONS,
        filteredCount: books.length,
        message,
        orders,
        orderStats,
        lastOrderUpdatedLabel,
        pageScript: "admin.js",
        status: status === "error" ? "error" : "success",
        navActive: "books",
      });
    } catch (error) {
      next(error);
    }
  }

  async showCreateForm(req, res, next) {
    try {
      const categories = await this.loadCategories();
      return res.render("admin/BookForm", {
        book: {},
        formTitle: "Tạo sách mới",
        action: "/admin/books",
        submitLabel: "Tạo sách",
        pageScript: "admin.js",
        categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const payload = await this.buildPayload(req.body, req.file);
      if (!payload.coverImage) {
        return res.redirect(
          "/admin/books?status=error&message=Vui lòng tải lên ảnh bìa từ máy"
        );
      }
      await Book.create(payload);
      return res.redirect("/admin/books?status=success&message=Sách đã được tạo thành công");
    } catch (error) {
      console.error("Create book error:", error);
      const message =
        error?.message ||
        (typeof error === "string" ? error : "Không thể tạo sách, vui lòng thử lại.");
      return res.redirect(
        `/admin/books?status=error&message=${encodeURIComponent(message)}`
      );
    }
  }

  async showEditForm(req, res, next) {
    try {
      const { id } = req.params;
      const book = await Book.findById(id).lean();
      if (!book) {
        return res.redirect(
          "/admin/books?status=error&message=Sách bạn tìm kiếm không tồn tại"
        );
      }
      const categories = await this.loadCategories();
      return res.render("admin/BookForm", {
        book,
        formTitle: "Chỉnh sửa thông tin sách",
        action: `/admin/books/${id}`,
        submitLabel: "Cập nhật sách",
        pageScript: "admin.js",
        categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await Book.findById(id).lean();
      if (!existing) {
        return res.redirect(
          "/admin/books?status=error&message=Cập nhật thất bại do sách không tồn tại"
        );
      }

      const payload = await this.buildPayload(req.body, req.file, existing.coverImage);
      if (!payload.coverImage) {
        return res.redirect(
          "/admin/books?status=error&message=Vui lòng tải lên ảnh bìa từ máy"
        );
      }
      const updated = await Book.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
      });
      if (!updated) {
        return res.redirect(
          "/admin/books?status=error&message=Cập nhật thất bại do sách không tồn tại"
        );
      }
      return res.redirect(
        "/admin/books?status=success&message=Sách đã được cập nhật"
      );
    } catch (error) {
      console.error("Update book error:", error);
      const message =
        error?.message ||
        (typeof error === "string" ? error : "Không thể cập nhật sách, vui lòng thử lại.");
      return res.redirect(
        `/admin/books?status=error&message=${encodeURIComponent(message)}`
      );
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await Book.findByIdAndDelete(id);
      return res.redirect(
        "/admin/books?status=success&message=Sách đã được xoá khỏi hệ thống"
      );
    } catch (error) {
      next(error);
    }
  }

  async buildPayload(body, file, currentCoverImage = "") {
    const titleValue = toText(body.title);
    const slugValue = toText(body.slug) || createSlug(titleValue);
    const existingCover = toText(currentCoverImage);
    const uploadedCoverImage = await uploadCoverImage(file);

    return {
      title: titleValue,
      slug: slugValue,
      author: toText(body.author),
      category: toText(body.category),
      publisher: toText(body.publisher),
      supplier: toText(body.supplier),
      publishYear: toNumber(body.publishYear, null),
      oldPrice: toNumber(body.oldPrice, 0),
      newPrice: toNumber(body.newPrice, toNumber(body.price, 0)),
      price: toNumber(body.price, toNumber(body.newPrice, 0)),
      sold: toNumber(body.sold, 0),
      discountPercent: toNumber(body.discountPercent, 0),
      stock: toNumber(body.stock, 0),
      description: toText(body.description),
      longDescription: toText(body.longDescription),
      coverImage: uploadedCoverImage || existingCover,
      size: toText(body.size),
      coverType: toText(body.coverType),
      isActive: toBoolean(body.isActive, true),
      isHighlight: toBoolean(body.isHighlight, false),
      isFlashSale: toBoolean(body.isFlashSale, false),
    };
  }

  async loadCategories() {
    const categoriesRaw = await Book.distinct("category");
    return categoriesRaw
      .map((category) =>
        typeof category === "string" ? category.trim() : ""
      )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "vi", { sensitivity: "base" }));
  }
}

export default new AdminController();
