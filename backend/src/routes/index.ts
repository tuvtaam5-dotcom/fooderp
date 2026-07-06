import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import usersRoutes from "../modules/users/users.routes";
import rolesRoutes from "../modules/roles/roles.routes";
import departmentsRoutes from "../modules/departments/departments.routes";

const router = Router();

// All routes are versioned under /v1, per API Specification.
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/departments", departmentsRoutes);

export default router;
