const PN={k:'roi',q:'dame',r:'tour',b:'fou',n:'cavalier',p:'pion'};
const VAL={p:100,n:320,b:330,r:500,q:900,k:0};
const N=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KG=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const ROOK=[[-1,0],[1,0],[0,-1],[0,1]], BISH=[[-1,-1],[-1,1],[1,-1],[1,1]];
const isW=p=>p===p.toUpperCase();
const g=(b,r,f)=>r<0||r>7||f<0||f>7?undefined:b[r*8+f];
const sqn=i=>'abcdefgh'[i&7]+(8-(i>>3));

function start(){
  const b=[];
  for(const c of 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'.replace(/\//g,'')){
    if(/\d/.test(c)) for(let i=0;i<+c;i++) b.push(''); else b.push(c);
  }
  return {b,t:'w',c:{K:1,Q:1,k:1,q:1},ep:-1};
}
function attacked(b,r,f,by){
  const up=by==='w'?1:-1, o=c=>by==='w'?c.toUpperCase():c;
  for(const df of [-1,1]) if(g(b,r+up,f+df)===o('p')) return true;
  for(const [a,c] of N) if(g(b,r+a,f+c)===o('n')) return true;
  for(const [a,c] of KG) if(g(b,r+a,f+c)===o('k')) return true;
  for(const [a,c] of KG){
    let rr=r+a,ff=f+c,p;
    while((p=g(b,rr,ff))===''){rr+=a;ff+=c;}
    if(p&&(p===o('q')||p===o(a&&c?'b':'r'))) return true;
  }
  return false;
}
function inCheck(s,col){
  const k=s.b.indexOf(col==='w'?'K':'k');
  return attacked(s.b,k>>3,k&7,col==='w'?'b':'w');
}
function apply(s,m){
  const b=s.b.slice(), p=b[m.f], w=isW(p), c={...s.c};
  let ep=-1;
  b[m.t]=m.pr?(w?m.pr.toUpperCase():m.pr):p; b[m.f]='';
  if(m.ep) b[m.t+(w?8:-8)]='';
  if(m.ca){
    const base=w?56:0;
    if(m.t>m.f){b[base+5]=b[base+7];b[base+7]='';} else {b[base+3]=b[base];b[base]='';}
  }
  if(p.toLowerCase()==='p'&&Math.abs(m.t-m.f)===16) ep=(m.f+m.t)/2;
  if(p==='K'){c.K=0;c.Q=0} if(p==='k'){c.k=0;c.q=0}
  for(const q of [m.f,m.t]){ if(q===63)c.K=0; if(q===56)c.Q=0; if(q===7)c.k=0; if(q===0)c.q=0; }
  return {b,t:s.t==='w'?'b':'w',c,ep};
}
function moves(s){
  const {b,t,c,ep}=s, w=t==='w', out=[];
  const add=(f,to,x)=>out.push({f,t:to,...x});
  for(let i=0;i<64;i++){
    const p=b[i]; if(!p||isW(p)!==w) continue;
    const r=i>>3,f=i&7,l=p.toLowerCase();
    if(l==='p'){
      const d=w?-1:1, pr=w?0:7;
      const go=to=>{ if((to>>3)===pr) for(const q of 'qrbn') add(i,to,{pr:q}); else add(i,to); };
      if(g(b,r+d,f)===''){ go((r+d)*8+f); if(r===(w?6:1)&&g(b,r+2*d,f)==='') add(i,(r+2*d)*8+f); }
      for(const df of [-1,1]){
        const q=g(b,r+d,f+df); if(q===undefined) continue;
        const to=(r+d)*8+f+df;
        if(q&&isW(q)!==w) go(to); else if(to===ep) add(i,to,{ep:1});
      }
    } else {
      const dirs=l==='n'?N:l==='r'?ROOK:l==='b'?BISH:KG, slide=l==='r'||l==='b'||l==='q';
      for(const [a,e] of dirs){
        let rr=r+a,ff=f+e;
        for(;;){
          const q=g(b,rr,ff); if(q===undefined) break;
          if(q===''){add(i,rr*8+ff);} else { if(isW(q)!==w) add(i,rr*8+ff); break; }
          if(!slide) break;
          rr+=a;ff+=e;
        }
      }
      if(l==='k'){
        const base=w?56:0, opp=w?'b':'w', R=base>>3;
        if(i===base+4&&!attacked(b,R,4,opp)){
          if(c[w?'K':'k']&&!b[base+5]&&!b[base+6]&&!attacked(b,R,5,opp)&&!attacked(b,R,6,opp)) add(i,base+6,{ca:1});
          if(c[w?'Q':'q']&&!b[base+1]&&!b[base+2]&&!b[base+3]&&!attacked(b,R,3,opp)&&!attacked(b,R,2,opp)) add(i,base+2,{ca:1});
        }
      }
    }
  }
  return out.filter(m=>!inCheck(apply(s,m),t));
}

