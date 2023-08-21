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
export declare function threadop(callback?: (data: any) => any, options?: {
    imports?: ImportsInput;
    message: any;
    transfer?: Transferable[];
    port?: Worker;
    blocking?: boolean;
}): Promise<any>;
export declare function threadop(callback?: (data: any) => any, options?: {
    imports?: ImportsInput;
    transfer?: Transferable[];
    port?: Worker;
    blocking?: boolean;
}): Promise<WorkerHelper>;
export default threadop;
