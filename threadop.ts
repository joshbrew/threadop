export type ModuleImport = {
    [modulePath: string]: 
    | string   // Default import e.g. 'React'
    | boolean  // Only import module without named imports
    | {       // Named imports
        [importName: string]: string | boolean;  // e.g. { useState: true, useEffect: 'useEff' }
    };
};

export type ImportsInput = 
    | string             // Single import e.g. './module.js'
    | string[]           // Multiple imports e.g. ['./mod1.js', './mod2.js']
    | ModuleImport;      // Object describing imports e.g. { './mod.js': { useState: true } }

export type WorkerHelper = {
    run: (message: any, transfer?: Transferable[]) => Promise<any>;
    terminate: () => void;
    addPort: (port: Worker) => void;
    addCallback: (callback?: (data: any) => void, oneOff?: boolean) => number;
    removeCallback: (cb: number) => void;
    worker: Worker;
    callbacks: {[key: number]: (data: any, cb?: number) => void};
}

export type WorkerPoolHelper = {
    run: (message: any|any[], transfer?: (Transferable[])|((Transferable[])[]), workerId?:number|string) => Promise<any>;
    terminate: (workerId?:number|string) => void;
    addPort: (port: Worker, workerId?:number|string) => boolean|boolean[];
    addCallback: (callback?: (data: any) => void, oneOff?: boolean, workerId?:number|string) => number|number[];
    removeCallback: (cb: number, workerId?:number|string) => void;
    addWorker:() => number;
    workers: {[key:string]:Worker};
    helpers: {[key:string]:WorkerHelper};
    keys: string[],
    callbacks: {[key: number]: (data: any, cb?: number) => void};
}
//overloads
// When the message is defined, the function returns a Promise<any>.
export function threadop(
    callback?: (data: any) => any, 
    options?: {
        imports?: ImportsInput, 
        message: any, 
        transfer?: Transferable[], 
        port?: Worker|Worker[], 
        blocking?: boolean,
    }
): Promise<any>;

// When the message is defined, the function returns a Promise<any>.
export function threadop(
    callback?: (data: any) => any, 
    options?: {
        imports?: ImportsInput, 
        message: any|any[], 
        transfer?: Transferable[], 
        port?: Worker|Worker[], 
        blocking?: boolean,
        pool:number
    }
): Promise<any[]>;

// When the message isn't defined, the function returns a Promise<WorkerHelper>.
export function threadop(
    callback?: (data: any) => any, 
    options?: {
        imports?: ImportsInput, 
        transfer?: Transferable[], 
        port?: Worker|Worker[], 
        blocking?: boolean
    }
): Promise<WorkerHelper>;

// When the message isn't defined, the function returns a Promise<WorkerHelper>.
export function threadop(
    callback?: (data: any) => any, 
    options?: {
        imports?: ImportsInput, 
        transfer?: Transferable[], 
        port?: Worker|Worker[], 
        blocking?: boolean,
        pool:number
    }
): Promise<WorkerPoolHelper>;


//implementation

