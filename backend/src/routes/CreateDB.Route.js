import express from "express";
import BookController from "../controllers/BookController.js";

const CreateDBRoute = express.Router();

CreateDBRoute.post("/", BookController.create);

export default CreateDBRoute;
