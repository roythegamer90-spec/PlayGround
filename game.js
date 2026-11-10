import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9caeae);
scene.fog = new THREE.FogExp2(0x9caeae, 0.00165);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
document.body.prepend(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xc8dcdf, 0x30332e, 1.5); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd0a1, 3.4); sun.position.set(-170, 190, 110); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -180; sun.shadow.camera.right = 180; sun.shadow.camera.top = 180; sun.shadow.camera.bottom = -180; sun.shadow.bias = -0.0003; scene.add(sun);
const sunBall = new THREE.Mesh(new THREE.SphereGeometry(15, 20, 16), new THREE.MeshBasicMaterial({ color: 0xffc778 })); sunBall.position.set(-230, 115, 490); scene.add(sunBall);

const mat = (color, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const asphalt = mat(0x343b3c, .94), sidewalk = mat(0x858581, .95), curb = mat(0xc4c0b2, .95);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), mat(0x686b61)); ground.rotation.x = -Math.PI / 2; ground.position.y = -.13; ground.receiveShadow = true; scene.add(ground);
const city = new THREE.Group(); scene.add(city);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x343b3e, roughness: .88 });
const lineMat = new THREE.MeshBasicMaterial({ color: 0xd1c99b, transparent: true, opacity: .73 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x777a72, roughness: .95 });
function box(parent, x,y,z, sx,sy,sz, material, cast=false, receive=false) { const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material); m.position.set(x,y,z); m.castShadow=cast; m.receiveShadow=receive; parent.add(m); return m; }
// A real street grid, lane paint, sidewalks, intersections, and crosswalks.
const gridRange=6, spacing=100, roadWidth=17;
for(let i=-gridRange;i<=gridRange;i++){
  const p=i*spacing;
  box(city,p,-.045,0,roadWidth,.08,1400,roadMat,false,true);
  box(city,0,-.045,p,1400,.08,roadWidth,roadMat,false,true);
  for(const side of [-1,1]){
    box(city,p+side*10,.01,0,3,.12,1400,sidewalkMat,false,true);
    box(city,0,.01,p+side*10,1400,.12,3,sidewalkMat,false,true);
  }
}
// Instanced paint keeps the long street grid light enough for browser GPUs.
const dashGeo=new THREE.BoxGeometry(.13,.025,5),dashGeoX=new THREE.BoxGeometry(5,.025,.13);
const dashCount=(gridRange*2+1)*100,dashZ=new THREE.InstancedMesh(dashGeo,lineMat,dashCount),dashX=new THREE.InstancedMesh(dashGeoX,lineMat,dashCount);
const dummy=new THREE.Object3D();let dashIndex=0;
for(let i=-gridRange;i<=gridRange;i++)for(let d=-690;d<700;d+=14){dummy.position.set(i*spacing,-.001,d);dummy.updateMatrix();dashZ.setMatrixAt(dashIndex,dummy.matrix);dummy.position.set(d,-.001,i*spacing);dummy.updateMatrix();dashX.setMatrixAt(dashIndex++,dummy.matrix)}
city.add(dashZ,dashX);
const crossGeo=new THREE.BoxGeometry(.95,.025,3),crossGeoX=new THREE.BoxGeometry(3,.025,.95);
const crossN=(gridRange*2+1)*(gridRange+1)*6,crossA=new THREE.InstancedMesh(crossGeo,lineMat,crossN),crossB=new THREE.InstancedMesh(crossGeoX,lineMat,crossN);let ci=0;
for(let i=-gridRange;i<=gridRange;i+=2)for(let j=-gridRange;j<=gridRange;j++){
 const p=i*spacing,q=j*spacing;if(Math.abs(p)<.1&&Math.abs(q)<.1)continue;
 for(let b=0;b<6;b++){const pos=p-6+b*2.35;dummy.position.set(pos,.008,q+11);dummy.updateMatrix();crossA.setMatrixAt(ci,dummy.matrix);dummy.position.set(q+11,.008,pos);dummy.updateMatrix();crossB.setMatrixAt(ci++,dummy.matrix)}
}
city.add(crossA,crossB);

