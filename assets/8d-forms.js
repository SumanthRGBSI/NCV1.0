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

  // File previews for image inputs
  function initFilePreviews(container){
    qsa('.preview-file', container).forEach(inp=>{
      inp.addEventListener('change', (e)=>{
        const file = e.target.files[0];
        const preview = e.target.closest('.file-block, .drop-zone')?.querySelector('.file-preview');
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
        div.innerHTML = `<div class="kv">${input.value.trim()}</div><button type="button" class="btn btn-ghost remove-member" aria-label="Remove"><i class="fa-solid fa-trash"></i></button>`;
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
    qsa('#d1-kpoc-table tbody tr, #d1-champions-table tbody tr, #d1-team-table tbody tr', container).forEach(tr=>{
      const name = tr.querySelector('.contact-name')?.value || '';
      const title = tr.querySelector('.contact-title')?.value || '';
      const roleSel = tr.querySelector('.member-role');
      const role = roleSel ? roleSel.value : (title || 'Member');
      if(name.trim()) entries.push({ name, role });
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
    qsa('#d1-kpoc-table tbody tr, #d1-champions-table tbody tr, #d1-team-table tbody tr', container).forEach(tr=>{
      const name = tr.querySelector('.contact-name')?.value?.trim();
      const title = tr.querySelector('.contact-title')?.value?.trim();
      if(name){ people.push({ name, title: title||'Member' }); }
    });
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

  // Boot
  document.addEventListener('DOMContentLoaded', ()=>{
    initDynamicTables(document);
    initFilePreviews(document);
    initDropZones(document);
    initD1QuickAdd(document);
    initContactDirectory(document);
    initAddMe(document);
    initMeetingScheduler(document);
    initAnnotate(document);
    initPartLink(document);
    initRichText(document, 'd2-problemStatement');
    initRichText(document, 'd2-situationBefore');
    renderOrgChart(document);
    renderTeamCards(document);
  });

  // Also re-init when content is injected
  window.__init8D = function(container){
    const ctx = container||document;
    initDynamicTables(ctx);
    initFilePreviews(ctx);
    initDropZones(ctx);
    initD1QuickAdd(ctx);
    initContactDirectory(ctx);
    initAddMe(ctx);
    initMeetingScheduler(ctx);
    initAnnotate(ctx);
    initPartLink(ctx);
    initRichText(ctx, 'd2-problemStatement');
    initRichText(ctx, 'd2-situationBefore');
    renderOrgChart(ctx);
  }
})();
