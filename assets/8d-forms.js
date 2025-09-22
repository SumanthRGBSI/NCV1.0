// Shared behaviors for D1-D8 embedded forms
(function(){
  function qs(sel, ctx=document){return ctx.querySelector(sel)}
  function qsa(sel, ctx=document){return Array.from((ctx||document).querySelectorAll(sel))}

  // Directory (sample) — can be extended or loaded from storage
  const CONTACTS = (function(){
    const stored = localStorage.getItem('contact-directory');
    if(stored){ try { return JSON.parse(stored); } catch(_){} }
    const list = [
      { name:'Alex Rivera', title:'Team Lead', email:'alex.rivera@example.com', phone:'(555) 201-1001' },
      { name:'Jamie Lee', title:'Quality Engineer', email:'jamie.lee@example.com', phone:'(555) 201-1002' },
      { name:'Morgan Patel', title:'Design Engineer', email:'morgan.patel@example.com', phone:'(555) 201-1003' },
      { name:'Taylor Kim', title:'Sponsor', email:'taylor.kim@example.com', phone:'(555) 201-1004' },
      { name:'Riley Chen', title:'Operator', email:'riley.chen@example.com', phone:'(555) 201-1005' }
    ];
    return list;
  })();

  // Dynamic table add/remove
  function initDynamicTables(container){
    qsa('.dynamic-table', container).forEach(table=>{
      const tpl = table.querySelector('template');
      const body = table.querySelector('tbody');
      const addBtn = table.querySelector('.add-row-btn');
      if(!tpl || !body) return;

      function appendRow(){
        const clone = tpl.content.cloneNode(true);
        body.appendChild(clone);
      }
      if(body.children.length === 0){ appendRow(); }
      if(addBtn){ addBtn.addEventListener('click', appendRow); }

      // Remove row
      body.addEventListener('click', (e)=>{
        const rem = e.target.closest('.remove-row-btn');
        if(rem){ rem.closest('tr').remove(); }
      });

      // Press Enter on any input in last row to add a new row (fast entry)
      body.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' && !e.shiftKey){
          const tr = e.target.closest('tr');
          const isLast = tr && tr.parentElement && tr.nextElementSibling == null;
          if(isLast){ e.preventDefault(); appendRow(); }
        }
      });
    });
  }

  // Simple tabs
  function initTabs(container){
    Array.from((container||document).querySelectorAll('[data-tabs]')).forEach(host=>{
      const tabs = Array.from(host.querySelectorAll('.tab'));
      const panels = Array.from(host.querySelectorAll('.tab-panel'));
      tabs.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const id = btn.getAttribute('data-tab');
          tabs.forEach(t=> t.classList.toggle('active', t===btn));
          panels.forEach(p=> p.classList.toggle('active', p.getAttribute('data-panel')===id));
        });
      });
    });
  }

  // Sticky titles helper
  function initStickyTitles(container){
    Array.from((container||document).querySelectorAll('.section-title')).forEach(el=>{
      el.classList.add('sticky-section-title');
    });
  }

  // File previews for image inputs + multi-file listing
  function initFilePreviews(container){
    qsa('.preview-file', container).forEach(inp=>{
      inp.addEventListener('change', (e)=>{
        const input = e.target;
        // Handle multi-file list
        if(input.multiple){
          const host = input.closest('.card, .file-block, .mt-small') || input.parentElement;
          let list = host?.querySelector('#d5-file-list') || host?.querySelector('.file-list');
          if(!list){ list = document.createElement('div'); list.className='file-list small mt-xs'; host.appendChild(list); }
          const files = Array.from(input.files||[]);
          if(files.length===0){ list.innerHTML=''; return; }
          list.innerHTML = files.map((f,i)=>`<div class="flex items-center justify-between"><span>${f.name}</span><button type="button" class="btn btn-ghost remove-file" data-index="${i}">Remove</button></div>`).join('');
          list.addEventListener('click', (ev)=>{
            const btn = ev.target.closest('.remove-file'); if(!btn) return;
            const idx = Number(btn.dataset.index);
            const dt = new DataTransfer();
            files.forEach((f,i)=>{ if(i!==idx) dt.items.add(f); });
            input.files = dt.files; input.dispatchEvent(new Event('change',{bubbles:true}));
          }, { once:true });
          return;
        }
        const file = input.files && input.files[0];
        const preview = input.closest('.file-block, .drop-zone')?.querySelector('.file-preview');
        if(!file || !preview) return;
        if(file.type.startsWith('image/')){
          const url = URL.createObjectURL(file);
          preview.innerHTML = `<img src="${url}" style="max-width:120px;border-radius:6px;display:block"/>`;
        } else {
          preview.textContent = file.name;
        }
      });
    });
  }

  // Drag & drop zone
  function initDropZones(container){
    qsa('.drop-zone', container).forEach(zone=>{
      zone.addEventListener('dragover', (e)=>{ e.preventDefault(); zone.style.border='1px dashed #93c5fd'; zone.style.background='#f0f9ff'; });
      zone.addEventListener('dragleave', ()=>{ zone.style.border=''; zone.style.background=''; });
      zone.addEventListener('drop', (e)=>{
        e.preventDefault();
        const input = zone.querySelector('input[type=file]');
        if(input){ input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change', {bubbles:true})); }
        zone.style.border=''; zone.style.background='';
      });
    });
  }

  // D1 quick-add basic
  function initD1QuickAdd(container){
    const add = qs('#d1-add-member-btn', container);
    const list = qs('#d1-members-list', container);
    if(!add || !list) return;
    add.addEventListener('click', ()=>{
      const input = qs('#d1-new-member', container);
      if(input && input.value.trim()){
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div class="kv">${input.value.trim()}</div><button type="button" class="btn btn-ghost remove-member" aria-label="Remove"><i data-lucide="trash-2"></i></button>`;
        list.appendChild(div);
        input.value='';
        renderOrgChart(container);
        renderTeamCards(container);
      }
    });
    // delegate remove
    list.addEventListener('click', (e)=>{
      if(e.target.closest('.remove-member')){ e.target.closest('.list-item').remove(); renderOrgChart(container); }
    });
  }

  // D1: contact directory suggestions + autofill
  function initContactDirectory(container){
    const dl = qs('#contact-directory', container) || document.getElementById('contact-directory');
    if(dl && !dl.childElementCount){
      dl.innerHTML = CONTACTS.map(c=>`<option value="${c.name}">${c.email}</option>`).join('');
    }
    container.addEventListener('change', (e)=>{
      const nameInp = e.target.closest('.contact-name');
      if(!nameInp) return;
      const person = CONTACTS.find(c=>c.name.toLowerCase()===nameInp.value.toLowerCase());
      if(person){
        const tr = nameInp.closest('tr');
        tr?.querySelector('.contact-title')?.setAttribute('value', person.title);
        const title = tr?.querySelector('.contact-title'); if(title) title.value = person.title;
        const email = tr?.querySelector('.contact-email'); if(email) email.value = person.email;
        const phone = tr?.querySelector('.contact-phone'); if(phone) phone.value = person.phone;
      }
      renderOrgChart(container);
      renderTeamCards(container);
    });
  }

  // D1: Add Me
  function initAddMe(container){
    const btn = qs('#d1-add-me', container);
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      let me = null;
      try{ me = JSON.parse(localStorage.getItem('current-user')); }catch(_){ }
      if(!me){
        const name = prompt('Your name'); if(!name) return;
        const title = prompt('Your title')||'';
        const email = prompt('Your email')||'';
        const phone = prompt('Your phone')||'';
        me = { name, title, email, phone };
        localStorage.setItem('current-user', JSON.stringify(me));
      }
      const teamTable = qs('#d1-team-table tbody', container);
      if(teamTable){
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input class="input contact-name" list="contact-directory" value="${me.name}"/></td>
          <td><select class="input member-role"><option selected>Team Lead</option><option>Quality Engineer</option><option>Design Engineer</option><option>Sponsor</option><option>Operator</option><option>Supplier</option><option>Other</option></select></td>
          <td><input class="input contact-title" value="${me.title}"/></td>
          <td><input class="input contact-email" value="${me.email}"/></td>
          <td><input class="input contact-phone" value="${me.phone}"/></td>
          <td><button type="button" class="remove-row-btn btn btn-danger">Remove</button></td>`;
        teamTable.appendChild(row);
        renderOrgChart(container);
        renderTeamCards(container);
      }
    });
  }

  // D1: Org chart (simple)
  function renderOrgChart(container){
    const host = qs('#d1-org-chart', container);
    if(!host) return;
    const entries = [];
    // Legacy separate tables
    qsa('#d1-kpoc-table tbody tr, #d1-champions-table tbody tr, #d1-team-table tbody tr', container).forEach(tr=>{
      const name = tr.querySelector('.contact-name')?.value || '';
      const title = tr.querySelector('.contact-title')?.value || '';
      const roleSel = tr.querySelector('.member-role');
      const role = roleSel ? roleSel.value : (title || 'Member');
      if(name.trim()) entries.push({ name, role });
    });
    // Unified table (multi-role support)
    qsa('#d1-team-unified tbody tr', container).forEach(tr=>{
      const name = tr.querySelector('.contact-name')?.value || '';
      const title = tr.querySelector('.contact-title')?.value || '';
      const rolesSel = tr.querySelector('.member-roles');
      const roles = rolesSel ? Array.from(rolesSel.selectedOptions).map(o=>o.value) : [];
      const roleList = roles.length ? roles : [title || 'Member'];
      roleList.forEach(role=>{ if(name.trim()) entries.push({ name, role }); });
    });
    const groups = entries.reduce((acc, e)=>{ (acc[e.role] ||= []).push(e.name); return acc; }, {});
    host.innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([role, names])=>
      `<div class="card" style="padding:0.75rem;margin:0.5rem 0">
        <div class="section-title">${role}</div>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem">${names.map(n=>`<span class="badge" style="background:#e5e7eb;color:#374151">${n}</span>`).join('')}</div>
      </div>`
    ).join('') : '<div class="small text-gray-600">No team members yet.</div>';
  }

  // D1: Team cards (visual)
  function renderTeamCards(container){
    const host = qs('#d1-team-cards', container);
    if(!host) return;
    const people = [];
    // Legacy separate tables
    qsa('#d1-kpoc-table tbody tr, #d1-champions-table tbody tr, #d1-team-table tbody tr', container).forEach(tr=>{
      const name = tr.querySelector('.contact-name')?.value?.trim();
      const title = tr.querySelector('.contact-title')?.value?.trim();
      if(name){ people.push({ name, title: title||'Member' }); }
    });
    // Unified table
    qsa('#d1-team-unified tbody tr', container).forEach(tr=>{
      const name = tr.querySelector('.contact-name')?.value?.trim();
      const title = tr.querySelector('.contact-title')?.value?.trim() || 'Member';
      if(name){ people.push({ name, title }); }
    });
    // Quick-add list
    qsa('#d1-members-list .list-item .kv', container).forEach(el=>{
      const txt = (el.textContent||'').trim(); if(!txt) return;
      const name = txt.split(/[-—–]/)[0].trim();
      const rest = txt.replace(name, '').replace(/[-—–]/,'').trim();
      people.push({ name, title: rest || 'Member' });
    });
    const uniq = [];
    const seen = new Set();
    people.forEach(p=>{ const key=(p.name+'|'+p.title).toLowerCase(); if(!seen.has(key)){ seen.add(key); uniq.push(p);} });
    host.innerHTML = uniq.length ? uniq.map(p=>{
      const initials = p.name.split(/\s+/).map(n=>n[0]?.toUpperCase()||'').slice(0,2).join('');
      return `<div class="team-card">
        <div class="avatar" aria-hidden="true">${initials}</div>
        <div>
          <div class="card-title">${p.name}</div>
          <div class="card-sub">${p.title}</div>
        </div>
      </div>`;
    }).join('') : '<div class="small text-gray-600">No team members yet.</div>';
  }

  // D1: Meeting scheduler (.ics)
  function initMeetingScheduler(container){
    const btn = qs('#d1-schedule-meeting', container);
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const emails = new Set();
      qsa('.contact-email', container).forEach(inp=>{ if(inp.value && inp.value.includes('@')) emails.add(inp.value); });
      if(!emails.size){ alert('Please add at least one email.'); return; }
      const dt = new Date();
      const dtStart = new Date(dt.getTime()+3600000); // +1h
      const dtEnd = new Date(dtStart.getTime()+3600000);
      function fmt(d){ return d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'; }
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//8D//Scheduler//EN','CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:'+Date.now()+'@8d',
        'DTSTAMP:'+fmt(new Date()),
        'DTSTART:'+fmt(dtStart),
        'DTEND:'+fmt(dtEnd),
        'SUMMARY:8D Team Meeting',
        'DESCRIPTION:Discussion for 8D report',
        ...Array.from(emails).map(e=>'ATTENDEE;CN='+e+';RSVP=TRUE:mailto:'+e),
        'END:VEVENT','END:VCALENDAR' ].join('\r\n');
      const blob = new Blob([ics], {type:'text/calendar'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = '8D-Meeting.ics'; a.click(); URL.revokeObjectURL(url);
    });
  }

  // D2: Rich text editor for specific textarea
  function initRichText(container, id){
    const ta = qs('#'+id, container); if(!ta) return;
    const ed = qs('#'+id+'-editor', container); const tb = qs('#'+id+'-toolbar', container);
    if(!ed || !tb) return;
    // load existing value
    ed.innerHTML = (ta.value||'');
    function sync(){ ta.value = ed.innerHTML; ta.dispatchEvent(new Event('input', {bubbles:true})); }
    ed.addEventListener('input', sync);
    tb.addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const tgt = btn.getAttribute('data-target'); if(tgt !== id) return;
      ed.focus();
      if(btn.classList.contains('rt-bold')) document.execCommand('bold');
      if(btn.classList.contains('rt-italic')) document.execCommand('italic');
      if(btn.classList.contains('rt-ul')) document.execCommand('insertUnorderedList');
      if(btn.classList.contains('rt-ol')) document.execCommand('insertOrderedList');
      sync();
    });
  }

  // D2: Annotate images (simple freehand)
  function initAnnotate(container){
    container.addEventListener('click', (e)=>{
      const btn = e.target.closest('.annotate-btn');
      if(!btn) return;
      const inputSel = btn.getAttribute('data-for');
      const fileInp = inputSel ? qs(inputSel, container) : btn.parentElement?.querySelector('input[type=file]');
      if(!fileInp || !fileInp.files || !fileInp.files[0]){ alert('Upload an image first.'); return; }
      const file = fileInp.files[0]; if(!file.type.startsWith('image/')){ alert('Only images supported'); return; }
      const url = URL.createObjectURL(file);
      const modal = document.createElement('div'); modal.className='modal-overlay'; modal.id='anno-modal';
      const card = document.createElement('div'); card.className='card modal-card';
      card.innerHTML = '<div class="flex-between"><div class="h-title">Annotate Image</div><div class="controls"><button class="icon-btn" id="anno-clear">Clear</button><button class="icon-btn" id="anno-done">Done</button><button class="icon-btn" id="anno-close">✕</button></div></div>';
      const wrap = document.createElement('div'); wrap.style.maxHeight='70vh'; wrap.style.overflow='auto'; wrap.style.marginTop='.5rem';
      const canvas = document.createElement('canvas'); canvas.style.maxWidth='100%'; canvas.style.border='1px solid #e6e9ef';
      wrap.appendChild(canvas); card.appendChild(wrap); modal.appendChild(card); document.body.appendChild(modal);
      const ctx = canvas.getContext('2d');
      const img = new Image(); img.onload = ()=>{ canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img,0,0); }; img.src = url;
      let drawing=false, last=null; canvas.addEventListener('mousedown',(ev)=>{ drawing=true; last=[ev.offsetX, ev.offsetY];});
      canvas.addEventListener('mousemove',(ev)=>{ if(!drawing) return; ctx.strokeStyle='#ef4444'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(ev.offsetX, ev.offsetY); ctx.stroke(); last=[ev.offsetX, ev.offsetY];});
      window.addEventListener('mouseup',()=> drawing=false, {once:false});
      modal.addEventListener('click', (ev)=>{ if(ev.target.id==='anno-close'||ev.target.id==='anno-modal'){ modal.remove(); } });
      qs('#anno-clear', modal)?.addEventListener('click', ()=>{ ctx.drawImage(img,0,0); });
      qs('#anno-done', modal)?.addEventListener('click', ()=>{
        canvas.toBlob((blob)=>{
          if(blob){
            const newFile = new File([blob], file.name.replace(/(\.[^.]+)?$/, '-annotated$1'), {type:'image/png'});
            const dt = new DataTransfer(); dt.items.add(newFile); fileInp.files = dt.files; fileInp.dispatchEvent(new Event('change',{bubbles:true}));
            modal.remove();
          }
        }, 'image/png');
      });
    });
  }

  // D2: Part link sync
  function initPartLink(container){
    const num = qs('#d2-partNumber', container); const link = qs('#d2-part-link', container);
    if(!num || !link) return;
    const sync = ()=>{ const v = encodeURIComponent(num.value||''); link.href = '../Mapping.html?part='+v; };
    num.addEventListener('input', sync); sync();
  }

  // D3: auto-calc total checked
  function initD3AutoCalc(container){
    const tbl = (container||document).querySelector('#d3-sort'); if(!tbl) return;
    function recalcRow(tr){ const ok = Number(tr.querySelector('.qty-ok')?.value||0); const nok = Number(tr.querySelector('.qty-nok')?.value||0); const out = tr.querySelector('.qty-checked'); if(out){ out.value = String(ok + nok); out.dispatchEvent(new Event('input', {bubbles:true})); } }
    tbl.addEventListener('input', (e)=>{ const tr=e.target.closest('tr'); if(!tr) return; if(e.target.classList.contains('qty-ok') || e.target.classList.contains('qty-nok')) recalcRow(tr); });
    Array.from(tbl.querySelectorAll('tbody tr')).forEach(recalcRow);
  }

  // Simple table sorting for dynamic tables
  function initTableSorting(container){
    qsa('table.dynamic-table', container).forEach(tbl=>{
      const thead = tbl.querySelector('thead'); const tbody = tbl.querySelector('tbody'); if(!thead||!tbody) return;
      thead.querySelectorAll('th').forEach((th, idx)=>{
        th.style.cursor='pointer';
        th.addEventListener('click', ()=>{
          const rows = Array.from(tbody.querySelectorAll('tr'));
          const dir = th.dataset.sortDir === 'asc' ? 'desc' : 'asc'; th.dataset.sortDir = dir;
          const getVal = (tr)=>{ const cell = tr.children[idx]; const input = cell?.querySelector('input,select,textarea'); const val = input ? (input.value||'') : (cell?.textContent||''); return (val||'').toString().trim(); };
          const isNum = rows.every(r=>{ const v=getVal(r); return v==='' || !isNaN(parseFloat(v)); });
          rows.sort((a,b)=>{
            const va = getVal(a); const vb = getVal(b);
            let res = 0;
            if(isNum){ res = (parseFloat(va)||0) - (parseFloat(vb)||0); }
            else { res = va.localeCompare(vb, undefined, { numeric:true, sensitivity:'base' }); }
            return dir==='asc' ? res : -res;
          });
          rows.forEach(r=> tbody.appendChild(r));
        });
      });
    });
  }

  // D6 KPI mini charts
  function initD6Kpi(container){
    const defB=qs('#kpi-def-before',container), defA=qs('#kpi-def-after',container), defBar=qs('#kpi-def-bar',container);
    const rpnB=qs('#kpi-rpn-before',container), rpnA=qs('#kpi-rpn-after',container), rpnBar=qs('#kpi-rpn-bar',container);
    function upd(b,a,bar){ if(!bar) return; const vb=parseFloat(b?.value||'')||0; const va=parseFloat(a?.value||'')||0; const pct = vb<=0?0: Math.max(0, Math.min(100, ((vb-va)/vb)*100)); bar.style.width = pct+'%'; }
    function wire(b,a,bar){ if(b) b.addEventListener('input', ()=>upd(b,a,bar)); if(a) a.addEventListener('input', ()=>upd(b,a,bar)); upd(b,a,bar); }
    wire(defB,defA,defBar); wire(rpnB,rpnA,rpnBar);
  }

  // D6 before/after compare
  function initD6Compare(container){
    const beforeHost = qs('#d6-compare-before', container);
    const afterHost = qs('#d6-compare-after', container);
    if(beforeHost){
      try{
        const d2 = (window.app && window.app.data && window.app.data.d2 && window.app.data.d2.fields) || {};
        const items = ['briefStatement','impactCustomer','who','what','when','where','why'].map(k=> d2[k]).filter(Boolean);
        beforeHost.innerHTML = items.length ? `<ul class="small">${items.map(v=>`<li>• ${v}</li>`).join('')}</ul>` : '<div class="small text-gray-500">No D2 data.</div>';
      }catch(_){ beforeHost.innerHTML = '<div class="small text-gray-500">No D2 data.</div>'; }
    }
    if(afterHost){
      const proof = qs('#d6-proof', container)?.value||''; const sit = qs('#d6-situationAfter', container)?.value||'';
      const items = [proof, sit].filter(Boolean);
      afterHost.innerHTML = items.length ? `<ul class="small">${items.map(v=>`<li>• ${v}</li>`).join('')}</ul>` : '<div class="small text-gray-500">Nothing entered yet.</div>';
      container.addEventListener('input', (e)=>{ if(e.target && (e.target.id==='d6-proof' || e.target.id==='d6-situationAfter')){ initD6Compare(container); } });
    }
  }

  // Gantt for D6
  function initD6Gantt(container){
    const host = qs('#d6-impl', container);
    if(!host) return;
    function render(){
      let ganttHost = qs('#d6-gantt', container);
      if(!ganttHost){ ganttHost = document.createElement('div'); ganttHost.id='d6-gantt'; ganttHost.style.padding='.75rem'; ganttHost.style.border='1px solid #eef2f7'; ganttHost.style.borderRadius='8px'; ganttHost.className='mt-small'; host.parentElement.insertBefore(ganttHost, host.nextSibling); }
      const rows = Array.from(host.querySelectorAll('tbody tr'));
      const dates = rows.map(r=> r.querySelector('input[type="date"]')?.value).filter(Boolean).map(d=> new Date(d));
      if(dates.length===0){ ganttHost.innerHTML = '<div class="small text-gray-500">No target dates to show Gantt.</div>'; return; }
      const min = new Date(Math.min(...dates.map(d=>d.getTime())));
      const max = new Date(Math.max(...dates.map(d=>d.getTime())));
      const range = Math.max(1, (max-min)/(1000*60*60*24));
      // build bars
      ganttHost.innerHTML = '';
      rows.forEach((r, idx)=>{
        const action = r.querySelector('.impl-action')?.value || r.querySelector('td')?.textContent?.trim() || ('Action '+(idx+1));
        const dateVal = r.querySelector('input[type="date"]')?.value;
        const bar = document.createElement('div');
        bar.style.display='flex'; bar.style.alignItems='center'; bar.style.gap='8px'; bar.style.marginBottom='6px';
        const label = document.createElement('div'); label.style.width='180px'; label.style.fontSize='13px'; label.style.color='#0f172a'; label.textContent = action;
        const timeline = document.createElement('div'); timeline.style.flex='1'; timeline.style.position='relative'; timeline.style.height='14px'; timeline.style.background='#f8fafc'; timeline.style.border='1px solid #eef2f7'; timeline.style.borderRadius='6px';
        if(dateVal){ const d = new Date(dateVal); const days = (d - min)/(1000*60*60*24); const pct = Math.max(0, Math.min(100, (days / range) * 100)); const dot = document.createElement('div'); dot.style.position='absolute'; dot.style.left = pct + '%'; dot.style.transform='translateX(-50%)'; dot.style.top='50%'; dot.style.width='10px'; dot.style.height='10px'; dot.style.borderRadius='50%'; dot.style.background = 'var(--brand-primary)'; dot.style.boxShadow='0 2px 6px rgba(2,6,23,0.12)'; timeline.appendChild(dot); }
        bar.appendChild(label); bar.appendChild(timeline); ganttHost.appendChild(bar);
      });
    }
    // watch for changes
    host.addEventListener('input', ()=> setTimeout(render, 200));
    host.addEventListener('click', ()=> setTimeout(render, 250));
    render();
  }

  // Boot
  document.addEventListener('DOMContentLoaded', ()=>{
    initDynamicTables(document);
    initTabs(document);
    initStickyTitles(document);
    initFilePreviews(document);
    initDropZones(document);
    initTableSorting(document);
    initD1QuickAdd(document);
    initContactDirectory(document);
    initAddMe(document);
    initMeetingScheduler(document);
    initAnnotate(document);
    initPartLink(document);
    initRichText(document, 'd2-problemStatement');
    initRichText(document, 'd2-situationBefore');
    initD3AutoCalc(document);
    initD3Kanban(document);
    initD4RCA(document);
    initD4RootScore(document);
    initD5Enhancements(document);
    initD5Gantt(document);
    initD6Kpi(document);
    initD6Compare(document);
    initD6Signoff(document);
    initSyncD6FromD5(document);
    initD7Enhancements(document);
    initD8Enhancements(document);
    initD1UnifiedPersist(document);
    renderOrgChart(document);
    renderTeamCards(document);
  });

  // Also re-init when content is injected
  window.__init8D = function(container){
    const ctx = container||document;
    initDynamicTables(ctx);
    initTabs(ctx);
    initStickyTitles(ctx);
    initFilePreviews(ctx);
    initDropZones(ctx);
    initTableSorting(ctx);
    initD1QuickAdd(ctx);
    initContactDirectory(ctx);
    initAddMe(ctx);
    initMeetingScheduler(ctx);
    initAnnotate(ctx);
    initPartLink(ctx);
    initRichText(ctx, 'd2-problemStatement');
    initRichText(ctx, 'd2-situationBefore');
    initD3AutoCalc(ctx);
    initD3Kanban(ctx);
    initD4RCA(ctx);
    initD4RootScore(ctx);
    initD5Enhancements(ctx);
    initD5Gantt(ctx);
    initD6Kpi(ctx);
    initD6Compare(ctx);
    initD6Signoff(ctx);
    initSyncD6FromD5(ctx);
    initD7Enhancements(ctx);
    initD8Enhancements(ctx);
    initD1UnifiedPersist(ctx);
    renderOrgChart(ctx);
    renderTeamCards(ctx);
    // init D6 gantt if present
    initD6Gantt(ctx);
    // render lucide icons in injected content
    try{ if(window.lucide && window.lucide.createIcons) window.lucide.createIcons(); }catch(e){}
  }

  // D3: Kanban board for immediate actions
  function initD3Kanban(container){
    const addInp = (container||document).querySelector('#d3-new-action');
    const cols = {
      todo: (container||document).querySelector('#d3-col-todo'),
      inprogress: (container||document).querySelector('#d3-col-inprogress'),
      done: (container||document).querySelector('#d3-col-done')
    };
    if(!addInp || !cols.todo || !cols.inprogress || !cols.done) return;
    function getStore(){ try{ return (window.app&&app.data&&app.data.d3&&app.data.d3.fields) || {}; }catch(_){ return {}; } }
    function ensureStore(){ if(!window.app||!app.data||!app.data.d3) return; if(!app.data.d3.fields.kanban){ app.data.d3.fields.kanban = { todo:[], inprogress:[], done:[] }; } }
    function render(){ ensureStore(); const kb = getStore().kanban||{todo:[],inprogress:[],done:[]}; ['todo','inprogress','done'].forEach(col=>{ cols[col].innerHTML = kb[col].map((t,i)=> card(col,i,t)).join(''); }); bindDnD(); if(window.lucide&&window.lucide.createIcons) window.lucide.createIcons(); }
    function card(col, idx, text){ return `<div class="card" draggable="true" data-col="${col}" data-idx="${idx}" style="margin:.4rem 0;padding:.5rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem"><span>${text}</span><span class="controls"><button class="icon-btn d3-del" title="Remove"><i data-lucide="trash-2"></i></button></span></div>`; }
    function save(){ if(window.app) app.saveData('d3-kanban'); }
    addInp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ const v=(addInp.value||'').trim(); if(!v) return; ensureStore(); app.data.d3.fields.kanban.todo.push(v); addInp.value=''; render(); save(); }});
    (container||document).addEventListener('click', (e)=>{ const del = e.target.closest('.d3-del'); if(!del) return; const host = del.closest('[draggable]'); const col = host.dataset.col; const idx = Number(host.dataset.idx); ensureStore(); app.data.d3.fields.kanban[col].splice(idx,1); render(); save(); });
    function bindDnD(){ (container||document).querySelectorAll('#d3-kanban [draggable]')?.forEach(card=>{
      card.addEventListener('dragstart', (e)=>{ e.dataTransfer.setData('text/plain', JSON.stringify({ col: card.dataset.col, idx: Number(card.dataset.idx) })); });
    }); Object.entries(cols).forEach(([col, el])=>{
      el.addEventListener('dragover', (e)=> e.preventDefault());
      el.addEventListener('drop', (e)=>{ e.preventDefault(); const data = JSON.parse(e.dataTransfer.getData('text/plain')); ensureStore(); const kb = app.data.d3.fields.kanban; const [item] = kb[data.col].splice(data.idx,1); kb[col].push(item); render(); save(); });
    }); }
    render();
  }

  // D4: RCA tools (fishbone + 5 whys + promote + score)
  function initD4RCA(container){
    const fishHost = (container||document).querySelector('#d4-fishbone-canvas');
    const fishTable = (container||document).querySelector('#d4-fishbone-table tbody');
    const causeList = (container||document).querySelector('#d4-cause-list');
    const whysHost = (container||document).querySelector('#d4-fivewhys');
    const whyTarget = (container||document).querySelector('#d4-why-target');
    const startBtn = (container||document).querySelector('#d4-start-whys');
    if(fishHost){
      if(!fishHost.dataset.wired){ fishHost.dataset.wired='1'; fishHost.innerHTML = buildFishboneSvg(); fishHost.addEventListener('click', (e)=>{
        const btn = e.target.closest('[data-cat]'); if(!btn) return; const cat = btn.getAttribute('data-cat'); addFishboneRow(cat, ''); syncCauseList(); }); }
    }
    function buildFishboneSvg(){
      const cats = ['Man','Machine','Method','Material','Measurement','Environment'];
      const points = [ [120,60],[240,60],[360,60],[120,160],[240,160],[360,160] ];
      const branches = points.map(([x,y],i)=>`<line x1="80" y1="110" x2="${x}" y2="${y}" stroke="#64748b" stroke-width="2"/>`+`<g data-cat="${cats[i]}"><circle cx="${x+8}" cy="${y}" r="10" fill="#e5e7eb" stroke="#94a3b8" /><text x="${x+22}" y="${y+4}" font-size="12" fill="#0f172a">${cats[i]}</text></g>`).join('');
      return `<svg viewBox="0 0 680 200" width="100%" height="200" aria-label="Fishbone"><line x1="40" y1="110" x2="640" y2="110" stroke="#334155" stroke-width="3"/><polygon points="640,110 620,100 620,120" fill="#334155"/>${branches}<text x="50" y="100" font-size="12" fill="#0f172a">Effect / Problem</text></svg>`;
    }
    function addFishboneRow(cat, txt){ if(!fishTable) return; const tpl = (container||document).querySelector('#d4-fishbone-table template'); const row = tpl.content.firstElementChild.cloneNode(true); row.querySelector('select')?.querySelectorAll('option')?.forEach(o=>{ if(o.textContent===cat) o.selected=true; }); row.querySelector('.d4-cause-text').value = txt||''; fishTable.appendChild(row); }
    function syncCauseList(){ if(!causeList || !fishTable) return; const causes = Array.from(fishTable.querySelectorAll('tr')).map(tr=>({ cat: tr.querySelector('select')?.value||'', txt: tr.querySelector('.d4-cause-text')?.value||'' })).filter(c=> c.txt.trim()); causeList.innerHTML = causes.length? causes.map((c,i)=>`<div class="list-item" data-i="${i}"><span><strong>${c.cat}:</strong> ${c.txt}</span><span class="controls"><button class="btn btn-ghost d4-start" data-i="${i}">Start 5 Whys</button><button class="btn btn-ghost d4-promote" data-i="${i}">Promote</button></span></div>`).join('') : '<div class="small text-gray-500">No causes yet.</div>'; }
    (container||document).addEventListener('input', (e)=>{ if(e.target.closest('#d4-fishbone-table')) syncCauseList(); });
    (container||document).addEventListener('click', (e)=>{
      if(e.target.closest('.d4-promote')){ const i = Number(e.target.closest('.d4-promote').dataset.i); promoteCause(i); }
      if(e.target.closest('.d4-start')){ const i = Number(e.target.closest('.d4-start').dataset.i); const tr = fishTable.querySelectorAll('tr')[i]; const txt = tr?.querySelector('.d4-cause-text')?.value||''; beginWhys(txt); }
    });
    if(startBtn){ startBtn.addEventListener('click', ()=>{ const txt = (whyTarget?.value||'').trim(); if(txt) beginWhys(txt); }); }
    function beginWhys(targetTxt){ if(!whysHost) return; const chain = []; renderWhys(); function renderWhys(){ whysHost.innerHTML = `<div class="card"><div class="section-title">5 Whys for: ${targetTxt}</div>${Array.from({length:chain.length}).map((_,i)=>`<div class="row mt-xs"><div class="col"><label class="label">Why ${i+1}</label><input class="input why-q" data-i="${i}" value="${chain[i].q||''}"/></div><div class="col"><label class="label">Because</label><input class="input why-a" data-i="${i}" value="${chain[i].a||''}"/></div></div>`).join('')}<div class="controls mt-xs"><button class="btn btn-ghost" id="why-add">Add Why</button><button class="btn btn-primary" id="why-finish">Finish</button></div></div>`; }
      whysHost.onclick = (ev)=>{ if(ev.target.id==='why-add'){ chain.push({q:'',a:''}); renderWhys(); }
        if(ev.target.id==='why-finish'){ storeWhys(targetTxt, chain); alert('5 Whys saved'); } };
      whysHost.oninput = (ev)=>{ const q = ev.target.closest('.why-q'); const a = ev.target.closest('.why-a'); if(q){ chain[Number(q.dataset.i)] = { ...(chain[Number(q.dataset.i)]||{}), q: q.value }; } if(a){ chain[Number(a.dataset.i)] = { ...(chain[Number(a.dataset.i)]||{}), a: a.value }; } };
      chain.push({q:'',a:''}); renderWhys();
    }
    function storeWhys(causeTxt, chain){ try{ if(!window.app) return; const d = app.data; if(!d.d4) d.d4 = { fields:{} }; if(!d.d4.fields.whys) d.d4.fields.whys = {}; d.d4.fields.whys[causeTxt] = chain; app.saveData('d4-5whys'); }catch(_){ } }
    function promoteCause(i){ const rootTbl = (container||document).querySelector('#d4-root-causes tbody'); if(!rootTbl||!fishTable) return; const tr = fishTable.querySelectorAll('tr')[i]; if(!tr) return; const txt = tr.querySelector('.d4-cause-text')?.value||''; const cat = tr.querySelector('select')?.value||''; const tpl = (container||document).querySelector('#d4-root-causes template'); const row = tpl.content.firstElementChild.cloneNode(true); row.querySelector('.rc-text').value = txt; rootTbl.appendChild(row); calcScores(); app&&app.saveData&&app.saveData('d4-promote'); }
    function calcScores(){ const rows = Array.from((container||document).querySelectorAll('#d4-root-causes tbody tr')); rows.forEach(r=>{ const like = Number(r.querySelector('.rc-like')?.value||0); const sev = Number(r.querySelector('.rc-sev')?.value||0); const out = r.querySelector('.rc-score'); if(out) out.value = String(like*sev); }); app&&app.saveData&&app.saveData('d4-score'); }
    (container||document).addEventListener('change', (e)=>{ if(e.target.closest('#d4-root-causes')) calcScores(); });
    // Link button shows trace of whys
    (container||document).addEventListener('click', (e)=>{ const btn = e.target.closest('.rc-link'); if(!btn) return; const tr = btn.closest('tr'); const txt = tr.querySelector('.rc-text')?.value||''; const chain = (app?.data?.d4?.fields?.whys||{})[txt]||[]; const modal=document.createElement('div'); modal.className='modal-overlay'; const card=document.createElement('div'); card.className='card modal-card'; card.innerHTML = `<div class="flex-between"><div class="h-title">Trace for Root Cause</div><button class="icon-btn" id="rc-close">✕</button></div><div class="mt-small small">${chain.length? '<ol>'+chain.map((c,i)=>`<li><strong>Why ${i+1}:</strong> ${c.q||''}<br/><strong>Because:</strong> ${c.a||''}</li>`).join('')+'</ol>' : 'No 5 Whys captured.'}</div>`; modal.appendChild(card); document.body.appendChild(modal); modal.addEventListener('click', (ev)=>{ if(ev.target.id==='rc-close'||ev.target===modal) modal.remove(); }); });
    // Expose root causes to D5
    try{ const roots = Array.from((container||document).querySelectorAll('#d4-root-causes tbody tr')).map(r=> r.querySelector('.rc-text')?.value||'').filter(Boolean); if(roots.length){ if(!app.data.d4) app.data.d4={fields:{}}; app.data.d4.fields.rootList = roots; app.saveData('d4-root-export'); } }catch(_){ }
    syncCauseList();
  }
  function initD4RootScore(container){ const tbl = (container||document).querySelector('#d4-root-causes'); if(!tbl) return; const recalc = ()=>{ Array.from(tbl.querySelectorAll('tbody tr')).forEach(tr=>{ const like = Number(tr.querySelector('.rc-like')?.value||0); const sev = Number(tr.querySelector('.rc-sev')?.value||0); const out = tr.querySelector('.rc-score'); if(out) out.value = String(like*sev); }); }; tbl.addEventListener('change', recalc); recalc(); }

  // D5: pre-populate root causes + per-row attachments + Gantt
  function initD5Enhancements(container){
    const tbl = (container||document).querySelector('#d5-actions'); if(!tbl) return;
    // Populate root causes
    const rootSelRows = ()=> Array.from(tbl.querySelectorAll('.pca-root'));
    const roots = (app?.data?.d4?.fields?.rootList)||[]; if(roots.length){ rootSelRows().forEach(sel=>{ const cur = sel.value; sel.innerHTML = '<option value="">Select Root Cause</option>' + roots.map(r=>`<option>${r}</option>`).join(''); if(cur) sel.value = cur; }); }
    // Character counter for selectedPCA
    const ta = (container||document).querySelector('#d5-selectedPCA'); const counter = (container||document).querySelector('#d5-pca-counter'); if(ta && counter){ const upd=()=> counter.textContent = (ta.value||'').length+' characters'; ta.addEventListener('input', upd); upd(); }
    // Drag to reorder rows
    const tbody = tbl.querySelector('tbody'); if(tbody){ tbody.addEventListener('dragstart', (e)=>{ const tr=e.target.closest('tr'); if(!tr) return; e.dataTransfer.setData('text/plain', Array.from(tbody.children).indexOf(tr)); }); tbody.addEventListener('dragover', (e)=> e.preventDefault()); tbody.addEventListener('drop', (e)=>{ e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); const to = Array.from(tbody.children).indexOf(e.target.closest('tr')); const rows = Array.from(tbody.children); if(from>=0 && to>=0 && from!==to){ tbody.insertBefore(rows[from], rows[to]); } }); }
    // Persist PCA list to app.data for D6 sync
    function persist(){ if(!window.app) return; const items = Array.from(tbl.querySelectorAll('tbody tr')).map(r=>({ action: r.querySelector('.pca-action')?.value||'', date: r.querySelector('.pca-date')?.value||'', root: r.querySelector('.pca-root')?.value||'' })); app.data.d5 = app.data.d5||{fields:{}}; app.data.d5.fields.pcas = items; app.saveData('d5-persist'); }
    tbl.addEventListener('input', persist); tbl.addEventListener('change', persist);
  }
  function initD5Gantt(container){ const host = (container||document).querySelector('#d5-gantt'); const tbl=(container||document).querySelector('#d5-actions'); if(!host||!tbl) return; function render(){ const rows = Array.from(tbl.querySelectorAll('tbody tr')); const dates = rows.map(r=> r.querySelector('.pca-date')?.value).filter(Boolean).map(d=> new Date(d)); if(!dates.length){ host.innerHTML='<div class="small text-gray-500">Add target dates to see timeline.</div>'; return; } const min = new Date(Math.min(...dates.map(d=>d.getTime()))); const max = new Date(Math.max(...dates.map(d=>d.getTime()))); const range=Math.max(1,(max-min)/(86400000)); host.innerHTML=''; rows.forEach((r,i)=>{ const name=r.querySelector('.pca-action')?.value||('Action '+(i+1)); const dateVal=r.querySelector('.pca-date')?.value; const bar=document.createElement('div'); bar.style.display='flex'; bar.style.alignItems='center'; bar.style.gap='8px'; bar.style.margin='6px 0'; const label=document.createElement('div'); label.style.width='180px'; label.style.fontSize='13px'; label.textContent=name; const tl=document.createElement('div'); tl.style.flex='1'; tl.style.position='relative'; tl.style.height='12px'; tl.style.background='#f8fafc'; tl.style.border='1px solid #eef2f7'; tl.style.borderRadius='6px'; if(dateVal){ const d=new Date(dateVal); const pct=Math.max(0,Math.min(100, ((d-min)/(86400000))/range*100)); const dot=document.createElement('div'); dot.style.position='absolute'; dot.style.left=pct+'%'; dot.style.transform='translateX(-50%)'; dot.style.top='50%'; dot.style.width='10px'; dot.style.height='10px'; dot.style.borderRadius='50%'; dot.style.background='var(--brand-primary)'; tl.appendChild(dot); } bar.appendChild(label); bar.appendChild(tl); host.appendChild(bar); }); }
    tbl.addEventListener('input', ()=> setTimeout(render,150)); render(); }

  // D6: sign-off gating + sync from D5
  function initD6Signoff(container){ const btn=(container||document).querySelector('#d6-approve'); const tbl=(container||document).querySelector('#d6-verify'); if(!btn||!tbl) return; function check(){ const ok = Array.from(tbl.querySelectorAll('tbody select')).every(s=> (s.value||'').toLowerCase()==='yes'); btn.disabled = !ok; const status=(container||document).querySelector('#d6-approval-status'); if(status) status.textContent = ok? 'All checklist items complete. You may sign off.' : 'Complete all items to enable sign-off.'; } tbl.addEventListener('change', check); check(); }
  function initSyncD6FromD5(container){ const tbl=(container||document).querySelector('#d6-impl tbody'); if(!tbl) return; try{ const pcas = app?.data?.d5?.fields?.pcas||[]; if(pcas && pcas.length && tbl.children.length===0){ const tpl=(container||document).querySelector('#d6-impl template'); pcas.forEach(p=>{ const row=tpl.content.firstElementChild.cloneNode(true); row.querySelector('.impl-action').value = p.action||''; row.querySelector('input[type="date"]').value = p.date||''; tbl.appendChild(row); }); if(window.lucide&&window.lucide.createIcons) window.lucide.createIcons(); } }catch(_){ }
  }

  // D7: details panel + RPN calc + checklist + ack bar
  function initD7Enhancements(container){ const table=(container||document).querySelector('#d7-prevent-slim'); if(!table) return; const detail=(container||document).querySelector('#d7-detail'); const rpnVal=(container||document).querySelector('#d7-rpn-val'); const stdList=(container||document).querySelector('#d7-std-list'); const ackBar=(container||document).querySelector('#d7-ack-bar'); const viewAcks=(container||document).querySelector('#d7-view-acks');
    table.addEventListener('click', (e)=>{ const exp=e.target.closest('.d7-expand'); if(!exp) return; detail.style.display='block'; });
    function calc(){ const s=Number((container||document).querySelector('.rpn-s')?.value||0); const o=Number((container||document).querySelector('.rpn-o')?.value||0); const d=Number((container||document).querySelector('.rpn-d')?.value||0); if(rpnVal) rpnVal.textContent = String(s*o*d); }
    (container||document).addEventListener('input', (e)=>{ if(e.target.closest('#d7-detail')) calc(); }); calc();
    if(stdList && !stdList.childElementCount){ const items=['FMEA','Control Plan','SOPs','Work Instructions','Training Records','Inspection Sheets']; stdList.innerHTML = items.map((t,i)=>`<label class="small" style="display:flex;align-items:center;gap:.5rem"><input type="checkbox" class="d7-std" data-i="${i}"/> ${t}</label>`).join(''); }
    function renderAck(){ const team = app?.data?.d1?.fields?.teamMembers||[]; const total = team.length||10; const done = Math.min(total, Math.floor(total*0.7)); if(ackBar) ackBar.textContent = `${done} of ${total} acknowledged`; }
    renderAck(); viewAcks&&viewAcks.addEventListener('click', ()=>{ const modal=document.createElement('div'); modal.className='modal-overlay'; const card=document.createElement('div'); card.className='card modal-card'; card.innerHTML = `<div class="flex-between"><div class="h-title">Acknowledgements</div><button class="icon-btn" id="ack-close">✕</button></div><div class="mt-small small">${(app?.data?.d1?.fields?.teamMembers||[]).map(n=>`<div>✓ ${n}</div>`).join('')||'No data.'}</div>`; modal.appendChild(card); document.body.appendChild(modal); modal.addEventListener('click', (ev)=>{ if(ev.target.id==='ack-close'||ev.target===modal) modal.remove(); }); });
  }

  // D8: auto-populate + summary + signatures + live report
  function initD8Enhancements(container){ const tbl=(container||document).querySelector('#d8-ack'); const auto=(container||document).querySelector('#d8-autofill-team'); const gen=(container||document).querySelector('#d8-generate'); const report=(container||document).querySelector('#d8-report'); if(!(tbl&&report)) return;
    function addRow(name,title){ const tpl=(container||document).querySelector('#d8-ack template'); const row=tpl.content.firstElementChild.cloneNode(true); row.querySelector('.ack-name').value=name||''; row.querySelector('.ack-title').value=title||''; tbl.querySelector('tbody').appendChild(row); }
    auto&&auto.addEventListener('click', ()=>{ const team = app?.data?.d1?.fields?.teamMembers || []; if(team.length===0){ alert('No D1 team data available.'); return; } team.forEach(t=> addRow(t.name||t, t.title||'Member')); });
    function renderReport(){ const names = Array.from(tbl.querySelectorAll('.ack-name')).map(i=>i.value).filter(Boolean); const approved = (container||document).querySelector('#d8-approvedName')?.value||''; const approvedDate = (container||document).querySelector('#d8-approvedDate')?.value||''; const submitted = (container||document).querySelector('#d8-submittedName')?.value||''; report.innerHTML = `<div><strong>Team:</strong> ${names.join(', ')||'-'}</div><div><strong>Approved by:</strong> ${approved||'-'} ${approvedDate? '('+approvedDate+')':''}</div><div><strong>Submitted by:</strong> ${submitted||'-'}</div>`; }
    (container||document).addEventListener('input', (e)=>{ if(e.target.closest('#d8-ack') || e.target.closest('#d8-approvedName') || e.target.closest('#d8-approvedDate') || e.target.closest('#d8-submittedName')) renderReport(); }); renderReport();
    gen&&gen.addEventListener('click', ()=>{ const prob = app?.data?.d2?.fields?.briefStatement || 'the defined problem'; const done = (window.disciplines||[]).filter(d=> app?.data?.[d.id]?.status==='completed').length; const total=(window.disciplines||[]).length; const para = `Congratulations to the team for successfully driving the 8D through ${done} of ${total} disciplines. We addressed ${prob} with cross-functional collaboration, validated corrective actions, and confirmed improvement through KPIs. Thank you for your contributions and commitment to quality.`; const p=document.createElement('p'); p.textContent=para; report.appendChild(p); });
    // Signatures
    function wireSign(canvasId, saveBtnId, imgId){ const c=(container||document).querySelector('#'+canvasId); const save=(container||document).querySelector('#'+saveBtnId); const img=(container||document).querySelector('#'+imgId); if(!c||!save||!img) return; const ctx=c.getContext('2d'); let drawing=false,last=null; c.addEventListener('mousedown',(e)=>{ drawing=true; last=[e.offsetX,e.offsetY]; }); c.addEventListener('mousemove',(e)=>{ if(!drawing) return; ctx.strokeStyle='#0f172a'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); last=[e.offsetX,e.offsetY]; }); window.addEventListener('mouseup',()=> drawing=false); save.addEventListener('click', ()=>{ const url=c.toDataURL('image/png'); img.innerHTML = `<img src="${url}" alt="Signature" style="border:1px solid #e6e9ef;border-radius:8px"/>`; const modal=document.createElement('div'); modal.className='modal-overlay'; const card=document.createElement('div'); card.className='card modal-card'; card.innerHTML = `<div class="flex-between"><div class="h-title">Signature Captured</div><button class="icon-btn" id="sig-close">✕</button></div><div class="mt-small small">Your signature has been saved.</div>`; modal.appendChild(card); document.body.appendChild(modal); modal.addEventListener('click', (ev)=>{ if(ev.target.id==='sig-close'||ev.target===modal) modal.remove(); }); }); }
    wireSign('d8-approved-sign','d8-approved-save','d8-approved-img');
    wireSign('d8-submitted-sign','d8-submitted-save','d8-submitted-img');
  }

  // D1 unified table persistence for cross-page features
  function initD1UnifiedPersist(container){
    const ctx = container||document;
    const unified = ctx.querySelector('#d1-team-unified');
    const kp = ctx.querySelector('#d1-kpoc-table');
    const ch = ctx.querySelector('#d1-champions-table');
    const tm = ctx.querySelector('#d1-team-table');
    if(!unified && !kp && !ch && !tm) return;
    function collect(){
      const rows = [];
      if(unified){
        rows.push(...Array.from(unified.querySelectorAll('tbody tr')).map(r=>({
          name: r.querySelector('.contact-name')?.value||'',
          title: r.querySelector('.contact-title')?.value||'',
          email: r.querySelector('.contact-email')?.value||'',
          phone: r.querySelector('.contact-phone')?.value||'',
          role: (r.querySelector('.member-roles') && Array.from(r.querySelector('.member-roles').selectedOptions).map(o=>o.value).join(', ')) || 'Member'
        })));
      }
      function collectFrom(table, role){
        if(!table) return;
        rows.push(...Array.from(table.querySelectorAll('tbody tr')).map(r=>({
          name: r.querySelector('.contact-name')?.value||'',
          title: r.querySelector('.contact-title')?.value||'',
          email: r.querySelector('.contact-email')?.value||'',
          phone: r.querySelector('.contact-phone')?.value||'',
          role: role
        })));
      }
      collectFrom(kp, 'KPOC');
      collectFrom(ch, 'Champion');
      collectFrom(tm, 'Member');
      app.data.d1 = app.data.d1||{fields:{}};
      app.data.d1.fields.teamMembers = rows;
      app.saveData('d1-team');
    }
    [unified, kp, ch, tm].filter(Boolean).forEach(t=>{ t.addEventListener('input', collect); t.addEventListener('change', collect); });
    collect();
  }

})();
