function P(i=y=>y,{imports:R,message:g,transfer:n,port:r,blocking:l,pool:f,loop:p,animate:T,callback:S}={}){return new Promise((y,M)=>{let O;if(typeof i!="function"){if(typeof i=="string"&&i.startsWith("./")){let o=location.origin,t=location.pathname.split("/");t.pop();let c=t.join("/");c.startsWith("http")?o+="/":o+=c+"/",i=o+i}O=i}else O=N(i,R);let K=o=>{let t={},c=!1;o.onmessage=s=>{for(let e in t)t[e](s.data.message,s.data.cb)},o.onerror=s=>{console.error(new Error("Worker encountered an error: "+s.message))};let u=(s,e,a)=>new Promise((b,d)=>{if(!a&&o.PORTS)o.postMessage({message:s,overridePort:a},e),b(!0);else{if(l){if(c)return new Promise((h,k)=>{k("Thread Blocked")});c=!0}let E=Math.random();t[E]=(h,k)=>{E===k&&(delete t[E],l&&(c=!1),b(h))},o.postMessage({message:s,cb:E,overridePort:a},e)}}),m={run:(s,e,a)=>u(s,e,a),terminate:()=>{if(URL.revokeObjectURL(O),o.terminate(),o.PORTS){let s=(e,a)=>{e.postMessage({COMMAND:{DELETED:o.id}})};o.PORTS.forEach(s)}},addPort:s=>W(o,s,l),addCallback:(s=a=>{},e)=>{let a=Math.random();return t[a]=e?b=>{s(b),delete t[a]}:s,a},removeCallback:s=>{delete m.callbacks[s]},setLoop:(s,e,a)=>{o.postMessage({message:e,COMMAND:{SETLOOP:s}},a)},setAnimation:(s,e)=>{o.postMessage({message:s,COMMAND:{SETANIM:!0}},e)},stop:()=>{o.postMessage({COMMAND:{STOP:!0}})},worker:o,callbacks:t,id:o.id};return S&&m.addCallback(S),p?m.setLoop(p,g,n):T&&m.setAnimation(g,n),m};if(f){let c=function(){let m=new Worker(O,R||typeof i!="function"?{type:"module"}:void 0),s=Math.random();return m.id=s,o[s]=m,s},o={},t={};for(let m=0;m<f;m++)c();let u=Object.keys(o);if(r&&u.forEach((m,s)=>{let e=o[m];Array.isArray(r)?W(e,r[s],l):W(e,r,l)}),g&&!p&&!T)Promise.all(u.map((m,s)=>{let e=o[m],a=Array.isArray(g)?g[s]:g;return new Promise((b,d)=>{e.onmessage=h=>{Promise.resolve().then(()=>{e.terminate(),delete o[e.id]}),b(h.data.message)},e.onerror=h=>{Promise.resolve().then(()=>{e.terminate(),delete o[e.id]}),d(new Error("Worker encountered an error: "+h.message))};let E={message:a,oneOff:!0};e.postMessage(E,n)})})).then(m=>{URL.revokeObjectURL(O),y(m)}).catch(m=>{URL.revokeObjectURL(O),Object.keys(o).map((s,e)=>{let a=o[s];a&&a.terminate(),delete o[s],delete t.helpers?.[s]}),M(m)});else{let m=0;Object.assign(t,{workers:o,helpers:{},keys:u,run:(e,a,b,d)=>{if(d)t.helpers[d]?.run(e,a);else if(Array.isArray(e)){let E=e.length;for(let h=0;h<E;h++)t.helpers[u[m]].run(e[h],a[h],b),m++,m>=u.length&&(m=0)}else t.helpers[u[m]].run(e,a,b),m++,m>=u.length&&(m=0)},terminate:e=>{function a(b){t.helpers[b]?.terminate(),delete t.helpers[b],delete t.workers[b]}e?a(e):u.forEach(a)},addWorker:()=>{let e=c(),a=o[e];return s(a),u.length=0,u.push(...u),e},addPort:(e,a)=>{function b(d){return t.helpers[d]?.addPort(e),!0}return a?b(a):u.map(b)},addCallback:(e,a,b)=>{function d(E){return t.helpers[E]?.addCallback(e,a)}return b?d(b):u.map(d)},removeCallback:(e,a)=>{function b(d){return t.helpers[d]?.removeCallback(e),!0}return a?b(a):u.map(b)},setLoop:(e,a,b,d)=>{function E(h){t.helpers[h]?.setLoop(e,a,b)}return d?E(d):u.map(E)},setAnimation:(e,a,b)=>{function d(E){t.helpers[E]?.setAnimation(e,a)}return b?d(b):u.map(d)},stop:e=>{function a(b){t.helpers[b]?.stop()}return e?a(e):u.map(a)}});let s=e=>{t.helpers[e.id]=K(e)};Object.keys(o).forEach((e,a)=>{s(o[e])}),y(t)}}else{let o=Math.random(),t=new Worker(O,R||typeof i!="function"?{type:"module"}:void 0);if(t.id=o,r&&(r.id||(r.id=Math.random()),Array.isArray(r)?r.map(c=>{W(t,c,l)}):W(t,r,l)),g&&!p&&!T)t.onmessage=c=>{Promise.resolve().then(()=>{t.terminate(),URL.revokeObjectURL(O)}),y(c.data.message)},t.onerror=c=>{Promise.resolve().then(()=>{t.terminate(),URL.revokeObjectURL(O)}),M(new Error("Worker encountered an error: "+c.message))},t.postMessage({message:g,oneOff:!0},n);else{let c=K(t);y(c)}}})}function C(i){let R=location.pathname.split("/");R.pop();let g=location.origin+R.join("/")+"/";return typeof i=="string"?(i.startsWith("./")&&(i=g+i),i.includes("import")?`${i}`:`import '${i}';`):Array.isArray(i)?i.map(n=>(n.startsWith("./")&&(n=g+n),n.includes("import")?n:`import '${n}';`)).join(`
`):typeof i=="object"?Object.entries(i).map(([r,l])=>(r.startsWith("./")&&(r=g+r),typeof l=="string"?`import ${l} from '${r}';`:typeof l=="boolean"&&l?`import '${r}'`:`import { ${Object.entries(l).map(([p,T])=>typeof T=="string"?`${p} as ${T}`:p).join(", ")} } from '${r}';`)).join(`
`)+"":""}function W(i,R,g){let n=new MessageChannel;i.id||(i.id=Math.random()),R.id||(R.id=Math.random()),i.postMessage({COMMAND:{SENDER:n.port1,id:R.id,blocking:g}},[n.port1]),R.postMessage({COMMAND:{RECEIVER:n.port2,id:i.id,blocking:g}},[n.port2]),i.PORTS||(i.PORTS=[]),i.PORTS.push(R),R.PORTS||(R.PORTS=[]),R.PORTS.push(i)}var D=(i=()=>{})=>{globalThis.WORKER={};let R=(n,r,l,f)=>{if(globalThis.WORKER.SENDERS&&f!==!0)if(typeof f=="string"&&globalThis.WORKER.SENDERS[f])n?.message?globalThis.WORKER.SENDERS[f].postMessage({message:n.message},n.transfer):globalThis.WORKER.SENDERS[f].postMessage({message:n});else{for(let p in globalThis.WORKER.SENDERS){if(globalThis.WORKER.BLOCKING[p]){if(globalThis.WORKER.BLOCKED[p]){console.error("Thread Blocked: "+p);continue}globalThis.WORKER.BLOCKED[p]=!0}n?.message?globalThis.WORKER.SENDERS[p].postMessage({message:n.message},n.transfer):globalThis.WORKER.SENDERS[p].postMessage({message:n})}l&&postMessage(!0)}(!globalThis.WORKER.SENDERS||f===!0||typeof f=="string"&&!globalThis.WORKER.SENDERS[f])&&(n?.message?postMessage({message:n.message,cb:r},n.transfer):postMessage({message:n,cb:r}))},g=(n,r)=>{let l=i(n.data?.message);l?.then?l.then(f=>{r&&r.postMessage(!0),R(f,n.data.cb,n.data.oneOff,n.data.overridePort)}):(r&&r.postMessage(!0),R(l,n.data.cb,n.data.oneOff,n.data.overridePort))};globalThis.onmessage=n=>{if(n.data?.COMMAND){let r=n.data.COMMAND;if(typeof r.SETLOOP=="number"){globalThis.WORKER.LOOP&&clearTimeout(globalThis.WORKER.LOOP);let l=()=>{g(n),globalThis.WORKER.LOOP=setTimeout(()=>{l()},r.SETLOOP)};l()}if(r.SETANIM){globalThis.WORKER.ANIM&&cancelAnimationFrame(globalThis.WORKER.ANIM);let l=()=>{g(n),globalThis.WORKER.ANIM=requestAnimationFrame(()=>{l()})};l()}if(r.STOP&&(globalThis.WORKER.LOOP&&clearTimeout(globalThis.WORKER.LOOP),globalThis.WORKER.ANIM&&cancelAnimationFrame(globalThis.WORKER.ANIM)),r.RECEIVER){let l=r.blocking;globalThis.WORKER.RECEIVERS||(globalThis.WORKER.RTCR=0,globalThis.WORKER.RECEIVERS={});let f=r.id;globalThis.WORKER.RECEIVERS[f]=r.RECEIVER,globalThis.WORKER.RTCR++,r.RECEIVER.onmessage=p=>{g(p,l?r.RECEIVER:void 0)},r.RECEIVER.onerror=p=>{delete globalThis.WORKER.RECEIVERS[f]}}if(r.SENDER){globalThis.WORKER.SENDERS||(globalThis.WORKER.PCTR=0,globalThis.WORKER.SENDERS={},globalThis.WORKER.BLOCKING={},globalThis.WORKER.BLOCKED={});let l=r.blocking,f=r.id?r.id:globalThis.WORKER.PCTR;globalThis.WORKER.SENDERS[f]=r.SENDER,globalThis.WORKER.PCTR++,l&&(globalThis.WORKER.BLOCKING[f]=!0),r.SENDER.onmessage=p=>{globalThis.WORKER.BLOCKING[f]&&(globalThis.WORKER.BLOCKED[f]=!1)},r.SENDER.onerror=p=>{delete globalThis.WORKER.SENDERS[f]}}r.DELETED&&(delete globalThis.WORKER.RECEIVERS?.[r.DELETED],delete globalThis.WORKER.SENDERS?.[r.DELETED])}else g(n)},globalThis.onerror=n=>{console.error(n)}},L=D.toString(),N=(i,R)=>{let g=L.replace("()=>{}",i.toString()),r=`${C(R)}
(${g})()`,l=new Blob([r],{type:"application/javascript"});return URL.createObjectURL(l)},I=P;export{I as default,N as generateWorkerURL,D as initWorker,P as threadop,L as workerFnString};
