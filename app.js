'use strict';
const $=id=>document.getElementById(id);
const types=['文字','图片','视频','语音','24 点','问答'];
const icons=['✎','▧','▷','♫','♧','?'];
const today=new Date();
function dateKey(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function past(n){const d=new Date(today);d.setDate(d.getDate()-n);return d.getTime()}
let records=[
 {id:'lake',kind:'图片',title:'在山与湖之间，慢下来',body:'湖面安静得像一面镜子。沿着岸边走了一圈，把今天的风景留在这里。',tags:['山野','散步'],image:'lake.jpg',at:past(0)},
 {id:'game',kind:'24 点',title:'来一局 24 点',body:'用下面四个数字，通过加减乘除算出 24。',tags:[],at:past(1)},
 {id:'note',kind:'文字',title:'雨停以后',body:'把窗户打开，楼下传来收伞的声音。',tags:['日常'],at:past(2)},
 {id:'quiz',kind:'问答',body:'上次去湖边时，岸边的小屋是什么材质？',answer:'木头',tags:['回忆'],at:past(4)}
];
let filter='全部',day='',cursor=new Date(today.getFullYear(),today.getMonth(),1),roam=false,current='',shown=new Map(),urls=[],lastHand='',db;
const el=(tag,txt,cls)=>{let e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e};
const btn=(txt,fn,cls)=>{let b=el('button',txt,cls);b.onclick=fn;return b};
function matches(){const words=$('search').value.trim().toLowerCase().split(/\s+/);return records.filter(r=>(filter==='全部'||filter===r.kind)&&(!day||dateKey(new Date(r.at))===day)&&words.every(w=>[r.title,r.body,r.kind,...r.tags].join(' ').toLowerCase().includes(w)))}
function resetView(){roam=false;shown.clear();render()}
function shuffle(){let pool=matches().filter(r=>r.id!==current);if(!pool.length)pool=matches();current=pool[Math.floor(Math.random()*pool.length)]?.id;roam=true;shown.clear();render();window.scrollTo(0,0)}
function solvable(ns){if(ns.length===1)return Math.abs(ns[0]-24)<1e-7;for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){const a=ns[i],b=ns[j],rest=ns.filter((_,k)=>k!==i&&k!==j);for(const c of [a+b,a-b,b-a,a*b,...(b?[a/b]:[]),...(a?[b/a]:[])])if(solvable([...rest,c]))return true}return false}
function hand(){let a;do{a=Array.from({length:4},()=>1+Math.floor(Math.random()*9))}while(a.join()===lastHand||!solvable(a));lastHand=a.join();return a}
function correct(s,nums){const src=s.replace(/\s/g,'').replaceAll('×','*').replaceAll('÷','/');const tokens=src.match(/\d+|[()+*/-]/g)||[];if(tokens.join('')!==src||tokens.filter(x=>/^\d+$/.test(x)).sort().join()!==nums.map(String).sort().join())return false;let p=0;function atom(){let t=tokens[p++];if(t==='('){let n=sum();if(tokens[p++]!==')')throw Error();return n}if(!/^\d+$/.test(t))throw Error();return Number(t)}function product(){let n=atom();while(['*','/'].includes(tokens[p])){let op=tokens[p++],v=atom();n=op==='*'?n*v:n/v}return n}function sum(){let n=product();while(['+','-'].includes(tokens[p])){let op=tokens[p++],v=product();n=op==='+'?n+v:n-v}return n}try{return Math.abs(sum()-24)<1e-7&&p===tokens.length}catch{return false}}
function interactive(r){return ['问答','24 点'].includes(r.kind)}
function state(r){if(!shown.has(r.id))shown.set(r.id,{nums:r.kind==='24 点'?hand():[],done:''});return shown.get(r.id)}
function card(r){
 const a=el('article'),badge=el('span',icons[types.indexOf(r.kind)]+'　'+r.kind,'badge');let box=a;
 let url=r.image;if(r.blob){url=URL.createObjectURL(r.blob);urls.push(url)}
 if(r.kind==='图片'&&url){a.className='media';let hero=el('div',undefined,'hero'),im=el('img');im.src=url;im.alt=r.title||r.body||'本地照片';hero.append(im,badge);box=el('div',undefined,'pad');a.append(hero,box)}
 const meta=el('div',undefined,'meta');if(box===a)meta.append(badge);meta.append(el('time',new Date(r.at).toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'})));box.append(meta);
 if(r.title)box.append(el('h2',r.title));if(r.body)box.append(el('p',r.body));
 if(url&&['视频','语音'].includes(r.kind)){let player=el(r.kind==='视频'?'video':'audio');player.controls=true;player.preload='metadata';player.src=url;box.append(player)}
 for(let t of r.tags)box.append(el('span','# '+t,'tag'));
 if(interactive(r)){a.classList.add('challenge');const st=state(r);if(st.nums.length){const row=el('div',undefined,'numbers');st.nums.forEach(n=>row.append(el('b',n)));box.append(row)}
 if(st.done)box.append(el('p',st.done));else{const line=el('form',undefined,'reply'),input=el('input'),msg=el('p');input.placeholder=st.nums.length?'输入算式，例如 (1+3)×6×1':'输入答案';input.ariaLabel=input.placeholder;let skip=btn('这次跳过',()=>{st.done='已跳过';render()});skip.type='button';line.append(input,el('button','提交'),skip);line.onsubmit=e=>{e.preventDefault();if(st.nums.length?correct(input.value,st.nums):input.value.trim()===r.answer.trim()){st.done='答对了 ✓';render()}else msg.textContent='再试试，或选择跳过。'};box.append(line,msg)}}
 return a}
function render(){urls.forEach(u=>URL.revokeObjectURL(u));urls=[];const f=$('feed');f.replaceChildren();$('home').classList.toggle('active',!roam);$('random').classList.toggle('active',roam);let pool=matches();if(roam){f.append(btn('←　返回信息流',resetView,'step'));pool=pool.filter(r=>r.id===current)}if(!pool.length)f.append(el('article','没有找到片刻，可调整关键词或筛选条件。','empty'));for(let r of pool){f.append(card(r));if(interactive(r)&&!state(r).done)break}
 if(roam&&pool.length&&(!interactive(pool[0])||state(pool[0]).done))f.append(btn('再逛一个　→',shuffle,'step'));
 $('filters').replaceChildren(...['全部',...types].map(t=>btn(t,()=>{filter=t;resetView()},filter===t?'on':'')));cal()}
function cal(){const c=$('calendar');c.replaceChildren();$('month').textContent=cursor.getFullYear()+' 年 '+(cursor.getMonth()+1)+' 月';for(let s of '一二三四五六日')c.append(el('span',s));for(let i=0;i<(cursor.getDay()+6)%7;i++)c.append(el('span'));let d=new Date(cursor);while(d.getMonth()===cursor.getMonth()){const key=dateKey(d),b=btn(d.getDate(),()=>{day=key;resetView()});if(key===day||(!day&&key===dateKey(today)))b.className='today';if(records.some(r=>dateKey(new Date(r.at))===key))b.classList.add('marked');c.append(b);d.setDate(d.getDate()+1)}$('resetDate').hidden=!day}
$('prev').onclick=()=>{cursor.setMonth(cursor.getMonth()-1);cal()};$('next').onclick=()=>{cursor.setMonth(cursor.getMonth()+1);cal()};$('resetDate').onclick=()=>{day='';resetView()};$('random').onclick=$('wander').onclick=()=>{let pending=matches().find(r=>shown.has(r.id)&&interactive(r)&&!state(r).done);if(roam&&pending){$('feed').scrollIntoView();return}shuffle()};$('home').onclick=resetView;$('search').oninput=resetView;
for(const t of types)$('kind').add(new Option(t,t));function fields(){let k=$('kind').value,m={图片:'image/',视频:'video/',语音:'audio/'}[k];$('fileLabel').hidden=!m;$('file').accept=m?m+'*':'';$('file').required=!!m;$('answerLabel').hidden=k!=='问答';$('answer').required=k==='问答';$('bodyText').required=['问答','文字'].includes(k)}
$('kind').onchange=()=>{$('file').value='';fields()};document.querySelector('.write').onclick=()=>{$('form').reset();fields();$('error').textContent='';$('editor').showModal()};$('cancel').onclick=()=>$('editor').close();
$('form').onsubmit=e=>{e.preventDefault();if(!db){$('error').textContent='本地存储不可用，请检查浏览器存储权限。';return}let k=$('kind').value,body=$('bodyText').value.trim(),answer=$('answer').value.trim();if((['文字','问答'].includes(k)&&!body)||(k==='问答'&&!answer)){$('error').textContent='请输入有效内容。';return}let blob=$('file').files[0];if(!$('fileLabel').hidden&&!blob?.type.startsWith($('file').accept.slice(0,-1))){$('error').textContent='请选择对应格式的媒体文件。';return}let r={id:crypto.randomUUID(),at:Date.now(),kind:k,body,answer,tags:$('tags').value.trim().split(/\s+/).filter(Boolean),title:k==='24 点'?'来一局 24 点':''};if(!$('fileLabel').hidden)r.blob=blob;const save=$('form').querySelector('.gold');save.disabled=true;let tx=db.transaction('moments','readwrite');tx.objectStore('moments').add(r);tx.oncomplete=()=>{save.disabled=false;records.unshift(r);filter='全部';day='';$('search').value='';$('editor').close();resetView();window.scrollTo(0,0)};tx.onabort=()=>{save.disabled=false;$('error').textContent='保存失败，请检查设备可用空间。'}};
render();let open=indexedDB.open('moments-journal',1);open.onupgradeneeded=()=>open.result.createObjectStore('moments',{keyPath:'id'});open.onsuccess=()=>{db=open.result;let req=db.transaction('moments').objectStore('moments').getAll();req.onsuccess=()=>{records=[...req.result,...records].sort((a,b)=>b.at-a.at);render()}};
