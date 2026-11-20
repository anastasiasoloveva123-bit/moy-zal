/* МОЙ ЗАЛ: личный офлайн-дневник, без внешних библиотек или отправки данных */
'use strict';
const ROUTINES = [
  {id:'r1',name:'Запись 01',subtitle:'6 упражнений · из твоего сообщения',exercises:[
    {id:'r1e1',name:'Жим гантелей в наклоне',target:'5×10',reps:['10','10','10','10','10']},
    {id:'r1e2',name:'Махи блока перед собой',target:'4×12',reps:['12','12','12','12']},
    {id:'r1e3',name:'Махи рук назад',target:'4×12 + 1×20',reps:['12','12','12','12','20']},
    {id:'r1e4',name:'Тяга штанги широким хватом',target:'5×15',weightHint:'10–15 кг',reps:['15','15','15','15','15']},
    {id:'r1e5',name:'Повороты блина вокруг головы',target:'2×10 в каждую сторону',weightHint:'10–15 кг',reps:['10/стор.','10/стор.']},
    {id:'r1e6',name:'Тяга блока за голову',target:'3×10',reps:['10','10','10']}
  ]},
  {id:'r2',name:'Запись 02',subtitle:'6 упражнений · из твоего сообщения',exercises:[
    {id:'r2e1',name:'Тяга до колен',target:'3×5',weightHint:'70 кг',reps:['5','5','5']},
    {id:'r2e2',name:'Тяга с плинтов (с блинов), штанга на уровне колен',target:'5×2',weightHint:'95 кг',reps:['2','2','2','2','2']},
    {id:'r2e3',name:'Тяга верхнего блока',target:'5×15',reps:['15','15','15','15','15']},
    {id:'r2e4',name:'Тяга нижнего блока',target:'5×15',reps:['15','15','15','15','15']},
    {id:'r2e5',name:'Гиперэкстензия',target:'3×20',reps:['20','20','20']},
    {id:'r2e6',name:'Пресс: подъём ног + подъём корпуса',target:'4×12–15',reps:['12–15','12–15','12–15','12–15']}
  ]},
  {id:'r3',name:'Запись 03',subtitle:'5 упражнений · из твоего сообщения',exercises:[
    {id:'r3e1',name:'Жим штанги лёжа',target:'4×4',weightHint:'42,5–45 кг',reps:['4','4','4','4']},
    {id:'r3e2',name:'Жим штанги лёжа',target:'5×8–12',weightHint:'20 кг (гриф)',reps:['8–12','8–12','8–12','8–12','8–12']},
    {id:'r3e3',name:'Отжимания от пола',target:'3×макс',reps:['макс','макс','макс']},
    {id:'r3e4',name:'Разведение гантелей',target:'3×11',reps:['11','11','11']},
    {id:'r3e5',name:'Трицепс в блоке',target:'5×(10+10)',reps:['10+10','10+10','10+10','10+10','10+10'],note:'10 повторений → уменьшить вес на пару блоков → ещё 10 без паузы'}
  ]}
];
const DB_KEY = 'moy-zal-data-v1';
const defaultDB = () => ({v:1, sessions:[], active:null});
function loadDB(){try {const raw=JSON.parse(localStorage.getItem(DB_KEY));return raw&&raw.v===1&&Array.isArray(raw.sessions)?{v:1,sessions:raw.sessions,active:raw.active||null}:defaultDB();}catch{return defaultDB();}}
let db=loadDB(), tab='home', expandedHistory=null, openProgram='r1', timerEnd=0, toastTimer;
let coachQuestion=localStorage.getItem('moy-zal-coach-question')||'Проанализируй мои последние тренировки: где есть прогресс и какие вопросы стоит обсудить с тренером в зале?';
let coachPreview=false;
const $=sel=>document.querySelector(sel);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const rt=id=>ROUTINES.find(r=>r.id===id);
const formatDate=value=>{try{return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value));}catch{return 'Дата не указана';}};
const formatTime=value=>{try{return new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return '';}};
function store(){try{localStorage.setItem(DB_KEY,JSON.stringify(db));return true;}catch{notify('Не удалось сохранить данные. Сделай резервную копию.');return false;}}
function notify(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);}
const icons={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 workout:'<rect x="2" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/><path d="M6 12h12"/><rect x="6" y="6" width="3" height="12" rx="1"/><rect x="15" y="6" width="3" height="12" rx="1"/>',
 log:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
 settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-4L10 6a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.5 3h4l.5-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5a7 7 0 0 0 .1-1z"/>',
 coach:'<path d="M12 3a6 6 0 0 0-4 10.5V17h8v-3.5A6 6 0 0 0 12 3z"/><path d="M9 21h6M9 19h6M9 10l2 2 4-4"/>',
 chevron:'<path d="m9 18 6-6-6-6"/>', check:'<path d="m5 12 5 5L20 7"/>'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;}