/* --- Ordinateur : negamax + alpha-bêta + approfondissement itératif --- */
const LV=[
  {d:1,noise:250,rnd:.3,ms:300},            // Débutant
  {d:1,noise:80,rnd:.05,ms:300},            // Amateur
  {d:2,noise:15,ms:1500},                   // Normal
  {d:4,noise:4,q:1,ms:2500},                // Avancé
  {d:8,noise:0,q:1,ms:4500}                 // Maître
];
function evalS(s){
  let v=0;
  for(let i=0;i<64;i++){
    const p=s.b[i]; if(!p) continue;
    const l=p.toLowerCase(), w=isW(p); let x=VAL[l];
    const ce=7-Math.abs((i&7)-3.5)-Math.abs((i>>3)-3.5);
    if(l==='p'||l==='n'||l==='b') x+=ce*4;
    if(l==='p') x+=(w?6-(i>>3):(i>>3)-1)*6;
    v+=w?x:-x;
  }
  return s.t==='w'?v:-v;
}
const cap=(s,m)=>s.b[m.t]?VAL[s.b[m.t].toLowerCase()]*10-VAL[s.b[m.f].toLowerCase()]:0;
let deadline=0,useQ=false,nodes=0;
const tick=()=>{ if((++nodes&255)===0&&Date.now()>deadline) throw 'T'; };
function qs(s,a,b){
  tick();
  const v=evalS(s); if(v>=b) return b; if(v>a) a=v;
  const ms=moves(s).filter(m=>s.b[m.t]||m.ep||m.pr).sort((x,y)=>cap(s,y)-cap(s,x));
  for(const m of ms){ const x=-qs(apply(s,m),-b,-a); if(x>=b) return b; if(x>a) a=x; }
  return a;
}
function nega(s,d,a,b){
  tick();
  const ms=moves(s);
  if(!ms.length) return inCheck(s,s.t)?-99999-d:0;
  if(!d) return useQ?qs(s,a,b):evalS(s);
  ms.sort((x,y)=>cap(s,y)-cap(s,x));
  for(const m of ms){ const v=-nega(apply(s,m),d-1,-b,-a); if(v>a)a=v; if(a>=b)break; }
  return a;
}
function best(s,cfg){
  const root=moves(s);
  if(Math.random()<(cfg.rnd||0)) return root[Math.random()*root.length|0];
  deadline=Date.now()+cfg.ms; useQ=!!cfg.q; nodes=0;
  root.sort((x,y)=>cap(s,y)-cap(s,x));
  let bm=root[0];
  for(let d=1;d<=cfg.d;d++){
    let bv=-1e9,cur=null;
    try{
      for(const m of root){
        const v=-nega(apply(s,m),d-1,-1e9,-(bv-cfg.noise-1))+Math.random()*cfg.noise;
        if(v>bv){bv=v;cur=m;}
      }
    }catch(e){ if(e!=='T') throw e; break; }
    bm=cur; root.sort((x,y)=>x===bm?-1:y===bm?1:0);
    if(bv>90000) break;
  }
  return bm;
}

/* --- Interface 3D (caméra fixe) --- */
const $=id=>document.getElementById(id), stage=$('stage');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
stage.append(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(32,1,.1,100);
scene.add(new THREE.HemisphereLight(0xffffff,0x8a8a8a,.8));
const sun=new THREE.DirectionalLight(0xffffff,.85); sun.position.set(4,9,5); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:1,far:25});
scene.add(sun);
const std=c=>new THREE.MeshStandardMaterial({color:c,roughness:.45,metalness:.05});
const MAT={w:std(0xf3ead7),b:std(0x2d2623)}, LT=std(0xe9d9b4), DK=std(0x5d7f6c);

