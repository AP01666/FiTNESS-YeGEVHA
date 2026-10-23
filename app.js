const EXERCISES = [
  {group:"Chest",name:"Push-ups"},{group:"Chest",name:"Dumbbell floor press"},
  {group:"Arms",name:"Dumbbell curls"},{group:"Arms",name:"Hammer curls"},{group:"Arms",name:"Overhead dumbbell triceps extensions"},
  {group:"Shoulders",name:"Dumbbell shoulder press"},{group:"Shoulders",name:"Lateral raises"},{group:"Shoulders",name:"Reverse fly"},
  {group:"Back",name:"One-arm dumbbell rows"},{group:"Back",name:"Bent-over dumbbell rows"},
  {group:"Legs",name:"Squats"}
];
const STORAGE_KEY = "shadowSystemFitness_v1";
const today = () => new Date().toLocaleDateString("en-CA");
const defaultState = () => ({
  name:"Player", character:"Sung Jin-woo", level:1, xp:0, streak:0, lastDailyDate:null,
  dailyCompletions:{}, bossWins:0, totalDistance:0, boss:{stage:1, unlocked:false, strengthDone:false, runDone:false, completed:false, runDistance:0},
  run:{active:false, startedAt:null, elapsed:0, points:[], distance:0}
});
let state = loadState(), map = null, routeLine = null, positionMarker = null, watchId = null, runTimer = null, runStartPerf = null;

