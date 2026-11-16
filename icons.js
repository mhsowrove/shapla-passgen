/* Original 24px SVG interface icons. No network requests or icon fonts. */
(function(root){
  'use strict';
  const paths={
    moon:'<path d="M20.5 13A8.7 8.7 0 0 1 11 3.5 8.8 8.8 0 1 0 20.5 13Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    pause:'<rect x="7" y="4" width="3" height="16" rx="1"/><rect x="14" y="4" width="3" height="16" rx="1"/>',
    play:'<path d="m8 4 12 8-12 8V4Z"/>',
    copy:'<rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h2"/>',
    refresh:'<path d="M20 8a8.5 8.5 0 0 0-14-3L3 8m0-5v5h5m-4 8a8.5 8.5 0 0 0 14 3l3-3m0 5v-5h-5"/>',
    link:'<path d="m10 13 4-4m-5 7-1 1a4.2 4.2 0 0 1-6-6l4-4a4.2 4.2 0 0 1 6 0m0 10a4.2 4.2 0 0 0 6 0l4-4a4.2 4.2 0 0 0-6-6l-1 1"/>',
    qr:'<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 15h3v3h3m-6 3h3m3-9v3M12 3v3M3 12h3m6-3v6"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    print:'<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7zM17 11h.01"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    device:'<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21h8m-4-4v4"/>',
    words:'<path d="M4 5h16M4 12h10M4 19h14"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    pin:'<path d="M10 3 8 21m8-18-2 18M4 9h17M3 15h17"/>',
    layers:'<path d="m12 3 10 5-10 5L2 8l10-5Zm-9 10 9 4 9-4M3 18l9 4 9-4"/>',
    wifi:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0M12 20h.01"/>',
    key:'<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-3-3 3-3m-6 0 3-3"/>',
    screen:'<rect x="3" y="4" width="18" height="14" rx="3"/><path d="M8 22h8m-4-4v4"/>',
    sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-1v4m-2-2h4"/>'
  };
  function icon(name){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    for(const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false',class:'ui-icon'}))svg.setAttribute(key,value);
    svg.innerHTML=paths[name]||paths.sparkles;
    return svg;
  }
  function decorate(node,name,only=false){
    if(!node)return;node.querySelector(':scope > .ui-icon')?.remove();
    if(only)node.replaceChildren();node.prepend(icon(name));node.classList.add('has-icon');
  }
  function polish(){
    const $=id=>document.getElementById(id);
    const tools={password:'key',passphrase:'words',username:'user',pin:'pin',check:'shield',bulk:'layers',wifi:'wifi'};
    document.querySelectorAll('[data-tool]').forEach(n=>decorate(n,tools[n.dataset.tool]));
    document.querySelectorAll('.primary').forEach(n=>{n.querySelector('[aria-hidden]')?.remove();decorate(n,n.closest('#wifi-form')?'qr':'sparkles');});
    document.querySelectorAll('[data-copy-results]').forEach(n=>decorate(n,'copy'));
    document.querySelectorAll('[data-share]').forEach(n=>decorate(n,'link'));
    document.querySelectorAll('[data-step]').forEach(n=>decorate(n,n.dataset.step.endsWith(':-1')?'minus':'plus',true));
    for(const [id,name] of Object.entries({'password-qr':'qr','phrase-qr':'qr','more-names':'plus','copy-shortlist':'copy','clear-shortlist':'close','check-random':'refresh','breach-check':'shield','bulk-download':'download','bulk-copy':'copy','bulk-print':'print','wifi-random':'refresh','wifi-phrase':'words','wifi-svg':'download','wifi-png':'download','wifi-screen':'screen','wifi-print':'print','dialog-qr-save':'download','qr-to-wifi':'wifi','install':'download'}))decorate($(id),name);
    for(const id of ['qr-close','copy-close','install-close'])decorate($(id),'close',true);
    document.querySelectorAll('.bottom-note > span').forEach((n,i)=>{n.textContent=n.textContent.replace(/^[◎⌁]\s*/,'');decorate(n,i?'lock':'device');});
    const local=document.querySelector('.local-label');if(local){local.textContent='On-device';decorate(local,'shield');}
    const motion=$('motion');if(motion){decorate(motion,document.body.classList.contains('paused')?'play':'pause',true);motion.title=motion.getAttribute('aria-label');}
  }
  root.ShaplaIcons={icon,decorate,polish};
})(globalThis);
