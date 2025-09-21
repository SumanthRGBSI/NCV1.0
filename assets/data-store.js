(function(){
  // Lightweight key-value store with optional Supabase backend
  const g = (typeof window!=='undefined')? window : globalThis;

  const U = {
    onceScript(src){ return new Promise((res,rej)=>{ if(document.querySelector(`script[src="${src}"]`)) return res(); const s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); },
    readMeta(name){ const m=document.querySelector(`meta[name="${name}"]`); return m? m.content: undefined; },
    readDataAttr(key){ try{ return document.body?.dataset?.[key] || undefined; }catch(_){ return undefined; }
    },
    safeJson(v){ try{ return JSON.parse(v); }catch(_){ return null; } },
  };

  const LocalAdapter = {
    name:'local',
    async init(){ return true; },
    async get(key){ const raw = localStorage.getItem(key); return raw? U.safeJson(raw) : null; },
    async set(key, value){ localStorage.setItem(key, JSON.stringify(value)); return true; },
    async remove(key){ localStorage.removeItem(key); return true; },
    async list(prefix){ const out=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!prefix || (k && k.startsWith(prefix))) out.push(k); } return out; },
    subscribe(){ return ()=>{}; }
  };

  function SupabaseAdapter(cfg){
    let client = null; let realtime = null; const table = cfg.table || 'kv_store';
    return {
      name:'supabase',
      async init(){
        // Load supabase-js v2 UMD
        await U.onceScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        if(!g.supabase || !g.supabase.createClient) throw new Error('Supabase SDK missing');
        client = g.supabase.createClient(cfg.url, cfg.key);
        return true;
      },
      async get(key){
        try{
          const { data, error } = await client.from(table).select('value').eq('key', key).single();
          if(error && error.code !== 'PGRST116') throw error; // not found allowed
          if(data && data.value!=null) return data.value;
          return null;
        }catch(_){ return null; }
      },
      async set(key, value){
        const payload = { key, value, updated_at: new Date().toISOString() };
        const { error } = await client.from(table).upsert(payload, { onConflict:'key' });
        if(error) throw error; return true;
      },
      async remove(key){ const { error } = await client.from(table).delete().eq('key', key); if(error) throw error; return true; },
      async list(prefix){ const { data, error } = await client.from(table).select('key'); if(error) throw error; return (data||[]).map(r=>r.key).filter(k=> !prefix || k.startsWith(prefix)); },
      subscribe(key, cb){
        try{
          // requires Realtime enabled
          const channel = client.channel(`kv_${key}`).on('postgres_changes', { event:'*', schema:'public', table, filter:`key=eq.${key}` }, (payload)=>{
            if(payload?.new && Object.prototype.hasOwnProperty.call(payload.new, 'value')) cb(payload.new.value);
          }).subscribe();
          return ()=>{ try{ client.removeChannel(channel); }catch(_){ } };
        }catch(_){ return ()=>{}; }
      }
    };
  }

  const DataStore = {
    _adapter: LocalAdapter,
    _ready: false,
    _readyP: null,
    get isReady(){ return this._ready; },
    get ready(){ return this._readyP || Promise.resolve(); },

    async init(config){
      if(this._readyP) return this._readyP; // idempotent
      const cfg = config || this._autoDetectConfig();
      const useSupabase = cfg && cfg.provider==='supabase' && cfg.supabase && cfg.supabase.url && cfg.supabase.key;
      const adapter = useSupabase? SupabaseAdapter({ url: cfg.supabase.url, key: cfg.supabase.key, table: cfg.supabase.table||'kv_store' }) : LocalAdapter;
      this._adapter = adapter;
      this._readyP = adapter.init().then(()=>{ this._ready=true; }).catch(()=>{ this._adapter = LocalAdapter; this._ready=true; });
      return this._readyP;
    },

    _autoDetectConfig(){
      // window.__datastore = { provider:'supabase', supabase:{ url, key, table } }
      if(g.__datastore) return g.__datastore;
      const url = U.readMeta('supabase-url') || U.readDataAttr('supabaseUrl');
      const key = U.readMeta('supabase-key') || U.readDataAttr('supabaseKey');
      if(url && key) return { provider:'supabase', supabase:{ url, key } };
      return { provider:'local' };
    },

    async get(key){ try{ await this.init(); return this._adapter.get(key); }catch(_){ return null; } },
    async set(key, value){ try{ await this.init(); return this._adapter.set(key, value); }catch(_){ return false; } },
    async remove(key){ try{ await this.init(); return this._adapter.remove(key); }catch(_){ return false; } },
    async list(prefix){ try{ await this.init(); return this._adapter.list(prefix); }catch(_){ return []; } },
    subscribe(key, cb){ try{ return this._adapter.subscribe(key, cb); }catch(_){ return ()=>{}; } },
  };

  g.DataStore = DataStore;
})();
