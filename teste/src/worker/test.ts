import { WorkerPool } from "./WorkerPool";
import os from "os";

const pool = new WorkerPool(os.cpus().length);

const array = [12390, 31293, 1293819];

pool.runTask(array, (err, response) => {
    console.log("response", response);
    // pool.close();
});
