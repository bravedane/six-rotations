// This wraps the ORIGINAL preseason-survey.html content byte-for-byte for design/wording.
// No sign-in required — the player types his own name and UCI email directly into the
// form (Rotation 1), and that's what gets saved. Low-friction by design: open the link,
// fill it out, submit. The email format check also accepts the admin's own address, so
// Dane can test the exact player flow as himself before any player sees it.

export function getPreseasonHtml(authEmail: string, adminEmail: string): string {
  const html = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Six Rotations Check-In</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;800&family=Public+Sans:wght@400;500;600&display=swap">
<style>
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}
[hidden]{display:none!important}
/* Layout: one rotation per screen, court-line progress rail on top, sticky next/back bar at bottom */
:root{
  --bg:#f3f6fa; --surface:#ffffff; --ink:#0d1e33; --muted:#566377; --line:#d5dde8;
  --blue:#0064a4; --gold:#ffd200; --gold-ink:#0d1e33; --chip:#eaf0f7; --chip-on:#0064a4; --chip-on-ink:#fff;
  --display:"Saira Condensed","Arial Narrow",Impact,sans-serif;
  --body:"Public Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#0a1524; --surface:#111f33; --ink:#e8eef6; --muted:#9aa9bd; --line:#24364f;
  --blue:#4ea3e0; --gold:#ffd84a; --gold-ink:#0a1524; --chip:#1a2c45; --chip-on:#4ea3e0; --chip-on-ink:#06111e; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#0a1524; --surface:#111f33; --ink:#e8eef6; --muted:#9aa9bd; --line:#24364f;
  --blue:#4ea3e0; --gold:#ffd84a; --gold-ink:#0a1524; --chip:#1a2c45; --chip-on:#4ea3e0; --chip-on-ink:#06111e; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.5;
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px 120px}
.wrap{max-width:620px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
header{display:flex;flex-direction:column;gap:12px}
.eyebrow{font-family:var(--display);font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:14px;color:var(--blue)}
.rail{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
.rail button{all:unset;cursor:pointer;height:8px;border-radius:2px;background:var(--line)}
.rail button.done{background:var(--blue)}
.rail button.now{background:var(--gold)}
.rail button:focus-visible{outline:2px solid var(--blue);outline-offset:3px}
h1{font-family:var(--display);font-weight:800;font-size:clamp(34px,8vw,48px);line-height:1;margin:0;text-wrap:balance;text-transform:uppercase}
.lede{color:var(--muted);margin:0;max-width:60ch}
.q{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:18px;display:flex;flex-direction:column;gap:12px}
.q.trust{border-left:4px solid var(--gold)}
.q.trust p{margin:0;max-width:60ch}
.q h2{font-size:17px;font-weight:600;margin:0;text-wrap:balance}
.q .hint{font-size:14px;color:var(--muted);margin:-6px 0 0}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{all:unset;cursor:pointer;padding:9px 13px;border-radius:999px;background:var(--chip);font-size:15px;line-height:1.25;border:1px solid transparent}
.chip[aria-pressed="true"]{background:var(--chip-on);color:var(--chip-on-ink);font-weight:600}
.chip:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.chip.full{opacity:.45;cursor:not-allowed}
.chip .tag{display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.75;margin-top:2px;font-weight:600}
.lens{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--muted)}
.lens b{color:var(--ink);font-weight:600}
input[type=text],textarea{width:100%;font:inherit;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:11px 12px}
textarea{min-height:76px;resize:vertical}
input:focus-visible,textarea:focus-visible{outline:2px solid var(--blue);outline-offset:1px}
.scale{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 12px;align-items:center}
.scale .lab{font-size:15px;min-width:0}
.scale .lab small{display:block;color:var(--muted);font-size:13px}
.dots{display:flex;gap:6px}
.dot{all:unset;cursor:pointer;width:34px;height:34px;border-radius:6px;background:var(--chip);display:grid;place-items:center;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}
.dot[aria-pressed="true"]{background:var(--blue);color:var(--chip-on-ink)}
.dot:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.legend{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
@media (max-width:420px){.scale{grid-template-columns:1fr}.dots{justify-content:space-between}.dot{width:44px}}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line);
  padding-top:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.bar .in{max-width:620px;margin:0 auto;display:flex;gap:10px;align-items:center}
.btn{all:unset;cursor:pointer;padding:13px 20px;border-radius:8px;font-weight:600;font-size:16px;text-align:center}
.btn.primary{background:var(--gold);color:var(--gold-ink);flex:1;font-family:var(--display);font-size:20px;letter-spacing:.06em;text-transform:uppercase;padding-block:10px}
.btn.ghost{color:var(--muted)}
.btn:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.btn[disabled]{opacity:.4;cursor:default}
.actions{display:flex;gap:10px;flex-wrap:wrap}
.btn.outline{border:1px solid var(--line);color:var(--ink);padding:11px 16px;font-size:15px}
.northstar{font-family:var(--display);font-weight:600;text-transform:uppercase;letter-spacing:.1em;font-size:15px;color:var(--blue);margin:8px 0 0}
.err{color:#c0392b;font-size:14px;margin:0}
pre.summary{white-space:pre-wrap;word-break:break-word;font-family:var(--body);font-size:14px;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:14px;margin:0;max-height:none}
.note{font-size:14px;color:var(--muted);margin:0}
@media (prefers-reduced-motion:no-preference){.step{animation:in .25s ease-out}@keyframes in{from{transform:translateY(6px)}to{transform:none}}}
</style>

</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow" id="eyebrow">Rotation 1 of 6</div>
    <nav class="rail" id="rail" aria-label="Progress"></nav>
  </header>
  <main id="main"></main>
</div>
<div class="bar"><div class="in">
  <button class="btn ghost" id="back" type="button">Back</button>
  <button class="btn primary" id="next" type="button">Next</button>
</div></div>

<script>
const ADMIN_EMAIL=${JSON.stringify(adminEmail.toLowerCase())};
const AG="Agency",CO="Competence",BE="Belonging";
const DRIFT=["Late nights","My phone","Skipping recovery","Habits slip when life gets busy","Pulling away from people","Losing my why","Going through the motions in practice"];
const STORMS=["Playing time not going as hoped","Injury","Hard classes","Money","Family expectations","Life far from home","Relationships","None right now"];
const STEPS=[
 {title:"Preseason — Six Rotations",lede:"6 quick rotations. About 7 minutes. Just between you and Dana.",qs:[
  {id:"privacy",type:"note",label:"Who sees this",paras:["Only Dana. Not Kniff, not the staff."]},
  {id:"name",type:"text",required:true,label:"Your name",ph:"First and last"},
  {id:"email",type:"email",required:true,label:"Your UCI email",ph:"you@uci.edu"},
  {id:"position",type:"pick",max:2,label:"Position",opts:["Outside","Opposite","Middle","Setter","Libero"]},
  {id:"year",type:"pick",max:1,label:"Year",opts:["Freshman","Sophomore","Junior","Senior","Graduate / Fifth year"]},
  {id:"words",type:"pick",max:3,label:"Three words your teammates would use to describe you",hint:"Pick up to 3",opts:["Competitor","Calm","Loud","Funny","Grinder","Quiet","Leader","Intense","Loyal","Creative","Steady","Fiery","Thoughtful","Coachable"]}
 ]},
 {title:"Why you play",lede:"Everybody plays for a mix of reasons. Be honest about yours. Every answer here is a fair one.",qs:[
  {id:"why",type:"pick",max:3,label:"What gets you to practice on a hard day?",hint:"Pick up to 3",opts:["I love the game","Getting better feels good","My teammates","Earning playing time","Proving people wrong","My scholarship","Making my family proud","Being seen as one of the best","Who I'm becoming","Not wanting to let anyone down","Coaches noticing me","Habit. It's just what I do"]},
  {id:"sdt",type:"scale",required:true,legend:["Not true","Very true"],label:"How true is this right now?",items:[
   ["agency","I choose how I spend my day","Not just what the schedule tells me"],
   ["competence","I can see myself getting better","Week to week, not just season to season"],
   ["belonging","I matter to this team","Whether or not I'm on the court"]]},
  {id:"goodday",type:"pick",max:3,label:"On a match day when you don't see the court, what would make it a win for you?",hint:"Pick up to 3",opts:["I got better at one thing this week","I made a teammate better in practice","I prepared like I was starting","My energy lifted the bench","I learned something by watching","I kept a promise to myself","Honestly, it's hard to see a win there"]}
 ]},
 {title:"Where you're at",lede:"Rate each one for the last 30 days. 1 means it's hurting you. 5 means it's a strength.",qs:[
  {id:"scores",type:"scale",required:true,legend:["Hurting","Strength"],items:[
   ["sleep","Sleep","Hours and quality"],["fuel","Fuel","What and when you eat"],["water","Hydration","Water through the day"],
   ["strength","Strength and power","Weight room, explosiveness"],["recovery","Recovery and mobility","Body feels ready"],
   ["focus","Focus","Phone and screens in their place"],["composure","Composure","Bouncing back after an error"],
   ["connection","Connection","Teammates, family, people who know you"]]}
 ]},
 {title:"What you want and where you're going",lede:"Pick goals you can move yourself. Nobody else has to hand them to you.",qs:[
  {id:"wants",type:"pick",max:3,label:"What do you most want to own this season?",hint:"Pick up to 3",opts:["Jump higher","Add lean muscle","Stay healthy all season","One skill I can measure getting better","Sharper in big moments","Consistent every single practice","Sleep and recover like a pro","Less phone, more presence","Better grades","Be the teammate others want next to them","Calmer mind","Ready the moment my name is called"]},
  {id:"going",type:"pick",max:2,label:"After UCI, where do you see yourself?",hint:"Pick up to 2",opts:["Playing pro overseas","National team","Beach volleyball","Coaching","Career outside volleyball","Grad school","Not sure yet"]},
  {id:"knownfor",type:"area",label:"Ten years from now, what do you want teammates to say about who you were here?",ph:"One sentence is plenty"}
 ]},
 {title:"Edges and gaps",lede:"Own what you bring. Name what's missing. Then name the weather.",qs:[
  {id:"adv",type:"pick",max:3,label:"Your unfair advantages",hint:"Pick up to 3",opts:["Vertical / explosiveness","Height and reach","Volleyball IQ","Ball control","Serve","Work ethic","Calm under pressure","Energy that lifts others","Coachability","Endurance","Leadership voice","Consistency","Toughness when tired","Discipline away from the gym"]},
  {id:"gaps",type:"pick",max:3,label:"Where you're leaving the most on the table",hint:"Pick up to 3",opts:["Sleep","Nutrition","Strength in the weight room","Mobility / staying healthy","Phone and screens","Confidence after mistakes","Focus in practice","Consistency day to day","Speaking up","Handling criticism","Time management","Stress / anxiety","Patience with my progress","Keeping up in school","Time with family","Friendships outside volleyball","Serving others"]},
  {id:"gapcost",type:"area",label:"If you could fill one gap, how might it move the needle for you?",ph:"Be specific"},
  {id:"drift",type:"pick",max:3,label:"Where does the drift creep in for you?",hint:"Pick up to 3",opts:DRIFT},
  {id:"storms",type:"pick",max:3,label:"What storms are you facing or expecting?",hint:"Things you can't control. Pick up to 3",opts:STORMS}
 ]},
 {title:"Choose your discomfort",lede:"There's no bad weather, only bad clothes. Your habits are your clothes. These are suggestions, not assignments. Tap the ones you'd actually try.",qs:[
  {id:"habits",type:"pick",max:3,label:"Which daily uncomfortable habits would you try?",hint:"Pick up to 3",opts:[
   ["2-minute cold shower",AG],["Phone out of the bedroom",AG],["Plan tomorrow before bed",AG],["No social media before noon",AG],["Same wake-up time every day",AG],
   ["Track one skill: reps and makes",CO],["100 bodyweight reps a day",CO],["8 hours in bed, same bedtime",CO],["10 minutes of mobility before bed",CO],["Half your bodyweight in ounces of water",CO],["5 minutes of breath work before practice",CO],
   ["Tell one teammate one specific thing he did well",BE],["Ask a coach one real question a day",BE],["Eat one meal a day phone-free with someone",BE],["One hard conversation a week",BE]]},
  {id:"load",type:"pick",max:1,label:"How much can you take on right now?",opts:["One small habit","Two habits","Push me. I'm ready for more"]},
  {id:"when",type:"pick",max:1,label:"When would a new habit stick best?",opts:["First thing in the morning","Before practice","Right after practice","Before bed"]},
  {id:"push",type:"pick",max:1,label:"How do you like to be pushed?",opts:["Straight and direct","Encouragement first","Show me the data","Just check in and let me lead"]},
  {id:"self",type:"scale",required:true,legend:["Not true","Very true"],label:"Last two. Be honest with yourself.",items:[
   ["team","The team is better because I'm on it",""],
   ["future","I'm doing today what my future self will thank me for",""]]}
 ]}
];
const CONFIG={season:${JSON.stringify(process.env.NEXT_PUBLIC_SEASON || "2026-27")},submitUrl:"/api/submit"};
const KEY="***"+CONFIG.season+"-preseason-draft";
let state={};try{state=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
let step=0;try{step=Math.min(+localStorage.getItem(KEY+"-step")||0,STEPS.length)}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem(KEY+"-step",step)}catch(e){}};
const $=s=>document.querySelector(s);
const el=(t,a={},kids=[])=>{const n=document.createElement(t);for(const k in a){if(k==="text")n.textContent=a[k];else n.setAttribute(k,a[k])}kids.forEach(c=>c&&n.append(c));return n};
const optText=o=>Array.isArray(o)?o[0]:o;

function rail(){
  const r=$("#rail");r.innerHTML="";
  STEPS.forEach((s,i)=>{const b=el("button",{type:"button","aria-label":"Rotation "+(i+1)+": "+s.title,class:i<step?"done":i===step?"now":""});
    b.onclick=()=>{if((state.name||"").trim()||i===0){step=i;render()}};r.append(b)});
}
function pickQ(q){
  const sel=state[q.id]||[];const box=el("div",{class:"chips",role:"group","aria-label":q.label});
  q.opts.forEach(o=>{const t=optText(o),on=sel.includes(t);const b=el("button",{type:"button",class:"chip","aria-pressed":on});
    b.append(document.createTextNode(t));if(Array.isArray(o))b.append(el("span",{class:"tag",text:o[1]}));
    if(!on&&q.max>1&&sel.length>=q.max)b.classList.add("full");
    b.onclick=()=>{let cur=state[q.id]||[];
      if(cur.includes(t))cur=cur.filter(x=>x!==t);
      else if(q.max===1)cur=[t];
      else if(cur.length<q.max)cur=[...cur,t];
      state[q.id]=cur;save();box.replaceWith(pickQ(q))};
    box.append(b)});
  return box;
}
function scaleQ(q){
  const wrap=el("div",{class:"scale"});
  wrap.append(el("div"),el("div",{class:"legend"},[el("span",{text:q.legend[0]}),el("span",{text:q.legend[1]})]));
  q.items.forEach(([id,lab,sub])=>{
    const l=el("div",{class:"lab"});l.textContent=lab;if(sub)l.append(el("small",{text:sub}));
    const d=el("div",{class:"dots",role:"group","aria-label":lab});const cur=(state[q.id]||{})[id];
    for(let v=1;v<=5;v++){const b=el("button",{type:"button",class:"dot","aria-pressed":cur===v,"aria-label":lab+" "+v,text:String(v)});
      b.onclick=()=>{state[q.id]={...(state[q.id]||{}),[id]:v};save();[...d.children].forEach((c,i)=>c.setAttribute("aria-pressed",i+1===v))};d.append(b)}
    wrap.append(l,d)});
  return wrap;
}
function render(){
  rail();save();window.scrollTo(0,0);
  const m=$("#main");m.innerHTML="";
  const next=$("#next"),back=$("#back");
  back.disabled=step===0;back.style.visibility=step===0?"hidden":"visible";
  if(step>=STEPS.length){$("#eyebrow").textContent="Final whistle";return renderDone(m)}
  const s=STEPS[step];$("#eyebrow").textContent="Rotation "+(step+1)+" of 6";
  const sec=el("section",{class:"step"});sec.style.cssText="display:flex;flex-direction:column;gap:16px";
  sec.append(el("h1",{text:s.title}),el("p",{class:"lede",text:s.lede}));
  if(step===5)sec.append(el("div",{class:"lens"},[el("span",{},[el("b",{text:"Agency "}),document.createTextNode("I choose it")]),el("span",{},[el("b",{text:"Competence "}),document.createTextNode("I'm getting better")]),el("span",{},[el("b",{text:"Belonging "}),document.createTextNode("I matter here")])]));
  s.qs.forEach(q=>{
    const card=el("div",{class:"q"});
    if(q.label)card.append(el("h2",{text:q.label}));
    if(q.hint)card.append(el("p",{class:"hint",text:q.hint}));
    if(q.type==="text"){const i=el("input",{type:"text",id:"f-"+q.id,placeholder:q.ph,autocomplete:"name"});i.value=state[q.id]||"";i.oninput=()=>{state[q.id]=i.value;save()};card.append(i)}
    if(q.type==="email"){const i=el("input",{type:"email",id:"f-"+q.id,placeholder:q.ph,autocomplete:"email",inputmode:"email"});i.value=state[q.id]||"";i.oninput=()=>{state[q.id]=i.value;save()};card.append(i)}
    if(q.type==="area"){const t=el("textarea",{id:"f-"+q.id,placeholder:q.ph});t.value=state[q.id]||"";t.oninput=()=>{state[q.id]=t.value;save()};card.append(t)}
    if(q.type==="note"){card.classList.add("trust");q.paras.forEach(t=>card.append(el("p",{text:t})))}
    if(q.type==="pick")card.append(pickQ(q));
    if(q.type==="scale")card.append(scaleQ(q));
    sec.append(card)});
  const err=el("p",{class:"err",id:"err"});err.hidden=true;sec.append(err);
  m.append(sec);
  next.textContent=step===STEPS.length-1?"Finish":"Next";
}
function summary(){
  const S=state,sc=S.scores||{},sd=S.sdt||{},j=a=>(a&&a.length?a.join(", "):"—"),t=x=>((x||"").trim()||"—");
  const names={sleep:"Sleep",fuel:"Fuel",water:"Hydration",strength:"Strength/power",recovery:"Recovery/mobility",focus:"Focus",composure:"Composure",connection:"Connection"};
  return ["SIX ROTATIONS CHECK-IN — "+(S.name||"").trim(),
   "Position: "+j(S.position)+"  |  Year: "+j(S.year),
   "Teammates would say: "+j(S.words),"",
   "WHY I PLAY: "+j(S.why),
   "Agency "+(sd.agency||"—")+"/5  |  Competence "+(sd.competence||"—")+"/5  |  Belonging "+(sd.belonging||"—")+"/5",
   "A WIN WHEN I DON'T PLAY: "+j(S.goodday),"",
   "WHERE I'M AT (1–5)",
   Object.keys(names).map(k=>"  "+names[k]+": "+(sc[k]||"—")).join("\n"),"",
   "WHAT I WANT TO OWN: "+j(S.wants),
   "WHERE I'M GOING: "+j(S.going),
   "WHAT I WANT THEM TO SAY: "+t(S.knownfor),"",
   "UNFAIR ADVANTAGES: "+j(S.adv),
   "GAPS: "+j(S.gaps),
   "IF I FILLED ONE: "+t(S.gapcost),
   "WHERE THE DRIFT CREEPS IN: "+j(S.drift),
   "STORMS: "+j(S.storms),"",
   "HABITS I'D TRY: "+j(S.habits),
   "CAPACITY: "+j(S.load)+"  |  BEST TIME: "+j(S.when),
   "PUSH ME LIKE THIS: "+j(S.push),"",
   "SELF-GRADE: Team "+((S.self||{}).team||"—")+"/5  |  Future self "+((S.self||{}).future||"—")+"/5"].join("\n");
}
function renderDone(m){
  const sec=el("section",{class:"step"});sec.style.cssText="display:flex;flex-direction:column;gap:16px";
  sec.append(el("h1",{text:"That's a wrap, "+((state.name||"").trim().split(" ")[0]||"teammate")}),
    el("p",{class:"lede",text:"Tap Submit to send your answers to Dana. You might want to copy them into your Notes, too. Nice work."}));
  const disc=el("div",{class:"q trust"});disc.append(el("p",{text:"When you tap Submit, your answers are saved to Dana's private records so you can both track your growth over your time here. Kniff and the staff don't see them."}));
  sec.append(disc,el("pre",{class:"summary",id:"summary",text:summary()}));
  const row=el("div",{class:"actions"});
  const copy=el("button",{type:"button",class:"btn outline",id:"copy",text:"Copy my answers"});
  copy.onclick=async()=>{const note=$("#status");try{await navigator.clipboard.writeText(summary());note.textContent="Copied. Paste it into your Notes to keep your own record."}
    catch(e){const r=document.createRange();r.selectNodeContents($("#summary"));const g=getSelection();g.removeAllRanges();g.addRange(r);note.textContent="Your answers are selected. Tap Copy, then paste them into your Notes."}};
  row.append(copy);sec.append(row,el("p",{class:"note",id:"status",text:submitted()?"Submitted. Dana has your answers.":"Not submitted yet."}));
  sec.append(el("p",{class:"northstar",text:"Strong and awake for love's sake."}));
  m.append(sec);
  const next=$("#next");next.textContent=submitted()?"Submitted":"Submit";next.disabled=submitted();
}
function submitted(){try{return localStorage.getItem(KEY+"-submitted")==="1"}catch(e){return false}}
function payload(){
  return {schema_version:1,checkpoint:"preseason",season:CONFIG.season,submitted_at:new Date().toISOString(),
    player:{name:(state.name||"").trim(),email:(state.email||"").trim().toLowerCase()},answers:state};
}
function missingRequired(){
  // Returns the first unanswered required scale question on the CURRENT step, or null.
  const s=STEPS[step];
  for(const q of s.qs){
    if(q.type==="scale"&&q.required){
      const answers=state[q.id]||{};
      const unanswered=q.items.filter(([id])=>typeof answers[id]!=="number");
      if(unanswered.length)return {q,unanswered};
    }
  }
  return null;
}
$("#next").onclick=async()=>{
  if(step>=STEPS.length){
    if(submitted())return;
    const note=$("#status"),btn=$("#next");
    btn.disabled=true;btn.textContent="Sending…";
    try{const r=await fetch(CONFIG.submitUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload())});
      if(!r.ok)throw new Error(r.status);
      try{localStorage.setItem(KEY+"-submitted","1")}catch(e){}
      btn.textContent="Submitted";note.textContent="Submitted. Dana has your answers. Thank you."}
    catch(e){btn.disabled=false;btn.textContent="Submit";note.textContent="That didn't go through. Check your connection and tap Submit again. Your answers are still here."}
    return}
  if(step===0){const e=$("#err");
    if(!(state.name||"").trim()){e.textContent="Add your name so Dana knows whose answers these are.";e.hidden=false;$("#f-name").focus();return}
    const typedEmail=(state.email||"").trim().toLowerCase();
    const emailOk=/^[^@\s]+@uci\.edu$/i.test(typedEmail)||typedEmail===ADMIN_EMAIL;
    if(!emailOk){e.textContent="Enter your UCI email (it has to end in @uci.edu) so your answers are saved under your own name.";e.hidden=false;$("#f-email").focus();return}}
  const miss=missingRequired();
  if(miss){const e=$("#err");const[,firstLabel]=miss.unanswered[0];
    e.textContent="Rate every one before moving on — you missed \u201c"+firstLabel+"\u201d.";e.hidden=false;
    e.scrollIntoView({block:"center",behavior:"smooth"});return}
  step++;render();
};
$("#back").onclick=()=>{if(step>0){step--;render()}};
render();
</script>
</body>
</html>`;
  return html;
}
