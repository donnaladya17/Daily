(function(){
'use strict';
var $ = function(s){ return document.querySelector(s); };
var pad = function(n){ return String(n).padStart(2,'0'); };
var ymd = function(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
function dayStr(n){ var t=new Date(); return ymd(new Date(t.getFullYear(),t.getMonth(),t.getDate()+n)); }
function fmtShort(s){ var p=s.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]).toLocaleDateString('id-ID',{day:'numeric',month:'short'}); }
function rupiah(n){ return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n); }
function uid(){ return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

function el(tag, props){
  var n=document.createElement(tag);
  if(props){ Object.keys(props).forEach(function(k){
    var v=props[k]; if(v==null||v===false) return;
    if(k==='class') n.className=v;
    else if(k==='text') n.textContent=v;
    else if(k.indexOf('on')===0) n.addEventListener(k.slice(2),v);
    else if(v===true) n.setAttribute(k,'');
    else n.setAttribute(k,v);
  }); }
  for(var i=2;i<arguments.length;i++){
    var kids=[].concat(arguments[i]);
    kids.forEach(function(c){ if(c==null||c===false) return; n.append(c.nodeType?c:document.createTextNode(String(c))); });
  }
  return n;
}

var LS_KEY='harianku-v1';
var VIEWS=['tugas','uang','kebiasaan'];
var state=null, ready=false;

/* ---------- Data contoh ---------- */
function sampleState(){
  var t=new Date();
  var md=function(day){ return ymd(new Date(t.getFullYear(),t.getMonth(),Math.min(day,t.getDate()))); };
  var log=function(arr){ var o={}; arr.forEach(function(v,i){ if(v) o[dayStr(-i)]=1; }); return o; };
  var tx=function(type,amount,cat,note,date){ return {id:uid(),type:type,amount:amount,cat:cat,note:note,date:date,ex:true}; };
  return {
    v:1, sample:true, budget:3000000,
    tasks:[
      {id:uid(),text:'Bayar tagihan listrik',done:false,due:dayStr(0),prio:1,ex:true},
      {id:uid(),text:'Isi ulang saldo e-toll',done:false,due:dayStr(-1),prio:2,ex:true},
      {id:uid(),text:'Beli sayur dan buah di pasar',done:false,due:dayStr(1),prio:2,ex:true},
      {id:uid(),text:'Balas pesan grup keluarga',done:true,due:dayStr(0),prio:3,ex:true}
    ],
    expenses:[
      tx('in',5500000,'Pemasukan','Gaji bulanan',md(1)),
      tx('out',350000,'Tagihan','Internet rumah',md(2)),
      tx('out',420000,'Belanja harian','Belanja mingguan',md(5)),
      tx('out',50000,'Transportasi','Isi bensin',md(8)),
      tx('out',90000,'Hiburan','Nonton bioskop',md(12)),
      tx('out',28000,'Makan & minum','Makan siang warteg',md(12)),
      tx('out',24000,'Makan & minum','Kopi pagi',dayStr(0))
    ],
    habits:[
      {id:uid(),name:'Minum air 8 gelas',log:log([0,1,1,1,0,1,1]),ex:true},
      {id:uid(),name:'Jalan kaki 20 menit',log:log([0,1,0,1,1,0,1]),ex:true},
      {id:uid(),name:'Baca 15 menit sebelum tidur',log:log([0,0,1,1,1,1,0]),ex:true}
    ]
  };
}
function normalize(o){
  if(!o||typeof o!=='object') return null;
  var s=Object.assign({v:1,sample:false,budget:0,tasks:[],expenses:[],habits:[]},o);
  ['tasks','expenses','habits'].forEach(function(k){ if(!Array.isArray(s[k])) s[k]=[]; });
  s.budget=+s.budget||0;
  return s;
}

/* ---------- Penyimpanan ---------- */
function lsRead(){ try{ var r=localStorage.getItem(LS_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } }
function lsWrite(s){ try{ localStorage.setItem(LS_KEY,JSON.stringify(s)); }catch(e){} }
function setStatus(t){ $('#syncNote').textContent=t; }
function okText(){ return 'Tersimpan di browser ini. Data tidak ikut pindah ke perangkat lain.'; }

var saveTimer=null, saving=false, again=false;
function save(){ clearTimeout(saveTimer); setStatus('Menyimpan…'); saveTimer=setTimeout(flush,400); }
function flush(){
  if(saving){ again=true; return; }
  saving=true;
  do{
    again=false;
    if(state.expenses.length>1500) state.expenses=state.expenses.slice(-1500);
    var snap=clone(state);
    lsWrite(snap);
    setStatus(okText());
  }while(again);
  saving=false;
}
function commit(){ save(); renderAll(); }

function boot(){
  renderHeader(); route();
  state=normalize(lsRead())||sampleState();
  ready=true;
  document.querySelectorAll('fieldset.bare').forEach(function(f){ f.disabled=false; });
  setStatus(state.sample?'':okText());
  renderAll();
}

/* ---------- Notifikasi ---------- */
var toastTimer=null;
function hideToast(){ $('#toast').hidden=true; }
function toast(msg,undo){
  var box=$('#toastBox');
  box.replaceChildren(el('span',{text:msg}), undo?el('button',{class:'linkbtn',type:'button',text:'Urungkan',onclick:function(){ undo(); hideToast(); }}):null);
  $('#toast').hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(hideToast,6000);
}

/* ---------- Tampilan umum ---------- */
function renderHeader(){
  var h=new Date().getHours();
  var s=h<11?'pagi':h<15?'siang':h<18?'sore':'malam';
  $('#greet').textContent='Selamat '+s;
  $('#date').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function renderLoading(){
  ['#taskList','#catList','#txList','#habitList'].forEach(function(s){ $(s).replaceChildren(el('p',{class:'loading',text:'Memuat data Anda…'})); });
}
function glanceRow(label,sub,val){
  return el('div',null, el('div',null, el('span',{class:'g-label',text:label}), el('span',{class:'g-sub',text:sub})), el('strong',{class:'g-val',text:val}));
}
function emptyState(title,body){ return el('div',{class:'empty'}, el('strong',{text:title}), el('p',{text:body})); }

function monthTx(){ var mk=dayStr(0).slice(0,7); return state.expenses.filter(function(e){ return e.date&&e.date.indexOf(mk)===0; }); }
function sum(arr,type){ return arr.filter(function(e){ return e.type===type; }).reduce(function(a,e){ return a+e.amount; },0); }
function streak(h){
  var i=h.log[dayStr(0)]?0:1, n=0;
  while(h.log[dayStr(-i)]){ n++; i++; if(i>400) break; }
  return n;
}

function renderGlance(){
  var open=state.tasks.filter(function(t){ return !t.done; });
  var urgent=open.filter(function(t){ return t.due&&t.due<=dayStr(0); }).length;
  var out=sum(monthTx(),'out');
  var hd=state.habits.filter(function(h){ return h.log[dayStr(0)]; }).length;
  var best=state.habits.reduce(function(m,h){ return Math.max(m,streak(h)); },0);
  var g=$('#glance');
  g.replaceChildren(
    glanceRow('Tugas', urgent?urgent+' jatuh tempo atau terlambat':'Tidak ada yang mendesak', open.length+' tersisa'),
    glanceRow('Pengeluaran bulan ini', state.budget>0?'Batas '+rupiah(state.budget):'Batas belum diisi', rupiah(out)),
    glanceRow('Kebiasaan hari ini', best?'Beruntun terpanjang '+best+' hari':'Mulai hari ini', hd+' dari '+state.habits.length)
  );
}

/* ---------- Tugas ---------- */
function duePill(t){
  if(!t.due) return null;
  var td=dayStr(0), label, cls='';
  if(t.done) label=fmtShort(t.due);
  else if(t.due<td){ label='Terlambat · '+fmtShort(t.due); cls='bad'; }
  else if(t.due===td){ label='Hari ini'; cls='acc'; }
  else if(t.due===dayStr(1)) label='Besok';
  else label=fmtShort(t.due);
  return el('span',{class:'pill '+cls,text:label});
}
function taskRow(t){
  return el('li',{class:t.done?'done':''},
    el('button',{class:'check',type:'button','aria-pressed':t.done?'true':'false','aria-label':(t.done?'Tandai belum selesai: ':'Tandai selesai: ')+t.text,onclick:function(){ t.done=!t.done; commit(); }}),
    el('div',{class:'t-body'},
      el('span',{class:'t-text',text:t.text}),
      el('div',{class:'t-meta'}, duePill(t), t.prio===1&&!t.done?el('span',{class:'pill warn',text:'Penting'}):null, t.ex?el('span',{class:'pill ex',text:'contoh'}):null)
    ),
    el('button',{class:'del',type:'button','aria-label':'Hapus tugas: '+t.text,text:'Hapus',onclick:function(){
      var i=state.tasks.indexOf(t); state.tasks.splice(i,1); commit();
      toast('Tugas dihapus',function(){ state.tasks.splice(i,0,t); commit(); });
    }})
  );
}
function renderTasks(){
  var box=$('#taskList'); box.replaceChildren();
  if(!state.tasks.length){ box.append(emptyState('Belum ada tugas','Tulis satu hal yang ingin diselesaikan di kolom atas, lalu beri tenggat kalau perlu.')); return; }
  var cmp=function(a,b){ var da=a.due||'9999', db=b.due||'9999'; return da<db?-1:da>db?1:(a.prio||2)-(b.prio||2); };
  var open=state.tasks.filter(function(t){ return !t.done; }).sort(cmp);
  var done=state.tasks.filter(function(t){ return t.done; });
  if(open.length){
    box.append(el('h2',{class:'sec'},'Perlu dikerjakan',el('span',{class:'count',text:open.length})), el('ul',{class:'list'},open.map(taskRow)));
  } else {
    box.append(emptyState('Semua beres','Tidak ada tugas yang menunggu. Tambahkan yang baru kapan saja.'));
  }
  if(done.length){
    box.append(
      el('h2',{class:'sec'},'Selesai',el('span',{class:'count',text:done.length}),
        el('button',{class:'linkbtn',type:'button',style:'margin-left:auto;font-size:14px',text:'Bersihkan',onclick:function(){
          var removed=done.slice(); state.tasks=state.tasks.filter(function(t){ return !t.done; }); commit();
          toast(removed.length+' tugas selesai dibersihkan',function(){ state.tasks=state.tasks.concat(removed); commit(); });
        }})),
      el('ul',{class:'list'},done.map(taskRow))
    );
  }
}

/* ---------- Keuangan ---------- */
function dateLabel(s){ return s===dayStr(0)?'Hari ini':s===dayStr(-1)?'Kemarin':fmtShort(s); }
function renderMoney(){
  var mt=monthTx(), inc=sum(mt,'in'), out=sum(mt,'out');
  $('#moneyGlance').replaceChildren(
    glanceRow('Pemasukan','Bulan ini',rupiah(inc)),
    glanceRow('Pengeluaran','Bulan ini',rupiah(out)),
    glanceRow('Selisih','Pemasukan dikurangi pengeluaran',rupiah(inc-out))
  );
  var b=state.budget, pct=b>0?out/b:0;
  var bar=$('#budgetBar'); bar.className='bar'+(pct>=1?' bad':pct>=0.75?' warn':'');
  bar.firstElementChild.style.width=Math.min(100,Math.round(pct*100))+'%';
  var inp=$('#budgetInput'); if(document.activeElement!==inp) inp.value=b>0?b:'';
  var now=new Date(), daysLeft=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate()+1, txt;
  if(b>0){
    var left=b-out;
    txt=left>=0 ? 'Terpakai '+Math.round(pct*100)+'%. Sisa '+rupiah(left)+', sekitar '+rupiah(Math.floor(left/daysLeft))+' per hari untuk '+daysLeft+' hari ke depan.'
                : 'Batas bulan ini sudah terlewati '+rupiah(-left)+'.';
  } else txt='Isi batas pengeluaran untuk melihat berapa yang boleh dipakai setiap hari.';
  $('#budgetText').textContent=txt;

  var cats={}; mt.filter(function(e){ return e.type==='out'; }).forEach(function(e){ cats[e.cat]=(cats[e.cat]||0)+e.amount; });
  var rows=Object.keys(cats).map(function(k){ return [k,cats[k]]; }).sort(function(a,b){ return b[1]-a[1]; });
  var cl=$('#catList'); cl.replaceChildren();
  if(!rows.length) cl.append(emptyState('Belum ada pengeluaran bulan ini','Catat pengeluaran pertama di atas, dan rinciannya muncul di sini.'));
  else { var mx=rows[0][1]; cl.append(el('div',{class:'cats'}, rows.map(function(r){
    return el('div',{class:'cat-row'}, el('span',{text:r[0]}), el('span',{class:'amt',text:rupiah(r[1])}), el('div',{class:'bar'},el('i',{style:'width:'+Math.max(3,Math.round(r[1]/mx*100))+'%'})));
  }))); }

  var tl=$('#txList'); tl.replaceChildren();
  var list=state.expenses.map(function(e,i){ return {e:e,i:i}; }).sort(function(a,b){ return a.e.date<b.e.date?1:a.e.date>b.e.date?-1:b.i-a.i; }).slice(0,20);
  if(!list.length){ tl.append(emptyState('Belum ada catatan','Pemasukan dan pengeluaran yang Anda catat tampil di sini.')); return; }
  tl.append(el('ul',{class:'list'}, list.map(function(x){
    var e=x.e;
    return el('li',null,
      el('div',{class:'t-body'}, el('span',{class:'t-text',text:e.note||e.cat}), el('span',{class:'tx-sub'},dateLabel(e.date)+' · '+e.cat, e.ex?' · contoh':'')),
      el('span',{class:'amt'+(e.type==='in'?' in':''),text:(e.type==='in'?'+ ':'')+rupiah(e.amount)}),
      el('button',{class:'del',type:'button','aria-label':'Hapus catatan: '+(e.note||e.cat),text:'Hapus',onclick:function(){
        var i=state.expenses.indexOf(e); state.expenses.splice(i,1); commit();
        toast('Catatan dihapus',function(){ state.expenses.splice(i,0,e); commit(); });
      }})
    );
  })));
}

/* ---------- Kebiasaan ---------- */
var DOW=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
function renderHabits(){
  var box=$('#habitList'); box.replaceChildren();
  if(!state.habits.length){ box.append(emptyState('Belum ada kebiasaan','Tambahkan satu kebiasaan kecil, lalu centang setiap hari Anda menjalankannya.')); return; }
  box.append(el('ul',{class:'list'}, state.habits.map(function(h){
    var week=[];
    for(var i=6;i>=0;i--){ (function(off){
      var ds=dayStr(off), p=ds.split('-').map(Number), on=!!h.log[ds];
      week.push(el('div',{class:'day'+(off===0?' today':'')}, el('span',{text:off===0?'Hari ini':DOW[new Date(p[0],p[1]-1,p[2]).getDay()]}),
        el('button',{type:'button','aria-pressed':on?'true':'false','aria-label':h.name+', '+dateLabel(ds)+(on?', sudah':', belum'),onclick:function(){
          if(h.log[ds]) delete h.log[ds]; else h.log[ds]=1; commit();
        }})));
    })(-i); }
    var n=streak(h), cnt=0; for(var k=0;k<7;k++){ if(h.log[dayStr(-k)]) cnt++; }
    return el('li',{class:'habit'},
      el('div',{class:'h-top'}, el('span',{class:'h-name',text:h.name}), el('span',{class:'h-streak'}, n?[el('b',{text:n}),' hari beruntun']:'Belum beruntun')),
      el('div',{class:'week'},week),
      el('div',{class:'h-foot'}, el('span',{text:cnt+' dari 7 hari terakhir'+(h.ex?' · contoh':'')}),
        el('button',{class:'del',type:'button','aria-label':'Hapus kebiasaan: '+h.name,text:'Hapus',onclick:function(){
          var i=state.habits.indexOf(h); state.habits.splice(i,1); commit();
          toast('Kebiasaan dihapus',function(){ state.habits.splice(i,0,h); commit(); });
        }}))
    );
  })));
}

function renderAll(){
  if(!ready) return;
  $('#sampleNote').hidden=!state.sample;
  renderGlance(); renderTasks(); renderMoney(); renderHabits();
}

/* ---------- Tab ---------- */
function route(){
  var h=(location.hash||'').slice(1);
  if(VIEWS.indexOf(h)<0) h='tugas';
  VIEWS.forEach(function(v){
    $('#view-'+v).hidden=(v!==h);
    $('#tab-'+v).setAttribute('aria-current',v===h?'page':'false');
  });
}
document.querySelectorAll('.tab').forEach(function(b){
  b.addEventListener('click',function(){
    try{ location.hash=b.dataset.view; }catch(e){}
    var v=b.dataset.view;
    VIEWS.forEach(function(x){ $('#view-'+x).hidden=(x!==v); $('#tab-'+x).setAttribute('aria-current',x===v?'page':'false'); });
  });
});
window.addEventListener('hashchange',route);

/* ---------- Formulir ---------- */
$('#taskForm').addEventListener('submit',function(ev){
  ev.preventDefault(); if(!ready) return;
  var text=$('#taskText').value.trim(); if(!text) return;
  state.tasks.push({id:uid(),text:text,done:false,due:$('#taskDue').value||null,prio:+$('#taskPrio').value,ex:false});
  $('#taskText').value=''; $('#taskDue').value=''; $('#taskPrio').value='2';
  commit(); $('#taskText').focus();
});
function syncType(){
  var isIn=$('#mIn').checked;
  $('#mCat').disabled=isIn;
  $('#mCat').style.opacity=isIn?'.5':'';
}
$('#mOut').addEventListener('change',syncType);
$('#mIn').addEventListener('change',syncType);
$('#moneyForm').addEventListener('submit',function(ev){
  ev.preventDefault(); if(!ready) return;
  var amount=Math.round(+$('#mAmount').value); if(!(amount>0)) return;
  var isIn=$('#mIn').checked;
  state.expenses.push({id:uid(),type:isIn?'in':'out',amount:amount,cat:isIn?'Pemasukan':$('#mCat').value,note:$('#mNote').value.trim(),date:dayStr(0),ex:false});
  $('#mAmount').value=''; $('#mNote').value='';
  commit(); $('#mAmount').focus();
});
$('#budgetInput').addEventListener('change',function(){
  if(!ready) return;
  state.budget=Math.max(0,Math.round(+this.value||0)); commit();
});
$('#habitForm').addEventListener('submit',function(ev){
  ev.preventDefault(); if(!ready) return;
  var name=$('#habitText').value.trim(); if(!name) return;
  state.habits.push({id:uid(),name:name,log:{},ex:false});
  $('#habitText').value=''; commit(); $('#habitText').focus();
});
$('#clearSample').addEventListener('click',function(){
  state.tasks=state.tasks.filter(function(t){ return !t.ex; });
  state.expenses=state.expenses.filter(function(e){ return !e.ex; });
  state.habits=state.habits.filter(function(h){ return !h.ex; });
  state.sample=false; state.budget=0; commit();
});

boot();

if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
}
})();
