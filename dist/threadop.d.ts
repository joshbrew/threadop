export type ModuleImport = {
    [modulePath: string]: string | boolean | {
        [importName: string]: string | boolean;
    };
};
export type ImportsInput = string | string[] | ModuleImport;
export type WorkerHelper = {
    run: (message: any, transfer?: Transferable[], overridePort?: boolean | number | string | 'both') => Promise<any>;
    set: (fn: string | Function, fnName?: string) => Promise<string>;
    call: (fnName: string, message: any, transfer?: Transferable[], overridePort?: boolean | number | string | 'both') => Promise<any>;
    terminate: () => void;
    addPort: (port: Worker) => void;
    addCallback: (callback?: (data: any) => void, oneOff?: boolean, fnName?: string) => number;
    removeCallback: (cb: number) => void;
    setLoop: (interval: any, message: any, transfer: any) => void;
    setAnimation: (message: any, transfer: any) => void;
    stop: () => void;
    worker: Worker;
    id: number;
    callbacks: {
        [key: number]: (data: any, cb?: number) => void;
    };
};
export type WorkerPoolHelper = {
    run: (message: any | any[], transfer?: (Transferable[]) | ((Transferable[])[]), overridePort?: boolean | number | string | 'both', workerId?: number | string) => Promise<any>;
    set: (fn: string | Function, fnName?: string) => Promise<string>;
    call: (fnName: string, message: any, transfer?: Transferable[], overridePort?: boolean | number | string | 'both', workerId?: number | string) => Promise<any>;
    terminate: (workerId?: number | string) => void;
    addPort: (port: Worker, workerId?: number | string) => boolean | boolean[];
    addCallback: (callback?: (data: any) => void, oneOff?: boolean, fnName?: string, workerId?: number | string) => number | number[];
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
export type ThreadOptions = {
    operation?: string | Blob | ((data: any) => (any | Promise<any>));
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    message?: any;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool?: number;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
};
export declare function threadop(operation?: string | Blob | ((data: any) => (any | Promise<any>)), options?: {
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    message: any;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<any>;
export declare function threadop(operation?: string | Blob | ((data: any) => (any | Promise<any>)), options?: {
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    message: any | any[];
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool: number;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<any[]>;
export declare function threadop(operation?: string | Blob | ((data: any) => (any | Promise<any>)), options?: {
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<WorkerHelper>;
export declare function threadop(operation?: string | Blob | ((data: any) => (any | Promise<any>)), options?: {
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool: number;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<WorkerPoolHelper>;
export declare function threadop(options?: {
    operation?: string | Blob | ((data: any) => (any | Promise<any>));
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    message: any;
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<any>;
export declare function threadop(options?: {
    operation?: string | Blob | ((data: any) => (any | Promise<any>));
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    message: any | any[];
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool: number;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<any[]>;
export declare function threadop(options?: {
    operation?: string | Blob | ((data: any) => (any | Promise<any>));
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<WorkerHelper>;
export declare function threadop(options?: {
    operation?: string | Blob | ((data: any) => (any | Promise<any>));
    imports?: ImportsInput;
    functions?: {
        [key: string]: Function;
    };
    transfer?: Transferable[];
    port?: Worker | Worker[];
    blocking?: boolean;
    pool: number;
    loop?: number;
    animate?: boolean;
    callback?: (data: any) => void;
}): Promise<WorkerPoolHelper>;
export declare const initWorker: (inputFunction?: ((data) => (any | Promise<any>)), functionSet?: {
    [key: string]: Function;
}) => void;
export declare const workerFnString: string;
export declare const generateWorkerURL: (operation: Function, imports: any, functionSet?: {
    [key: string]: Function;
}) => string;
export declare let recursivelyStringifyFunctions: (obj: {
    [key: string]: any;
}) => {};
export default threadop;
