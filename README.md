# Fahasa_Ecommerce — Tài liệu dự án

Website bán sách/truyện xây dựng với **Node.js + Express + MongoDB**. Nội dung dưới đây bám theo bộ tiêu chí chấm điểm nhưng điều chỉnh cho công nghệ hiện tại (không dùng PHP/MySQL).

## 1. Phân tích & Thiết kế
- **CSDL (MongoDB/Mongoose)**: Model `book`, `order`, `user` (admin & khách), `cart` session-side. Thuộc tính chính của `book`: `title, slug, author, category, publisher, supplier, publishYear, oldPrice, newPrice, price, discountPercent, sold, stock, description, longDescription, coverImage, size, coverType, isActive, isHighlight, isFlashSale, createdAt, updatedAt`.
- **Quan hệ**: `order.items[*].book` tham chiếu `book`; `order.user` tham chiếu `user`. Dùng `ref` trong schema.
- **Kiểu dữ liệu**: Number cho giá/stock, Boolean cho cờ, String cho text, Date cho timestamps.
- **Tệp DB mẫu**: Chưa kèm dump; có thể tự seed bằng gọi API `/api/books` hoặc thêm script seed nếu cần.

## 2. Cấu trúc thư mục
- `src/main.js` khởi động server, middleware, view engine.
- `src/config/` cấu hình Mongo (`db.js`), Cloudinary (`cloudinary.js`).
- `src/controllers/` nghiệp vụ (Home, Collection, Cart, Order, Auth, Admin, Book API).
- `src/routes/` định tuyến (client, admin, auth, cart, orders, API books).
- `src/model/` Mongoose schemas.
- `src/resource/views/` giao diện Handlebars (client + admin).
- `src/resource/scss/` nguồn SCSS; `src/public/` tài nguyên tĩnh sau build CSS/JS.

## 3. Công nghệ chính
- Node.js (ESM), Express, express-handlebars.
- Mongoose (MongoDB), connect-mongo (session store), express-session.
- Multer (nhận file), Cloudinary (lưu ảnh bìa).
- SCSS biên dịch bằng `sass`; morgan, compression.

## 4. Cài đặt & chạy
1) Cài Node.js v20+.  
2) Cài phụ thuộc: `npm install`  
3) Tạo `src/.env`:
```
MONGODB_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?appName=Cluster0
SESSION_SECRET=<chuoi_bao_mat>
# Cloudinary: chọn 1 trong 2
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
# hoặc
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```
4) Biên dịch SCSS (tuỳ chọn trước khi chạy): `npm run scss`  
5) Chạy dev: `npm run dev` (nodemon)  
   Chạy thường: `npm start`  
Ứng dụng lắng nghe `http://localhost:5000`.

## 5. Tính năng khách hàng
- Trang chủ, danh mục, tìm kiếm, chi tiết sách.
- Giỏ hàng (session), thêm/xoá/cập nhật số lượng.
- Đặt hàng: lưu `order` với items, tính tổng.
- Đăng ký/đăng nhập, lưu session người dùng.
- Lịch sử đơn (trang `/orders`), xem chi tiết đơn.

## 6. Tính năng admin
- Đăng nhập admin, redirect về `/admin/books`.
- Dashboard: thống kê số lượng sách, flash sale, tồn kho thấp, đơn mới (hiển thị top đơn gần đây).
- Quản lý sách (CRUD): form tạo/sửa, upload ảnh bìa lên Cloudinary, lọc theo danh mục/trạng thái, tìm kiếm.
- Quản lý đơn hàng: danh sách, cập nhật trạng thái.
- Quản lý người dùng: danh sách, tạo/sửa/xoá tài khoản.

## 7. Upload ảnh bìa (Cloudinary)
- Admin create/edit: form `multipart/form-data`, field `coverImage` là file ảnh; upload bằng Cloudinary SDK, lưu `secure_url` vào `coverImage`.
- API `/api/books` (POST): cũng nhận `multipart/form-data` với `coverImage` file + các field text bắt buộc; trả về JSON sách đã tạo.

## 8. Kiểm tra & bảo mật
- Dùng session cho auth; middleware `requireAdmin` bảo vệ trang admin.
- Multer giới hạn 5MB, chỉ nhận file ảnh (client nên gửi đúng MIME).
- Sanitize input trong controller (ép kiểu number/boolean/text).
- XSS: view render bằng Handlebars mặc định escape; phần mô tả dài chèn HTML cần đảm bảo nguồn tin cậy.
- SQL injection không áp dụng (MongoDB + Mongoose); vẫn cần validate đầu vào server-side.

## 9. Script npm
- `npm run dev` — chạy server với nodemon.
- `npm start` — chạy server thường.
- `npm run scss` — build SCSS -> CSS.
- `npm run scss:watch` — watch SCSS.

## 10. Checklist nhanh trước bàn giao
- [ ] `.env` cấu hình đủ MongoDB + Cloudinary.  
- [ ] Upload ảnh bìa hoạt động (form admin + API).  
- [ ] Có ít nhất vài sách mẫu (tạo qua `/admin/books/new` hoặc `/api/books`).  
- [ ] Tài khoản admin đã tạo trong DB (tạo thủ công qua Mongo hoặc trang đăng ký + chỉnh role).  
- [ ] Điều hướng client: home, collection, chi tiết, giỏ, đơn hàng; admin: books, orders, users.  
- [ ] SCSS đã build, assets phục vụ từ `src/public`.  
- [ ] Kiểm tra thông báo lỗi/thành công hiển thị rõ ràng.

## 11. Liên hệ / ghi chú
- Mọi cấu hình môi trường đọc từ `src/.env`.  
- Cloudinary đọc biến ngay tại `src/config/cloudinary.js` (tự load `.env`).  
- Muốn seed dữ liệu nhanh: dùng Postman/cURL gửi nhiều request `POST /api/books` với ảnh.  

Ngày cập nhật: 29/12/2025  
Giảng viên tham chiếu: LE THUY DAON TRANG  
Khoa: Công nghệ thông tin