export function threadop(
    callback = (data) => data, 
    { 
        imports, //ImportsInput
        message, 
        transfer, 
        port, 
        blocking,
        pool
    }:{
        imports?:ImportsInput, //ImportsInput
        message?:any, 
        transfer?:Transferable[], 
        port?:Worker|Worker[], 
        blocking?:boolean,
        pool?:number
    } = {} as any
): Promise<any | WorkerHelper>  {
    return new Promise((resolve, reject) => {

        // Inner function that will run inside the worker
        const workerFn = () => {

            //console.log('thread!');

            const sendData = (data:any, cb:number) => {
                if (globalThis.SENDERS) { //forward to message ports instead of to main thread
                    for(const key in globalThis.SENDERS) {
                        if(globalThis.BLOCKING[key]) {
                            if(globalThis.BLOCKED[key]) {
                                console.error("Thread Blocked: " + key);
                                continue;
                            }
                            globalThis.BLOCKED[key] = true;
                        }
                        globalThis.SENDERS[key].postMessage({message:data, cb})
                    }
                } else {
                    postMessage({message:data, cb});
                }
            }

            const onData = (ev:any, RECEIVER?:MessagePort) => {
                //@ts-ignore
                let result = (()=>{})(ev.data?.message) as any;
                
                if (result?.then) {
                    result.then((resolvedData) => {
                        if(RECEIVER) {
                            //console.log("sending back to SENDER", true);
                            RECEIVER.postMessage(true);
                        }
                        sendData(resolvedData, ev.data.cb);
                    });
                } else {
                    if(RECEIVER) {
                        //console.log("sending back to SENDER", true);
                        RECEIVER.postMessage(true);
                    }
                    sendData(result, ev.data.cb);
                }

                if(ev.data.oneOff && globalThis.SENDERS) postMessage(true); //need to tell main thread to quit
            };

            globalThis.onmessage = (ev) => {
                // Handle different types of messages: RECEIVER, SENDER, TERMINATED, or data
                if(ev.data?.RECEIVER) {
                    const blocking = ev.data.blocking;
                    if(!globalThis.RECEIVERS) {
                        globalThis.RTCR = 0;
                        globalThis.RECEIVERS = {} as {[key:string]:MessagePort};
                    }
                    const _id = ev.data.id;
                    globalThis.RECEIVERS[_id] = ev.data.RECEIVER;
                    globalThis.RTCR++;

                    ev.data.RECEIVER.onmessage = (event) => {
                        onData(event, blocking ? ev.data.RECEIVER : undefined);
                    }

                    ev.data.RECEIVER.onerror = (er) => {
                        delete globalThis.RECEIVER[_id];
                    }
                } else if(ev.data?.SENDER) {
                    if(!globalThis.SENDERS) {
                        globalThis.PCTR = 0;
                        globalThis.SENDERS = {};
                        globalThis.BLOCKING = {};
                        globalThis.BLOCKED = {};
                    }
                    const blocking = ev.data.blocking;
                    const _id = ev.data.id ? ev.data.id : globalThis.PCTR;
                    globalThis.SENDERS[_id] = ev.data.SENDER;
                    globalThis.PCTR++;

                    if(blocking) globalThis.BLOCKING[_id] = true;

                    ev.data.SENDER.onmessage = (event) => { 
                        //console.log('RECEIVER sent back', event.data);
                        if(globalThis.BLOCKING[_id]) {
                            globalThis.BLOCKED[_id] = false; 
                            //console.log('unblocked')
                        }
                    }

                    ev.data.SENDER.onerror = (er) => {
                        delete globalThis.SENDERS[_id];
                    }
                } else if (ev.data?.DELETED) {
                    delete globalThis.RECEIVERS?.[ev.data.DELETED];
                    delete globalThis.SENDERS?.[ev.data.DELETED];
                } else {
                    onData(ev);
                }
            };

            globalThis.onerror = (er) => { console.error(er); }
        }

        // Convert the worker function to a string, including imports
        let workerFnString = workerFn.toString().replace('()=>{}', callback.toString());
        let importString = getImports(imports);

        //console.log(importString);

        let workerString = `${importString}\n(${workerFnString})()`;

        // Create the worker
        const blob = new Blob([workerString], { type: 'application/javascript' });
        const workerURL = URL.createObjectURL(blob);

        if(pool) {
            const workers = {};
            let helper = {} as any as WorkerPoolHelper;

            function addWrkr() {
                let worker = new Worker(workerURL, imports ? { type: "module" } : undefined);
                const id = Math.random();
                (worker as any).id = id;
                workers[id] = worker;
                return id;
            }

            for(let i = 0; i < pool; i++) { addWrkr(); }

            let keys = Object.keys(workers);

            // Otherwise, set up any provided ports and return a control object
            if (port) {
                keys.forEach((id,i) => {
                    const worker = workers[id];
                    if(Array.isArray(port)) {
                        setupPort(worker, port[i], (worker as any).id, blocking); //1 thread -> 1 port
                    } else setupPort(worker, port, (worker as any).id, blocking);
                })
            }

            // If a one-off message is provided, post it to the worker and set up the handlers, then terminate after the response is met
            if(message) {
                Promise.all(keys.map((id,i) => {
                    const worker = workers[id];
                    let input = Array.isArray(message) ? message[i] : message; //if your message is meant to be a single array, wrap it in another array
                    return new Promise ((r,rj) => {
                        worker.onmessage = (ev) => {
                            Promise.resolve().then(() => {//async
                                worker.terminate();
                                delete workers[(worker as any).id];
                            })
                            r(ev.data.message);
                        };
        
                        worker.onerror = (ev) => {
                            Promise.resolve().then(() => {//async
                                worker.terminate();
                                delete workers[(worker as any).id];
                            })
                            rj(new Error("Worker encountered an error: " + ev.message));
                        };
        
                        worker.postMessage({message:input, oneOff:true}, transfer as Transferable[]);
                    });
                })).then((resolved) => {
                    URL.revokeObjectURL(workerURL);
                    resolve(resolved);
                }).catch((er) => { 
                    URL.revokeObjectURL(workerURL); 

                    Object.keys(workers).map((id,i) => {
                        const worker = workers[id];
                        if(worker) worker.terminate();
                        delete workers[id];
                        delete helper.helpers?.[id];
                    });

                    reject(er);
                });
            } else {

                let callbacks = {};
                let threadRot = 0;

                Object.assign(helper, {
                    workers,
                    helpers:{} as {[key:string]:WorkerHelper},
                    keys,
                    run:(message:any|any[], transfer:(Transferable[])|((Transferable[])[]), workerId?:string|number)=>{
                        if(workerId) {
                            helper.helpers[workerId]?.run(message, transfer as Transferable[]);
                        } else {
                            if(Array.isArray(message)) { //array messages will be interpreted as being divided up in the threadpool on rotation
                                const len = message.length;
                                for(let i = 0; i < len; i++) {
                                    helper.helpers[keys[threadRot]].run(message[i], transfer[i] as Transferable[]);
                                    threadRot++; if(threadRot >= keys.length) threadRot = 0; //reset rotation
                                }
                            } else {
                                helper.helpers[keys[threadRot]].run(message, transfer as Transferable[]);
                                threadRot++; if(threadRot >= keys.length) threadRot = 0; //reset rotation
                            }
                        }
                    },
                    terminate:(workerId?:string|number)=>{
                        function trm(id) {
                            helper.helpers[id]?.terminate();
                            delete helper.helpers[id];
                            delete helper.workers[id];
                        }
                        if(workerId) {
                            trm(workerId);
                        } else keys.forEach(trm);
                    },
                    addWorker:() => {
                        const id = addWrkr();
                        const worker = workers[id];
                        withWorker(worker);
                        keys.length = 0;
                        keys.push(...keys); //keeps same data structure
                        return id;
                    },
                    addPort: (port: Worker, workerId?: string | number) => {
                        function ap(id) {
                            helper.helpers[id]?.addPort(port);
                            return true;
                        }
                        if(workerId) {
                            return ap(workerId);
                        } else return keys.map(ap);
                    },
                    addCallback: (callback?: (data: any) => {}, oneOff?: boolean, workerId?:number|string) => {
                        function ac(id) {
                            return helper.helpers[id]?.addCallback(callback, oneOff);
                        }
                        if(workerId) {
                            return ac(workerId);
                        } else return keys.map(ac);
                    },
                    removeCallback: (cb: number, workerId?:number|string) => {
                        function rc(id) {
                            helper.helpers[id]?.removeCallback(cb);
                            return true;
                        }
                        if(workerId) {
                            return rc(workerId);
                        } else return keys.map(rc);
                    },
                    callbacks
                });

                let withWorker = (worker) => {
                    let blocked = false; //will prevent running if a thread is blocked
                    let wcallbacks = {} as any;
    
                    worker.onmessage = (ev) => {
                        for(const key in wcallbacks) {wcallbacks[key](ev.data.message, ev.data.cb);}
                    }
                    
                    worker.onerror = (ev) => {
                        console.error(new Error("Worker encountered an error: " + ev.message));
                    };

                    let mkcb = (message, transfer) => {
                        return new Promise((res,rej) => {
                            if((worker as any).PORTS) {
                                worker.postMessage({message}, transfer);
                                res(true);
                            } else {
                                if(blocking) {
                                    if(blocked) return new Promise((res,rej) => { rej("Thread Blocked") });
                                    blocked = true;
                                }
                                let cb = Math.random();
                                wcallbacks[cb] = (data, c) => { 
                                    if(cb === c) {
                                        delete wcallbacks[cb]; 
                                        if(blocking) blocked = false; 
                                        res(data); 
                                    }
                                }
                                worker.postMessage({message, cb}, transfer);
                            }
                        });
                    }

                    const whelper = {
                        run: (message, transfer) => { //return a promise, will return data if a thread operation 
                            return mkcb(message,transfer);
                        },
                        terminate: () => {
                            URL.revokeObjectURL(workerURL); // This line is important for garbage collection even if you reuse the worker
                            worker.terminate();
                            delete workers[(worker as any).id];
                            delete helper.helpers[(worker as any).id];
                            if((worker as any).PORTS) {
                                let withPort = (p,i) => {
                                    p.postMessage({DELETED:(worker as any).id})
                                }
                                (worker as any).PORTS.forEach(withPort)
                            }
                        },
                        addPort: (port) => setupPort(worker, port, (worker as any).id, blocking), //add a message port to send data to a second worker instead of to main thread, can send to multiple 
                        addCallback:(callback=(data)=> {}, oneOff) => { //response to worker data
                            let cb = Math.random(); 
                            whelper.callbacks[cb] = oneOff ? (data) => { 
                                callback(data); delete whelper.callbacks[cb];
                            } : callback;
                            return cb;
                        },
                        removeCallback:(cb) => {
                            delete whelper.callbacks[cb];
                        },
                        worker,
                        callbacks:wcallbacks
                    } as WorkerHelper;

                    helper.helpers[(worker as any).id] = whelper;
                }
                
                Object.keys(workers).forEach((id,i) => {withWorker(workers[id]);});

                resolve(helper);
            }

        }
        else {
            const id = Math.random();
            const worker = new Worker(workerURL, imports ? { type: "module" } : undefined);
            // Otherwise, set up any provided ports and return a control object
            if (port) {
                if(Array.isArray(port)) port.map((w)=>{setupPort(worker, w, id, blocking)})
                else setupPort(worker, port, id, blocking);
            }

            // If a one-off message is provided, post it to the worker and set up the handlers, then terminate after the response is met
            if (message) {
                worker.onmessage = (ev) => {
                    Promise.resolve().then(() => {//async
                        worker.terminate();
                        URL.revokeObjectURL(workerURL);
                    })
                    resolve(ev.data.message);
                };

                worker.onerror = (ev) => {
                    Promise.resolve().then(() => {//async
                        worker.terminate();
                        URL.revokeObjectURL(workerURL);
                    })
                    reject(new Error("Worker encountered an error: " + ev.message));
                };

                worker.postMessage({message, oneOff:true}, transfer as Transferable[]);

            } else {

                let callbacks = {};
                let blocked = false; //will prevent running if a thread is blocked

                worker.onmessage = (ev) => {
                    for(const key in callbacks) {callbacks[key](ev.data.message, ev.data.cb);}
                }
                
                worker.onerror = (ev) => {
                    console.error(new Error("Worker encountered an error: " + ev.message));
                };

                let mkcb = (message, transfer) => {
                    return new Promise((res,rej) => {
                        if((worker as any).PORTS) {
                            worker.postMessage({message}, transfer);
                            res(true);
                        } else {
                            if(blocking) {
                                if(blocked) return new Promise((res,rej) => { rej("Thread Blocked") });
                                blocked = true;
                            }
                            let cb = Math.random();
                            callbacks[cb] = (data, c) => { 
                                if(cb === c) {
                                    delete callbacks[cb]; 
                                    if(blocking) blocked = false; 
                                    res(data); 
                                }
                            }
                            worker.postMessage({message, cb}, transfer);
                        }
                    });
                }

                const helper = {
                    run: (message, transfer) => { //return a promise, will return data if a thread operation 
                        return mkcb(message,transfer);
                    },
                    terminate: () => {
                        URL.revokeObjectURL(workerURL); // This line is important for garbage collection even if you reuse the worker
                        worker.terminate();
                        if((worker as any).PORTS) {
                            let withPort = (p,i) => {
                                p.postMessage({DELETED:id})
                            }
                            (worker as any).PORTS.forEach(withPort)
                        }
                    },
                    addPort: (port) => setupPort(worker, port, id, blocking), //add a message port to send data to a second worker instead of to main thread, can send to multiple 
                    addCallback:(callback=(data)=> {}, oneOff) => { //response to worker data
                        let cb = Math.random(); 
                        callbacks[cb] = oneOff ? (data) => { 
                            callback(data); delete callbacks[cb];
                        } : callback;
                        return cb;
                    },
                    removeCallback:(cb) => {
                        delete helper.callbacks[cb];
                    },
                    worker,
                    callbacks
                } as WorkerHelper;

                resolve(helper);
            }
        }
    });
}

