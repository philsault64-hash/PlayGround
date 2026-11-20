import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const $ = (s) => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d8d1');
scene.fog = new THREE.Fog('#a9d8d1', 18, 38);
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .1, 100);
camera.position.set(0, 7.2, 19.5);
camera.lookAt(0, 1.6, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: $('#scene') });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
const hemi = new THREE.HemisphereLight('#f7ffd9', '#547451', 2.1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0c1', 3.2); sun.position.set(-5, 10, 7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
const fill = new THREE.DirectionalLight('#b7eaff', 1.1); fill.position.set(6, 4, -5); scene.add(fill);
const mat = (color, roughness=.8) => new THREE.MeshStandardMaterial({ color, roughness });
const mats = { grass:mat('#76a866'), grass2:mat('#91bb72'), path:mat('#e6c982'), dark:mat('#253a38'), gold:mat('#f3c94f'), cream:mat('#fff0a7'), red:mat('#e4744e'), green:mat('#429a69'), mint:mat('#92d4bd'), stone:mat('#81978c'), white:mat('#fffaf0'), black:mat('#263b3b') };
const ground = new THREE.Mesh(new THREE.CircleGeometry(22, 72), mats.grass); ground.rotation.x=-Math.PI/2; ground.position.y=-.12; ground.receiveShadow=true; scene.add(ground);
const meadow = new THREE.Mesh(new THREE.CircleGeometry(17, 72), mats.grass2); meadow.rotation.x=-Math.PI/2; meadow.position.y=-.1; scene.add(meadow);
const path = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.8, .14, 48), mats.path); path.scale.set(1.75,1,1); path.position.set(0,-.02,0); path.receiveShadow=true; scene.add(path);
const addMesh=(parent,geo,material,pos,scale,rot)=>{const o=new THREE.Mesh(geo,material);o.position.set(...pos);if(scale)o.scale.set(...scale);if(rot)o.rotation.set(...rot);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
// Hand-shaped, low-poly woodland clearing, with layered hills and stonework.
for(let i=0;i<18;i++) {const a=i/18*Math.PI*2;const r=13+(i%3)*1.2;addMesh(scene,new THREE.IcosahedronGeometry(1,1),i%2?mats.grass:mats.green,[Math.cos(a)*r,-.15+((i%3)*.06),Math.sin(a)*r],[2.5+(i%4)*.35,1.1+(i%2)*.4,1.9+(i%3)*.3]);}
for(let i=0;i<22;i++){let x=(Math.random()-.5)*23,z=(Math.random()-.5)*20;if(Math.abs(x)<4.8&&Math.abs(z)<3.8)continue;const tuft=new THREE.Group();tuft.position.set(x,0,z);scene.add(tuft);addMesh(tuft,new THREE.ConeGeometry(.15,.55,5),i%3?mats.green:mats.gold,[0,.24,0],[1,1,1],[0,Math.random()*6,0]);}
function tree(x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);addMesh(g,new THREE.CylinderGeometry(.13*s,.22*s,1.4*s,7),mat('#755a40'),[0,.65*s,0]);addMesh(g,new THREE.ConeGeometry(1.05*s,1.8*s,7),mat('#397958'),[0,1.8*s,0]);addMesh(g,new THREE.ConeGeometry(.76*s,1.45*s,7),mat('#5a9a62'),[0,2.55*s,0]);addMesh(g,new THREE.IcosahedronGeometry(.22*s,0),mats.gold,[-.5*s,2.4*s,.2*s]);}
[[-8,-5,1.3],[-10,1,1],[-7,6,1.6],[7,6,1.7],[10,1,1.1],[8,-6,1.4]].forEach(v=>tree(...v));
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;addMesh(scene,new THREE.DodecahedronGeometry(.4+(i%3)*.14),i%2?mats.white:mats.stone,[Math.cos(a)*5.5,.16,Math.sin(a)*3.3],[1,.65,1],[0,a,0]);}
function blob(parent,material,pos,scale,detail=2){return addMesh(parent,new THREE.IcosahedronGeometry(1,detail),material,pos,scale)}
function makeKit(){const g=new THREE.Group();
 blob(g,mats.gold,[0,1.02,0],[.78,.85,.66],2);blob(g,mats.cream,[0,.78,.48],[.46,.48,.28],2);
 const earL=blob(g,mats.gold,[-.47,1.88,-.02],[.22,.7,.21],1);earL.rotation.z=-.22;const earR=blob(g,mats.gold,[.47,1.88,-.02],[.22,.7,.21],1);earR.rotation.z=.22;
 blob(g,mats.dark,[-.47,2.36,-.01],[.22,.22,.21],1);blob(g,mats.dark,[.47,2.36,-.01],[.22,.22,.21],1);
 blob(g,mats.dark,[-.28,1.3,.57],[.085,.14,.07],1);blob(g,mats.dark,[.28,1.3,.57],[.085,.14,.07],1);blob(g,mats.white,[-.3,1.35,.63],[.025,.04,.02],1);blob(g,mats.white,[.26,1.35,.63],[.025,.04,.02],1);
 // iconic zig-zag tail made from chunky extruded geometry
 const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(.55,.14);sh.lineTo(.55,.44);sh.lineTo(1.05,.44);sh.lineTo(1.05,.83);sh.lineTo(.55,.7);sh.lineTo(.55,.44);sh.lineTo(.1,.35);sh.closePath();
 const tail=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.13,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.06,bevelThickness:.05}),mats.gold);tail.position.set(.5,.2,-.25);tail.rotation.y=-.2;tail.castShadow=true;g.add(tail);blob(g,mats.dark,[1.52,1.04,-.2],[.12,.2,.11],1);
 for(const x of [-.42,.42]){blob(g,mats.gold,[x,.4,.06],[.24,.4,.24],1);blob(g,mats.dark,[x,.12,.1],[.28,.13,.28],1)}
 blob(g,mats.red,[-.54,1.08,.34],[.17,.13,.07],1);blob(g,mats.red,[.54,1.08,.34],[.17,.13,.07],1);
 g.position.set(-4.2,0,.4);return g;}
