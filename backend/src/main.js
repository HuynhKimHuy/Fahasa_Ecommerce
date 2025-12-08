import express from 'express'
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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
ConnectDB.getInstance();

const app = express()


app.use(express.json())
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

// chuyển số thành VNI có đấu chấm  
const hbs = engine({
  helpers: {
    formatPrice(value) {
      if (value === undefined || value === null) return "";
      const number = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(number)) return "";
      return `${number.toLocaleString("vi-VN")}đ`;
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


app.use("/cart", cartRouter)
app.use('/collection', CollectionRoute)
app.use('/', HomeRoute)
app.use('/api/books', CreateDBRoute)
app.listen(PORT, ()=>{
    console.log("Sever running on PORT ",PORT);
})
