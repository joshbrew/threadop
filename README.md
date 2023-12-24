## threadop

`npm i threadop`

![threadop-status](https://img.shields.io/npm/v/threadop.svg) 
![threadop-downloads](https://img.shields.io/npm/dt/threadop.svg)
![threadop-l](https://img.shields.io/npm/l/threadop)

### [Example](https://threadop.netlify.app)

## Description

Pure (~450 lines unminified, 7kb minified) implementation of a Web Worker thread operation helper. For use in browser or with the web worker library in Nodejs

Create multithreaded pipelines (with esm imports) in a single script file with a clear, minimal workflow.

- Instantiate a thread from a function that simply expects the event.data from the thread postMessage function
- One-off or repeat use with easy cleanup.
- Chain multiple workers with message port automation
- Instantiate threadpools from a single function, chain multiple threadpools.
- Specify imports (local or remote) from strings or objects to use the full range of esm import abilities.
- loops, animations, with propagation
- Dramatically increase program performance with easy parallelism! The time to instantiate a basic worker is ~0.1ms. 

Instantiate threads from generic functions (with imports!) or from URLS i.e. worker file locations or Blobs.

## List of examples:

#### [Example WONNX video processing app](https://github.com/joshbrew/cameraId-wonnx-wasm)

- [Example 1: One-off usage](#example-1-one-off-usage)
- [Example 2: Repeat operations](#example-2-repeat-operations)
- [Example 3: Chaining workers](#example-3-chaining-workers)
- [Example 4: local import](#example-4-local-import)
- [Example 5: Web import with a specified library function](#example-5-web-import-with-a-specified-library-function)
- [Example 6: Thread pool one-off](#example-6-thread-pool-one-off)
- [Example 7: Thread pool chaining](#example-7-thread-pool-chaining)
- [Example 8: Looping](#example-8-looping)
- [Example 9: Canvas Animation](#example-9-canvas-animation)
- [Example 10: Using dedicated worker files and dynamic imports for a parallelized FFT](#example-10-using-dedicated-worker-files-and-dynamic-imports-for-a-parallelized-fft)
- [Example 11: WGSL shader for the DFT with re-use (way faster!), transfer buffers to/from](#example-11-wgsl-shader-for-the-dft-with-re-use-way-faster)


## Usage

Import `threadop` as a default import 

`import threadop from 'threadop'` 

Or as a method 

`import {threadop} from 'threadop'` 

Or access it as a global variable 

```html
<html>
    <head>
        <script src="https://cdn.jsdelivr.net/npm/threadop@latest"></script>
    </head>
    <body>
        Hello World
        <script>
            console.log("Hello world!");
            threadop(data => {return data*2}).then((thread) => {
                thread.run(5).then(console.log);
            }); //globalThis.threadop
        </script>  
    </body>
</html>
```

## Input Options

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

type WorkerPoolHelper = {
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
function threadop(
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
    
### Example 5: Web import with a specified library function

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


### Example 6: Thread pool one-off

```js
    /**
        The example demonstrates how to set up a thread pool to parallelly encode each string in an array into a sequence of bytes using the TextEncoder. 
        The results are then logged to the console, and any errors encountered during the process are caught and reported.
    */

    const threadpoolop = (stringdata) => {
        if(!self.encoder) self.encoder = new TextEncoder();
        return encoder.encode(stringdata);
    }

    let poolinput = ['Hello','World','My','Old','Friend'];

    threadop(threadpoolop, {
        pool:poolinput.length,
        message:poolinput
    }).then(result => {
        console.log('Example 6: Threadpool result:', result, 'input:', poolinput);
    }).catch(error => {
        console.error('Example 5: Error:', error);
    });

```


### Example 7: Thread pool chaining


```js

    /*
        This example showcases how to chain two threadpools, where the output of the first serves as the input to the second. 
        It encodes and then reverses a list of strings. After both operations, the results are re-collected, sorted, and then displayed. 
        In the event of an error in this process, an error message is displayed.
    */

    const encodeOperation = stringdata => {
        // Simulate the encoding operation.
        //console.log('Example 7 step 1 input', stringdata);
        let encoded = btoa(stringdata);
        return {input:stringdata, encoded};
    }

    const reverseOperation = encodedData => {
        // Simulate the reversing operation.
        //console.log('Example 7 step 2 input', encodedData);
        let reversed = encodedData.encoded.split("").reverse().join("");
        return {reversed, input:encodedData.input};
    }
    
    let poolinput = ['Hello','World','My','Old','Friend'];

    // First threadpool to encode the strings. Second to reverse. This is best for async batch processes while you need to implement 
    //something to re-collect results if trying to break up a single problem 
    threadop(reverseOperation, {
        pool: poolinput.length
    }).then((pool1) => {

        return new Promise((res,rej) => {

            let results = [];

            pool1.addCallback((data) => {
                results.push(data);
                if(results.length == poolinput.length) {//got all our data back
                    let sortedOutput = [];
                    poolinput.map((inp,i) => {
                        sortedOutput[i] = results.find((v) => v.input === inp).reversed;
                    });//we're sorting because pool1 responds asynchronously and we need to check the output order if it's important for the problem
                    console.log('Example 7: threadpool chain output', sortedOutput, "\nRe-decoded:", sortedOutput.map((v)=>{return atob(v.split("").reverse().join(""));}))// sortedOutput.map(atob));
                    pool1.terminate();
                    res(sortedOutput);
                }
                
            });

            console.log("Example 7: threadpool chain input", poolinput);
            
            // Using ports, pass the encoded strings from the first pool to the second pool.
            // Second threadpool to reverse the encoded strings.
            threadop(encodeOperation, {
                pool: poolinput.length,
                message: poolinput,
                port: Object.values(pool1.workers)
            });
        })
        

    }).catch(error => {
        console.error('Example 7: Error:', error);
    }); //should pass the result to pool1

```


### Example 8: Looping
Execute repeating operations with a set input

```js
threadop(
    (data) => `Processed ${data}, ${new Date().toLocaleString()}`,
    {
        message:"ABC123",
        loop:1000,
        callback:(data) => {console.log(data)},
    }
).then((helper) => {
    setTimeout(() => {helper.stop()},5000);
});
```



### Example 9: Canvas Animation
This isn't really the best way to use this library but we included it for the hell of it.

```js

const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;

canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.position = 'absolute';
document.body.appendChild(canvas);

const offscreen = canvas.transferControlToOffscreen();
//document.body.appendChild(canvas);

threadop(
    (data) => {
        if(data.canvas && !self.canvas) { //setup
            const canvas = data.canvas;
            const ctx = data.canvas.getContext("2d");
            self.canvas = canvas;
            self.ctx = ctx;

            let gradientColors = [
                'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'
            ];
            
            let offset = 0;

            self.drawWave = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            
                // Create gradient
                let gradient = ctx.createLinearGradient(0, canvas.height / 2,  canvas.width, canvas.height / 2);
                gradientColors.forEach((color, index) => {
                    gradient.addColorStop(index / (gradientColors.length - 1), color);
                });
            
                ctx.fillStyle = gradient;
                
                const waveHeight = 100;
                const waveLength = 0.01;
                const speed = 0.04;
            
                ctx.beginPath();
            
                for(let x = 0; x <  canvas.width; x++) {
                    let y =  canvas.height / 2 + waveHeight * Math.sin(waveLength * x + offset);
                    ctx.lineTo(x, y);
                }
            
                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();
            
                ctx.fill();

                offset -= speed;
            }
        } else if(data.width && self.canvas?.width !== data.width) {
            console.log("resized!");
            self.canvas.width = data.width;
            self.canvas.height = data.height;
        }

        self.drawWave();
    },
    {
        animate:true,
        message:{canvas:offscreen},
        transfer:[offscreen]
    }
).then((helper) => {
    window.onresize = (ev) => {
        helper.setAnimation({width:window.innerWidth, height:window.innerHeight});
    }
});

```


### Example 10 Using dedicated worker files and dynamic imports for a parallelized FFT

This isn't exactly a *good* parallel implementation but it's about 30% faster than a single dedicated thread for the divide and conquer FFT


```js


function nextPowerOf2(n) {
    let count = 0;
    if (n && !(n & (n - 1))) return n;
    while(n != 0) {
        n >>= 1;
        count += 1;
    }
    return 1 << count;
}

// Cooley-Tukey radix-2 FFT
async function threadfft(input) {
    const N = input.length;

    if (N <= 1) return input;

    // Decomposition into even and odd components
    const even = [];
    const odd = [];
    for (let i = 0; i < N; i += 2) {
        even.push(input[i]);
        if ((i + 1) < N) {
            odd.push(input[i + 1]);
        }
    }

    let E, O;
    if(even.length >= 7500) { // 25% faster
        [E,O] = await new Promise((res) => {
            import(location.origin+'/lib/threadop.esm.js').then(async (module) => { 
                res(await Promise.all(
                    [
                        module.threadop(threadfft,{message:even}),
                        module.threadop(threadfft,{message:odd})
                    ]
                ));
            });
        })
        
    } else {
        [E, O] = [await threadfft(even), await threadfft(odd)];
    }

    const T = new Array(N);
    for (let k = 0; k < N / 2; k++) {
        const angle = -2 * Math.PI * k / N;

        // complex multiplication for e^(-j*angle) and O[k]
        const tReal = Math.cos(angle) * O[k].real - Math.sin(angle) * O[k].imag;
        const tImag = Math.cos(angle) * O[k].imag + Math.sin(angle) * O[k].real;

        // complex addition for E[k] and t
        T[k] = {
            real: E[k].real + tReal,
            imag: E[k].imag + tImag
        };

        // complex subtraction for E[k] and t
        T[k + N / 2] = {
            real: E[k].real - tReal,
            imag: E[k].imag - tImag
        };
    }
    return T//res(T);
 
}


async function parallelFFT(input, sampleRate = 44100, frequencyResolution = 1, dedicatedThreadFile=true) {
    const N = input.length;

    // Calculate the number of samples required for the desired resolution
    const M = Math.max(nextPowerOf2(N), Math.ceil(sampleRate / frequencyResolution));
    
    // Pad the input with zeros if needed
    while (input.length < M) {
        input.push({real: 0, imag: 0});
    }

    if (N <= 1) return input;
    
    // Wait for the results from both threads
    //const T = await threadop(threadfft, {message: input});
    const T = await threadop(dedicatedThreadFile ? './dist/fft.thread.js' : threadfft, {message: input});
   
    // Calculate the magnitudes
    const magnitudes = T.map(bin => Math.sqrt(bin.real * bin.real + bin.imag * bin.imag)/M); //not scaling perfectly

    // Calculate mid point
    const midPoint = Math.floor(M/2);

    // Order the magnitudes from -Nyquist to Nyquist
    let orderedMagnitudes = new Array(M);
    for(let i = 0; i < M; i++) {
        if(i < midPoint) {
            orderedMagnitudes[midPoint + i] = magnitudes[i];
        } else {
            orderedMagnitudes[i - midPoint] = magnitudes[i];
        }
    }

    // Frequencies from -Nyquist to Nyquist
    let orderedFreqs = [...Array(M).keys()].map(i => (i - midPoint) * sampleRate / M);

    return {
        amplitudes: orderedMagnitudes,
        freqs: orderedFreqs
    };
}



//Test

import './lib/plotly-latest.min.js'; //local import
document.body.insertAdjacentHTML('beforeend',`<div id="plot"></div>`);
document.body.insertAdjacentHTML('beforeend',`<div id="plot2"></div>`);

// Create a sine wave
const sampleRate = 44100;
const frequency = 2500; // Frequency of A4 note
const duration = 1; // seconds
const amplitude = 0.5;
let sineWave = [];
let sineWave2 = [];

for (let i = 0; i < sampleRate * duration; i++) {
    const value = {
        real: amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate),
        imag: 0
    };
    sineWave.push(value);
    sineWave2.push(value.real);
}



console.time('parallelFFT with file (CPU)')
parallelFFT(sineWave, sampleRate, 1).then(output => {
    console.timeEnd('parallelFFT with file (CPU)');
    const freqs = output.freqs;
    const amplitudes = output.amplitudes;

    const trace = {
        x: freqs,
        y: amplitudes,
        type: 'line',
        name: 'Amplitude Spectrum'
    };

    const layout = {
        title: 'Threaded 2-radix FFT Output',
        xaxis: {
            title: 'Frequency (Hz)'
        },
        yaxis: {
            title: 'Amplitude'
        }
    };

    globalThis.Plotly.newPlot('plot', [trace], layout);

    setTimeout(()=>{
    console.time('parallelFFT with dynamic importing function (CPU)')
    parallelFFT(sineWave, sampleRate, 1, false).then(output => {
        console.timeEnd('parallelFFT with dynamic importing function (CPU)');
    });
    },1000);
});


```

Plus a dedicated worker file to test against the dynamic importing

##### fft.thread.js (built to dist/fft.thread.js)
```js

import {threadop, initWorker} from './lib/threadop.esm.js'

// Cooley-Tukey radix-2 FFT
async function threadfft(input) {
    const N = input.length;

    if (N <= 1) return input;

    // Decomposition into even and odd components
    const even = [];
    const odd = [];
    for (let i = 0; i < N; i += 2) {
        even.push(input[i]);
        if ((i + 1) < N) {
            odd.push(input[i + 1]);
        }
    }

    let E, O;
    if(even.length >= 7500) { // 25% faster
        [E,O] = await Promise.all(
            [
                threadop('./fft.thread.js',{message:even}),
                threadop('./fft.thread.js',{message:odd})
            ]
        );
        
    } else {
        [E, O] = [await threadfft(even), await threadfft(odd)];
    }

    const T = new Array(N);
    for (let k = 0; k < N / 2; k++) {
        const angle = -2 * Math.PI * k / N;

        // complex multiplication for e^(-j*angle) and O[k]
        const tReal = Math.cos(angle) * O[k].real - Math.sin(angle) * O[k].imag;
        const tImag = Math.cos(angle) * O[k].imag + Math.sin(angle) * O[k].real;

        // complex addition for E[k] and t
        T[k] = {
            real: E[k].real + tReal,
            imag: E[k].imag + tImag
        };

        // complex subtraction for E[k] and t
        T[k + N / 2] = {
            real: E[k].real - tReal,
            imag: E[k].imag - tImag
        };
    }
    return T//res(T);
 
}

initWorker(threadfft);



```



### Example 11: WGSL shader for the DFT with re-use (way faster!)

```js
// Example 11: WGSL shader for the DFT with re-use (way faster!), transfer buffers to/from

async function WGSLDFT({inputArray, sampleRate, frequencyResolution}) {
    if(!self.DFT) {
        class DFTProcessor {

            static async create(device = null) {
                if (!device) {
                    const gpu = navigator.gpu;
                    const adapter = await gpu.requestAdapter();
                    device = await adapter.requestDevice();
                }
                const processor = new DFTProcessor();
                await processor.init(device);
                return processor;
            }
        
            async init(device=null) {
                this.device = device;
                this.bindGroupLayout = this.device.createBindGroupLayout({
                    entries: [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.COMPUTE,
                            buffer: {
                                type: 'read-only-storage'
                            }
                        },
                        {
                            binding: 1,
                            visibility: GPUShaderStage.COMPUTE,
                            buffer: {
                                type: 'storage'
                            }
                        }
                    ]
                });
        
                this.pipelineLayout = this.device.createPipelineLayout({
                    bindGroupLayouts: [this.bindGroupLayout]
                });
        
                this.shaderModule = this.device.createShaderModule({
                    code: `
                
        struct InputData {
            values : array<f32>
        }
        
        struct OutputData {
            values: array<f32>
        }
        
        @group(0) @binding(0)
        var<storage, read> inputData: InputData;
        
        @group(0) @binding(1)
        var<storage, read_write> outputData: OutputData;
        
        @compute @workgroup_size(256)
        fn main(
            @builtin(global_invocation_id) globalId: vec3<u32>
        ) {
            let N = arrayLength(&inputData.values);
            let k = globalId.x;
            var sum = vec2<f32>(0.0, 0.0);
        
            for (var n = 0u; n < N; n = n + 1u) {
                let phase = 2.0 * 3.14159265359 * f32(k) * f32(n) / f32(N);
                sum = sum + vec2<f32>(
                    inputData.values[n] * cos(phase),
                    -inputData.values[n] * sin(phase)
                );
            }
        
            let outputIndex = k * 2;
            if (outputIndex + 1 < arrayLength(&outputData.values)) {
                outputData.values[outputIndex] = sum.x;
                outputData.values[outputIndex + 1] = sum.y;
            }
        }
        
        `
                });
        
                this.computePipeline = this.device.createComputePipeline({
                    layout: this.pipelineLayout,
                    compute: {
                        module: this.shaderModule,
                        entryPoint: 'main'
                    }
                });
            }
        
            process(inputArray, sampleRate, frequencyResolution) {
        
                //recycle buffers when input sizes are the same
                if (!this.inputData || this.inputData.byteLength !== inputArray.byteLength) {
                    this.inputData = this.device.createBuffer({
                        size: inputArray.byteLength,
                        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
                        mappedAtCreation: true
                    });
                    new Float32Array(this.inputData.getMappedRange()).set(inputArray);
                    this.inputData.unmap();

                    this.outputData = this.device.createBuffer({
                        size: inputArray.byteLength * 2,
                        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
                    });

                    this.bindGroup = this.device.createBindGroup({
                        layout: this.bindGroupLayout,
                        entries: [
                            {
                                binding: 0,
                                resource: {
                                    buffer: this.inputData
                                }
                            },
                            {
                                binding: 1,
                                resource: {
                                    buffer: this.outputData
                                }
                            }
                        ]
                    });
                } else {
                    const array = new Float32Array(this.inputData.getMappedRange());
                    array.set(inputArray);
                    this.inputData.unmap();
                }
        
                const commandEncoder = this.device.createCommandEncoder();
                const passEncoder = commandEncoder.beginComputePass();
        
                passEncoder.setPipeline(this.computePipeline);
                passEncoder.setBindGroup(0, this.bindGroup);
                passEncoder.dispatchWorkgroups(Math.ceil(inputArray.length / 64));
        
                passEncoder.end();
        
                const stagingBuffer = this.device.createBuffer({
                    size: this.outputData.size,
                    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
                });
        
                commandEncoder.copyBufferToBuffer(
                    this.outputData, 0,
                    stagingBuffer, 0,
                    this.outputData.size
                );
        
        
                this.device.queue.submit([commandEncoder.finish()]);
        
                return new Promise((res) => {
                    stagingBuffer.mapAsync(GPUMapMode.READ).then(() => {
                        const mappedRange = stagingBuffer.getMappedRange();
                        const rawResults = new Float32Array(mappedRange); 
                        const copiedResults = new Float32Array(rawResults.length);
                        
                        copiedResults.set(rawResults); // Fast copy
        
                        stagingBuffer.unmap();

                        res({message:copiedResults, transfer:[copiedResults.buffer]}); //specific output format to trigger transferables 
                    });
                })
                
            }
        }
        

        self.DFT = await DFTProcessor.create();
    }

    return self.DFT.process(inputArray, sampleRate, frequencyResolution);
}

const inputArray = new Float32Array(sampleRate); // 1 second of samples
for (let i = 0; i < sampleRate; i++) {
    inputArray[i] = amplitude * Math.sin(2 * Math.PI * frequency * i / sampleRate); // 440Hz
}
const inp2 = new Float32Array(inputArray);

console.time('WGSL DFT Thread')
threadop(WGSLDFT).then((helper) => {
    helper.run({inputArray, sampleRate, frequencyResolution:1},[inputArray.buffer]).then((output) => {
        console.timeEnd('WGSL DFT Thread')
        //console.log('WGSLDFT Result', output); //unordered results

        //console.log(rawResults)
        function rearrangeDFTOutput(output) {
            const halfLength = output.length / 2;
            const rearranged = new Float32Array(output.length);

            // Copy the negative frequencies (second half of the output) to the beginning of the rearranged array
            rearranged.set(output.subarray(halfLength), 0);

            // Copy the positive frequencies (first half of the output) to the end of the rearranged array
            rearranged.set(output.subarray(0, halfLength), halfLength);

            return rearranged;
        }

        const rearrangedResults = rearrangeDFTOutput(output);
        
        // Compute the magnitude of the results
        const magnitudes = [];
        for (let i = 0; i < rearrangedResults.length; i += 2) {
            const real = rearrangedResults[i];
            const imag = rearrangedResults[i + 1];
            const magnitude = 4 * Math.sqrt(real * real + imag * imag) / rearrangedResults.length;
            magnitudes.push(magnitude);
        }

        const frequencyBins = [];

        const numSamples = output.length / 2;
        const deltaF = sampleRate / numSamples; // Frequency resolution
        for (let i = 0; i < numSamples / 2; i++) {
            frequencyBins[i] = -sampleRate / 2 + i * deltaF;
        }
        for (let i = numSamples / 2; i < numSamples; i++) {
            frequencyBins[i] = deltaF * (i - numSamples / 2);
        }

        const trace = {
            x: frequencyBins,
            y: magnitudes,
            type: 'line'
        };

        document.body.insertAdjacentHTML('beforeend',`<div id="plot3"></div>`);

        const layout = {
            title: 'DFT Magnitude Spectrum',
            xaxis: {
                title: 'Frequency (Hz)'
            },
            yaxis: {
                title: 'Magnitude'
            }
        };
    
        Plotly.newPlot('plot3', [trace], layout);


        console.time('WGSL DFT Thread Run 2')
        helper.run({inputArray:inp2, sampleRate, frequencyResolution:1}, [inp2.buffer]).then((output) => {
            console.timeEnd('WGSL DFT Thread Run 2')
            helper.terminate();
        });
    });
});



```