function loadState(){try{return {...defaultState(),...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}}catch{return defaultState()}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function reps(){return 5+(state.level-1)}
const SETS_PER_EXERCISE = 3;
const REP_INTERVAL_SECONDS = 3;
const REST_SECONDS = 30;
let workout = {active:false, paused:false, exerciseIndex:0, set:1, rep:0, phase:"rep", remaining:REP_INTERVAL_SECONDS, timer:null, started:false};
function todayDone(){return state.dailyCompletions[today()]||[]}
function allDailyDone(){return todayDone().length===EXERCISES.length}
function bossUnlocked(){return state.streak>=5 && !state.boss.completed}
function requiredRunKm(){return 2+state.bossWins}
function fmtTime(seconds){const m=Math.floor(seconds/60),s=Math.floor(seconds%60);return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function toast(message){const el=document.getElementById("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400)}
function checkMissedDay(){
  if(!state.lastDailyDate)return;
  const last=new Date(state.lastDailyDate+"T12:00:00"), now=new Date(today()+"T12:00:00");
  const diff=Math.round((now-last)/86400000);
  if(diff>1){state.streak=0;state.boss.unlocked=false;state.boss.stage=1;state.boss.strengthDone=false;state.boss.runDone=false;state.boss.completed=false;state.boss.runDistance=0;saveState()}
}
function render(){
  document.getElementById("hunter-name").textContent=state.name||"Player";
  document.getElementById("hunter-character").textContent=state.character;
  document.getElementById("hunter-avatar").textContent=state.character==="Cha Hae-in"?"CH":"SJ";
  document.getElementById("level-value").textContent=String(state.level).padStart(2,"0");
  document.getElementById("xp-label").textContent=`${state.xp} XP`;
  document.getElementById("xp-bar").style.width=`${state.xp%100}%`;
  document.getElementById("streak-value").textContent=`${state.streak} / 5`;
  document.getElementById("boss-value").textContent=state.bossWins;
  document.getElementById("distance-value").textContent=`${state.totalDistance.toFixed(2)} km`;
  document.getElementById("today-date").textContent=new Date().toLocaleDateString(undefined,{month:"short",day:"numeric"});
  document.getElementById("quest-count").textContent=`${todayDone().length} / ${EXERCISES.length}`;
  document.getElementById("today-xp").textContent=`${todayDone().length===EXERCISES.length?100:todayDone().length*9} / 100 XP`;
  document.getElementById("profile-name").textContent=state.name||"Player";
  document.getElementById("profile-character").textContent=state.character;
  document.getElementById("profile-level").textContent=`${state.level} / 50`;
  document.getElementById("profile-xp").textContent=`${state.xp} XP`;
  document.getElementById("profile-target").textContent=`${reps()} reps × 3 sets`;
  document.getElementById("profile-streak").textContent=`${state.streak} days`;
  document.getElementById("profile-bosses").textContent=state.bossWins;
  renderQuests(); renderBoss();
}
function renderQuests(){
  const done=todayDone();let html="",currentGroup="";
  EXERCISES.forEach((ex,i)=>{
    if(ex.group!==currentGroup){currentGroup=ex.group;html+=`<h3 class="group-title">${currentGroup}</h3>`}
    const isDone=done.includes(i);
    html+=`<div class="quest-item ${isDone?"done":""}"><span class="check-button" aria-hidden="true">${isDone?"✓":"•"}</span><div class="quest-copy"><strong>${escapeHTML(ex.name)}</strong><small>${reps()} reps × ${SETS_PER_EXERCISE} sets · ${reps()*SETS_PER_EXERCISE} total reps</small></div><span class="quest-xp">${isDone?"✓ DONE":"+9 XP"}</span></div>`;
  });
  document.getElementById("quest-list").innerHTML=html;
  const notice=document.getElementById("daily-notice");
  if(allDailyDone())notice.textContent="All daily exercises complete. You earned 100 XP for today. Keep your streak going.";
  else notice.textContent="Use Guided Daily Workout to complete exercises. Reps are counted automatically every 3 seconds, with 30-second rests.";
  const launch=document.getElementById("workout-launch-panel");
  const startBtn=document.getElementById("start-workout");
  if(allDailyDone()){launch.classList.add("hidden");document.getElementById("guided-workout").classList.add("hidden")}
  else {launch.classList.toggle("hidden",workout.active);startBtn.textContent=done.length?"CONTINUE WORKOUT":"START WORKOUT"}
}
function completeExercise(index){
  const done=todayDone();if(done.includes(index))return;
  done.push(index);state.dailyCompletions[today()]=done;state.xp+=9;
  if(done.length===EXERCISES.length){
    state.xp+=1;
    if(state.lastDailyDate!==today()){
      const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
      const yesterdayKey=yesterday.toLocaleDateString("en-CA");
      state.streak=state.lastDailyDate===yesterdayKey?state.streak+1:1;
      state.lastDailyDate=today();
      if(state.streak>=5&&!state.boss.completed){state.boss.unlocked=true;toast("Five-day streak reached. Boss Gate unlocked!")}
      else toast("Daily quests complete. Streak recorded.");
    }else toast("Daily quests complete.");
  }
  saveState();render();
}
function workoutTick(){
  if(!workout.active||workout.paused)return;
  workout.remaining--;
  if(workout.phase==="rep"){
    if(workout.remaining<=0){
      workout.rep++;
      document.getElementById("workout-rep-count").textContent=workout.rep;
      if(workout.rep>=reps()){
        if(workout.set>=SETS_PER_EXERCISE){
          completeExercise(workout.exerciseIndex);
          if(workout.exerciseIndex>=EXERCISES.length-1||allDailyDone()){finishWorkout();return}
          workout.exerciseIndex++;workout.set=1;beginRest("Exercise complete. Rest before the next exercise.");return;
        }
        workout.set++;beginRest("Set complete. Recover before the next set.");return;
      }
      workout.remaining=REP_INTERVAL_SECONDS;
    }
  } else if(workout.phase==="rest"){
    if(workout.remaining<=0){workout.phase="rep";workout.rep=0;workout.remaining=REP_INTERVAL_SECONDS;document.getElementById("workout-rest-panel").classList.add("hidden");document.querySelector(".rep-counter").classList.remove("hidden");document.getElementById("workout-phase").textContent="WORK";document.getElementById("workout-message").textContent="Follow the rep counter. One rep every 3 seconds.";updateWorkoutUI();}
    else document.getElementById("workout-rest-time").textContent=fmtTime(workout.remaining);
  }
  if(workout.phase==="rep"){
    document.getElementById("workout-countdown").textContent=`Next rep in ${workout.remaining} second${workout.remaining===1?"":"s"}`;
    updateWorkoutUI();
  }
}
function beginRest(message){
  workout.phase="rest";workout.remaining=REST_SECONDS;
  document.querySelector(".rep-counter").classList.add("hidden");document.getElementById("workout-rest-panel").classList.remove("hidden");
  document.getElementById("workout-rest-time").textContent=fmtTime(REST_SECONDS);document.getElementById("workout-phase").textContent="REST";document.getElementById("workout-message").textContent=message;updateWorkoutUI();
}
function updateWorkoutUI(){
  const ex=EXERCISES[workout.exerciseIndex];
  document.getElementById("workout-group").textContent=ex.group.toUpperCase();document.getElementById("workout-exercise").textContent=ex.name;
  document.getElementById("workout-set").textContent=`${workout.set} / ${SETS_PER_EXERCISE}`;document.getElementById("workout-target").textContent=reps();
  document.getElementById("workout-rep-count").textContent=workout.rep;
  const completed=todayDone().length;const pct=((completed+(workout.set-1)/SETS_PER_EXERCISE)/EXERCISES.length)*100;
  document.getElementById("workout-progress").style.width=`${Math.min(100,pct)}%`;
}
function startWorkout(){
  if(allDailyDone()){toast("Today's workout is already complete.");return}
  if(!workout.started){workout.exerciseIndex=EXERCISES.findIndex((_,i)=>!todayDone().includes(i));workout.set=1;workout.rep=0;workout.phase="rep";workout.remaining=REP_INTERVAL_SECONDS;workout.started=true}
  workout.active=true;workout.paused=false;document.getElementById("workout-launch-panel").classList.add("hidden");document.getElementById("guided-workout").classList.remove("hidden");
  document.getElementById("workout-rest-panel").classList.toggle("hidden",workout.phase!=="rest");document.querySelector(".rep-counter").classList.toggle("hidden",workout.phase==="rest");
  document.getElementById("pause-workout").textContent="PAUSE TIMER";document.getElementById("workout-phase").textContent=workout.phase==="rest"?"REST":"WORK";
  document.getElementById("workout-message").textContent=workout.phase==="rest"?"Recover. The next set starts automatically.":"Follow the counter. One rep is counted every 3 seconds.";
  updateWorkoutUI();clearInterval(workout.timer);workout.timer=setInterval(workoutTick,1000);
}
function finishWorkout(){
  clearInterval(workout.timer);workout.active=false;workout.paused=false;workout.started=false;
  document.getElementById("guided-workout").classList.add("hidden");document.getElementById("workout-launch-panel").classList.add("hidden");
  document.getElementById("workout-progress").style.width="100%";render();toast("Daily workout complete. +100 XP earned!");
}
document.getElementById("start-workout").addEventListener("click",startWorkout);
document.getElementById("pause-workout").addEventListener("click",()=>{
  if(!workout.active)return;workout.paused=!workout.paused;
  document.getElementById("pause-workout").textContent=workout.paused?"RESUME WORKOUT":"PAUSE TIMER";
  document.getElementById("workout-phase").textContent=workout.paused?"PAUSED":(workout.phase==="rest"?"REST":"WORK");
  document.getElementById("workout-message").textContent=workout.paused?"Timer paused. Resume when ready.":(workout.phase==="rest"?"Recover. The next set starts automatically.":"Follow the counter. One rep every 3 seconds.");
});
function renderBoss(){
  const unlocked=bossUnlocked()||state.boss.unlocked;
  document.getElementById("boss-locked").classList.toggle("hidden",unlocked||state.boss.completed);
  document.getElementById("boss-stage-one").classList.toggle("hidden",!unlocked||state.boss.stage!==1||state.boss.completed);
  document.getElementById("boss-stage-two").classList.toggle("hidden",!unlocked||state.boss.stage!==2||state.boss.completed);
  document.getElementById("boss-complete").classList.toggle("hidden",!state.boss.completed);
  document.getElementById("boss-title").textContent=`Boss Gate: Stage ${state.boss.stage}`;
  document.getElementById("boss-description").textContent=state.boss.completed?"Boss defeated. Claim your reward to advance.":unlocked?"The gate is open. Complete both stages to claim victory.":"Build a five-day streak to unlock the gate.";
  document.getElementById("lock-message").textContent=`You have ${state.streak} of 5 consecutive days. Complete all daily quests each day.`;
  document.getElementById("streak-bar").style.width=`${Math.min(100,state.streak/5*100)}%`;
  document.getElementById("boss-workout-list").innerHTML=EXERCISES.map(ex=>`<div class="boss-workout-item"><span>${escapeHTML(ex.name)}</span><strong>${reps()*9} total reps</strong></div>`).join("");
  document.getElementById("complete-strength-boss").disabled=state.boss.strengthDone;
  document.getElementById("run-target").textContent=requiredRunKm().toFixed(1);
  document.getElementById("boss-record").textContent=state.bossWins?`${state.bossWins} boss${state.bossWins===1?"":"es"} defeated. Next run target: ${requiredRunKm().toFixed(1)} km.`:"No bosses defeated yet.";
  document.getElementById("boss-complete-message").textContent=`You cleared both stages. +300 XP and Level ${Math.min(50,state.level+1)} are ready to claim.`;
  document.getElementById("claim-boss").textContent=state.level>=50?"CLAIM 300 XP":"CLAIM 300 XP & NEXT LEVEL";
}
function setTab(name){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  document.querySelectorAll(".tab-page").forEach(p=>p.classList.toggle("hidden",p.id!==`tab-${name}`));
  if(name==="boss")setTimeout(initMap,100);
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
document.getElementById("settings-open").addEventListener("click",()=>{
  document.getElementById("input-name").value=state.name==="Player"?"":state.name;
  document.getElementById("input-character").value=state.character;
  document.getElementById("settings-dialog").showModal();
});
document.getElementById("save-settings").addEventListener("click",e=>{
  e.preventDefault();const name=document.getElementById("input-name").value.trim();
  if(!name){toast("Enter a hunter name first.");return}
  state.name=name;state.character=document.getElementById("input-character").value;saveState();document.getElementById("settings-dialog").close();render();toast("Hunter profile saved.");
});
document.getElementById("complete-strength-boss").addEventListener("click",()=>{
  if(state.boss.strengthDone)return;
  state.boss.strengthDone=true;state.boss.stage=2;saveState();render();toast("Strength stage cleared. Begin the GPS trial.");
  setTimeout(initMap,100);
});
document.getElementById("claim-boss").addEventListener("click",()=>{
  if(!state.boss.completed)return;
  state.xp+=300;state.bossWins+=1;
  if(state.level<50)state.level+=1;
  state.streak=0;state.lastDailyDate=null;
  state.boss={stage:1,unlocked:false,strengthDone:false,runDone:false,completed:false,runDistance:0};
  saveState();render();setTab("quests");toast("Boss reward claimed: +300 XP!");
});
document.getElementById("reset-data").addEventListener("click",()=>{
  clearInterval(workout.timer);workout={active:false,paused:false,exerciseIndex:0,set:1,rep:0,phase:"rep",remaining:REP_INTERVAL_SECONDS,timer:null,started:false};
  if(confirm("This permanently clears your saved level, XP, streak, and records on this device. Continue?")){
    stopRun(false);state=defaultState();saveState();render();setTab("quests");toast("System data reset.");
  }
});
function initMap(){
  if(!window.L){document.getElementById("gps-status").textContent="Map library did not load. Connect to the internet and reload.";return}
  if(map)return;
  map=L.map("run-map").setView([-19.45,29.82],13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
  routeLine=L.polyline([],{color:"#53e7ff",weight:5}).addTo(map);
  setTimeout(()=>map.invalidateSize(),150);
}
function haversine(a,b){
  const R=6371000,rad=x=>x*Math.PI/180,lat1=rad(a.lat),lat2=rad(b.lat),dLat=rad(b.lat-a.lat),dLon=rad(b.lng-a.lng);
  const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function updateRunUI(){
  document.getElementById("run-distance").textContent=`${(state.run.distance/1000).toFixed(2)} km`;
  document.getElementById("run-time").textContent=fmtTime(state.run.elapsed);
  if(routeLine)routeLine.setLatLngs(state.run.points.map(p=>[p.lat,p.lng]));
  if(map&&state.run.points.length){const p=state.run.points[state.run.points.length-1];map.setView([p.lat,p.lng],Math.max(map.getZoom(),15));if(positionMarker)positionMarker.setLatLng([p.lat,p.lng]);else positionMarker=L.circleMarker([p.lat,p.lng],{radius:7,color:"#53e7ff",fillOpacity:1}).addTo(map)}
}
function startRun(){
  if(!navigator.geolocation){toast("This browser does not support GPS.");return}
  if(!window.isSecureContext){toast("GPS needs HTTPS. Deploy the app to GitHub Pages first.");return}
  initMap();
  state.run={active:true,startedAt:Date.now(),elapsed:0,points:[],distance:0};saveState();
  document.getElementById("start-run").disabled=true;document.getElementById("stop-run").disabled=false;
  document.getElementById("gps-status").textContent="Waiting for GPS signal…";
  runStartPerf=Date.now();
  runTimer=setInterval(()=>{state.run.elapsed=Math.floor((Date.now()-runStartPerf)/1000);document.getElementById("run-time").textContent=fmtTime(state.run.elapsed)},1000);
  watchId=navigator.geolocation.watchPosition(pos=>{
    const p={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy};
    if(p.accuracy>60){document.getElementById("gps-status").textContent=`GPS accuracy is low (${Math.round(p.accuracy)} m). Waiting for a better signal.`;return}
    const points=state.run.points;
    if(points.length){const last=points[points.length-1],d=haversine(last,p);if(d<3||d>150) return;state.run.distance+=d}
    points.push(p);document.getElementById("gps-status").textContent=`GPS active · accuracy ${Math.round(p.accuracy)} m`;updateRunUI();
    if(state.run.distance>=requiredRunKm()*1000)finishRun();
  },err=>{
    document.getElementById("gps-status").textContent=({1:"Location permission denied. Allow location access in Safari settings.",2:"GPS position unavailable. Move outdoors and try again.",3:"GPS request timed out. Keep the page open and try again."})[err.code]||"GPS error.";
  },{enableHighAccuracy:true,maximumAge:1000,timeout:20000});
}
function stopRun(completed=false){
  if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null}
  if(runTimer){clearInterval(runTimer);runTimer=null}
  state.run.active=false;document.getElementById("start-run").disabled=false;document.getElementById("stop-run").disabled=true;
  if(!completed)document.getElementById("gps-status").textContent="Run paused/stopped. Your recorded distance remains on screen until you leave this boss stage.";
  saveState();
}
function finishRun(){
  if(state.boss.runDone)return;
  stopRun(true);
  state.boss.runDone=true;state.boss.runDistance=state.run.distance/1000;state.totalDistance+=state.boss.runDistance;
  state.boss.completed=true;saveState();render();toast("GPS distance reached. Boss gate cleared!");
}
document.getElementById("start-run").addEventListener("click",startRun);
document.getElementById("stop-run").addEventListener("click",()=>stopRun(false));
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}))}
checkMissedDay();render();
