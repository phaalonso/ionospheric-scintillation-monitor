import { BackupService } from "../src/bettersqlite/BackupService";
import { SQLite } from "../src/bettersqlite/database/DAO";
import path from "path";
import { UploadService } from "../src/bettersqlite/UploadService";
import { PrnIndicesBetterSqlite } from "../src/bettersqlite/controllers/PrnIndicesBetterSqlite";
import { PrnInfoBetterSqlite } from "../src/bettersqlite/controllers/PrnInfoBetterSqlite";

async function backupTest() {
    const dao = new SQLite();

    const prnIndices = new PrnIndicesBetterSqlite(dao);
    const prnInfo = new PrnInfoBetterSqlite(dao);

    const ftp = new UploadService({
        host: "localhost",
        port: 21,
        user: "teste",
        password: "teste",
        backupPath: "~/backup/",
    });

    const backupService = new BackupService(
        dao,
        prnIndices,
        prnInfo,
        {
            folder: path.join(__dirname, "..", "backups"),
            backupInterval: 60000,
        },
        ftp,
    );

    //await backupService.backup(new Date());
    //await backupService.sendToServer();

    //await backupService.initAutoBackup();
    await backupService.backup();
}

backupTest();
