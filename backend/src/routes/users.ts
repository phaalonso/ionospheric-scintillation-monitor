import { Prisma } from "@prisma/client";
import { celebrate, Joi, Segments } from "celebrate";
import { Router } from "express";
import { requireAdmin } from "../middlewares/requireAdmin";
import { requireAuthentication } from "../middlewares/requireAuthentication";
import UserService from "../services/UserService";
import logger from "../logger";

const user = Router();

user.get(
	'/',
	requireAuthentication,
	requireAdmin,
	async (req, res) => {
		const users = await UserService.findMany();

		return res.json(users);
	});

user.get(
	'/:id',
	requireAuthentication,
	celebrate({
		[Segments.PARAMS]: Joi.object().keys({
			id: Joi.number().required().integer(),
		}),
	}),
	async (req, res) => {
		const { id } = req.params;

		// Restringe para pesquisar seus próprios dados, ou permitir
		// pesquisar dos outros caso seja um administrador

		const users = await UserService.findById(Number.parseInt(id));

		return res.json(users);
	}
);

user.post(
	'/',
	requireAuthentication,
	requireAdmin,
	celebrate({
		[Segments.BODY]: Joi.object().keys({
			nome: Joi.string().required(), 
			nickname: Joi.string().required(), 
			email: Joi.string().required().email(), 
			password: Joi.string().required().trim().min(6), 
			administrator: Joi.bool().required()
		})
	}),
	async (req, res, next) => {
		try {
			const { nome, nickname, email, password, administrator } = req.body;

			const result = await UserService.create({
				nome, 
				nickname, 
				email, 
				password, 
				administrator: administrator || false
			});

			return res.status(201).json({ id: result });
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.meta)
					return res.status(409).json({
						message: `Conflict in ${error.meta['target'].join(', ')}`
					});
				else
					return res.sendStatus(409);
			}

			return next(error);
		}
	}
);

user.put(
	'/:id',
	requireAuthentication,
	requireAdmin,
	celebrate({
		[Segments.PARAMS]: Joi.object().keys({
			id: Joi.number().required().integer(),
		}),
		[Segments.BODY]: Joi.object().keys({
			nome: Joi.string().required(), 
			nickname: Joi.string().required(), 
			email: Joi.string().required().email(), 
			password: Joi.string().optional().trim().min(6), 
			administrator: Joi.bool().required()
		}),
	}),
	async (req, res, next) => {
		try {
			const id = parseInt(req.params.id);
			const { nome, nickname, email, password, administrator } = req.body;

			if (isNaN(id)) {
				return res.status(400).send();
			}

			if (!administrator) {
				const hasOtherAdmin = await UserService.hasAnotherAdminThan(id);

				if (!hasOtherAdmin) {
					return res.status(412).json({
						message: 'Tem que ter pelo menos um adminsitrador',
					});
				}
			}

			const result = await UserService.edit(id, {
				nome, 
				nickname, 
				email, 
				password, 
				administrator: administrator || false
			});

			return res.status(200).json({ id: result });
		} catch (error: unknown) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code == 'P2025') {
					logger.error(error);
					return res.status(404).send();
				}
				if (error.code == 'P2002') {
					return res.status(409).json({
						message: `Conflict in ${error.meta?.target?.join(', ')}`
					});
				}
				else
					return res.sendStatus(409);
			}

			return next(error);
		}
	});

user.delete(
	'/:id',
	requireAuthentication,
	requireAdmin,
	celebrate({
		[Segments.PARAMS]: Joi.object().keys({
			id: Joi.number().required().integer(),
		}),
	}),
	async (req, res) => {
		try {
			const { id } = req.params;

			await UserService.delete(parseInt(id));

			return res.status(200).send();
		} catch (error) {
			logger.error(error);
			return res.sendStatus(404);
		}
	});

export default user;
