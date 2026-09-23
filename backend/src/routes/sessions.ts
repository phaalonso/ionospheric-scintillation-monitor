import { Router } from "express";
import jwt from "jsonwebtoken";
import { SERVER } from "../config/server";
import { requireAuthentication } from "../middlewares/requireAuthentication";
import UserService from "../services/UserService";
import logger from "../logger";

export interface DecodedJWTContent {
    id: number;
}

const sessions = Router();

sessions.post("/", async (req, res) => {
    const { email, password } = req.body;

    try {
        const valid = await UserService.login({ email, password });

        if (!valid) {
            return res.status(400).json({
                message: "Can't find an user with this email and password",
            });
        }

        const data: DecodedJWTContent = {
            id: valid.id,
        };

        const token = jwt.sign(data, SERVER!.JWT!, { expiresIn: 60 * 60 * 5 }); // Expira em 5 horas

        return res.json({ token, user: valid });
    } catch (err) {
        logger.error(err);
        return res
            .status(400)
            .json({ message: "There was a error processing the login" });
    }
});

// Require authentication awalys does jwt.verify, so if it pass the middleware the token is valid
sessions.get("/validate", requireAuthentication, (_req, res) =>
    res.status(200).send(),
);

export default sessions;