let hero=makeKit();scene.add(hero);
function makeEnemy(type){const g=new THREE.Group();if(type===0){blob(g,mats.green,[0,.82,0],[.82,.74,.72],2);blob(g,mats.mint,[0,.48,.52],[.48,.3,.28],1);for(let x of [-.5,.5]){const horn=addMesh(g,new THREE.ConeGeometry(.22,.7,5),mats.gold,[x,1.64,0]);horn.rotation.z=x<0?.35:-.35;}blob(g,mats.dark,[-.27,.95,.62],[.07,.12,.06],1);blob(g,mats.dark,[.27,.95,.62],[.07,.12,.06],1);blob(g,mats.green,[-.62,.35,.08],[.25,.25,.25],1);blob(g,mats.green,[.62,.35,.08],[.25,.25,.25],1)}
 else if(type===1){blob(g,mat('#d6a86d'),[0,.9,0],[.76,.82,.67],2);blob(g,mat('#f3dfb2'),[0,.58,.48],[.42,.45,.26],2);for(let x of [-.47,.47])blob(g,mat('#bd8154'),[x,1.68,-.08],[.22,.62,.18],1);blob(g,mats.dark,[-.25,1.05,.58],[.07,.12,.06],1);blob(g,mats.dark,[.25,1.05,.58],[.07,.12,.06],1);blob(g,mats.gold,[.54,.6,.05],[.6,.15,.13],1)}
 else if(type===2){blob(g,mat('#e98250'),[0,.78,0],[.78,.74,.7],2);blob(g,mats.red,[0,.42,.46],[.36,.3,.22],1);for(let x of [-.44,.44]){let ear=blob(g,mat('#e98250'),[x,1.5,0],[.3,.48,.2],1);ear.rotation.z=x<0?.5:-.5;}const flame=addMesh(g,new THREE.ConeGeometry(.27,.75,6),mats.gold,[.15,1.72,-.3]);flame.rotation.z=-.2;blob(g,mats.dark,[-.28,.98,.58],[.07,.11,.06],1);blob(g,mats.dark,[.28,.98,.58],[.07,.11,.06],1)}
 else{blob(g,mat('#64aeda'),[0,.8,0],[.86,.68,.78],2);blob(g,mat('#f3e7c7'),[0,.51,.55],[.51,.35,.26],1);const shell=blob(g,mat('#5285b2'),[0,1.02,-.35],[.7,.73,.35],2);shell.rotation.x=-.25;for(let x of [-.6,.6])blob(g,mat('#64aeda'),[x,.34,0],[.28,.2,.43],1);blob(g,mats.dark,[-.28,1.03,.62],[.07,.12,.06],1);blob(g,mats.dark,[.28,1.03,.62],[.07,.12,.06],1)}
 g.position.set(4.2,0,-.15);return g;}
