import { Request, Response } from 'express';
import { NextFunction } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';
import { SERVER } from '../config/server';
import { DecodedJWTContent } from '../routes/sessions';
import logger from "../logger";

export function requireAuthentication(req: Request, res: Response, next: NextFunction): unknown {
    const authHeader = req.headers.authorization;

    if (!authHeader || authHeader.length === 6) {
        return res.status(400).json({ message: 'Token JWT não encontrado' });
    }

    try {
        const [, token] = authHeader.split(' ');

        const decoded = jwt.verify(token, SERVER!.JWT!);

        logger.info(decoded);

        const { id } = decoded as DecodedJWTContent;
        req.user = { id };

        return next();
    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'Ocorreu um erro na autenticação' });
    }
}
