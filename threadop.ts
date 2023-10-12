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
    run: (message: any, transfer?: Transferable[], overridePort?:boolean|string|'both') => Promise<any>;
    terminate: () => void;
    addPort: (port: Worker) => void;
    addCallback: (callback?: (data: any) => void, oneOff?: boolean) => number;
    removeCallback: (cb: number) => void;
    setLoop: (interval, message, transfer) => void, //can provide arguments to send results on loop
    setAnimation: (message, transfer) => void,      //run an animation function, e.g. transfer a canvas with parameters
    stop: () => void, 
    worker: Worker;
    callbacks: {[key: number]: (data: any, cb?: number) => void};
}

export type WorkerPoolHelper = {
    run: (message: any|any[], transfer?: (Transferable[])|((Transferable[])[]), overridePort?:boolean|string|'both', workerId?:number|string) => Promise<any>;
    terminate: (workerId?:number|string) => void;
    addPort: (port: Worker, workerId?:number|string) => boolean|boolean[];
    addCallback: (callback?: (data: any) => void, oneOff?: boolean, workerId?:number|string) => number|number[];
    removeCallback: (cb: number, workerId?:number|string) => void;
    addWorker:() => number;
    setLoop: (interval, message, transfer, workerId?:number|string) => void, //provide arguments and run a function/send results on loop
    setAnimation: (message, transfer, workerId?:number|string) => void, //run an animation function, e.g. transfer a canvas with parameters, or transmit results on a framerate-limited loop
    stop: (workerId?:number|string) => void, 
    workers: {[key:string]:Worker};
    helpers: {[key:string]:WorkerHelper};
    keys: string[],
    callbacks: {[key: number]: (data: any, cb?: number) => void};
}

//overloads
// When the message is defined, the function returns a Promise<any>.
export function threadop(
    operation?:string|Blob|((data)=>void), 
    options?: {
        imports?: ImportsInput, 
        message: any, 
        transfer?: Transferable[], 
        port?: Worker|Worker[], 
        blocking?: boolean,
        loop?:number,
        animate?:boolean,
        callback?:(data) => void
    }
): Promise<any>;

// When the message is defined and pool is defined, the function returns a Promise<any[]>.
export function threadop(
    operation?:string|Blob|((data)=>void), 
    options?: {
        imports?: ImportsInput, 
        message: any|any[], //array inputs interpreted as per-thread inputs, can be longer than the number of threads
        transfer?: Transferable[], 
        port?: Worker|Worker[], 
        blocking?: boolean,
        pool:number,
        loop?:number,
        animate?:boolean,
        callback?:(data) => void
    }
): Promise<any[]>;

// When the message isn't defined, the function returns a Promise<WorkerHelper>.
export function threadop(
    operation?:string|Blob|((data)=>void), 
    options?: {
        imports?: ImportsInput, 
        transfer?: Transferable[], 
        port?: Worker|Worker[], 
        blocking?: boolean,
        loop?:number,
        animate?:boolean,
        callback?:(data) => void
    }
): Promise<WorkerHelper>;

// When the message isn't defined and pool is defined, the function returns a Promise<WorkerPoolHelper>.
export function threadop(
    operation?:string|Blob|((data)=>void), 
    options?: {
        imports?: ImportsInput, 
        transfer?: Transferable[], 
        port?: Worker|Worker[], 
        blocking?: boolean,
        pool:number,
        loop?:number,
        animate?:boolean,
        callback?:(data) => void
    }
): Promise<WorkerPoolHelper>;

