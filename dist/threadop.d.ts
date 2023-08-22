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
export declare function threadop(callback?: (data: any) => any, options?: {
    imports?: ImportsInput;
    message: any;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
}): Promise<any>;
export declare function threadop(callback?: (data: any) => any, options?: {
    imports?: ImportsInput;
    message: any | any[];
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool: number;
}): Promise<any[]>;
export declare function threadop(callback?: (data: any) => any, options?: {
    imports?: ImportsInput;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
}): Promise<WorkerHelper>;
export declare function threadop(callback?: (data: any) => any, options?: {
    imports?: ImportsInput;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool: number;
}): Promise<WorkerPoolHelper>;
export default threadop;
