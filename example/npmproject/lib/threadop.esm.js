function C(i=W=>W,{imports:u,message:g,transfer:r,port:n,blocking:l,pool:f,loop:d,animate:y,callback:P}={}){return new Promise((W,S)=>{let O;if(typeof i!="function"){if(typeof i=="string"&&i.startsWith("./")){let s=location.origin,t=location.pathname.split("/");t.pop();let c=t.join("/");c.startsWith("http")?s+="/":s+=c+"/",i=s+i}O=i}else O=I(i,u);let M=s=>{let t={},c=!1;s.onmessage=a=>{for(let e in t)t[e](a.data.message,a.data.cb)},s.onerror=a=>{console.error(new Error("Worker encountered an error: "+a.message))};let R=(a,e,o)=>new Promise((b,p)=>{if(!o&&s.PORTS)s.postMessage({message:a,overridePort:o},e),b(!0);else{if(l){if(c)return new Promise((h,T)=>{T("Thread Blocked")});c=!0}let E=Math.random();t[E]=(h,T)=>{E===T&&(delete t[E],l&&(c=!1),b(h))},s.postMessage({message:a,cb:E,overridePort:o},e)}}),m={run:(a,e,o)=>R(a,e,o),terminate:()=>{if(URL.revokeObjectURL(O),s.terminate(),s.PORTS){let a=(e,o)=>{e.postMessage({COMMAND:{DELETED:s.id}})};s.PORTS.forEach(a)}},addPort:a=>k(s,a,l),addCallback:(a=o=>{},e)=>{let o=Math.random();return t[o]=e?b=>{a(b),delete t[o]}:a,o},removeCallback:a=>{delete m.callbacks[a]},setLoop:(a,e,o)=>{s.postMessage({message:e,COMMAND:{SETLOOP:a}},o)},setAnimation:(a,e)=>{s.postMessage({message:a,COMMAND:{SETANIM:!0}},e)},stop:()=>{s.postMessage({COMMAND:{STOP:!0}})},worker:s,callbacks:t,id:s.id};return P&&m.addCallback(P),d?m.setLoop(d,g,r):y&&m.setAnimation(g,r),m};if(f){let c=function(){let m=new Worker(O,u||typeof i!="function"?{type:"module"}:void 0),a=Math.random();return m.id=a,s[a]=m,a},s={},t={};for(let m=0;m<f;m++)c();let R=Object.keys(s);if(n&&R.forEach((m,a)=>{let e=s[m];Array.isArray(n)?n.length===R.length?k(e,n[a],l):n.forEach(o=>{k(e,o,l)}):k(e,n,l)}),g&&!d&&!y)Promise.all(R.map((m,a)=>{let e=s[m],o=Array.isArray(g)?g[a]:g;return new Promise((b,p)=>{e.onmessage=h=>{Promise.resolve().then(()=>{e.terminate(),delete s[e.id]}),b(h.data.message)},e.onerror=h=>{Promise.resolve().then(()=>{e.terminate(),delete s[e.id]}),p(new Error("Worker encountered an error: "+h.message))};let E={message:o,oneOff:!0};e.postMessage(E,r)})})).then(m=>{URL.revokeObjectURL(O),W(m)}).catch(m=>{URL.revokeObjectURL(O),Object.keys(s).map((a,e)=>{let o=s[a];o&&o.terminate(),delete s[a],delete t.helpers?.[a]}),S(m)});else{let m=0;Object.assign(t,{workers:s,helpers:{},keys:R,run:(e,o,b,p)=>{if(p)return t.helpers[p]?.run(e,o);if(Array.isArray(e)){let E=e.length,h=[];for(let T=0;T<E;T++){let K=t.helpers[R[m]].run(e[T],o[T],b);m++,m>=R.length&&(m=0),h.push(K)}return h}else{let E=t.helpers[R[m]].run(e,o,b);return m++,m>=R.length&&(m=0),E}},terminate:e=>{function o(b){t.helpers[b]?.terminate(),delete t.helpers[b],delete t.workers[b]}e?o(e):R.forEach(o)},addWorker:()=>{let e=c(),o=s[e];return a(o),R.length=0,R.push(...R),e},addPort:(e,o)=>{function b(p){return t.helpers[p]?.addPort(e),!0}return o?b(o):R.map(b)},addCallback:(e,o,b)=>{function p(E){return t.helpers[E]?.addCallback(e,o)}return b?p(b):R.map(p)},removeCallback:(e,o)=>{function b(p){return t.helpers[p]?.removeCallback(e),!0}return o?b(o):R.map(b)},setLoop:(e,o,b,p)=>{function E(h){t.helpers[h]?.setLoop(e,o,b)}return p?E(p):R.map(E)},setAnimation:(e,o,b)=>{function p(E){t.helpers[E]?.setAnimation(e,o)}return b?p(b):R.map(p)},stop:e=>{function o(b){t.helpers[b]?.stop()}return e?o(e):R.map(o)}});let a=e=>{t.helpers[e.id]=M(e)};Object.keys(s).forEach((e,o)=>{a(s[e])}),W(t)}}else{let s=Math.random(),t=new Worker(O,u||typeof i!="function"?{type:"module"}:void 0);if(t.id=s,n&&(n.id||(n.id=Math.random()),Array.isArray(n)?n.map(c=>{k(t,c,l)}):k(t,n,l)),g&&!d&&!y)t.onmessage=c=>{Promise.resolve().then(()=>{t.terminate(),URL.revokeObjectURL(O)}),W(c.data.message)},t.onerror=c=>{Promise.resolve().then(()=>{t.terminate(),URL.revokeObjectURL(O)}),S(new Error("Worker encountered an error: "+c.message))},t.postMessage({message:g,oneOff:!0},r);else{let c=M(t);W(c)}}})}function D(i){let u=location.pathname.split("/");u.pop();let g=location.origin+u.join("/")+"/";return typeof i=="string"?(i.startsWith("./")&&(i=g+i),i.includes("import")?`${i}`:`import '${i}';`):Array.isArray(i)?i.map(r=>(r.startsWith("./")&&(r=g+r),r.includes("import")?r:`import '${r}';`)).join(`
`):typeof i=="object"?Object.entries(i).map(([n,l])=>(n.startsWith("./")&&(n=g+n),typeof l=="string"?`import ${l} from '${n}';`:typeof l=="boolean"&&l?`import '${n}'`:`import { ${Object.entries(l).map(([d,y])=>typeof y=="string"?`${d} as ${y}`:d).join(", ")} } from '${n}';`)).join(`
`)+"":""}function k(i,u,g){let r=new MessageChannel;i.id||(i.id=Math.random()),u.id||(u.id=Math.random()),i.postMessage({COMMAND:{SENDER:r.port1,id:u.id,blocking:g}},[r.port1]),u.postMessage({COMMAND:{RECEIVER:r.port2,id:i.id,blocking:g}},[r.port2]),i.PORTS||(i.PORTS=[]),i.PORTS.push(u),u.PORTS||(u.PORTS=[]),u.PORTS.push(i)}var L=(i=()=>{})=>{globalThis.WORKER={};let u=(r,n,l,f)=>{if(globalThis.WORKER.SENDERS&&f!==!0)if(f!==void 0&&f!=="both")globalThis.WORKER.SENDERS[f]&&(r?.message?globalThis.WORKER.SENDERS[f].postMessage({message:r.message,overridePort:r?.overridePort},r.transfer):globalThis.WORKER.SENDERS[f].postMessage({message:r,overridePort:r?.overridePort}));else{for(let d in globalThis.WORKER.SENDERS){if(globalThis.WORKER.BLOCKING[d]){if(globalThis.WORKER.BLOCKED[d]){console.error("Thread Blocked: "+d);continue}globalThis.WORKER.BLOCKED[d]=!0}r?.message?globalThis.WORKER.SENDERS[d].postMessage({message:r.message,overridePort:r?.overridePort},r.transfer):globalThis.WORKER.SENDERS[d].postMessage({message:r,overridePort:r?.overridePort})}l&&postMessage(!0)}(!globalThis.WORKER.SENDERS||f===!0||f==="both")&&(r?.message?postMessage({message:r.message,cb:n,overridePort:r?.overridePort},r.transfer):postMessage({message:r,cb:n,overridePort:r?.overridePort}))},g=(r,n)=>{let l=i(r.data?.message);l?.then?l.then(f=>{n&&n.postMessage(!0),u(f,r.data.cb,r.data.oneOff,r.data.overridePort)}):(n&&n.postMessage(!0),u(l,r.data.cb,r.data.oneOff,r.data.overridePort))};globalThis.onmessage=r=>{if(r.data?.COMMAND){let n=r.data.COMMAND;if(typeof n.SETLOOP=="number"){globalThis.WORKER.LOOP&&clearTimeout(globalThis.WORKER.LOOP);let l=()=>{g(r),globalThis.WORKER.LOOP=setTimeout(()=>{l()},n.SETLOOP)};l()}if(n.SETANIM){globalThis.WORKER.ANIM&&cancelAnimationFrame(globalThis.WORKER.ANIM);let l=()=>{g(r),globalThis.WORKER.ANIM=requestAnimationFrame(()=>{l()})};l()}if(n.STOP&&(globalThis.WORKER.LOOP&&clearTimeout(globalThis.WORKER.LOOP),globalThis.WORKER.ANIM&&cancelAnimationFrame(globalThis.WORKER.ANIM)),n.RECEIVER){let l=n.blocking;globalThis.WORKER.RECEIVERS||(globalThis.WORKER.RTCR=0,globalThis.WORKER.RECEIVERS={});let f=n.id;globalThis.WORKER.RECEIVERS[f]=n.RECEIVER,globalThis.WORKER.RTCR++,n.RECEIVER.onmessage=d=>{g(d,l?n.RECEIVER:void 0)},n.RECEIVER.onerror=d=>{delete globalThis.WORKER.RECEIVERS[f]}}if(n.SENDER){globalThis.WORKER.SENDERS||(globalThis.WORKER.PCTR=0,globalThis.WORKER.SENDERS={},globalThis.WORKER.BLOCKING={},globalThis.WORKER.BLOCKED={});let l=n.blocking,f=n.id?n.id:globalThis.WORKER.PCTR;globalThis.WORKER.SENDERS[f]=n.SENDER,globalThis.WORKER.PCTR++,l&&(globalThis.WORKER.BLOCKING[f]=!0),n.SENDER.onmessage=d=>{globalThis.WORKER.BLOCKING[f]&&(globalThis.WORKER.BLOCKED[f]=!1)},n.SENDER.onerror=d=>{delete globalThis.WORKER.SENDERS[f]}}n.DELETED&&(delete globalThis.WORKER.RECEIVERS?.[n.DELETED],delete globalThis.WORKER.SENDERS?.[n.DELETED])}else g(r)},globalThis.onerror=r=>{console.error(r)}},N=L.toString(),I=(i,u)=>{let g=N.replace("()=>{}",i.toString()),n=`${D(u)}

(${g})()`;console.log(n);let l=new Blob([n],{type:"application/javascript"});return URL.createObjectURL(l)},A=C;export{A as default,I as generateWorkerURL,L as initWorker,C as threadop,N as workerFnString};
