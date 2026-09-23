import { Worker } from "worker_threads";
import { AsyncResource } from "async_hooks";
import { EventEmitter } from "events";
import path from "path";
import logger from "../logger";
import { CustomData } from "../services/processData";

const kTaskInfo = Symbol("kTaskInfo");
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent");

type fn = (...any) => any;

type Task = {
    task: any;
    callback: fn;
};

export interface IWorkerMessages {
    data?: CustomData[];
    time?: Date;
}

class WorkerPoolTaskInfo extends AsyncResource {
    private callback: fn;

    constructor(callback: fn) {
        super("WorkerPoolTaskInfo");

        this.callback = callback;
    }

    public done(err: Error, result: any) {
        this.runInAsyncScope(this.callback, null, err, result);
        this.emitDestroy();
    }
}

export class WorkerPool extends EventEmitter {
    private numThreads: number;
    private workers: Worker[];
    private freeWorkers: Worker[];
    private tasks: Task[];

    constructor(numThreads: number) {
        super();

        logger.log(`Starting worker pool with ${numThreads} workers`);

        this.numThreads = numThreads;
        this.workers = [];
        this.freeWorkers = [];
        this.tasks = [];

        for (let i = 0; i < this.numThreads; i++) {
            this.addNewWorker();
        }

        this.on(kWorkerFreedEvent, () => {
            logger.log(
                `Freed worker, workers on Pool ${this.freeWorkers.length}`,
            );
            // No evento de uma worker_thread possuir seu trabalho concluido, e haver mais processos a serem realizados
            // ela irá continuar processando a próxima tarefa
            if (this.tasks.length > 0) {
                const { task, callback } = this.tasks.shift();
                this.runTask(task, callback);
            }
        });
    }

    public addNewWorker() {
        const worker = new Worker(path.resolve(__dirname, "./task.js"));

        worker.on("message", (result) => {
            // Em caso de sucesso, chama a callback que foi passada para `runTask`
            // remove `TaskInfo` associado com o Worker e o demarca como free novamente
            worker[kTaskInfo].done(null, result);
            worker[kTaskInfo] = null;
            this.freeWorkers.push(worker);
            this.emit(kWorkerFreedEvent);
        });

        worker.on("error", (err) => {
            console.log(worker[kTaskInfo]);
            if (worker[kTaskInfo]) worker[kTaskInfo].done(err, null);

            logger.exception(err);
            logger.log("Error on worker, creating a new one!");
            this.workers.splice(this.workers.indexOf(worker), 1);
            this.addNewWorker();
        });

        this.workers.push(worker);
        this.freeWorkers.push(worker);
        this.emit(kWorkerFreedEvent);
    }

    public runTask(task: any, callback: fn) {
        if (this.freeWorkers.length === 0) {
            logger.log(
                `Not engouth workers, putting task in queue! Queue: ${this.tasks.length}`,
            );
            this.tasks.push({ task: task, callback });
            return;
        }

        const worker = this.freeWorkers.pop();
        worker[kTaskInfo] = new WorkerPoolTaskInfo(callback);
        worker.postMessage(task);
        logger.log(
            `Worker grabing a new task! Remaining workers: ${this.freeWorkers.length}`,
        );
    }

    public close() {
        for (const worker of this.workers) {
            worker.terminate();
        }
    }
}
