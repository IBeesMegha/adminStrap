import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || '';
  const origin = `${proto}://${host}`;

  const css = [
    '*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif}',
    '*::-webkit-scrollbar{width:4px}',
    '*::-webkit-scrollbar-track{background:transparent}',
    '*::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}',
    '@keyframes _f{from{opacity:0;transform:translateY(16px)scale(.96)}to{opacity:1;transform:translateY(0)scale(1)}}',
    '@keyframes _p{0%,to{transform:scale(1)}50%{transform:scale(1.1)}}',
  ].join('');

  const logic = [
    `(function(){`,
    `var O=${JSON.stringify(origin)};`,
    `var R=document.getElementById("ai-chat-widget");`,
    `if(!R){R=document.createElement("div");R.id="ai-chat-widget";document.body.appendChild(R);}`,
    `if(R.hasAttribute("data-widget-loaded"))return;`,
    `R.setAttribute("data-widget-loaded","true");`,
    `var S=document.createElement("style");S.textContent=${JSON.stringify(css)};document.head.appendChild(S);`,
    `var X=new XMLHttpRequest();`,
    `X.open("GET",O+"/api/widget/config",true);`,
    `X.onload=function(){`,
    `if(X.status!==200)return;`,
    `var r=JSON.parse(X.responseText);`,
    `if(!r.success||!r.data||!r.data.embedActive)return;`,
    `var C=r.data;`,
    `if(C.customCss){var _s=document.createElement("style");_s.textContent=C.customCss;document.head.appendChild(_s);}`,
    `var st={open:false,m:[],loading:false};`,
    `var H=document.createElement("div");H.id="ai-w-root";R.appendChild(H);`,
    `function esc(t){var d=document.createElement("div");d.textContent=t;return d.innerHTML}`,
    `var defaultAvatar="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='pg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ab47bc'/%3E%3Cstop offset='100%25' style='stop-color:%238e24aa'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='60' cy='80' rx='25' ry='30' fill='url(%23pg)' transform='rotate(-20 60 80)'/%3E%3Cellipse cx='140' cy='80' rx='25' ry='30' fill='url(%23pg)' transform='rotate(20 140 80)'/%3E%3Crect x='20' y='30' width='15' height='8' rx='4' fill='%238e24aa' transform='rotate(-25 27 34)'/%3E%3Crect x='165' y='30' width='15' height='8' rx='4' fill='%238e24aa' transform='rotate(25 173 34)'/%3E%3Ccircle cx='20' cy='25' r='6' fill='%23ab47bc'/%3E%3Ccircle cx='180' cy='25' r='6' fill='%23ab47bc'/%3E%3Crect x='50' y='50' width='100' height='110' rx='20' fill='%23fff'/%3E%3Crect x='55' y='55' width='90' height='100' rx='18' fill='url(%23pg)'/%3E%3Crect x='70' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='105' y='80' width='25' height='35' rx='8' fill='%23fff'/%3E%3Crect x='75' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Crect x='110' y='95' width='15' height='3' fill='%2364b5f6'/%3E%3Cpath d='M 75 135 Q 100 150 125 135' stroke='%23fff' stroke-width='6' fill='none' stroke-linecap='round'/%3E%3Crect x='85' y='165' width='30' height='25' rx='5' fill='%23fff'/%3E%3Ctext x='100' y='182' text-anchor='middle' fill='%238e24aa' font-size='18' font-weight='bold'%3E%E2%96%A1%3C/text%3E%3C/svg%3E";`,
    `function up(){`,
    `var o=st.open,c=C;`,
    `var pos=c.position==='bottom-left'?'left:'+c.marginX+'px;':'right:'+c.marginX+'px;';`,
    `H.style.cssText="position:fixed;z-index:999999;font-size:"+c.fontSize+";line-height:1.5;color:"+c.textColor+";"+pos+"bottom:"+c.marginY+"px";`,
    `if(!o){H.innerHTML='<div id="ai-fab" style="display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:'+c.primaryColor+';color:#fff;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.2);transition:transform .2s" onclick="window.__aiT&&window.__aiT()" onmouseover="this.style.transform=\\'scale(1.1)\\'" onmouseout="this.style.transform=\\'scale(1)\\'"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>';return`,
    `}`,
    `var avatarUrl=(c.showAvatar&&c.avatarUrl)?c.avatarUrl:defaultAvatar;`,
    `var ms=st.m.map(function(m){return'<div style="display:flex;align-items:flex-start;gap:8px;'+(m.r==='u'?'flex-direction:row-reverse':'')+'"><img src="'+avatarUrl+'" alt="" style="width:28px;height:28px;object-fit:cover;border-radius:'+(c.avatarStyle==='rounded'?'50%':'6px')+';flex-shrink:0;margin-top:2px"><div style="padding:10px 14px;border-radius:'+(c.bubbleStyle==='rounded'?(m.r==='u'?'12px 12px 4px 12px':'12px 12px 12px 4px'):'4px')+';background:'+(m.r==='u'?c.userMsgBgColor:c.botMsgBgColor)+';color:'+(m.r==='u'?c.userMsgTextColor:c.botMsgTextColor)+';font-size:'+c.fontSize+';max-width:80%;white-space:pre-wrap">'+esc(m.t)+'</div></div>';}).join('');`,
    `if(st.loading){ms+='<div style="display:flex;align-items:flex-start;gap:8px"><img src="'+avatarUrl+'" alt="" style="width:28px;height:28px;object-fit:cover;border-radius:'+(c.avatarStyle==='rounded'?'50%':'6px')+';flex-shrink:0;margin-top:2px"><div style="padding:10px 14px;border-radius:'+(c.bubbleStyle==='rounded'?'12px 12px 12px 4px':'4px')+';background:'+c.botMsgBgColor+';color:'+c.botMsgTextColor+'"><span style="display:inline-flex;gap:4px"><span style="width:6px;height:6px;background:'+c.botMsgTextColor+';border-radius:50%;opacity:.6;animation:_p .8s infinite"></span><span style="width:6px;height:6px;background:'+c.botMsgTextColor+';border-radius:50%;opacity:.6;animation:_p .8s infinite .2s"></span><span style="width:6px;height:6px;background:'+c.botMsgTextColor+';border-radius:50%;opacity:.6;animation:_p .8s infinite .4s"></span></span></div></div>';}`,
    `H.innerHTML='<div style="display:flex;flex-direction:column;width:'+c.width+'px;height:'+c.height+'px;border-radius:'+c.borderRadius+'px;overflow:hidden;background:'+(c.bgColor||'#fff')+';box-shadow:0 8px 40px rgba(0,0,0,0.15);animation:_f .2s ease-out;max-width:calc(100vw - '+(c.marginX*2)+'px);max-height:calc(100vh - '+(c.marginY*2)+'px)"><div style="display:flex;align-items:center;gap:12px;padding:16px 20px;flex-shrink:0;background:'+c.headerBgColor+';color:'+c.headerTextColor+'">'+(c.showLogo&&c.logoUrl?'<img src="'+c.logoUrl+'" alt="" style="width:'+c.logoWidth+'px;height:'+c.logoWidth+'px;object-fit:contain;flex-shrink:0">':'')+'<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:'+(parseInt(c.fontSize)+2)+'px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(c.title)+'</div><div style="font-size:'+(parseInt(c.fontSize)-2)+'px;opacity:.8">Online</div></div><img src="'+avatarUrl+'" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:'+(c.avatarStyle==='rounded'?'50%':'8px')+';flex-shrink:0"><div style="cursor:pointer;padding:4px" onclick="window.__aiT()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div></div><div id="ai-ms" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:'+(c.bgColor||'#fff')+'">'+(st.m.length===0?'<div style="display:flex;align-items:flex-start;gap:8px;animation:_f .3s ease-out"><img src="'+avatarUrl+'" alt="" style="width:28px;height:28px;object-fit:cover;border-radius:'+(c.avatarStyle==='rounded'?'50%':'6px')+';flex-shrink:0;margin-top:2px"><div style="padding:10px 14px;border-radius:'+(c.bubbleStyle==='rounded'?'12px 12px 12px 4px':'4px')+';background:'+c.botMsgBgColor+';color:'+c.botMsgTextColor+';font-size:'+c.fontSize+';max-width:80%">'+esc(c.welcomeText)+'</div></div>':'')+ms+'</div><div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-top:1px solid '+c.inputBorderColor+';background:'+c.inputBgColor+';flex-shrink:0"><input id="ai-inp" type="text" placeholder="Type a message..." style="flex:1;padding:10px 14px;border:1px solid '+c.inputBorderColor+';border-radius:24px;outline:none;font-size:'+c.fontSize+';background:'+c.inputBgColor+';color:#1f2937" onkeydown="if(event.key===\\'Enter\\'&&!event.shiftKey){event.preventDefault();window.__aiS()}"><button style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:none;border-radius:50%;background:'+c.sendButtonColor+';color:'+c.sendIconColor+';cursor:pointer;flex-shrink:0" onclick="window.__aiS()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div></div>';`,
    `var msEl=document.getElementById("ai-ms");if(msEl)msEl.scrollTop=msEl.scrollHeight;`,
    `}`,
    `window.__aiT=function(){st.open=!st.open;up();if(st.open)setTimeout(function(){var e=document.getElementById("ai-ms");if(e)e.scrollTop=e.scrollHeight},50)};`,
    `window.__aiS=function(){`,
    `var inp=document.getElementById("ai-inp");if(!inp||!inp.value.trim()||st.loading)return;`,
    `var t=inp.value.trim();inp.value="";`,
    `st.m.push({r:"u",t:t});st.loading=true;up();`,
    `setTimeout(function(){var e=document.getElementById("ai-ms");if(e)e.scrollTop=e.scrollHeight},50);`,
    `var Q=new XMLHttpRequest();`,
    `Q.open("POST",O+"/api/widget/chat",true);`,
    `Q.setRequestHeader("Content-Type","application/json");`,
    `Q.onload=function(){st.loading=false;`,
    `if(Q.status===200){var dr=JSON.parse(Q.responseText);`,
    `st.m.push({r:"a",t:dr.success&&dr.data?dr.data.answer:"Error"});`,
    `}else st.m.push({r:"a",t:"Error"});`,
    `up();setTimeout(function(){var e=document.getElementById("ai-ms");if(e)e.scrollTop=e.scrollHeight},50)};`,
    `Q.onerror=function(){st.loading=false;st.m.push({r:"a",t:"Network error"});up();setTimeout(function(){var e=document.getElementById("ai-ms");if(e)e.scrollTop=e.scrollHeight},50)};`,
    `Q.send(JSON.stringify({message:t}))`,
    `};`,
    `up()`,
    `};`,
    `X.send()`,
    `})()`,
  ].join('\n');

  const js = logic;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(js);
}
