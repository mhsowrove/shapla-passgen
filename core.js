(function(root){
  'use strict';
  const UPPER='ABCDEFGHIJKLMNOPQRSTUVWXYZ', LOWER='abcdefghijklmnopqrstuvwxyz', DIGITS='0123456789';
  const SYMBOLS=Array.from({length:94},(_,i)=>String.fromCharCode(i+33)).filter(c=>!/[a-z0-9]/i.test(c)).join('');
  const COMMON='!@#$%^&*';
  function integer(value,min,max,label='Value'){
    const n=Number(value); if(!Number.isInteger(n)||n<min||n>max)throw Error(`${label} must be a whole number from ${min} to ${max}.`); return n;
  }
  function rng(source=root.crypto){
    if(!source?.getRandomValues)throw Error('Secure randomness is unavailable. Use HTTPS or localhost in a current browser.');
    const buffer=new Uint32Array(256); let cursor=256;
    return function(n){
      integer(n,1,0x100000000,'Random range');
      const limit=Math.floor(0x100000000/n)*n;
      for(;;){if(cursor===256){source.getRandomValues(buffer);cursor=0;}const x=buffer[cursor++];if(x<limit)return x%n;}
    };
  }
  function log2(n){if(n<1n)return 0;const shift=Math.max(0,n.toString(2).length-53);return Math.log2(Number(n>>BigInt(shift)))+shift;}
  function validCount({length,groups,requireEach}){
    const size=groups.reduce((n,g)=>n+g.length,0);let count=0n;
    if(!requireEach)return BigInt(size)**BigInt(length);
    for(let mask=0;mask<(1<<groups.length);mask++){
      let removed=0,parity=0;
      groups.forEach((g,i)=>{if(mask&(1<<i)){removed+=g.length;parity++;}});
      count+=(parity%2?-1n:1n)*BigInt(size-removed)**BigInt(length);
    }
    return count;
  }
  function config(o){
    const length=integer(o.length,6,256,'Password length');
    const exclude=new Set(o.excluded||'');
    if(!o.similar)for(const c of '0Oo1IiLl')exclude.add(c);
    let symbols=SYMBOLS;
    if(o.symbolMode==='common')symbols=COMMON;
    if(o.symbolMode==='custom')symbols=[...new Set(o.customSymbols||'')].filter(c=>SYMBOLS.includes(c)).join('');
    const groups=[[o.upper,UPPER],[o.lower,LOWER],[o.numbers,DIGITS],[o.symbols,symbols]].filter(([on])=>on).map(([,s])=>[...s].filter(c=>!exclude.has(c)).join(''));
    if(!groups.length)throw Error('Select at least one character type.');
    if(groups.some(g=>!g.length))throw Error('A selected type has no characters left. Adjust exclusions or the custom symbols.');
    return {length,groups,requireEach:o.requireEach!==false};
  }
  function password(o,random=rng()){
    const c=config(o),alphabet=c.groups.join('');
    for(let tries=0;tries<10000;tries++){
      let value='';for(let i=0;i<c.length;i++)value+=alphabet[random(alphabet.length)];
      if(!c.requireEach||c.groups.every(g=>[...value].some(x=>g.includes(x))))return {value,bits:log2(validCount(c))};
    }
    throw Error('Could not meet the character requirements. Please try again.');
  }
  function falling(n,k){let count=1n;for(let i=0;i<k;i++)count*=BigInt(n-i);return count;}
  function lengthCount(counts,k,budget){
    if(k===0)return 1n;if(budget<k)return 0n;
    if(budget>=k*Math.max(...Object.keys(counts).map(Number)))return falling(Object.values(counts).reduce((a,b)=>a+b,0),k);
    let dp=Array.from({length:k+1},()=>Array(budget+1).fill(0n));dp[0][0]=1n;
    for(const [size,total] of Object.entries(counts)){
      const len=Number(size),next=Array.from({length:k+1},()=>Array(budget+1).fill(0n));
      const choose=[1n];for(let j=1;j<=Math.min(k,total);j++)choose[j]=choose[j-1]*BigInt(total-j+1)/BigInt(j);
      for(let used=0;used<=k;used++)for(let sum=0;sum<=budget;sum++)if(dp[used][sum]){
        for(let j=0;j<choose.length&&used+j<=k&&sum+j*len<=budget;j++)next[used+j][sum+j*len]+=dp[used][sum]*choose[j];
      }dp=next;
    }
    return dp[k].reduce((a,b)=>a+b,0n)*falling(k,k);
  }
  function bigRandom(max,random){
    const bits=max.toString(2).length, chunks=Math.ceil(bits/32),mask=(1n<<BigInt(bits))-1n;
    for(;;){let n=0n;for(let i=0;i<chunks;i++)n=(n<<32n)|BigInt(random(0x100000000));n&=mask;if(n<max)return n;}
  }
  function phrase(o,words,random=rng()){
    const count=integer(o.words,3,12,'Word count');
    const separator=String(o.separator??'-');if(separator.length>4)throw Error('Use a separator of at most four characters.');
    if(!o.randomDigits&&!/^[^a-zA-Z0-9]{1,4}$/.test(separator))throw Error('Use 1–4 spaces or punctuation characters between words.');
    const lists={};for(const w of words)(lists[w.length]??=[]).push(w);
    const counts=Object.fromEntries(Object.entries(lists).map(([l,a])=>[l,a.length]));
    const max=o.maxLength?integer(o.maxLength,12,256,'Maximum phrase length'):0;
    let budget=max?max-(o.randomDigits?1:separator.length)*(count-1)-(o.digit?1:0)-(o.symbol?1:0):count*Math.max(...words.map(w=>w.length));
    const possibilities=lengthCount(counts,count,budget);
    if(!possibilities)throw Error('No passphrase fits this maximum length. Increase it or use fewer words.');
    let selected=[];const used=new Set();
    for(let step=0;step<count;step++){
      const choices=[];let total=0n;
      for(const size of Object.keys(counts))if(counts[size]&&Number(size)<=budget){
        counts[size]--;const weight=BigInt(counts[size]+1)*lengthCount(counts,count-step-1,budget-Number(size));counts[size]++;
        if(weight){choices.push([size,weight]);total+=weight;}
      }
      let draw=bigRandom(total,random),size;
      for(const choice of choices){if(draw<choice[1]){size=choice[0];break;}draw-=choice[1];}
      const available=lists[size].filter(w=>!used.has(w)),word=available[random(available.length)];
      selected.push(word);used.add(word);counts[size]--;budget-=Number(size);
    }
    const rawWords=selected.slice();
    if(o.casing==='title')selected=selected.map(w=>w[0].toUpperCase()+w.slice(1));
    if(o.casing==='upper')selected=selected.map(w=>w.toUpperCase());
    let bits=log2(possibilities);
    if(o.digit){selected[random(count)]+=DIGITS[random(10)];bits+=Math.log2(10*count);}
    if(o.symbol){selected[random(count)]+=COMMON[random(COMMON.length)];bits+=Math.log2(COMMON.length*count);}
    let value=selected[0];for(let i=1;i<count;i++){value+=(o.randomDigits?DIGITS[random(10)]:separator)+selected[i];}
    if(o.randomDigits)bits+=(count-1)*Math.log2(10);
    return {value,bits,parts:selected,rawWords};
  }
  const PIN_COMMON=new Set(['1342','2580','0852','5683','1998','2000','2001','2002','1984','1986','1987','1988','1990','1991','1992','1993','1994','1995','1996','1997','1999','2020','2021','2022','2023','2024','2025','2026','789456','159357','147258','258369','112233','121212','123123','654321','696969','131313','101010','123321','000000','111111','123456','012345','987654','999999']);
  function easyPin(s){
    if(PIN_COMMON.has(s)||new Set(s).size<3)return true;
    if(s===s.split('').reverse().join(''))return true;
    if(s.length%2===0&&s.slice(0,s.length/2)===s.slice(s.length/2))return true;
    if([...s].slice(1).every((c,i)=>(Number(c)-Number(s[i])+10)%10===(Number(s[1])-Number(s[0])+10)%10))return true;
    if(s.length===4){const n=Number(s);if(n>=1900&&n<=2099)return true;const a=Number(s.slice(0,2)),b=Number(s.slice(2));if((a>=1&&a<=31&&b>=1&&b<=12)||(b>=1&&b<=31&&a>=1&&a<=12))return true;}
    return false;
  }
  function pin(o,random=rng()){
    const length=integer(o.length,4,12,'PIN length');
    for(let tries=0;tries<10000;tries++){
      const value=Array.from({length},()=>String(random(10))).join('');
      if(!o.skipEasy||!easyPin(value))return {value,bits:null};
    }throw Error('Could not generate a PIN. Try again.');
  }
  function batch(count,make){
    integer(count,1,1000,'Quantity');const seen=new Set(),items=[];
    for(let tries=0;items.length<count&&tries<count*100+10000;tries++){
      const item=make();if(!seen.has(item.value)){seen.add(item.value);items.push(item);}
    }
    if(items.length<count)throw Error('Not enough different results for these settings. Use a longer length or fewer results.');return items;
  }
  const THEMES={
    gamer:['swift stealth neon turbo rogue nitro epic pixel mega shadow','falcon panther ninja ranger dragon viper mech phantom knight wolf'],
    fantasy:['silver ancient lunar mystic royal ember frost golden elder wild','raven wizard elf drake phoenix wyvern sprite griffin mage unicorn'],
    space:['cosmic lunar solar nova stellar orbit astro cyber radiant distant','comet nebula moon meteor planet voyager rocket quasar pulsar galaxy'],
    cute:['tiny happy cozy fluffy sunny sleepy little sweet bouncy lucky','panda bunny otter kitten peach duckling fawn puppy koala robin'],
    aesthetic:['velvet quiet mellow hazy soft amber ivory gentle misty lucid','cloud bloom willow echo petal dusk meadow sonnet fern wave'],
    funny:['wobbly noodle goofy quirky fizzy wonky crispy silly bouncy sneaky','waffle turnip potato pickle noodle goose nugget pancake muffin newt']
  };
  const PLATFORMS={any:[40,'camel'],instagram:[30,'dot'],tiktok:[24,'snake'],youtube:[30,'kebab'],snapchat:[15,'lower'],x:[15,'snake'],discord:[32,'dot'],reddit:[20,'kebab'],roblox:[20,'camel'],minecraft:[16,'camel'],fortnite:[16,'camel'],xbox:[12,'camel'],playstation:[16,'snake'],steam:[32,'camel'],twitch:[25,'snake']};
  function username(o,words,random=rng()){
    const theme=o.theme==='mixed'?Object.keys(THEMES)[random(6)]:o.theme;
    const included=String(o.include||'').replace(/[^a-z0-9]/gi,'').slice(0,12);
    let parts;
    if(theme==='words')parts=Array.from({length:integer(o.wordCount||2,1,3,'Words per name')},()=>words[random(words.length)]);
    else {const lists=THEMES[theme]||THEMES.gamer;parts=lists.map(l=>{const a=l.split(' ');return a[random(a.length)];});}
    if(included)parts[random(parts.length)]=included;
    const style=o.style||'camel';
    let value=style==='camel'?parts.map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''):parts.map(w=>w.toLowerCase()).join({snake:'_',dot:'.',kebab:'-',lower:''}[style]||'');
    if(o.number)value+=String(random(90)+10);
    const max=integer(o.maxLength||20,3,40,'Username maximum length');
    if(value.length>max)return null;
    return {value,bits:null};
  }
  function wifiPayload(o){
    const esc=s=>String(s).replace(/[\\;,:\"]/g,'\\$&');
    if(!o.ssid)throw Error('Enter your network name.');
    if(new TextEncoder().encode(o.ssid).length>32)throw Error('A network name can contain at most 32 UTF-8 bytes.');
    if(!['WPA','WEP','nopass'].includes(o.security))throw Error('Choose a Wi-Fi security type.');
    if(o.security==='WPA'&&!(o.password.length>=8&&o.password.length<=63&&/^[\x20-\x7e]+$/.test(o.password))&&!/^[a-f0-9]{64}$/i.test(o.password))throw Error('WPA passwords need 8–63 printable ASCII characters or 64 hexadecimal digits.');
    if(o.security==='WEP'&&!/^([\x20-\x7e]{5}|[\x20-\x7e]{13}|[a-f0-9]{10}|[a-f0-9]{26})$/i.test(o.password))throw Error('WEP needs 5 or 13 ASCII characters, or 10 or 26 hexadecimal digits.');
    return `WIFI:T:${o.security};S:${esc(o.ssid)};P:${o.security==='nopass'?'':esc(o.password)};H:${!!o.hidden};;`;
  }
  function csvCell(value){const s=String(value);return '"'+s.replace(/"/g,'""')+'"';}
  function safeCell(value){const s=String(value);return /^[\s\u0000-\u001f]*[=+@-]/.test(s)?"'"+s:s;}
  const api={UPPER,LOWER,DIGITS,SYMBOLS,COMMON,integer,rng,log2,validCount,config,password,phrase,pin,easyPin,batch,THEMES,PLATFORMS,username,wifiPayload,csvCell,safeCell,lengthCount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Shapla=api;
})(globalThis);
