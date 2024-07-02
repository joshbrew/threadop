(()=>{var U=Object.defineProperty;var $=(t,p)=>{for(var b in p)U(t,b,{get:p[b],enumerable:!0})};var C={};$(C,{default:()=>w,generateWorkerURL:()=>j,initWorker:()=>v,recursivelyStringifyFunctions:()=>F,threadop:()=>B,workerFnString:()=>L});function B(t=b=>b,p){let b,h,W,e,s,l,n,y,E,k,M;if(t?.constructor?.name!=="Object"&&(b=t),t?.constructor?.name==="Object"||p){let O=p||t;O.operation&&(b=O.operation),h=O.imports,W=O.functions,e=O.message,s=O.transfer,l=O.port,n=O.blocking,y=O.pool,E=O.loop,k=O.animate,M=O.callback}return new Promise((O,A)=>{let N;if(typeof b!="function"){if(typeof b=="string"&&b.startsWith("./")){let m=location.origin,i=location.pathname.split("/");i.pop();let T=i.join("/");T.startsWith("http")?m+="/":m+=T+"/",b=m+b}N=b}else N=j(b,h,W);let x=m=>{let i={},T=!1;m.onmessage=o=>{for(let f in i)i[f](o.data.message,o.data.cb)},m.onerror=o=>{console.error(new Error("Worker encountered an error: "+o.message))};let d=(o,f,r,a)=>new Promise((g,u)=>{if(!r&&m.PORTS)m.postMessage({message:o,overridePort:r,fnName:a},f),g(!0);else{if(n){if(T)return new Promise((P,K)=>{K("Thread Blocked")});T=!0}let R=Math.floor(Math.random()*1e15);i[R]=(P,K)=>{R===K&&(delete i[R],n&&(T=!1),g(P))},m.postMessage({message:o,cb:R,overridePort:r},f)}}),c={run:(o,f,r)=>d(o,f,r),terminate:()=>{if(URL.revokeObjectURL(N),m.terminate(),m.PORTS){let o=(f,r)=>{f.postMessage({COMMAND:{DELETED:m.id}})};m.PORTS.forEach(o)}},addPort:o=>I(m,o,n),addCallback:(o=a=>{},f,r)=>{let a=Math.floor(Math.random()*1e15);return i[a]=f||r?(g,u)=>{(!r||u===r)&&o(g),f&&delete i[a]}:o,a},set:(o,f)=>(typeof o=="function"&&(o=o.toString()),d({setFunction:o,setFunctionName:f})),call:(o,f,r,a)=>d(f,r,a,o),removeCallback:o=>{delete c.callbacks[o]},setLoop:(o,f,r)=>{m.postMessage({message:f,COMMAND:{SETLOOP:o}},r)},setAnimation:(o,f)=>{m.postMessage({message:o,COMMAND:{SETANIM:!0}},f)},stop:()=>{m.postMessage({COMMAND:{STOP:!0}})},worker:m,callbacks:i,id:m.id};return M&&c.addCallback(M),E?c.setLoop(E,e,s):k&&c.setAnimation(e,s),c};if(y){let T=function(){let c=new Worker(N,h||typeof b!="function"?{type:"module"}:void 0),o=Math.floor(Math.random()*1e15);return c.id=o,m[o]=c,o},m={},i={};for(let c=0;c<y;c++)T();let d=Object.keys(m);if(l&&d.forEach((c,o)=>{let f=m[c];Array.isArray(l)?l.length===d.length?I(f,l[o],n):l.forEach(r=>{I(f,r,n)}):I(f,l,n)}),e&&!E&&!k)Promise.all(d.map((c,o)=>{let f=m[c],r=Array.isArray(e)?e[o]:e;return new Promise((a,g)=>{f.onmessage=R=>{Promise.resolve().then(()=>{f.terminate(),delete m[f.id]}),a(R.data.message)},f.onerror=R=>{Promise.resolve().then(()=>{f.terminate(),delete m[f.id]}),g(new Error("Worker encountered an error: "+R.message))};let u={message:r,oneOff:!0};f.postMessage(u,s)})})).then(c=>{URL.revokeObjectURL(N),O(c)}).catch(c=>{URL.revokeObjectURL(N),Object.keys(m).map((o,f)=>{let r=m[o];r&&r.terminate(),delete m[o],delete i.helpers?.[o]}),A(c)});else{let c=0,o=(r,a,g,u,R)=>{if(R)return u?i.helpers[R]?.call(u,r,a):i.helpers[R]?.run(r,a);if(Array.isArray(r)){let P=r.length,K=new Array(P);for(let S=0;S<P;S++){let D;u?D=i.helpers[R]?.call(u,r[S],a[S]):D=i.helpers[d[c]].run(r[S],a[S],g),c++,c>=d.length&&(c=0),K[S]=D}return K}else{let P;return u?P=i.helpers[d[c]].call(u,r,a,g):P=i.helpers[d[c]].run(r,a,g),c++,c>=d.length&&(c=0),P}};Object.assign(i,{workers:m,helpers:{},keys:d,run:(r,a,g,u)=>o(r,a,g,void 0,u),terminate:r=>{function a(g){i.helpers[g]?.terminate(),delete i.helpers[g],delete i.workers[g]}r?a(r):d.forEach(a)},set:(r,a)=>(typeof r=="function"&&(r=r.toString()),o({setFunction:r,setFunctionName:a})),call:(r,a,g,u,R)=>o(a,g,u,r,R),addWorker:()=>{let r=T(),a=m[r];return f(a),d.length=0,d.push(...d),r},addPort:(r,a)=>{function g(u){return i.helpers[u]?.addPort(r),!0}return a?g(a):d.map(g)},addCallback:(r,a,g,u)=>{function R(P){return i.helpers[P]?.addCallback(r,a,g)}return u?R(u):d.map(R)},removeCallback:(r,a)=>{function g(u){return i.helpers[u]?.removeCallback(r),!0}return a?g(a):d.map(g)},setLoop:(r,a,g,u)=>{function R(P){i.helpers[P]?.setLoop(r,a,g)}return u?R(u):d.map(R)},setAnimation:(r,a,g)=>{function u(R){i.helpers[R]?.setAnimation(r,a)}return g?u(g):d.map(u)},stop:r=>{function a(g){i.helpers[g]?.stop()}return r?a(r):d.map(a)}});let f=r=>{i.helpers[r.id]=x(r)};Object.keys(m).forEach((r,a)=>{f(m[r])}),O(i)}}else{let m=Math.floor(Math.random()*1e15),i=new Worker(N,h||typeof b!="function"?{type:"module"}:void 0);if(i.id=m,l&&(l.id||(l.id=Math.floor(Math.random()*1e15)),Array.isArray(l)?l.map(T=>{I(i,T,n)}):I(i,l,n)),e&&!E&&!k)i.onmessage=T=>{Promise.resolve().then(()=>{i.terminate(),URL.revokeObjectURL(N)}),O(T.data.message)},i.onerror=T=>{Promise.resolve().then(()=>{i.terminate(),URL.revokeObjectURL(N)}),A(new Error("Worker encountered an error: "+T.message))},i.postMessage({message:e,oneOff:!0},s);else{let T=x(i);O(T)}}})}function H(t){let p=location.pathname.split("/");p.pop();let b=location.origin+p.join("/")+"/";return typeof t=="string"?(t.startsWith("./")&&(t=b+t),t.includes("import")?`${t}`:`import '${t}';`):Array.isArray(t)?t.map(h=>(h.startsWith("./")&&(h=b+h),h.includes("import")?h:`import '${h}';`)).join(`
`):typeof t=="object"?Object.entries(t).map(([W,e])=>(W.startsWith("./")&&(W=b+W),typeof e=="string"?`import ${e} from '${W}';`:typeof e=="boolean"&&e?`import '${W}'`:`import { ${Object.entries(e).map(([l,n])=>typeof n=="string"?`${l} as ${n}`:l).join(", ")} } from '${W}';`)).join(`
`)+"":""}function I(t,p,b){let h=new MessageChannel;t.id||(t.id=Math.floor(Math.random()*1e15)),p.id||(p.id=Math.floor(Math.random()*1e15)),t.postMessage({COMMAND:{SENDER:h.port1,id:p.id,blocking:b}},[h.port1]),p.postMessage({COMMAND:{RECEIVER:h.port2,id:t.id,blocking:b}},[h.port2]),t.PORTS||(t.PORTS=[]),t.PORTS.push(p),p.PORTS||(p.PORTS=[]),p.PORTS.push(t)}var v=(t=()=>{},p={dummy:()=>{}})=>{globalThis.WORKER={FUNCTIONS:p},p&&Object.keys(p).forEach(e=>{p[e]=p[e].bind(globalThis.WORKER)});function b(e=""){let s=k=>{let M=k.indexOf("=>")+1;return M<=0&&(M=k.indexOf("){")),M<=0&&(M=k.indexOf(") {")),k.slice(0,k.indexOf("{",M)+1)},l=k=>k.replace(/^\W*(function[^{]+\{([\s\S]*)\}|[^=]+=>[^{]*\{([\s\S]*)\}|[^=]+=>(.+))/i,"$2$3$4"),n=s(e),y=l(e),E;if(n.includes("function")){let k=n.substring(n.indexOf("(")+1,n.lastIndexOf(")"));E=new Function(k,y)}else if(n.substring(0,6)===y.substring(0,6)){let k=n.substring(n.indexOf("(")+1,n.lastIndexOf(")"));E=new Function(k,y.substring(y.indexOf("{")+1,y.length-1))}else try{E=(0,eval)(e)}catch{}return E}t=t.bind(globalThis.WORKER);let h=(e,s,l,n,y)=>{if(globalThis.WORKER.SENDERS&&n!==!0)if(n!==void 0&&n!=="both")globalThis.WORKER.SENDERS[n]&&(e?.message?globalThis.WORKER.SENDERS[n].postMessage({message:e.message,overridePort:e?.overridePort,fnName:e?.fnName},e.transfer):globalThis.WORKER.SENDERS[n].postMessage({message:e,overridePort:e?.overridePort,fnName:e?.fnName}));else{for(let E in globalThis.WORKER.SENDERS){if(globalThis.WORKER.BLOCKING[E]){if(globalThis.WORKER.BLOCKED[E]){console.error("Thread Blocked: "+E);continue}globalThis.WORKER.BLOCKED[E]=!0}e?.message?globalThis.WORKER.SENDERS[E].postMessage({message:e.message,overridePort:e?.overridePort,fnName:e?.fnName},e.transfer):globalThis.WORKER.SENDERS[E].postMessage({message:e,overridePort:e?.overridePort,fnName:e?.fnName})}l&&postMessage(!0)}(!globalThis.WORKER.SENDERS||n===!0||n==="both")&&(e?.message?postMessage({message:e.message,cb:s,overridePort:e?.overridePort,fnName:y},e.transfer):postMessage({message:e,cb:s,overridePort:e?.overridePort,fnName:y}))},W=(e,s)=>{let l;if(e.data.setFunction){let n=b(e.data.setFunction).bind(globalThis.WORKER),y=e.data.setFunctionName||Math.floor(Math.random()*1e15);l=y,globalThis.WORKER.FUNCTIONS[y]=n}else if(e.data.fnName){let n=globalThis.WORKER.FUNCTIONS[e.data.fnName];n&&(Array.isArray(e.data?.message)?l=n(...e.data.message):l=n(e.data?.message))}else l=t(e.data?.message);l?.then?l.then(n=>{s&&s.postMessage(!0),h(n,e.data.cb,e.data.oneOff,e.data.overridePort,e.data.fnName)}):(s&&s.postMessage(!0),h(l,e.data.cb,e.data.oneOff,e.data.overridePort,e.data.fnName))};globalThis.onmessage=e=>{if(e.data?.COMMAND){let s=e.data.COMMAND;if(typeof s.SETLOOP=="number"){globalThis.WORKER.LOOP&&clearTimeout(globalThis.WORKER.LOOP);let l=()=>{W(e),globalThis.WORKER.LOOP=setTimeout(()=>{l()},s.SETLOOP)};l()}if(s.SETANIM){globalThis.WORKER.ANIM&&cancelAnimationFrame(globalThis.WORKER.ANIM);let l=()=>{W(e),globalThis.WORKER.ANIM=requestAnimationFrame(()=>{l()})};l()}if(s.STOP&&(globalThis.WORKER.LOOP&&clearTimeout(globalThis.WORKER.LOOP),globalThis.WORKER.ANIM&&cancelAnimationFrame(globalThis.WORKER.ANIM)),s.RECEIVER){let l=s.blocking;globalThis.WORKER.RECEIVERS||(globalThis.WORKER.RTCR=0,globalThis.WORKER.RECEIVERS={});let n=s.id;globalThis.WORKER.RECEIVERS[n]=s.RECEIVER,globalThis.WORKER.RTCR++,s.RECEIVER.onmessage=y=>{W(y,l?s.RECEIVER:void 0)},s.RECEIVER.onerror=y=>{delete globalThis.WORKER.RECEIVERS[n]}}if(s.SENDER){globalThis.WORKER.SENDERS||(globalThis.WORKER.PCTR=0,globalThis.WORKER.SENDERS={},globalThis.WORKER.BLOCKING={},globalThis.WORKER.BLOCKED={});let l=s.blocking,n=s.id?s.id:globalThis.WORKER.PCTR;globalThis.WORKER.SENDERS[n]=s.SENDER,globalThis.WORKER.PCTR++,l&&(globalThis.WORKER.BLOCKING[n]=!0),s.SENDER.onmessage=y=>{globalThis.WORKER.BLOCKING[n]&&(globalThis.WORKER.BLOCKED[n]=!1)},s.SENDER.onerror=y=>{delete globalThis.WORKER.SENDERS[n]}}s.DELETED&&(delete globalThis.WORKER.RECEIVERS?.[s.DELETED],delete globalThis.WORKER.SENDERS?.[s.DELETED])}else W(e)},globalThis.onerror=e=>{console.error(e)}},L=v.toString(),j=(t=()=>{},p,b)=>{let h=L.replace("()=>{}",t.toString());b&&L.replace("{dummy:()=>{}}",JSON.stringify(F(b)));let e=`${H(p)}

(${h})()`,s=new Blob([e],{type:"application/javascript"});return URL.createObjectURL(s)},F=t=>{let p={};for(let b in t)typeof t[b]=="object"?p[b]=F(t[b]):typeof t[b]=="function"?p[b]=t[b].toString():p[b]=t[b];return p},w=B;["threadop","initWorker"].forEach(t=>{C[t]&&(globalThis[t]=C[t])});})();
