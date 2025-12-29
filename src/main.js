import express from 'express'
import morgan from 'morgan';
import { engine } from 'express-handlebars';
import dotenv from 'dotenv'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import path from 'path'
import { fileURLToPath } from 'url';
import ConnectDB from './config/db.js';
import cartRouter from "./routes/Cart.Route.js"
import HomeRoute from './routes/Home.Route.js';
import CollectionRoute from './routes/Collection.Route.js';
import CreateDBRoute from './routes/CreateDB.Route.js';
import AdminRoute from './routes/Admin.Route.js';
import AuthRoute from './routes/Auth.Route.js';
import OrderRoute from "./routes/Order.Route.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import compression from 'compression';
dotenv.config({ path: path.join(__dirname, '.env') });
ConnectDB.getInstance();

const app = express()
import { Router } from 'express';

app.use(express.json())
app.use(compression())
app.use(morgan('combined'))
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret_book_shop', // đặt tạm
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL || process.env.MONGODB_CONNECT, // lấy chuỗi Mongo đang dùng
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 ngày
    },
  })
)

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user ?? null;
  res.locals.searchQuery = typeof req.query.q === "string" ? req.query.q : "";
  next();
});

// chuyển số thành VNI có đấu chấm  
const hbs = engine({
  helpers: {
    formatPrice(value) {
      if (value === undefined || value === null) return "";
      const number = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(number)) return "";
      return `${number.toLocaleString("vi-VN")}đ`;
    },
    urlEncode(value) {
      if (value === undefined || value === null) return "";
      return encodeURIComponent(value);
    },
    increment(value) {
      const number = Number(value);
      return Number.isNaN(number) ? value : number + 1;
    },
    eq(value, other) {
      return String(value) === String(other);
    },
    isAdmin(role) {
      return String(role ?? "")
        .trim()
        .toLowerCase() === "admin";
    },
  },
});
app.engine('handlebars', hbs);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'resource/views'));

const PORT = 5000

app.use(express.static(path.join(__dirname, 'public')))
// ensure standalone JS assets are reachable even if current route adds prefixes
app.use('/js', express.static(path.join(__dirname, 'public/js')))

app.get("/search", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) {
    return res.redirect("/collection");
  }
  return res.redirect(`/collection?q=${encodeURIComponent(q)}`);
});

const routeConfigs = [
  { path: '/cart', handler: cartRouter },
  { path: '/orders', handler: OrderRoute },
  { path: '/collection', handler: CollectionRoute },
  { path: '/', handler: HomeRoute },
  { path: '/api/books', handler: CreateDBRoute },
  { path: '/admin', handler: AdminRoute },
  { path: '/auth', handler: AuthRoute },
]
routeConfigs.forEach(({ path, handler }) => app.use(path, handler))

// running sever
app.listen(PORT, ()=>{
    console.log("Sever running on PORT ",PORT);
})
