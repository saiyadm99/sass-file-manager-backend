import { Router } from "express";

export const healthRoutes = Router();

healthRoutes.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OK",
    time: new Date().toISOString()
  });
});