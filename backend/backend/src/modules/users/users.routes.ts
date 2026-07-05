import { Router } from "express";
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
} from "./users.controller";

const router = Router();

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/deactivate", deactivateUser);
router.patch("/:id/activate", activateUser);

export default router;
