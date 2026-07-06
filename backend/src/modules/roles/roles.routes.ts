import { Router } from "express";
import { listRoles } from "./roles.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

router.use(requireAuth, requireRole("מנהל מערכת"));

router.get("/", listRoles);

export default router;