// Procedural facade atlas gives every block a distinct city silhouette without external assets.
function facadeTexture(seed){
  const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');
  const palettes=[['#777a77','#393f40','#f3d9a2'],['#b9a98e','#665e52','#f6d69a'],['#667679','#303b3e','#d1d7c6'],['#a77b60','#47372f','#f3d99e'],['#929187','#444541','#dbd1b3']];
  const p=palettes[seed%palettes.length];x.fillStyle=p[0];x.fillRect(0,0,256,256);
  x.fillStyle='rgba(20,25,26,.12)';for(let i=0;i<256;i+=4)x.fillRect(i,0,1,256);
  const cols=4+seed%3, rows=7+seed%5, ww=256/(cols+1),hh=256/(rows+1);
  for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){
    const xx=ww*.55+col*ww, yy=hh*.6+r*hh;
    x.fillStyle='#252d30';x.fillRect(xx-1,yy-1,ww*.59+2,hh*.55+2);
    const lit=((r*7+col*11+seed*3)%9)<(seed%4+2);
    x.fillStyle=lit?p[2]:'#435356';x.fillRect(xx,yy,ww*.59,hh*.55);
    x.fillStyle='rgba(255,255,255,.15)';x.fillRect(xx,yy,ww*.59,2);
  }
  for(let i=0;i<256;i+=32){x.fillStyle='rgba(31,35,34,.15)';x.fillRect(0,i,256,2)}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
const facadeMats=Array.from({length:5},(_,i)=>new THREE.MeshStandardMaterial({map:facadeTexture(i),roughness:.82,metalness:.04}));
const roofMats=[0xc3b7a0,0x6a716c,0x8e8070,0x727774].map(c=>mat(c));
let seed=1234567;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const obstacles=[];
function makeBuilding(x,z,w,d,h,n){
  obstacles.push({x,z,w,d});
  const g=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),facadeMats[n%5]);m.position.y=h/2-.02;m.castShadow=true;m.receiveShadow=true;g.add(m);
  // parapet and rooftop plant / mechanical units
  box(g,0,h+.25,0,w+.45,.5,d+.45,roofMats[n%4],true);
  box(g,0,h+.55,0,w*.76,.14,d*.7,mat(0x424745),true);
  if(n%3===0){box(g,w*.21,h+.86,-d*.18,w*.18,.5,d*.2,mat(0x5b625e),true);box(g,-w*.22,h+.78,d*.18,w*.22,.34,d*.15,mat(0x525956),true)}
  if(h>38){ box(g,0,h+.95,0,w*.35,.25,d*.33,roofMats[(n+1)%4],true); }
  g.position.set(x,0,z);city.add(g);
  // storefront base and awning
  if(h<55){const aw=mat([0x8b493b,0x46635c,0x6a596d,0xc0a66f][n%4]);box(city,x,3.8,z+d/2+.38,w*.7,.5,.75,aw,true);}
}
for(let bx=-gridRange;bx<gridRange;bx++)for(let bz=-gridRange;bz<gridRange;bz++){
  const cx=bx*spacing+spacing/2,cz=bz*spacing+spacing/2;
  // central blocks are denser, ocean side is low-rise
  const num=2+Math.floor(rand()*3);
  for(let b=0;b<num;b++){
    const w=17+rand()*22,d=17+rand()*23;
    const x=bx*spacing+20+w/2+rand()*(60-w),z=bz*spacing+20+d/2+rand()*(60-d);
    let h=14+rand()*45;if(Math.abs(bx)<2&&Math.abs(bz)<2)h=30+rand()*95;
    if(bx<-3||bz>4)h=9+rand()*24;
    makeBuilding(x,z,w,d,h,Math.floor(rand()*1000));
  }
}

// Palm trees, lamps, signs, and roadside planters make the streets readable at speed.
const palmMat=mat(0x654b34), leafMats=[mat(0x49694f),mat(0x5e7951),mat(0x73845a)];
function palm(x,z,s=1){
 const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22*s,.42*s,7*s,7),palmMat);trunk.position.y=3.5*s;trunk.rotation.z=.07;trunk.castShadow=true;g.add(trunk);
 for(let k=0;k<8;k++){const a=k*Math.PI/4;const leaf=new THREE.Mesh(new THREE.ConeGeometry(.42*s,5.5*s,5),leafMats[k%3]);leaf.position.set(Math.sin(a)*1.8*s,6.3*s+Math.cos(a)*.5*s,Math.cos(a)*1.8*s);leaf.rotation.z=Math.cos(a)*.72;leaf.rotation.x=Math.sin(a)*.8;leaf.castShadow=true;g.add(leaf)}
 g.position.set(x,0,z);city.add(g);
}
function lamp(x,z){const g=new THREE.Group();const pole=mat(0x353b3a,.45,.6);const p=new THREE.Mesh(new THREE.CylinderGeometry(.09,.15,6,8),pole);p.position.y=3;g.add(p);const arm=box(g,.55,5.9,0,1.3,.1,.12,pole);arm.rotation.z=-.1;const bulb=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.28),new THREE.MeshBasicMaterial({color:0xffe6b2}));bulb.position.set(1.05,5.78,0);g.add(bulb);g.position.set(x,0,z);city.add(g)}
for(let x=-600;x<=600;x+=50)for(let z=-600;z<=600;z+=50){if(Math.abs(x%100)<2&&Math.abs(z%100)<2){palm(x+13,z+13,.8+rand()*.4);lamp(x-13,z-13)}}

