import { NextFunction, Request, Response } from "express";
import UserService from "../services/UserService";

export async function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        if (req.user && req.user.id) {
            const user = await UserService.findById(req.user.id);

            if (user && user.administrator) return next();
        }

        return res.sendStatus(403);
    } catch (error) {
        console.log(error);
        return res.status(400).send();
    }
}
