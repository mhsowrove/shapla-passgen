'use strict';
// Optional dependency-free Node 18+ checks; not needed to run the website.
const assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const C=require('./core.js');require('./words.js');
const words=SHAPLA_WORDS.filter(w=>/^[a-z]+$/.test(w));
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
const base={length:16,upper:true,lower:true,numbers:true,symbols:true,similar:true,requireEach:true};
test('1,000 secure passwords: lengths, types, exclusions, uniqueness',()=>{
  const random=C.rng(webcrypto),seen=new Set();
  for(let i=0;i<1000;i++){
    const o={...base,length:[6,16,256][i%3],similar:false,excluded:'abcXYZ!@',symbolMode:i%2?'common':'all'};
    const p=C.password(o,random),config=C.config(o);assert.equal(p.value.length,o.length);assert([...p.value].every(c=>config.groups.join('').includes(c)));assert(config.groups.every(g=>[...p.value].some(c=>g.includes(c))));assert(!seen.has(p.value));seen.add(p.value);assert(p.bits>0);
  }
});
test('invalid settings fail closed',()=>{
  for(const length of [0,5,257,6.5,NaN,''])assert.throws(()=>C.config({...base,length}));
  assert.throws(()=>C.config({length:16}));assert.throws(()=>C.config({...base,excluded:C.DIGITS}));
  assert.throws(()=>C.config({...base,symbolMode:'custom',customSymbols:'abc123'}));assert.throws(()=>C.rng(null));
});
test('uint32 rejection avoids modulo bias',()=>{
  let calls=0;const random=C.rng({getRandomValues(a){a.fill(calls++?9:0xffffffff);return a;}});
  assert.equal(random(10),9);assert.equal(calls,2);
});
test('required types use whole-candidate rejection',()=>{
  let i=0;const sequence=[0,0,0,0,0,0,0,26,0,26,0,26];const out=C.password({length:6,upper:true,lower:true,similar:true},()=>sequence[i++]);assert.equal(out.value,'AaAaAa');
});
test('password entropy uses exact inclusion-exclusion',()=>{
  const config={length:4,groups:['a','bc'],requireEach:true};assert.equal(C.validCount(config),81n-16n-1n);
  assert.equal(C.validCount({...config,requireEach:false}),81n);
});
test('length-limited phrase counts match exhaustive permutations',()=>{
  const small=['a','b','cc','ddd'];for(let budget=3;budget<10;budget++){
    let count=0;for(const a of small)for(const b of small)for(const c of small)if(new Set([a,b,c]).size===3&&a.length+b.length+c.length<=budget)count++;
    assert.equal(C.lengthCount({1:2,2:1,3:1},3,budget),BigInt(count));
  }
  const p=C.phrase({words:3,separator:'-',maxLength:12},small,C.rng(webcrypto));assert.equal(p.bits,C.log2(24n));
});
test('passphrase generation honors limits, no repeats, modifiers and exact counts',()=>{
  const random=C.rng(webcrypto);for(let i=0;i<30;i++){
    const o={words:7,separator:'-',maxLength:64,casing:'title',digit:true,symbol:true,randomDigits:i%2===0};
    const p=C.phrase(o,words,random);assert(p.value.length<=64);assert.equal(new Set(p.rawWords).size,7);assert.equal(p.parts.length,7);assert(/\d/.test(p.value));assert(/[!@#$%^&*]/.test(p.value));assert(Number.isFinite(p.bits));
  }
  assert.throws(()=>C.phrase({words:12,separator:'-',maxLength:12},words,random));
  assert.throws(()=>C.phrase({words:3,separator:''},words,random));
});
test('PIN exclusions and leading zeros',()=>{
  for(const value of ['1234','4321','0000','1111','1212','2580','1987','2512','2468','123321','1342'])assert(C.easyPin(value),value);
  assert.equal(C.pin({length:4,skipEasy:false},()=>0).value,'0000');
  const random=C.rng(webcrypto);for(let i=0;i<100;i++){const p=C.pin({length:6,skipEasy:true},random);assert(/^\d{6}$/.test(p.value));assert(!C.easyPin(p.value));}
});
test('batches contain distinct values',()=>{
  const random=C.rng(webcrypto),batch=C.batch(1000,()=>C.password(base,random));assert.equal(new Set(batch.map(x=>x.value)).size,1000);
  assert.throws(()=>C.batch(0,()=>({value:'x'})));assert.throws(()=>C.batch(2,()=>({value:'x'})));
});
test('username themes, styles and length behavior',()=>{
  const random=C.rng(webcrypto);for(const theme of [...Object.keys(C.THEMES),'mixed','words'])for(const style of ['camel','snake','dot','kebab','lower']){
    const name=C.username({theme,style,maxLength:40,include:'Shapla',number:true},words,random);assert(name.value.toLowerCase().includes('shapla'));assert(/\d{2}$/.test(name.value));assert(name.value.length<=40);
  }
});
test('Wi-Fi payload escaping and validation',()=>{
  const payload=C.wifiPayload({ssid:'A;B:C,"D\\E',password:'abc;defg',security:'WPA',hidden:true});assert(payload.includes('S:A\\;B\\:C\\,\\"D\\\\E;'));assert(payload.includes('P:abc\\;defg;'));assert(payload.endsWith('H:true;;'));
  assert.throws(()=>C.wifiPayload({ssid:'a',password:'short',security:'WPA'}));assert.throws(()=>C.wifiPayload({ssid:'a'.repeat(33),password:'abcdefgh',security:'WPA'}));
  assert(C.wifiPayload({ssid:'Guest',password:'',security:'nopass'}).includes('P:;'));
});
test('CSV escaping and formula protection',()=>{
  assert.equal(C.csvCell('a,"b"'),'"a,""b"""');for(const s of ['=CMD()','+1','-1','@SUM(A1)',' \t=1'])assert(C.safeCell(s).startsWith("'"));
});
test('bundled QR and checker libraries work locally',()=>{
  const qr=require('./vendor/qrcode.js')(0,'M');qr.addData('Shapla test');qr.make();assert(qr.getModuleCount()>0);assert(qr.createSvgTag().includes('<svg'));
  const zxcvbn=require('./vendor/zxcvbn.js');assert(zxcvbn('password123').score<2);assert(zxcvbn(C.password({...base,length:24},C.rng(webcrypto)).value).score>=3);
});
test('all multilingual dictionaries generate compatible, distinct words',()=>{
  require('./wordlists.js');const random=C.rng(webcrypto);
  for(const [lang,list] of Object.entries(SHAPLA_LISTS)){
    assert(list.length>1000,lang);assert.equal(new Set(list).size,list.length);assert(list.every(w=>/^[a-z]+$/.test(w)));
    const p=C.phrase({words:7,separator:'-',maxLength:64,casing:'upper',digit:true},list,random);assert(p.value.length<=64);assert.equal(new Set(p.rawWords).size,7);
  }
});
console.log(`${checks} test groups passed. No generated secrets were logged.`);
