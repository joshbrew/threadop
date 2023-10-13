(()=>{var I=Object.defineProperty;var A=(t,g)=>{for(var f in g)I(t,f,{get:g[f],enumerable:!0})};var k={};A(k,{default:()=>B,generateWorkerURL:()=>N,initWorker:()=>D,threadop:()=>C,workerFnString:()=>L});function C(t=W=>W,{imports:g,message:f,transfer:n,port:r,blocking:l,pool:R,loop:p,animate:T,callback:M}={}){return new Promise((W,K)=>{let O;if(typeof t!="function"){if(typeof t=="string"&&t.startsWith("./")){let i=location.origin,s=location.pathname.split("/");s.pop();let c=s.join("/");c.startsWith("http")?i+="/":i+=c+"/",t=i+t}O=t}else O=N(t,g);let P=i=>{let s={},c=!1;i.onmessage=o=>{for(let e in s)s[e](o.data.message,o.data.cb)},i.onerror=o=>{console.error(new Error("Worker encountered an error: "+o.message))};let u=(o,e,a)=>new Promise((b,d)=>{if(!a&&i.PORTS)i.postMessage({message:o,overridePort:a},e),b(!0);else{if(l){if(c)return new Promise((h,S)=>{S("Thread Blocked")});c=!0}let E=Math.random();s[E]=(h,S)=>{E===S&&(delete s[E],l&&(c=!1),b(h))},i.postMessage({message:o,cb:E,overridePort:a},e)}}),m={run:(o,e,a)=>u(o,e,a),terminate:()=>{if(URL.revokeObjectURL(O),i.terminate(),i.PORTS){let o=(e,a)=>{e.postMessage({COMMAND:{DELETED:i.id}})};i.PORTS.forEach(o)}},addPort:o=>y(i,o,l),addCallback:(o=a=>{},e)=>{let a=Math.random();return s[a]=e?b=>{o(b),delete s[a]}:o,a},removeCallback:o=>{delete m.callbacks[o]},setLoop:(o,e,a)=>{i.postMessage({message:e,COMMAND:{SETLOOP:o}},a)},setAnimation:(o,e)=>{i.postMessage({message:o,COMMAND:{SETANIM:!0}},e)},stop:()=>{i.postMessage({COMMAND:{STOP:!0}})},worker:i,callbacks:s,id:i.id};return M&&m.addCallback(M),p?m.setLoop(p,f,n):T&&m.setAnimation(f,n),m};if(R){let c=function(){let m=new Worker(O,g||typeof t!="function"?{type:"module"}:void 0),o=Math.random();return m.id=o,i[o]=m,o},i={},s={};for(let m=0;m<R;m++)c();let u=Object.keys(i);if(r&&u.forEach((m,o)=>{let e=i[m];Array.isArray(r)?y(e,r[o],l):y(e,r,l)}),f&&!p&&!T)Promise.all(u.map((m,o)=>{let e=i[m],a=Array.isArray(f)?f[o]:f;return new Promise((b,d)=>{e.onmessage=h=>{Promise.resolve().then(()=>{e.terminate(),delete i[e.id]}),b(h.data.message)},e.onerror=h=>{Promise.resolve().then(()=>{e.terminate(),delete i[e.id]}),d(new Error("Worker encountered an error: "+h.message))};let E={message:a,oneOff:!0};e.postMessage(E,n)})})).then(m=>{URL.revokeObjectURL(O),W(m)}).catch(m=>{URL.revokeObjectURL(O),Object.keys(i).map((o,e)=>{let a=i[o];a&&a.terminate(),delete i[o],delete s.helpers?.[o]}),K(m)});else{let m=0;Object.assign(s,{workers:i,helpers:{},keys:u,run:(e,a,b,d)=>{if(d)s.helpers[d]?.run(e,a);else if(Array.isArray(e)){let E=e.length;for(let h=0;h<E;h++)s.helpers[u[m]].run(e[h],a[h],b),m++,m>=u.length&&(m=0)}else s.helpers[u[m]].run(e,a,b),m++,m>=u.length&&(m=0)},terminate:e=>{function a(b){s.helpers[b]?.terminate(),delete s.helpers[b],delete s.workers[b]}e?a(e):u.forEach(a)},addWorker:()=>{let e=c(),a=i[e];return o(a),u.length=0,u.push(...u),e},addPort:(e,a)=>{function b(d){return s.helpers[d]?.addPort(e),!0}return a?b(a):u.map(b)},addCallback:(e,a,b)=>{function d(E){return s.helpers[E]?.addCallback(e,a)}return b?d(b):u.map(d)},removeCallback:(e,a)=>{function b(d){return s.helpers[d]?.removeCallback(e),!0}return a?b(a):u.map(b)},setLoop:(e,a,b,d)=>{function E(h){s.helpers[h]?.setLoop(e,a,b)}return d?E(d):u.map(E)},setAnimation:(e,a,b)=>{function d(E){s.helpers[E]?.setAnimation(e,a)}return b?d(b):u.map(d)},stop:e=>{function a(b){s.helpers[b]?.stop()}return e?a(e):u.map(a)}});let o=e=>{s.helpers[e.id]=P(e)};Object.keys(i).forEach((e,a)=>{o(i[e])}),W(s)}}else{let i=Math.random(),s=new Worker(O,g||typeof t!="function"?{type:"module"}:void 0);if(s.id=i,r&&(r.id||(r.id=Math.random()),Array.isArray(r)?r.map(c=>{y(s,c,l)}):y(s,r,l)),f&&!p&&!T)s.onmessage=c=>{Promise.resolve().then(()=>{s.terminate(),URL.revokeObjectURL(O)}),W(c.data.message)},s.onerror=c=>{Promise.resolve().then(()=>{s.terminate(),URL.revokeObjectURL(O)}),K(new Error("Worker encountered an error: "+c.message))},s.postMessage({message:f,oneOff:!0},n);else{let c=P(s);W(c)}}})}function j(t){let g=location.pathname.split("/");g.pop();let f=location.origin+g.join("/")+"/";return typeof t=="string"?(t.startsWith("./")&&(t=f+t),t.includes("import")?`${t}`:`import '${t}';`):Array.isArray(t)?t.map(n=>(n.startsWith("./")&&(n=f+n),n.includes("import")?n:`import '${n}';`)).join(`
`):typeof t=="object"?Object.entries(t).map(([r,l])=>(r.startsWith("./")&&(r=f+r),typeof l=="string"?`import ${l} from '${r}';`:typeof l=="boolean"&&l?`import '${r}'`:`import { ${Object.entries(l).map(([p,T])=>typeof T=="string"?`${p} as ${T}`:p).join(", ")} } from '${r}';`)).join(`
`)+"":""}function y(t,g,f){let n=new MessageChannel;t.id||(t.id=Math.random()),g.id||(g.id=Math.random()),t.postMessage({COMMAND:{SENDER:n.port1,id:g.id,blocking:f}},[n.port1]),g.postMessage({COMMAND:{RECEIVER:n.port2,id:t.id,blocking:f}},[n.port2]),t.PORTS||(t.PORTS=[]),t.PORTS.push(g),g.PORTS||(g.PORTS=[]),g.PORTS.push(t)}var D=(t=()=>{})=>{globalThis.WORKER={};let g=(n,r,l,R)=>{if(globalThis.WORKER.SENDERS&&R!==!0)if(R!=="both")globalThis.WORKER.SENDERS[R]&&(n?.message?globalThis.WORKER.SENDERS[R].postMessage({message:n.message},n.transfer):globalThis.WORKER.SENDERS[R].postMessage({message:n}));else{for(let p in globalThis.WORKER.SENDERS){if(globalThis.WORKER.BLOCKING[p]){if(globalThis.WORKER.BLOCKED[p]){console.error("Thread Blocked: "+p);continue}globalThis.WORKER.BLOCKED[p]=!0}n?.message?globalThis.WORKER.SENDERS[p].postMessage({message:n.message},n.transfer):globalThis.WORKER.SENDERS[p].postMessage({message:n})}l&&postMessage(!0)}(!globalThis.WORKER.SENDERS||R===!0||R!=="both"&&!globalThis.WORKER.SENDERS[R])&&(n?.message?postMessage({message:n.message,cb:r},n.transfer):postMessage({message:n,cb:r}))},f=(n,r)=>{let l=t(n.data?.message);l?.then?l.then(R=>{r&&r.postMessage(!0),g(R,n.data.cb,n.data.oneOff,n.data.overridePort)}):(r&&r.postMessage(!0),g(l,n.data.cb,n.data.oneOff,n.data.overridePort))};globalThis.onmessage=n=>{if(n.data?.COMMAND){let r=n.data.COMMAND;if(typeof r.SETLOOP=="number"){globalThis.WORKER.LOOP&&clearTimeout(globalThis.WORKER.LOOP);let l=()=>{f(n),globalThis.WORKER.LOOP=setTimeout(()=>{l()},r.SETLOOP)};l()}if(r.SETANIM){globalThis.WORKER.ANIM&&cancelAnimationFrame(globalThis.WORKER.ANIM);let l=()=>{f(n),globalThis.WORKER.ANIM=requestAnimationFrame(()=>{l()})};l()}if(r.STOP&&(globalThis.WORKER.LOOP&&clearTimeout(globalThis.WORKER.LOOP),globalThis.WORKER.ANIM&&cancelAnimationFrame(globalThis.WORKER.ANIM)),r.RECEIVER){let l=r.blocking;globalThis.WORKER.RECEIVERS||(globalThis.WORKER.RTCR=0,globalThis.WORKER.RECEIVERS={});let R=r.id;globalThis.WORKER.RECEIVERS[R]=r.RECEIVER,globalThis.WORKER.RTCR++,r.RECEIVER.onmessage=p=>{f(p,l?r.RECEIVER:void 0)},r.RECEIVER.onerror=p=>{delete globalThis.WORKER.RECEIVERS[R]}}if(r.SENDER){globalThis.WORKER.SENDERS||(globalThis.WORKER.PCTR=0,globalThis.WORKER.SENDERS={},globalThis.WORKER.BLOCKING={},globalThis.WORKER.BLOCKED={});let l=r.blocking,R=r.id?r.id:globalThis.WORKER.PCTR;globalThis.WORKER.SENDERS[R]=r.SENDER,globalThis.WORKER.PCTR++,l&&(globalThis.WORKER.BLOCKING[R]=!0),r.SENDER.onmessage=p=>{globalThis.WORKER.BLOCKING[R]&&(globalThis.WORKER.BLOCKED[R]=!1)},r.SENDER.onerror=p=>{delete globalThis.WORKER.SENDERS[R]}}r.DELETED&&(delete globalThis.WORKER.RECEIVERS?.[r.DELETED],delete globalThis.WORKER.SENDERS?.[r.DELETED])}else f(n)},globalThis.onerror=n=>{console.error(n)}},L=D.toString(),N=(t,g)=>{let f=L.replace("()=>{}",t.toString()),r=`${j(g)}
(${f})()`,l=new Blob([r],{type:"application/javascript"});return URL.createObjectURL(l)},B=C;["threadop","initWorker"].forEach(t=>{k[t]&&(globalThis[t]=k[t])});})();
