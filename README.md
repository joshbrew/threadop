## threadop

`npm i threadop`

![threadop-status](https://img.shields.io/npm/v/threadop.svg) 
![threadop-downloads](https://img.shields.io/npm/dt/threadop.svg)
![threadop-l](https://img.shields.io/npm/l/threadop)

Pure (~250 line unminified, 4kb minified) implementation of a Web Worker thread operation helper. For use in browser or with the web worker library in Nodejs

Create multithreaded pipelines (with esm imports) in a single script file with a clear, minimal workflow.

- Instantiate a thread from a function that simply expects the event.data from the thread postMessage function
- One-off or repeat use with easy cleanup.
- Chain multiple workers with message port automation
- Specify imports (local or remote) from strings or objects to use the full range of esm import abilities.
- Dramatically increase program performance with easy parallelism! The time to instantiate a basic worker is ~0.1ms 

Import `threadop` as a default import 

`import threadop from 'threadop'` 

Or as a method 

`import {threadop} from 'threadop'` 

Or access it as a global variable 

```html
<script src="https://cdn.jsdelivr.net/npm/threadop@latest">
    let thread = threadop(data => {return data*2}); //globalThis.threadop
    thread.run(5).then(console.log);
</script>
```

## Inputs

```ts
type ModuleImport = {
    [modulePath: string]: 
    | string   // Default import e.g. 'React'
    | boolean  // Only import module without named imports
    | {       // Named imports
        [importName: string]: string | boolean;  // e.g. { useState: true, useEffect: 'useEff' }
    };
};

type ImportsInput = 
    | string             // Single import e.g. './module.js'
    | string[]           // Multiple imports e.g. ['./mod1.js', './mod2.js']
    | ModuleImport;      // Object describing imports e.g. { './mod.js': { useState: true } }

type WorkerHelper = {
    run: (message: any, transfer?: Transferable[]) => Promise<any>;
    terminate: () => void;
    addPort: (port: Worker) => void;
    addCallback: (callback?: (data: any) => void, oneOff?: boolean) => number;
    removeCallback: (cb: number) => void;
    worker: Worker;
    callbacks: {[key: number]: (data: any, cb?: number) => void};
}

// If we provide a message, we get a result back and terminate the worker automatically
function threadop(
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
function threadop(
    callback?: (data: any) => any, 
    options?: {
        imports?: ImportsInput, 
        transfer?: Transferable[], 
        port?: Worker, 
        blocking?: boolean 
    }
): Promise<WorkerHelper>;


```

## Examples

There is an `examples.html` file in the example/ folder in this repo, you can run it with the LiveServer extension in VSCode and look in the console to see it working. Below are all the examples tested.

There is also a subfolder called `example/npmproject` that you can run following the readme.

### Example 1: One-off usage
```js
    /*
        This is the simplest usage of threadop.

        You have a function, workerFunction, that you want to run in a separate thread (i.e., Web Worker).
        You send a single piece of data (5) to this worker, the worker multiplies this data by 2, and sends the result 
        (10) back to the main thread.
        The function is executed once and the worker terminates after returning the result.
                
    */

    //Define a function to run in the worker
    const workerFunction = data => {
        // Perform some operation on the data
        console.log('Example 1: input', data);
        return data * 2;
    };

    // Run the function with the threadop
    threadop(workerFunction, {
        message: 5, // Sending a one-off message
    }).then(result => {
        console.log('Example 1: result', result); // Expected: 10
    }).catch(error => {
        console.error('Example 1: error',error);
    });
```
    
### Example 2: Repeat operations
```js
    /*
        This is an example of how to run multiple operations sequentially in a worker.

        You initialize the worker with a function (workerFunction2) using threadop.
        Once the worker is ready, you send it multiple pieces of data sequentially. Each piece of data is processed independently.
        After all operations, the worker is terminated explicitly using the workerHelper.terminate() method. This is 
        important to ensure that we don't have lingering worker threads.
    
    */

    const workerFunction2 = data => {
        console.log('Example 2: input', data);
        return data * 2;
    };

    threadop(workerFunction2).then(workerHelper => {
        workerHelper.run(5).then(r1 => {
            console.log('Example 2: r1', r1); // Expected: 10
        });

        
        workerHelper.run(10).then(r2 => {
            console.log('Example 2: r2', r2); // Expected: 20
            workerHelper.terminate(); // Terminate the worker after you're done with it.
        });

    }).catch(error => {
        console.error('Example 2: error', error);
    });
```   
 
### Example 3: Chaining workers
```js
    /*
        This example demonstrates how to chain two workers, meaning the output of one worker (workerFunctionA) is used 
        as the input for another worker (workerFunctionB).

        Both workers are initialized independently.
        A message port is set up between the two workers for chained communication.
        The first worker (workerFunctionA) processes the data and sends its result to the second worker (workerFunctionB), 
        which processes the result further.
        Both workers are terminated after processing, ensuring that no worker threads remain active.
    
    */

    const workerFunctionA = data => {
        console.log('Example 3: A input', data);
        return data * 2;
    };

    const workerFunctionB = data => {
        console.log('Example 3: B input', data);
        return data + 3;
    };

    // Initialize first worker
    threadop(workerFunctionA, {
        blocking: true,
    }).then(workerHelperA => {
    
        // Initialize second worker and set up message port for chained communication
        threadop(workerFunctionB).then(workerHelperB => {
            workerHelperA.addPort(workerHelperB.worker);

            let ctr = 0;
            workerHelperB.addCallback(result => {
                console.log('Chain workerHelperB result', result); // Result from the chained worker operation                
                ctr++;
                if(ctr === 2) {
                    workerHelperA.terminate();
                    workerHelperB.terminate();
                }
                workerHelperA.run(10);
            });

            workerHelperA.run(5).then(result => {
                console.log('Chain workerHelperA result', result); // Result from the chained worker operation
            });

            workerHelperA.run(5) //Blocked!
        });

    }).catch(error => {
        console.error(error);
    });
```
    
### Example 4: local import

```js
    /*
    
        This is about loading and using external libraries/modules within the worker.

        You want to perform some operations on data using the numjs library. So, before running the worker, 
        you specify that this library should be imported.
        The imports option in threadop allows you to specify which external scripts or libraries the worker 
        should load before it begins execution.
        The data is then sent to the worker, processed using the numjs functions, and the result is returned.

    */

    const computeMean = data => {
        const nj = globalThis.nj;  // numjs is attached to globalThis within the worker context
        let ndarray = nj.array(data);
        return nj.mean(ndarray);
    };

    // Sample data
    const data = [1, 2, 3, 4, 5];

    threadop(computeMean, {
        imports: './num.min.js', //['./num.min.js'] //or { './num.min.js':true } //use objects to get more fine grained, e.g. for a import url pass an object with specific module methods and alias strings or bools
        message: data
    }).then(result => {
        console.log('Example 4: Mean:', result);
    }).catch(error => {
        console.error('Example 4: Error:', error);
    });
```
    
### Example 5, Web import with a specified library function

```js   
    const lodashop = data => {
        return data.map(snakeCase)
    };

    // Sample data
    const lodata = ['HelloWorld', 'left pad', 'ECMAScript'];

    threadop(lodashop, {
        imports: {[`https://cdn.skypack.dev/lodash@4`]:{snakeCase :true}}, //['./num.min.js'] //or { './num.min.js':true } //use objects to get more fine grained, e.g. for a import url pass an object with specific module methods and alias strings or bools
        message: lodata
    }).then(result => {
        console.log('Example 5: Snake Case result:', result);
    }).catch(error => {
        console.error('Example 5: Error:', error);
    });
```
