import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { PackagesService } from "./packages.service";

export class PackagesController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const data = await PackagesService.list();
    res.status(200).json({ success: true, message: "Packages fetched", data });
  });

  static getOne = asyncHandler(async (req: Request, res: Response) => {
    const data = await PackagesService.getById(req.params.id);
    res.status(200).json({ success: true, message: "Package fetched", data });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const data = await PackagesService.create(req.body);
    res.status(201).json({ success: true, message: "Package created", data });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const data = await PackagesService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: "Package updated", data });
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const data = await PackagesService.remove(req.params.id);
    res.status(200).json({ success: true, message: "Package deleted", data });
  });
}