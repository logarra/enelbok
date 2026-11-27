/* Opel Astra J 1.6 Ecotec (A16XER) – procedural engine model, built part by part.
   Engine-local axes: +x = timing-belt end (car's right), +y = up (y=0 is the crankshaft axis), +z = front (exhaust side, towards the radiator).
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
    iron:new THREE.MeshStandardMaterial({color:0x5b5f64,metalness:0.55,roughness:0.62}),
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
    [-1,0,1].forEach(k=>{const c=mesh(cylY(0.013,0.004,24),M.brass,k*PITCH*1.4,0.12,Wu/2+0.009);c.rotation.x=Math.PI/2;g.add(c);});
    // engine-mount / accessory bosses
    g.add(mesh(rbox(0.05,0.07,0.05,0.01),M.iron,L/2-0.01,0.05,0.10));
    g.add(mesh(rbox(0.05,0.06,0.05,0.01),M.iron,-L/2+0.02,0.0,-0.115));
    // bell-housing flange at the gearbox end
    const fl=mesh(rbox(0.012,0.3,0.27,0.03),M.iron,-L/2-0.006,0.05,0);g.add(fl);
    // oil-cooler / filter pad on the rear face (the cooler itself comes with the lubrication group)
    g.add(mesh(rbox(0.09,0.06,0.012,0.008),M.iron,0.06,0.05,-0.124));
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

  return {root,parts,groups:[G1],dims:{BORE,STROKE,PITCH,DECK}};
}
return {build};
})();
