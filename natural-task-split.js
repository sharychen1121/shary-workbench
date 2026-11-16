(()=>{"use strict";
const KEY="shiguang.workspace.v1",esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function splitText(raw){
 let s=String(raw||"").trim().replace(/[。！？!?；;]+/g,"、").replace(/^(?:我)?(?:今天|今日)(?:要|想|准备|计划|安排|需要)?/,"").replace(/^(?:我)?(?:要|想|准备|计划|安排|需要)/,"").trim();
 s=s.replace(/\s*(?:然后|接着|并且|以及|还有|同时|再去|再|和|并|、|，|,|\+|\band\b)\s*/gi,"、");
 return [...new Set(s.split("、").map(x=>x.trim().replace(/^(?:去|做一下|完成一下)\s*/,"去").replace(/^(?:去去)/,"去")).filter(x=>x.length>0))];
}
function attach(){
 const root=document.querySelector("#view-root");if(!root||!location.hash.startsWith("#daily"))return;
 const heading=root.querySelector(".heading");if(!heading||root.querySelector("#natural-task-box"))return;
 const box=document.createElement("section");box.id="natural-task-box";box.className="card";box.style.cssText="margin:0 0 18px;padding:18px";
 box.innerHTML='<div class="card-head"><div><h2>一句话拆分任务</h2><p>输入今天要做的事，系统会拆成任务供你确认。</p></div></div><div style="display:flex;gap:10px;flex-wrap:wrap"><textarea id="natural-task-input" class="review-text" style="min-height:56px;flex:1;min-width:240px" placeholder="例如：今天要去健身和学习"></textarea><button class="btn primary" id="natural-task-split">拆分任务</button></div><div id="natural-task-preview"></div>';
 heading.insertAdjacentElement("afterend",box);
 box.querySelector("#natural-task-split").addEventListener("click",()=>{
  const tasks=splitText(box.querySelector("#natural-task-input").value),preview=box.querySelector("#natural-task-preview");
  if(!tasks.length){preview.innerHTML='<p class="row-sub">请先输入要做的事情。</p>';return;}
  preview.innerHTML='<p class="row-sub">识别到 '+tasks.length+' 项，可修改后保存：</p><div>'+tasks.map((t,i)=>'<label style="display:flex;align-items:center;gap:8px;margin:8px 0"><input type="checkbox" checked data-natural-check="'+i+'"><input class="text-input" data-natural-title="'+i+'" value="'+esc(t)+'" style="flex:1"></label>').join("")+'</div><button class="btn primary" id="natural-task-save">保存为今日任务</button>';
  preview.querySelector("#natural-task-save").addEventListener("click",()=>{
   let d;try{d=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
   if(!d||!Array.isArray(d.tasks)){preview.insertAdjacentHTML("afterbegin",'<p class="row-sub">未能读取工作台任务数据，请刷新页面后重试。</p>');return;}
   const day=new Date(),date=day.getFullYear()+"-"+String(day.getMonth()+1).padStart(2,"0")+"-"+String(day.getDate()).padStart(2,"0"),now=Date.now();
   const selected=[...preview.querySelectorAll("[data-natural-check]:checked")].map(c=>preview.querySelector('[data-natural-title="'+c.dataset.naturalCheck+'"]').value.trim()).filter(Boolean);
   if(!selected.length){preview.insertAdjacentHTML("afterbegin",'<p class="row-sub">请至少勾选一项任务。</p>');return;}
   selected.forEach((title,i)=>d.tasks.push({id:Math.random().toString(36).slice(2,9)+now.toString(36).slice(-4)+i,title,note:"",projectId:"",start:date,due:date,priority:"中",status:"未开始",tags:"",created:now+i}));
   localStorage.setItem(KEY,JSON.stringify(d));location.reload();
  });
 });
}
const mo=new MutationObserver(attach);mo.observe(document.documentElement,{childList:true,subtree:true});attach();
})();