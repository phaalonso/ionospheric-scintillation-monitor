import { Prisma } from "@prisma/client";
import { errors } from "celebrate";
import { Request, Response, Router } from "express";
import prisma from "./client";
import sessions from "./routes/sessions";
import user from "./routes/users";
import { statsRouter } from './routes/stats';
import logger from "./logger";

const router = Router();

router.use('/user', user);
router.use('/session', sessions);
router.use('/stats', statsRouter);

interface IIndices {
	prn: number,
	mediasnr: number,
	mediaazi: number,
	mediaelev: number,
	tinicial: string,
	tfinal: string,
	dpsnr: number,
	s4: number,
}

interface IndicesPorPrn {
	prn: number;
	indices: Omit<IIndices, 'prn'>[];
}

router.get('/scintilation', async (req, res) => {
	try {
		const prns = await prisma.prnindices.groupBy({
			by: ['prn']
		});

		//@ts-ignore
		const data: IndicesPorPrn[] = prns;
		logger.info(prns);

		for (const prn of data) {
			const scintilation = await prisma.prnindices.findMany({ 
				select: {
					mediasnr: true,
					mediaazi: true,
					mediaelev: true,
					tinicial: true,
					tfinal: true,
					s4: true,
					dpsnr: true
				},
				orderBy: {
					tinicial: 'asc',
				},
				where: {
					prn: prn.prn
				}
			});

			prn.indices = scintilation;
		}

		return res.json({ data });
	} catch (error) {
		logger.error(error);
		res.send(400).json({ message: 'Erro desconhecido' });
	}
});

router.use((req, res) => {
	return res.sendStatus(404);
});

router.use(errors());

router.use((error: any, req: Request, res: Response) => {
	logger.info('error handler')
	logger.info('Error type %s', typeof error);
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		logger.error(error.message);
		return res.sendStatus(409);
	}
	logger.error(error);

	return res.sendStatus(400);
});

export default router;