const frame=new THREE.Mesh(new THREE.BoxGeometry(8.9,.3,8.9),std(0x3a2a22)); frame.position.y=-.09; frame.receiveShadow=true; scene.add(frame);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.22}));
ground.rotation.x=-Math.PI/2; ground.position.y=-.25; ground.receiveShadow=true; scene.add(ground);
const squares=new THREE.Group(); scene.add(squares);
const pos=i=>new THREE.Vector3((i&7)-3.5,.1,(i>>3)-3.5);
for(let i=0;i<64;i++){
  const m=new THREE.Mesh(new THREE.BoxGeometry(1,.2,1),((i>>3)+(i&7))%2?DK:LT);
  m.position.set((i&7)-3.5,0,(i>>3)-3.5); m.userData.sq=i; m.receiveShadow=true; squares.add(m);
}
const pieces=new THREE.Group(), hl=new THREE.Group(); scene.add(pieces,hl);

/* Pièces : profils de révolution */
const lathe=(pts,mat)=>{const m=new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x,y])=>new THREE.Vector2(x,y)),24),mat);m.castShadow=true;return m;};
const ball=(r,y,mat)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat);m.position.y=y;m.castShadow=true;return m;};
const bx=(w,h,d,x,y,z,mat,rx=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.rotation.x=rx;m.castShadow=true;return m;};
const BASE=[[0,0],[.36,0],[.37,.06],[.3,.14],[.22,.22]];
function build(l,mat){
  const g=new THREE.Group();
  if(l==='p') g.add(lathe([...BASE,[.13,.4],[.12,.55],[.19,.6],[0,.6]],mat),ball(.2,.8,mat));
  if(l==='r'){ g.add(lathe([...BASE,[.2,.3],[.22,.75],[.3,.8],[.3,1],[0,1]],mat));
    for(const [x,z] of [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]]) g.add(bx(.14,.16,.14,x,1.08,z,mat)); }
  if(l==='b') g.add(lathe([...BASE,[.12,.5],[.2,.75],[.2,.95],[0,1]],mat),ball(.22,1.08,mat),ball(.07,1.42,mat));
  if(l==='n'){ g.add(lathe([...BASE,[.2,.45],[.24,.6],[0,.6]],mat),
    bx(.3,.75,.34,0,.95,-.02,mat,-.25), bx(.24,.24,.4,0,1.2,.25,mat,.35), bx(.06,.14,.06,-.1,1.55,-.08,mat), bx(.06,.14,.06,.1,1.55,-.08,mat)); }
  if(l==='q') g.add(lathe([...BASE,[.15,.5],[.24,.9],[.3,1.2],[.2,1.3],[0,1.3]],mat),ball(.13,1.5,mat));
  if(l==='k') g.add(lathe([...BASE,[.17,.5],[.26,.9],[.3,1.2],[.18,1.3],[0,1.3]],mat),bx(.1,.42,.1,0,1.58,0,mat),bx(.3,.1,.1,0,1.62,0,mat));
  g.scale.setScalar(.88);
  return g;
}
const TPL={};
for(const p of 'KQRBNPkqrbnp'){ TPL[p]=build(p.toLowerCase(),isW(p)?MAT.w:MAT.b); if(isW(p)) TPL[p].rotation.y=Math.PI; }

let flip=false;
/* Animation + rendu à la demande */
let tweens=[], need=true;
function loop(now){
  requestAnimationFrame(loop);
  if(tweens.length){
    tweens=tweens.filter(t=>{
      const k=Math.min(1,(now-t.t0)/t.dur), e=k*k*(3-2*k);
      t.mesh.position.lerpVectors(t.a,t.b,e); t.mesh.position.y+=Math.sin(k*Math.PI)*.6;
      return k<1;
    }); need=true;
  }
  if(need){ renderer.render(scene,camera); need=false; }
}
function fit(){
  const w=stage.clientWidth,h=stage.clientHeight;
  renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix();
  const tv=Math.tan(camera.fov*Math.PI/360), th=tv*camera.aspect;
  const dist=Math.max(4.5/th,4.3/tv)*1.12;
  const sg=flip?-1:1;
  camera.position.set(0,1.35,sg).normalize().multiplyScalar(dist);
  camera.lookAt(0,0,.3*sg); need=true;
}
addEventListener('resize',fit);

