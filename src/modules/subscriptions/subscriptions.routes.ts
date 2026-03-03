import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import { SubscriptionsController } from "./subscriptions.controller";
import { selectPackageSchema } from "./subscriptions.validators";

export const subscriptionsRoutes = Router();

// user must be logged in
subscriptionsRoutes.use(requireAuth);

// list available packages to choose
subscriptionsRoutes.get("/packages", SubscriptionsController.listPackages);

// current active package
subscriptionsRoutes.get("/me", SubscriptionsController.getMyActive);

// history
subscriptionsRoutes.get("/history", SubscriptionsController.getMyHistory);

// select/switch package
subscriptionsRoutes.post("/select", validate(selectPackageSchema), SubscriptionsController.selectPackage);