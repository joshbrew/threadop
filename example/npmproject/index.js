/* 
    esbuild + nodejs development server. 
    Begin your javascript application here. This file serves as a simplified entry point to your app, 
    all other scripts you want to build can stem from here if you don't want to define more entryPoints 
    and an outdir in the bundler settings.

    Just ctrl-A + delete all this to get started on your app.

*/

import './index.css' //compiles with esbuild, just link the stylesheet in your index.html (the boilerplate shows this example)

import threadop from '../../threadop'//'threadop'


let div0 = document.createElement('div');
div0.innerHTML = "Press F12 to see results";

document.body.appendChild(div0);





//Example 1: One-off usage
/*
    This is the simplest usage of threadop.

    You have a function, workerFunction, that you want to run in a separate thread (i.e., Web Worker).
    You send a single piece of data (5) to this worker, the worker multiplies this data by 2, and sends the result 
    (10) back to the main thread.
    The function is executed once and the worker terminates after this.
            
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








//Example 2: repeat operations

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








//Example 3: Chaining workers
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

        workerHelperA.run(15) //Blocked!
    });

}).catch(error => {
    console.error(error);
});



//Example 4: using imports
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
    imports: './lib/num.min.js', //['./num.min.js'] //or { './num.min.js':true } //use objects to get more fine grained, e.g. for a import url pass an object with specific module methods and alias strings or bools
    message: data
}).then(result => {
    console.log('Example 4: Mean:', result);
}).catch(error => {
    console.error('Example 4: Error:', error);
});


//example 5, web import with a specified library function

const lodashop = data => {
    //const nj = globalThis.nj;  // numjs is attached to globalThis within the worker context
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




//Example 6: Threadpool one-off

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


//Example 7: Threadpool chain

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
  
//First threadpool to encode the strings. Second to reverse. This is best for async batch processes while you need to implement 
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
    });
    
}).catch(error => {
    console.error('Example 7: Error:', error);
}); //should pass the result to pool1





// Example 8: Looping

threadop(
    (data) => `Processed ${data}, ${new Date().toLocaleString()}`,
    {
        message:"ABC123",
        loop:1000,
        callback:(data) => {console.log(data)},
    }
).then((helper) => {
    setTimeout(() => {
        helper.stop();
        helper.terminate();
    },5000);
});





//Example 9: Animation

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


//Example 10: FFT


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

    const SAMPLE_THREAD_THRESHOLD = 7500; //this is not the smartet way to bucket threads but it is a little faster

    if(even.length >= SAMPLE_THREAD_THRESHOLD) { // 25% faster
        [E,O] = await new Promise((res) => {
            import(location.origin+'/lib/threadop.esm.js').then(async (module) => { 
            //this is not the fastest way to instantiate modules in nested threads (better to use a compiled file) but it works
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
    const magnitudes = T.map(bin => Math.sqrt(bin.real * bin.real + bin.imag * bin.imag)/M);

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

import './lib/plotly-latest.min.js';
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


// Use your FFT function
setTimeout(()=>{

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

},5000)



// Example 11: WGSL shader for the DFT with re-use (way faster!)


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
        
                const inputData = this.device.createBuffer({
                    size: inputArray.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
                    mappedAtCreation: true
                });
        
                new Float32Array(inputData.getMappedRange()).set(inputArray);
                inputData.unmap();
        
        
                const outputData = this.device.createBuffer({
                    size: inputArray.byteLength * 2,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
                });
        
                this.bindGroup = this.device.createBindGroup({
                    layout: this.bindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: inputData
                            }
                        },
                        {
                            binding: 1,
                            resource: {
                                buffer: outputData
                            }
                        }
                    ]
                });
        
                const commandEncoder = this.device.createCommandEncoder();
                const passEncoder = commandEncoder.beginComputePass();
        
                passEncoder.setPipeline(this.computePipeline);
                passEncoder.setBindGroup(0, this.bindGroup);
                passEncoder.dispatchWorkgroups(Math.ceil(inputArray.length / 64));
        
                passEncoder.end();
        
                const stagingBuffer = this.device.createBuffer({
                    size: outputData.size,
                    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
                });
        
                commandEncoder.copyBufferToBuffer(
                    outputData, 0,
                    stagingBuffer, 0,
                    outputData.size
                );
        
        
                this.device.queue.submit([commandEncoder.finish()]);
        
                return new Promise((res) => {
                    stagingBuffer.mapAsync(GPUMapMode.READ).then(() => {
                        const mappedRange = stagingBuffer.getMappedRange();
                        const rawResults = new Float32Array(mappedRange); 
                        const copiedResults = new Float32Array(rawResults.length);
                        
                        copiedResults.set(rawResults); // Fast copy
        
                        stagingBuffer.unmap();
        
                        res(copiedResults);
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

console.time('WGSL DFT Thread')
threadop(WGSLDFT).then((helper) => {
    helper.run({inputArray, sampleRate, frequencyResolution:1}).then((output) => {
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

        const numSamples = inputArray.length;
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
        helper.run({inputArray, sampleRate, frequencyResolution:1}).then((output) => {
            console.timeEnd('WGSL DFT Thread Run 2')
        });
    });
})





//------------------------------------------------
document.body.style.backgroundColor = '#101010'; //page color
document.body.style.color = 'white'; //text color
let div = document.createElement('div');
div.innerHTML = 'Hello World!';
div.id = 'floatingDiv';
document.body.appendChild(div);

console.warn('Tinybuild successful!');

// Get the floating div element
var floatingDiv = document.getElementById("floatingDiv");

// Set initial position and velocity
var posX = 0;
var posY = 0;
var velX = 2;
var velY = 2;

// Update the position of the div and handle bouncing off the edges
function updatePosition() {
    posX += velX;
    posY += velY;

    // Check if the div has reached the left or right edge
    if (posX <= 0 || posX + floatingDiv.offsetWidth >= window.innerWidth) {
    velX *= -1; // Reverse the horizontal velocity
    }

    // Check if the div has reached the top or bottom edge
    if (posY <= 0 || posY + floatingDiv.offsetHeight >= window.innerHeight) {
    velY *= -1; // Reverse the vertical velocity
    }

    // Set the new position
    floatingDiv.style.left = posX + "px";
    floatingDiv.style.top = posY + "px";

    requestAnimationFrame(updatePosition);
}

// Call the updatePosition function repeatedly to animate the div
requestAnimationFrame(updatePosition);