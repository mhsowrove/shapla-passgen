'use strict';
const $=id=>document.getElementById(id), C=Shapla;
const words=SHAPLA_WORDS.filter(w=>/^[a-z]+$/.test(w));
const shortWords=words.filter(w=>w.length<=5);
const wordLists={long:words,short:shortWords,...SHAPLA_LISTS};
const state={password:[],passphrase:[],pin:[],username:[],bulk:[],shortlist:new Set(),wifi:null,qr:null,check:null};
let activeTool='password',copyRevision=0,checkRevision=0,breachController=null,installPrompt=null;
const forms={password:'pw',passphrase:'ph',username:'un',pin:'pin'};
const shared={password:['length','upper','lower','numbers','symbols','symbol-mode','custom','count','similar','require','exclude'],passphrase:['words','list','separator','custom','case','digit','symbol','max','count'],username:['theme','style','platform','max','words','number','list'],pin:['length','count','skip']};
function el(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function button(text,fn,className){const b=el('button',text,className);b.type='button';b.addEventListener('click',fn);if(className==='star')ShaplaIcons.decorate(b,'star',true);else if(text==='Copy')ShaplaIcons.decorate(b,'copy');return b;}
function status(tool,message,error=false){const n=$(tool+'-status');n.textContent=message;n.classList.toggle('error',error);}
function guard(tool,fn){try{fn();}catch(e){status(tool,e.message,true);}}
function pwOptions(){return {length:$('pw-length').value,upper:$('pw-upper').checked,lower:$('pw-lower').checked,numbers:$('pw-numbers').checked,symbols:$('pw-symbols').checked,symbolMode:$('pw-symbol-mode').value,customSymbols:$('pw-custom').value,similar:$('pw-similar').checked,requireEach:$('pw-require').checked,excluded:$('pw-exclude').value};}
function phOptions(){return {words:$('ph-words').value,separator:$('ph-separator').value==='custom'?$('ph-custom').value:$('ph-separator').value==='digits'?'-':$('ph-separator').value,randomDigits:$('ph-separator').value==='digits',casing:$('ph-case').value,digit:$('ph-digit').checked,symbol:$('ph-symbol').checked,maxLength:$('ph-max').value};}
function phraseList(){return wordLists[$('ph-list').value]||words;}
function describeBits(bits){if(bits===null)return {label:'Device lockout matters',level:0};const level=bits<40?0:bits<60?1:bits<80?2:3;return {label:['Low','Moderate','Strong','Very strong'][level],level};}
function renderResults(tool){
  const host=$(tool+'-result');host.replaceChildren();
  state[tool].forEach((item,index)=>{
    const row=el('div',undefined,'result-item'),value=el('div',item.value,'secret');value.tabIndex=0;value.setAttribute('aria-label',`Generated ${tool} ${index+1}`);
    const copy=button('Copy',()=>copyText(item.value,tool),'secret-copy');copy.setAttribute('aria-label',`Copy ${tool} ${index+1}`);row.append(value,copy);
    const meta=el('div',undefined,'result-meta'),strength=describeBits(item.bits);
    meta.append(el('strong',item.edited?'Manually adjusted':strength.label));
    if(item.bits!==null&&!item.edited){meta.append(el('span',`≈ ${item.bits.toFixed(1)} bits`));const track=el('span',undefined,'strength-track');track.dataset.level=strength.level;track.setAttribute('aria-hidden','true');track.append(el('i'));meta.append(track);}
    row.append(meta);host.append(row);
  });
  if(tool==='passphrase')renderSwaps();
}
function clearResults(tool){state[tool]=[];$(tool+'-result').replaceChildren();if(tool==='passphrase')$('word-swaps').replaceChildren();status(tool,'Settings changed. Generate a fresh result.');closeSecretDialogs();}
function closeSecretDialogs(){copyRevision++;for(const id of ['qr-dialog','copy-dialog'])if($(id).open)$(id).close();$('copy-value').value='';$('dialog-qr').replaceChildren();state.qr=null;}
async function copyText(text,tool){
  if(!text){status(tool,'Generate a result first.',true);return;}
  const revision=copyRevision;
  try{if(!navigator.clipboard||!window.isSecureContext)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(text);if(revision===copyRevision)status(tool,'Copied. Your device may keep clipboard history.');}
  catch{if(revision!==copyRevision)return;$('copy-value').value=text;$('copy-dialog').showModal();$('copy-value').focus();$('copy-value').select();status(tool,'Automatic copy unavailable. Copy from the selected text.');}
}
function runPassword(){clearResults('password');guard('password',()=>{const o=pwOptions(),n=C.integer($('pw-count').value,1,16,'Quantity'),random=C.rng();state.password=C.batch(n,()=>C.password(o,random));renderResults('password');status('password',`${n===1?'Password':n+' passwords'} ready. Generated on this device.`);});}
function runPhrase(){clearResults('passphrase');guard('passphrase',()=>{const o=phOptions(),n=C.integer($('ph-count').value,1,16,'Quantity'),random=C.rng();state.passphrase=C.batch(n,()=>C.phrase(o,phraseList(),random));renderResults('passphrase');status('passphrase',`${n} ${n===1?'passphrase':'passphrases'} ready · ${phraseList().length.toLocaleString()} words in the list.`);});}
function renderSwaps(){
  const host=$('word-swaps');host.replaceChildren();const item=state.passphrase[0];if(!item)return;
  item.parts.forEach((word,index)=>{const b=button(word,()=>guard('passphrase',()=>{
    const random=C.rng(),o=phOptions(),list=phraseList(),max=Number(o.maxLength),suffix=item.parts[index].slice(item.rawWords[index].length),available=list.filter(w=>!item.rawWords.includes(w)&&(!max||item.value.length-item.parts[index].length+w.length+suffix.length<=max));
    if(!available.length)throw Error('No replacement fits the current length limit.');
    const raw=available[random(available.length)],cased=o.casing==='upper'?raw.toUpperCase():o.casing==='title'?raw[0].toUpperCase()+raw.slice(1):raw;
    // Preserve existing separators and random suffixes; replace only this word.
    let offset=0;for(let i=0;i<index;i++)offset+=item.parts[i].length+(o.randomDigits?1:o.separator.length);
    item.value=item.value.slice(0,offset)+cased+suffix+item.value.slice(offset+item.parts[index].length);
    item.parts[index]=cased+suffix;item.rawWords[index]=raw;item.edited=true;renderResults('passphrase');closeSecretDialogs();status('passphrase','Word replaced. Estimate hidden because manual selection can introduce bias.');
  }));b.setAttribute('aria-label',`Replace word ${index+1}: ${word}`);host.append(b);});
}
function runPin(){clearResults('pin');guard('pin',()=>{const o={length:$('pin-length').value,skipEasy:$('pin-skip').checked},n=C.integer($('pin-count').value,1,16,'Quantity'),random=C.rng();state.pin=C.batch(n,()=>C.pin(o,random));renderResults('pin');status('pin',`${n} unique ${n===1?'PIN':'PINs'} ready.`);});}
function usernameOptions(){return {theme:$('un-theme').value,style:$('un-style').value,include:$('un-include').value,maxLength:$('un-max').value,wordCount:$('un-words').value,number:$('un-number').checked};}
function fitsPlatform(value){const p=$('un-platform').value;const rules={instagram:/^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$/i,tiktok:/^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$/i,youtube:/^[a-z0-9][a-z0-9_.-]*[a-z0-9]$/i,snapchat:/^[a-z][a-z0-9_.-]{1,13}[a-z0-9]$/i,x:/^[a-z0-9_]{4,15}$/i,discord:/^[a-z0-9_.]{2,32}$/,reddit:/^[a-z0-9_-]{3,20}$/i,roblox:/^[a-z0-9]+(?:_[a-z0-9]+)?$/i,minecraft:/^[a-z0-9_]{3,16}$/i,fortnite:/^[a-z0-9]{3,16}$/i,xbox:/^[a-z][a-z0-9]{2,11}$/i,playstation:/^[a-z][a-z0-9_-]{2,15}$/i,twitch:/^[a-z0-9][a-z0-9_]{3,24}$/i};return !rules[p]||rules[p].test(value)&&!value.includes('..');}
function runUsername(append=false){guard('username',()=>{
  const o=usernameOptions();C.integer(o.maxLength,3,40,'Maximum length');if(o.include&&!/^[a-z0-9]{1,12}$/i.test(o.include))throw Error('The included word must use 1–12 letters or digits.');
  const previous=append?state.username:[],seen=new Set(previous.map(x=>x.value)),items=[],random=C.rng();
  for(let tries=0;items.length<12&&tries<10000;tries++){const item=C.username(o,wordLists[$('un-list').value]||shortWords,random);if(item&&!seen.has(item.value)&&fitsPlatform(item.value)){seen.add(item.value);items.push(item);}}
  if(!items.length)throw Error('No names fit these settings. Increase the length, shorten the included word, or change the style.');
  state.username=previous.concat(items).slice(-120);renderNames();status('username',`${state.username.length} ideas. Tap to copy; star to keep. Availability is not checked.`);
});}
function renderNames(){
  for(const [host,values] of [[$('username-result'),state.username.map(x=>x.value)],[$('shortlist'),[...state.shortlist]]]){
    host.replaceChildren();for(const value of values){const row=el('div',undefined,'name-card'),copy=button(value,()=>copyText(value,'username'),'name-copy'),star=button(state.shortlist.has(value)?'★':'☆',()=>{
      if(state.shortlist.has(value))state.shortlist.delete(value);else if(state.shortlist.size<50)state.shortlist.add(value);else{status('username','Your shortlist is full (50 names).',true);return;}renderNames();
    },'star');star.setAttribute('aria-label',`${state.shortlist.has(value)?'Remove':'Add'} ${value} ${state.shortlist.has(value)?'from':'to'} shortlist`);star.setAttribute('aria-pressed',String(state.shortlist.has(value)));row.append(copy,star);host.append(row);}
  }$('shortlist-count').textContent=state.shortlist.size;
}
function route(){
  const [name,query='']=location.hash.slice(1).split('?');activeTool=['password','passphrase','username','pin','check','bulk','wifi'].includes(name)?name:'password';
  document.querySelectorAll('.tool-panel').forEach(p=>{p.hidden=p.id!=='panel-'+activeTool;});document.querySelectorAll('[data-tool]').forEach(a=>{if(a.dataset.tool===activeTool)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(shared[activeTool]&&query){const params=new URLSearchParams(query),prefix=forms[activeTool];for(const key of shared[activeTool])if(params.has(key)){const node=$(prefix+'-'+key),v=params.get(key);if(v.length>256)continue;if(node.type==='checkbox')node.checked=v==='1';else if(node.tagName==='SELECT'){if([...node.options].some(o=>o.value===v))node.value=v;}else node.value=v;}}
  updateVisibility();document.title=`${$('title-'+activeTool).textContent} — Shapla Passgen`;closeSecretDialogs();
  if(activeTool==='password')runPassword();if(activeTool==='passphrase')runPhrase();if(activeTool==='pin')runPin();if(activeTool==='username')runUsername();
}
function updateVisibility(){
  $('custom-symbol-field').hidden=$('pw-symbol-mode').value!=='custom';$('ph-custom-field').hidden=$('ph-separator').value!=='custom';$('pw-range').value=$('pw-length').value;
  $('bulk-list-field').hidden=$('bulk-mode').value!=='list';$('bulk-count-field').hidden=$('bulk-mode').value==='list';$('wifi-password').disabled=$('wifi-security').value==='nopass';
}
function settingsLink(tool){const prefix=forms[tool],params=new URLSearchParams();for(const key of shared[tool]){const n=$(prefix+'-'+key);params.set(key,n.type==='checkbox'?(n.checked?'1':'0'):n.value);}const url=new URL(location.href);url.search='';url.hash=tool+'?'+params;copyText(url.href,tool);}
function makeQr(value){
  if(typeof qrcode!=='function')throw Error('The local QR library could not load.');
  qrcode.stringToBytes=s=>Array.from(new TextEncoder().encode(s));const qr=qrcode(0,'M');qr.addData(value,'Byte');qr.make();return qr.createSvgTag({cellSize:5,margin:20,scalable:true});
}
function showQr(tool){guard(tool,()=>{if(!state[tool].length)throw Error('Generate a result first.');const value=state[tool][0].value;state.qr={value,svg:makeQr(value),wifi:false};$('dialog-qr').innerHTML=state.qr.svg;$('qr-title').textContent='Scan your '+tool;$('qr-description').textContent='Anyone who scans this code can read the secret. Keep it private.';$('qr-to-wifi').hidden=false;$('qr-dialog').showModal();});}
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function downloadPng(svg,name){
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),image=new Image();image.onload=()=>{const canvas=el('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1024,1024);ctx.drawImage(image,0,0,1024,1024);canvas.toBlob(blob=>{if(blob)download(blob,name,'image/png');else status('wifi','PNG export failed.',true);});URL.revokeObjectURL(url);};image.onerror=()=>{URL.revokeObjectURL(url);status('wifi','PNG export failed. Try SVG instead.',true);};image.src=url;
}
function checkPassword(){
  checkRevision++;breachController?.abort();$('breach-status').textContent='';state.check=null;
  const value=$('check-password').value,host=$('check-result');host.replaceChildren();$('check-times').replaceChildren();
  if(!value){host.append(el('p','Type a password to analyze it locally.'));return;}
  if(typeof zxcvbn!=='function'){host.append(el('p','The local strength library could not load.'));return;}
  const result=zxcvbn(value);state.check=result;host.append(el('h3',['Very weak','Weak','Fair','Strong','Very strong'][result.score]));
  const patterns=[...new Set(result.sequence.map(x=>({dictionary:'dictionary words or common passwords',spatial:'keyboard patterns',repeat:'repeated characters',sequence:'sequences',date:'dates',regex:'predictable patterns',bruteforce:'unrecognized strings'}[x.pattern]||x.pattern)))];
  host.append(el('p','Model detected: '+patterns.join(', ')+'.'));
  if(result.feedback.warning)host.append(el('p',result.feedback.warning));
  const list=el('ul');for(const text of result.feedback.suggestions)list.append(el('li',text));if(list.childNodes.length)host.append(list);
  host.append(el('p','This model can reveal weaknesses; it cannot certify a password as safe.'));renderTimes();
}
function timeText(seconds){if(seconds<1)return 'Less than a second';if(seconds<60)return `${Math.round(seconds)} seconds`;if(seconds<3600)return `${Math.round(seconds/60)} minutes`;if(seconds<86400)return `${Math.round(seconds/3600)} hours`;if(seconds<31557600)return `${Math.round(seconds/86400)} days`;const years=seconds/31557600;return years<1e6?`${Math.round(years).toLocaleString()} years`:`~ ${years.toExponential(1)} years`;}
function renderTimes(){const host=$('check-times');host.replaceChildren();if(!state.check)return;const gpu=Number($('check-gpus').value);for(const [label,rate] of [['Fast website hash',2e11],['WPA2 Wi-Fi',3e6],['Vault / encrypted drive',1e5]]){const p=el('p');p.append(el('span',label),el('strong',timeText(state.check.guesses/(2*rate*gpu))));host.append(p);}}
async function breachCheck(){
  const value=$('check-password').value;if(!value){$('breach-status').textContent='Enter a password first.';return;}
  const revision=checkRevision;breachController?.abort();const controller=new AbortController();breachController=controller;
  const timer=setTimeout(()=>controller.abort(),15000);$('breach-check').disabled=true;
  try{
    if(!crypto.subtle)throw Error('This lookup requires HTTPS or localhost.');
    const digest=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(value));if(revision!==checkRevision)return;
    const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase(),prefix=hash.slice(0,5);
    $('breach-status').textContent=`Checking hash prefix ${prefix} with Have I Been Pwned…`;
    const response=await fetch('https://api.pwnedpasswords.com/range/'+prefix,{headers:{'Add-Padding':'true'},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});
    if(!response.ok)throw Error('The breach service is unavailable. Try later.');const data=await response.text();if(revision!==checkRevision)return;
    let count=0;for(const line of data.split(/\r?\n/)){const [suffix,n]=line.split(':');if(suffix===hash.slice(5)){count=Number(n)||0;break;}}
    $('breach-status').textContent=count?`Found ${count.toLocaleString()} times in the Pwned Passwords data. Replace it wherever used.`:'Not found in the returned breach data. This does not prove it is safe.';
  }catch(e){if(revision===checkRevision)$('breach-status').textContent=e.name==='AbortError'?'Lookup cancelled or timed out. No result is available.':e.message;}
  finally{clearTimeout(timer);if(breachController===controller){$('breach-check').disabled=false;breachController=null;}}
}
const bulkCache=new Map();
function bulkStyle(){const style=$('bulk-style').value;const rules={password:[8,64,14,'Characters'],passphrase:[3,8,4,'Words'],readable:[8,32,10,'Characters'],children:[2,3,2,'Short words'],pin:[4,12,6,'Digits']};const [min,max,value,label]=rules[style];$('bulk-length').min=min;$('bulk-length').max=max;$('bulk-length').value=value;$('bulk-length-label').textContent=label;}
function parseCells(line){const delimiter=line.includes('\t')?'\t':',';let cells=[],value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){cells.push(value.trim());value='';}else value+=c;}if(quoted)throw Error('A list row has an unmatched quote.');cells.push(value.trim());return cells;}
function bulkPeople(){
  const count=$('bulk-mode').value==='count'?C.integer($('bulk-count').value,1,1000,'Accounts'):0;let input=$('bulk-mode').value==='count'?Array.from({length:count},(_,i)=>({name:`User ${i+1}`,base:'user'+String(i+1).padStart(2,'0'),username:''})):$('bulk-list').value.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
    const cells=parseCells(line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/,''));if(/^(name|full name)$/i.test(cells[0])&&cells.some(x=>/email|username/i.test(x)))return null;
    const email=cells.find(x=>x.includes('@'));const name=(email?cells.filter(x=>x!==email)[0]||email.split('@')[0]:cells[0]).trim();return {name,username:email||'',source:line};
  }).filter(Boolean);
  if(!input.length||input.length>1000)throw Error('Enter between 1 and 1,000 accounts.');
  const domain=$('bulk-domain').value.trim().toLowerCase();if(domain&&!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain))throw Error('Enter a domain such as example.com, without https://.');
  const used=new Set();return input.map((p,i)=>{
    if(p.username&&!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(p.username))throw Error(`Row ${i+1}: email address looks invalid.`);
    let username=p.username;if(!username){let slug=(p.base||p.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'')||'user'+(i+1)).slice(0,45),suffix=1;username=slug+(domain?'@'+domain:'');while(used.has(username.toLowerCase())){suffix++;username=slug+suffix+(domain?'@'+domain:'');}}
    if(used.has(username.toLowerCase()))throw Error(`Row ${i+1}: duplicate email ${username}.`);used.add(username.toLowerCase());return {...p,username};
  });
}
function runBulk(preserve=false){guard('bulk',()=>{
  const people=bulkPeople(),style=$('bulk-style').value,n=Number($('bulk-length').value),bounds={password:[8,64],passphrase:[3,8],readable:[8,32],children:[2,3],pin:[4,12]};C.integer(n,...bounds[style],'Length');const random=C.rng(),seen=new Set(),occurrences=new Map();
  function make(){
    if(style==='pin')return C.pin({length:n,skipEasy:true},random).value;
    const list=wordLists[$('bulk-wordlist').value]||words;
    if(style==='passphrase')return C.phrase({words:n,separator:'-',digit:true},list,random).value;
    if(style==='children'){const short=list.filter(w=>w.length<=5),selected=[];while(selected.length<n){const w=short[random(short.length)];if(!selected.includes(w))selected.push(w);}return selected.map(w=>w[0].toUpperCase()+w.slice(1)).join('-')+'-'+String(random(90)+10);}
    return C.password({length:n,upper:true,lower:true,numbers:true,symbols:style==='password',symbolMode:'common',similar:false},random).value;
  }
  const nextCache=new Map();state.bulk=people.map(p=>{
    const occurrence=occurrences.get(p.source||p.name)||0;occurrences.set(p.source||p.name,occurrence+1);const key=[p.source||p.name,occurrence,style,n,$('bulk-wordlist').value].join('|');let value=preserve?bulkCache.get(key):null;
    for(let tries=0;!value||seen.has(value)||/^[=+@-]/.test(value);tries++){if(tries>10000)throw Error('Unable to generate unique credentials. Increase length.');value=make();}
    seen.add(value);nextCache.set(key,value);return {...p,password:value};
  });bulkCache.clear();for(const [k,v] of nextCache)bulkCache.set(k,v);renderBulk();setBulkActions(true);status('bulk',`${state.bulk.length} accounts ready. Downloads contain plaintext credentials.`);
});}
function setBulkActions(on){for(const id of ['bulk-download','bulk-copy','bulk-print'])$(id).disabled=!on;}
function renderBulk(){const host=$('bulk-table');host.replaceChildren();if(!state.bulk.length)return;const table=el('table'),caption=el('caption',`${state.bulk.length} generated accounts`),head=el('thead'),hr=el('tr');for(const label of ['Name','Username / email','Password','']){const th=el('th',label);th.scope='col';hr.append(th);}head.append(hr);const body=el('tbody');for(const p of state.bulk){const row=el('tr'),secret=el('td');secret.append(el('code',p.password));const action=el('td');action.append(button('Copy',()=>copyText(p.password,'bulk'),'text-button'));row.append(el('td',p.name),el('td',p.username),secret,action);body.append(row);}table.append(caption,head,body);host.append(table);}
function bulkCSV(){
  if(!state.bulk.length)throw Error('Generate accounts first.');const format=$('bulk-format').value,change=$('bulk-change').checked;
  if(['entra','google'].includes(format)&&state.bulk.some(p=>!p.username.includes('@')))throw Error('Add a domain or email address for every account before using this format.');
  const cell=v=>C.csvCell(C.safeCell(v));let rows,prelude='';
  if(format==='google')rows=[['First Name [Required]','Last Name [Required]','Email Address [Required]','Password [Required]','Password Hash Function [UPLOAD ONLY]','Org Unit Path [Required]','Change Password at Next Sign-In'],...state.bulk.map(p=>{const names=p.name.trim().split(/\s+/);return [names[0],names.slice(1).join(' ')||names[0],p.username,p.password,'','/',change?'TRUE':'FALSE'];})];
  else if(format==='entra'){prelude='version:v1.0\r\n';rows=[['Name [displayName] Required','User name [userPrincipalName] Required','Initial password [passwordProfile] Required','Block sign in (Yes/No) [accountEnabled] Required','First name [givenName]','Last name [surname]','Job title [jobTitle]','Department [department]','Usage location [usageLocation]','Street address [streetAddress]','State or province [state]','Country or region [country]','Office [physicalDeliveryOfficeName]','City [city]','ZIP or postal code [postalCode]','Office phone [telephoneNumber]','Mobile phone [mobile]'],...state.bulk.map(p=>[p.name,p.username,p.password,'No',p.name.split(/\s+/)[0],p.name.split(/\s+/).slice(1).join(' '),'','','','','','','','','','',''])];}
  else if(format==='ad'){
    const used=new Set();rows=[['Name','GivenName','Surname','DisplayName','SamAccountName','UserPrincipalName','AccountPassword','ChangePasswordAtLogon'],...state.bulk.map(p=>{const sam=p.username.split('@')[0].replace(/[^a-z0-9._-]/gi,'').slice(0,20);if(!sam||used.has(sam.toLowerCase()))throw Error('Active Directory account names collide after the 20-character limit. Edit the names and regenerate.');used.add(sam.toLowerCase());return [p.name,p.name.split(/\s+/)[0],p.name.split(/\s+/).slice(1).join(' '),p.name,sam,p.username,p.password,change?'$true':'$false'];})];
  }else rows=[['name','username','password','change_at_next_sign_in'],...state.bulk.map(p=>[p.name,p.username,p.password,change?'true':'false'])];
  return prelude+rows.map(r=>r.map(cell).join(',')).join('\r\n');
}
function wifiOptions(){return {ssid:$('wifi-ssid').value,password:$('wifi-password').value,security:$('wifi-security').value,hidden:$('wifi-hidden').checked};}
function runWifi(){guard('wifi',()=>{const o=wifiOptions(),payload=C.wifiPayload(o),svg=makeQr(payload);state.wifi={...o,payload,svg};$('wifi-qr').innerHTML=svg;$('wifi-display-ssid').textContent=o.ssid;$('wifi-preview').hidden=false;updateWifiPayload();status('wifi','QR code ready. Test it with your phone before printing.');});}
function updateWifiPayload(){if(!state.wifi)return;const o=state.wifi;$('wifi-payload').textContent=$('wifi-show').checked?o.payload:C.wifiPayload({...o,password:o.security==='WEP'?'*****':'********'});}
function clearWifi(){state.wifi=null;$('wifi-preview').hidden=true;$('wifi-qr').replaceChildren();$('wifi-payload').textContent='';status('wifi','Network changed. Create a new code.');closeSecretDialogs();}
function wifiCard(){
  const o=state.wifi,card=el('article',undefined,'print-card');card.append(el('h2',$('wifi-title').value||'Guest Wi-Fi'),el('p','Scan to join'));const qr=el('div');qr.innerHTML=o.svg;card.append(qr,el('p','Network: '+o.ssid));if(o.security!=='nopass')card.append(el('p','Password: '+o.password));
  const translations={bn:['সংযোগ করতে স্ক্যান করুন','নেটওয়ার্ক','পাসওয়ার্ড'],es:['Escanea para conectarte','Red','Contraseña'],fr:['Scannez pour vous connecter','Réseau','Mot de passe'],de:['Zum Verbinden scannen','Netzwerk','Passwort']},t=translations[$('wifi-language').value];if(t)card.append(el('p',t[0]),el('p',t[1]+': '+o.ssid),el('p',o.security==='nopass'?'':t[2]+': '+o.password));if($('wifi-note').value)card.append(el('p',$('wifi-note').value));card.append(el('small','Shapla Passgen'));return card;
}
function printContent(sheet){$('print-area').replaceChildren(sheet);window.print();}
function printWifi(){guard('wifi',()=>{if(!state.wifi)throw Error('Create a Wi-Fi code first.');const layout=$('wifi-layout').value,sheet=el('div',undefined,'print-sheet '+layout),n=layout==='four'?4:layout==='table'?2:1;for(let i=0;i<n;i++)sheet.append(wifiCard());printContent(sheet);});}
function printBulk(){guard('bulk',()=>{if(!state.bulk.length)throw Error('Generate accounts first.');const sheet=el('div',undefined,'print-sheet slips');for(const p of state.bulk){const card=el('article',undefined,'print-card');card.append(el('h2',$('bulk-title').value||'Your sign-in'),el('p',p.name),el('p','Username: '+p.username),el('code',p.password));if($('bulk-url').value)card.append(el('p','Sign in at: '+$('bulk-url').value));if($('bulk-change').checked)card.append(el('p','Choose a new password when you first sign in.'));sheet.append(card);}printContent(sheet);});}
// Event wiring: every form is local; no form submission leaves the page.
for(const [tool,run] of [['password',runPassword],['passphrase',runPhrase],['pin',runPin],['username',()=>runUsername()],['bulk',()=>runBulk()],['wifi',runWifi]])$(tool+'-form').addEventListener('submit',e=>{e.preventDefault();run();});
for(const tool of ['password','passphrase','pin'])$(tool+'-form').addEventListener('input',()=>{updateVisibility();clearResults(tool);});
$('pw-range').addEventListener('input',()=>{$('pw-length').value=$('pw-range').value;});
// Capture the range event before the shared form listener synchronizes the slider.
$('pw-range').addEventListener('input',()=>{$('pw-length').value=$('pw-range').value;},true);
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{const [id,step]=b.dataset.step.split(':'),n=$(id);n.value=Math.max(Number(n.min),Math.min(Number(n.max),(Number(n.value)||16)+Number(step)));updateVisibility();clearResults('password');}));
document.querySelectorAll('[data-copy-results]').forEach(b=>b.addEventListener('click',()=>copyText(state[b.dataset.copyResults].map(x=>x.value).join('\n'),b.dataset.copyResults)));
document.querySelectorAll('[data-share]').forEach(b=>b.addEventListener('click',()=>settingsLink(b.dataset.share)));
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const preset=b.dataset.preset;$('pw-length').value=preset==='server'?32:16;for(const key of ['upper','lower','numbers','similar','require'])$('pw-'+key).checked=true;$('pw-symbols').checked=preset==='default';$('pw-similar').checked=preset!=='readable';$('pw-symbol-mode').value='all';$('pw-exclude').value='';$('pw-count').value=1;updateVisibility();runPassword();}));
$('terminal-symbols').addEventListener('click',()=>{$('pw-symbol-mode').value='custom';$('pw-custom').value='-_';$('pw-symbols').checked=true;updateVisibility();clearResults('password');});
document.querySelectorAll('[data-phrase-preset]').forEach(b=>b.addEventListener('click',()=>{const preset=b.dataset.phrasePreset;$('ph-words').value=preset==='master'||preset==='disk'?8:preset==='strict'?6:7;$('ph-case').value=preset==='master'||preset==='strict'?'title':'lower';$('ph-digit').checked=preset==='master';$('ph-symbol').checked=preset==='strict';$('ph-separator').value=preset==='spoken'?' ':preset==='strict'?'digits':'-';$('ph-max').value='0';$('ph-count').value=1;updateVisibility();runPhrase();}));
$('password-qr').addEventListener('click',()=>showQr('password'));$('phrase-qr').addEventListener('click',()=>showQr('passphrase'));
for(const [dialog,close] of [['qr-dialog','qr-close'],['copy-dialog','copy-close'],['install-dialog','install-close']])$(close).addEventListener('click',()=>$(dialog).close());
$('qr-dialog').addEventListener('close',()=>{$('dialog-qr').replaceChildren();state.qr=null;});$('copy-dialog').addEventListener('close',()=>{$('copy-value').value='';});
$('dialog-qr-save').addEventListener('click',()=>{if(state.qr)download(state.qr.svg,'shapla-private-qr.svg','image/svg+xml');});
$('qr-to-wifi').addEventListener('click',()=>{if(!state.qr)return;const value=state.qr.value;$('wifi-password').value=value;$('qr-dialog').close();location.hash='wifi';clearWifi();});
$('un-platform').addEventListener('change',()=>{const [max,style]=C.PLATFORMS[$('un-platform').value];$('un-max').value=max;$('un-style').value=style;state.username=[];renderNames();status('username','Platform settings applied. Generate new names.');});
$('username-form').addEventListener('input',()=>{state.username=[];renderNames();status('username','Settings changed. Generate new names.');});
$('more-names').addEventListener('click',()=>runUsername(true));$('copy-shortlist').addEventListener('click',()=>copyText([...state.shortlist].join('\n'),'username'));$('clear-shortlist').addEventListener('click',()=>{state.shortlist.clear();renderNames();});
$('check-password').addEventListener('input',checkPassword);$('check-show').addEventListener('change',()=>{$('check-password').type=$('check-show').checked?'text':'password';});$('check-gpus').addEventListener('change',renderTimes);$('check-random').addEventListener('click',()=>guard('check',()=>{$('check-password').value=C.password({length:20,upper:true,lower:true,numbers:true,symbols:true,similar:true}).value;checkPassword();}));$('breach-check').addEventListener('click',breachCheck);
$('bulk-style').addEventListener('change',bulkStyle);$('bulk-form').addEventListener('input',()=>{setBulkActions(false);state.bulk=[];$('bulk-table').replaceChildren();updateVisibility();status('bulk','Settings changed. Generate accounts to update the list.');});
$('bulk-list').addEventListener('change',()=>runBulk(true));$('bulk-download').addEventListener('click',()=>guard('bulk',()=>download('\ufeff'+bulkCSV(),'shapla-'+$('bulk-format').value+'.csv','text/csv;charset=utf-8')));$('bulk-copy').addEventListener('click',()=>copyText(state.bulk.map(p=>[p.name,p.username,p.password].join('\t')).join('\n'),'bulk'));$('bulk-print').addEventListener('click',printBulk);
$('wifi-form').addEventListener('input',e=>{if(e.target.id==='wifi-show')return;updateVisibility();clearWifi();});$('wifi-show').addEventListener('change',()=>{$('wifi-password').type=$('wifi-show').checked?'text':'password';updateWifiPayload();});
$('wifi-random').addEventListener('click',()=>guard('wifi',()=>{$('wifi-password').value=C.password({length:20,upper:true,lower:true,numbers:true,symbols:false,similar:false}).value;$('wifi-security').value='WPA';updateVisibility();clearWifi();status('wifi','Password ready. Set it on your router, then create the code.');}));
$('wifi-phrase').addEventListener('click',()=>guard('wifi',()=>{$('wifi-password').value=C.phrase({words:5,separator:'-',digit:true},shortWords).value;$('wifi-security').value='WPA';updateVisibility();clearWifi();status('wifi','Passphrase ready. Set it on your router, then create the code.');}));
$('wifi-svg').addEventListener('click',()=>{if(state.wifi)download(state.wifi.svg,'shapla-wifi.svg','image/svg+xml');});$('wifi-png').addEventListener('click',()=>{if(state.wifi)downloadPng(state.wifi.svg,'shapla-wifi.png');});$('wifi-print').addEventListener('click',printWifi);
$('wifi-screen').addEventListener('click',()=>{if(!state.wifi)return;state.qr={value:state.wifi.payload,svg:state.wifi.svg,wifi:true};$('dialog-qr').innerHTML=state.wifi.svg;$('qr-title').textContent=state.wifi.ssid;$('qr-description').textContent='Scan to join this Wi-Fi network. Anyone scanning can read the credentials.';$('qr-to-wifi').hidden=true;$('qr-dialog').showModal();});
window.addEventListener('afterprint',()=>{$('print-area').replaceChildren();});
const media=matchMedia('(prefers-color-scheme: dark)');function isDark(){return document.documentElement.dataset.theme?document.documentElement.dataset.theme==='dark':media.matches;}function themeLabel(){$('theme').setAttribute('aria-label',`Switch to ${isDark()?'light':'dark'} theme`);ShaplaIcons.decorate($('theme'),isDark()?'sun':'moon',true);$('theme').title=$('theme').getAttribute('aria-label');}
$('theme').addEventListener('click',()=>{document.documentElement.dataset.theme=isDark()?'light':'dark';themeLabel();});media.addEventListener('change',themeLabel);
$('motion').addEventListener('click',()=>{const paused=document.body.classList.toggle('paused');ShaplaIcons.decorate($('motion'),paused?'play':'pause',true);$('motion').setAttribute('aria-pressed',String(paused));$('motion').setAttribute('aria-label',paused?'Resume background animation':'Pause background animation');$('motion').title=$('motion').getAttribute('aria-label');});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});$('install').addEventListener('click',async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $('install-dialog').showModal();});
if('serviceWorker'in navigator&&window.isSecureContext&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').then(()=>{$('offline-status').textContent='Offline caching is registered. Keep this page open until all assets finish loading, then test offline before relying on it.';}).catch(()=>{$('offline-status').textContent='Offline caching could not register. The open page still generates locally; keep the downloaded project as a backup.';});
const languageNames={ca:'Català',de:'Deutsch',es:'Español',fr:'Français',it:'Italiano','pt-br':'Português (Brasil)'};
for(const [key,label] of Object.entries(languageNames)){const option=el('option',label+' · Latin letters');option.value=key;$('ph-list').append(option);}
for(const [id,form] of [['un-list','username-form'],['bulk-wordlist','bulk-form']]){
  const label=el('label','Word-list language','field'),select=el('select');select.id=id;
  for(const [key,name] of Object.entries({long:'English',...languageNames})){const option=el('option',name);option.value=key;select.append(option);}
  label.append(select,el('span','Applies to random words and passphrases. Accents are transliterated for compatibility.','hint'));$(form).insertBefore(label,$(form).querySelector('.primary'));
}
window.addEventListener('hashchange',route);ShaplaIcons.polish();themeLabel();checkPassword();route();