//implementation
export function threadop(
    operation:string|Blob|((data)=>void) = (data) => data, 
    { 
        imports, //ImportsInput
        message, 
        transfer, 
        port, 
        blocking,
        pool,
        loop,
        animate,
        callback
    }:{
        imports?:ImportsInput, //ImportsInput
        message?:any, 
        transfer?:Transferable[], 
        port?:Worker|Worker[], 
        blocking?:boolean,
        pool?:number,
        loop?:number, //loop the function on a millisecond interval
        animate?:boolean, //loop the function on an animation frame,
        callback?:(data) => void
    } = {} as any
): Promise<any | WorkerHelper>  {
    return new Promise((resolve, reject) => {

        let workerURL;
        if(typeof operation !== 'function') {
            //this is an url (string or blob)
            if(typeof operation === 'string' && operation.startsWith('./')) {
                let relpath = location.origin;
                let pname = location.pathname.split('/');
                pname.pop();
                let joined = pname.join('/');
                if(!joined.startsWith('http')) relpath += joined + '/'; else relpath += '/';
                operation =  relpath + operation;
            }
            workerURL = operation; //string url or blob
        } else {
            workerURL = generateWorkerURL(operation, imports);
        }

        const WorkerHelper = (worker) => {

            let callbacks = {};
            let blocked = false; //will prevent running if a thread is blocked

            worker.onmessage = (ev) => {
                for(const key in callbacks) {callbacks[key](ev.data.message, ev.data.cb);}
            }
            
            worker.onerror = (ev) => {
                console.error(new Error("Worker encountered an error: " + ev.message));
            };

            let mkcb = (msg, tx, overridePort) => {
                return new Promise((res,rej) => {
                    if(!overridePort && (worker as any).PORTS) {
                        worker.postMessage({message:msg, overridePort}, tx);
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
                        worker.postMessage({message:msg, cb, overridePort}, tx);
                    }
                });
            }

            const helper = {
                run: (message:any, transfer:Transferable[], overridePort?:boolean|string|'both') => { //return a promise, will return data if a thread operation 
                    return mkcb(message,transfer,overridePort);
                },
                terminate: () => {
                    URL.revokeObjectURL(workerURL); // This line is important for garbage collection even if you reuse the worker
                    worker.terminate();
                    if((worker as any).PORTS) {
                        let withPort = (p,i) => {
                            p.postMessage({COMMAND:{DELETED:(worker as any).id}})
                        }
                        (worker as any).PORTS.forEach(withPort)
                    }
                },
                addPort: (port) => setupPort(worker, port, blocking), //add a message port to send data to a second worker instead of to main thread, can send to multiple 
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
                setLoop:(interval, message, transfer) => {
                    worker.postMessage({message, COMMAND:{SETLOOP:interval}}, transfer);
                },
                setAnimation:(message,transfer) => {
                    worker.postMessage({message, COMMAND:{SETANIM:true}}, transfer);
                },
                stop:() => {
                    worker.postMessage({COMMAND:{STOP:true}});
                },
                worker,
                callbacks
            } as WorkerHelper;

            if(callback) helper.addCallback(callback);

            if(loop) {
                helper.setLoop(loop, message, transfer);
            } else if (animate) {
                helper.setAnimation(message, transfer);
            }

            return helper;
        }

        if(pool) {
            const workers = {};
            let helper = {} as any as WorkerPoolHelper;

            function addWrkr() {
                let worker = new Worker(workerURL, (imports || typeof operation !== 'function') ? { type: "module" } : undefined);
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
                        setupPort(worker, port[i], blocking); //1 thread -> 1 port
                    } else setupPort(worker, port, blocking);
                })
            }

            // If a one-off message is provided, post it to the worker and set up the handlers, then terminate after the response is met
            if(message && !loop && !animate) {
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

                        const send = {message:input, oneOff:true} as any;
        
                        worker.postMessage(send, transfer as Transferable[]);
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

                let threadRot = 0;

                Object.assign(helper, {
                    workers,
                    helpers:{} as {[key:string]:WorkerHelper},
                    keys,
                    run:(message:any|any[], transfer:(Transferable[])|((Transferable[])[]), overridePort?:boolean|string|'both', workerId?:string|number)=>{
                        if(workerId) {
                            helper.helpers[workerId]?.run(message, transfer as Transferable[]);
                        } else {
                            if(Array.isArray(message)) { //array messages will be interpreted as being divided up in the threadpool on rotation
                                const len = message.length;
                                for(let i = 0; i < len; i++) {
                                    helper.helpers[keys[threadRot]].run(message[i], transfer[i] as Transferable[], overridePort);
                                    threadRot++; if(threadRot >= keys.length) threadRot = 0; //reset rotation
                                }
                            } else {
                                helper.helpers[keys[threadRot]].run(message, transfer as Transferable[], overridePort);
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
                    setLoop:(interval, message, transfer, workerId?:number|string) => {
                        function sl(id) {
                            helper.helpers[id]?.setLoop(interval, message, transfer);
                        }
                        if(workerId) {
                            return sl(workerId);
                        } else return keys.map(sl);
                    },
                    setAnimation:(message,transfer, workerId?:number|string) => {
                        function sa(id) {
                            helper.helpers[id]?.setAnimation(message, transfer);
                        }
                        if(workerId) {
                            return sa(workerId);
                        } else return keys.map(sa);
                    },
                    stop:(workerId?:number|string) => {
                        function st(id) {
                            helper.helpers[id]?.stop();
                        }
                        if(workerId) {
                            return st(workerId);
                        } else return keys.map(st);
                    }
                });

                let withWorker = (worker) => {
                    helper.helpers[(worker as any).id] = WorkerHelper(worker);
                }
                
                Object.keys(workers).forEach((id,i) => {withWorker(workers[id]);});

                resolve(helper);
            }

        }
        else {
            const id = Math.random();
            const worker = new Worker(workerURL, (imports || typeof operation !== 'function') ? { type: "module" } : undefined);
            (worker as any).id = id;
            // Otherwise, set up any provided ports and return a control object
            if (port) {
                if(!(port as any).id) (port as any).id = Math.random();
                if(Array.isArray(port)) port.map((w)=>{setupPort(worker, w, blocking)})
                else setupPort(worker, port, blocking);
            }

            // If a one-off message is provided, post it to the worker and set up the handlers, then terminate after the response is met
            if (message && !loop && !animate) {
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
                const helper = WorkerHelper(worker);
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



function setupPort(worker, port, blocking) {
    const channel = new MessageChannel();
    if(!worker.id) worker.id = Math.random();
    if(!port.id) port.id = Math.random();
    worker.postMessage({ COMMAND:{SENDER: channel.port1, id:port.id, blocking} }, [channel.port1]);
    port.postMessage({ COMMAND:{RECEIVER: channel.port2, id:worker.id, blocking} }, [channel.port2]);	
    
    if(!worker.PORTS) worker.PORTS = [];
    worker.PORTS.push(port);
    if(!port.PORTS) port.PORTS = [];
    port.PORTS.push(worker);
}

//globalThis.threadop = threadop;
export const initWorker = (inputFunction=()=>{}) => {

    //console.log('thread!');
    globalThis.WORKER = {};

    const sendData = (data:any, cb:number, oneOff:boolean, overridePort:boolean|string|'both') => {
        if (globalThis.WORKER.SENDERS && (overridePort !== true)) { //forward to message ports instead of to main thread
            if(typeof overridePort === 'string' && globalThis.WORKER.SENDERS[overridePort]) {
                if(data?.message)  globalThis.WORKER.SENDERS[overridePort].postMessage({message:data.message}, data.transfer);
                else globalThis.WORKER.SENDERS[overridePort].postMessage({message:data});
            } 
            else {
                for(const key in globalThis.WORKER.SENDERS) {
                    if(globalThis.WORKER.BLOCKING[key]) {
                        if(globalThis.WORKER.BLOCKED[key]) {
                            console.error("Thread Blocked: " + key);
                            continue;
                        }
                        globalThis.WORKER.BLOCKED[key] = true;
                    }
                    if(data?.message)  globalThis.WORKER.SENDERS[key].postMessage({message:data.message}, data.transfer);
                    else globalThis.WORKER.SENDERS[key].postMessage({message:data});
                }
                if(oneOff) postMessage(true); //need to tell main thread to quit
            }
        } 
        if(!globalThis.WORKER.SENDERS || (overridePort === true || (typeof overridePort === 'string' && !globalThis.WORKER.SENDERS[overridePort]))) { //if we overridePort with a specific workerId, then don't pass back to main thread as we imply we want a specific port to be talked to
            if(data?.message) postMessage({message:data.message, cb}, data.transfer); //specifically recognized this output format
            else postMessage({message:data, cb});
        }
    }

    const onData = (ev:any, RECEIVER?:MessagePort) => {
        //@ts-ignore
        let result = (inputFunction)(ev.data?.message) as any;
        
        if (result?.then) {
            result.then((resolvedData) => {
                if(RECEIVER) {
                    //console.log("sending back to SENDER", true);
                    RECEIVER.postMessage(true);
                }
                sendData(resolvedData, ev.data.cb, ev.data.oneOff, ev.data.overridePort);
            });
        } else {
            if(RECEIVER) {
                //console.log("sending back to SENDER", true);
                RECEIVER.postMessage(true);
            }
            sendData(result, ev.data.cb, ev.data.oneOff, ev.data.overridePort);
        }
    };

    globalThis.onmessage = (ev) => {
        // Handle different types of messages: RECEIVER, SENDER, TERMINATED, or data
        
        if(ev.data?.COMMAND) { //process commands for the worker system
            const cmd = ev.data.COMMAND;
            if(typeof cmd.SETLOOP === 'number') {
                if(globalThis.WORKER.LOOP) clearTimeout(globalThis.WORKER.LOOP);
                const loop = () => {
                    onData(ev); globalThis.WORKER.LOOP = setTimeout(() => { loop(); }, cmd.SETLOOP);
                }
                loop();
            }
            if(cmd.SETANIM) {
                if(globalThis.WORKER.ANIM) cancelAnimationFrame(globalThis.WORKER.ANIM);
                const animate = () => {
                    onData(ev); globalThis.WORKER.ANIM = requestAnimationFrame(() => { animate(); });
                }
                animate();
            }
            if(cmd.STOP) {
                if(globalThis.WORKER.LOOP) clearTimeout(globalThis.WORKER.LOOP);
                if(globalThis.WORKER.ANIM) cancelAnimationFrame(globalThis.WORKER.ANIM);
            }
            if(cmd.RECEIVER) {
                const blocking = cmd.blocking;
                if(!globalThis.WORKER.RECEIVERS) {
                    globalThis.WORKER.RTCR = 0;
                    globalThis.WORKER.RECEIVERS = {} as {[key:string]:MessagePort};
                }
                const _id = cmd.id;
                globalThis.WORKER.RECEIVERS[_id] = cmd.RECEIVER;
                globalThis.WORKER.RTCR++;

                cmd.RECEIVER.onmessage = (event) => {
                    onData(event, blocking ? cmd.RECEIVER : undefined);
                }

                cmd.RECEIVER.onerror = (er) => {
                    delete globalThis.WORKER.RECEIVERS[_id];
                }
            } 
            if(cmd.SENDER) {
                if(!globalThis.WORKER.SENDERS) {
                    globalThis.WORKER.PCTR = 0;
                    globalThis.WORKER.SENDERS = {};
                    globalThis.WORKER.BLOCKING = {};
                    globalThis.WORKER.BLOCKED = {};
                }
                const blocking = cmd.blocking;
                const _id = cmd.id ? cmd.id : globalThis.WORKER.PCTR;
                globalThis.WORKER.SENDERS[_id] = cmd.SENDER;
                globalThis.WORKER.PCTR++;

                if(blocking) globalThis.WORKER.BLOCKING[_id] = true;

                cmd.SENDER.onmessage = (event) => { 
                    //console.log('RECEIVER sent back', event.data);
                    if(globalThis.WORKER.BLOCKING[_id]) {
                        globalThis.WORKER.BLOCKED[_id] = false; 
                        //console.log('unblocked')
                    }
                }

                cmd.SENDER.onerror = (er) => {
                    delete globalThis.WORKER.SENDERS[_id];
                }
            }  
            if (cmd.DELETED) {
                delete globalThis.WORKER.RECEIVERS?.[cmd.DELETED];
                delete globalThis.WORKER.SENDERS?.[cmd.DELETED];
            } 
        } else {
            onData(ev);
        }
    };

    globalThis.onerror = (er) => { console.error(er); }
};

export const workerFnString = initWorker.toString();

export const generateWorkerURL = (operation, imports) => {
    // Inner function that will run inside the worker
    
    // Convert the worker function to a string, including imports
    let workerFnStringUpdated = workerFnString.replace(
        '()=>{}', 
        operation.toString()
    );
    let importString = getImports(imports);

    //console.log(importString);

    let workerString = `${importString}\n(${workerFnStringUpdated})()`;

    // Create the worker
    const blob = new Blob([workerString], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}




export default threadop;