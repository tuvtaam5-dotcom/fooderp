import { Router } from "express";
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
} from "./users.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

// Per RBAC Matrix §2.15: this entire module is restricted to מנהל מערכת.
router.use(requireAuth, requireRole("מנהל מערכת"));

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/deactivate", deactivateUser);
router.patch("/:id/activate", activateUser);

export default router;