// The hero car: custom body, glass, trim, lights, and four animated wheels.
const car=new THREE.Group();scene.add(car);
const carPaint=new THREE.MeshStandardMaterial({color:0xc64e32,metalness:.62,roughness:.28});
const glass=new THREE.MeshPhysicalMaterial({color:0x18272a,metalness:.34,roughness:.17,transparent:true,opacity:.88,clearcoat:1});
const chrome=mat(0xb9c2bd,.22,.85), tireMat=mat(0x171a1a,.95), rimMat=mat(0xb3b4aa,.3,.8), lampMat=new THREE.MeshBasicMaterial({color:0xfff0c4}), redLamp=new THREE.MeshBasicMaterial({color:0xf44334});
box(car,0,.63,0,2.1,.68,4.35,carPaint,true);
box(car,0,1.02,-.27,1.75,.65,2.1,glass,true);
box(car,0,.99,1.42,1.74,.34,1.2,carPaint,true);
box(car,0,1.34,.4,1.46,.06,.12,chrome,true);
// door trim and bumpers
for(const s of [-1,1]){box(car,s*1.065,.7,0,.045,.36,2.3,chrome);box(car,s*.91,1.06,-.2,.06,.46,1.25,mat(0x263336,.2,.3));box(car,s*1.08,.42,-1.62,.08,.13,.45,chrome);}
box(car,0,.36,-2.14,2.04,.18,.18,chrome,true);box(car,0,.37,2.14,2.03,.19,.2,chrome,true);
for(const x of [-.68,.68]){
 const light=new THREE.Mesh(new THREE.BoxGeometry(.48,.22,.08),lampMat);light.position.set(x,.7,2.18);car.add(light);
 const tail=new THREE.Mesh(new THREE.BoxGeometry(.42,.2,.08),redLamp);tail.position.set(x,.69,-2.2);car.add(tail);
}
const wheels=[];
for(const x of [-1.04,1.04])for(const z of [-1.4,1.43]){
 const w=new THREE.Group();w.position.set(x,.36,z);const tyre=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.25,18),tireMat);tyre.rotation.z=Math.PI/2;tyre.castShadow=true;w.add(tyre);
 const rim=new THREE.Mesh(new THREE.CylinderGeometry(.235,.235,.265,12),rimMat);rim.rotation.z=Math.PI/2;w.add(rim);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.28,10),chrome);hub.rotation.z=Math.PI/2;w.add(hub);car.add(w);wheels.push(w);
}
car.position.set(0,0,0);
const headlight1=new THREE.SpotLight(0xfff2d4,0,50,Math.PI/7,.4,1.7);headlight1.position.set(-.65,.8,2.2);headlight1.target.position.set(-.65,.2,17);car.add(headlight1,headlight1.target);
const headlight2=headlight1.clone();headlight2.position.x=.65;headlight2.target.position.x=.65;car.add(headlight2,headlight2.target);

// Traffic cars cruise along avenues and can be nudged by the player.
const traffic=[];const trafficColors=[0xd4c29b,0x405e6c,0x92745f,0x59604d,0xb6b8ad,0x3c465b];
function makeTraffic(i){
 const g=new THREE.Group();const c=mat(trafficColors[i%trafficColors.length],.36,.28);box(g,0,.56,0,1.8,.58,3.7,c,true);box(g,0,.96,-.18,1.48,.46,1.65,glass,true);
 for(const x of [-.92,.92])for(const z of [-1.2,1.2]){const t=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.2,12),tireMat);t.rotation.z=Math.PI/2;t.position.set(x,.3,z);g.add(t)}
 const dir=i%2===0?1:-1;const lane=(i%4<2?-1:1)*3.2;g.position.set(lane,0,(i-4)*64);g.rotation.y=dir===1?0:Math.PI;scene.add(g);traffic.push({mesh:g,dir,lane,speed:14+Math.random()*9});
}
for(let i=0;i<8;i++)makeTraffic(i);

