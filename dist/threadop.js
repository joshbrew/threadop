(()=>{function L(a=f=>f,{imports:d,message:g,transfer:i,port:n,blocking:b}={}){return new Promise((f,m)=>{let p=Math.random(),y=(()=>{let s=(r,l)=>{if(globalThis.SENDERS)for(let e in globalThis.SENDERS){if(globalThis.BLOCKING[e]){if(globalThis.BLOCKED[e]){console.error("Thread Blocked: "+e);continue}globalThis.BLOCKED[e]=!0}globalThis.SENDERS[e].postMessage({message:r,cb:l})}else postMessage({message:r,cb:l})},E=(r,l)=>{let e=(()=>{})(r.data.message);e?.then?e.then(t=>{l&&l.postMessage(!0),s(t,r.data.cb)}):(l&&l.postMessage(!0),s(e,r.data.cb))};globalThis.onmessage=r=>{if(r.data?.RECEIVER){let l=r.data.blocking;globalThis.RECEIVERS||(globalThis.RTCR=0,globalThis.RECEIVERS={});let e=r.data.id;globalThis.RECEIVERS[e]=r.data.RECEIVER,globalThis.RTCR++,r.data.RECEIVER.onmessage=t=>{E(t,l?r.data.RECEIVER:void 0)},r.data.RECEIVER.onerror=t=>{delete globalThis.RECEIVER[e]}}else if(r.data?.SENDER){globalThis.SENDERS||(globalThis.PCTR=0,globalThis.SENDERS={},globalThis.BLOCKING={},globalThis.BLOCKED={});let l=r.data.blocking,e=r.data.id?r.data.id:globalThis.PCTR;globalThis.SENDERS[e]=r.data.SENDER,globalThis.PCTR++,l&&(globalThis.BLOCKING[e]=!0),r.data.SENDER.onmessage=t=>{globalThis.BLOCKING[e]&&(globalThis.BLOCKED[e]=!1)},r.data.SENDER.onerror=t=>{delete globalThis.SENDERS[e]}}else r.data?.DELETED?(delete globalThis.RECEIVERS?.[r.data.DELETED],delete globalThis.SENDERS?.[r.data.DELETED]):E(r)},globalThis.onerror=r=>{console.error(r)}}).toString().replace("()=>{}",a.toString()),P=`${O(d)}
(${y})()`,D=new Blob([P],{type:"application/javascript"}),R=URL.createObjectURL(D),o=new Worker(R,d?{type:"module"}:void 0);if(n&&k(o,n,p,b),g)o.onmessage=s=>{Promise.resolve().then(()=>{o.terminate(),URL.revokeObjectURL(R)}),f(s.data.message)},o.onerror=s=>{Promise.resolve().then(()=>{o.terminate(),URL.revokeObjectURL(R)}),m(new Error("Worker encountered an error: "+s.message))},o.postMessage({message:g},i);else{let s={},E=!1;o.onmessage=e=>{for(let t in s)s[t](e.data.message,e.data.cb)},o.onerror=e=>{console.error(new Error("Worker encountered an error: "+e.message))};let r=(e,t)=>new Promise((c,u)=>{if(o.PORTS)o.postMessage({message:e},t),c(!0);else{if(b){if(E)return new Promise((S,T)=>{T("Thread Blocked")});E=!0}let h=Math.random();s[h]=(S,T)=>{h===T&&(delete s[h],b&&(E=!1),c(S))},o.postMessage({message:e,cb:h},t)}}),l={run:(e,t)=>r(e,t),terminate:()=>{if(URL.revokeObjectURL(R),o.terminate(),o.PORTS){let e=(t,c)=>{t.postMessage({DELETED:p})};o.PORTS.forEach(e)}},addPort:e=>k(o,e,p,b),addCallback:(e=c=>{},t)=>{let c=Math.random();return s[c]=t?u=>{e(u),delete s[c]}:e,c},removeCallback:e=>{delete l.callbacks[e]},worker:o,callbacks:s};f(l)}})}function O(a){let d=location.pathname.split("/");d.pop();let g=location.origin+d.join("/")+"/";return typeof a=="string"?(a.startsWith("./")&&(a=g+a),a.includes("import")?`${a}`:`import '${a}';`):Array.isArray(a)?a.map(i=>(i.startsWith("./")&&(i=g+i),i.includes("import")?i:`import '${i}';`)).join(`
`):typeof a=="object"?Object.entries(a).map(([n,b])=>(n.startsWith("./")&&(n=g+n),typeof b=="string"?`import ${b} from '${n}';`:typeof b=="boolean"&&b?`import '${n}'`:`import { ${Object.entries(b).map(([m,p])=>typeof p=="string"?`${m} as ${p}`:m).join(", ")} } from '${n}';`)).join(`
`)+"":""}function k(a,d,g,i){let n=new MessageChannel;a.postMessage({SENDER:n.port1,id:g,blocking:i},[n.port1]),d.postMessage({RECEIVER:n.port2,id:g,blocking:i},[n.port2]),a.PORTS||(a.PORTS=[]),a.PORTS.push(d),d.PORTS||(d.PORTS=[]),d.PORTS.push(a)}})();
