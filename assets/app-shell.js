(function(){
  function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }
  function qs(s, c=document){ return c.querySelector(s); }
  function on(elm, ev, fn){ elm && elm.addEventListener(ev, fn); }
  function ensureLucide(){
    if(window.lucide) return Promise.resolve();
    return new Promise(res=>{
      const s=document.createElement('script'); s.src='https://unpkg.com/lucide@latest'; s.async=true; s.onload=()=>res(); document.head.appendChild(s);
    });
  }
  function applyBranding(){
    try{
      const theme = JSON.parse(localStorage.getItem('ds-branding')||'{}');
      if(theme.primary){ document.documentElement.style.setProperty('--theme-primary', theme.primary); document.documentElement.setAttribute('data-theme-primary',''); }
      if(theme.logo){ const img=qs('#ds-brand-logo'); if(img){ img.src = theme.logo; img.classList.remove('ds-hidden'); qs('#ds-brand-fallback')?.classList.add('ds-hidden'); }
      }
    }catch(_){/* ignore */}
  }
  function getDensity(){ return localStorage.getItem('ds-density') || 'comfortable'; }
  function setDensity(v){ localStorage.setItem('ds-density', v); document.documentElement.setAttribute('data-density', v === 'compact' ? 'compact' : 'comfortable'); }

  function buildHeader(){
    const hdr = el(`
      <header id="global-app-header" class="ds-app-header sticky top-0 z-40" role="banner">
        <div class="ds-header-inner">
          <a href="index.html#hub" class="ds-brand" aria-label="Home">
            <img id="ds-brand-logo" alt="Brand" class="ds-hidden" width="36" height="36" />
            <div id="ds-brand-fallback" class="ds-brand__logo">N</div>
            <div class="ds-brand__text">
              <span class="ds-brand__subtitle">Quality Suite</span>
              <span class="ds-brand__title">Navigation</span>
            </div>
          </a>
          <div class="ds-header-actions">
            <div class="ds-search" role="search">
              <i data-lucide="search" class="ds-search__icon"></i>
              <input id="ds-global-search" type="search" placeholder="Search 8D, NC, parts, users…" aria-label="Global search" />
            </div>
            <button id="ds-density" class="ds-icon-btn" title="Toggle density" aria-label="Toggle density">
              <i data-lucide="rows"></i>
            </button>
            <div class="ds-notify-wrap" style="position:relative">
              <button id="ds-bell" class="ds-icon-btn" aria-haspopup="true" aria-expanded="false" aria-label="Notifications">
                <i data-lucide="bell"></i>
              </button>
              <div id="ds-bell-pop" class="ds-popover" role="menu" aria-labelledby="ds-bell"></div>
            </div>
          </div>
        </div>
      </header>`);
    return hdr;
  }

  function populateBell(){
    const host = qs('#ds-bell-pop'); if(!host) return;
    let items = [];
    try{ items = JSON.parse(localStorage.getItem('ds-notifications')||'[]'); }catch(_){ items = []; }
    if(!Array.isArray(items) || items.length===0){
      items = [
        { t:'New 8D assigned', s:'success', d: new Date().toLocaleString() },
        { t:'NC INC-0203902911 overdue', s:'warning', d: new Date(Date.now()-86400000).toLocaleString() },
        { t:'CAPA verified for NC-CAPA-007', s:'success', d: new Date(Date.now()-3600000).toLocaleString() }
      ];
    }
    const rows = items.map(n=>`<div class="ds-popover__section">
      <div class="flex" style="display:flex;align-items:center;gap:.5rem;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:.5rem">
          <span class="ds-badge ${n.s==='success'?'ds-badge--success': n.s==='warning'?'ds-badge--warning':'ds-badge--danger'}">${n.s==='success'?'✓':n.s==='warning'?'!':'!'} ${n.s}</span>
          <span style="color:var(--gray-800);font-weight:600">${n.t}</span>
        </span>
        <span class="ds-caption" style="margin-left:.5rem">${n.d}</span>
      </div>
    </div>`).join('');
    host.innerHTML = `<div class="ds-popover__section" style="border-bottom:1px solid var(--gray-100);font-weight:700;color:var(--gray-800)">Notifications</div>${rows}`;
  }

  function maybeEnhanceExistingHeader(){
    // If a page already has a branded header (e.g., index.html), only add the right-side actions
    const existing = qs('#header');
    if(!existing) return false;
    const bar = existing.querySelector('.max-w-7xl') || existing.querySelector('.container') || existing;
    const row = bar.querySelector('.flex');
    if(!row) return false;
    if(existing.querySelector('#ds-global-search')) return true; // already enhanced
    const actions = el(`<div class="ds-header-actions">
      <div class="ds-search" role="search">
        <i data-lucide="search" class="ds-search__icon"></i>
        <input id="ds-global-search" type="search" placeholder="Search 8D, NC, parts, users…" aria-label="Global search" />
      </div>
      <button id="ds-density" class="ds-icon-btn" title="Toggle density" aria-label="Toggle density"><i data-lucide=rows></i></button>
      <div class="ds-notify-wrap" style="position:relative">
        <button id="ds-bell" class="ds-icon-btn" aria-haspopup="true" aria-expanded="false" aria-label="Notifications"><i data-lucide=bell></i></button>
        <div id="ds-bell-pop" class="ds-popover" role="menu" aria-labelledby="ds-bell"></div>
      </div>
    </div>`);
    row.appendChild(actions);
    return true;
  }

  function wireInteractions(){
    const bell = qs('#ds-bell'); const pop = qs('#ds-bell-pop');
    if(bell){
      on(bell, 'click', (e)=>{ e.stopPropagation(); populateBell(); pop?.classList.toggle('active'); bell.setAttribute('aria-expanded', pop?.classList.contains('active')?'true':'false'); });
      on(document, 'click', ()=> pop&&pop.classList.remove('active'));
    }
    const dens = qs('#ds-density');
    if(dens){ on(dens, 'click', ()=>{ const next = getDensity()==='compact'?'comfortable':'compact'; setDensity(next); }); }

    const search = qs('#ds-global-search');
    if(search){ on(search, 'keydown', (e)=>{ if(e.key==='Enter'){ const q=search.value.trim(); if(!q) return; // navigate to listing with query param
                const target = 'NC Listing Page.html?q='+encodeURIComponent(q);
                if(window.location.pathname.endsWith('NC Listing Page.html')){ // if already on listing, set input
                  try{ if(typeof window.__globalSearch === 'function'){ window.__globalSearch(q); } else { location.href = target; } }catch(_){ location.href = target; }
                } else { location.href = target; }
              } }); }

    // Command palette: Ctrl+K
    const palette = el(`
      <div id="ds-cmd-palette" style="position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:60;pointer-events:none">
        <div style="width:min(720px,90%);pointer-events:auto;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:12px;padding:12px;box-shadow:var(--shadow-lg)">
          <input id="ds-cmd-input" placeholder="Type a command or search... (e.g. Create New 8D, Go to D1)" style="width:100%;padding:0.7rem;border-radius:8px;border:1px solid var(--gray-300);font-size:1rem" />
          <div id="ds-cmd-results" style="margin-top:8px;max-height:240px;overflow:auto"></div>
        </div>
      </div>
    `);
    document.body.appendChild(palette);
    const cmdInput = qs('#ds-cmd-input'); const cmdHost = qs('#ds-cmd-results');
    function openPalette(q='') { palette.style.display='flex'; cmdInput.value=q; cmdInput.focus(); renderCmdResults(''); }
    function closePalette(){ palette.style.display='none'; cmdHost.innerHTML=''; }
    function renderCmdResults(filter){ const cmds = [
        {id:'new8d',label:'Create New 8D',action:()=> location.href='8D Pages/8D View page.html#d1'},
        {id:'nc-list',label:'Open NC Listing',action:()=> location.href='NC Listing Page.html'},
        {id:'nc-create',label:'Create NC',action:()=> location.href='NC Creation and Edit Page.html'},
        {id:'goto-d1',label:'Go to D1 - Identify Team',action:()=> location.hash='#d1'},
        {id:'goto-d2',label:'Go to D2 - Problem Description',action:()=> location.hash='#d2'},
        {id:'focus-search',label:'Focus Global Search',action:()=> { const s=qs('#ds-global-search'); if(s){ s.focus(); }}},
        {id:'save-all',label:'Save All (Autosave)',action:()=>{ if(typeof window.app !== 'undefined') window.app.saveData('command-save-all'); if(typeof window.__saveAll==='function') window.__saveAll(); }}
      ];
      const out = cmds.filter(c=> c.label.toLowerCase().includes(filter.toLowerCase())).map(c=>`<div class="p-2 cursor-pointer hover:bg-white/60" data-cmd="${c.id}">${c.label}</div>`).join('');
      cmdHost.innerHTML = out || '<div class="p-2 text-sm text-gray-500">No matches</div>';
      // wire clicks
      cmdHost.querySelectorAll('[data-cmd]').forEach(el=> el.addEventListener('click', ()=>{ const id=el.dataset.cmd; const cmd = cmds.find(c=>c.id===id); if(cmd) cmd.action(); closePalette(); }));
    }
    on(cmdInput,'input', (e)=> renderCmdResults(e.target.value));
    // keyboard shortcuts
    on(document,'keydown', (e)=>{
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openPalette(); }
      if(e.key === '/' && (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')){ e.preventDefault(); const s = qs('#ds-global-search'); if(s){ s.focus(); } }
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); if(typeof window.app !== 'undefined') window.app.saveData('keyboard-save'); if(typeof window.__saveAll==='function') window.__saveAll(); const ind = qs('#autosave-indicator'); if(ind) ind.textContent='Saved'; }
      if(e.key === 'Escape'){ if(palette.style.display==='flex') closePalette(); }
    });
    on(palette,'click', (ev)=>{ if(ev.target === palette) closePalette(); });

  }

  function enhanceAccessibility(){
    // Skip link
    if(!document.getElementById('ds-skip-link')){
      const a = document.createElement('a');
      a.id='ds-skip-link'; a.href='#page-content'; a.textContent='Skip to content';
      a.style.position='absolute'; a.style.left='8px'; a.style.top='8px'; a.style.padding='8px'; a.style.background='#fff'; a.style.border='1px solid var(--gray-200)'; a.style.borderRadius='6px'; a.style.zIndex=9999; a.className='ds-hidden';
      a.addEventListener('focus', ()=>{ a.classList.remove('ds-hidden'); }); a.addEventListener('blur', ()=>{ a.classList.add('ds-hidden'); });
      document.body.insertBefore(a, document.body.firstChild);
    }
    // Icon-only buttons: add aria-label if missing
    document.querySelectorAll('button, a').forEach(el=>{
      const onlyIcon = el.childElementCount===1 && el.firstElementChild && el.firstElementChild.matches && el.firstElementChild.matches('[data-lucide]');
      const hasText = (el.textContent||'').trim().length>0;
      if(onlyIcon && !hasText){
        if(!el.getAttribute('aria-label')){
          const tt = el.getAttribute('title') || el.dataset.tooltip || el.getAttribute('aria-labelledby');
          const label = tt || 'Action';
          el.setAttribute('aria-label', label);
        }
        el.setAttribute('tabindex', el.getAttribute('tabindex')||'0');
      }
    });
    // Keyboard focus indicator
    document.body.addEventListener('keydown', (e)=>{ if(e.key==='Tab') document.documentElement.classList.add('using-keyboard'); });
  }

  function init(){
    // Apply persisted density
    setDensity(getDensity());

    // Build or enhance header
    const enhanced = maybeEnhanceExistingHeader();
    if(!enhanced){ document.body.insertBefore(buildHeader(), document.body.firstChild); }

    applyBranding();
    ensureLucide().then(()=>{ if(window.lucide && window.lucide.createIcons){ window.lucide.createIcons(); } });
    wireInteractions();
    enhanceAccessibility();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
