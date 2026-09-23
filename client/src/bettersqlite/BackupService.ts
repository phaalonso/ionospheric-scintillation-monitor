import { SQLite } from "./database/DAO";
import path from "path";
import fs from "fs";
import logger from "../logger";
import { FileInfo, UploadService } from "./UploadService";
import { IPrnIndicesController, IPrnInfoController } from "../controller";

interface IBackupConfig {
    folder: string;
    backupInterval: number;
    //uploadInterval: number;
}

export class BackupService {
    private timeout?: NodeJS.Timeout;

    constructor(
        private dao: SQLite,
        private prnIndiceService: IPrnIndicesController,
        private prnInfoService: IPrnInfoController,
        private config: IBackupConfig,
        private uploadService: UploadService,
    ) {}

    public async backup() {
        const date = new Date();

        try {
            if (!fs.existsSync(this.config.folder)) {
                fs.mkdirSync(this.config.folder);
            }

            const destination = path.join(
                this.config.folder,
                `backup-${date.toISOString()}.db`,
            );

            if (this.dao.con.inTransaction) {
                throw Error("The database is already in a transaction");
            }

            const lastDateTime = await this.prnIndiceService.lastIndice();

            const transaction = this.dao.con.transaction(async (lastTime) => {
                if (!lastTime) {
                    logger.log(`Can't locate the last PrnIndices time`);
                }

                logger.log(`Backuping data up to ${lastTime}`);

                const res = await this.dao.con.backup(destination);

                await this.prnIndiceService.deleteBefore(lastTime);
                await this.prnInfoService.deleteBefore(lastTime);

                logger.log(
                    `Backup realizado! Total de páginas ${res.totalPages}, páginas restantes ${res.remainingPages}`,
                );
            });

            transaction.immediate(lastDateTime);
        } catch (err: any) {
            logger.exception(err);
            logger.log(`Error while making backup for ${date}`);
        }
    }

    private async uploadFile(name: string, path: string) {
        const info: FileInfo = {
            path,
            fileName: name,
        };

        logger.log(`Uploading the file to remote storage`);
        await this.uploadService.uploadFile(info);
    }

    public async sendToServer() {
        try {
            if (!this.uploadService.isConnected()) {
                await this.uploadService.connect();
            }

            const listFile = await fs.promises.readdir(this.config.folder);

            for (const file of listFile) {
                const filePath = path.join(this.config.folder, file);

                await this.uploadFile(file, filePath);

                fs.rm(filePath, () => {
                    logger.log(`Removing the file ${file} from local storage`);
                });
            }

            this.uploadService.disconnect();
        } catch (err: any) {
            logger.exception(err, "sendToServer");
        }
    }

    public hasAutoBackupEnabled() {
        return this.timeout !== undefined;
    }

    public async initAutoBackup() {
        const intervalFn = async () => {
            await this.backup();
            await this.sendToServer();
        };

        this.timeout = setInterval(
            intervalFn.bind(this),
            this.config.backupInterval,
        );
    }

    public async stopAutoBackup() {
        if (this.hasAutoBackupEnabled()) {
            clearInterval(this.timeout!);
        } else {
            throw Error("Auto backup is not initialized");
        }
    }
}
