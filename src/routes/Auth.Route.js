import express from "express";
import AuthController from "../controllers/AuthController.js";

const AuthRoute = express.Router();

AuthRoute.get("/login", AuthController.showLogin);
AuthRoute.post("/login", AuthController.login);
AuthRoute.get("/register", AuthController.showRegister);
AuthRoute.post("/register", AuthController.register);
AuthRoute.get("/logout", AuthController.showLogout);
AuthRoute.post("/logout", AuthController.logout);

export default AuthRoute;
