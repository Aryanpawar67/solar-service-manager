import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import staffRouter from "./staff";
import servicesRouter from "./services";
import subscriptionsRouter from "./subscriptions";
import paymentsRouter from "./payments";
import contactRouter from "./contact";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/customers", customersRouter);
router.use("/staff", staffRouter);
router.use("/services", servicesRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/payments", paymentsRouter);
router.use("/contact", contactRouter);
router.use("/analytics", analyticsRouter);

export default router;
