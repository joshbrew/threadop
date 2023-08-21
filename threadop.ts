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

//overloads
// When the message is defined, the function returns a Promise<any>.
export function threadop(
    callback?: (data: any) => any, 
    options?: {
        imports?: ImportsInput, 
        message: any, 
        transfer?: Transferable[], 
        port?: Worker, 
        blocking?: boolean 
    }
): Promise<any>;

// When the message isn't defined, the function returns a Promise<WorkerHelper>.
export function threadop(
    callback?: (data: any) => any, 
    options?: {
        imports?: ImportsInput, 
        transfer?: Transferable[], 
        port?: Worker, 
        blocking?: boolean 
    }
): Promise<WorkerHelper>;


//implementation

export function threadop(
    callback = (data) => data, 
    { 
        imports, //ImportsInput
        message, 
        transfer, 
        port, 
        blocking 
    }:{
        imports?:ImportsInput, //ImportsInput
        message?:any, 
        transfer?:Transferable[], 
        port?:Worker, 
        blocking?:boolean 
    } = {} as any
): Promise<any | WorkerHelper>  {
    return new Promise((resolve, reject) => {
        let id = Math.random();

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
                let result = (()=>{})(ev.data.message) as any;
                
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
        const worker = new Worker(workerURL, imports ? { type: "module" } : undefined);

        // Otherwise, set up any provided ports and return a control object
        if (port) {
            setupPort(worker, port, id, blocking);
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

            worker.postMessage({message}, transfer as Transferable[]);

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