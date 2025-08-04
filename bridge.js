// Puter Bridge script
const logEl = document.getElementById('log');
function log(msg){ const p=document.createElement('pre'); p.textContent=String(msg); logEl.prepend(p); }

// Optional manual sign-in (if Puter exposes a sign-in flow)
document.getElementById('signin').onclick = async () => {
  try {
    // Some environments auto-handle auth on first API call; this is a manual fallback.
    // If Puter exposes explicit auth calls, plug them here.
    log('Open a Puter tab and ensure you are signed in.');
    window.open('https://puter.com', '_blank');
  } catch (e) { log('Sign-in hint error: ' + (e?.message || e)); }
};

document.getElementById('test').onclick = async () => {
  try {
    const out = await puter.ai.chat('Say hello from the bridge');
    log('OK: ' + (out?.text || JSON.stringify(out)));
  } catch (e) {
    log('Test failed: ' + (e?.message || e));
  }
};

// postMessage relay
window.addEventListener('message', async (e) => {
  const msg = e.data || {};
  if (msg.type === 'PING') { try { window.parent.postMessage({ type:'PONG', id: msg.id }, '*'); } catch (e) {} return; }
  if (msg.type !== 'PUTER_CHAT') return;
  const { id, prompt, options } = msg;
  try {
    if (options && options.stream) {
      const resp = await puter.ai.chat(prompt, options);
      for await (const part of resp) {
        window.parent.postMessage({ type:'PUTER_CHAT_PART', id, part: part?.text || '' }, '*');
      }
      window.parent.postMessage({ type:'PUTER_CHAT_DONE', id }, '*');
    } else {
      const out = await puter.ai.chat(prompt, options || {});
      const text = out?.text || out?.message?.content || JSON.stringify(out);
      window.parent.postMessage({ type:'PUTER_CHAT_DONE', id, text }, '*');
    }
  } catch (err) {
    window.parent.postMessage({ type:'PUTER_CHAT_ERROR', id, error: String(err?.message || err) }, '*');
  }
}, false);
