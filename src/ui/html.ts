import { VERSION } from "../constants.ts";
import { escapeHTML } from "../utils.ts";

export function renderAppHTML() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>OpenCode Local Review</title>
  <style>
    :root { color-scheme: dark; --bg:#0b0d10; --panel:#12161b; --line:#1d242c; --muted:#8892a0; --text:#e8edf2; --add:#12351f; --del:#3a1717; --accent:#8ad0ff; --warn:#ffd166; }
    * { box-sizing:border-box; }
    html, body { height:100%; overflow:hidden; }
    body { margin:0; background:var(--bg); color:var(--text); font:14px/1.45 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    header { height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 18px; border-bottom:1px solid var(--line); background:#0f1318; }
    button, textarea, select { font:inherit; }
    button { background:#1b2633; color:var(--text); border:1px solid #2e3b49; border-radius:8px; padding:7px 10px; cursor:pointer; }
    button:hover { border-color:var(--accent); }
    .layout { display:grid; grid-template-columns:260px 1fr 340px; height:calc(100vh - 56px); min-height:0; }
    aside, main { border-right:1px solid var(--line); }
    aside { padding:14px; background:#0d1116; overflow:auto; min-height:0; }
    main { overflow:auto; min-height:0; scroll-behavior:smooth; }
    .file { padding:9px 10px; border:1px solid var(--line); border-radius:10px; margin-bottom:8px; cursor:pointer; color:#ccd6e0; }
    .file.active { border-color:var(--accent); background:#111b25; }
    .meta { color:var(--muted); font-size:12px; }
    .diff-file { border-bottom:1px solid var(--line); }
    .file-title { position:sticky; top:0; background:#11161c; border-bottom:1px solid var(--line); padding:10px 14px; z-index:1; font-weight:700; }
    table { width:100%; border-collapse:collapse; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:12px; }
    td { border-bottom:1px solid rgba(255,255,255,.04); vertical-align:top; }
    .num { width:58px; color:#697584; text-align:right; padding:2px 8px; user-select:none; }
    .code { white-space:pre-wrap; padding:2px 8px; }
    .tok-keyword { color:#ff5fa2; font-weight:700; }
    .tok-builtin { color:#55d6be; }
    .tok-type { color:#c8a7ff; }
    .tok-string { color:#7dd3fc; }
    .tok-comment { color:#7d8794; font-style:italic; }
    .tok-number { color:#f2cc60; }
    .add { background:var(--add); }
    .del { background:var(--del); }
    .hunk { color:#9ecbff; background:#101b29; }
    .comment-cell { width:34px; text-align:center; }
    .plus { opacity:.35; padding:1px 6px; border-radius:5px; }
    tr:hover .plus { opacity:1; }
    .thread { border:1px solid var(--line); border-radius:12px; margin-bottom:10px; padding:10px; background:var(--panel); }
    .inline-thread-cell { padding:8px 10px 12px 92px; background:#0e141b; }
    .inline-thread { max-width:900px; border:1px solid #344456; border-radius:12px; padding:10px; background:#111a23; box-shadow:inset 3px 0 0 var(--accent); }
    tr[id^="line-"] { scroll-margin-top:48px; }
    .inline-thread[data-inline-thread] { scroll-margin-top:58px; }
    .inline-thread + .inline-thread { margin-top:8px; }
    .badge { display:inline-block; border:1px solid #354252; border-radius:999px; padding:2px 7px; font-size:12px; color:#ccd6e0; }
    .badge.open { color:#ffb86b; border-color:#b8752f; background:#2a1b0d; }
    .badge.addressed { color:#8ad0ff; border-color:#3478a4; background:#0d2130; }
    .badge.resolved { color:#94f0b0; border-color:#3b8f55; background:#0f2818; }
    .badge.reopened { color:#d5a6ff; border-color:#8752bd; background:#241533; }
    .badge.stale { color:var(--warn); border-color:var(--warn); }
    .thread.status-open, .inline-thread.status-open { border-color:#8a5a25; box-shadow:inset 3px 0 0 #ffb86b; }
    .thread.status-addressed, .inline-thread.status-addressed { border-color:#2f6688; box-shadow:inset 3px 0 0 #8ad0ff; }
    .thread.status-resolved, .inline-thread.status-resolved { border-color:#2f7044; box-shadow:inset 3px 0 0 #94f0b0; opacity:.62; }
    .thread.status-reopened, .inline-thread.status-reopened { border-color:#6b3f99; box-shadow:inset 3px 0 0 #d5a6ff; }
    .thread.status-stale, .inline-thread.status-stale { border-color:#9b7a25; box-shadow:inset 3px 0 0 var(--warn); }
    .message { border:1px solid #283442; border-radius:10px; padding:8px 10px; margin-top:8px; color:#d9e1ea; white-space:pre-wrap; background:#0d141c; }
    .message.human { border-color:#5b4a22; background:#19150d; }
    .message.agent { border-color:#254e66; background:#0b1720; }
    .message.system { border-color:#3f4650; background:#101318; }
    .message .meta { display:block; margin-bottom:4px; font-weight:700; letter-spacing:.02em; }
    .message.human .meta { color:#ffcf7a; }
    .message.agent .meta { color:#8ad0ff; }
    .reply-box { margin-top:10px; }
    .thread[data-scroll-thread] { cursor:pointer; }
    .thread[data-scroll-thread]:hover { border-color:var(--accent); }
    .composer { border:1px solid #344456; border-radius:14px; padding:12px; background:#111820; box-shadow:0 14px 50px rgba(0,0,0,.35); }
    .composer-cell { padding:8px 10px 12px 92px; background:#0e141b; }
    textarea { width:100%; min-height:120px; resize:vertical; color:var(--text); background:#090d12; border:1px solid #2d3845; border-radius:10px; padding:10px; }
    .empty { color:var(--muted); padding:20px; }
  </style>
</head>
<body>
  <header><div><strong>OpenCode Local Review</strong> <span id="summary" class="meta"></span></div><div><label class="meta"><input id="show-resolved" type="checkbox"> Show resolved</label> <button id="refresh">Refresh diff</button></div></header>
  <div class="layout"><aside><h3>Files</h3><div id="files"></div></aside><main id="diff"></main><aside><h3>Threads</h3><div id="threads"></div></aside></div>
  <script>
    let currentDiff = null, currentFile = null, pending = null, replyingThreadID = null;
    let showResolved = localStorage.localReviewShowResolved === '1';
    const api = async (path, options={}) => {
      const res = await fetch(path, { ...options, headers: { 'content-type': 'application/json', ...(options.headers||{}) }, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    };
    async function load() {
      const diff = await api('/api/diff?scope=working_tree');
      const threads = await api('/api/threads?status=open,addressed,reopened,stale,resolved');
      currentDiff = diff; window.threadData = threads.threads;
      const fileNames = diff.files.map(f => f.newPath);
      if (!currentFile || !fileNames.includes(currentFile)) currentFile = diff.files[0]?.newPath || null;
      renderFiles(); renderDiff(); renderThreads();
    }
    function renderFiles() {
      document.getElementById('summary').textContent = currentDiff.files.length + ' files · patchset ' + currentDiff.patchsetID;
      document.getElementById('files').innerHTML = currentDiff.files.map(f => '<div class="file '+(f.newPath===currentFile?'active':'')+'" data-file="'+esc(f.newPath)+'"><div>'+esc(f.newPath)+'</div><div class="meta">+'+f.additions+' -'+f.deletions+' · '+f.status+'</div></div>').join('') || '<div class="empty">No diff</div>';
      document.querySelectorAll('.file').forEach(el => el.onclick = () => { currentFile = el.dataset.file; renderFiles(); renderDiff(); });
    }
    function renderDiff() {
      const root = document.getElementById('diff');
      const files = currentFile ? currentDiff.files.filter(f => f.newPath === currentFile) : currentDiff.files;
      root.innerHTML = files.map(file => '<section class="diff-file"><div class="file-title">'+esc(file.newPath)+'</div>'+file.hunks.map(h => '<table><tbody><tr class="hunk"><td class="num"></td><td class="num"></td><td class="comment-cell"></td><td class="code">'+esc(h.header)+'</td></tr>'+h.lines.map(line => lineHTML(file,line)).join('')+'</tbody></table>').join('')+'</section>').join('') || '<div class="empty">No changes for selected file. Use Refresh diff or select a file from the left panel.</div>';
      document.querySelectorAll('[data-comment]').forEach(btn => btn.onclick = () => openComposer(JSON.parse(btn.dataset.comment)));
      bindThreadActions();
    }
    function lineHTML(file,line) {
      const cls = line.type === 'add' ? 'add' : line.type === 'del' ? 'del' : '';
      const side = line.newNumber == null ? 'old' : 'new';
      const number = side === 'new' ? line.newNumber : line.oldNumber;
      const payload = JSON.stringify({ patchsetID: currentDiff.patchsetID, filePath: file.newPath, side, line: number, selectedText:[line.content] }).replace(/"/g,'&quot;');
      const code = '<span class="meta">'+esc(prefix(line.type))+'</span>'+highlightCode(line.content, file.newPath);
      const rowID = number ? lineAnchorID(file.newPath, side, number) : '';
      const row = '<tr '+(rowID?'id="'+esc(rowID)+'"':'')+' class="'+cls+'"><td class="num">'+(line.oldNumber??'')+'</td><td class="num">'+(line.newNumber??'')+'</td><td class="comment-cell">'+(number?'<button class="plus" data-comment="'+payload+'">+</button>':'')+'</td><td class="code">'+code+'</td></tr>';
      return row + inlineComposerHTML(file, side, number) + inlineThreadsHTML(file, side, number);
    }
    function inlineComposerHTML(file, side, number) {
      if (!pending || pending.filePath !== file.newPath || pending.side !== side || pending.line !== number) return '';
      return '<tr><td></td><td></td><td></td><td class="composer-cell"><div class="composer"><div class="meta">New comment on '+esc(pending.filePath)+':'+esc(pending.line)+'</div><textarea id="comment" placeholder="Write review comment..." autofocus></textarea><p><button id="save-comment">Add comment</button> <button id="cancel-comment">Cancel</button></p></div></td></tr>';
    }
    function inlineThreadsHTML(file, side, number) {
      if (!number) return '';
      const threads = visibleThreads().filter(t => (t.filePath === file.newPath || t.filePath === file.oldPath) && t.side === side && (t.currentLine || t.originalLine) === number);
      if (!threads.length) return '';
      return '<tr class="inline-thread-row"><td></td><td></td><td></td><td class="inline-thread-cell">'+threads.map(t => '<div id="'+esc(threadAnchorID(t.id))+'" data-inline-thread="'+esc(t.id)+'" class="inline-thread status-'+esc(t.status)+'"><div><span class="badge '+esc(t.status)+'">'+esc(t.status)+'</span> <span class="meta">'+esc(t.id)+'</span></div>'+threadMessagesHTML(t)+replyComposerForThread(t)+threadActionsHTML(t)+'</div>').join('')+'</td></tr>';
    }
    function highlightCode(value, filePath) {
      const source = String(value ?? '');
      let out = '';
      let i = 0;
      const lang = languageFromPath(filePath);
      const common = ['return','if','else','for','while','switch','case','break','continue','try','catch','throw','null','true','false'];
      const byLang = {
        go: ['package','import','func','defer','go','chan','select','range','map','struct','interface','type','const','var','nil','fallthrough','default'],
        kotlin: ['package','import','fun','val','var','class','object','interface','data','sealed','enum','when','is','in','as','by','constructor','init','companion','override','private','protected','public','internal','suspend','inline','reified','null','true','false'],
        javascript: ['const','let','var','function','class','new','async','await','import','from','export','default','extends','implements','typeof','instanceof','this','super','undefined','null','true','false','interface','type','readonly','private','protected','public','static'],
        python: ['def','class','import','from','as','with','lambda','yield','async','await','pass','raise','except','finally','elif','in','is','not','and','or','None','True','False','self','global','nonlocal'],
      };
      const builtinsByLang = {
        go: ['append','cap','close','complex','copy','delete','imag','len','make','new','panic','print','println','real','recover','any','comparable','error'],
        kotlin: ['println','print','listOf','mutableListOf','mapOf','setOf','arrayOf','run','let','also','apply','with','use'],
        javascript: ['console','Promise','Array','Object','String','Number','Boolean','Map','Set','JSON','Math','Date','Error'],
        python: ['print','len','range','str','int','float','bool','list','dict','set','tuple','enumerate','zip','open','Exception','ValueError'],
      };
      const typesByLang = {
        go: ['string','bool','byte','rune','int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64','uintptr','float32','float64','complex64','complex128'],
        kotlin: ['String','Boolean','Byte','Short','Int','Long','Float','Double','Char','Unit','Any','Nothing','List','MutableList','Map','MutableMap','Set'],
        javascript: ['string','number','boolean','unknown','never','void','Record','Partial','Required','Readonly','Pick','Omit'],
        python: ['str','int','float','bool','list','dict','set','tuple','None'],
      };
      const keywords = new Set([...common, ...(byLang[lang] || byLang.javascript)]);
      const builtins = new Set(builtinsByLang[lang] || builtinsByLang.javascript);
      const types = new Set(typesByLang[lang] || typesByLang.javascript);
      while (i < source.length) {
        const rest = source.slice(i);
        if (rest.startsWith('//') || rest.startsWith('#')) return out + '<span class="tok-comment">'+esc(rest)+'</span>';
        const quote = source[i];
        if (quote === '"' || quote === "'" || quote.charCodeAt(0) === 96) {
          let j = i + 1;
          while (j < source.length) {
            if (source[j] === '\\\\') j += 2;
            else if (source[j] === quote) { j += 1; break; }
            else j += 1;
          }
          out += '<span class="tok-string">'+esc(source.slice(i, j))+'</span>';
          i = j;
          continue;
        }
        const number = /^\\d+(?:\\.\\d+)?/.exec(rest);
        if (number) {
          out += '<span class="tok-number">'+esc(number[0])+'</span>';
          i += number[0].length;
          continue;
        }
        const ident = /^[A-Za-z_$][\\w$]*/.exec(rest);
        if (ident) {
          const word = ident[0];
          if (keywords.has(word)) out += '<span class="tok-keyword">'+esc(word)+'</span>';
          else if (types.has(word)) out += '<span class="tok-type">'+esc(word)+'</span>';
          else if (builtins.has(word)) out += '<span class="tok-builtin">'+esc(word)+'</span>';
          else out += esc(word);
          i += ident[0].length;
          continue;
        }
        out += esc(source[i]);
        i += 1;
      }
      return out;
    }
    function languageFromPath(filePath) {
      const lower = String(filePath || '').toLowerCase();
      if (lower.endsWith('.go')) return 'go';
      if (lower.endsWith('.kt') || lower.endsWith('.kts')) return 'kotlin';
      if (lower.endsWith('.py') || lower.endsWith('.pyw')) return 'python';
      if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'javascript';
      return 'javascript';
    }
    function renderThreads() {
      const threads = visibleThreads();
      document.getElementById('threads').innerHTML = threads.map(t => '<div data-scroll-thread="'+esc(t.id)+'" class="thread status-'+esc(t.status)+'"><div><span class="badge '+esc(t.status)+'">'+esc(t.status)+'</span></div><div><strong>'+esc(t.filePath)+':'+(t.currentLine||t.originalLine||'?')+'</strong></div>'+threadMessagesHTML(t)+replyComposerForThread(t)+threadActionsHTML(t)+'</div>').join('') || '<div class="empty">No review threads.</div>';
      bindThreadActions();
    }
    function visibleThreads() { return (window.threadData || []).filter(t => showResolved || t.status !== 'resolved'); }
    function threadMessagesHTML(t) {
      return (t.messages || []).map(m => '<div class="message '+messageClass(m)+'"><div class="meta">'+messageLabel(m)+'</div>'+esc(m.body)+'</div>').join('');
    }
    function messageClass(m) { return m.authorType === 'agent' ? 'agent' : m.authorType === 'system' ? 'system' : 'human'; }
    function messageLabel(m) { return m.authorType === 'agent' ? 'Agent' : m.authorType === 'system' ? 'System' : 'You'; }
    function replyComposerForThread(t) {
      if (replyingThreadID !== t.id) return '';
      return '<div class="reply-box"><textarea data-reply-body="'+esc(t.id)+'" placeholder="Reply in this thread..."></textarea><p><button data-reply-send="'+esc(t.id)+'">Send reply</button> <button data-reply-cancel="'+esc(t.id)+'">Cancel</button></p></div>';
    }
    function threadActionsHTML(t) {
      return '<p><button data-reply-open="'+esc(t.id)+'">Reply</button> '+threadButtons(t)+'</p>';
    }
    function bindThreadActions() {
      document.querySelectorAll('[data-resolve]').forEach(btn => btn.onclick = async () => { await api('/api/threads/'+btn.dataset.resolve+'/resolve',{method:'POST',body:{actorType:'human'}}); await load(); });
      document.querySelectorAll('[data-reopen]').forEach(btn => btn.onclick = async () => { const message = prompt('Reopen message') || ''; await api('/api/threads/'+btn.dataset.reopen+'/reopen',{method:'POST',body:{actorType:'human',message}}); await load(); });
      document.querySelectorAll('[data-reply-open]').forEach(btn => btn.onclick = () => { replyingThreadID = btn.dataset.replyOpen; renderDiff(); renderThreads(); setTimeout(() => findReplyInput(replyingThreadID)?.focus(), 0); });
      document.querySelectorAll('[data-reply-cancel]').forEach(btn => btn.onclick = () => { replyingThreadID = null; renderDiff(); renderThreads(); });
      document.querySelectorAll('[data-reply-send]').forEach(btn => btn.onclick = async () => { const threadID = btn.dataset.replySend; const input = findReplyInput(threadID); const body = input?.value?.trim() || ''; if (!body) return; await api('/api/threads/'+threadID+'/messages',{method:'POST',body:{actorType:'human',authorName:'human',body}}); replyingThreadID = null; await load(); });
      document.querySelectorAll('[data-scroll-thread]').forEach(el => el.onclick = (event) => { if (event.target.closest('button,textarea,a,input')) return; scrollToThread(el.dataset.scrollThread); });
    }
    function findReplyInput(threadID) { return Array.from(document.querySelectorAll('[data-reply-body]')).find(el => el.dataset.replyBody === threadID); }
    function scrollToThread(threadID) {
      const thread = (window.threadData || []).find(t => t.id === threadID);
      if (!thread) return;
      if (thread.filePath !== currentFile) {
        currentFile = thread.filePath;
        renderFiles();
        renderDiff();
      }
      requestAnimationFrame(() => {
        const threadNode = document.getElementById(threadAnchorID(threadID));
        const lineNode = document.getElementById(lineAnchorID(thread.filePath, thread.side, thread.currentLine || thread.originalLine));
        (threadNode || lineNode)?.scrollIntoView({ block:'center', behavior:'smooth' });
        if (threadNode) {
          threadNode.animate([{ outline:'2px solid var(--accent)' }, { outline:'2px solid transparent' }], { duration:1200, easing:'ease-out' });
        }
      });
    }
    function threadButtons(t) { return t.status === 'resolved' ? '<button data-reopen="'+esc(t.id)+'">Reopen</button>' : '<button data-resolve="'+esc(t.id)+'">Resolve</button>'; }
    function openComposer(data) { pending = data; renderDiff(); setTimeout(() => document.getElementById('comment')?.focus(), 0); }
    document.addEventListener('click', async (event) => {
      if (event.target?.id === 'save-comment') {
        const message = document.getElementById('comment').value.trim();
        if (!message) return;
        await api('/api/threads',{method:'POST',body:{...pending,startLine:pending.line,endLine:pending.line,message,authorName:'human'}});
        pending = null;
        await load();
      }
      if (event.target?.id === 'cancel-comment') {
        pending = null;
        renderDiff();
      }
    });
    document.getElementById('show-resolved').checked = showResolved;
    document.getElementById('show-resolved').onchange = (event) => { showResolved = event.target.checked; localStorage.localReviewShowResolved = showResolved ? '1' : '0'; renderDiff(); renderThreads(); };
    document.getElementById('refresh').onclick = async () => { await api('/api/diff/refresh',{method:'POST',body:{scope:'working_tree'}}); await load(); };
    try { const es = new EventSource('/api/events'); es.onmessage = () => load(); es.addEventListener('diff.changed', load); es.addEventListener('thread.updated', load); es.addEventListener('thread.created', load); } catch {}
    function prefix(type) { return type === 'add' ? '+' : type === 'del' ? '-' : ' '; }
    function esc(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
    function domID(value) { return String(value ?? '').replace(/[^A-Za-z0-9_-]/g, '_'); }
    function lineAnchorID(filePath, side, number) { return 'line-'+domID(filePath)+'-'+domID(side)+'-'+domID(number); }
    function threadAnchorID(threadID) { return 'thread-'+domID(threadID); }
    load().catch(err => document.getElementById('diff').innerHTML = '<div class="empty">'+esc(err.message)+'</div>');
  </script>
</body>
</html>`;
}

export function renderHealthHTML(ctx) {
  return `<!doctype html><meta charset="utf-8"><title>Local Review Health</title><pre>${escapeHTML(JSON.stringify({ ok: true, version: VERSION, projectID: ctx.projectID, worktree: ctx.worktree, startedAt: ctx.startedAt }, null, 2))}</pre>`;
}