// Contract marker: a floating ring and beacon are visible from the street.
const marker=new THREE.Group();scene.add(marker);
const ring=new THREE.Mesh(new THREE.TorusGeometry(5,.18,8,36),new THREE.MeshBasicMaterial({color:0xd9ff4f}));ring.rotation.x=Math.PI/2;ring.position.y=.35;marker.add(ring);
const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.13,.5,9,10,1,true),new THREE.MeshBasicMaterial({color:0xd9ff4f,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false}));beacon.position.y=5;marker.add(beacon);
const pin=new THREE.Mesh(new THREE.OctahedronGeometry(.55),new THREE.MeshBasicMaterial({color:0xf2ffb3}));pin.position.y=9;marker.add(pin);
let target={x:0,z:240};marker.position.set(target.x,0,target.z);

const keys={};let started=false, speed=0, yaw=0, nitro=100, cash=8420, deliveries=0;
let steerVisual=0;
const speedEl=document.getElementById('speed'), gearEl=document.getElementById('gear'), nitroBar=document.getElementById('nitroBar'), nitroText=document.getElementById('nitroText');
const distanceEl=document.getElementById('distance'), turnEl=document.getElementById('turn'), toast=document.getElementById('toast');
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'){started=false;document.getElementById('intro').classList.remove('hidden')}});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
document.querySelectorAll('[data-key]').forEach(btn=>{
 const key=btn.dataset.key;const down=e=>{e.preventDefault();keys[key]=true},up=e=>{e.preventDefault();keys[key]=false};
 btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);btn.addEventListener('pointercancel',up);
});
document.getElementById('start').addEventListener('click',()=>{started=true;document.getElementById('intro').classList.add('hidden')});
// Keep the fictional DLSS5 label transparent: this is a resolution scaling demo, not NVIDIA software.
let upscaleOn=true, highQuality=true;
document.getElementById('upscale').addEventListener('click',e=>{upscaleOn=!upscaleOn;e.currentTarget.classList.toggle('active',upscaleOn);e.currentTarget.textContent=upscaleOn?'✦ DLSS 5 · SIMULATED':'✦ NATIVE RESOLUTION';setRenderScale()});
document.getElementById('quality').addEventListener('click',e=>{highQuality=!highQuality;e.currentTarget.textContent=highQuality?'QUALITY · HIGH':'QUALITY · PERFORMANCE';renderer.shadowMap.enabled=highQuality;renderer.setPixelRatio(Math.min(devicePixelRatio,highQuality?(upscaleOn?1.35:1.75):(upscaleOn?1.05:1.3)));renderer.setSize(innerWidth,innerHeight)});
function setRenderScale(){renderer.setPixelRatio(Math.min(devicePixelRatio,upscaleOn?(highQuality?1.35:1.05):1.75));renderer.setSize(innerWidth,innerHeight)}

const mapCanvas=document.getElementById('minimap'), mapCtx=mapCanvas.getContext('2d');
function drawMap(){
 const c=mapCtx,w=300,h=300,scale=.48;c.clearRect(0,0,w,h);c.fillStyle='#192326';c.fillRect(0,0,w,h);
 c.save();c.translate(w/2,h/2);c.rotate(-yaw);c.scale(1,-1);
 c.strokeStyle='#65706c';c.lineWidth=7;
 for(let i=-6;i<=6;i++){let p=(i*100-car.position.x)*scale;c.beginPath();c.moveTo(p,-190);c.lineTo(p,190);c.stroke();p=(i*100-car.position.z)*scale;c.beginPath();c.moveTo(-190,p);c.lineTo(190,p);c.stroke()}
 c.fillStyle='#d9ff4f';const dx=(target.x-car.position.x)*scale,dz=(target.z-car.position.z)*scale;c.beginPath();c.arc(dx,dz,5,0,Math.PI*2);c.fill();
 c.restore();c.save();c.translate(150,150);c.rotate(yaw);c.fillStyle='#fff';c.beginPath();c.moveTo(0,8);c.lineTo(-5,-6);c.lineTo(0,-3);c.lineTo(5,-6);c.closePath();c.fill();c.restore();
 // subtle minimap bezel glow
}
function showToast(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}
function newDelivery(){deliveries++;cash+=2500;document.getElementById('cash').textContent='$'+cash.toLocaleString();showToast('DELIVERY COMPLETE · +$2,500');const choices=[[200,0],[-200,0],[0,-200],[0,400],[300,200],[-300,-200]];const next=choices[deliveries%choices.length];target={x:next[0],z:next[1]};marker.position.set(target.x,0,target.z);}