const enemyNames=['MOSS HORN','DUSK KIT','EMBER CUB','TIDAL SHELL'];
const cards=[{name:'Tackle',cost:1,art:'✦',cls:'',desc:'Deal 6 damage',kind:'damage',value:6},{name:'Growl',cost:1,art:'❋',cls:'green',desc:'Gain 5 guard',kind:'block',value:5},{name:'Quick Step',cost:1,art:'➤',cls:'blue',desc:'Deal 4 · draw 1',kind:'quick',value:4},{name:'Bite',cost:2,art:'✹',cls:'red',desc:'Deal 10 damage',kind:'damage',value:10},{name:'Sunseed',cost:1,art:'✿',cls:'green',desc:'Heal 5 HP',kind:'heal',value:5}];
let state;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function start(){if(enemy)scene.remove(enemy);state={floor:1,score:0,phase:'player',player:{hp:80,max:80,guard:0,energy:3,deck:shuffle([0,0,1,1,2,3,4,0,2,1]),draw:[],discard:[],hand:[]},enemy:null};newFloor(true)}
let enemy;
function newFloor(initial=false){const n=Math.min(state.floor-1,3),bonus=(state.floor-1)*5;state.phase='player';state.enemy={name:enemyNames[n],hp:[58,66,74,86][n]+bonus,max:[58,66,74,86][n]+bonus,damage:[8,10,12,14][n]+Math.floor(state.floor/2)};if(enemy)scene.remove(enemy);enemy=makeEnemy(n);scene.add(enemy);state.player.guard=0;state.player.energy=3;state.player.draw=shuffle([...state.player.deck]);state.player.discard=[];state.player.hand=[];draw(5);state.log=initial?'A curious challenger blocks the trail.':'A new challenger approaches!';renderUI()}
function draw(n){const p=state.player;while(n--&&p.hand.length<7){if(!p.draw.length){if(!p.discard.length)break;p.draw=shuffle(p.discard);p.discard=[]}p.hand.push(p.draw.shift())}}
function drawPortrait(canvas, kind){const c=canvas.getContext('2d');const w=canvas.width=160,h=canvas.height=160;c.clearRect(0,0,w,h);c.fillStyle=kind==='kit'?'#d8e6a3':'#a8ddd0';c.fillRect(0,0,w,h);c.fillStyle=kind==='kit'?'#f3c94f':'#429a69';c.beginPath();c.ellipse(80,94,49,46,0,0,Math.PI*2);c.fill();if(kind==='kit'){c.beginPath();c.moveTo(42,65);c.lineTo(34,12);c.lineTo(68,52);c.fill();c.beginPath();c.moveTo(118,65);c.lineTo(126,12);c.lineTo(92,52);c.fill();c.fillStyle='#253a38';c.fillRect(31,12,12,20);c.fillRect(117,12,12,20)}else{c.fillStyle='#f3c94f';c.beginPath();c.moveTo(49,58);c.lineTo(59,18);c.lineTo(73,54);c.fill();c.moveTo(111,58);c.lineTo(101,18);c.lineTo(87,54);c.fill()}c.fillStyle='#263b3b';c.beginPath();c.arc(63,84,6,0,Math.PI*2);c.arc(97,84,6,0,Math.PI*2);c.fill();c.fillStyle=kind==='kit'?'#fff0a7':'#92d4bd';c.beginPath();c.ellipse(80,105,24,17,0,0,Math.PI*2);c.fill()}
function renderUI(){const p=state.player,e=state.enemy;drawPortrait($('#playerPortrait'),'kit');drawPortrait($('#enemyPortrait'),state.floor===1?'enemy':'enemy');$('#floor').textContent=`${String(state.floor).padStart(2,'0')} / 04`;$('#score').textContent=state.score;$('#enemyName').textContent=e.name;$('#playerHp').textContent=`${p.hp} / ${p.max}`;$('#enemyHp').textContent=`${e.hp} / ${e.max}`;$('#playerBar').style.width=`${100*p.hp/p.max}%`;$('#enemyBar').style.width=`${100*e.hp/e.max}%`;$('#log').textContent=state.log;$('#energy').innerHTML=Array.from({length:3},(_,i)=>`<span class="orb ${i>=p.energy?'used':''}">${i<p.energy?'✦':''}</span>`).join('');$('#hand').innerHTML=p.hand.map((id,i)=>{const c=cards[id];return `<button class="card ${c.cls}" data-index="${i}" ${c.cost>p.energy||state.phase!=='player'?'disabled':''}><span class="card-cost">${c.cost}</span><div class="card-title">${c.name}</div><div class="card-model">${c.art}</div><div class="card-desc">${c.desc}</div></button>`}).join('');document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>playCard(+b.dataset.index));$('#endTurn').disabled=state.phase!=='player';$('#endTurn').onclick=endTurn}
function flash(obj){obj?.traverse(o=>{if(o.isMesh&&o.material?.emissive){o.material.emissive.set('#ffffff');setTimeout(()=>o.material.emissive.set('#000000'),140)}})}
function playCard(i){const p=state.player,c=cards[p.hand[i]];if(state.phase!=='player'||state.enemy.hp<=0||!c||c.cost>p.energy)return;p.energy-=c.cost;p.discard.push(p.hand.splice(i,1)[0]);if(c.kind==='damage'||c.kind==='quick'){state.enemy.hp=Math.max(0,state.enemy.hp-c.value);state.log=`Kit used ${c.name} — ${c.value} damage!`;hero.position.x+=.45;setTimeout(()=>hero.position.x=-4.2,180);flash(enemy)}if(c.kind==='block'){p.guard+=c.value;state.log=`Kit braced for ${c.value} damage.`}if(c.kind==='heal'){p.hp=Math.min(p.max,p.hp+c.value);state.log='A sunseed restored 5 HP.'}if(c.kind==='quick')draw(1);if(state.enemy.hp<=0)state.phase='resolving';renderUI();if(state.enemy.hp<=0)setTimeout(win,450)}
function endTurn(){if(state.phase!=='player')return;state.phase='enemy';const p=state.player;p.discard.push(...p.hand);p.hand=[];const hit=Math.max(0,state.enemy.damage-p.guard);p.guard=Math.max(0,p.guard-state.enemy.damage);p.hp=Math.max(0,p.hp-hit);state.log=`${state.enemy.name} strikes for ${hit} damage!`;if(p.hp<=0)state.phase='resolving';renderUI();if(p.hp<=0){setTimeout(()=>finish(false),400);return}setTimeout(()=>{if(state.phase!=='enemy')return;p.energy=3;draw(5);state.phase='player';state.log='Your move — plan the next strike.';renderUI()},500)}
function win(){if(state.phase==='choice'||state.phase==='finished')return;if(state.floor===4){finish(true);return}state.phase='choice';state.score+=100;const names=['Sproutling','Moonfox','Emberkin','Shellback'];const icons=['❋','✦','♨','◉'];const chance=78-state.floor*7;modal(`TRAIL CLEARED`, `<p>A wild <b>${names[state.floor-1]}</b> is watching from the brush.</p><div class="choices"><button class="choice" id="catch"><b>${icons[state.floor-1]}</b><strong>Recruit · ${chance}%</strong><small>Add a move to your deck</small><span class="catchbar"><i style="width:${chance}%"></i></span></button><button class="choice" id="skip"><b>➜</b><strong>Keep hiking</strong><small>Restore 15 HP</small></button></div>`);$('#catch').onclick=()=>{if(Math.random()*100<chance){state.player.deck.push([0,2,3,1][state.floor-1]);state.log=`${names[state.floor-1]} joined your team!`;state.score+=50}else state.log=`The wild ${names[state.floor-1]} slipped away.`;advance()};$('#skip').onclick=()=>{state.log='You caught your breath on the trail.';advance()}}
function advance(){state.player.hp=Math.min(state.player.max,state.player.hp+15);state.floor++;$('#modal').classList.add('hidden');newFloor()}
function modal(title,content){$('#modal').innerHTML=`<div class="panel"><h1>${title}</h1>${content}</div>`;$('#modal').classList.remove('hidden')}
function finish(won){state.phase='finished';modal(won?'WILDSPIRE CHAMPION':'THE TRAIL ENDS',`<p>${won?'You mastered the trail and earned':'Your team collected'} <b>${state.score} crystals.</b></p><button class="choice" id="restart"><b>${won?'✦':'↻'}</b><strong>Play again</strong></button>`);$('#restart').onclick=()=>{$('#modal').classList.add('hidden');start()}}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);const small=innerWidth<700;camera.position.set(0,small?8.3:7.2,small?23:19.5);camera.lookAt(0,1.45,0)}
window.addEventListener('resize',resize);resize();
function animate(t){requestAnimationFrame(animate);if(hero)hero.position.y=.045*Math.sin(t*.0025);if(enemy)enemy.position.y=.07*Math.sin(t*.002+1);renderer.render(scene,camera)}
let fallback=false;try{renderer.render(scene,camera)}catch(e){fallback=true;console.warn('3D rendering unavailable',e)}
start();animate(0);
