(function () {
  "use strict";
  const START = "2026-11-16";
  const END = "2027-02-07";
  const DECEMBER = "2026-12-31";
  const DAY_NAMES = ["周日","周一","周二","周三","周四","周五","周六"];
  const DAY_TITLES = ["主动恢复","臀腿A｜臀大肌","有氧｜跑步机快走","背肩＋单车","有氧｜舒适快走","臀腿B｜臀形","长时间有氧＋拉伸"];
  const CARDIO = [
    [0,20,30,20,30,20,50],
    [0,25,35,25,35,25,55],
    [0,30,40,30,40,30,60],
    [0,35,45,35,45,35,60],
    [0,35,50,40,50,35,60],
    [0,35,50,40,50,35,60],
    [0,35,45,35,45,35,55],
    [0,35,45,35,45,35,55],
    [0,35,45,35,45,35,55],
    [0,35,45,35,45,35,55],
    [0,35,45,35,45,35,55],
    [0,30,40,30,40,30,50]
  ];
  let selectedDay = "";
  const pad = n => String(n).padStart(2, "0");
  const parse = d => new Date(d + "T12:00:00Z");
  const iso = d => d.toISOString().slice(0,10);
  const add = (d, n) => { const x=parse(d);x.setUTCDate(x.getUTCDate()+n);return iso(x);};
  const diff = (a, b) => Math.round((parse(a).getTime()-parse(b).getTime())/86400000);
  const wd = d => parse(d).getUTCDay();
  const today = () => {const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());};
  const bound = d => d<START?START:d>END?END:d;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const pct = (a,b) => b?Math.round(a/b*100):0;
  const fmt = d => d.slice(5,7)+"/"+d.slice(8,10);
  const yearWeek = d => Math.min(11,Math.max(0,Math.floor(diff(d,START)/7)));
  const weekName = w => w<2?"适应期 · 保持余力":w<5?"进阶期 · 稳步增加":w===5?"巩固期 · 稳定执行":w===6?"年底过渡期":w<11?"持续塑形期":"复盘与恢复周";
  function ensure(s) {
    if(!s || typeof s!=="object") return {checks:{},metrics:{},goalWeight:"",startWeight:""};
    if(!s.checks || typeof s.checks!=="object")s.checks={};
    if(!s.metrics || typeof s.metrics!=="object")s.metrics={};
    return s;
  }
  function item(id,title,detail,type,min) {return {id,title,detail,type,min:min||0};}
  function dayPlan(day) {
    const w=yearWeek(day), dn=wd(day), beginner=w<2;
    const sets=beginner?"2组":"3组";
    const small=beginner?"1–2组":"2组";
    const mins=CARDIO[w][dn];
    const warm=item("warm","运动前热身","轻松活动5分钟＋动态活动3–5分钟","热身",8);
    const cool=item("cool","整理与舒缓","减速、补水、轻柔放松5–8分钟","恢复",7);
    let tasks=[];
    if(dn===1) tasks=[
      warm,item("hip","臀推／臀推机",sets+" × 8–12次，顶部收臀，不要过度挺腰","力量"),
      item("rdl","哑铃罗马尼亚硬拉",small+" × 8–10次，髋部向后推，背部稳定","力量"),
      item("lunge","反向弓步蹲",small+" × 8–10次/侧，可替换分腿蹲","力量"),
      item("abduct","坐姿髋外展",small+" × 15–20次，可替换绳索髋外展","力量"),
      item("cardio","椭圆机中等强度",mins+"分钟，以能完整说话为准","有氧",mins),cool
    ];
    if(dn===2) tasks=[
      warm,item("cardio","跑步机快走",mins+"分钟（含开头/结尾的轻松行走），不必使用高坡度","有氧",mins),
      item("mobility","髋、脚踝与肩颈舒展","轻松活动5–10分钟；酸痛明显则减量","恢复"),cool
    ];
    if(dn===3) tasks=[
      warm,item("pulldown","高位下拉",sets+" × 10–12次，可换辅助引体向上","力量"),
      item("row","坐姿／胸托划船",small+" × 10–12次，躯干保持稳定","力量"),
      item("press","器械推胸",small+" × 10–12次，可换上斜俯卧撑","力量"),
      item("face","绳索面拉／反向飞鸟",small+" × 12–15次","力量"),
      item("cardio","自行车或椭圆机",mins+"分钟，中等强度","有氧",mins),cool
    ];
    if(dn===4) tasks=[
      warm,item("cardio","快走／椭圆机",mins+"分钟，呼吸加快但能讲话","有氧",mins),
      item("core","核心与活动度","死虫式2组×10次/侧＋肩髋活动","恢复"),cool
    ];
    if(dn===5) tasks=[
      warm,item("squat","史密斯深蹲／腿举",sets+" × 8–12次，先熟悉轨迹","力量"),
      item("backext","45°背伸／绳索臀后拉",small+" × 10–12次，臀部主导发力","力量"),
      item("step","台阶踏步／反向弓步",small+" × 8–10次/侧","力量"),
      item("abduct","坐姿髋外展",small+" × 15–20次","力量"),
      item("cardio","椭圆机或单车",mins+"分钟，舒适中等强度","有氧",mins),cool
    ];
    if(dn===6) tasks=[
      warm,item("cardio","组合有氧",mins+"分钟；可将快走、椭圆机、单车分为2–3段完成","有氧",mins),
      item("stretch","全身舒展","肩、胸椎、髋及腿部活动度10–15分钟","恢复"),cool
    ];
    if(dn===0) tasks=[
      item("rest","主动恢复或休息","今天不安排正式强度训练；可轻松散步，保证睡眠","恢复")
    ];
    return {tasks,w,dn,mins,title:DAY_TITLES[dn],day};
  }
  function calc(state,rangeStart,rangeEnd) {
    let all=0,done=0,trained=0,totalDays=0;
    for(let d=rangeStart;d<=rangeEnd;d=add(d,1)) {
      totalDays++;
      const tasks=dayPlan(d).tasks, checked=(state.checks[d]||[]);
      all+=tasks.length;
      const nd=tasks.filter(t=>checked.includes(t.id)).length;
      done+=nd;
      if(nd===tasks.length)trained++;
    }
    return {all,done,trained,totalDays,percent:pct(done,all)};
  }
  function latestWeight(state) {
    const ks=Object.keys(state.metrics).filter(k=>k<=today()&&Number(state.metrics[k]?.weight)>0).sort();
    return ks.length?{day:ks[ks.length-1],value:Number(state.metrics[ks[ks.length-1]].weight)}:null;
  }
  function progressHtml(value) {
    return '<div class="fit-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'"><span style="width:'+value+'%"></span></div>';
  }
  function renderChecks(tasks,day,state,compact) {
    const checked=state.checks[day]||[];
    const locked=day>today();
    return '<div class="fit-items'+(compact?" compact":"")+'">'+tasks.map(t=>
      '<label class="fit-item'+(checked.includes(t.id)?" is-done":"")+'"><input type="checkbox" data-fit-check="1" data-fit-day="'+day+'" data-fit-task="'+t.id+'" '+(checked.includes(t.id)?"checked":"")+(locked?" disabled title=\"不能提前打卡\"":"")+'><span class="fit-item-content"><span class="fit-item-top"><strong>'+esc(t.title)+'</strong><em>'+esc(t.type)+'</em></span><small>'+esc(t.detail)+'</small></span></label>'
    ).join("")+'</div>';
  }
  function weekDays(day) {
    const start=add(day,-((wd(day)+6)%7));
    return Array.from({length:7},(_,i)=>add(start,i)).filter(d=>d>=START&&d<=END);
  }
  function summary(s, current, view) {
    const state=ensure(s), todayDay=bound(today()), p=dayPlan(todayDay), cs=state.checks[todayDay]||[], num=p.tasks.filter(t=>cs.includes(t.id)).length;
    const weekly=calc(state,weekDays(todayDay)[0],weekDays(todayDay).slice(-1)[0]);
    const mini = view==="home";
    return '<section class="fit-summary" aria-label="健身计划速览"><div class="fit-summary-header"><div><span class="fit-kicker">FITNESS · 有氧优先</span><h2>🏃 今日运动 · '+esc(p.title)+'</h2><p>训练目标：温和减脂、保留臀部力量 · 第'+(p.w+1)+'/12周</p></div><button class="btn primary" data-view="fitness">打开训练计划 →</button></div>'+
    '<div class="fit-mini-grid"><div><small>今日完成</small><strong>'+num+' / '+p.tasks.length+'</strong>'+progressHtml(pct(num,p.tasks.length))+'</div><div><small>本周任务进度</small><strong>'+weekly.percent+'%</strong>'+progressHtml(weekly.percent)+'</div><div><small>本周有氧参考</small><strong>'+CARDIO[p.w].reduce((a,b)=>a+b,0)+' 分钟</strong><small>按状态调整，不强求</small></div></div>'+
    (mini?'<div class="fit-summary-teaser">'+p.tasks.slice(0,3).map(t=>'<span>· '+esc(t.title)+'</span>').join("")+'</div>':renderChecks(p.tasks,todayDay,state,true))+'</section>';
  }
  function page(s) {
    const state=ensure(s); selectedDay=selectedDay?bound(selectedDay):bound(today());
    const p=dayPlan(selectedDay), dailyChecks=state.checks[selectedDay]||[];
    const dayDone=p.tasks.filter(t=>dailyChecks.includes(t.id)).length;
    const all=calc(state,START,END);
    const range=weekDays(selectedDay), week=calc(state,range[0],range[range.length-1]);
    const weekMinutes=CARDIO[p.w].reduce((a,b)=>a+b,0);
    const last=latestWeight(state);
    const target=Number(state.goalWeight), initial=Number(state.startWeight);
    let weightText='设置起始体重和目标体重后展示进度';
    if(last) weightText='最近记录 '+last.value.toFixed(1)+' kg（'+fmt(last.day)+'）';
    let weightGoal = '';
    if(target>0&&last) weightGoal=' · 距目标 '+(last.value-target).toFixed(1)+' kg';
    const future=selectedDay>today();
    return '<div class="fit-main">'+
      '<section class="fit-hero"><div><span class="fit-kicker">2026.11.16 — 2027.02.07 · 12 WEEKS</span><h2>有氧减脂 × 臀部保肌</h2><p>12月31日为阶段复盘节点；135斤只作为可调整的个人参考目标，不通过过量运动强行达成。</p></div><div class="fit-hero-badge">第 <b>'+(p.w+1)+'</b> / 12 周<small>'+esc(weekName(p.w))+'</small></div></section>'+
      '<section class="fit-metrics-grid"><div class="fit-metric"><span>今日任务</span><b>'+pct(dayDone,p.tasks.length)+'%</b>'+progressHtml(pct(dayDone,p.tasks.length))+'<small>'+dayDone+' / '+p.tasks.length+' 项已完成</small></div>'+
      '<div class="fit-metric"><span>本周完成</span><b>'+week.percent+'%</b>'+progressHtml(week.percent)+'<small>'+week.done+' / '+week.all+' 项</small></div>'+
      '<div class="fit-metric"><span>12周总进度</span><b>'+all.percent+'%</b>'+progressHtml(all.percent)+'<small>'+all.trained+' / '+all.totalDays+' 天全部打卡</small></div>'+
      '<div class="fit-metric"><span>本周有氧参考</span><b>'+weekMinutes+'<i>分钟</i></b><small>训练强度以恢复状态为准</small></div></section>'+
      '<section class="fit-card"><div class="fit-card-heading"><div><h3>📅 每日运动任务</h3><p>可切换日期，完成后勾选；打卡会保存在本浏览器并包含于工作台备份中。</p></div><button class="btn" data-fit-action="today">回到今天</button></div>'+
      '<div class="fit-week-strip">'+range.map(d=>{const x=dayPlan(d),done=(state.checks[d]||[]).filter(k=>x.tasks.some(t=>t.id===k)).length;return '<button class="fit-day'+(d===selectedDay?" active":"")+(d===today()?" is-today":"")+'" data-fit-action="day" data-fit-day="'+d+'"><span>'+DAY_NAMES[wd(d)]+'</span><b>'+d.slice(-2)+'</b><small>'+done+'/'+x.tasks.length+'</small></button>';}).join("")+'</div>'+
      '<div class="fit-day-title"><div><span class="fit-kicker">'+selectedDay+' · '+esc(weekName(p.w))+'</span><h3>'+esc(p.title)+'</h3><p>'+(p.dn===0?"休息也是计划的一部分。":'有氧 '+p.mins+' 分钟 · 先热身；力量日先力量、再有氧。')+(future?' · 尚未到打卡日期':'')+'</p></div><div class="fit-day-nav"><button data-fit-action="prev" '+(selectedDay===START?"disabled":"")+' aria-label="前一天">‹</button><button data-fit-action="next" '+(selectedDay===END?"disabled":"")+' aria-label="后一天">›</button></div></div>'+
      renderChecks(p.tasks,selectedDay,state,false)+'</section>'+
      '<section class="fit-two-col"><div class="fit-card"><h3>⚖️ 体重与围度记录</h3><p class="fit-help">仅保存在你当前浏览器，不写入公开网站代码。用周平均体重观察趋势，避免因单日波动焦虑。</p>'+
      '<div class="fit-fields"><label>起始体重（kg）<input type="number" step="0.1" min="30" max="300" id="fit-start" value="'+esc(state.startWeight||"")+'" placeholder="自行填写"></label><label>目标体重（kg）<input type="number" step="0.1" min="30" max="300" id="fit-target" value="'+esc(state.goalWeight||"")+'" placeholder="自行填写"></label><label>当天体重（kg）<input type="number" step="0.1" min="30" max="300" id="fit-weight" value="'+esc((state.metrics[selectedDay]||{}).weight||"")+'" placeholder="可选"></label><label>当天腰围（cm）<input type="number" step="0.1" min="30" max="200" id="fit-waist" value="'+esc((state.metrics[selectedDay]||{}).waist||"")+'" placeholder="每两周记录"></label><label>当天臀围（cm）<input type="number" step="0.1" min="30" max="200" id="fit-hip" value="'+esc((state.metrics[selectedDay]||{}).hip||"")+'" placeholder="每两周记录"></label></div>'+
      '<button class="btn primary" data-fit-action="save-metrics">保存这一天的数据</button><p class="fit-help">'+esc(weightText+weightGoal)+'</p></div>'+
      '<div class="fit-card"><h3>📈 12月底阶段目标</h3><p class="fit-help">12月31日先看体重趋势、腰围变化、臀腿力量和恢复状态。体重目标是参考，不是必须实现的期限。</p>'+
      '<div class="fit-stage"><div><b>第1–2周</b><span>动作适应，每个力量动作先做1–2组</span></div><div><b>第3–6周</b><span>逐步增加有氧，力量日维持技术与渐进负荷</span></div><div><b>12月31日</b><span>阶段记录：周均体重、腰围、臀围与疲劳感</span></div><div><b>第8–12周</b><span>继续中等强度有氧，保留每周3天简化力量训练</span></div></div>'+
      '<div class="fit-note">提示：出现疼痛、头晕、持续疲劳或月经异常时，暂停增加训练量并寻求专业评估。</div></div></section>'+
      '<section class="fit-card"><h3>🗓️ 12周运动路线</h3><div class="fit-week-list">'+CARDIO.map((arr,i)=>{const weekDate=add(START,7*i),end=add(weekDate,6),w=calc(state,weekDate,end);return '<button class="fit-week-row" data-fit-action="day" data-fit-day="'+weekDate+'"><span><b>第'+(i+1)+'周</b><small>'+fmt(weekDate)+'—'+fmt(end)+' · '+esc(weekName(i))+'</small></span><span class="fit-week-target">'+arr.reduce((a,b)=>a+b,0)+'分钟有氧</span><span class="fit-week-percent">'+w.percent+'%</span></button>';}).join("")+'</div></section>'+
      '<p class="fit-footer">数据不会自动跨设备同步。可在工作台的「数据备份」导出备份，再在另一设备导入；导入前请先备份目标设备的数据。</p></div>';
  }
  function action(type,el,data,save,render,toast) {
    const state=ensure(data.fitness);data.fitness=state;
    if(type==="today") {selectedDay=bound(today());render();return;}
    if(type==="day") {selectedDay=bound(el.dataset.fitDay||today());render();return;}
    if(type==="prev"||type==="next") {selectedDay=bound(add(selectedDay||bound(today()),type==="prev"?-1:1));render();return;}
    if(type==="save-metrics") {
      const pick=(id,lo,hi)=>{const v=document.querySelector(id)?.value.trim();if(!v)return "";const n=Number(v);if(!Number.isFinite(n)||n<lo||n>hi)throw new Error("请填写合理的体重/围度数值");return n;};
      try {
        const start=pick("#fit-start",30,300),target=pick("#fit-target",30,300);
        const weight=pick("#fit-weight",30,300),waist=pick("#fit-waist",30,200),hip=pick("#fit-hip",30,200);
        state.startWeight=start;state.goalWeight=target;
        if(weight||waist||hip)state.metrics[selectedDay]={...(state.metrics[selectedDay]||{}),weight:weight||undefined,waist:waist||undefined,hip:hip||undefined};
        else delete state.metrics[selectedDay];
        save();render();toast("体重与围度记录已保存");
      }catch(err){toast(err.message||"请检查输入数据");}
    }
  }
  function toggle(el,data,save,render) {
    const date=el.dataset.fitDay, taskId=el.dataset.fitTask;
    if(date>today()||date<START||date>END)return;
    const tasks=dayPlan(date).tasks;
    if(!tasks.some(t=>t.id===taskId))return;
    const state=ensure(data.fitness);data.fitness=state;
    if(!Array.isArray(state.checks[date]))state.checks[date]=[];
    const checked=state.checks[date],i=checked.indexOf(taskId);
    if(el.checked&&i<0)checked.push(taskId);
    if(!el.checked&&i>=0)checked.splice(i,1);
    save();render();
  }
  window.SharyFitness={ensure,page,summary,action,toggle};
})();