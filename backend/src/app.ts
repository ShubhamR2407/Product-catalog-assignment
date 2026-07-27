import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { usersRouter } from "./modules/users/users.routes";
import { categoriesRouter } from "./modules/categories/categories.routes";
import { productsRouter } from "./modules/products/products.routes";
import { jobsRouter } from "./modules/jobs/jobs.routes";

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use("/uploads", express.static(env.uploadDir));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/users", usersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/jobs", jobsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
