export type ModuleImport = {
    [modulePath: string]: string | boolean | {
        [importName: string]: string | boolean;
    };
};
export type ImportsInput = string | string[] | ModuleImport;
export type WorkerHelper = {
    run: (message: any, transfer?: Transferable[]) => Promise<any>;
    terminate: () => void;
    addPort: (port: Worker) => void;
    addCallback: (callback?: (data: any) => void, oneOff?: boolean) => number;
    removeCallback: (cb: number) => void;
    setLoop: (interval: any, message: any, transfer: any) => void;
    setAnimation: (message: any, transfer: any) => void;
    stop: () => void;
    worker: Worker;
    callbacks: {
        [key: number]: (data: any, cb?: number) => void;
    };
};
export type WorkerPoolHelper = {
    run: (message: any | any[], transfer?: (Transferable[]) | ((Transferable[])[]), workerId?: number | string) => Promise<any>;
    terminate: (workerId?: number | string) => void;
    addPort: (port: Worker, workerId?: number | string) => boolean | boolean[];
    addCallback: (callback?: (data: any) => void, oneOff?: boolean, workerId?: number | string) => number | number[];
    removeCallback: (cb: number, workerId?: number | string) => void;
    addWorker: () => number;
    setLoop: (interval: any, message: any, transfer: any, workerId?: number | string) => void;
    setAnimation: (message: any, transfer: any, workerId?: number | string) => void;
    stop: (workerId?: number | string) => void;
    workers: {
        [key: string]: Worker;
    };
    helpers: {
        [key: string]: WorkerHelper;
    };
    keys: string[];
    callbacks: {
        [key: number]: (data: any, cb?: number) => void;
    };
};
export declare function threadop(operation?: string | Blob | ((data: any) => void), options?: {
    imports?: ImportsInput;
    message: any;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<any>;
export declare function threadop(operation?: string | Blob | ((data: any) => void), options?: {
    imports?: ImportsInput;
    message: any | any[];
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool: number;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<any[]>;
export declare function threadop(operation?: string | Blob | ((data: any) => void), options?: {
    imports?: ImportsInput;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<WorkerHelper>;
export declare function threadop(operation?: string | Blob | ((data: any) => void), options?: {
    imports?: ImportsInput;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool: number;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<WorkerPoolHelper>;
export declare const initWorker: (inputFunction?: () => void) => void;
export declare const workerFnString: string;
export declare const generateWorkerURL: (operation: any, imports: any) => string;
export default threadop;
