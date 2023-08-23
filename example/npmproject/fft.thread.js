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

