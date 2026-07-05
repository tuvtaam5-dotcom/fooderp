import { Router } from "express";
import { listRoles } from "./roles.controller";

const router = Router();

router.get("/", listRoles);

export default router;
