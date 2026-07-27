import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middleware/validate";
import { usersController } from "./users.controller";
import { createUserSchema, idParamSchema, updateUserSchema } from "./users.schema";

export const usersRouter = Router();

usersRouter.get("/", asyncHandler(usersController.list));
usersRouter.get("/:id", validate({ params: idParamSchema }), asyncHandler(usersController.getOne));
usersRouter.post("/", validate({ body: createUserSchema }), asyncHandler(usersController.create));
usersRouter.put(
  "/:id",
  validate({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(usersController.update)
);
usersRouter.delete("/:id", validate({ params: idParamSchema }), asyncHandler(usersController.remove));