/* Jeu */
let S,hist,sel,targets,last,log,busy,ended,mode='1',hc='w';
const spd=()=>+$('spd').value;
const human=c=>mode==='2'||c===hc;
function sync(m){
  pieces.clear(); tweens=[];
  for(let i=0;i<64;i++){
    const p=S.b[i]; if(!p) continue;
    const o=TPL[p].clone(); o.userData.sq=i; o.position.copy(pos(i)); pieces.add(o);
    if(m&&i===m.t) tweens.push({mesh:o,a:pos(m.f),b:pos(i),t0:performance.now(),dur:900*spd()});
    if(m&&m.ca&&p.toLowerCase()==='r'&&i===(m.t+(m.t>m.f?-1:1))){
      const from=m.t>m.f?m.t+1:m.t-2; tweens.push({mesh:o,a:pos(from),b:pos(i),t0:performance.now(),dur:900*spd()});
    }
  }
  need=true;
}
function mark(i,geo,color,op,y){
  const o=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:op,depthWrite:false}));
  o.rotation.x=-Math.PI/2; o.position.copy(pos(i)); o.position.y=y; hl.add(o);
}
const PLANE=new THREE.PlaneGeometry(1,1), DOT=new THREE.CircleGeometry(.17,24), RING=new THREE.RingGeometry(.36,.46,32);
function draw(){
  const ms=moves(S), chk=inCheck(S,S.t); ended=!ms.length;
  hl.clear();
  if(last){mark(last.f,PLANE,0xedbd2d,.5,.102);mark(last.t,PLANE,0xedbd2d,.5,.102);}
  if(chk){mark(S.b.indexOf(S.t==='w'?'K':'k'),PLANE,0xd9534f,.75,.103);}
  if(sel>=0) mark(sel,PLANE,0xedbd2d,.85,.104);
  for(const t of new Set(targets.map(m=>m.t))) S.b[t]?mark(t,RING,0x1f2a26,.6,.11):mark(t,DOT,0x1f2a26,.5,.11);
  need=true;
  $('status').textContent = ended
    ? (chk?'Échec et mat — les '+(S.t==='w'?'Noirs':'Blancs')+' gagnent.':'Pat — match nul.')
    : busy?'L’ordinateur réfléchit…'
    : (mode==='2'?'Au tour des '+(S.t==='w'?'Blancs':'Noirs'):'À vous de jouer')+(chk?' — échec !':'');
  const rows=[]; for(let i=0;i<log.length;i+=2) rows.push((i/2+1)+'. '+log[i]+(log[i+1]?' '+log[i+1]:''));
  $('log').textContent=rows.join('   '); $('log').scrollTop=1e6;
}
function next(){
  if(ended||human(S.t)) return;
  busy=true; draw();
  setTimeout(()=>{ const m=best(S,LV[+$('lvl').value]); busy=false; play(m); },900*spd()+300*spd());
}
function newGame(){
  mode=$('mode').value; hc=$('col').value; $('opts').hidden=mode==='2';
  flip=mode==='1'&&hc==='b';
  S=start();hist=[];sel=-1;targets=[];last=null;log=[];busy=false;
  fit(); sync(null); draw(); next();
}
function play(m){
  const capt=S.b[m.t]||m.ep;
  hist.push({S,last,log:log.slice()});
  log.push(m.ca?(m.t>m.f?'O-O':'O-O-O'):sqn(m.f)+(capt?'×':'–')+sqn(m.t)+(m.pr?'='+m.pr.toUpperCase():''));
  last=m; S=apply(S,m); sel=-1; targets=[]; sync(m); draw(); next();
}
const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
renderer.domElement.addEventListener('click',e=>{
  if(busy||ended||!human(S.t)) return;
  const rc=renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX-rc.left)/rc.width)*2-1,-((e.clientY-rc.top)/rc.height)*2+1);
  ray.setFromCamera(mouse,camera);
  let i=-1;
  for(const h of ray.intersectObjects([pieces,squares],true)){
    let o=h.object; while(o&&o.userData.sq===undefined) o=o.parent;
    if(o){i=o.userData.sq;break;}
  }
  if(i<0) return;
  const m=targets.find(x=>x.t===i&&(!x.pr||x.pr==='q'));
  if(m){play(m);return;}
  const p=S.b[i];
  if(p&&isW(p)===(S.t==='w')){sel=i;targets=moves(S).filter(x=>x.f===i);} else {sel=-1;targets=[];}
  draw();
});
$('mode').onchange=$('col').onchange=$('new').onclick=newGame;
$('flip').onclick=()=>{flip=!flip;fit();};
$('undo').onclick=()=>{
  if(busy||!hist.length) return;
  let h; do{ h=hist.pop(); }while(mode==='1'&&!human(h.S.t)&&hist.length);
  S=h.S;last=h.last;log=h.log;sel=-1;targets=[];sync(null);draw();next();
};
fit(); newGame(); requestAnimationFrame(loop);
