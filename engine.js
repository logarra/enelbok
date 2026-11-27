/* Opel Astra J 1.6 Ecotec (A16XER) – procedural engine model, built part by part.
   Engine-local axes (right-handed): +x = timing-belt end (car's right), +y = up (y=0 is the crankshaft axis), +z = rear (intake side, towards the bulkhead), −z = front (exhaust side, radiator).
   Units: metres. Dimensions from the research sheet (docs/motor-arastirma.md): bore 79, stroke 81.5, bore pitch 86 mm. */
window.AstraEngine=(function(){
"use strict";
function build(THREE){
  const mm=0.001, BORE=79*mm, STROKE=81.5*mm, R=STROKE/2, ROD=129.8*mm, PITCH=86*mm, CH=26*mm;
  const DECK=R+ROD+CH;                                   // crank axis → block deck ≈ 0.197 m
  const CYL=[1.5,0.5,-0.5,-1.5].map(k=>k*PITCH);         // cylinder 1 is at the timing-belt end
  const MAINS=[2,1,0,-1,-2].map(k=>k*PITCH);             // 5 main bearings
  const THETA=50*Math.PI/180;                           // crank angle shown (cyl 1 & 4), 2 & 3 at +180°
  const root=new THREE.Group();root.name='A16XER';
  const parts=[];

  /* ---------- materials ---------- */
  const M={
    iron:new THREE.MeshStandardMaterial({color:0x44484d,metalness:0.55,roughness:0.66}),
    ironDark:new THREE.MeshStandardMaterial({color:0x3c3f43,metalness:0.5,roughness:0.7}),
    forged:new THREE.MeshStandardMaterial({color:0x7d8288,metalness:0.85,roughness:0.38}),
    polished:new THREE.MeshStandardMaterial({color:0xd9dde1,metalness:1,roughness:0.14}),
    alu:new THREE.MeshStandardMaterial({color:0xb8bdc3,metalness:0.8,roughness:0.36}),
    aluCast:new THREE.MeshStandardMaterial({color:0xa3a8ae,metalness:0.7,roughness:0.55}),
    piston:new THREE.MeshStandardMaterial({color:0xc8ccd1,metalness:0.75,roughness:0.3}),
    ring:new THREE.MeshStandardMaterial({color:0x2a2c2f,metalness:0.8,roughness:0.35}),
    bolt:new THREE.MeshStandardMaterial({color:0x8f949a,metalness:0.9,roughness:0.3}),
    brass:new THREE.MeshStandardMaterial({color:0xb08d57,metalness:0.9,roughness:0.35}),
    hole:new THREE.MeshStandardMaterial({color:0x1b1c1e,metalness:0.3,roughness:0.8}),
  };
  Object.values(M).forEach(m=>{m.side=THREE.FrontSide;});

  /* ---------- helpers ---------- */
  const mesh=(g,m,x,y,z)=>{const o=new THREE.Mesh(g,m);if(x!==undefined)o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;};
  const cylX=(r,len,seg)=>{const g=new THREE.CylinderGeometry(r,r,len,seg||32);g.rotateZ(Math.PI/2);return g;};  // axis along x
  const cylY=(r,len,seg)=>new THREE.CylinderGeometry(r,r,len,seg||32);
  function ringX(ro,ri,t,seg){ // annulus with axis along x
    const s=new THREE.Shape();s.absarc(0,0,ro,0,Math.PI*2,false);const h=new THREE.Path();h.absarc(0,0,ri,0,Math.PI*2,true);s.holes.push(h);
    const g=new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:false,curveSegments:seg||32});g.translate(0,0,-t/2);g.rotateY(Math.PI/2);return g;}
  function rbox(w,h,d,r){r=Math.min(r,w/2-1e-5,h/2-1e-5,d/2-1e-5);const g=new THREE.BoxGeometry(w,h,d,4,4,4),p=g.attributes.position,v=new THREE.Vector3(),c=new THREE.Vector3();
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z)));v.sub(c);if(v.lengthSq()>0)v.setLength(r);v.add(c);p.setXYZ(i,v.x,v.y,v.z);}
    g.computeVertexNormals();return g;}
  function bolt(len,r){const g=new THREE.Group();g.add(mesh(cylY(r,len,12),M.bolt,0,-len/2,0));const hd=mesh(new THREE.CylinderGeometry(r*1.7,r*1.7,r*1.3,6),M.bolt,0,r*0.65,0);g.add(hd);return g;}
  function part(obj,info,ex){obj.userData.epart=info;info.obj=obj;info.base=obj.position.clone();info.ex=new THREE.Vector3(...(ex||[0,0,0]));parts.push(info);root.add(obj);
    obj.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return obj;}

  /* =====================================================================
     GROUP 1 – BLOCK: cylinder block, main caps, crankshaft, pistons, rods, oil jets, oil pan, flywheel
     ===================================================================== */
  const G1='Blok grubu';
  // ---- cylinder block (cast iron): upper cylinder section with open bores + wider lower crankcase
  (function(){
    const g=new THREE.Group();
    const L=0.43,Wu=0.205,y0=0.035;                        // upper part: from y0 up to the deck
    const s=new THREE.Shape();const hx=L/2,hz=Wu/2,rr=0.018;
    s.moveTo(-hx+rr,-hz);s.lineTo(hx-rr,-hz);s.quadraticCurveTo(hx,-hz,hx,-hz+rr);s.lineTo(hx,hz-rr);s.quadraticCurveTo(hx,hz,hx-rr,hz);s.lineTo(-hx+rr,hz);s.quadraticCurveTo(-hx,hz,-hx,hz-rr);s.lineTo(-hx,-hz+rr);s.quadraticCurveTo(-hx,-hz,-hx+rr,-hz);
    CYL.forEach(x=>{const h=new THREE.Path();h.absarc(x,0,BORE/2,0,Math.PI*2,true);s.holes.push(h);});
    // head-bolt holes (10) and coolant passages on the deck
    [2,1,0,-1,-2].forEach(k=>[-1,1].forEach(sz=>{const h=new THREE.Path();h.absarc(k*PITCH,sz*0.081,0.0065,0,Math.PI*2,true);s.holes.push(h);}));
    CYL.forEach(x=>[[-0.032,0.078],[0.032,0.078],[-0.032,-0.078],[0.032,-0.078]].forEach(([dx,dz])=>{const h=new THREE.Path();h.absarc(x+dx,dz,0.0045,0,Math.PI*2,true);s.holes.push(h);}));
    const up=new THREE.ExtrudeGeometry(s,{depth:DECK-y0,bevelEnabled:true,bevelThickness:0.002,bevelSize:0.002,bevelSegments:2,curveSegments:40});
    up.rotateX(-Math.PI/2);up.translate(0,y0,0);
    g.add(mesh(up,M.iron));
    // cylinder liners visible inside the bores (slightly darker honed surface)
    CYL.forEach(x=>{const lg=new THREE.CylinderGeometry(BORE/2+0.0001,BORE/2+0.0001,DECK-y0-0.004,40,1,true);const l=mesh(lg,M.ironDark,x,(DECK+y0)/2,0);l.material=M.ironDark;l.material.side=THREE.DoubleSide;g.add(l);});
    // lower crankcase (skirt), wider, closed underneath by the oil pan
    const lw=0.236,low=mesh(rbox(L,0.115,lw,0.012),M.iron,0,-0.0225,0);g.add(low);
    // cast ribs on front and rear faces, between cylinders
    [-2,-1,0,1,2].forEach(k=>[-1,1].forEach(sz=>{const r=mesh(rbox(0.012,0.2,0.012,0.004),M.iron,k*PITCH,0.07,sz*(Wu/2+0.004));g.add(r);}));
    // water-jacket bulges along the cylinders (front & rear)
    [-1,1].forEach(sz=>{const b=mesh(rbox(L-0.03,0.09,0.01,0.004),M.iron,0,DECK-0.06,sz*(Wu/2+0.003));g.add(b);});
    // core (freeze) plugs on the front face
    [-1,0,1].forEach(k=>{const c=mesh(cylY(0.013,0.004,24),M.brass,k*PITCH*1.4,0.12,-(Wu/2+0.009));c.rotation.x=Math.PI/2;g.add(c);});
    // engine-mount / accessory bosses
    g.add(mesh(rbox(0.05,0.07,0.05,0.01),M.iron,L/2-0.01,0.05,-0.10));
    g.add(mesh(rbox(0.05,0.06,0.05,0.01),M.iron,-L/2+0.02,0.0,0.115));
    // bell-housing flange at the gearbox end
    const fl=mesh(rbox(0.012,0.3,0.27,0.03),M.iron,-L/2-0.006,0.05,0);g.add(fl);
    // oil-cooler / filter pad on the rear face (the cooler itself comes with the lubrication group)
    g.add(mesh(rbox(0.09,0.06,0.012,0.008),M.iron,0.06,0.05,0.124));
    part(g,{id:'blok',grp:G1,n:'Silindir bloğu',
      d:'Motorun ana gövdesi. 4 silindir burada açılmıştır; pistonlar bu silindirlerin içinde gidip gelir. Bloğun içinden soğutma suyu (su ceketi) ve yağ kanalları geçer.',
      c:'Üstüne silindir kapağı (conta ile), altına yağ karteri, sol ucuna şanzıman çanı, sağ ucuna triger kapağı ve yağ pompası bağlanır. Krank mili alttaki 5 ana yatakta döner.',
      t:'Malzeme: dökme demir (3. nesil Family 1’de hafifletilmiş). Silindir çapı 79,0 mm, silindir aralığı 86 mm. Önde (egzoz tarafı) su ceketi tapaları, arkada yağ soğutucusu bağlantı yüzeyi.'},[0,0,0]);
  })();

  // ---- main bearing caps (5)
  (function(){
    const g=new THREE.Group();
    MAINS.forEach(x=>{const c=mesh(rbox(0.026,0.034,0.13,0.006),M.ironDark,x,-0.03,0);g.add(c);
      [-1,1].forEach(sz=>{const b=bolt(0.05,0.0045);b.position.set(x,-0.049,sz*0.048);b.rotation.x=Math.PI;g.add(b);});});
    part(g,{id:'kep',grp:G1,n:'Ana yatak kepleri (5 adet)',
      d:'Krank milini bloğa sabitleyen dökme demir kapaklar. İçlerindeki yatak zarfları kranka yağ filmi üzerinde dönme yüzeyi sağlar.',
      c:'Her biri 2 cıvatayla bloğun alt yüzeyine bağlanır; aralarında krank milinin ana muyluları döner.',
      t:'5 ana yatak: her silindirin iki yanında birer yatak. Ortadaki yatakta krankın eksenel boşluğunu ayarlayan baskı pulları bulunur.'},[0,-0.2,0]);
  })();

  // ---- crankshaft (forged steel): 5 main journals, 4 rod journals at 180°, 8 counterweight webs
  (function(){
    const g=new THREE.Group();
    MAINS.forEach(x=>g.add(mesh(cylX(0.0275,0.021),M.polished,x,0,0)));
    const webShape=(()=>{const rp=0.026,rc=0.066,a0=112*Math.PI/180,s=new THREE.Shape();
      s.moveTo(R,-rp);s.absarc(R,0,rp,-Math.PI/2,Math.PI/2,false);s.lineTo(Math.cos(a0)*rc,Math.sin(a0)*rc);s.absarc(0,0,rc,a0,2*Math.PI-a0,false);s.lineTo(R,-rp);return s;})();
    const webT=0.0155;
    const webGeo=new THREE.ExtrudeGeometry(webShape,{depth:webT,bevelEnabled:true,bevelThickness:0.0015,bevelSize:0.0015,bevelSegments:2,curveSegments:24});
    webGeo.translate(0,0,-webT/2);webGeo.rotateY(Math.PI/2);
    CYL.forEach((x,i)=>{
      const th=(i===0||i===3)?THETA:THETA+Math.PI;
      const py=R*Math.cos(th),pz=R*Math.sin(th);
      g.add(mesh(cylX(0.0215,0.022),M.polished,x,py,pz));                       // rod journal
      [-1,1].forEach(sx=>{const w=mesh(webGeo,M.forged,x+sx*(0.011+webT/2+0.0015),0,0);w.rotation.x=th+Math.PI/2;g.add(w);});
    });
    // front snout (timing end) with keyway and rear flywheel flange
    g.add(mesh(cylX(0.019,0.055),M.polished,2*PITCH+0.038,0,0));
    g.add(mesh(new THREE.BoxGeometry(0.03,0.004,0.005),M.ironDark,2*PITCH+0.045,0.019,0));
    g.add(mesh(cylX(0.045,0.012),M.forged,-2*PITCH-0.017,0,0));
    // oil drillings (dark dots on journals)
    CYL.forEach((x,i)=>{const th=(i===0||i===3)?THETA:THETA+Math.PI;const d=mesh(new THREE.SphereGeometry(0.0025,8,6),M.hole,x,R*Math.cos(th)+0.0215*Math.cos(th),R*Math.sin(th)+0.0215*Math.sin(th));g.add(d);});
    part(g,{id:'krank',grp:G1,n:'Krank mili',
      d:'Pistonların aşağı-yukarı hareketini dönme hareketine çevirir. Motorun ürettiği bütün güç krank milinden çıkar: bir ucu volan üzerinden şanzımana, diğer ucu kayışlarla triger ve yardımcı aksamlara gider.',
      c:'5 ana muyluyla blok yataklarında döner. 4 biyel muylusuna biyeller bağlanır. Sol ucunda volan, sağ ucunda triger dişlisi, yağ pompası ve V kayışı kasnağı vardır.',
      t:'Strok 81,5 mm (biyel muylusu merkezden 40,75 mm kaçık). 1. ve 4. silindir muyluları aynı yönde, 2. ve 3. muylular 180° karşı yönde: ateşleme sırası 1-3-4-2. Karşı ağırlıklar dönen kütleyi dengeler. İçindeki yağ kanalları ana yataklardan biyel yataklarına yağ taşır.'},[0,-0.32,0]);
  })();

  // ---- pistons (4) and connecting rods (4), placed with the real slider-crank geometry
  CYL.forEach((x,i)=>{
    const th=(i===0||i===3)?THETA:THETA+Math.PI;
    const by=R*Math.cos(th),bz=R*Math.sin(th);
    const pinY=by+Math.sqrt(ROD*ROD-bz*bz);
    // piston
    const p=new THREE.Group();p.position.set(x,pinY,0);
    const pr=BORE/2-0.0003;
    p.add(mesh(new THREE.CylinderGeometry(pr,pr*0.995,0.048,40),M.piston,0,0.001,0));
    p.add(mesh(new THREE.CylinderGeometry(pr*0.985,pr,0.004,40),M.piston,0,CH-0.002,0));
    [0.006,0.0105,0.015].forEach(d=>p.add(mesh(new THREE.CylinderGeometry(pr+0.0002,pr+0.0002,0.0016,40),M.ring,0,CH-d,0)));
    // valve reliefs on the crown
    [[-0.016,0.017],[0.016,0.017],[-0.016,-0.017],[0.016,-0.017]].forEach(([dx,dz])=>{const v=mesh(cylY(0.0125,0.0006,24),M.aluCast,dx,CH+0.0001,dz);p.add(v);});
    p.add(mesh(cylX(0.009,0.062,20),M.polished,0,0,0)); // gudgeon pin
    const pn=['1. silindir','2. silindir','3. silindir','4. silindir'][i];
    part(p,{id:'piston'+(i+1),grp:G1,n:'Piston – '+pn,
      d:'Yanma odasındaki patlamanın basıncını karşılayıp biyel aracılığıyla krank miline iletir. Emme zamanında aşağı inerek silindire hava-yakıt karışımı çeker, sıkıştırma zamanında yukarı çıkarak onu sıkıştırır.',
      c:'Piston pimiyle biyelin üst ucuna bağlıdır. Üstünde yanma odası (silindir kapağı), altında yağ püskürtme memesi bulunur.',
      t:'Çap 79 mm, alüminyum alaşım döküm. 3 segman: 2 kompresyon segmanı (sızdırmazlık) ve 1 yağ segmanı (silindir duvarındaki fazla yağı sıyırır). Tepesinde supaplar için cepler var. Sıkıştırma oranı 10,8:1.'},[0,0.36,0]);
    // connecting rod
    const r=new THREE.Group();r.position.set(x,by,bz);
    const dy=pinY-by,dz=-bz,Lr=Math.hypot(dy,dz);
    r.rotation.x=Math.atan2(dz,dy);
    const big=mesh(ringX(0.033,0.0215,0.019),M.forged);r.add(big);
    const sm=mesh(ringX(0.0145,0.009,0.019),M.forged,0,Lr,0);r.add(sm);
    const beamG=new THREE.CylinderGeometry(0.0085,0.012,Lr-0.05,4,1);beamG.rotateY(Math.PI/4);
    const beam=mesh(beamG,M.forged,0,Lr/2,0);beam.scale.set(0.75,1,1.25);r.add(beam);
    [-1,1].forEach(sz=>{const b=bolt(0.04,0.0035);b.position.set(0,-0.012,sz*0.026);b.rotation.x=Math.PI;r.add(b);});
    part(r,{id:'biyel'+(i+1),grp:G1,n:'Biyel – '+pn,
      d:'Pistonu krank miline bağlayan kol. Pistonun doğrusal hareketini krankın dairesel hareketine çevirir.',
      c:'Üst (küçük) ucu piston pimiyle pistona, alt (büyük) ucu iki cıvatalı kepiyle krank milinin biyel muylusuna bağlanır.',
      t:'Dövme çelik, I kesitli gövde. Merkezden merkeze ≈ 129,8 mm. Büyük uçta yatak zarfları; yağ, krank içindeki kanaldan buraya gelir.'},[0,0.22,0]);
  });

  // ---- piston cooling oil jets (Gen III feature)
  (function(){
    const g=new THREE.Group();
    CYL.forEach(x=>{const t=mesh(cylY(0.0028,0.035,10),M.brass,x+0.028,0.05,-0.06);t.rotation.z=0.35;g.add(t);g.add(mesh(rbox(0.012,0.008,0.012,0.002),M.ironDark,x+0.034,0.033,-0.06));});
    part(g,{id:'yagmeme',grp:G1,n:'Piston soğutma yağ memeleri',
      d:'Her pistonun altına yağ püskürterek pistonu soğutur. Bu sayede piston daha az ısınır, vuruntu riski azalır.',
      c:'Bloğun ana yağ kanalına bağlıdır; yağ basıncı belli değerin üstüne çıkınca açılır.',
      t:'3. nesil Family 1 motorlarla gelen özellik. 4 adet, her silindirin altında.'},[0,-0.1,-0.12]);
  })();

  // ---- oil pan (cast aluminium)
  (function(){
    const g=new THREE.Group();
    const s=new THREE.Shape();
    s.moveTo(-0.118,0);s.lineTo(0.118,0);s.lineTo(0.118,-0.022);s.quadraticCurveTo(0.105,-0.05,0.09,-0.06);s.lineTo(0.075,-0.112);s.quadraticCurveTo(0.07,-0.122,0.055,-0.122);
    s.lineTo(-0.06,-0.122);s.quadraticCurveTo(-0.075,-0.122,-0.078,-0.11);s.lineTo(-0.09,-0.05);s.quadraticCurveTo(-0.11,-0.035,-0.118,-0.022);s.lineTo(-0.118,0);
    const pg=new THREE.ExtrudeGeometry(s,{depth:0.40,bevelEnabled:true,bevelThickness:0.006,bevelSize:0.006,bevelSegments:3,curveSegments:12});
    pg.translate(0,0,-0.2);pg.rotateY(Math.PI/2);
    g.add(mesh(pg,M.aluCast,0,-0.081,0));
    g.add(mesh(rbox(0.43,0.008,0.245,0.004),M.aluCast,0,-0.083,0));       // flange
    for(let k=-5;k<=5;k++)[-1,1].forEach(sz=>g.add(mesh(rbox(0.004,0.05,0.01,0.002),M.aluCast,k*0.034,-0.13,sz*0.08)));
    const dp=mesh(new THREE.CylinderGeometry(0.009,0.009,0.01,6),M.bolt,-0.05,-0.208,-0.02);g.add(dp);
    for(let k=-6;k<=6;k++)[-1,1].forEach(sz=>{const b=mesh(new THREE.CylinderGeometry(0.004,0.004,0.006,6),M.bolt,k*0.033,-0.089,sz*0.115);g.add(b);});
    part(g,{id:'karter',grp:G1,n:'Yağ karteri',
      d:'Motor yağının toplandığı hazne. Yağ pompası yağı buradan emer, yağlanan parçalardan süzülen yağ buraya geri döner.',
      c:'Bloğun alt yüzeyine cıvatalarla bağlanır. Altında yağ boşaltma tapası, içinde yağ pompası emme süzgeci bulunur.',
      t:'Alüminyum döküm, kanatçıklı (soğutmaya yardım eder ve gövdeyi sağlamlaştırır). Motor yağı kapasitesi filtreyle ≈ 4,5 L (5W-30, dexos2).'},[0,-0.46,0]);
  })();

  // ---- flywheel (single-mass) with starter ring gear, on the gearbox end
  (function(){
    const g=new THREE.Group();const x=-2*PITCH-0.034;
    g.add(mesh(cylX(0.132,0.016,64),M.ironDark,x,0,0));
    g.add(mesh(cylX(0.118,0.018,64),M.forged,x-0.002,0,0));
    const N=120,ro=0.142,ri=0.134,s=new THREE.Shape();
    for(let k=0;k<N;k++){const a=k/N*Math.PI*2,da=Math.PI/N;const pts=[[ri,a-da*0.9],[ro,a-da*0.45],[ro,a+da*0.45],[ri,a+da*0.9]];pts.forEach(([r,an],j)=>{const px=Math.cos(an)*r,py=Math.sin(an)*r;if(k===0&&j===0)s.moveTo(px,py);else s.lineTo(px,py);});}
    const hp=new THREE.Path();hp.absarc(0,0,0.128,0,Math.PI*2,true);s.holes.push(hp);
    const rg=new THREE.ExtrudeGeometry(s,{depth:0.013,bevelEnabled:false});rg.translate(0,0,-0.0065);rg.rotateY(Math.PI/2);
    g.add(mesh(rg,M.forged,x,0,0));
    for(let k=0;k<6;k++){const a=k/6*Math.PI*2;const b=mesh(cylX(0.0055,0.02,8),M.bolt,x-0.006,Math.cos(a)*0.032,Math.sin(a)*0.032);g.add(b);}
    for(let k=0;k<6;k++){const a=(k+0.5)/6*Math.PI*2;g.add(mesh(cylX(0.006,0.0175,12),M.hole,x,Math.cos(a)*0.095,Math.sin(a)*0.095));}
    part(g,{id:'volan',grp:G1,n:'Volan',
      d:'Krank miline bağlı ağır disk. Kesik kesik gelen yanma darbelerini depoladığı dönme enerjisiyle yumuşatır. Debriyaj bu diskin yüzeyine basar; çevresindeki dişliyle marş motoru motoru çevirir.',
      c:'Krankın şanzıman tarafındaki flanşına 6 cıvatayla bağlanır. Üstüne debriyaj baskısı ve diski gelir; marş motorunun dişlisi çevresindeki çember dişliye geçer.',
      t:'Tek kütleli volan (çift kütleli değil). Çevresinde marş çember dişlisi. Debriyaj ve şanzıman 11. grupta (güç aktarma) eklenecek.'},[-0.16,-0.30,0.12]);
  })();

  /* ---------- extra materials & helpers for groups 2–11 ---------- */
  Object.assign(M,{
    plastic:new THREE.MeshStandardMaterial({color:0x1c1e21,metalness:0.1,roughness:0.62}),
    plastic2:new THREE.MeshStandardMaterial({color:0x2a2d31,metalness:0.1,roughness:0.55}),
    rubber:new THREE.MeshStandardMaterial({color:0x151617,metalness:0,roughness:0.9}),
    belt:new THREE.MeshStandardMaterial({color:0x18191b,metalness:0,roughness:0.85,side:THREE.DoubleSide}),
    shield:new THREE.MeshStandardMaterial({color:0xc9cdd1,metalness:0.9,roughness:0.28}),
    exhaust:new THREE.MeshStandardMaterial({color:0x6e6258,metalness:0.7,roughness:0.6}),
    yellow:new THREE.MeshStandardMaterial({color:0xf2c230,roughness:0.45}),
    spring:new THREE.MeshStandardMaterial({color:0x5d6670,metalness:0.8,roughness:0.35}),
    copper:new THREE.MeshStandardMaterial({color:0xb5703f,metalness:0.9,roughness:0.35}),
    ceramic:new THREE.MeshStandardMaterial({color:0xece8e0,roughness:0.35}),
    blue:new THREE.MeshStandardMaterial({color:0x2a6bd1,roughness:0.5}),
    green:new THREE.MeshStandardMaterial({color:0x2f6b3c,roughness:0.6}),
    red:new THREE.MeshStandardMaterial({color:0xb3121a,roughness:0.45}),
  });
  const tube=(pts,r,m,seg)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),seg||48,r,12,false),m);
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  function helix(r,len,turns,wire,m){const pts=[];const N=turns*16;for(let i=0;i<=N;i++){const a=i/N*turns*Math.PI*2;pts.push(V(Math.cos(a)*r,i/N*len,Math.sin(a)*r));}return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),N*2,wire,6,false),m);}
  function hull2(circles,off){ // convex hull of circles in the (z,y) plane → [[z,y],…] counter-clockwise
    const P=[];circles.forEach(c=>{for(let k=0;k<48;k++){const a=k/48*Math.PI*2;P.push([c.z+Math.cos(a)*(c.r+(off||0)),c.y+Math.sin(a)*(c.r+(off||0))]);}});
    P.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lo=[],up=[];for(const p of P){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
    for(let i=P.length-1;i>=0;i--){const p=P[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
    up.pop();lo.pop();return lo.concat(up);}
  function band(h,x,w,m){ // closed belt band following hull h at plane x, width w
    const pos=[],idx=[];h.forEach(([z,y])=>{pos.push(x-w/2,y,z,x+w/2,y,z);});
    const n=h.length;for(let i=0;i<n;i++){const a=i*2,b=((i+1)%n)*2;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return mesh(g,m);}
  function hullShape(h){const s=new THREE.Shape();h.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));s.closePath();return s;}
  function extrudeX(shape,x0,len,bev){const g=new THREE.ExtrudeGeometry(shape,{depth:len,bevelEnabled:!!bev,bevelThickness:bev||0,bevelSize:bev||0,bevelSegments:2,curveSegments:16});
    // shape is in (z,y): map shape-x → z, shape-y → y, extrude-z → x
    const p=g.attributes.position;for(let i=0;i<p.count;i++){const sx=p.getX(i),sy=p.getY(i),sz=p.getZ(i);p.setXYZ(i,x0+sz,sy,sx);}g.computeVertexNormals();
    // the axis swap mirrors the geometry: flip triangle winding back
    const ix=g.index?g.index.array:null;if(ix){for(let t=0;t<ix.length;t+=3){const a=ix[t+1];ix[t+1]=ix[t+2];ix[t+2]=a;}}else{const a=g.attributes.position.array;for(const k of Object.keys(g.attributes)){const at=g.attributes[k],is=at.itemSize,arr=at.array;for(let t=0;t<at.count;t+=3)for(let c=0;c<is;c++){const tmp=arr[(t+1)*is+c];arr[(t+1)*is+c]=arr[(t+2)*is+c];arr[(t+2)*is+c]=tmp;}}}
    g.computeVertexNormals();return g;}
  function pulley(r,w,x,y,z,m,grooves){const g=new THREE.Group();g.position.set(x,y,z);g.add(mesh(cylX(r,w,48),m||M.forged));if(grooves)for(let k=0;k<grooves;k++)g.add(mesh(cylX(r+0.0008,0.0012,48),M.ironDark,-w/2+(k+0.5)*w/grooves,0,0));g.add(mesh(cylX(r*0.3,w+0.004,24),M.bolt));return g;}
  function label(text,w,h,opt){opt=opt||{};const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*h/w);const x=c.getContext('2d');
    x.fillStyle=opt.bg||'#1c1e21';x.fillRect(0,0,c.width,c.height);x.fillStyle=opt.fg||'#c9cdd2';x.font='bold '+Math.round(c.height*0.5)+'px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,c.width/2,c.height/2);
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,roughness:0.6}));}

  const HT=0.125, HY=DECK, CAMY=HY+0.098, CAMZ=0.058, XT=0.215; // head height, deck, camshaft height & offset
  const XTB=0.248, XAC=0.318;                                       // timing-belt plane, accessory-belt plane

  /* =====================================================================
     GROUP 2 – CYLINDER HEAD: head gasket, head, camshafts, valves, spark plugs, coil module, cam cover, oil filler cap
     ===================================================================== */
  const G2='Silindir kapağı';
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.43,0.0025,0.2,0.004),M.copper,0,HY+0.0012,0));
    CYL.forEach(x=>{const r=mesh(ringX(BORE/2+0.004,BORE/2,0.0028,40),M.ironDark,x,HY+0.0014,0);r.rotation.z=Math.PI/2;g.add(r);});
    part(g,{id:'conta',grp:G2,n:'Silindir kapak contası',d:'Blok ile silindir kapağı arasındaki çok katmanlı çelik conta. Yanma basıncını, soğutma suyunu ve yağı birbirinden ayırır.',c:'Bloğun üst yüzeyi ile silindir kapağının alt yüzeyi arasında sıkışır; 10 kapak cıvatası ile bastırılır.',t:'Çok katmanlı çelik (MLS). Silindir çevresinde yanma halkaları var. Yanması hâlinde suya yağ/egzoz karışır, motor ısınır.'},[0,0.22,0]);})();
  (function(){
    const g=new THREE.Group();
    const s=new THREE.Shape();const hx=0.215,hz=0.108,rr=0.012;
    s.moveTo(-hx+rr,-hz);s.lineTo(hx-rr,-hz);s.quadraticCurveTo(hx,-hz,hx,-hz+rr);s.lineTo(hx,hz-rr);s.quadraticCurveTo(hx,hz,hx-rr,hz);s.lineTo(-hx+rr,hz);s.quadraticCurveTo(-hx,hz,-hx,hz-rr);s.lineTo(-hx,-hz+rr);s.quadraticCurveTo(-hx,-hz,-hx+rr,-hz);
    const hg=new THREE.ExtrudeGeometry(s,{depth:HT-0.02,bevelEnabled:true,bevelThickness:0.002,bevelSize:0.002,bevelSegments:2});hg.rotateX(-Math.PI/2);hg.translate(0,HY+0.003,0);
    g.add(mesh(hg,M.alu));
    // cam bearing towers and caps on top (visible when the cam cover is off)
    [2,1,0,-1,-2].forEach(k=>[-1,1].forEach(sz=>{g.add(mesh(rbox(0.022,0.026,0.04,0.004),M.alu,k*PITCH-0.002,CAMY-0.004,sz*CAMZ));}));
    // spark-plug wells
    CYL.forEach(x=>g.add(mesh(cylY(0.013,0.03,20),M.hole,x,HY+HT-0.03,0)));
    // intake ports (rear face) and exhaust ports (front face)
    CYL.forEach(x=>{[-0.016,0.016].forEach(dx=>{const ip=mesh(cylY(0.013,0.004,20),M.hole,x+dx,HY+0.06,0.1105);ip.rotation.x=Math.PI/2;g.add(ip);});
      const ep=mesh(cylY(0.016,0.004,20),M.hole,x,HY+0.055,-0.1105);ep.rotation.x=Math.PI/2;g.add(ep);});
    // casting ribs on the faces
    for(let k=-4;k<=4;k++)[-1,1].forEach(sz=>g.add(mesh(rbox(0.006,0.06,0.006,0.002),M.alu,k*0.047,HY+0.035,sz*0.111)));
    part(g,{id:'kapak',grp:G2,n:'Silindir kapağı',d:'Yanma odalarının tavanını oluşturur. İçinde emme ve egzoz kanalları, supaplar, eksantrik milleri ve buji yuvaları bulunur. Motorun “nefes alma” işi burada yapılır.',c:'10 cıvatayla bloğa bağlanır (arada conta). Arka yüzüne emme manifoldu, ön yüzüne egzoz manifoldu, sağ ucuna eksantrik dişlileri, sol ucuna termostat gövdesi bağlıdır. Üstünü külbütör kapağı örter.',t:'Alüminyum döküm, çatı (pent-roof) tipi yanma odası, silindir başına 4 supap. Emme kanalları arkada, egzoz kanalları önde.'},[0,0.48,0]);
  })();
  // camshafts with lobes (firing order 1-3-4-2)
  function camshaft(z,isIntake){
    const g=new THREE.Group();g.add(mesh(cylX(0.012,0.46,20),M.forged,0.005,CAMY,z));
    const base=0.0165,lift=0.0085,ls=new THREE.Shape();for(let k=0;k<=64;k++){const a=k/64*Math.PI*2;const r=base+lift*Math.pow(Math.max(0,Math.cos(a)),2.2);k?ls.lineTo(Math.cos(a)*r,Math.sin(a)*r):ls.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
    const lg=new THREE.ExtrudeGeometry(ls,{depth:0.013,bevelEnabled:true,bevelThickness:0.0008,bevelSize:0.0008,bevelSegments:1});lg.translate(0,0,-0.0065);lg.rotateY(Math.PI/2);
    const fire={0:0,2:1,3:2,1:3};
    CYL.forEach((x,i)=>{const ang=fire[i]*Math.PI/2+(isIntake?0.6:-0.6);[-0.016,0.016].forEach(dx=>{const l=mesh(lg,M.polished,x+dx,CAMY,z);l.rotation.x=ang;g.add(l);});});
    [2,1,0,-1,-2].forEach(k=>g.add(mesh(cylX(0.0135,0.018,24),M.polished,k*PITCH-0.002,CAMY,z)));
    return g;}
  part(camshaft(CAMZ,true),{id:'eks_emme',grp:G2,n:'Emme eksantrik mili',d:'Üzerindeki kamlar döndükçe emme supaplarını sırayla açar; silindire hava-yakıt karışımı girer.',c:'Silindir kapağındaki 5 yatakta döner. Sağ ucunda faz ayarlayıcı ve triger dişlisi; kamları kovan iticiler üzerinden supapları iter.',t:'Silindir başına 2 kam (toplam 8). Krank milinin yarı devriyle döner. DCVCP faz ayarlayıcısı sayesinde zamanlaması devre ve yüke göre ileri-geri kaydırılır.'},[0,0.78,0.12]);
  part(camshaft(-CAMZ,false),{id:'eks_egz',grp:G2,n:'Egzoz eksantrik mili',d:'Egzoz supaplarını açarak yanmış gazların silindirden çıkmasını sağlar.',c:'Silindir kapağında, emme eksantriğinin önünde. Sağ ucunda kendi faz ayarlayıcısı ve triger dişlisi bulunur.',t:'8 kam. A16XER’de egzoz eksantriği de değişken zamanlamalı (DCVCP: Double Continuous Variable Cam Phasing).'},[0,0.78,-0.12]);
  // valves, springs and bucket tappets (16)
  (function(){
    const g=new THREE.Group();
    const valve=(r,len)=>{const v=new THREE.Group();v.add(mesh(cylY(0.0028,len,10),M.polished,0,len/2,0));const h=mesh(new THREE.CylinderGeometry(r*0.55,r,0.004,24),M.polished,0,0.002,0);v.add(h);
      const sp=helix(0.0105,0.034,6,0.0016,M.spring);sp.position.y=len-0.046;v.add(sp);v.add(mesh(cylY(0.0145,0.016,20),M.polished,0,len-0.004,0));return v;};
    CYL.forEach(x=>{[-0.016,0.016].forEach(dx=>{
      const iv=valve(0.0155,0.098);iv.position.set(x+dx,HY+0.006,0.017);iv.rotation.x=-0.36;g.add(iv);
      const ev=valve(0.0135,0.098);ev.position.set(x+dx,HY+0.006,-0.017);ev.rotation.x=0.36;g.add(ev);});});
    part(g,{id:'supap',grp:G2,n:'Supaplar, yaylar ve iticiler (16)',d:'Supaplar yanma odasının kapılarıdır: emme supapları havayı içeri alır, egzoz supapları yanmış gazı dışarı bırakır. Yaylar supabı kapatır, kovan iticiler kam darbesini supaba iletir.',c:'Eksantrik kamları kovan iticilere basar → itici supabı aşağı iter → supap açılır. Yay supabı tekrar oturtur.',t:'Silindir başına 2 emme (Ø 31 mm) + 2 egzoz (Ø 27 mm) supabı. Kovan tipi mekanik itici: supap boşluğu hidrolik değil, ayar pulu kalınlığıyla ayarlanır.'},[0,0.62,0]);
  })();
  (function(){const g=new THREE.Group();
    CYL.forEach(x=>{const p=new THREE.Group();p.position.set(x,HY+0.008,0);p.add(mesh(cylY(0.0062,0.026,14),M.bolt,0,0.013,0));p.add(mesh(new THREE.CylinderGeometry(0.008,0.008,0.012,6),M.bolt,0,0.032,0));p.add(mesh(cylY(0.0055,0.055,16),M.ceramic,0,0.065,0));p.add(mesh(cylY(0.003,0.008,8),M.bolt,0,0.096,0));g.add(p);});
    part(g,{id:'buji',grp:G2,n:'Bujiler (4)',d:'Sıkıştırılan hava-yakıt karışımını kıvılcımla ateşler. Her silindirde bir buji vardır.',c:'Silindir kapağının ortasındaki yuvalara vidalanır; üst uçlarına bobin modülünün başlıkları geçer.',t:'Uzun ömürlü iridyum/platin uçlu, tırnak aralığı ≈ 0,8–0,9 mm. Ateşleme sırası 1-3-4-2.'},[0,0.88,0]);})();
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.36,0.03,0.05,0.008),M.plastic,0,HY+HT+0.03,0));
    CYL.forEach(x=>g.add(mesh(cylY(0.011,0.05,16),M.rubber,x,HY+HT-0.002,0)));
    g.add(mesh(rbox(0.04,0.03,0.03,0.005),M.plastic2,-0.2,HY+HT+0.032,0.0));
    part(g,{id:'bobin',grp:G2,n:'Ateşleme bobini modülü',d:'Aküden gelen 12 voltu buji için on binlerce volta yükseltir. ECU hangi silindirin ateşleneceğini söyler, modül o bujiye kıvılcım gönderir.',c:'Külbütör kapağının ortasında, 4 lastik başlıkla doğrudan bujilerin üstüne oturur. Soketi motor kablo demetine bağlıdır.',t:'Tek parça (kaset tipi) bobin modülü. Bu motor ailesinde bilinen arıza noktası: tekleme ve motor arıza lambası.'},[0,1.08,0]);})();
  (function(){
    const g=new THREE.Group();const y0=HY+HT;
    g.add(mesh(rbox(0.44,0.05,0.215,0.018),M.plastic,0,y0+0.025,0));
    // ribbed rear half (4 humps over the intake cam) and flat ECOTEC panel at the front
    CYL.forEach(x=>g.add(mesh(rbox(0.07,0.018,0.07,0.012),M.plastic,x,y0+0.053,0.045)));
    const lab=label('ECOTEC',0.2,0.05,{bg:'#23262a',fg:'#d6dade'});lab.rotation.x=-Math.PI/2;lab.position.set(0.0,y0+0.0505,-0.05);g.add(lab);
    g.add(mesh(rbox(0.3,0.002,0.07,0.003),M.plastic2,0,y0+0.0502,-0.05));
    for(let k=-6;k<=6;k++)g.add(mesh(cylY(0.0035,0.004,6),M.bolt,k*0.034,y0+0.002,(k%2?1:-1)*0.105));
    part(g,{id:'kulbutor',grp:G2,n:'Külbütör (eksantrik) kapağı',d:'Silindir kapağının üstünü örterek eksantrikleri ve supap mekanizmasını korur, yağın dışarı sızmasını önler.',c:'Silindir kapağının üstüne contayla cıvatalanır. Üzerinde yağ doldurma kapağı ve karter havalandırma bağlantısı var; ortasından bobin modülü geçer.',t:'Plastik, “ECOTEC” yazılı. Contası zamanla sertleşip sızdırabilir (egzoz manifoldu üzerine yağ damlar).'},[0,0.98,0]);
  })();
  (function(){const g=new THREE.Group();g.add(mesh(cylY(0.024,0.018,32),M.plastic2,-0.155,HY+HT+0.059,-0.055));
    const sym=label('5W-30',0.03,0.012,{bg:'#2a2d31',fg:'#e8e8e8'});sym.rotation.x=-Math.PI/2;sym.position.set(-0.155,HY+HT+0.0685,-0.055);g.add(sym);
    part(g,{id:'yagkapak',grp:'Yağlama',n:'Yağ doldurma kapağı',d:'Motor yağı buradan eklenir.',c:'Külbütör kapağının sol ön ucunda (şanzıman tarafı).',t:'Motor yağı: 5W-30, dexos2 onaylı. Yağ filtresiyle birlikte ≈ 4,5 L.'},[0,1.25,-0.1]);})();

  /* =====================================================================
     GROUP 3 – TIMING BELT DRIVE (timing end, x+)
     ===================================================================== */
  const G3='Triger sistemi';
  const TC=[{z:0,y:0,r:0.028},{z:CAMZ+0.012,y:CAMY,r:0.056},{z:-CAMZ-0.012,y:CAMY,r:0.056},{z:0.062,y:0.13,r:0.03},{z:-0.07,y:0.16,r:0.03}];
  (function(){const g=new THREE.Group();
    [TC[1],TC[2]].forEach((c,i)=>{const p=pulley(c.r,0.024,XTB,c.y,c.z,M.forged,0);p.add(mesh(cylX(c.r*0.75,0.03,40),M.alu));for(let k=0;k<6;k++){const a=k/6*Math.PI*2;p.add(mesh(cylX(0.009,0.031,12),M.hole,0,Math.cos(a)*c.r*0.5,Math.sin(a)*c.r*0.5));}g.add(p);});
    part(g,{id:'faz',grp:G3,n:'Eksantrik dişlileri + faz ayarlayıcılar (DCVCP)',d:'Triger kayışının çevirdiği iki dişli. İçlerindeki faz ayarlayıcılar, motor yağı basıncıyla eksantrik milini dişliye göre birkaç derece ileri veya geri döndürür; böylece supap zamanlaması devre göre değişir.',c:'Emme ve egzoz eksantrik millerinin sağ ucuna cıvatalı. Yağ, kapağın sağ ucundaki iki VVT selenoid valfinden gelir.',t:'Double Continuous Variable Cam Phasing. Düşük devirde tork, yüksek devirde güç ve daha düşük emisyon sağlar. Soğuk çalıştırmada kısa tıkırtı, aşınmış faz ayarlayıcının belirtisidir.'},[0.32,0.25,0]);})();
  (function(){const g=new THREE.Group();g.add(pulley(TC[0].r,0.024,XTB,0,0,M.forged,0));
    part(g,{id:'krankdisli',grp:G3,n:'Krank triger dişlisi',d:'Krank milinin ucundaki küçük dişli; triger kayışını döndürür.',c:'Krank milinin sağ ucunda, yağ pompasının önünde.',t:'Eksantrik dişlilerinin yarı çapında: krank 2 tur dönünce eksantrikler 1 tur döner.'},[0.3,-0.1,0]);})();
  (function(){const g=new THREE.Group();g.add(pulley(TC[3].r,0.026,XTB,TC[3].y,TC[3].z,M.polished,0));g.add(mesh(rbox(0.012,0.06,0.03,0.006),M.alu,XTB-0.02,TC[3].y-0.02,TC[3].z+0.02));g.add(pulley(TC[4].r,0.026,XTB,TC[4].y,TC[4].z,M.polished,0));
    part(g,{id:'gergi',grp:G3,n:'Triger gergisi ve avare makarası',d:'Gergi kayışı sürekli doğru gerginlikte tutar; avare makara kayışı yönlendirir. Gevşek kayış diş atlayabilir.',c:'Blok ve kapak üzerine cıvatalı, kayışın arka yüzüne basar.',t:'Otomatik (yaylı) gergi. Kayışla birlikte değiştirilir.'},[0.38,0.1,0]);})();
  (function(){const g=new THREE.Group();g.add(band(hull2(TC),XTB,0.026,M.belt));
    part(g,{id:'triger',grp:G3,n:'Triger kayışı',d:'Krank mili ile iki eksantrik milini birbirine bağlar ve aynı ritimde döndürür. Pistonlar ile supapların çarpışmadan çalışmasını sağlar.',c:'Krank dişlisi → egzoz eksantrik dişlisi → emme eksantrik dişlisi → gergi ve avare makara.',t:'Dişli kauçuk kayış. Değişim ≈ 150.000 km / 10 yıl (bakım kitapçığına bakın). Koparsa supaplar pistonlara çarpar ve eğilir (interference motor).'},[0.42,0.05,0]);})();
  (function(){const g=new THREE.Group();const h=hull2(TC,0.016);const sh=hullShape(h);
    const cg=extrudeX(sh,XT+0.004,0.068,0.004);g.add(mesh(cg,M.plastic));
    for(let k=0;k<5;k++)g.add(mesh(rbox(0.004,0.004,0.12,0.002),M.plastic2,XT+0.074,0.06+k*0.05,0));
    part(g,{id:'trigerkapak',grp:G3,n:'Triger kapakları',d:'Triger kayışını toz, su ve yabancı cisimlerden korur.',c:'Motorun sağ ucunda, bloğa ve silindir kapağına vidalı. Üstünde motor takozu braketi bulunur.',t:'Üst ve alt plastik kapak. Kayış değişiminde sökülür.'},[0.62,0.1,0]);})();

  /* =====================================================================
     GROUP 4 – ACCESSORY (POLY-V) DRIVE (outermost, x+)
     ===================================================================== */
  const G4='Yardımcı tahrik';
  const AC=[{z:0,y:0,r:0.074},{z:-0.175,y:0.11,r:0.03},{z:-0.06,y:0.205,r:0.033},{z:0.05,y:0.15,r:0.05},{z:0.165,y:-0.035,r:0.058}];
  (function(){const g=new THREE.Group();const p=pulley(AC[0].r,0.026,XAC,0,0,M.ironDark,6);p.add(mesh(cylX(AC[0].r*0.82,0.03,48),M.rubber));p.add(mesh(cylX(AC[0].r*0.62,0.034,48),M.forged));g.add(p);
    part(g,{id:'kasnak',grp:G4,n:'Krank kasnağı (titreşim damperi)',d:'Krankın gücünü V kayışına aktarır. İçindeki kauçuk halka krank milinin burulma titreşimlerini sönümler.',c:'Krank milinin en sağ ucunda, triger dişlisinin dışında; tek merkez cıvatasıyla bağlı.',t:'6 kanallı poly-V kasnak, kauçuk damperli.'},[0.6,-0.15,0]);})();
  (function(){const g=new THREE.Group();const c=AC[1];
    g.add(mesh(cylX(0.068,0.13,40),M.alu,XAC-0.085,c.y,c.z));
    for(let k=0;k<6;k++)g.add(mesh(cylX(0.069,0.006,40),M.aluCast,XAC-0.14+k*0.022,c.y,c.z));
    g.add(mesh(cylX(0.055,0.02,40),M.plastic,XAC-0.16,c.y,c.z));
    g.add(pulley(c.r,0.026,XAC,c.y,c.z,M.forged,6));
    g.add(mesh(cylX(0.008,0.02,8),M.bolt,XAC-0.17,c.y+0.03,c.z));
    part(g,{id:'alternator',grp:G4,n:'Alternatör (şarj dinamosu)',d:'Motor çalışırken elektrik üretir: aküyü şarj eder ve araçtaki bütün elektrikli sistemleri besler.',c:'V kayışıyla döner. Motorun sağ ön alt tarafında bloğa braketle bağlı; kalın kablosu marş motoru ve aküye gider.',t:'≈ 100–120 A. İçinde voltaj regülatörü ve diyot köprüsü. Akü lambası yanıyorsa ilk şüphelenilen parça.'},[0.45,0.05,-0.32]);})();
  (function(){const g=new THREE.Group();const c=AC[4];
    g.add(mesh(cylX(0.06,0.14,40),M.alu,XAC-0.095,c.y,c.z));g.add(mesh(rbox(0.05,0.04,0.04,0.008),M.alu,XAC-0.12,c.y+0.06,c.z));
    [-0.01,0.02].forEach(d=>g.add(mesh(cylY(0.009,0.03,12),M.alu,XAC-0.12+d,c.y+0.09,c.z)));
    const p=pulley(c.r,0.026,XAC,c.y,c.z,M.forged,6);p.add(mesh(cylX(c.r*0.7,0.03,40),M.ironDark));g.add(p);
    part(g,{id:'klima',grp:G4,n:'Klima kompresörü',d:'Klima gazını sıkıştırarak soğutma devresini çalıştırır. Klima açıldığında elektromanyetik kavraması kasnağı mile bağlar.',c:'V kayışıyla döner; motorun sağ arka alt tarafında bloğa bağlı. Üstündeki iki boru klima devresine (kondenser ve evaporatör) gider.',t:'Soğutucu akışkan R134a (Astra J). Kavrama boştayken kasnak serbest döner.'},[0.45,-0.15,0.32]);})();
  (function(){const g=new THREE.Group();const c=AC[3];g.add(mesh(cylX(0.058,0.03,40),M.alu,XAC-0.04,c.y,c.z));g.add(pulley(c.r,0.024,XAC,c.y,c.z,M.forged,6));
    part(g,{id:'supompasi',grp:'Soğutma',n:'Su pompası',d:'Soğutma suyunu motor bloğu, silindir kapağı ve radyatör arasında sürekli dolaştırır.',c:'Bu nesilde triger kayışından değil, V kayışından tahrikli. Motorun sağ ucunda; termostat ve radyatör hortumlarıyla bağlı.',t:'Santrifüj pompa. Sızıntı ya da yatak sesi yapıyorsa değiştirilir.'},[0.55,0.2,0.1]);})();
  (function(){const g=new THREE.Group();[AC[2]].forEach(c=>g.add(pulley(c.r,0.026,XAC,c.y,c.z,M.polished,0)));
    g.add(pulley(0.032,0.026,XAC,0.075,-0.085,M.polished,0));g.add(mesh(rbox(0.02,0.08,0.03,0.008),M.alu,XAC-0.025,0.06,-0.07));
    part(g,{id:'vgergi',grp:G4,n:'V kayışı gergisi ve avare makara',d:'Yaylı gergi V kayışını gergin tutar, avare makara kayışı yardımcı aksamların kasnaklarına sardırır.',c:'Sağ uçta bloğa ve kapağa cıvatalı.',t:'Otomatik gergi; kayış ötüyorsa gergi yayı zayıflamış olabilir.'},[0.65,0.15,-0.1]);})();
  (function(){const g=new THREE.Group();g.add(band(hull2(AC.concat([{z:-0.085,y:0.075,r:0.032}])),XAC,0.024,M.belt));
    part(g,{id:'vkayis',grp:G4,n:'V kayışı (poly-V)',d:'Krank kasnağından alternatöre, su pompasına ve klima kompresörüne güç taşır.',c:'Krank kasnağı → alternatör → avare → su pompası → klima kompresörü, gergiyle gerdirilir.',t:'6 kanallı poly-V kayış. Çatlak veya ötme varsa değiştirilir. Astra J’de direksiyon pompası elektro-hidrolik olduğu için kayışta değildir.'},[0.75,0,0]);})();
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.06,0.04,0.17,0.008),M.alu,0.27,HY+0.11,-0.02));g.add(mesh(rbox(0.06,0.09,0.04,0.008),M.alu,0.27,HY+0.07,-0.08));
    [-0.06,0.0,0.05].forEach(z=>g.add(mesh(cylY(0.006,0.05,8),M.bolt,0.27,HY+0.12,z)));
    part(g,{id:'takozsag',grp:'Güç aktarma',n:'Sağ motor takozu braketi',d:'Motoru sağ taraftan araç gövdesine bağlayan alüminyum braket.',c:'Triger kapağının üstünde motora, kauçuk takozla sağ iç çamurluğa bağlanır.',t:'Takoz kauçuğu yıprandığında rölantide titreşim ve kalkışta vuruntu yapar.'},[0.3,0.55,0]);})();

  /* =====================================================================
     GROUP 5 – INTAKE (rear, z+)   ·   GROUP 6 – FUEL
     ===================================================================== */
  const G5='Emme sistemi',G6='Yakıt sistemi';
  (function(){const g=new THREE.Group();
    const PL={y:0.075,z:0.235};
    g.add(mesh(rbox(0.40,0.085,0.075,0.03),M.plastic,-0.01,PL.y,PL.z));
    CYL.forEach(x=>{g.add(tube([[x,HY+0.06,0.105],[x,HY+0.085,0.15],[x,HY+0.075,0.215],[x,HY+0.02,0.255],[x,0.13,0.26],[x,PL.y+0.02,PL.z+0.01]],0.021,M.plastic,40));});
    g.add(mesh(rbox(0.40,0.02,0.03,0.008),M.plastic,0,HY+0.06,0.112));
    // variable-length intake actuator (vacuum can) on the plenum
    g.add(mesh(cylX(0.022,0.03,24),M.plastic2,-0.21,PL.y+0.02,PL.z));g.add(mesh(cylX(0.004,0.04,8),M.bolt,-0.185,PL.y+0.02,PL.z));
    // inlet elbow at the timing end towards the throttle body
    g.add(tube([[0.19,PL.y,PL.z],[0.24,PL.y+0.01,PL.z-0.01],[0.275,0.1,0.18]],0.032,M.plastic,24));
    part(g,{id:'emmemanifold',grp:G5,n:'Emme manifoldu (değişken uzunluklu)',d:'Gaz kelebeğinden gelen havayı 4 silindire eşit dağıtır. Kanal uzunluğu devre göre değiştirilerek düşük devirde tork, yüksek devirde güç artırılır.',c:'Silindir kapağının arka yüzüne bağlanır. Sağ ucunda gaz kelebeği; üzerinde yakıt rayı ve enjektörler, solunda vakumlu kanal ayar aktüatörü bulunur.',t:'Plastik manifold (Opel “TwinPort/VGIS”). Bu motorda turbo yok: hava doğrudan filtre → gaz kelebeği → manifold yoluyla emilir. Altında yağ soğutucusu gövdesi var (değişimi için manifold sökülür).'},[0,0.1,0.45]);})();
  (function(){const g=new THREE.Group();g.add(mesh(cylX(0.034,0.05,32),M.alu,0.30,0.1,0.18));g.add(mesh(ringX(0.034,0.027,0.052,32),M.alu,0.30,0.1,0.18));
    g.add(mesh(rbox(0.04,0.05,0.04,0.006),M.plastic2,0.30,0.14,0.18));const pl=mesh(cylX(0.026,0.002,24),M.ironDark,0.30,0.1,0.18);pl.rotation.y=0.5;g.add(pl);
    part(g,{id:'gazkelebek',grp:G5,n:'Elektronik gaz kelebeği',d:'Motora giren hava miktarını ayarlar. Gaz pedalına bastıkça ECU kelebeği açtırır; motorun gücünü belirleyen ana parçadır.',c:'Motorun sağ ucunda, emme manifoldunun girişinde. Hava filtresinden gelen körüklü emiş hortumu buraya bağlanır.',t:'Drive-by-wire: pedal ile kelebek arasında tel yok; elektrik motoru ve konum sensörleri var. Kirlenince rölanti dalgalanır, temizlenir.'},[0.4,0.05,0.25]);})();
  (function(){const g=new THREE.Group();
    g.add(mesh(cylX(0.0085,0.36,16),M.alu,0,HY+0.085,0.165));
    CYL.forEach(x=>{const inj=new THREE.Group();inj.position.set(x,HY+0.07,0.162);inj.rotation.x=-0.5;inj.add(mesh(cylY(0.0075,0.045,16),M.plastic2,0,0,0));inj.add(mesh(rbox(0.012,0.012,0.016,0.003),M.blue,0,0.012,0.012));g.add(inj);});
    g.add(tube([[-0.18,HY+0.085,0.165],[-0.22,HY+0.08,0.18],[-0.25,0.15,0.22]],0.004,M.bolt,20));
    part(g,{id:'yakit',grp:G6,n:'Yakıt rayı ve enjektörler (4)',d:'Enjektörler, ECU’nun belirlediği anda ve sürede her silindirin emme kanalına benzin püskürtür. Yakıt rayı enjektörlere basınçlı yakıtı dağıtır.',c:'Emme manifoldunun üstünde, silindir kapağına yakın. Sol uçtaki boru depodaki yakıt pompasından gelir; enjektör soketleri kablo demetine bağlıdır.',t:'Sıralı çok noktalı enjeksiyon (MPI), dönüşsüz yakıt sistemi (basınç depo içindeki pompa modülünde ayarlanır). Doğrudan enjeksiyon değil.'},[0,0.35,0.55]);})();

  /* =====================================================================
     GROUP 7 – EXHAUST (front, z−)
     ===================================================================== */
  const G7='Egzoz sistemi';
  (function(){const g=new THREE.Group();
    CYL.forEach((x,i)=>g.add(tube([[x,HY+0.055,-0.112],[x,HY+0.045,-0.15],[x*0.75,HY-0.01,-0.18],[x*0.25,HY-0.07,-0.2],[0,HY-0.1,-0.205]],0.019,M.exhaust,40)));
    g.add(mesh(rbox(0.40,0.03,0.012,0.005),M.exhaust,0,HY+0.055,-0.114));
    part(g,{id:'egzmanifold',grp:G7,n:'Egzoz manifoldu',d:'4 silindirden çıkan sıcak egzoz gazını toplayıp katalizöre yönlendirir.',c:'Silindir kapağının ön yüzüne (radyatör tarafı) saplamalarla bağlı; alt ucu katalizöre birleşik.',t:'Katalizörle tek parça (manifold-katalizör). Üstü nervürlü ısı kalkanıyla örtülüdür; ön lambda sondası çıkışındadır.'},[0,0.05,-0.42]);})();
  (function(){const g=new THREE.Group();
    const s=new THREE.Shape();s.moveTo(-0.2,0.0);s.quadraticCurveTo(0,0.02,0.2,0);s.lineTo(0.2,0.004);s.quadraticCurveTo(0,0.024,-0.2,0.004);s.closePath();
    // two-piece ribbed shield wrapping the front of the manifold (as seen in the engine-bay photos)
    const shg=new THREE.Group();shg.position.set(0,HY-0.02,-0.215);
    shg.add(mesh(rbox(0.40,0.2,0.006,0.004),M.shield,0,0,0));
    for(let k=0;k<8;k++)shg.add(mesh(rbox(0.385,0.01,0.008,0.003),M.shield,0,0.085-k*0.024,-0.004));
    const top=mesh(rbox(0.40,0.006,0.1,0.004),M.shield,0,0.1,0.045);top.rotation.x=-0.25;shg.add(top);
    [-0.1,0.1].forEach(x=>{const d=mesh(rbox(0.06,0.05,0.004,0.004),M.shield,x,0.03,-0.007);shg.add(d);});
    shg.rotation.x=0.12;g.add(shg);
    part(g,{id:'isikalkan',grp:G7,n:'Egzoz ısı kalkanı',d:'Egzoz manifoldunun yaydığı yüksek ısıdan çevredeki hortum, kablo ve plastik parçaları korur.',c:'Manifoldun önüne ve üstüne cıvatalarla bağlı; kaputu açınca motorun önünde görülen parlak nervürlü sac.',t:'Alüminyumlu çelik, nervürlü. Gevşerse rölantide tıkırtı yapar.'},[0,0.1,-0.62]);})();
  (function(){const g=new THREE.Group();g.add(mesh(new THREE.CylinderGeometry(0.058,0.058,0.15,32),M.exhaust,0,HY-0.2,-0.215));
    g.add(mesh(new THREE.CylinderGeometry(0.03,0.058,0.04,32),M.exhaust,0,HY-0.105,-0.212));
    g.add(tube([[0,HY-0.28,-0.215],[0,-0.17,-0.2],[0,-0.21,-0.12],[0.02,-0.215,0.05],[0.05,-0.215,0.25]],0.024,M.exhaust,30));
    part(g,{id:'katalizor',grp:G7,n:'Katalizör ve ön boru',d:'Egzoz gazındaki zararlı karbonmonoksit, hidrokarbon ve azot oksitleri kimyasal tepkimeyle daha zararsız gazlara dönüştürür.',c:'Egzoz manifoldunun hemen altında; ön boru motorun altından arkaya, egzoz hattına devam eder.',t:'Üç yollu katalizör, manifolda yakın (çabuk ısınması için). Euro 5. Arkasındaki 2. lambda sondası verimini denetler.'},[0,-0.2,-0.5]);})();
  (function(){const g=new THREE.Group();
    const ls=(x,y,z,rx)=>{const s=new THREE.Group();s.position.set(x,y,z);s.rotation.x=rx;s.add(mesh(cylY(0.0095,0.03,6),M.bolt,0,0.015,0));s.add(mesh(cylY(0.007,0.03,12),M.rubber,0,0.045,0));g.add(s);
      g.add(tube([[x,y+0.06*Math.cos(rx),z+0.06*Math.sin(rx)],[x+0.04,y+0.1,z+0.02],[x+0.1,HY+0.1,-0.12]],0.003,M.rubber,20));};
    ls(0.02,HY-0.09,-0.24,-0.9);ls(-0.03,HY-0.3,-0.27,-1.3);
    part(g,{id:'lambda',grp:G7,n:'Lambda (oksijen) sondaları',d:'Egzozdaki oksijen miktarını ölçer. Öndeki sonda ECU’ya karışımın zengin mi fakir mi olduğunu söyler; arkadaki katalizörün çalışıp çalışmadığını denetler.',c:'Ön sonda manifold çıkışında, arka sonda katalizörün altında; kabloları motor kablo demetine bağlanır.',t:'Isıtıcılı zirkonya sondalar. Arızasında yakıt tüketimi artar, motor arıza lambası yanar.'},[0.1,0,-0.6]);})();

  /* =====================================================================
     GROUP 8 – COOLING (engine-side parts; radiator & tank are added in the engine bay)
     ===================================================================== */
  const G8='Soğutma';
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.05,0.07,0.08,0.01),M.plastic,-XT-0.03,HY+0.05,-0.01));
    g.add(tube([[-XT-0.055,HY+0.07,-0.02],[-XT-0.09,HY+0.08,-0.05],[-XT-0.12,HY+0.05,-0.12]],0.016,M.rubber,20));
    g.add(tube([[-XT-0.045,HY+0.02,0.02],[-XT-0.07,HY-0.02,0.06],[-XT-0.08,HY-0.04,0.12]],0.011,M.rubber,20));
    g.add(mesh(cylX(0.006,0.025,10),M.yellow,-XT-0.06,HY+0.075,0.02));
    part(g,{id:'termostat',grp:G8,n:'Termostat gövdesi',d:'Motor soğukken suyu radyatöre göndermez, böylece motor hızla ısınır. ≈ 90 °C’de açılarak sıcak suyu radyatöre yollar.',c:'Silindir kapağının sol ucunda (şanzıman tarafı). Kalın hortum radyatör üst girişine, ince hortum kalorifere gider; üstünde su sıcaklık sensörü vardır.',t:'Plastik gövde, ECU kontrollü (ısıtıcılı) termostat. Gövde çatlağı bu motorda sık görülen su kaçağı sebebi.'},[-0.35,0.15,0])})();

  /* =====================================================================
     GROUP 9 – LUBRICATION
     ===================================================================== */
  const G9='Yağlama';
  (function(){const g=new THREE.Group();g.add(mesh(cylX(0.075,0.025,40),M.aluCast,XT+0.015,-0.005,0));g.add(mesh(rbox(0.02,0.04,0.16,0.01),M.aluCast,XT+0.012,-0.06,0));
    g.add(tube([[XT-0.01,-0.07,0.0],[0.15,-0.12,0.0],[0.1,-0.17,0.0]],0.008,M.alu,16));g.add(mesh(cylY(0.03,0.008,24),M.ironDark,0.1,-0.178,0));
    part(g,{id:'yagpompasi',grp:G9,n:'Yağ pompası',d:'Karterdeki yağı emip filtre üzerinden basınçla bütün yataklara, eksantriklere, faz ayarlayıcılara ve piston memelerine gönderir.',c:'Bloğun sağ ucunda, doğrudan krank milinin ucuna takılı (krank döndükçe döner). Emme borusu ve süzgeci kartere uzanır.',t:'Dişli (gerotor) tip, krank tahrikli. Basınç regülatör valfli. Yağ basıncı düşerse göstergede kırmızı yağ lambası yanar.'},[0.4,-0.25,0]);})();
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.13,0.07,0.05,0.01),M.alu,0.06,0.06,0.15));
    g.add(mesh(cylY(0.034,0.07,32),M.alu,0.1,0.12,0.155));g.add(mesh(new THREE.CylinderGeometry(0.03,0.03,0.012,6),M.plastic2,0.1,0.162,0.155));
    for(let k=0;k<5;k++)g.add(mesh(rbox(0.11,0.004,0.004,0.001),M.aluCast,0.04,0.04+k*0.01,0.176));
    g.add(tube([[0.0,0.05,0.16],[-0.05,0.04,0.18],[-0.12,0.02,0.17]],0.009,M.rubber,16));
    part(g,{id:'yagsogutucu',grp:G9,n:'Yağ soğutucusu ve filtre gövdesi',d:'Yağı süzer (kartuş filtre) ve soğutma suyuyla ısı alışverişi yaparak sıcaklığını dengede tutar.',c:'Bloğun arka yüzünde, emme manifoldunun altında. Hem yağ hem soğutma suyu kanallarına bağlı; filtre kapağı üstten açılır.',t:'Kartuş tipi yağ filtresi. Bu motorun kronik sorunu: soğutucu contası kaçırınca yağ suya, su yağa karışır (genleşme kabında yağ görülür). Değişimi için emme manifoldu sökülür.'},[0,-0.1,0.5]);})();
  (function(){const g=new THREE.Group();g.add(tube([[0.12,0.02,-0.118],[0.125,0.15,-0.13],[0.13,0.3,-0.14],[0.13,HY+HT+0.04,-0.15]],0.005,M.ironDark,24));
    const h=mesh(new THREE.TorusGeometry(0.013,0.0045,8,20),M.yellow,0.13,HY+HT+0.06,-0.15);g.add(h);
    part(g,{id:'yagcubuk',grp:G9,n:'Yağ seviye çubuğu',d:'Motor yağı seviyesini kontrol etmek için kullanılır: yağ, çubuktaki MIN ve MAX işaretleri arasında olmalıdır.',c:'Motorun önünde, egzoz ısı kalkanının sağ yanında; borusu kartere kadar iner.',t:'Sarı halkalı. Motor soğukken ve araç düz zemindeyken ölçülür. MIN–MAX arası ≈ 1 litredir.'},[0,0.5,-0.3]);})();
  (function(){const g=new THREE.Group();g.add(tube([[0.12,HY+HT+0.03,0.09],[0.16,HY+HT+0.03,0.15],[0.18,HY+0.05,0.2]],0.006,M.rubber,16));g.add(mesh(cylY(0.012,0.02,16),M.plastic2,0.12,HY+HT+0.04,0.085));
    part(g,{id:'pcv',grp:G9,n:'Karter havalandırma (PCV)',d:'Pistonlardan kartere kaçan gazları emme manifolduna geri göndererek yakılmasını sağlar; karter basıncını düşürür.',c:'Külbütör kapağı ile emme manifoldu arasındaki hortum ve valf.',t:'Valf diyaframı yırtılırsa rölanti düzensizleşir, ıslık sesi ve yağ kaçakları görülür.'},[0.1,0.9,0.3]);})();

  /* =====================================================================
     GROUP 10 – ELECTRICAL & ENGINE MANAGEMENT
     ===================================================================== */
  const G10='Elektrik ve kontrol';
  (function(){const g=new THREE.Group();g.add(mesh(cylX(0.04,0.13,32),M.ironDark,-XT-0.095,-0.04,0.135));g.add(mesh(cylX(0.022,0.08,24),M.alu,-XT-0.06,0.015,0.135));g.add(mesh(cylX(0.045,0.02,32),M.alu,-XT-0.025,-0.04,0.135));
    part(g,{id:'mars',grp:G10,n:'Marş motoru',d:'Kontak çevrilince volanın çember dişlisini döndürerek motoru çalıştırır.',c:'Motorun arka tarafında, şanzıman çanına cıvatalı; dişlisi volana geçer. Kalın kablo doğrudan aküye gider.',t:'≈ 1,1–1,4 kW. Üstündeki solenoid hem akımı açar hem dişliyi ileri iter.'},[-0.15,-0.15,0.35]);})();
  (function(){const g=new THREE.Group();
    g.add(tube([[-0.25,HY+0.1,0.21],[-0.1,HY+0.11,0.2],[0.1,HY+0.11,0.2],[0.24,HY+0.08,0.18]],0.011,M.rubber,40));
    CYL.forEach(x=>g.add(tube([[x,HY+0.11,0.2],[x,HY+0.1,0.18],[x,HY+0.08,0.17]],0.003,M.rubber,8)));
    g.add(tube([[-0.1,HY+0.11,0.2],[-0.15,HY+HT+0.04,0.05],[-0.2,HY+HT+0.035,0.0]],0.004,M.rubber,12));
    part(g,{id:'kablo',grp:G10,n:'Motor kablo demeti',d:'ECU’yu enjektörlere, bobin modülüne, gaz kelebeğine ve tüm sensörlere bağlayan kablolar.',c:'Emme manifoldunun üstünden geçer; ECU soketinden motordaki tüm elektrikli parçalara dağılır.',t:'Soket temassızlıkları bu motor ailesinde sık görülen arıza sebebi.'},[0,0.55,0.4]);})();
  (function(){const g=new THREE.Group();
    const s=(x,y,z,col)=>{g.add(mesh(cylY(0.007,0.025,12),M.plastic2,x,y,z));g.add(mesh(rbox(0.016,0.012,0.012,0.003),col||M.plastic,x,y+0.018,z));};
    s(-XT-0.005,CAMY,CAMZ+0.012,M.green);s(-XT-0.005,CAMY,-CAMZ-0.012,M.green);           // camshaft position sensors
    s(-0.17,-0.02,0.125,M.plastic);                                                          // crankshaft position sensor
    s(0.0,0.08,0.11,M.plastic2);                                                             // knock sensor
    s(0.04,0.1,-0.11,M.plastic2);                                                            // oil pressure switch
    part(g,{id:'sensor',grp:G10,n:'Motor sensörleri',d:'Krank konum sensörü motor devrini ve piston konumunu, eksantrik sensörleri supap zamanlamasını, vuruntu sensörü erken ateşlemeyi, yağ basınç müşiri yağ basıncını ölçer.',c:'Krank sensörü bloğun arka-sol tarafında, eksantrik sensörleri kapağın sol ucunda, vuruntu sensörü bloğun arka ortasında; hepsi kablo demetiyle ECU’ya bağlı.',t:'Krank sensörü arızalanırsa motor çalışmaz. Vuruntu sensörü ateşleme avansını geri alarak motoru korur.'},[0,0.15,0.2]);})();
  (function(){const g=new THREE.Group();[-1,1].forEach(sz=>{g.add(mesh(cylX(0.011,0.05,16),M.plastic2,XT-0.03,CAMY+0.02,sz*0.085));g.add(mesh(rbox(0.018,0.016,0.016,0.003),M.plastic,XT-0.06,CAMY+0.02,sz*0.085));});
    part(g,{id:'vvtvalf',grp:G10,n:'VVT selenoid valfleri (2)',d:'ECU’nun komutuyla motor yağını faz ayarlayıcıların ileri ya da geri odacıklarına yönlendirir.',c:'Silindir kapağının sağ üst ucunda, eksantrik dişlilerinin hemen arkasında.',t:'Valf süzgeçleri tıkanınca faz ayarlayıcı takılır: arıza lambası, tıkırtı ve güç kaybı yapar.'},[0.3,0.6,0])})();
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.16,0.03,0.12,0.006),M.alu,-0.12,0.155,0.3));for(let k=0;k<8;k++)g.add(mesh(rbox(0.15,0.004,0.004,0.001),M.aluCast,-0.12,0.172,0.25+k*0.014));
    g.add(mesh(rbox(0.05,0.02,0.04,0.004),M.plastic,-0.2,0.17,0.3));g.add(mesh(rbox(0.05,0.02,0.04,0.004),M.plastic,-0.05,0.17,0.3));
    part(g,{id:'ecu',grp:G10,n:'Motor kontrol ünitesi (ECU)',d:'Motorun beyni. Sensörlerden gelen bilgilere göre enjeksiyon süresini, ateşleme anını, gaz kelebeğini, VVT’yi ve emme manifoldunu yönetir.',c:'Motor kablo demetinin iki soketiyle bütün sensör ve aktüatörlere bağlı.',t:'Konum yaklaşık gösterildi (motorun arka-sol tarafı). Arızaları çoğunlukla soketlerden kaynaklanır.'},[-0.1,0.4,0.5]);})();

  /* =====================================================================
     GROUP 11 – DRIVETRAIN: clutch, F17 gearbox, left mount
     ===================================================================== */
  const G11='Güç aktarma';
  (function(){const g=new THREE.Group();const x=-2*PITCH-0.06;
    g.add(mesh(cylX(0.11,0.012,48),M.ironDark,x-0.012,0,0));g.add(mesh(cylX(0.1,0.025,48),M.forged,x-0.03,0,0));
    for(let k=0;k<18;k++){const a=k/18*Math.PI*2;const f=mesh(new THREE.BoxGeometry(0.004,0.045,0.012),M.spring,x-0.045,Math.cos(a)*0.035,Math.sin(a)*0.035);f.rotation.x=-a;g.add(f);}
    part(g,{id:'debriyaj',grp:G11,n:'Debriyaj (baskı, disk, rulman)',d:'Debriyaj pedalına basınca motor ile şanzımanın bağlantısını keser; vites değiştirmeyi ve yumuşak kalkışı sağlar.',c:'Volan ile şanzıman arasında: disk volana, baskı balatası diske bastırır. Hidrolik debriyaj rulmanı baskının diyafram yayını iter.',t:'Tek diskli kuru debriyaj, hidrolik kumandalı (fren hidroliği haznesini kullanır). Patinaj yapıyorsa balata bitmiştir.'},[-0.36,-0.1,0])})();
  (function(){const g=new THREE.Group();const x0=-XT-0.012;
    const bh=new THREE.Mesh(new THREE.CylinderGeometry(0.135,0.155,0.09,48,1,false),M.aluCast);bh.rotation.z=Math.PI/2;bh.position.set(x0-0.045,0.0,0.0);g.add(bh);
    g.add(mesh(rbox(0.2,0.24,0.24,0.05),M.aluCast,x0-0.19,0.03,0.04));
    g.add(mesh(rbox(0.13,0.15,0.17,0.05),M.aluCast,x0-0.34,0.06,0.05));
    g.add(mesh(cylX(0.08,0.1,40),M.aluCast,x0-0.16,-0.08,0.12));
    for(let k=0;k<6;k++)g.add(mesh(rbox(0.004,0.2,0.004,0.001),M.alu,x0-0.1-k*0.035,0.03,0.162));
    g.add(mesh(rbox(0.07,0.05,0.07,0.01),M.alu,x0-0.3,0.165,0.04));[-0.015,0.015].forEach(d=>g.add(tube([[x0-0.3+d,0.19,0.04],[x0-0.3+d,0.23,0.1],[x0-0.28+d,0.25,0.25]],0.006,M.rubber,16)));
    g.add(mesh(cylX(0.035,0.04,24),M.alu,x0-0.4,-0.08,0.12));
    part(g,{id:'sanziman',grp:G11,n:'F17 5 ileri manuel şanzıman',d:'Motorun devrini ve torkunu vites oranlarıyla tekerleklere uygun hâle getirir; diferansiyel dönemeçte iki tekerleğin farklı hızda dönmesini sağlar.',c:'Motorun sol ucuna (volan tarafı) cıvatalı. Üstündeki iki vites kablosu kabindeki vites koluna gider; alt-arkadaki diferansiyel çıkışlarından aks milleri tekerleklere uzanır.',t:'F17: 5 ileri + geri, diferansiyel entegre. Oranlar 3,73 / 2,14 / 1,41 / 1,12 / 0,89, geri 3,31, son çevrim ≈ 3,94. Yağı: 75W-80 şanzıman yağı (ömürlük kabul edilir).'},[-0.55,0,0])})();
  (function(){const g=new THREE.Group();g.add(mesh(rbox(0.08,0.05,0.09,0.01),M.alu,-XT-0.2,0.2,0.04));g.add(mesh(cylY(0.03,0.04,20),M.rubber,-XT-0.2,0.245,0.04));
    part(g,{id:'takozsol',grp:G11,n:'Sol motor (şanzıman) takozu',d:'Motor ve şanzımanı sol taraftan gövdeye bağlar, titreşimi süzer.',c:'Şanzımanın üstünde, sol iç çamurluktaki şaseye bağlanır.',t:'Arka tarafta ayrıca bir tork çubuğu (rot) motorun ileri-geri sallanmasını sınırlar.'},[-0.4,0.4,0])})();

  return {root,parts,groups:[G1,G2,G3,G4,G5,G6,G7,'Soğutma','Yağlama',G10,G11],dims:{BORE,STROKE,PITCH,DECK,XTB,XAC},M};
}
return {build};
})();
