/* 
    esbuild + nodejs development server. 
    Begin your javascript application here. This file serves as a simplified entry point to your app, 
    all other scripts you want to build can stem from here if you don't want to define more entryPoints 
    and an outdir in the bundler settings.

    Just ctrl-A + delete all this to get started on your app.

*/

import './index.css' //compiles with esbuild, just link the stylesheet in your index.html (the boilerplate shows this example)

import threadop from 'threadop'




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
    
            //-----------------------------------------------------------------------------------
    
    
    
    
    
    
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
    
                    workerHelperA.run(5) //Blocked!
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
                imports: './num.min.js', //['./num.min.js'] //or { './num.min.js':true } //use objects to get more fine grained, e.g. for a import url pass an object with specific module methods and alias strings or bools
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