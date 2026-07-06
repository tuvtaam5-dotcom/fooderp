import { Router } from "express";
import { listDepartments } from "./departments.controller";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";

const router = Router();

router.use(requireAuth, requireRole("מנהל מערכת"));

router.get("/", listDepartments);

export default router;
