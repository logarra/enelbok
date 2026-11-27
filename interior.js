/* Opel Astra J Sedan – procedural interior, built part by part (car coordinates: +x front, +y up, +z right; driver on the left, z ≈ −0.37).
   Every part carries userData.ipart (info card); every working control carries userData.ctl (handled by the page). */
window.AstraInterior=(function(){
"use strict";
function build(THREE,opt){
  opt=opt||{};const clip=opt.clip||[];
  const root=new THREE.Group();root.name='Interior';
  const parts=[],ctls=[],doorTrims=[];
  const M={
    dash:new THREE.MeshStandardMaterial({color:0x232529,roughness:0.82}),
    dashTop:new THREE.MeshStandardMaterial({color:0x1d1f22,roughness:0.9}),
    lower:new THREE.MeshStandardMaterial({color:0x2c2f33,roughness:0.75}),
    piano:new THREE.MeshStandardMaterial({color:0x0c0d0f,roughness:0.18,metalness:0.2}),
    chrome:new THREE.MeshStandardMaterial({color:0xdfe3e7,metalness:1,roughness:0.12}),
    satin:new THREE.MeshStandardMaterial({color:0x9aa1a8,metalness:0.85,roughness:0.32}),
    rubber:new THREE.MeshStandardMaterial({color:0x141517,roughness:0.95}),
    leather:new THREE.MeshStandardMaterial({color:0x1b1c1e,roughness:0.6}),
    carpet:new THREE.MeshStandardMaterial({color:0x202225,roughness:1}),
    head:new THREE.MeshStandardMaterial({color:0x9b9d9f,roughness:1}),
    fabric:new THREE.MeshStandardMaterial({color:0x303338,roughness:0.97}),
    vent:new THREE.MeshStandardMaterial({color:0x111214,roughness:0.6}),
    red:new THREE.MeshStandardMaterial({color:0xc81e1e,roughness:0.4}),
    belt:new THREE.MeshStandardMaterial({color:0x26282b,roughness:0.85}),
    glass:new THREE.MeshStandardMaterial({color:0x9fb4c4,metalness:1,roughness:0.05}),
    steel:new THREE.MeshStandardMaterial({color:0x50555b,metalness:0.8,roughness:0.45}),
  };
  // fabric with the Astra two-tone pattern on the seat inserts
  (function(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#3a3e44';x.fillRect(0,0,128,128);
    for(let i=0;i<128;i+=4){x.fillStyle=i%8?'#33373c':'#41454b';x.fillRect(0,i,128,2);}for(let k=0;k<500;k++){x.fillStyle='rgba(255,255,255,.04)';x.fillRect(Math.random()*128,Math.random()*128,1,1);}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.encoding=THREE.sRGBEncoding;M.insert=new THREE.MeshStandardMaterial({map:t,roughness:1});})();

  /* ---------- helpers ---------- */
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const mesh=(g,m,x,y,z)=>{const o=new THREE.Mesh(g,m);if(x!==undefined)o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;};
  function rbox(w,h,d,r){r=Math.min(r,w/2-1e-5,h/2-1e-5,d/2-1e-5);const g=new THREE.BoxGeometry(w,h,d,4,4,4),p=g.attributes.position,v=V(),c=V();
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z)));v.sub(c);if(v.lengthSq()>0)v.setLength(r);v.add(c);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();return g;}
  const cyl=(r,h,s)=>new THREE.CylinderGeometry(r,r,h,s||32);
  const tube=(pts,r,m,closed)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>V(...p)),!!closed),Math.max(16,pts.length*12),r,10,!!closed),m);
  function frame(o,X,Y){const g=new THREE.Group();g.position.copy(o);const Z=V().crossVectors(X,Y).normalize();g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X.clone().normalize(),Y.clone().normalize(),Z));return g;}
  function canvasMat(w,h,draw,o){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;
    const m=new THREE.MeshStandardMaterial(Object.assign({map:t,roughness:0.5},o||{}));m.userData.canvas=c;m.userData.ctx=x;return m;}
  function labelMat(txt,o){o=o||{};return canvasMat(128,64,(x,w,h)=>{x.fillStyle=o.bg||'#17181b';x.fillRect(0,0,w,h);x.fillStyle=o.fg||'#d7dce1';x.font='bold '+(o.size||26)+'px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,w/2,h/2+1);
    if(o.led){x.fillStyle='#3b3f45';x.fillRect(w/2-14,6,28,5);}},{roughness:0.55});}
  // extrude a (z,y) cross-section along x (from x0 to x0+len)
  function extrudeX(shape,x0,len,bev){const g=new THREE.ExtrudeGeometry(shape,{depth:len,bevelEnabled:!!bev,bevelThickness:bev||0,bevelSize:bev||0,bevelSegments:2,curveSegments:16});
    const p=g.attributes.position;for(let i=0;i<p.count;i++){const sx=p.getX(i),sy=p.getY(i),sz=p.getZ(i);p.setXYZ(i,x0+sz,sy,sx);}
    const ix=g.index?g.index.array:null;if(ix){for(let t=0;t<ix.length;t+=3){const a=ix[t+1];ix[t+1]=ix[t+2];ix[t+2]=a;}}else{for(const k of Object.keys(g.attributes)){const at=g.attributes[k],is=at.itemSize,arr=at.array;for(let t=0;t<at.count;t+=3)for(let c=0;c<is;c++){const tmp=arr[(t+1)*is+c];arr[(t+1)*is+c]=arr[(t+2)*is+c];arr[(t+2)*is+c]=tmp;}}}
    g.computeVertexNormals();return g;}
  // extrude an (x,y) side profile across z (centred, width w)
  function extrudeZ(shape,w,bev){const g=new THREE.ExtrudeGeometry(shape,{depth:w,bevelEnabled:!!bev,bevelThickness:bev||0,bevelSize:bev||0,bevelSegments:3,curveSegments:20});g.translate(0,0,-w/2);g.computeVertexNormals();return g;}
  function part(obj,info,parent){obj.userData.ipart=info;info.obj=obj;info.base=obj.position.clone();info.ex=V();parts.push(info);(parent||root).add(obj);obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return obj;}
  function ctl(obj,info){obj.userData.ctl=info;info.obj=obj;info.rest={p:obj.position.clone(),r:obj.rotation.clone()};ctls.push(info);return obj;}

  /* =====================================================================
     DASHBOARD
     ===================================================================== */
  const DRV=-0.37;                       // driver centre line
  const HUB=V(0.49,0.93,DRV);            // steering-wheel centre (measured against the body)
  (function(){
    const s=new THREE.Shape();
    s.moveTo(1.06,1.03);s.lineTo(0.80,1.085);s.quadraticCurveTo(0.70,1.09,0.675,1.05);s.lineTo(0.655,0.93);s.quadraticCurveTo(0.645,0.80,0.69,0.70);s.lineTo(0.80,0.585);s.lineTo(0.96,0.5);s.lineTo(1.08,0.56);s.lineTo(1.08,0.98);s.closePath();
    const g=new THREE.Group();g.add(mesh(extrudeZ(s,1.42,0.01),M.dash));
    // soft-touch top skin & passenger airbag seam
    const t=new THREE.Shape();t.moveTo(1.05,1.036);t.lineTo(0.80,1.091);t.quadraticCurveTo(0.71,1.096,0.69,1.07);t.lineTo(0.69,1.08);t.quadraticCurveTo(0.71,1.1,0.80,1.097);t.lineTo(1.05,1.042);t.closePath();
    g.add(mesh(extrudeZ(t,1.40,0.002),M.dashTop));
    const ab=mesh(rbox(0.16,0.003,0.3,0.02),M.dash,0.80,1.098,0.36);ab.rotation.z=-0.2;g.add(ab);
    // satin decor strip across the passenger side
    const d=mesh(rbox(0.012,0.02,0.5,0.005),M.satin,0.666,0.985,0.40);d.rotation.z=0.12;g.add(d);
    part(g,{id:'torpido',grp:'Ön konsol',n:'Ön konsol (torpido paneli)',d:'Göstergeleri, multimedya ve klima kumandalarını, havalandırma kanallarını ve yolcu hava yastığını taşıyan iç mekânın ana paneli.',c:'Ön camın dibinden diz hizasına kadar uzanır; içinde metal bir taşıyıcı kiriş, kalorifer kutusu ve kablo demeti bulunur.',t:'Üst yüzey yumuşak dokulu plastik, yolcu tarafında saten gümüş dekor çıtası. Yolcu hava yastığı üst yüzeyin altındadır.'});
  })();
  // side vents (both ends) and central vents
  function vent(w,h,x,y,z,rot,round){const g=new THREE.Group();g.position.set(x,y,z);if(rot)g.rotation.set(rot[0],rot[1],rot[2]);
    g.add(mesh(rbox(0.02,h+0.016,w+0.016,0.006),M.chrome));g.add(mesh(rbox(0.022,h,w,0.004),M.vent));
    for(let k=0;k<4;k++){const sl=mesh(new THREE.BoxGeometry(0.004,0.003,w*0.92),M.piano,-0.013,-h/2+(k+0.5)*h/4,0);g.add(sl);}
    const tab=mesh(rbox(0.008,0.008,0.012,0.003),M.satin,-0.016,0,0);g.add(tab);return g;}
  (function(){const g=new THREE.Group();
    g.add(vent(0.075,0.055,0.682,1.0,-0.64,[0,0.25,0.12]));g.add(vent(0.075,0.055,0.682,1.0,0.64,[0,-0.25,0.12]));
    part(g,{id:'yanizgara',grp:'Ön konsol',n:'Yan havalandırma ızgaraları',d:'Yan camlara ve sürücü/yolcuya hava üfler; kışın yan camların buğusunu alır.',c:'Torpido panelinin iki ucunda, kalorifer kutusuna kanallarla bağlı.',t:'Kanatçıkları yukarı-aşağı ve sağa-sola yönlendirilebilir; çevirmeli kapatma tırnağı vardır.'});})();

  /* ---------- instrument cluster with live canvas dials ---------- */
  const CL={};
  (function(){
    const g=new THREE.Group();
    // binnacle hood over the cluster
    const bh=new THREE.Shape();bh.moveTo(0.585,1.075);bh.quadraticCurveTo(0.595,1.13,0.68,1.13);bh.lineTo(0.76,1.10);bh.lineTo(0.70,1.06);bh.lineTo(0.62,1.06);bh.closePath();
    const well=new THREE.Shape();well.moveTo(0.645,1.075);well.lineTo(0.67,1.075);well.lineTo(0.67,0.92);well.lineTo(0.648,0.92);well.closePath();g.add(mesh(extrudeZ(well,0.40,0.004),M.dashTop).translateZ(DRV));
    g.add(mesh(extrudeZ(bh,0.40,0.008),M.dashTop).translateZ(DRV));
    // cluster face (canvas) – angled towards the driver's eyes
    const face=frame(V(0.628,1.0,DRV),V(0,0,1),V(0.22,0.975,0));
    CL.mat=canvasMat(1024,384,()=>{},{roughness:0.35,emissive:0xffffff,emissiveIntensity:0});CL.mat.emissiveMap=CL.mat.map;
    const fm=mesh(new THREE.PlaneGeometry(0.36,0.135),CL.mat);face.add(fm);
    // two deep chrome-rimmed tubes (Astra J signature)
    [-0.095,0.095].forEach(u=>{const r=mesh(new THREE.TorusGeometry(0.058,0.004,10,48),M.chrome,u*0.0+u*1.0,0,0.012);face.add(r);const tb=mesh(new THREE.CylinderGeometry(0.06,0.06,0.024,40,1,true),M.piano,u,0,0.012);tb.rotation.x=Math.PI/2;tb.material=M.piano;face.add(tb);});
    g.add(face);
    // glass
    const gl=mesh(new THREE.PlaneGeometry(0.37,0.14),new THREE.MeshPhysicalMaterial({color:0x111111,transparent:true,opacity:0.12,roughness:0.02,metalness:0}),0,0,0.026);face.add(gl);
    part(g,{id:'gosterge',grp:'Gösterge paneli',n:'Gösterge paneli',d:'Sürücüye motor devri, hız, yakıt, su sıcaklığı ve uyarı lambalarını gösterir. Ortadaki ekran yol bilgisayarıdır.',c:'Direksiyonun arkasında, güneşliğin altında; araç ağına (CAN) bağlı, bilgileri motor beyni ve ABS ünitesinden alır.',t:'Solda devir saati (kırmızı bölge 6500 d/d), sağda hız göstergesi (240 km/s). Ortada yakıt ve su sıcaklığı göstergeleri ile vites ve tüketim bilgisini gösteren ekran. Kontağı aç: göstergeler açılış turunu atar.'});
  })();
  function drawCluster(st){
    const x=CL.mat.userData.ctx,W=1024,H=384;x.fillStyle='#050607';x.fillRect(0,0,W,H);
    const lit=st.ign>0;const glow=lit?'#e8edf2':'#3a3e44',red=lit?'#ff3b30':'#4a2a28';
    const dial=(cx,cy,R,max,step,major,label,val,redFrom,unit)=>{
      x.lineWidth=2;x.strokeStyle=lit?'#1e2329':'#15181b';x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();
      const a0=Math.PI*0.75,a1=Math.PI*2.25;
      for(let v=0;v<=max+1e-6;v+=step){const a=a0+(v/max)*(a1-a0),mj=Math.abs(v/major-Math.round(v/major))<1e-6;x.strokeStyle=(redFrom&&v>=redFrom)?red:glow;x.lineWidth=mj?5:2;
        x.beginPath();x.moveTo(cx+Math.cos(a)*(R-6),cy+Math.sin(a)*(R-6));x.lineTo(cx+Math.cos(a)*(R-(mj?26:16)),cy+Math.sin(a)*(R-(mj?26:16)));x.stroke();
        if(mj){x.fillStyle=(redFrom&&v>=redFrom)?red:glow;x.font='bold 26px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(label(v),cx+Math.cos(a)*(R-50),cy+Math.sin(a)*(R-50));}}
      x.fillStyle=lit?'#8f99a3':'#2a2d31';x.font='18px Arial';x.textAlign='center';x.fillText(unit,cx,cy+R*0.45);
      const a=a0+Math.min(1.02,Math.max(0,val/max))*(a1-a0);x.strokeStyle=lit?'#ff5a1f':'#7a3a20';x.lineWidth=6;x.lineCap='round';x.beginPath();x.moveTo(cx-Math.cos(a)*16,cy-Math.sin(a)*16);x.lineTo(cx+Math.cos(a)*(R-14),cy+Math.sin(a)*(R-14));x.stroke();
      x.fillStyle='#202428';x.beginPath();x.arc(cx,cy,16,0,7);x.fill();};
    dial(232,196,170,8,0.5,1,v=>v,st.rpm/1000,6.5,'x1000 d/d');
    dial(792,196,170,240,10,20,v=>v,st.speed,0,'km/s');
    // centre: fuel + coolant mini gauges and the driver information display
    const mini=(cx,lab,val,colL,colR)=>{x.strokeStyle=glow;x.lineWidth=3;x.beginPath();x.arc(cx,96,46,Math.PI*1.15,Math.PI*1.85);x.stroke();
      const a=Math.PI*1.15+val*Math.PI*0.7;x.strokeStyle=lit?'#ff5a1f':'#5a2a18';x.lineWidth=4;x.beginPath();x.moveTo(cx,96);x.lineTo(cx+Math.cos(a)*44,96+Math.sin(a)*44);x.stroke();
      x.fillStyle=glow;x.font='15px Arial';x.textAlign='center';x.fillText(lab,cx,118);x.fillText(colL,cx-44,86);x.fillText(colR,cx+44,86);};
    mini(452,'°C',lit?st.temp:0,'50','130');mini(572,'⛽',lit?st.fuel:0,'0','1/1');
    x.fillStyle=lit?'#0b1622':'#07090b';x.fillRect(420,150,184,150);x.strokeStyle='#22303d';x.strokeRect(420,150,184,150);
    if(lit){x.fillStyle='#bfe3ff';x.textAlign='center';x.font='bold 54px Arial';x.fillText(st.gear,512,205);
      x.font='18px Arial';x.fillText(st.msg||'Ort. 6,3 L/100 km',512,248);x.fillText('124 857 km   +18 °C',512,280);}
    // tell-tales
    const tt=(px,py,col,on,draw)=>{x.save();x.translate(px,py);x.fillStyle=on?col:'#16191c';x.strokeStyle=on?col:'#16191c';x.lineWidth=3;draw();x.restore();};
    const blink=st.blinkOn;
    tt(380,40,'#28d26b',blink&&(st.signal<0||st.hazard),()=>{x.beginPath();x.moveTo(-18,0);x.lineTo(0,-14);x.lineTo(0,14);x.closePath();x.fill();x.fillRect(0,-6,14,12);});
    tt(644,40,'#28d26b',blink&&(st.signal>0||st.hazard),()=>{x.beginPath();x.moveTo(18,0);x.lineTo(0,-14);x.lineTo(0,14);x.closePath();x.fill();x.fillRect(-14,-6,14,12);});
    tt(470,340,'#ff3b30',lit&&st.hb,()=>{x.beginPath();x.arc(0,0,14,0,7);x.stroke();x.font='bold 16px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText('P',0,1);});
    tt(512,340,'#ff3b30',lit&&!st.running,()=>{x.strokeRect(-14,-9,28,18);x.fillRect(-9,-13,5,4);x.fillRect(4,-13,5,4);});
    tt(554,340,'#ff3b30',lit&&!st.running,()=>{x.beginPath();x.ellipse(0,2,14,8,0,0,7);x.stroke();x.fillRect(10,-8,4,8);});
    tt(600,340,'#3b82f6',st.lights>=2&&lit,()=>{x.beginPath();x.arc(-4,0,10,-Math.PI/2,Math.PI/2);x.stroke();for(let k=-1;k<=1;k++)x.fillRect(8,k*6-1,10,3);});
    tt(424,340,'#f2c230',lit&&st.cruise,()=>{x.beginPath();x.arc(0,4,13,Math.PI,0);x.stroke();x.fillRect(-1,-6,3,10);});
    CL.mat.map.needsUpdate=true;CL.mat.emissiveIntensity=lit?0.9:0.05;
  }

  /* ---------- centre stack: screen, hazard, CD 300 radio, climate control, chrome wing ---------- */
  const STK={top:V(0.678,1.03,0),dir:V(-0.276,-0.961,0)};
  const stack=frame(STK.top,V(0,0,1),V(0.276,0.961,0)); // local x = car right, local y = up the face, local z = out of the face (towards the cabin)
  root.add(stack);
  const RAD={};
  (function(){
    const g=new THREE.Group();
    g.add(mesh(rbox(0.25,0.36,0.03,0.012),M.dash,0,-0.17,-0.012));
    g.add(mesh(rbox(0.215,0.33,0.004,0.004),M.piano,0,-0.165,0.004));
    // chrome wing: two sweeping bars down the stack that curve into the console
    [-1,1].forEach(s=>g.add(tube([[s*0.118,0.01,0.008],[s*0.124,-0.12,0.012],[s*0.118,-0.27,0.012],[s*0.09,-0.36,0.02],[s*0.06,-0.43,0.04]],0.0055,M.chrome)));
    g.add(tube([[-0.118,0.01,0.008],[0,0.016,0.012],[0.118,0.01,0.008]],0.0045,M.chrome));
    part(g,{id:'ortakonsol',grp:'Orta konsol',n:'Orta konsol paneli',d:'Multimedya ekranını, radyo ve klima kumandalarını bir arada toplayan dikey panel.',c:'Torpido panelinin ortasında; arkasında radyo ünitesi ve klima kontrol modülü bulunur, aşağıda vites tüneline birleşir.',t:'Astra J’nin imzası olan kanat biçimli krom çerçeve vites koluna kadar iner. Parlak siyah zemin üzerinde çok sayıda tuş vardır.'},stack);
  })();
  // display
  (function(){const g=new THREE.Group();g.position.set(0,-0.048,0.004);
    g.add(mesh(rbox(0.17,0.07,0.012,0.006),M.piano,0,0,0));
    RAD.mat=canvasMat(512,200,()=>{},{roughness:0.3,emissive:0xffffff,emissiveIntensity:0});RAD.mat.emissiveMap=RAD.mat.map;
    g.add(mesh(new THREE.PlaneGeometry(0.15,0.058),RAD.mat,0,0,0.0065));
    part(g,{id:'ekran',grp:'Orta konsol',n:'Multimedya ekranı',d:'Radyo istasyonunu, CD/AUX kaynağını, saati, dış sıcaklığı ve araç ayarlarını gösterir.',c:'Radyo ünitesine bağlı; MENU düğmesiyle ayarlar arasında gezilir.',t:'Edition pakette CD 300 sisteminin monokrom ekranı. Edition Plus’ta yerinde 7" IntelliLink dokunmatik ekran bulunur.'},stack);})();
  function drawRadio(st){const x=RAD.mat.userData.ctx,W=512,H=200;const on=st.ign>0&&st.radio.on;x.fillStyle=on?'#06121c':'#030405';x.fillRect(0,0,W,H);
    if(on){x.fillStyle='#9fd8ff';x.textAlign='left';x.font='22px Arial';x.fillText(st.radio.src,18,34);x.textAlign='right';x.fillText('12:40   +18°C',W-18,34);
      x.textAlign='center';x.font='bold 70px Arial';
      if(st.radio.src==='FM'||st.radio.src==='AM'){x.fillText(st.radio.freq.toFixed(st.radio.src==='FM'?1:0),W/2,120);x.font='24px Arial';x.fillText((st.radio.preset?('P'+st.radio.preset+'  '):'')+(st.radio.name||''),W/2,165);}
      else{x.font='bold 48px Arial';x.fillText(st.radio.src==='CD'?'CD  ▶  Parça 03':'AUX / USB',W/2,115);x.font='24px Arial';x.fillText(st.radio.src==='CD'?'02:14':'Bağlı cihaz yok',W/2,160);}
      x.textAlign='left';x.font='18px Arial';x.fillText('Ses '+st.radio.vol,18,190);
      if(st.radio.info){x.fillStyle='rgba(6,18,28,.94)';x.fillRect(40,46,W-80,128);x.strokeStyle='#9fd8ff';x.strokeRect(40,46,W-80,128);x.fillStyle='#9fd8ff';x.textAlign='center';x.font='bold 30px Arial';x.fillText(st.radio.info,W/2,118);}}
    RAD.mat.map.needsUpdate=true;RAD.mat.emissiveIntensity=on?0.85:0;}
  // central vents either side of the display
  (function(){const g=new THREE.Group();[-0.098,0.098].forEach(u=>{const v=vent(0.034,0.07,0,-0.05,0.006,null);v.position.set(u,-0.05,0.006);v.rotation.y=-Math.PI/2;g.add(v);});
    part(g,{id:'ortaizgara',grp:'Orta konsol',n:'Orta havalandırma ızgaraları',d:'Kabine ön taraftan taze ya da klimalı hava üfler.',c:'Ekranın iki yanında, krom çerçevenin içinde; kalorifer kutusuna kanallarla bağlı.',t:'Kanatçıklar yönlendirilebilir, altlarındaki tekerlekle kapatılabilir.'},stack);})();
  // buttons
  function button(id,txt,u,v,w,h,info,o){o=o||{};const b=new THREE.Group();b.position.set(u,v,0.008);
    const m=mesh(rbox(w,h,0.008,Math.min(w,h)*0.25),o.mat||M.dash);b.add(m);
    const f=mesh(new THREE.PlaneGeometry(w*0.86,h*0.78),labelMat(txt,o));f.position.z=0.0042;b.add(f);b.userData.face=f;
    stack.add(b);ctl(b,Object.assign({id,kind:'button',axis:V(0,0,-1),depth:0.003},info));return b;}
  function knob(id,u,v,r,info,o){o=o||{};const k=new THREE.Group();k.position.set(u,v,0.01);
    const body=mesh(cyl(r,0.016,40),o.mat||M.satin);body.rotation.x=Math.PI/2;k.add(body);
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const rib=mesh(new THREE.BoxGeometry(0.0015,0.0015,0.014),M.piano,Math.cos(a)*r,Math.sin(a)*r,0);k.add(rib);}
    const cap=mesh(cyl(r*0.8,0.002,32),M.piano);cap.rotation.x=Math.PI/2;cap.position.z=0.0085;k.add(cap);
    const mark=mesh(new THREE.BoxGeometry(0.0025,r*0.6,0.001),new THREE.MeshBasicMaterial({color:o.mark||0xffffff}));mark.position.set(0,r*0.45,0.0098);k.add(mark);
    if(o.ring){const rg=mesh(new THREE.RingGeometry(r*1.05,r*1.35,48),canvasMat(128,128,(x,w,h)=>{const gr=x.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#2f6fff');gr.addColorStop(1,'#ff3b30');x.fillStyle=gr;x.fillRect(0,0,w,h);}));rg.position.z=-0.004;k.add(rg);}
    stack.add(k);ctl(k,Object.assign({id,kind:'knob',axis:V(0,0,1)},info));return k;}
  button('hazard','▲',0,-0.096,0.03,0.016,{n:'Dörtlü flaşör',d:'Bütün sinyal lambalarını aynı anda yakıp söndürür; tehlike anında diğer sürücüleri uyarır.'},{mat:M.red,fg:'#ffffff',bg:'#c81e1e',size:30});
  stack.add(mesh(new THREE.BoxGeometry(0.12,0.003,0.004),M.vent,0,-0.111,0.009)); // CD slot
  const rows=[['FM/AM','1','2','3','CD/AUX'],['BACK','4','5','6','INFO'],['TP','◀◀','FAV','▶▶','TONE']];
  const btnInfo={'FM/AM':'Bant seçimi: FM ve AM arasında geçiş yapar.','CD/AUX':'Kaynak seçimi: CD, AUX ve USB arasında geçiş yapar.','BACK':'Menüde bir adım geri gider.','INFO':'Çalan istasyon ya da parça bilgisini gösterir.','TP':'Trafik anonslarını (TP) açar/kapatır.','◀◀':'Önceki istasyonu arar / önceki parçaya geçer.','▶▶':'Sonraki istasyonu arar / sonraki parçaya geçer.','FAV':'Favori istasyon listelerini açar.','TONE':'Bas, tiz ve balans ayarlarını açar.'};
  rows.forEach((r,ri)=>r.forEach((t,ci)=>{const isP=/^[1-6]$/.test(t);button('r_'+t,t,-0.06+ci*0.03,-0.128-ri*0.024,0.026,0.019,{n:isP?('Hafıza tuşu '+t):('Radyo: '+t),d:isP?('Kayıtlı '+t+'. istasyonu çağırır; basılı tutunca o anki istasyonu kaydeder.'):btnInfo[t]},{size:t.length>3?18:24});}));
  knob('vol',-0.097,-0.152,0.016,{n:'Açma/kapama ve ses düğmesi',d:'Basınca radyo açılır/kapanır, çevirince ses seviyesi değişir.'});
  knob('menu',0.097,-0.152,0.019,{n:'MENU / TUNE düğmesi',d:'Çevirerek istasyon ya da menü seçilir, basınca seçim onaylanır.'});
  // climate
  knob('k_temp',-0.068,-0.235,0.021,{n:'Sıcaklık düğmesi',d:'Mavi tarafa çevrildikçe serin, kırmızı tarafa çevrildikçe sıcak hava verir.'},{ring:true});
  knob('k_fan',0,-0.235,0.021,{n:'Fan hızı düğmesi',d:'Kabine üflenen havanın şiddetini 0–4 kademe ayarlar.'});
  knob('k_dist',0.068,-0.235,0.021,{n:'Hava dağılımı düğmesi',d:'Havanın ön cama, yüze, ayaklara ya da bunların karışımına gitmesini seçer.'});
  button('ac','A/C',-0.034,-0.272,0.028,0.017,{n:'Klima (A/C) tuşu',d:'Klima kompresörünü devreye sokar: hava soğutulur ve nemi alınır. Açıkken tuşun ışığı yanar.'},{led:true,size:22});
  button('recirc','⟲',0,-0.272,0.028,0.017,{n:'İç hava sirkülasyonu',d:'Dışarıdan hava almayı keser, kabindeki havayı döndürür (tünel, kötü koku). Uzun süre açık kalırsa camlar buğulanır.'},{led:true,size:28});
  button('rdef','▭≋',0.034,-0.272,0.028,0.017,{n:'Arka cam rezistansı',d:'Arka camdaki ısıtıcı telleri çalıştırarak buğu ve buzu çözer; bir süre sonra kendiliğinden kapanır.'},{led:true,size:20});
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.17,0.045,0.03,0.008),M.vent,0,-0.315,-0.006));
    const s=mesh(cyl(0.011,0.01,24),M.satin,-0.05,-0.315,0.006);s.rotation.x=Math.PI/2;g.add(s);
    const a=mesh(rbox(0.016,0.009,0.006,0.002),M.piano,0.04,-0.315,0.008);g.add(a);const u=mesh(rbox(0.018,0.01,0.006,0.002),M.piano,0.065,-0.315,0.008);g.add(u);
    part(g,{id:'priz',grp:'Orta konsol',n:'Eşya gözü, 12 V priz, AUX ve USB girişleri',d:'Telefon ve küçük eşyalar için göz; çakmak prizinden 12 V elektrik alınır, AUX/USB ile müzik çalınır.',c:'Klima panelinin altında, vites kolunun önünde.',t:'12 V priz 10–15 A’e kadar. USB girişi CD 300’e bağlıdır.'},stack);})();

  /* ---------- light switch, bonnet release, knee panel, glovebox ---------- */
  (function(){const g=new THREE.Group();g.position.set(0.672,0.86,-0.62);g.rotation.y=Math.PI/2;g.rotation.x=-0.1;
    g.add(mesh(rbox(0.09,0.09,0.01,0.012),M.dash,0,0,-0.006));
    const k=new THREE.Group();const kb=mesh(cyl(0.028,0.02,40),M.satin);kb.rotation.x=Math.PI/2;k.add(kb);const kr=mesh(rbox(0.05,0.01,0.012,0.004),M.piano,0,0,0.012);k.add(kr);
    const mk=mesh(new THREE.BoxGeometry(0.003,0.012,0.002),new THREE.MeshBasicMaterial({color:0xffffff}),0,0.02,0.019);k.add(mk);g.add(k);
    const lb=mesh(new THREE.PlaneGeometry(0.085,0.02),labelMat('0   ◖◗   ≡D   AUTO',{size:15,bg:'#232529'}),0,-0.035,0.0);g.add(lb);
    ctl(k,{id:'lightsw',kind:'knob',axis:V(0,0,1),n:'Far anahtarı',d:'Çevirerek farlar kapalı / park lambaları / kısa far / otomatik far konumları seçilir. Yanındaki tuşlarla sis farları açılır.'});
    part(g,{id:'faranahtar',grp:'Ön konsol',n:'Far anahtarı',d:'Dış aydınlatmayı yöneten döner anahtar.',c:'Direksiyonun solunda, torpido panelinde; aydınlatma modülüne bağlı.',t:'Konumlar: 0, park, kısa far, AUTO (ışık sensörüyle). Çekince ön/arka sis farı.'});})();
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.05,0.02,0.04,0.006),M.lower,0.83,0.48,-0.67));
    part(g,{id:'kaputkol',grp:'Ön konsol',n:'Kaput açma kolu',d:'Çekince kaput kilidini birinci kademeden açar.',c:'Sürücü ayak boşluğunun solunda, tel ile öndeki kaput kilidine bağlı.',t:'Kaput tamamen açılmak için öndeki emniyet mandalının da itilmesi gerekir.'});})();
  (function(){const g=new THREE.Group();const kp=new THREE.Shape();kp.moveTo(0.69,0.86);kp.quadraticCurveTo(0.64,0.75,0.70,0.66);kp.lineTo(0.74,0.66);kp.quadraticCurveTo(0.69,0.75,0.73,0.86);kp.closePath();
    g.add(mesh(extrudeZ(kp,0.42,0.006),M.lower).translateZ(DRV));
    part(g,{id:'dizpanel',grp:'Ön konsol',n:'Diz paneli ve direksiyon kolonu kapağı',d:'Sürücünün dizlerini korur, direksiyon kolonunun altını örter.',c:'Direksiyon kolonunun altında, torpido panelinin sürücü tarafı.',t:'İçinde direksiyon kolonu, kontak ve sigorta kutusuna erişim kapağı bulunur.'});})();
  const GB={};
  (function(){const hinge=new THREE.Group();hinge.position.set(0.70,0.705,0.37);root.add(hinge);
    const lid=mesh(rbox(0.035,0.17,0.40,0.02),M.lower,-0.012,0.085,0);lid.rotation.z=-0.12;hinge.add(lid);
    const hd=mesh(rbox(0.012,0.025,0.08,0.006),M.satin,-0.03,0.15,0);hinge.add(hd);
    const box=mesh(rbox(0.22,0.14,0.38,0.01),M.vent,0.13,0.08,0);hinge.parent.add(box);box.position.set(0.82,0.78,0.37);
    GB.hinge=hinge;ctl(hinge,{id:'glove',kind:'toggle',n:'Torpido gözü',d:'Kolu çekince kapak aşağı açılır; içinde kullanım kılavuzu ve soğutma kanalı bulunur.'});
    part(hinge,{id:'torpidogoz',grp:'Ön konsol',n:'Torpido gözü',d:'Yolcu önündeki kilitli saklama bölmesi.',c:'Torpido panelinin yolcu tarafı; klimalı versiyonda soğutma kanalı vardır.',t:'Dokununca açılır/kapanır.'},root);})();

  /* =====================================================================
     STEERING WHEEL & COLUMN
     ===================================================================== */
  const N=V(-0.906,0.423,0),TOP=V(0.423,0.906,0); // wheel normal (towards the driver) and wheel "up"
  const SW=frame(HUB,V().crossVectors(TOP,N),TOP);root.add(SW);  // local: x right, y up, z towards the driver
  (function(){const g=new THREE.Group();
    g.add(mesh(new THREE.TorusGeometry(0.185,0.0175,16,72),M.leather));
    for(let k=0;k<12;k++){const a=Math.PI*0.2+k*0.05;const st=mesh(new THREE.TorusGeometry(0.0176,0.0012,6,12),M.steel,Math.cos(a)*0.185,Math.sin(a)*0.185,0);st.rotation.y=Math.PI/2;st.rotation.x=a;}
    [[-1,0],[1,0]].forEach(([s])=>{const sp=mesh(rbox(0.11,0.05,0.022,0.012),M.leather,s*0.12,-0.01,-0.004);g.add(sp);const cr=mesh(rbox(0.1,0.006,0.004,0.002),M.chrome,s*0.12,0.012,0.009);g.add(cr);});
    const bs=mesh(rbox(0.05,0.12,0.022,0.012),M.leather,0,-0.12,-0.004);g.add(bs);const bc=mesh(new THREE.TorusGeometry(0.05,0.003,8,40,Math.PI),M.chrome,0,-0.12,0.008);bc.rotation.z=Math.PI;g.add(bc);
    part(g,{id:'direksiyon',grp:'Direksiyon',n:'Direksiyon simidi',d:'Aracı yönlendirir. Üzerindeki tuşlarla ses sistemi ve hız sabitleyici, göbekteki hava yastığı kapağından korna kullanılır.',c:'Direksiyon kolonu milinin ucuna oturur; kolon, kremayer direksiyon kutusuna bağlıdır (elektro-hidrolik destekli).',t:'3 kollu, Ø ≈ 370 mm. Edition Plus’ta deri kaplı. Yükseklik ve derinlik ayarlıdır (kolonun altındaki kol).'},SW);})();
  // airbag / horn pad
  (function(){const pad=new THREE.Group();pad.position.z=0.006;
    pad.add(mesh(rbox(0.13,0.105,0.04,0.035),M.leather,0,0.005,0));
    const em=mesh(new THREE.TorusGeometry(0.02,0.0035,10,32),M.chrome,0,0.015,0.021);pad.add(em);
    const bolt=new THREE.Shape();bolt.moveTo(-0.017,0.002);bolt.lineTo(0.004,0.006);bolt.lineTo(0.002,0.002);bolt.lineTo(0.017,-0.002);bolt.lineTo(-0.004,-0.006);bolt.lineTo(-0.002,-0.002);bolt.closePath();
    pad.add(mesh(new THREE.ExtrudeGeometry(bolt,{depth:0.002,bevelEnabled:false}),M.chrome,0,0.015,0.02));
    const lb=mesh(new THREE.PlaneGeometry(0.04,0.008),labelMat('AIRBAG',{size:22,bg:'#1b1c1e',fg:'#5e636a'}),0,-0.03,0.0205);pad.add(lb);
    SW.add(pad);ctl(pad,{id:'horn',kind:'button',axis:V(0,0,-1),depth:0.006,n:'Korna (hava yastığı kapağı)',d:'Direksiyon göbeğine basınca korna çalar. Kapağın altında sürücü hava yastığı bulunur.'});
    part(pad,{id:'airbag',grp:'Direksiyon',n:'Sürücü hava yastığı ve korna',d:'Çarpışmada saniyenin binde birkaç kesrinde şişerek sürücünün başını ve göğsünü korur. Kapağa basınca korna çalar.',c:'Direksiyon simidinin göbeğinde; döner (spiral) kablo ile hava yastığı beynine bağlı.',t:'İki kademeli sürücü hava yastığı. Dokun: korna çalar.'},SW);})();
  // spoke buttons
  function swButton(id,txt,x,y,info){const b=new THREE.Group();b.position.set(x,y,0.009);b.add(mesh(rbox(0.018,0.014,0.006,0.004),M.piano));const f=mesh(new THREE.PlaneGeometry(0.016,0.011),labelMat(txt,{size:22}));f.position.z=0.0032;b.add(f);SW.add(b);ctl(b,Object.assign({id,kind:'button',axis:V(0,0,-1),depth:0.002},info));}
  swButton('sw_volup','+',-0.135,0.008,{n:'Direksiyon: ses +',d:'Ses seviyesini artırır.'});swButton('sw_voldn','−',-0.135,-0.012,{n:'Direksiyon: ses −',d:'Ses seviyesini azaltır.'});
  swButton('sw_src','SRC',-0.11,-0.002,{n:'Direksiyon: kaynak',d:'Radyo, CD ve AUX arasında geçiş yapar.'});
  swButton('sw_res','RES+',0.11,0.008,{n:'Hız sabitleyici: RES/+',d:'Kayıtlı hıza döner ya da ayarlı hızı artırır.'});swButton('sw_set','SET−',0.11,-0.012,{n:'Hız sabitleyici: SET/−',d:'O anki hızı kaydeder ya da ayarlı hızı azaltır.'});
  swButton('sw_cc','⏲',0.135,-0.002,{n:'Hız sabitleyici aç/kapa',d:'Hız sabitleyiciyi (cruise control) hazır konuma getirir veya kapatır; gösterge panelinde sarı lamba yanar.'});
  swButton('sw_lim','LIM',0.135,-0.022,{n:'Hız sınırlayıcı',d:'Ayarlanan hızın aşılmasını engeller (limitleyici).'});
  // column, shroud, stalks, ignition
  (function(){const g=new THREE.Group();
    const col=mesh(new THREE.CylinderGeometry(0.035,0.045,0.24,24),M.lower);const cg=frame(HUB.clone().addScaledVector(N,-0.13),V(0,0,1),N.clone().negate());cg.add(col);g.add(cg);
    const sh=mesh(rbox(0.1,0.085,0.18,0.03),M.lower);const sg=frame(HUB.clone().addScaledVector(N,-0.12).add(V(0,-0.02,0)),V(0,0,1),N.clone().negate());sh.rotation.x=Math.PI/2;sg.add(sh);g.add(sg);
    part(g,{id:'kolon',grp:'Direksiyon',n:'Direksiyon kolonu ve kapağı',d:'Direksiyon simidinin dönüşünü aşağıdaki direksiyon kutusuna iletir; çarpışmada kısalarak sürücüyü korur.',c:'Simitten torpido altına, oradan ara milli olarak motor bölümündeki kremayere gider. Kapağın içinde kontak ve kollar bulunur.',t:'Yükseklik/derinlik ayar kolu kapağın altında. Elektronik direksiyon kilidi kontak anahtarıyla çalışır.'});})();
  function stalk(id,side,info){const base=HUB.clone().addScaledVector(N,-0.105).add(V(0,0.005,0)).add(V(0,0,side*0.06));const g=frame(base,V(0,0,1),N.clone().negate());
    const s=new THREE.Group();const arm=mesh(new THREE.CylinderGeometry(0.008,0.011,0.12,16),M.lower);arm.rotation.z=Math.PI/2;arm.position.x=side*0.06;s.add(arm);
    const tip=mesh(new THREE.CylinderGeometry(0.012,0.012,0.035,16),M.lower);tip.rotation.z=Math.PI/2;tip.position.x=side*0.125;s.add(tip);
    const ring=mesh(new THREE.TorusGeometry(0.0122,0.002,6,20),M.satin);ring.rotation.y=Math.PI/2;ring.position.x=side*0.112;s.add(ring);
    g.add(s);root.add(g);ctl(s,Object.assign({id,kind:'stalk',side},info));return s;}
  stalk('st_left',-1,{n:'Sinyal ve far kolu (sol)',d:'Aşağı: sol sinyal, yukarı: sağ sinyal. İleri itince uzun far, kendine çekince selektör. Uçtaki halka sis farlarını açar. Dokun: sol → sağ sinyal → kapalı.'});
  stalk('st_right',1,{n:'Silecek kolu ve yol bilgisayarı (sağ)',d:'Aşağı: ön silecek kademeleri, kendine çekince yıkama. Uçtaki tuşla yol bilgisayarı ekranları (ortalama tüketim, menzil, hız) değişir.'});
  (function(){const g=new THREE.Group();const p=HUB.clone().addScaledVector(N,-0.16).add(V(0,-0.035,0.085));g.position.copy(p);
    const bz=mesh(cyl(0.017,0.012,32),M.satin);bz.rotation.z=Math.PI/2;g.add(bz);const key=new THREE.Group();key.add(mesh(rbox(0.006,0.03,0.016,0.004),M.chrome,-0.012,0,0));key.add(mesh(rbox(0.012,0.032,0.026,0.008),M.piano,-0.028,0,0));g.add(key);
    root.add(g);ctl(key,{id:'ign',kind:'key',n:'Kontak anahtarı',d:'Anahtarı çevirerek kontak açılır (göstergeler yanar), bir kademe daha çevirince marş motoru motoru çalıştırır. Dokun: kapalı → kontak açık → motor çalışıyor → kapalı.'});
    part(g,{id:'kontak',grp:'Direksiyon',n:'Kontak',d:'Aracın elektrik sistemini açar ve motoru çalıştırır.',c:'Direksiyon kolonunun sağında; immobilizer anteni anahtardaki çipi okur.',t:'Kademeler: 0 (kilit), 1 (aksesuar), 2 (kontak), 3 (marş).'});})();

  /* =====================================================================
     CENTRE TUNNEL: console, gear lever, handbrake, cup holders, armrest
     ===================================================================== */
  (function(){const g=new THREE.Group();
    const s=new THREE.Shape();s.moveTo(0.62,0.42);s.lineTo(0.62,0.66);s.quadraticCurveTo(0.58,0.7,0.52,0.62);s.lineTo(0.30,0.575);s.lineTo(-0.05,0.565);s.lineTo(-0.10,0.56);s.lineTo(-0.10,0.40);s.closePath();
    g.add(mesh(extrudeZ(s,0.24,0.012),M.lower));
    g.add(mesh(rbox(0.28,0.01,0.2,0.01),M.piano,0.36,0.582,0));
    [0.205,0.255].forEach(x=>{const c=mesh(new THREE.CylinderGeometry(0.036,0.036,0.05,32,1,true),M.vent,x,0.55,0);c.material=M.vent;g.add(c);g.add(mesh(new THREE.TorusGeometry(0.037,0.004,8,32),M.satin,x,0.575,0).rotateX(Math.PI/2));});
    part(g,{id:'tunel',grp:'Orta tünel',n:'Orta tünel konsolu ve bardaklıklar',d:'Vites kolunu ve el frenini taşır, iki bardaklık ve saklama yerleri sunar.',c:'Orta konsol panelinden kolçağa kadar uzanır; altında egzoz tüneli ve vites kabloları geçer.',t:'Parlak siyah vites çevresi, iki bardaklık.'});})();
  const GEAR={};
  (function(){const piv=new THREE.Group();piv.position.set(0.36,0.585,0);root.add(piv);
    const lever=new THREE.Group();piv.add(lever);
    const bootG=new THREE.CylinderGeometry(0.018,0.06,0.09,24,6,true);const bp=bootG.attributes.position;for(let i=0;i<bp.count;i++){const y=bp.getY(i);const k=1+0.08*Math.sin((y+0.045)/0.09*Math.PI*6);bp.setX(i,bp.getX(i)*k);bp.setZ(i,bp.getZ(i)*k);}bootG.computeVertexNormals();
    const boot=mesh(bootG,M.leather,0,0.045,0);boot.material=M.leather;piv.add(boot);
    lever.add(mesh(cyl(0.008,0.15,12),M.chrome,0,0.09,0));
    lever.add(mesh(new THREE.SphereGeometry(0.03,32,20),M.leather,0,0.18,0));
    const top=mesh(new THREE.CircleGeometry(0.02,32),canvasMat(128,128,(x,w,h)=>{x.fillStyle='#16181b';x.fillRect(0,0,w,h);x.strokeStyle='#e8e8e8';x.fillStyle='#e8e8e8';x.lineWidth=5;x.font='bold 22px Arial';x.textAlign='center';
      const cs=[22,50,78,106];x.beginPath();cs.forEach(c=>{x.moveTo(c,32);x.lineTo(c,96);});x.moveTo(22,64);x.lineTo(106,64);x.stroke();[['R',22,26],['1',50,26],['3',78,26],['5',106,26],['2',50,118],['4',78,118]].forEach(([t,a,b])=>x.fillText(t,a,b));}),0,0.209,0);
    top.rotation.x=-Math.PI/2;top.rotation.z=Math.PI/2;lever.add(top);
    const ring=mesh(new THREE.TorusGeometry(0.012,0.0025,8,20),M.satin,0,0.13,0);ring.rotation.x=Math.PI/2;lever.add(ring);
    GEAR.lever=lever;ctl(lever,{id:'gear',kind:'gear',n:'Vites kolu (5 ileri manuel)',d:'Debriyaja basılıyken vites değiştirilir. Geri vites için topuzun altındaki halka kaldırılıp sola-öne itilir. Dokun: boş → 1 → 2 → 3 → 4 → 5 → geri.'});
    part(piv,{id:'vites',grp:'Orta tünel',n:'Vites kolu ve körüğü',d:'5 ileri + geri manuel şanzımanın vitesleri bu kolla seçilir.',c:'Kol, iki kabloyla (seçme ve geçirme) motor bölümündeki F17 şanzımana bağlıdır.',t:'Desen: R-1-3-5 üstte, 2-4 altta. Geri vites kilidi: halka kaldırılarak açılır.'},root);})();
  const HB={};
  (function(){const piv=new THREE.Group();piv.position.set(0.10,0.57,0);root.add(piv);
    const l=new THREE.Group();piv.add(l);l.add(mesh(rbox(0.26,0.032,0.04,0.014),M.leather,-0.13,0.016,0));l.add(mesh(rbox(0.035,0.03,0.042,0.01),M.satin,-0.24,0.018,0));l.add(mesh(cyl(0.008,0.012,12),M.satin,-0.262,0.018,0).rotateZ(Math.PI/2));
    l.rotation.z=-0.42;HB.lever=l;ctl(l,{id:'hb',kind:'toggle',n:'El freni kolu',d:'Yukarı çekilince arka tekerleklerin frenini kilitler. İndirmek için uçtaki düğmeye basılıp kol aşağı itilir. Dokun: çek / indir.'});
    part(piv,{id:'elfreni',grp:'Orta tünel',n:'El freni',d:'Park hâlindeki aracı sabit tutar; arka fren kaliperlerine kabloyla bağlıdır.',c:'Vites kolunun arkasında; iki tel arka tekerleklerdeki disk kaliperlerinin park mekanizmasını çeker.',t:'Mekanik el freni. Çekiliyken göstergede kırmızı (P) lambası yanar.'},root);})();
  const ARM={};
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.32,0.1,0.22,0.02),M.lower,-0.27,0.6,0));
    const hinge=new THREE.Group();hinge.position.set(-0.42,0.66,0);const lid=mesh(rbox(0.3,0.035,0.2,0.016),M.leather,0.15,0.016,0);hinge.add(lid);g.add(hinge);
    ARM.hinge=hinge;ctl(hinge,{id:'arm',kind:'toggle',n:'Orta kolçak',d:'Kolu dinlendirir; kapağı kaldırınca altında saklama bölmesi açılır. Dokun: aç / kapat.'});
    part(g,{id:'kolcak',grp:'Orta tünel',n:'Orta kolçak ve saklama bölmesi',d:'Sürücü ve yolcunun kolunu dinlendirdiği, altı saklama gözü olan kapak.',c:'Ön koltukların arasında, orta tünelin arka ucu.',t:'İleri-geri kayar; içinde 12 V priz olabilir.'});})();

  /* =====================================================================
     PEDALS
     ===================================================================== */
  const PED={};
  (function(){const g=new THREE.Group();
    [['clutch',-0.50,'Debriyaj pedalı','Basınca motor ile şanzımanın bağlantısı kesilir; vites değiştirirken kullanılır.'],['brake',-0.37,'Fren pedalı','Basınca 4 tekerleğin freni devreye girer, arkadaki stop lambaları yanar.'],['gas',-0.255,'Gaz pedalı','Basıldıkça gaz kelebeği açılır, motor devri yükselir.']].forEach(([id,z,n,d],i)=>{
      const piv=new THREE.Group();piv.position.set(0.93,0.62,z);g.add(piv);
      const arm=mesh(new THREE.BoxGeometry(0.014,0.24,0.012),M.steel,-0.04,-0.12,0);arm.rotation.z=-0.32;piv.add(arm);
      const pad=mesh(rbox(0.015,i===2?0.11:0.06,i===2?0.055:0.065,0.006),M.rubber,-0.08,-0.235,0);pad.rotation.z=-0.55;piv.add(pad);
      PED[id]=piv;ctl(piv,{id:'p_'+id,kind:'pedal',n,d});});
    part(g,{id:'pedal',grp:'Pedallar',n:'Pedallar (debriyaj, fren, gaz)',d:'Manuel vitesli araçta 3 pedal vardır: solda debriyaj, ortada fren, sağda gaz.',c:'Debriyaj ve fren pedalı hidrolik silindirlere, gaz pedalı elektronik sensörle motor beynine bağlıdır.',t:'Fren servo destekli (motor vakumu). Debriyaj hidrolik, fren hidroliği haznesini kullanır. Dokun: pedala basılır.'});})();

  /* =====================================================================
     SEATS
     ===================================================================== */
  function frontSeat(z,isDriver){const g=new THREE.Group();g.position.set(-0.05,0,z);
    g.add(mesh(rbox(0.5,0.035,0.06,0.01),M.steel,0,0.29,0.17));g.add(mesh(rbox(0.5,0.035,0.06,0.01),M.steel,0,0.29,-0.17));
    g.add(mesh(rbox(0.46,0.15,0.48,0.05),M.fabric,0,0.43,0));
    g.add(mesh(rbox(0.36,0.03,0.28,0.012),M.insert,0.01,0.51,0));
    [-1,1].forEach(s=>g.add(mesh(rbox(0.4,0.07,0.07,0.03),M.fabric,0,0.52,s*0.2)));
    const back=new THREE.Group();back.position.set(-0.22,0.49,0);back.rotation.z=-0.28;g.add(back);
    back.add(mesh(rbox(0.13,0.64,0.5,0.05),M.fabric,0,0.32,0));back.add(mesh(rbox(0.02,0.44,0.28,0.008),M.insert,0.066,0.31,0));
    [-1,1].forEach(s=>back.add(mesh(rbox(0.1,0.5,0.07,0.03),M.fabric,0.04,0.3,s*0.215)));
    [-0.065,0.065].forEach(dz=>back.add(mesh(cyl(0.006,0.08,10),M.chrome,0.005,0.66,dz)));
    back.add(mesh(rbox(0.1,0.2,0.27,0.05),M.fabric,0.015,0.78,0));
    const lev=mesh(rbox(0.07,0.025,0.012,0.006),M.lower,-0.05,0.43,(isDriver?-1:1)*0.25);g.add(lev);
    const bk=mesh(rbox(0.05,0.08,0.03,0.01),M.lower,-0.12,0.53,(isDriver?1:-1)*0.26);g.add(bk);const bkb=mesh(rbox(0.02,0.01,0.025,0.003),M.red,-0.12,0.575,(isDriver?1:-1)*0.26);g.add(bkb);
    return g;}
  part(frontSeat(DRV,true),{id:'surucukoltuk',grp:'Koltuklar',n:'Sürücü koltuğu',d:'Sürücüyü doğru sürüş pozisyonunda tutar. İleri-geri, sırt açısı ve yükseklik ayarlanabilir.',c:'İki raya cıvatalı olarak tabana bağlı; iç yanında emniyet kemeri tokası, sırtında yan hava yastığı bulunur.',t:'Kumaş döşeme (ortada desenli şeritler). Yükseklik ayarı yan koldaki pompa koluyla. Aktif koltuk başlığı.'});
  part(frontSeat(-DRV,false),{id:'yolcukoltuk',grp:'Koltuklar',n:'Ön yolcu koltuğu',d:'Ön yolcu koltuğu; ileri-geri ve sırt açısı ayarlanır.',c:'Raylar üzerinden tabana bağlı; sırtında yan hava yastığı, iç yanında kemer tokası.',t:'Kumaş döşeme. Arkaya bakan çocuk koltuğu takılacaksa yolcu hava yastığı kapatılmalıdır.'});
  const REAR={};
  (function(){const g=new THREE.Group();
    g.add(mesh(rbox(0.44,0.15,1.24,0.06),M.fabric,-0.93,0.42,0));
    [-0.4,0,0.4].forEach(z=>g.add(mesh(rbox(0.34,0.025,0.3,0.012),M.insert,-0.92,0.5,z)));
    const mk=(z0,w,hds,id,lab)=>{const piv=new THREE.Group();piv.position.set(-1.15,0.48,z0);g.add(piv);const b=new THREE.Group();b.rotation.z=-0.36;piv.add(b);
      b.add(mesh(rbox(0.12,0.6,w,0.05),M.fabric,0,0.3,0));b.add(mesh(rbox(0.02,0.42,w*0.7,0.008),M.insert,0.06,0.3,0));
      hds.forEach(dz=>{b.add(mesh(rbox(0.09,0.15,0.22,0.04),M.fabric,0.01,0.66,dz));[-0.05,0.05].forEach(d=>b.add(mesh(cyl(0.005,0.06,8),M.chrome,0.005,0.6,dz+d)));});
      REAR[id]=piv;ctl(piv,{id,kind:'toggle',n:lab,d:'Arka koltuk sırtı 60/40 katlanır: bagajdan kabine uzun eşya taşınabilir (460 L → 1010 L). Dokun: katla / kaldır.'});};
    mk(-0.24,0.74,[-0.28,0.08],'rear60','Arka koltuk sırtı (%60, sol)');mk(0.37,0.5,[0.4],'rear40','Arka koltuk sırtı (%40, sağ)');
    part(g,{id:'arkakoltuk',grp:'Koltuklar',n:'Arka koltuk (60/40 katlanır)',d:'Üç kişilik arka koltuk. Sırtı 60/40 oranında katlanarak bagajla birleşir.',c:'Minder tabana kancalarla, sırt ise bagaj tarafındaki kilitlere oturur; dış koltuklarda ISOFIX bağlantıları vardır.',t:'3 koltuk başlığı, 3 adet 3 noktalı emniyet kemeri. Dokun: sırt katlanır.'});})();
  (function(){const g=new THREE.Group();
    [-1,1].forEach(s=>{g.add(tube([[-0.08,1.24,s*0.705],[-0.085,0.9,s*0.72],[-0.09,0.5,s*0.735],[-0.1,0.33,s*0.74]],0.004,M.belt));g.add(mesh(rbox(0.03,0.05,0.012,0.005),M.satin,-0.08,1.25,s*0.7));
      g.add(mesh(rbox(0.04,0.02,0.008,0.004),M.satin,-0.12,0.5,s*0.135));});
    part(g,{id:'kemer',grp:'Koltuklar',n:'Ön emniyet kemerleri',d:'Çarpışmada yolcuyu koltukta tutar. Gerdiriciler kemeri anında sıkar, yük sınırlayıcı göğse binen kuvveti azaltır.',c:'Üst ucu B direğindeki yükseklik ayarlı makaraya, alt ucu tabana; tokası koltuğun iç yanında.',t:'3 noktalı, pirotekni gerdiricili ve yük sınırlayıcılı. Takılmazsa gösterge panelinde uyarı verir.'});})();

  /* =====================================================================
     FLOOR, SILLS, PILLARS, HEADLINER, PARCEL SHELF
     ===================================================================== */
  (function(){const g=new THREE.Group();
    const s=new THREE.Shape();s.moveTo(-0.76,0.31);s.lineTo(-0.7,0.26);s.lineTo(-0.17,0.26);s.lineTo(-0.12,0.4);s.lineTo(0.12,0.4);s.lineTo(0.17,0.26);s.lineTo(0.7,0.26);s.lineTo(0.76,0.31);s.lineTo(0.76,0.25);s.lineTo(-0.76,0.25);s.closePath();
    g.add(mesh(extrudeX(s,-1.22,2.2),M.carpet));
    const toe=mesh(new THREE.BoxGeometry(0.25,0.012,1.4),M.carpet,1.03,0.36,0);toe.rotation.z=0.85;g.add(toe);
    [[-0.37,0.25],[0.37,0.25],[-0.42,-0.75],[0.42,-0.75]].forEach(([z,x])=>g.add(mesh(rbox(0.5,0.008,0.36,0.03),M.rubber,x,0.267,z)));
    [-1,1].forEach(s=>g.add(mesh(rbox(2.0,0.1,0.07,0.02),M.lower,-0.12,0.32,s*0.775)));
    part(g,{id:'taban',grp:'Kapılar ve tavan',n:'Taban halısı, paspaslar ve marşpiyel kaplamaları',d:'Kabin tabanını kaplar; ses ve ısı yalıtımı sağlar.',c:'Gövde tabanı üzerinde, ortada egzoz ve vites tünelini örter; kenarlarda marşpiyel kaplamaları kapı eşiklerini kapatır.',t:'Halı altında ses yalıtım keçesi. Paspaslar tabandaki tırnaklara takılır.'});})();
  (function(){const g=new THREE.Group();const yc=x=>{const P=[[-1.15,1.31],[-1.0,1.36],[-0.85,1.4],[-0.55,1.43],[-0.1,1.44],[0.2,1.4],[0.4,1.36]];if(x<=P[0][0])return P[0][1];for(let i=0;i<P.length-1;i++)if(x<=P[i+1][0]){const t=(x-P[i][0])/(P[i+1][0]-P[i][0]);return P[i][1]+t*(P[i+1][1]-P[i][1]);}return P[P.length-1][1];};
    const geo=new THREE.PlaneGeometry(1.55,1.36,40,12);geo.rotateX(Math.PI/2);const p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const lx=p.getX(i),lz=p.getZ(i);const x=-0.375+lx;p.setX(i,x);p.setY(i,yc(x)-0.022-0.06*Math.pow(Math.abs(lz)/0.68,2));}geo.computeVertexNormals();
    const hl=mesh(geo,M.head);hl.material=M.head;g.add(hl);
    // roof console with reading lights
    g.add(mesh(rbox(0.14,0.03,0.16,0.02),M.lower,0.36,1.355,0));
    part(g,{id:'tavan',grp:'Kapılar ve tavan',n:'Tavan döşemesi',d:'Tavanın iç yüzünü kaplar; ses ve ısı yalıtımı sağlar.',c:'Tavan sacına klipslerle tutturulur; önünde tavan konsolu, kenarlarında tutunma kolları ve perde hava yastıkları bulunur.',t:'Açık gri kumaş kaplama. Perde hava yastıkları kenar çıtalarının arkasındadır.'});})();
  const LAMPS={};
  (function(){const g=new THREE.Group();[-0.035,0.035].forEach(z=>{const l=mesh(rbox(0.04,0.006,0.03,0.006),new THREE.MeshStandardMaterial({color:0xe9e4d4,emissive:0xfff2d0,emissiveIntensity:0,roughness:0.3}),0.36,1.338,z);g.add(l);});
    LAMPS.mats=g.children.map(c=>c.material);root.add(g);ctl(g,{id:'roofl',kind:'button',axis:V(0,1,0),depth:0.002,n:'Okuma lambaları',d:'Tavan konsolundaki iki lamba; kapı açılınca otomatik yanar. Dokun: aç / kapat.'});})();
  (function(){const g=new THREE.Group();
    [-1,1].forEach(s=>{g.add(tube([[1.03,1.05,s*0.70],[0.8,1.17,s*0.68],[0.55,1.31,s*0.655],[0.4,1.37,s*0.64]],0.03,M.lower));
      g.add(mesh(rbox(0.1,0.74,0.04,0.02),M.lower,-0.07,0.98,s*0.715));
      g.add(tube([[-1.05,1.33,s*0.64],[-1.3,1.2,s*0.66],[-1.5,1.08,s*0.68]],0.04,M.lower));
      g.add(mesh(rbox(0.12,0.025,0.03,0.01),M.lower,0.15,1.32,s*0.66));g.add(mesh(rbox(0.12,0.025,0.03,0.01),M.lower,-0.75,1.33,s*0.66));});
    part(g,{id:'direk',grp:'Kapılar ve tavan',n:'Direk kaplamaları ve tutunma kolları',d:'A, B ve C direklerinin iç kaplamaları; kapıların üstünde tutunma kolları.',c:'Direk saclarına klipslerle bağlıdır; A ve C direklerinin içinden perde hava yastığı geçer.',t:'B direğinde emniyet kemeri yükseklik ayarı ve makarası.'});})();
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.46,0.02,1.3,0.01),M.carpet,-1.42,1.07,0));[-0.42,0.42].forEach(z=>{g.add(mesh(cyl(0.065,0.006,32),M.vent,-1.42,1.082,z));});g.add(mesh(rbox(0.06,0.025,0.25,0.008),M.red,-1.6,1.095,0));
    part(g,{id:'raf',grp:'Kapılar ve tavan',n:'Arka raf ve üçüncü stop lambası',d:'Arka koltuk ile arka cam arasındaki raf; hoparlörleri ve üçüncü stop lambasını taşır.',c:'Bagaj ile kabin arasında; altından bagaj kapağı menteşeleri geçer.',t:'İki arka hoparlör yuvası.'});})();
  // interior mirror & sun visors
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.04,0.02,0.04,0.008),M.lower,0.60,1.29,0));g.add(mesh(cyl(0.007,0.08,10),M.lower,0.56,1.265,0).rotateZ(1.0));
    const m=new THREE.Group();m.position.set(0.515,1.235,0);m.rotation.z=0.18;m.add(mesh(rbox(0.035,0.07,0.25,0.03),M.lower));const gl=mesh(new THREE.PlaneGeometry(0.235,0.06),M.glass,-0.0185,0,0);gl.rotation.y=-Math.PI/2;m.add(gl);g.add(m);
    part(g,{id:'ayna',grp:'Kapılar ve tavan',n:'İç dikiz aynası',d:'Sürücünün arka camdan geriyi görmesini sağlar.',c:'Ön camın üst ortasına yapıştırılmış metal tabana takılı; arkasında yağmur/ışık sensörü olabilir.',t:'Manuel gece konumlu (alttaki tırnak çekilince kamaşma azalır). Edition Plus’ta otomatik kararan ayna opsiyonu.'});})();
  const VIS={};
  [['visorL',-1],['visorR',1]].forEach(([id,s])=>{const h=new THREE.Group();h.position.set(0.47,1.365,s*0.33);root.add(h);
    const v=mesh(rbox(0.17,0.015,0.36,0.02),M.head,-0.085,0,0);h.add(v);const mr=mesh(new THREE.PlaneGeometry(0.06,0.1),M.glass,-0.09,-0.0085,0);mr.rotation.x=Math.PI/2;mr.rotation.z=Math.PI/2;h.add(mr);
    VIS[id]=h;ctl(h,{id,kind:'toggle',n:s<0?'Sürücü güneşliği':'Yolcu güneşliği',d:'Güneşi kesmek için aşağı indirilir, yan cama da çevrilebilir. İçinde kapaklı makyaj aynası var. Dokun: indir / kaldır.'});
    part(h,{id:'gunes'+id,grp:'Kapılar ve tavan',n:s<0?'Sürücü güneşliği':'Yolcu güneşliği',d:'Göz kamaşmasını önleyen katlanır güneşlik.',c:'Tavan döşemesine menteşeyle bağlı.',t:'Aynalı. Dokun: indir / kaldır.'},root);});

  /* =====================================================================
     DOOR TRIMS (built in car coordinates with the doors closed; the page re-parents them to the door hinges)
     ===================================================================== */
  function doorTrim(front,s){const g=new THREE.Group();const x0=front?-0.0:-1.0,x1=front?0.9:-0.12,zc=s*0.79,L=x1-x0,xc=(x0+x1)/2;
    g.add(mesh(rbox(L,0.6,0.05,0.04),M.lower,xc,0.62,zc));
    g.add(mesh(rbox(L-0.04,0.07,0.05,0.02),M.dash,xc,0.95,zc-s*0.01));
    g.add(mesh(rbox(L*0.55,0.22,0.02,0.04),M.insert,xc-0.04*s*0,0.75,zc-s*0.027));
    g.add(mesh(rbox(L*0.62,0.05,0.09,0.02),M.leather,xc+0.02,0.64,zc-s*0.05));
    g.add(mesh(rbox(L*0.5,0.09,0.04,0.02),M.dash,xc,0.38,zc-s*0.035));
    const hd=mesh(rbox(0.07,0.025,0.02,0.008),M.chrome,x1-0.16,0.8,zc-s*0.03);g.add(hd);
    if(front){const sp=mesh(cyl(0.07,0.008,40),M.vent,x1-0.25,0.46,zc-s*0.027);sp.rotation.x=Math.PI/2;g.add(sp);for(let k=-5;k<=5;k++)g.add(mesh(new THREE.BoxGeometry(0.11,0.003,0.004),M.lower,x1-0.25,0.46+k*0.011,zc-s*0.032));}
    return g;}
  function winSwitch(parent,id,x,y,z,s,info){const b=new THREE.Group();b.position.set(x,y,z);b.add(mesh(rbox(0.022,0.008,0.016,0.004),M.piano));const f=mesh(new THREE.PlaneGeometry(0.018,0.012),labelMat('⇕',{size:30}));f.rotation.x=-Math.PI/2;f.position.y=0.0042;b.add(f);parent.add(b);ctl(b,Object.assign({id,kind:'button',axis:V(0,-1,0),depth:0.003},info));}
  [['KAPI_1',true,-1,'Sol ön (sürücü) kapı döşemesi'],['KAPI_3',true,1,'Sağ ön kapı döşemesi'],['KAPI_4',false,-1,'Sol arka kapı döşemesi'],['KAPI2',false,1,'Sağ arka kapı döşemesi']].forEach(([door,front,s,n])=>{
    const g=doorTrim(front,s);const x1=front?0.9:-0.12,zc=s*0.79;
    if(door==='KAPI_1'){const pod=mesh(rbox(0.14,0.02,0.06,0.01),M.piano,x1-0.3,0.672,zc+0.06);g.add(pod);
      [['w_fl','Sol ön'],['w_fr','Sağ ön'],['w_rl','Sol arka'],['w_rr','Sağ arka']].forEach(([id,lab],k)=>winSwitch(g,id,x1-0.35+(k%2)*0.04,0.684,zc+0.05+Math.floor(k/2)*0.025,s,{n:'Cam düğmesi: '+lab,d:'Bastırınca cam iner, çekince kalkar. Sürücü tarafındaki dört düğmeyle bütün camlar kumanda edilir. Dokun: cam iner / çıkar.',door:{w_fl:'KAPI_1',w_fr:'KAPI_3',w_rl:'KAPI_4',w_rr:'KAPI2'}[id]}));
      const mj=mesh(cyl(0.012,0.01,20),M.satin,x1-0.24,0.684,zc+0.062);g.add(mj);}
    else winSwitch(g,'w_'+door,x1-0.33,0.672,zc-s*0.055,s,{n:'Cam düğmesi',d:'Bu kapının camını indirip kaldırır. Dokun: cam iner / çıkar.',door});
    part(g,{id:'dt_'+door,grp:'Kapılar ve tavan',n,d:'Kapının iç kaplaması: kolçak, iç açma kolu, cam düğmeleri'+(front?', hoparlör':'')+' ve kapı cebi.',c:'Kapı sacının iç yüzüne klipslerle bağlıdır; arkasında cam mekanizması ve kilit bulunur.',t:(front?'16,5 cm hoparlör, ':'')+'kumaş ara panel, krom iç açma kolu.'+(door==='KAPI_1'?' Sürücü kapısında 4 cam düğmesi ve ayna ayar düğmesi var.':'')});
    doorTrims.push({door,obj:g});});

  // every interior material obeys the cut-away plane (İç mekân view)
  const seen=new Set();root.traverse(o=>{if(o.isMesh&&!seen.has(o.material)){seen.add(o.material);o.material.clippingPlanes=clip;if(o.material.envMapIntensity!==undefined&&o.material!==M.chrome&&o.material!==M.glass)o.material.envMapIntensity=0.35;}});
  doorTrims.forEach(t=>t.obj.traverse(o=>{if(o.isMesh&&!seen.has(o.material)){seen.add(o.material);o.material.clippingPlanes=clip;}}));
  return {root,parts,ctls,doorTrims,drawCluster,drawRadio,RAD,CL,GEAR,HB,ARM,GB,VIS,REAR,PED,LAMPS,M};
}
return {build};
})();
