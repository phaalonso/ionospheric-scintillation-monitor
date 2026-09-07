import { NextFunction, Request, Response } from "express";
import UserService from "../services/UserService";
import logger from "../logger";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        if (req.user?.id) {
            const user = await UserService.findById(req.user.id);

            if (user?.administrator)
                return next();
        }

        return res.sendStatus(403);
    } catch (error) {
        logger.error(error);
        return res.status(400).send();
    }
}
