import { Router } from "express";
import { drive, mem } from "node-os-utils";

const statsRouter = Router();

statsRouter.get("/", (req, res) => {
    return res.send();
});

statsRouter.get("/disk", async (req, res) => {
    const data = await drive.info("/");

    return res.json(data);
});

statsRouter.get("/ram", async (req, res) => {
    const data = await mem.used();

    return res.json(data);
});

export { statsRouter };