/**
 * 
    If imports is a string that doesn't include the word 'import', the function returns it formatted as an import statement.
    If it does include 'import', it's returned as is.
    Also, any occurrence of './' in the string will be replaced by the website's origin (base URL).
    Array:

    If imports is an array, each string inside is processed similarly to the string case, and the results are joined together.
    Object:

    If imports is an object, it's meant to represent named imports or default imports from modules.
    Each key in the object is the path or URL of a module. Like in previous cases, './' will be replaced by the website's origin.
    The value associated with each key can be:
    A string: Represents the default import from the module.
    A boolean: If true, represents importing the module without any named imports.
    An object: Represents named imports from the module. Each key in this nested object is the name of an import from the module, and its associated value can be:
    A string: An alias for the import.
    A boolean: If true, the import is used as-is without aliasing.
 * 
 */
//The purpose of the function is to create ESM import statements based on the provided imports.
function getImports(imports) {
    // Handle different formats for the imports option

    let pname = location.pathname.split('/');
    pname.pop();
    let relpath = location.origin + pname.join('/') + '/'; 
    if (typeof imports === 'string') {
        if(imports.startsWith('./')) imports = relpath + imports;
        return imports.includes('import') ? `${imports}` : `import '${imports}';`;
    } else if (Array.isArray(imports)) {
        return imports.map((v) => { 
            if(v.startsWith('./')) v = relpath + v;
            if(!v.includes('import')) return `import '${v}';`; 
            else return v; 
        }).join('\n');
    } else if (typeof imports === 'object') {
        let lines = Object.entries(imports).map(([key, value]) => {
            if(key.startsWith('./')) key = relpath + key;
            if (typeof value === 'string') {
                return `import ${value} from '${key}';`;
            } else if (typeof value === 'boolean' && value) {
                return `import '${key}'`;
            } else {
                const namedImports = Object.entries(value).map(([importName, alias]) => {
                    return typeof alias === 'string' ? `${importName} as ${alias}` : importName;
                }).join(', ');
                return `import { ${namedImports} } from '${key}';`;
            }
        });
        return lines.join('\n') + '';
    }
    return '';
}



function setupPort(worker, port, id, blocking) {
    const channel = new MessageChannel();
    worker.postMessage({ SENDER: channel.port1, id, blocking }, [channel.port1]);
    port.postMessage({ RECEIVER: channel.port2, id, blocking }, [channel.port2]);	
    
    if(!worker.PORTS) worker.PORTS = [];
    worker.PORTS.push(port);
    if(!port.PORTS) port.PORTS = [];
    port.PORTS.push(worker);
}

//globalThis.threadop = threadop;


export default threadop;