function nav(){return `<nav class="nav" aria-label="Основная навигация">
 ${[['home','Главная','home'],['program','Программа','workout'],['history','Журнал','log'],['coach','Тренер ИИ','coach'],['settings','Ещё','settings']].map(([key,label,ico])=>`<button type="button" data-action="nav" data-tab="${key}" class="${tab===key?'on':''}" aria-label="${label}" ${tab===key?'aria-current="page"':''}>${icon(ico)}<span>${label}</span></button>`).join('')}
 </nav>`;}
function header(){return `<header class="topbar"><div class="brand"><div class="brandlogo">✦</div><div><div class="brandname">МОЙ ЗАЛ</div><div class="brandsub">ЛИЧНЫЙ ДНЕВНИК</div></div></div><span id="netstatus" class="status ${navigator.onLine?'':'off'}"><b></b>${navigator.onLine?'Есть сеть':'Без сети'}</span></header>`;}
function stats(){const sessions=db.sessions||[];const totalSets=sessions.reduce((sum,s)=>sum+countDone(s),0);const last=sessions.at(-1);return {total:sessions.length,sets:totalSets,last};}
function countDone(s){return Object.values(s?.sets||{}).reduce((sum,arr)=>sum+(Array.isArray(arr)?arr.filter(x=>x.done).length:0),0);}
function countTotal(s){return Object.values(s?.sets||{}).reduce((sum,arr)=>sum+(Array.isArray(arr)?arr.length:0),0);}
function routineCard(r,action='start'){return `<button type="button" class="routine" data-action="${action}" data-id="${r.id}"><span class="rno">${r.id.slice(-1).padStart(2,'0')}</span><span class="rbody"><span class="rname">${esc(r.name)}</span><span class="rmeta">${r.exercises.length} упражнений · твоя программа</span></span><span class="arrow">›</span></button>`;}
function home(){const st=stats();const active=db.active&&rt(db.active.routineId),activeDone=db.active?countDone(db.active):0,activeTotal=db.active?countTotal(db.active):0;
return `<div class="eyebrow">ТРЕНИРУЙСЯ В СВОЁМ ТЕМПЕ</div><h1 class="h1">Твой зал.<br><span class="gradtext">Твои результаты.</span></h1><p class="lead">Программа сохранена как в твоих записях. Здесь только твои подходы и прогресс.</p>
<div class="hero"><span class="tag">${active?'● ТРЕНИРОВКА НАЧАТА':'ЛИЧНЫЙ ТРЕНИРОВОЧНЫЙ ДНЕВНИК'}</span><div class="heronum">${active?esc(active.name):'Готов к залу?'}</div><div class="herop">${active?`${activeDone} из ${activeTotal} подходов отмечено. Можно продолжить с того же места.`:'Выбери нужную запись. Никаких автоматических изменений плана.'}</div><button class="herocta" type="button" data-action="${active?'continue':'nav'}" ${active?'':'data-tab="program"'}>${active?'Продолжить тренировку':'Открыть программу'} <span>→</span></button></div>
<div class="card dualmode"><div class="subhead">Два режима</div><div class="modepair"><div><span class="chip lime">В зале · офлайн</span><div class="textline">Отмечай веса, повторы и подходы без сети.</div></div><div><span class="chip blue">Дома · онлайн</span><div class="textline">Открой раздел «Тренер ИИ» для разбора журнала.</div></div></div><button class="btn ghost wide" style="margin-top:12px" type="button" data-action="nav" data-tab="coach">Перейти к ИИ-тренеру →</button></div><div class="metrics"><div class="metric"><b>${st.total}</b><small>тренировок</small></div><div class="metric"><b>${st.sets}</b><small>выполнено подходов</small></div><div class="metric"><b>03</b><small>записи программы</small></div></div>
<div class="sectionhead"><h2 class="h2">Выбрать тренировку</h2></div><div class="stack">${ROUTINES.map(r=>routineCard(r)).join('')}</div><p class="hint">Три записи не привязаны к конкретным дням и не считаются последними тремя тренировками подряд. Выбирай нужную самостоятельно.</p>
${st.last?`<div class="sectionhead"><h2 class="h2">Последняя запись</h2></div><div class="card"><div class="subhead">${esc(st.last.name)}</div><div class="textline">${formatDate(st.last.finishedAt)} · ${countDone(st.last)} подходов</div><button class="btn ghost" type="button" style="margin-top:12px" data-action="nav" data-tab="history">Посмотреть журнал →</button></div>`:''}`;}
function program(){return `<div class="eyebrow">НЕИЗМЕННАЯ ПРОГРАММА</div><h1 class="h1">Твои записи</h1><p class="lead">Точные названия упражнений, порядок, подходы, повторения и указанные веса.</p>
${ROUTINES.map(r=>`<div class="card"><div class="rtop"><div><div class="subhead">${esc(r.name)}</div><div class="textline">${r.exercises.length} упражнений</div></div><span class="chip blue">Оригинал</span></div><div style="margin-top:13px">${r.exercises.map((e,i)=>`<div class="programrow"><span class="muted small">${i+1}.</span><div><strong style="font-size:13px">${esc(e.name)}</strong>${e.weightHint?`<div class="progsub">Вес в записи: ${esc(e.weightHint)}</div>`:''}${e.note?`<div class="progsub">${esc(e.note)}</div>`:''}</div><span class="progtarget">${esc(e.target)}</span></div>`).join('')}</div><button type="button" class="btn primary wide" style="margin-top:16px" data-action="start" data-id="${r.id}">Начать эту тренировку</button></div>`).join('')}
<div class="notice">В программу внесены три тренировки, которые ты дописал сообщением. Старые фото блокнота не использованы для выдумывания расписания или новых весов.</div>`;}
function startSession(routineId){const r=rt(routineId);if(!r)return;
if(db.active){if(db.active.routineId===routineId){tab='session';render();return;}if(!confirm('У тебя есть незаконченная тренировка. Удалить только её черновик и начать другую?'))return;}
db.active={id:'s'+Date.now(),routineId,name:r.name,startedAt:new Date().toISOString(),notes:'',sets:Object.fromEntries(r.exercises.map(e=>[e.id,e.reps.map(()=>({weight:'',reps:'',done:false}))]))};store();tab='session';render();window.scrollTo(0,0);}
function session(){const s=db.active;if(!s){tab='home';return home();}const r=rt(s.routineId);if(!r){return `<div class="empty">Не удалось найти запись. В настройках сохрани резервную копию.</div>`;}
const done=countDone(s),total=countTotal(s);return `<div class="eyebrow">ИДЁТ ТРЕНИРОВКА</div><h1 class="h1">${esc(r.name)}</h1><p class="lead">${formatDate(s.startedAt)} · старт ${formatTime(s.startedAt)}</p>
<div class="card"><div class="rtop"><b>Отмечено подходов</b><b class="emph">${done} / ${total}</b></div><div class="bartrack"><div class="barfill" style="width:${total?Math.round(done/total*100):0}%"></div></div><div class="textline">Заполняй фактический вес и повторы. Галочка — подход выполнен.</div></div>
<div class="card"><div class="subhead">Таймер отдыха <span class="muted small" style="font-weight:400">· по желанию</span></div><div class="timer"><div class="timerclock" id="timerclock">00:00</div><button class="btn ghost" data-action="timer" data-sec="60">1 мин</button><button class="btn ghost" data-action="timer" data-sec="120">2 мин</button><button class="btn ghost" data-action="timer" data-sec="180">3 мин</button><button class="btn ghost" data-action="timerstop">✕</button></div></div>
${r.exercises.map((e,i)=>`<article class="exercise"><div class="exhead"><span class="exindex">${i+1}</span><div class="exmain"><div class="extitle">${esc(e.name)}</div><div class="exrange"><span class="chip lime">${esc(e.target)}</span> ${e.weightHint?`<span class="chip">В записи: ${esc(e.weightHint)}</span>`:''}</div>${e.note?`<div class="exnote">${esc(e.note)}</div>`:''}</div></div><div class="sethead"><span>Сет</span><span>Вес, кг</span><span>Повторы</span><span>Готово</span></div>
${(s.sets[e.id]||[]).map((set,i)=>`<div class="setrow ${set.done?'done':''}"><div class="setnum">${i+1}</div><input class="cell" type="text" inputmode="decimal" autocomplete="off" data-field="weight" data-ex="${e.id}" data-i="${i}" value="${esc(set.weight)}" placeholder="—" aria-label="Вес: ${esc(e.name)}, подход ${i+1}"><input class="cell" type="text" inputmode="text" autocomplete="off" data-field="reps" data-ex="${e.id}" data-i="${i}" value="${esc(set.reps)}" placeholder="${esc(e.reps[i])}" aria-label="Повторы: ${esc(e.name)}, подход ${i+1}"><button type="button" class="donebtn" data-action="done" data-ex="${e.id}" data-i="${i}" aria-label="${set.done?'Снять отметку':'Отметить'} подход ${i+1}">${set.done?'✓':'○'}</button></div>`).join('')}</article>`).join('')}
<div class="card"><div class="subhead">Заметки по тренировке</div><textarea class="noteinput" data-field="notes" placeholder="Самочувствие, что получилось, что было сложно…">${esc(s.notes||'')}</textarea></div>
<div class="buttons"><button class="btn primary wide" data-action="finish">Сохранить тренировку в журнал</button><button class="btn ghost" data-action="go-home">Вернуться на главную (черновик сохранится)</button><button class="btn danger" data-action="discard">Удалить незавершённую тренировку</button></div><p class="hint">Все изменения сохраняются автоматически на этом iPhone, даже без интернета.</p>`;}
function history(){const sessions=[...db.sessions].reverse();return `<div class="eyebrow">ИСТОРИЯ РЕЗУЛЬТАТОВ</div><h1 class="h1">Журнал</h1><p class="lead">Выполненные подходы, фактические веса и повторения. История хранится на устройстве.</p>
${!sessions.length?`<div class="empty"><div class="emptyicon">▤</div>Пока нет завершённых тренировок.<br>Начни тренировку и сохрани результат.</div>`:sessions.map(s=>`<div class="historycard"><button type="button" style="background:none;color:inherit;border:0;text-align:left;padding:0;width:100%" data-action="expand" data-id="${esc(s.id)}"><div class="historytop"><b>${esc(s.name)}</b><span class="emph small">${countDone(s)} / ${countTotal(s)}</span></div><div class="histdate">${formatDate(s.finishedAt)} · ${formatTime(s.finishedAt)} · подробности ${expandedHistory===s.id?'⌃':'⌄'}</div></button>${expandedHistory===s.id?`<div class="historydetails">${(rt(s.routineId)?.exercises||[]).map(e=>`<div class="item"><b>${esc(e.name)}</b><div class="textline" style="margin-top:5px">${(s.sets?.[e.id]||[]).map((set,i)=>`${i+1}: ${set.done?'✓':'—'} ${esc(set.weight||'?')} кг × ${esc(set.reps||'?')}`).join(' · ')}</div></div>`).join('')}</div>${s.notes?`<div class="textline">Заметки: ${esc(s.notes)}</div>`:''}<button class="btn danger" style="margin-top:12px" data-action="removeHistory" data-id="${esc(s.id)}">Удалить эту запись</button>`:''}</div>`).join('')}
<div style="margin-top:18px"><button type="button" class="btn primary wide" data-action="exportJSON">Сохранить резервную копию</button><p class="hint">Экспорт удобен перед сменой телефона. Результаты не синхронизируются через облако.</p></div>`;}
function buildCoachReport(){
 const out=[];
 out.push('ТЫ — мой ИИ-помощник по тренировкам. Мне 15 лет, рост 168 см, вес 56 кг (эти показатели указаны ранее и могут измениться). Тренируюсь три раза в неделю, цель — безопасно становиться сильнее и набирать мышечную массу.');
 out.push('ВАЖНО: моя программа назначена тренером в зале. НЕ меняй программу, порядок упражнений, подходы, повторения или веса без моего прямого разрешения. Не утверждай, что три записи ниже — последние три тренировки или что они идут в фиксированные дни. Не назначай мне предельные веса и не предлагай работу до отказа без моего согласия. Если есть сомнения по технике или тяжёлым тягам — предложи обсудить с тренером в зале.');
 out.push('ПРОГРАММА (без изменений):');
 for(const r of ROUTINES){out.push('['+r.name+']'); for(let i=0;i<r.exercises.length;i++){const e=r.exercises[i];out.push(`${i+1}. ${e.name} — ${e.target}${e.weightHint?' · '+e.weightHint:''}${e.note?' · '+e.note:''}`);}}
 out.push('ДНЕВНИК — фактические записи (последние 20, от новых к старым):');
 if(!db.sessions.length)out.push('Пока нет завершённых тренировок. Не выдумывай результаты.');
 for(const s of [...db.sessions].reverse().slice(0,20)){
   out.push(`Дата: ${formatDate(s.finishedAt)} | ${s.name} | отмечено: ${countDone(s)}/${countTotal(s)} подходов`);
   for(const e of rt(s.routineId)?.exercises||[]){
     const arr=(s.sets?.[e.id]||[]).map((set,i)=>set.done?`${i+1}: ${set.weight||'вес не указан'} кг, ${set.reps||'повторы не указаны'} повторов`:'').filter(Boolean);
     if(arr.length)out.push(`${e.name}: ${arr.join('; ')}`);
   }
   if(s.notes)out.push('Заметки: '+s.notes);
 }
 if(db.active){out.push(`Незавершённая тренировка: ${db.active.name}, ${countDone(db.active)} отмеченных подходов`);}
 out.push('МОЙ ВОПРОС: '+(coachQuestion.trim()||'Разбери мой тренировочный дневник и покажи фактический прогресс без изменения программы.'));
 out.push('Пожалуйста, отделяй факты из журнала от предположений и не выдумывай пропущенные веса. Отвечай понятно и кратко.');
 return out.join('\n');
}
function coach(){const network=navigator.onLine;
return `<div class="eyebrow">ПОМОЩНИК ПОСЛЕ ЗАЛА</div><h1 class="h1">Твой <span class="gradtext">ИИ-тренер</span></h1>
<p class="lead">В зале записывай тренировку без интернета. Когда появится сеть — отправь дневник для анализа в ChatGPT.</p>
<div class="card" style="border-color:${network?'#526849':'#66543c'}"><div class="rtop"><div class="subhead" style="margin:0">${network?'Интернет доступен':'Сейчас без интернета'}</div><span class="chip ${network?'lime':''}">${network?'Онлайн':'Офлайн'}</span></div><p class="textline" style="margin:10px 0 0">${network?'Можно подготовить отчёт и перейти к ИИ. Дневник не отправляется автоматически.':'Все тренировки продолжают сохраняться. Отчёт можно подготовить даже офлайн, а отправить позже.'}</p></div>
<div class="card"><div class="subhead">Что хочешь обсудить?</div><textarea id="coach-question" class="noteinput" placeholder="Например: сравни результаты жима лёжа за месяц…">${esc(coachQuestion)}</textarea>
<div class="textline" style="margin:12px 0 14px">В отчёт войдут твоя неизменённая программа и до 20 последних записанных тренировок (${db.sessions.length} всего).</div>
<div class="stack"><button class="btn primary wide" type="button" data-action="coachCopy">Скопировать данные для ИИ-тренера</button><button class="btn ghost wide" type="button" data-action="coachPreview">${coachPreview?'Скрыть подготовленный отчёт':'Посмотреть, что будет отправлено'}</button><button class="btn ghost wide" type="button" data-action="coachOpen" ${network?'':'disabled'}>Открыть ChatGPT ↗</button></div>
${coachPreview?`<div class="reportpreview"><div class="fieldlabel">Предпросмотр · ничего не отправлено</div><pre>${esc(buildCoachReport())}</pre></div>`:''}
</div><div class="notice"><strong>Как пользоваться:</strong> нажми «Скопировать данные», затем «Открыть ChatGPT» и вставь текст в чат. Это отдельный онлайн-чат, а не встроенный API-бот. Сама программа и журнал остаются доступны без интернета.</div>
<div class="card" style="margin-top:12px"><div class="subhead">Твоя программа под защитой</div><div class="textline">ИИ может объяснять технику, сравнивать выполненные подходы и помогать готовить вопросы тренеру. Изменения в программе — только по твоему решению.</div></div>`;}
function settings(){return `<div class="eyebrow">ТВОЁ ПРИЛОЖЕНИЕ</div><h1 class="h1">Настройки</h1><p class="lead">Ничего лишнего: твоя программа, журнал и локальное хранение.</p>
<div class="card"><div class="subhead">Как работать без интернета</div><ol class="bullets"><li>Один раз открой установленное приложение с интернетом.</li><li>Затем включи авиарежим и проверь, что оно запускается.</li><li>Записывай веса прямо в зале: всё сохраняется на телефоне.</li></ol></div>
<div class="card"><div class="subhead">Твои данные</div><p class="textline">Журнал и текущая тренировка хранятся только в памяти браузера/приложения этого устройства. Серверов и аккаунтов нет. При удалении приложения или очистке данных журнал может исчезнуть — делай резервные копии.</p><div class="stack" style="margin-top:15px"><button class="btn primary wide" data-action="exportJSON">Скачать копию (.json)</button><button class="btn ghost wide" data-action="exportCSV">Экспорт подходов (.csv)</button><label class="filepick">Восстановить журнал из копии<input type="file" id="file-import" accept=".json,application/json"></label></div></div>
<div class="card"><div class="subhead">Правила программы</div><p class="textline">Три актуальные записи сохранены в том порядке, в котором ты прислал. Они не приравниваются к последним трём тренировкам подряд. Названия упражнений, количество подходов, повторы и записанные рабочие веса приложение не меняет.</p></div>
<div class="card"><div class="subhead">Безопасность</div><p class="textline">Ты несовершеннолетний. Приложение — дневник, не замена тренеру в зале. Для упражнений с тяжёлыми весами нужна проверенная техника и контроль тренера. Если упражнение вызывает боль, остановись и сообщи тренеру.</p></div><button class="btn danger wide" data-action="reset">Удалить все записи с этого устройства</button><div class="footer">МОЙ ЗАЛ · офлайн-дневник + онлайн-помощник · 1.1</div>`;}
function render(){const app=$('#app');const content=tab==='home'?home():tab==='program'?program():tab==='history'?history():tab==='coach'?coach():tab==='session'?session():settings();app.innerHTML=`<div class="shell">${header()}<main class="page">${content}</main>${nav()}</div>`;updateTimer();}
function saveAndRender(){store();render();}
function doneToggle(ex,i){const arr=db.active?.sets?.[ex];if(!arr||!arr[i])return;arr[i].done=!arr[i].done;saveAndRender();}
function finish(){const s=db.active;if(!s)return;const n=countDone(s);if(!n&&!confirm('Не отмечено ни одного подхода. Всё равно сохранить?'))return;
const now=new Date().toISOString();db.sessions.push({...s,finishedAt:now});db.active=null;store();tab='history';expandedHistory=s.id;timerEnd=0;render();window.scrollTo(0,0);notify('Тренировка сохранена в журнал');}
function downloadFile(filename,body,type){const blob=new Blob([body],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function backup(){downloadFile('moy-zal-rezerv-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({app:'moy-zal',exportedAt:new Date().toISOString(),data:db},null,2),'application/json;charset=utf-8');notify('Резервная копия подготовлена');}
function csvCell(v){const s=String(v??'');return '"'+(/^[=+@-]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';}
function exportCsv(){const rows=[['Дата','Запись','Упражнение','Номер подхода','Вес (кг)','Повторения','Выполнен']];for(const s of db.sessions){for(const e of rt(s.routineId)?.exercises||[]){(s.sets[e.id]||[]).forEach((set,i)=>rows.push([formatDate(s.finishedAt),s.name,e.name,i+1,set.weight,set.reps,set.done?'да':'нет']));}}downloadFile('moy-zal-podhody.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8');notify('CSV-файл подготовлен');}
function restoreFile(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result);if(obj.app!=='moy-zal'||obj.data?.v!==1||!Array.isArray(obj.data.sessions)||obj.data.sessions.length>10000)throw Error();if(!confirm('Заменить текущий журнал и черновик данными из резервной копии?'))return;db={v:1,sessions:obj.data.sessions,active:obj.data.active||null};store();tab='home';render();notify('Резервная копия восстановлена');}catch{notify('Файл не подходит. Нужна резервная копия МОЙ ЗАЛ.');}};reader.readAsText(file);}
function updateTimer(){const node=$('#timerclock');if(!node)return;const seconds=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));node.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');node.classList.toggle('timer-active',seconds>0);if(timerEnd&&seconds===0){timerEnd=0;notify('Таймер завершён');}}
document.addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(!b)return;const act=b.dataset.action,id=b.dataset.id;
if(act==='nav'){tab=b.dataset.tab;render();window.scrollTo(0,0);}
else if(act==='start')startSession(id);
else if(act==='continue'){tab='session';render();window.scrollTo(0,0);}
else if(act==='done')doneToggle(b.dataset.ex,Number(b.dataset.i));
else if(act==='finish')finish();
else if(act==='go-home'){tab='home';render();window.scrollTo(0,0);}
else if(act==='discard'){if(confirm('Удалить незавершённую тренировку? Сохранённый журнал не изменится.')){db.active=null;store();timerEnd=0;tab='home';render();}}
else if(act==='expand'){expandedHistory=expandedHistory===id?null:id;render();}
else if(act==='removeHistory'){if(confirm('Удалить эту тренировку из журнала без возможности отмены?')){db.sessions=db.sessions.filter(s=>s.id!==id);expandedHistory=null;saveAndRender();}}
else if(act==='timer'){timerEnd=Date.now()+Number(b.dataset.sec)*1000;updateTimer();}
else if(act==='timerstop'){timerEnd=0;updateTimer();}
else if(act==='coachPreview'){coachPreview=!coachPreview;render();}
else if(act==='coachCopy'){const report=buildCoachReport();if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(report).then(()=>notify('Скопировано! Открой ChatGPT и вставь текст.')).catch(()=>legacyCoachCopy(report));}else legacyCoachCopy(report);}
else if(act==='coachOpen'){if(navigator.onLine)window.open('https://chatgpt.com/','_blank','noopener,noreferrer');else notify('Нужен интернет для ChatGPT');}
else if(act==='exportJSON')backup();
else if(act==='exportCSV')exportCsv();
else if(act==='reset'){if(confirm('Точно удалить ВСЕ завершённые и незавершённые тренировки? Сначала скачай резервную копию.')){if(confirm('Это удалит журнал с телефона. Продолжить?')){db=defaultDB();store();tab='home';render();notify('Данные на этом устройстве очищены');}}}
});
function legacyCoachCopy(report){const area=document.createElement('textarea');area.value=report;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();let copied=false;try{copied=document.execCommand('copy');}catch{}area.remove();if(copied)notify('Скопировано! Вставь текст в ChatGPT.');else{coachPreview=true;render();notify('Скопировать не вышло. Выдели отчёт вручную.');}}
document.addEventListener('input',event=>{if(event.target.id==='coach-question'){coachQuestion=event.target.value;try{localStorage.setItem('moy-zal-coach-question',coachQuestion)}catch{}return;}const el=event.target,field=el.dataset.field;if(!db.active||!field)return;if(field==='notes'){db.active.notes=el.value;store();return;}const entry=db.active.sets?.[el.dataset.ex]?.[Number(el.dataset.i)];if(entry&&['weight','reps'].includes(field)){entry[field]=el.value;store();}});
document.addEventListener('change',event=>{if(event.target.id==='file-import'){restoreFile(event.target.files?.[0]);event.target.value='';}});
window.addEventListener('online',()=>{if(tab==='coach')render();const el=$('#netstatus');if(el){el.innerHTML='<b></b>Есть сеть';el.classList.remove('off');}});
window.addEventListener('offline',()=>{if(tab==='coach')render();const el=$('#netstatus');if(el){el.innerHTML='<b></b>Без сети';el.classList.add('off');}});
setInterval(updateTimer,1000);
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{const el=$('#netstatus');if(el&&navigator.onLine)el.innerHTML='<b></b>Офлайн готов';}).catch(()=>{});
render();
