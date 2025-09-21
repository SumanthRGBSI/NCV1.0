// Shared behaviors for D1-D8 embedded forms
(function(){
  function qs(sel, ctx=document){return ctx.querySelector(sel)}
  function qsa(sel, ctx=document){return Array.from((ctx||document).querySelectorAll(sel))}

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
        const preview = e.target.closest('.file-block').querySelector('.file-preview');
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

  // Add member quick-add for D1 if present
  function initD1QuickAdd(container){
    const add = qs('#d1-add-member-btn', container);
    if(!add) return;
    add.addEventListener('click', ()=>{
      const input = qs('#d1-new-member', container);
      const list = qs('#d1-members-list', container);
      if(input && input.value.trim()){
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<div class="kv">${input.value.trim()}</div><button type="button" class="btn btn-ghost remove-member">Remove</button>`;
        list.appendChild(div);
        input.value='';
      }
    });
    // delegate remove
    list && list.addEventListener('click', (e)=>{
      if(e.target.closest('.remove-member')) e.target.closest('.list-item').remove();
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    initDynamicTables(document);
    initFilePreviews(document);
    initD1QuickAdd(document);
  });

  // Also re-init when content is injected
  window.__init8D = function(container){
    initDynamicTables(container||document);
    initFilePreviews(container||document);
    initD1QuickAdd(container||document);
  }
})();
