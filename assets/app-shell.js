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
    if(search){ on(search, 'keydown', (e)=>{ if(e.key==='Enter'){ const q=search.value.trim(); if(typeof window.__globalSearch==='function'){ window.__globalSearch(q); } else { const h = location.pathname.includes('NC')? 'NC Listing Page.html' : 'index.html'; location.href = h; } } }); }
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
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
