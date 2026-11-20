(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const meter = document.getElementById('signal-meter-fill');
  const signalLabel = document.getElementById('signal-label');
  const cellCount = document.getElementById('cell-count');
  const uplinkState = document.getElementById('uplink-state');
  const timerLabel = document.getElementById('timer');
  const keys = new Set();
  const walls = [
    {x:185,y:95,w:126,h:26}, {x:408,y:88,w:26,h:182}, {x:557,y:94,w:162,h:26},
    {x:852,y:95,w:26,h:200}, {x:190,y:263,w:177,h:27}, {x:518,y:250,w:27,h:168},
    {x:631,y:265,w:194,h:27}, {x:940,y:369,w:170,h:27}, {x:202,y:434,w:27,h:168},
    {x:321,y:480,w:184,h:27}, {x:591,y:478,w:186,h:27}, {x:785,y:532,w:27,h:103},
    {x:1020,y:520,w:92,h:24}, {x:352,y:350,w:62,h:25}, {x:700,y:390,w:58,h:22}
  ];
  const decor = [
    {x:70,y:92,w:74,h:13,t:'pipe'}, {x:475,y:170,w:18,h:66,t:'crate'}, {x:1050,y:180,w:54,h:56,t:'console'},
    {x:80,y:546,w:74,h:35,t:'crate'}, {x:535,y:572,w:70,h:15,t:'pipe'}, {x:895,y:580,w:53,h:32,t:'crate'},
    {x:720,y:110,w:57,h:18,t:'pipe'}, {x:1050,y:300,w:66,h:12,t:'pipe'}, {x:280,y:360,w:46,h:12,t:'pipe'},
    {x:912,y:190,w:54,h:54,t:'crate'}, {x:542,y:430,w:40,h:15,t:'pipe'}
  ];
  const initialCells = [{x:326,y:164},{x:747,y:352},{x:465,y:602}];
  const patrol = [{x:1000,y:570},{x:1085,y:450},{x:720,y:600},{x:980,y:220}];
  let state = 'title', last = 0, player, enemy, cells, consoleLive, timeLeft, pulseFlash, pulseCooldown, pulseTarget, noise, gameTime, hint = '', hintTimer = 0, escaped = false;

  function reset() {
    player = {x:96,y:360,r:12,face:0};
    enemy = {x:1040,y:580,r:16,stun:0,targetX:patrol[0].x,targetY:patrol[0].y,patrol:0,alert:0,seen:0};
    cells = initialCells.map(c => ({...c,got:false}));
    consoleLive = false; timeLeft = 100; pulseFlash = 0; pulseCooldown = 0; pulseTarget = null;
    noise = 0; gameTime = 0; hint = ''; hintTimer = 0; escaped = false; state = 'playing';
    updatePanel();
  }
  function updatePanel() {
    cellCount.textContent = `${cells.filter(c=>c.got).length} / 3`;
    uplinkState.textContent = consoleLive ? 'ONLINE' : 'OFFLINE';
    uplinkState.style.color = consoleLive ? '#70e1c0' : '';
  }
  function say(text, duration=2.2) { hint=text; hintTimer=duration; }
  function start() { if (state !== 'playing') reset(); }
  function setKey(code, down) {
    if (down) {
      if (!keys.has(code)) {
        if (code === 'KeyQ' && state === 'playing') pulse();
        if (code === 'KeyE' && state === 'playing') interact();
        if ((code === 'Enter' || code === 'Space') && state !== 'playing') start();
      }
      keys.add(code);
    } else keys.delete(code);
  }
  window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    setKey(e.code, true);
  });
  window.addEventListener('keyup', e => setKey(e.code, false));
  window.addEventListener('blur', () => keys.clear());
  document.querySelectorAll('[data-dir]').forEach(button => {
    const code = {up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[button.dataset.dir];
    const on = e => { e.preventDefault(); keys.add(code); button.setPointerCapture?.(e.pointerId); };
    const off = e => { e.preventDefault(); keys.delete(code); };
    button.addEventListener('pointerdown',on); button.addEventListener('pointerup',off);
    button.addEventListener('pointercancel',off); button.addEventListener('lostpointercapture',off);
  });
  document.getElementById('pulse-touch').addEventListener('pointerdown',e=>{e.preventDefault();pulse();});
  document.getElementById('interact-touch').addEventListener('pointerdown',e=>{e.preventDefault();interact();});
  canvas.addEventListener('pointerdown', () => { if (state !== 'playing') start(); });

  function pulse() {
    if (state !== 'playing' || pulseCooldown > 0) return;
    pulseFlash = 1.15; pulseCooldown = 7.5; noise = Math.max(noise, 100);
    pulseTarget = {x:player.x,y:player.y,life:5.2};
    enemy.stun = Math.max(enemy.stun,.75); enemy.seen = 3.6;
    say('RESONANCE SPIKE — IT HEARD THAT',1.8);
  }
  function interact() {
    if (state !== 'playing') return;
    const d = Math.hypot(player.x-1048,player.y-150);
    if (d < 80) {
      if (cells.some(c=>!c.got)) { say('UPLINK LOCKED — THREE CELLS REQUIRED'); return; }
      if (!consoleLive) { consoleLive=true; noise=95; updatePanel(); say('UPLINK RESTORED — FIND THE EXTRACTION HATCH',3); }
      else say('UPLINK ACTIVE. GET TO THE HATCH.',1.8);
      return;
    }
    if (Math.hypot(player.x-1125,player.y-630) < 70 && consoleLive) { state='won'; escaped=true; return; }
    say('NOTHING TO USE HERE',1.2);
  }
  function blocked(x,y,r) {
    if (x-r<38||x+r>1162||y-r<38||y+r>682) return true;
    for (const b of walls) if (x+r>b.x && x-r<b.x+b.w && y+r>b.y && y-r<b.y+b.h) return true;
    return false;
  }
  function moveCircle(body,dx,dy) {
    if (!blocked(body.x+dx,body.y,body.r)) body.x+=dx;
    if (!blocked(body.x,body.y+dy,body.r)) body.y+=dy;
  }
  function update(dt) {
    if (state !== 'playing') return;
    gameTime += dt; timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft=0; state='lost'; say('OXYGEN DEPLETED',10); }
    if (pulseFlash>0) pulseFlash=Math.max(0,pulseFlash-dt);
    if (pulseCooldown>0) pulseCooldown=Math.max(0,pulseCooldown-dt);
    if (pulseTarget) { pulseTarget.life-=dt; if(pulseTarget.life<=0)pulseTarget=null; }
    if (hintTimer>0) hintTimer-=dt;
    let dx=0,dy=0;
    if (keys.has('KeyA')||keys.has('ArrowLeft'))dx--;
    if (keys.has('KeyD')||keys.has('ArrowRight'))dx++;
    if (keys.has('KeyW')||keys.has('ArrowUp'))dy--;
    if (keys.has('KeyS')||keys.has('ArrowDown'))dy++;
    const moving=dx!==0||dy!==0, sprint=(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&moving;
    if(moving){const len=Math.hypot(dx,dy);dx/=len;dy/=len;player.face=Math.atan2(dy,dx);const speed=sprint?198:132;moveCircle(player,dx*speed*dt,dy*speed*dt);}
    noise=Math.max(0,noise-(moving?(sprint?11:22):36)*dt);
    if(moving&&sprint)noise=Math.min(100,noise+24*dt);
    for(const c of cells){if(!c.got&&Math.hypot(player.x-c.x,player.y-c.y)<25){c.got=true;noise=Math.max(noise,28);updatePanel();say('RELAY CELL RECOVERED',1.7);}}
    const dist=Math.hypot(enemy.x-player.x,enemy.y-player.y);
    if(dist<220&&(noise>16||dist<100)){enemy.alert=Math.max(enemy.alert,3.8);enemy.seen=1.5;}
    else enemy.alert=Math.max(0,enemy.alert-dt);
    enemy.stun=Math.max(0,enemy.stun-dt);enemy.seen=Math.max(0,enemy.seen-dt);
    let tx,ty,speed=64;
    if(enemy.stun>0){tx=enemy.x;ty=enemy.y;}
    else if(pulseTarget){tx=pulseTarget.x;ty=pulseTarget.y;speed=82;}
    else if(enemy.alert>0){tx=player.x;ty=player.y;speed=93;}
    else {let p=patrol[enemy.patrol];tx=p.x;ty=p.y;if(Math.hypot(tx-enemy.x,ty-enemy.y)<22)enemy.patrol=(enemy.patrol+1)%patrol.length;}
    if(enemy.stun<=0){let a=Math.atan2(ty-enemy.y,tx-enemy.x),ex=Math.cos(a)*speed*dt,ey=Math.sin(a)*speed*dt;const ox=enemy.x,oy=enemy.y;moveCircle(enemy,ex,ey);if(ox===enemy.x&&oy===enemy.y){moveCircle(enemy,-ey*.7,ex*.7);}}
    if(Math.hypot(enemy.x-player.x,enemy.y-player.y)<27){state='lost';say('CONTACT — SIGNAL TERMINATED',10);}
    if(pulseCooldown<7.5){meter.style.width=`${Math.max(0,100-(pulseCooldown/7.5)*100)}%`;}
    const loud=Math.max(noise, pulseTarget?38:0);
    meter.style.width=`${Math.max(pulseCooldown>0?(7.5-pulseCooldown)/7.5*100:100,loud)}%`;
    meter.style.background=loud>55?'#ff594e':'#70e1c0';
    signalLabel.textContent=loud>55?'LOUD':pulseCooldown>0?`CHARGING ${pulseCooldown.toFixed(1)}s`:'READY';
    timerLabel.textContent=`${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(Math.floor(timeLeft%60)).padStart(2,'0')}`;
  }
  function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function drawFloor(){
    const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#1a2428');g.addColorStop(.52,'#131d21');g.addColorStop(1,'#0e171c');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.beginPath();ctx.rect(44,44,1112,632);ctx.clip();
    for(let y=52;y<680;y+=40){for(let x=52+(Math.floor(y/40)%2)*20;x<1160;x+=40){ctx.strokeStyle=((x+y)%5===0)?'#273237':'#1c282c';ctx.lineWidth=1;ctx.strokeRect(x,y,40,40);if((x*13+y*7)%29===0){ctx.fillStyle='#53605d';ctx.globalAlpha=.16;ctx.fillRect(x+5,y+7,1,16);ctx.globalAlpha=1;}}}
    // Wet channels and reflected emergency lighting.
    [[62,302,306,96],[570,435,270,96],[874,307,236,38],[380,620,217,27]].forEach((p,i)=>{ctx.fillStyle=i%2?'#253c3c4b':'#233a413d';ctx.beginPath();ctx.ellipse(p[0]+p[2]/2,p[1]+p[3]/2,p[2]/2,p[3]/2,-.08,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7fa5a044';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p[0]+p[2]/2,p[1]+p[3]/2,p[2]/2-5,p[3]/2-4,-.08,0,Math.PI*2);ctx.stroke();});
    // Floor markings.
    ctx.setLineDash([12,10]);ctx.strokeStyle='#d2aa4b35';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,400);ctx.lineTo(1120,400);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    // Perimeter bulkheads.
    ctx.fillStyle='#253034';ctx.fillRect(25,25,1150,18);ctx.fillRect(25,677,1150,18);ctx.fillRect(25,43,19,634);ctx.fillRect(1156,43,19,634);
    ctx.strokeStyle='#596367';ctx.lineWidth=2;ctx.strokeRect(38,38,1124,644);
    for(let x=70;x<1140;x+=90){ctx.fillStyle='#718080';ctx.fillRect(x,27,19,4);ctx.fillRect(x,687,19,4);}
  }
  function drawWall(b){
    ctx.fillStyle='#060a0c';ctx.fillRect(b.x+5,b.y+7,b.w,b.h);
    const g=ctx.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);g.addColorStop(0,'#566263');g.addColorStop(.14,'#303d40');g.addColorStop(.5,'#202b2f');g.addColorStop(1,'#3b484a');
    ctx.fillStyle=g;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.strokeStyle='#687678';ctx.lineWidth=2;ctx.strokeRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle='#a1aaa04c';ctx.fillRect(b.x+4,b.y+3,Math.max(3,b.w-8),2);
    if(b.w>b.h){for(let x=b.x+12;x<b.x+b.w-4;x+=25){ctx.fillStyle='#12191c';ctx.fillRect(x,b.y+7,3,b.h-14);}}
    else{for(let y=b.y+12;y<b.y+b.h-4;y+=25){ctx.fillStyle='#12191c';ctx.fillRect(b.x+7,y,b.w-14,3);}}
    ctx.fillStyle='#c2a15b';ctx.fillRect(b.x+4,b.y+4,4,4);ctx.fillRect(b.x+b.w-8,b.y+4,4,4);
  }
  function drawDecor(d){
    if(d.t==='crate'){rounded(d.x,d.y,d.w,d.h,3,'#222d2f','#566160');ctx.strokeStyle='#455352';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(d.x+5,d.y+5);ctx.lineTo(d.x+d.w-5,d.y+d.h-5);ctx.moveTo(d.x+d.w-5,d.y+5);ctx.lineTo(d.x+5,d.y+d.h-5);ctx.stroke();ctx.fillStyle='#b6924f';ctx.fillRect(d.x+5,d.y+4,d.w-10,3);}
    else if(d.t==='pipe'){ctx.fillStyle='#11191b';ctx.fillRect(d.x,d.y+5,d.w,d.h);ctx.fillStyle='#5e6b69';ctx.fillRect(d.x,d.y,d.w,d.h*.48);ctx.fillStyle='#a4aaa14c';ctx.fillRect(d.x+2,d.y+2,d.w-4,2);for(let x=d.x+12;x<d.x+d.w;x+=26){ctx.fillStyle='#263032';ctx.fillRect(x,d.y-2,4,d.h+4);}}
    else{rounded(d.x,d.y,d.w,d.h,3,'#142124','#586765');ctx.fillStyle='#57c4aa';ctx.shadowColor='#69e4c5';ctx.shadowBlur=15;ctx.fillRect(d.x+8,d.y+9,d.w-16,5);ctx.shadowBlur=0;ctx.fillStyle='#33494a';ctx.fillRect(d.x+8,d.y+22,d.w-16,3);ctx.fillStyle='#d1b263';ctx.fillRect(d.x+d.w/2-3,d.y+d.h-5,6,5);}
  }
  function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  function drawCell(c){if(c.got)return;glow(c.x,c.y,39,'#e5bd6044');ctx.save();ctx.translate(c.x,c.y+Math.sin(gameTime*3+c.x)*2);ctx.rotate(Math.sin(gameTime*1.6+c.y)*.04);rounded(c.x-10,c.y-12,20,24,3,'#967c49','#f1d48a');ctx.fillStyle='#253332';ctx.fillRect(c.x-6,c.y-7,12,14);ctx.fillStyle='#9ce1bf';ctx.shadowColor='#8de8ca';ctx.shadowBlur=9;ctx.fillRect(c.x-3,c.y-4,6,8);ctx.restore();}
  function drawLandmarks(){
    // Uplink console and secured hatch are deliberately visible even through fog.
    glow(1048,150,46,consoleLive?'#62e5bf33':'#51bd9c20');drawDecor({x:1015,y:117,w:66,h:58,t:'console'});
    ctx.fillStyle=consoleLive?'#70e1c0':'#b66a57';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('UPLINK',1048,190);
    const ex=1125,ey=630;glow(ex,ey,45,consoleLive?'#70e1c033':'#cf6c4930');ctx.save();ctx.translate(ex,ey);ctx.rotate(-.16);rounded(-26,-18,52,36,5,'#2b3939','#77847b');ctx.strokeStyle='#d2b360';ctx.lineWidth=3;ctx.strokeRect(-20,-13,40,26);ctx.fillStyle='#11191a';ctx.fillRect(-14,-8,28,16);ctx.fillStyle=consoleLive?'#73e8c1':'#c26954';ctx.fillRect(-7,-3,14,6);ctx.restore();ctx.fillStyle='#a0adaa';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('HATCH',1125,662);
  }
  function drawPlayer(){
    ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.face);
    ctx.fillStyle='#080d0f';ctx.beginPath();ctx.ellipse(1,5,13,16,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#62746f';ctx.beginPath();ctx.ellipse(0,0,10,13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#b1b8a4';ctx.beginPath();ctx.arc(4,-2,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1b2829';ctx.fillRect(1,-8,13,11);ctx.fillStyle='#a8d7bf';ctx.fillRect(12,-2,11,4);
    ctx.fillStyle='#e7d29a';ctx.shadowColor='#d5edc7';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(23,0,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.restore();
  }
  function drawEnemy(){
    const seen=enemy.alert>0||enemy.seen>0||pulseFlash>0||pulseTarget;
    if(!seen)return;
    const flicker=1+Math.sin(gameTime*19)*.06;ctx.save();ctx.translate(enemy.x,enemy.y);ctx.scale(flicker,1);
    glow(0,0,30,enemy.alert>0?'#ab302d35':'#718d8130');
    ctx.fillStyle='#080b0c';ctx.beginPath();ctx.ellipse(0,2,14,20,-.16,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#151b1c';ctx.beginPath();ctx.moveTo(-11,-7);ctx.lineTo(-16,-23);ctx.lineTo(-6,-15);ctx.lineTo(0,-29);ctx.lineTo(6,-15);ctx.lineTo(17,-22);ctx.lineTo(11,-5);ctx.lineTo(16,12);ctx.lineTo(7,19);ctx.lineTo(-9,18);ctx.lineTo(-16,7);ctx.closePath();ctx.fill();
    ctx.fillStyle='#c75b4b';ctx.shadowColor='#f45d47';ctx.shadowBlur=10;ctx.fillRect(-7,-5,4,2);ctx.fillRect(4,-5,4,2);ctx.shadowBlur=0;
    ctx.strokeStyle='#171d1d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-10,6);ctx.lineTo(-21,17);ctx.moveTo(10,6);ctx.lineTo(20,15);ctx.stroke();ctx.restore();
  }
  function darkness(){
    ctx.save();ctx.fillStyle='rgba(3,8,11,.83)';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='destination-out';
    let r=205;const cone=ctx.createRadialGradient(player.x,player.y,23,player.x,player.y,r);cone.addColorStop(0,'rgba(0,0,0,.98)');cone.addColorStop(.7,'rgba(0,0,0,.66)');cone.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=cone;ctx.beginPath();ctx.arc(player.x,player.y,r,0,Math.PI*2);ctx.fill();
    const lx=player.x+Math.cos(player.face)*78,ly=player.y+Math.sin(player.face)*78;const beam=ctx.createRadialGradient(lx,ly,4,lx,ly,255);beam.addColorStop(0,'rgba(0,0,0,.68)');beam.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.arc(lx,ly,255,0,Math.PI*2);ctx.fill();
    if(pulseFlash>0){const pr=220+(1.15-pulseFlash)*300;const pg=ctx.createRadialGradient(player.x,player.y,Math.max(30,pr-90),player.x,player.y,pr);pg.addColorStop(0,'rgba(0,0,0,.72)');pg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=pg;ctx.beginPath();ctx.arc(player.x,player.y,pr,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function drawWorld(){
    drawFloor();
    // Scattered warning lamps and rust streaks.
    [[155,210],[505,320],[790,205],[1088,342],[285,635],[880,445],[640,560]].forEach((p,i)=>{glow(p[0],p[1],32,i%2?'#b7483a21':'#d0a95618');ctx.fillStyle=i%2?'#ba5143':'#d1ae65';ctx.globalAlpha=.72;ctx.fillRect(p[0]-3,p[1]-3,6,6);ctx.globalAlpha=1;});
    walls.forEach(drawWall);decor.forEach(drawDecor);drawLandmarks();
    cells.forEach(drawCell);drawEnemy();drawPlayer();darkness();
    // Player silhouette and objects remain crisp inside the lamp pool.
    drawEnemy();drawPlayer();
    if(pulseFlash>0){ctx.strokeStyle=`rgba(117,229,199,${Math.min(.7,pulseFlash*.55)})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,235+(1.15-pulseFlash)*300,0,Math.PI*2);ctx.stroke();}
    if(Math.hypot(player.x-1048,player.y-150)<88&&!consoleLive){ctx.fillStyle='#d5e0d9';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('E  RESTORE UPLINK',1048,212);}
    if(Math.hypot(player.x-1125,player.y-630)<75&&consoleLive){ctx.fillStyle='#70e1c0';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('E  EXTRACT',1125,681);}
    ctx.fillStyle='#d4dfd8';ctx.textAlign='left';ctx.font='10px monospace';ctx.fillText('SERVICE TUNNEL',72,240);ctx.fillText('PUMP ROOM',480,235);ctx.fillText('RELAY BAY',905,345);ctx.fillText('FLOOD CHANNEL',445,665);
    // Film grain, restrained so it never obscures play.
    for(let i=0;i<34;i++){const x=(i*173+gameTime*13)%W,y=(i*97+gameTime*29)%H;ctx.fillStyle=`rgba(205,226,213,${((i%5)+1)*.025})`;ctx.fillRect(x,y,1,1);}
    const vignette=ctx.createRadialGradient(W/2,H/2,120,W/2,H/2,740);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#0205069c');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
    if(hintTimer>0&&state==='playing'){rounded(W/2-210,46,420,32,4,'#10191ddd','#86b5a155');ctx.fillStyle='#c9e5d7';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(hint,W/2,66);}
  }
  function titleScreen(){
    ctx.fillStyle='rgba(2,5,7,.6)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#9aa8a6';ctx.font='11px monospace';ctx.letterSpacing='4px';ctx.textAlign='center';ctx.fillText('NORTH SEA LISTENING STATION  /  INCIDENT 07',W/2,211);
    ctx.shadowColor='#69d9b4';ctx.shadowBlur=22;ctx.fillStyle='#e3ece5';ctx.font='900 82px sans-serif';ctx.fillText('DEAD AIR',W/2,302);ctx.shadowBlur=0;
    ctx.fillStyle='#70e1c0';ctx.font='bold 17px monospace';ctx.fillText('THE DROWNED RELAY',W/2,342);
    ctx.fillStyle='#b2c0bc';ctx.font='13px monospace';ctx.fillText('Recover three cells. Wake the uplink. Do not let it find you.',W/2,393);
    rounded(W/2-118,444,236,54,4,'#15322d','#70e1c0');ctx.fillStyle='#d7fff0';ctx.font='bold 14px monospace';ctx.fillText('BEGIN DESCENT  →',W/2,477);
    ctx.fillStyle='#788783';ctx.font='10px monospace';ctx.fillText('WASD MOVE     SHIFT SPRINT     Q RESONANCE PULSE     E INTERACT',W/2,545);
    ctx.fillStyle='#cf7366';ctx.fillText('THE PULSE WILL SHOW YOU THE SHAPE OF THE DARK — AND TELL IT WHERE YOU ARE.',W/2,590);
  }
  function endScreen(won){
    ctx.fillStyle='rgba(2,5,7,.82)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';
    ctx.fillStyle=won?'#70e1c0':'#ed6254';ctx.font='11px monospace';ctx.fillText(won?'TRANSMISSION SENT':'FEED LOST',W/2,251);
    ctx.fillStyle='#e2e9e3';ctx.font='900 66px sans-serif';ctx.fillText(won?'YOU MADE IT OUT':'THE STATION KEEPS YOU',W/2,329);
    ctx.fillStyle='#a5b0aa';ctx.font='13px monospace';ctx.fillText(won?'The signal is out. For now.':'The deep has gone quiet again.',W/2,371);
    rounded(W/2-112,426,224,48,4,'#15322d','#70e1c0');ctx.fillStyle='#d7fff0';ctx.font='bold 12px monospace';ctx.fillText('RUN IT AGAIN  ↻',W/2,455);
  }
  function frame(now){
    const dt=Math.min(.04,(now-last)/1000||0);last=now;
    if(state==='playing')update(dt);
    drawWorld();
    if(state==='title')titleScreen();
    if(state==='won'||(state==='lost'&&timeLeft<=0))endScreen(state==='won');
    if(state==='lost'&&timeLeft>0){endScreen(false);ctx.fillStyle='#e77867';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText('PRESS ENTER TO DESCEND AGAIN',W/2,506);}
    requestAnimationFrame(frame);
  }
  reset();state='title';
  requestAnimationFrame(frame);
})();