const clockEl=document.getElementById('clock');let gameTime=19.7;
const clock=new THREE.Clock();let lastMap=0;
function update(dt,time){
 // Daylight gently shifts as the drive continues, retaining the cinematic sunset.
 gameTime+=dt*.003;const hour=18.9+(gameTime%2.1);const hh=Math.floor(hour),mm=Math.floor((hour%1)*60);clockEl.textContent=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} · GOLDEN HOUR`;
 const forward=(keys.w||keys.arrowup)?1:0, reverse=(keys.s||keys.arrowdown)?1:0;
 const left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright, hand=keys[' '],boost=keys.shift&&nitro>0&&forward;
 const accel=boost?38:24,maxSpeed=boost?47:35;
 if(forward)speed=Math.min(maxSpeed,speed+accel*dt);else if(reverse)speed=Math.max(-12,speed-23*dt);else speed*=Math.max(0,1-dt*(hand?3.5:0.62));
 if(hand)speed*=Math.max(0,1-dt*1.25);
 if(boost)nitro=Math.max(0,nitro-25*dt);else nitro=Math.min(100,nitro+7*dt);
 const steering=(left?1:0)-(right?1:0);const steerRate=(.38+Math.min(Math.abs(speed)/22,.9))*(speed<0?-1:1);yaw+=steering*steerRate*dt;
 const oldX=car.position.x,oldZ=car.position.z;
 car.position.x+=Math.sin(yaw)*speed*dt;car.position.z+=Math.cos(yaw)*speed*dt;
 // Downtown buildings stop the car instead of letting it clip through solid geometry.
 let blocked=false;
 for(const o of obstacles){if(Math.abs(car.position.x-o.x)<o.w/2+1.5&&Math.abs(car.position.z-o.z)<o.d/2+2){blocked=true;break}}
 if(blocked){car.position.x=oldX;car.position.z=oldZ;speed*=-.23;if(Math.abs(speed)>4)showToast('COLLISION · WATCH THE CURB')}
 car.rotation.y=yaw;car.rotation.z=steering*Math.min(Math.abs(speed)/40,1)*-.035;
 wheels.forEach((w,i)=>{w.rotation.x+=speed*dt*1.8;if(i<2)w.rotation.y=-steering*.42});
 headlight1.intensity=headlight2.intensity=hour>19.6?18:0;
 for(const t of traffic){const m=t.mesh;m.position.z+=t.dir*t.speed*dt;if(m.position.z>700)m.position.z=-700;if(m.position.z<-700)m.position.z=700;
  const dx=m.position.x-car.position.x,dz=m.position.z-car.position.z;if(dx*dx+dz*dz<10&&Math.abs(speed)>4){speed*=.72;m.position.z+=t.dir*14}}
 // Frame the player with an eased chase camera and slight speed pull-back.
 const camDist=8.6+Math.min(Math.abs(speed)*.055,2.4),camHeight=4.2+Math.min(Math.abs(speed)*.018,1.1);
 const desired=new THREE.Vector3(car.position.x-Math.sin(yaw)*camDist,camHeight,car.position.z-Math.cos(yaw)*camDist);
 camera.position.lerp(desired,1-Math.exp(-dt*3.4));const look=new THREE.Vector3(car.position.x+Math.sin(yaw)*5,1.0,car.position.z+Math.cos(yaw)*5);camera.lookAt(look);
 marker.rotation.y=time*.35;marker.children[0].scale.setScalar(1+Math.sin(time*2.7)*.09);
 const mph=Math.round(Math.abs(speed)*2.237);speedEl.textContent=String(mph).padStart(3,'0');gearEl.textContent=speed<-.5?'R':speed<.5?'P':mph>75?'4':mph>45?'3':mph>20?'2':'1';
 nitroBar.style.width=nitro+'%';nitroText.textContent=`${Math.round(nitro)}% · ${nitro>95?'READY':'RECHARGING'}`;
 const dist=Math.hypot(target.x-car.position.x,target.z-car.position.z);distanceEl.textContent=(dist/1000).toFixed(1)+' KM';
 const dx=target.x-car.position.x,dz=target.z-car.position.z;turnEl.textContent=Math.abs(dx)>Math.abs(dz)?(dx>0?'RIGHT AT NEXT':'LEFT AT NEXT'):(dz>0?'FOLLOW THE COAST':'TURN BACK');
 if(dist<8)newDelivery();
 if(time-lastMap>.12){drawMap();lastMap=time}
}
drawMap();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),time=clock.elapsedTime;if(started)update(dt,time);else {car.position.y=Math.sin(time*1.5)*.015;camera.position.set(6,5,-11);camera.lookAt(0,1,16);marker.rotation.y=time*.35}
 renderer.render(scene,camera)}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);setRenderScale()});
