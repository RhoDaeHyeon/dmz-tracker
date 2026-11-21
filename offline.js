'use strict';
window.createDMZTracker = function(userId) {
const $=id=>document.getElementById(id),key='dmz-practice-user-v1:'+userId;let timer,started;
const routines=['기상 후 편안하게 몸 풀기','내게 알맞게 골고루 먹기','오래 앉았다면 잠시 자세 바꾸기','내 상태에 맞춰 걷기','무리 없이 몸 움직이기','잠들기 전 스마트폰을 내려놓고 쉬기'];
const questions=['골고루 알맞게 먹나요?','편안한 양을 즐겁게 먹나요?','기상했을 때 회복감을 느끼나요?','잠들기 전 마음을 가라앉히나요?','편안한 호흡을 의식하나요?','내 몸에 맞는 걷기를 하나요?','기상 후 가볍게 몸을 푸나요?','틈틈이 자세를 바꾸나요?','스트레스를 알아차리고 자신을 돌보나요?','감사나 기쁨을 발견하나요?'];
function note(s){$('local-status').textContent=s;}
function read(){try{return JSON.parse(localStorage.getItem(key)||'{}');}catch{throw Error('이 브라우저에서 저장된 기록을 읽지 못했습니다. 기존 데이터를 지우지 말고 다른 파일로 덮어쓰지 마세요.');}}
function safe(fn){try{fn();}catch(e){note(e.message||'기기 저장소를 사용할 수 없습니다.');}}
function progress(){const n=routines.filter((_,i)=>$('r'+i).checked).length;$('progress').value=n;$('progress-text').textContent=`${n}/6개 실천`;}
function load(){const r=read()[$('record-date').value];routines.forEach((_,i)=>$('r'+i).checked=Boolean(r?.checks?.[i]));$('reflection').value=r?.reflection||'';progress();$('record-status').textContent=r?'이 기기에 저장된 기록입니다.':'저장된 기록이 없습니다.';}
function history(){const records=read();$('records-panel').hidden=false;$('history').replaceChildren();Object.keys(records).sort().reverse().forEach(day=>{const li=document.createElement('li'),button=document.createElement('button'),p=document.createElement('p');button.textContent=`${day} · ${records[day].checks.filter(Boolean).length}/6`;button.onclick=()=>safe(()=>{$('record-date').value=day;load();$('record-date').focus();});p.textContent=records[day].reflection;li.append(button,p);$('history').append(li);});$('history-status').textContent=Object.keys(records).length?'이 기기에 저장된 기록입니다.':'아직 저장한 기록이 없습니다.';$('more-records').hidden=true;}
routines.forEach((label,i)=>{const l=document.createElement('label');l.className='check';const c=document.createElement('input');c.type='checkbox';c.id='r'+i;c.onchange=progress;l.append(c,document.createTextNode(label));$('routine-items').append(l);});
function select(container,name,text,options){const l=document.createElement('label');l.textContent=text;const s=document.createElement('select');s.name=name;s.required=true;s.add(new Option('선택해 주세요',''));options.forEach(([v,t])=>s.add(new Option(t,v)));l.append(s);$(container).append(l);}
questions.forEach((q,i)=>select('assessment-questions','q'+i,q,[['1','전혀 아님'],['2','가끔'],['3','자주'],['4','항상']]));
['편안하게 일어나는 시간','집중하기 편한 시간','활동하기 편한 시간'].forEach((q,i)=>select('rhythm-questions','q'+i,q,[['0','오전'],['1','오후·저녁']]));
$('assessment-form').onsubmit=e=>{e.preventDefault();$('assessment-result').textContent=`${[...new FormData(e.target).values()].reduce((n,v)=>n+Number(v),0)}/40점. 실천을 돌아보는 점수이며 건강 진단이 아닙니다.`;};
$('rhythm-form').onsubmit=e=>{e.preventDefault();const n=[...new FormData(e.target).values()].filter(v=>v==='0').length;$('rhythm-result').textContent=`이번 응답에서는 ${n>=2?'오전':'오후·저녁'} 선호가 많았습니다. 내 생활에 맞춰 관찰해 보세요.`;};
const today=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());$('record-date').value=today;$('record-date').max=today;$('record-date').onchange=()=>safe(load);
$('routine-form').onsubmit=e=>{e.preventDefault();safe(()=>{if(!$('record-date').value||$('record-date').value>today){note('오늘 또는 이전 날짜를 선택해 주세요.');return;}const data=read();data[$('record-date').value]={checks:routines.map((_,i)=>$('r'+i).checked),reflection:$('reflection').value.trim()};localStorage.setItem(key,JSON.stringify(data));note('이 기기에 기록을 저장했습니다.');if(!$('records-panel').hidden)history();});};
$('view-records').onclick=()=>safe(history);$('delete-record').onclick=()=>safe(()=>{if(!confirm('이 날짜의 기기 기록을 삭제할까요?'))return;const data=read();delete data[$('record-date').value];localStorage.setItem(key,JSON.stringify(data));load();if(!$('records-panel').hidden)history();});
function stop(text='멈췄습니다.') {clearInterval(timer);$('breath-start').disabled=false;$('breath-status').textContent=text;}
$('breath-start').onclick=()=>{stop();started=Date.now();$('breath-start').disabled=true;const tick=()=>{const n=Math.floor((Date.now()-started)/1000);if(n>=70){stop('호흡 안내를 마쳤습니다.');return;}const p=n%14;const phase=p<4?'흡(들이쉬기)':p<6?'멈춤':'호(내쉬기)';const remaining=p<4?4-p:p<6?6-p:14-p;$('breath-status').textContent=`${Math.floor(n/14)+1}/5회 · ${phase} ${remaining}초`;};tick();timer=setInterval(tick,250);};$('breath-stop').onclick=()=>stop();const onVisibility=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',onVisibility);
$('pace').onchange=()=>{$('pace-result').textContent={usual:'편안한 범위에서 실천하세요.',light:'작은 실천 하나로 시작하세요.',rest:'쉬는 것도 실천입니다.'}[$('pace').value];};safe(load);
return {destroy(){stop('준비되면 시작하세요.');document.removeEventListener('visibilitychange',onVisibility);}};
};
