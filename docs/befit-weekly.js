/* HESED · Registro semanal BEFIT / FORUM
   Captura el flujo del FORMATO SEMANAL sin depender de fórmulas de Excel.
   Datos locales en IndexedDB; cada unidad y semana conserva su propio registro. */
(()=>{
'use strict';
const DB='hesed_befit_admin',VERSION=4;
const $=id=>document.getElementById(id);
const days=['VIERNES','SÁBADO','DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES'];
const fixedDefaults=['Renta','Impuestos','Coach','Aguinaldos','Mantenimiento','Contadora','Progym','Otros fijos'];
const catalogDefaults=[
 ['General',549],['Estudiante',499],['Semestre',2745],['Promoción trimestre especial',1373],
 ['Adulto mayor',275],['Semana',250],['Anualidad estudiante',5490],['Visita transferencia',80],
 ['Mensualidad especial',467],['Quincena',350]
];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format((Number(v)||0)/100);
const cents=v=>{const n=Number(String(v??'').replace(/,/g,'').trim());return Number.isFinite(n)?Math.round(n*100):0};
const num=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?Math.floor(n):0};
function localISO(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(s,n){const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return localISO(d)}
function lastFriday(){const d=new Date(),delta=(d.getDay()-5+7)%7;d.setDate(d.getDate()-delta);return localISO(d)}
function openDB(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB,VERSION);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains('weeklyReports'))d.createObjectStore('weeklyReports',{keyPath:'id'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
let db=null,activeId=null;
function all(){return new Promise((resolve,reject)=>{const q=db.transaction('weeklyReports').objectStore('weeklyReports').getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)})}
function put(v){return new Promise((resolve,reject)=>{const q=db.transaction('weeklyReports','readwrite').objectStore('weeklyReports').put(v);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
function audit(action,detail){try{const tx=db.transaction('audit','readwrite');tx.objectStore('audit').put({id:crypto.randomUUID(),at:new Date().toISOString(),actor:localStorage.getItem('hesed:division-session:BEFIT')||'sesión local HESED',action,detail})}catch(e){console.warn('Auditoría semanal no disponible',e)}}
function blank(brand,start){
 const weekStart=start||lastFriday();
 return {id:null,brand:brand||'BEFIT',weekStart,weekEnd:addDays(weekStart,6),
  days:days.map((day,i)=>({day,date:addDays(weekStart,i),am:0,pm:0,fs:0,nv:0,renewals:0,newUsers:0,prospects:0,opening:'',schedule:'',incidents:''})),
  terminals:catalogDefaults.map(([name,price])=>({name,qty:0,price:cents(price)})),
  payroll:Array.from({length:8},()=>({name:'',amount:0})),
  fixedExpenses:fixedDefaults.map(concept=>({concept,amount:0})),
  variableExpenses:Array.from({length:4},()=>({concept:'',amount:0})),
  metrics:{weeklyGoal:'',activeUsers:'',expiredUsers:'',calls:'',gymReviews:'',shalomReviews:'',tm:'',tv:'',whatsSent:'',whatsReceived:'',whatsAnswered:''}
 };
}
function amountInput(v){return ((Number(v)||0)/100).toFixed(2)}
function lineRows(kind,rows){return rows.map((r,i)=>'<tr data-line="'+kind+'" data-index="'+i+'"><td><input class="bw-line-name" maxlength="100" value="'+esc(r.name??r.concept??'')+'" placeholder="'+(kind==='payroll'?'Nombre / clave':'Concepto')+'"></td><td><input class="bw-line-amount" type="number" min="0" step=".01" value="'+amountInput(r.amount)+'"></td><td><button type="button" class="bw-remove" data-remove-line="'+kind+'" data-index="'+i+'" aria-label="Eliminar fila">×</button></td></tr>').join('')}
function renderHistory(items){
 const root=$('bwHistory');if(!root)return;
 const sorted=items.slice().sort((a,b)=>(b.weekStart||'').localeCompare(a.weekStart||'')||b.updatedAt.localeCompare(a.updatedAt));
 root.innerHTML=sorted.length?'<div class="bw-history-list">'+sorted.slice(0,14).map(x=>'<button type="button" data-load-week="'+esc(x.id)+'"><b>'+esc(x.brand)+'</b><span>'+esc(x.weekStart)+' — '+esc(x.weekEnd)+'</span><small>'+money(x.totals?.income||0)+' ventas · '+money(x.totals?.expenses||0)+' gastos</small></button>').join('')+'</div>':'<p class="bc-muted">Todavía no hay semanas guardadas.</p>';
}
function summaryHTML(r){
 const t=r.totals, m=r.metrics, d=r.derived;
 return '<div class="bw-summary"><div><small>Ingresos en efectivo</small><strong>'+money(t.cash)+'</strong></div><div><small>Ventas por terminal / transferencia</small><strong>'+money(t.terminal)+'</strong></div><div><small>Ingresos totales</small><strong>'+money(t.income)+'</strong></div><div><small>Egresos fijos · incluye nómina</small><strong>'+money(t.fixed)+'</strong></div><div><small>Egresos variables</small><strong>'+money(t.variable)+'</strong></div><div><small>Ganancia semanal</small><strong class="'+(t.profit<0?'bw-loss':'')+'">'+money(t.profit)+'</strong></div></div><div class="bw-counts"><span>N/V: <b>'+d.nv+'</b></span><span>Renovaciones: <b>'+d.renewals+'</b></span><span>Nuevos usuarios: <b>'+d.newUsers+'</b></span><span>Prospectos: <b>'+d.prospects+'</b></span><span>Unidades por terminal: <b>'+d.terminalUnits+'</b></span></div>';
}
function build(r){
 const entry=$('bwEntry');if(!entry)return;
 const m=r.metrics||{};
 entry.innerHTML=
 '<div class="bw-week-head"><div><span class="bw-kicker">Registro operativo y financiero</span><h3>'+esc(r.brand)+' · Semana '+esc(r.weekStart)+' a '+esc(r.weekEnd)+'</h3><p class="bc-muted">Semana de viernes a jueves. Los importes se guardan en centavos y se calculan automáticamente.</p></div><span class="tag">Por unidad de negocio</span></div>'+
 '<div class="bc-subpanel"><h4>1. Cortes por día y turno</h4><p class="bc-muted">Captura el efectivo por turno y los indicadores diarios que utiliza la hoja: N/V, U/R, U/N y P.</p><div class="bc-tablewrap"><table class="bw-table"><thead><tr><th>Día / fecha</th><th>AM · MXN</th><th>PM · MXN</th><th>F.S. · MXN</th><th>N/V</th><th>U/R</th><th>U/N</th><th>P</th></tr></thead><tbody>'+r.days.map((d,i)=>'<tr data-day-index="'+i+'"><td><b>'+days[i]+'</b><small>'+esc(d.date)+'</small></td><td><input data-day="am" type="number" min="0" step=".01" value="'+amountInput(d.am)+'"></td><td><input data-day="pm" type="number" min="0" step=".01" value="'+amountInput(d.pm)+'"></td><td><input data-day="fs" type="number" min="0" step=".01" value="'+amountInput(d.fs)+'"></td><td><input data-day="nv" type="number" min="0" step="1" value="'+num(d.nv)+'"></td><td><input data-day="renewals" type="number" min="0" step="1" value="'+num(d.renewals)+'"></td><td><input data-day="newUsers" type="number" min="0" step="1" value="'+num(d.newUsers)+'"></td><td><input data-day="prospects" type="number" min="0" step="1" value="'+num(d.prospects)+'"></td></tr>').join('')+'</tbody></table></div></div>'+
 '<div class="bc-subpanel"><h4>2. Ventas por terminal o transferencia</h4><p class="bc-muted">Tarifario precargado del archivo de referencia. Verifica o ajusta los precios antes de registrar ventas; el sistema no los considera definitivos.</p><div class="bc-tablewrap"><table class="bw-table"><thead><tr><th>Plan / servicio</th><th>Cantidad</th><th>Precio unitario · MXN</th><th>Total · MXN</th></tr></thead><tbody>'+r.terminals.map((x,i)=>'<tr data-terminal-index="'+i+'"><td><input data-terminal-name value="'+esc(x.name)+'" maxlength="80"></td><td><input data-terminal-qty type="number" min="0" step="1" value="'+num(x.qty)+'"></td><td><input data-terminal-price type="number" min="0" step=".01" value="'+amountInput(x.price)+'"></td><td class="bw-line-total" data-terminal-total>'+money(num(x.qty)*Number(x.price||0))+'</td></tr>').join('')+'</tbody></table></div></div>'+
 '<div class="bw-two-col"><div class="bc-subpanel"><h4>3. Nómina en efectivo</h4><p class="bc-muted">Registra a cada colaborador y su pago semanal. No se precargan nombres personales del Excel.</p><div class="bc-tablewrap"><table class="bw-table"><thead><tr><th>Colaborador / clave</th><th>Pago · MXN</th><th></th></tr></thead><tbody id="bwPayrollBody">'+lineRows('payroll',r.payroll)+'</tbody></table></div><button class="btn secondary" type="button" data-add-line="payroll">+ Agregar persona</button></div>'+
 '<div class="bc-subpanel"><h4>4. Gastos fijos</h4><p class="bc-muted">Renta, impuestos, coaches, mantenimiento y otros compromisos recurrentes.</p><div class="bc-tablewrap"><table class="bw-table"><thead><tr><th>Concepto</th><th>Importe · MXN</th><th></th></tr></thead><tbody id="bwFixedBody">'+lineRows('fixed',r.fixedExpenses)+'</tbody></table></div><button class="btn secondary" type="button" data-add-line="fixed">+ Agregar gasto fijo</button></div></div>'+
 '<div class="bc-subpanel"><h4>5. Gastos variables</h4><p class="bc-muted">Compras, reparaciones, extras y pagos no recurrentes.</p><div class="bc-tablewrap"><table class="bw-table"><thead><tr><th>Concepto</th><th>Importe · MXN</th><th></th></tr></thead><tbody id="bwVariableBody">'+lineRows('variable',r.variableExpenses)+'</tbody></table></div><button class="btn secondary" type="button" data-add-line="variable">+ Agregar gasto variable</button></div>'+
 '<div class="bc-subpanel"><h4>6. Operación y métricas</h4><div class="bw-metrics-grid">'+
 '<label>Meta semanal de ventas (unidades)<input id="bwWeeklyGoal" type="number" min="0" step="1" value="'+esc(m.weeklyGoal)+'"></label><label>Usuarios activos<input id="bwActiveUsers" type="number" min="0" step="1" value="'+esc(m.activeUsers)+'"></label><label>Usuarios vencidos<input id="bwExpiredUsers" type="number" min="0" step="1" value="'+esc(m.expiredUsers)+'"></label><label>Llamadas<input id="bwCalls" type="number" min="0" step="1" value="'+esc(m.calls)+'"></label><label>Evaluaciones Google · GYM<input id="bwGymReviews" type="number" min="0" step="1" value="'+esc(m.gymReviews)+'"></label><label>Evaluaciones Google · SHALOM<input id="bwShalomReviews" type="number" min="0" step="1" value="'+esc(m.shalomReviews)+'"></label><label>T.M.<input id="bwTM" type="number" min="0" step="1" value="'+esc(m.tm)+'"></label><label>T.V.<input id="bwTV" type="number" min="0" step="1" value="'+esc(m.tv)+'"></label><label>WhatsApp · enviados<input id="bwWhatsSent" type="number" min="0" step="1" value="'+esc(m.whatsSent)+'"></label><label>WhatsApp · recibidos<input id="bwWhatsReceived" type="number" min="0" step="1" value="'+esc(m.whatsReceived)+'"></label><label>WhatsApp · respondidos<input id="bwWhatsAnswered" type="number" min="0" step="1" value="'+esc(m.whatsAnswered)+'"></label></div>'+
 '<h5>Horario, apertura e incidentes</h5><div class="bc-tablewrap"><table class="bw-table"><thead><tr><th>Día</th><th>Horario</th><th>Apertura</th><th>Incidentes</th></tr></thead><tbody>'+r.days.map((d,i)=>'<tr data-ops-day="'+i+'"><td>'+days[i]+'</td><td><input data-ops="schedule" value="'+esc(d.schedule||'')+'" placeholder="Ej. 6:00–22:00"></td><td><input data-ops="opening" value="'+esc(d.opening||'')+'" placeholder="Hora / responsable"></td><td><input data-ops="incidents" value="'+esc(d.incidents||'')+'" placeholder="Sin incidentes / detalle"></td></tr>').join('')+'</tbody></table></div></div>'+
 '<div class="bw-actions"><button class="btn" type="button" id="bwSave">Guardar semana</button><button class="btn secondary" type="button" id="bwPrint">Imprimir / guardar PDF</button><button class="btn secondary" type="button" id="bwCSV">Exportar semana CSV</button></div><div id="bwSummary">'+(r.totals?summaryHTML(r):'')+'</div>';
 entry.querySelectorAll('[data-add-line]').forEach(b=>b.addEventListener('click',()=>addLine(b.dataset.addLine)));
 entry.querySelectorAll('[data-remove-line]').forEach(b=>b.addEventListener('click',()=>b.closest('tr').remove()));
 entry.querySelectorAll('[data-terminal-qty],[data-terminal-price]').forEach(el=>el.addEventListener('input',updateTerminalTotals));
 $('bwSave').onclick=saveCurrent;
 $('bwPrint').onclick=()=>{const report=capture();const computed=calculate(report);report.totals=computed.totals;report.derived=computed.derived;printWeek(report)};
 $('bwCSV').onclick=()=>exportWeek(capture());
 updateTerminalTotals();
}
function addLine(kind){
 const tbody=$(kind==='payroll'?'bwPayrollBody':kind==='fixed'?'bwFixedBody':'bwVariableBody');if(!tbody)return;
 const i=tbody.querySelectorAll('tr').length;
 const row=document.createElement('tr');row.dataset.line=kind;row.dataset.index=i;
 row.innerHTML='<td><input class="bw-line-name" maxlength="100" placeholder="'+(kind==='payroll'?'Nombre / clave':'Concepto')+'"></td><td><input class="bw-line-amount" type="number" min="0" step=".01" value="0"></td><td><button type="button" class="bw-remove" aria-label="Eliminar fila">×</button></td>';
 row.querySelector('button').onclick=()=>row.remove();tbody.appendChild(row);
}
function updateTerminalTotals(){
 document.querySelectorAll('#bwEntry tr[data-terminal-index]').forEach(row=>{const qty=num(row.querySelector('[data-terminal-qty]').value),price=cents(row.querySelector('[data-terminal-price]').value);row.querySelector('[data-terminal-total]').textContent=money(qty*price)});
}
function capture(){
 const brand=$('bwBrand')?.value||'BEFIT',weekStart=$('bwWeekStart')?.value||lastFriday();
 const opsDays=[...document.querySelectorAll('#bwEntry tr[data-ops-day]')].map(tr=>({schedule:tr.querySelector('[data-ops="schedule"]').value.trim(),opening:tr.querySelector('[data-ops="opening"]').value.trim(),incidents:tr.querySelector('[data-ops="incidents"]').value.trim()}));
 const daysRows=[...document.querySelectorAll('#bwEntry tr[data-day-index]')].map((tr,i)=>({day:days[i],date:addDays(weekStart,i),am:cents(tr.querySelector('[data-day="am"]').value),pm:cents(tr.querySelector('[data-day="pm"]').value),fs:cents(tr.querySelector('[data-day="fs"]').value),nv:num(tr.querySelector('[data-day="nv"]').value),renewals:num(tr.querySelector('[data-day="renewals"]').value),newUsers:num(tr.querySelector('[data-day="newUsers"]').value),prospects:num(tr.querySelector('[data-day="prospects"]').value),...(opsDays[i]||{})}));
 const terminals=[...document.querySelectorAll('#bwEntry tr[data-terminal-index]')].map(tr=>({name:tr.querySelector('[data-terminal-name]').value.trim(),qty:num(tr.querySelector('[data-terminal-qty]').value),price:cents(tr.querySelector('[data-terminal-price]').value)}));
 const lines=id=>[...document.querySelectorAll('#'+id+' tr[data-line]')].map(tr=>({name:tr.querySelector('.bw-line-name').value.trim(),amount:cents(tr.querySelector('.bw-line-amount').value)})).filter(x=>x.name||x.amount);
 const metrics={weeklyGoal:num($('bwWeeklyGoal').value),activeUsers:num($('bwActiveUsers').value),expiredUsers:num($('bwExpiredUsers').value),calls:num($('bwCalls').value),gymReviews:num($('bwGymReviews').value),shalomReviews:num($('bwShalomReviews').value),tm:num($('bwTM').value),tv:num($('bwTV').value),whatsSent:num($('bwWhatsSent').value),whatsReceived:num($('bwWhatsReceived').value),whatsAnswered:num($('bwWhatsAnswered').value)};
 return {id:activeId||null,brand,weekStart,weekEnd:addDays(weekStart,6),days:daysRows,terminals,payroll:lines('bwPayrollBody'),fixedExpenses:lines('bwFixedBody'),variableExpenses:lines('bwVariableBody'),metrics};
}
function calculate(r){
 const cash=r.days.reduce((s,d)=>s+d.am+d.pm+d.fs,0);
 const terminal=r.terminals.reduce((s,x)=>s+x.qty*x.price,0);
 const payroll=r.payroll.reduce((s,x)=>s+x.amount,0);
 const fixedOther=r.fixedExpenses.reduce((s,x)=>s+x.amount,0);
 const variable=r.variableExpenses.reduce((s,x)=>s+x.amount,0);
 const fixed=payroll+fixedOther,expenses=fixed+variable,income=cash+terminal;
 return {totals:{cash,terminal,income,payroll,fixedOther,fixed,variable,expenses,profit:income-expenses},derived:{nv:r.days.reduce((s,x)=>s+x.nv,0),renewals:r.days.reduce((s,x)=>s+x.renewals,0),newUsers:r.days.reduce((s,x)=>s+x.newUsers,0),prospects:r.days.reduce((s,x)=>s+x.prospects,0),terminalUnits:r.terminals.reduce((s,x)=>s+x.qty,0)}};
}
async function saveCurrent(){
 const r=capture();
 if(!r.weekStart||new Date(r.weekStart+'T12:00:00').getDay()!==5){alert('La semana debe comenzar en viernes para respetar el formato de referencia.');return}
 if(r.days.concat([]).some(d=>[d.am,d.pm,d.fs].some(v=>v<0))||r.terminals.some(x=>x.price<0||x.qty<0)||r.payroll.some(x=>x.amount<0)||r.fixedExpenses.some(x=>x.amount<0)||r.variableExpenses.some(x=>x.amount<0)){alert('Revisa los importes y cantidades: no pueden ser negativos.');return}
 const existing=(await all()).find(x=>x.brand===r.brand&&x.weekStart===r.weekStart);
 if(existing&&!activeId&&!confirm('Ya existe un registro para '+r.brand+' en la semana '+r.weekStart+'. ¿Deseas reemplazarlo?'))return;
 r.id=activeId||(existing?.id)||crypto.randomUUID();r.createdAt=existing?.createdAt||new Date().toISOString();r.updatedAt=new Date().toISOString();
 const result=calculate(r);r.totals=result.totals;r.derived=result.derived;
 await put(r);activeId=r.id;audit('Control semanal guardado',{id:r.id,brand:r.brand,weekStart:r.weekStart,totals:r.totals,derived:r.derived});
 $('bwSummary').innerHTML=summaryHTML(r);
 renderHistory(await all());
 alert('Semana guardada para '+r.brand+'. Los totales se calcularon automáticamente.');
}
function printWeek(r){
 const result=calculate(r),t=result.totals,d=result.derived;
 const rows=r.days.map(x=>'<tr><td>'+esc(x.day)+' · '+esc(x.date)+'</td><td>'+money(x.am)+'</td><td>'+money(x.pm)+'</td><td>'+money(x.fs)+'</td><td>'+x.nv+'</td><td>'+x.renewals+'</td><td>'+x.newUsers+'</td><td>'+x.prospects+'</td></tr>').join('');
 const expenseRows=[...r.payroll.map(x=>['Nómina · '+x.name,x.amount]),...r.fixedExpenses.map(x=>['Fijo · '+x.name,x.amount]),...r.variableExpenses.map(x=>['Variable · '+x.name,x.amount])].filter(x=>x[0].trim()!=='Nómina · '||x[1]).map(x=>'<tr><td>'+esc(x[0])+'</td><td>'+money(x[1])+'</td></tr>').join('');
 const terminalRows=r.terminals.filter(x=>x.name||x.qty).map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.qty+'</td><td>'+money(x.price)+'</td><td>'+money(x.qty*x.price)+'</td></tr>').join('');
 const w=window.open('','_blank','width=1000,height=800');if(!w){alert('Permite ventanas emergentes para imprimir el reporte.');return}
 w.document.write('<!doctype html><html lang="es"><meta charset="utf-8"><title>HESED · '+esc(r.brand)+' · '+esc(r.weekStart)+'</title><style>body{font:13px Arial;color:#17221d;padding:28px}h1,h2{margin:0 0 12px}section{margin:22px 0}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border-bottom:1px solid #ddd;padding:7px;text-align:left}td:not(:first-child){text-align:right}.k{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.k div{padding:12px;border:1px solid #ddd}.k b{display:block;font-size:18px;margin-top:7px}.small{color:#666}</style><h1>'+esc(r.brand)+' · Control semanal</h1><p>'+esc(r.weekStart)+' a '+esc(r.weekEnd)+'</p><section class="k">'+[['Ingresos',t.income],['Egresos',t.expenses],['Ganancia',t.profit]].map(x=>'<div>'+x[0]+'<b>'+money(x[1])+'</b></div>').join('')+'</section><section><h2>Ingresos por día y turno</h2><table><thead><tr><th>Día</th><th>AM</th><th>PM</th><th>F.S.</th><th>N/V</th><th>U/R</th><th>U/N</th><th>P</th></tr></thead><tbody>'+rows+'</tbody></table></section><section><h2>Terminal / transferencia</h2><table><thead><tr><th>Plan</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody>'+terminalRows+'</tbody></table></section><section><h2>Egresos</h2><table><thead><tr><th>Concepto</th><th>Importe</th></tr></thead><tbody>'+expenseRows+'</tbody></table></section><section><h2>Indicadores operativos</h2><p>N/V: '+d.nv+' · Renovaciones: '+d.renewals+' · Nuevos usuarios: '+d.newUsers+' · Prospectos: '+d.prospects+'</p><p>Usuarios activos: '+(r.metrics.activeUsers||'—')+' · Vencidos: '+(r.metrics.expiredUsers||'—')+' · Llamadas: '+(r.metrics.calls||'—')+'</p></section><p class="small">Generado desde HESED · '+new Date().toLocaleString('es-MX')+'</p></html>');
 w.document.close();w.focus();w.onload=()=>w.print();
}
function exportWeek(r){
 const c=calculate(r),rows=[['unidad','semana_inicio','semana_fin','tipo','fecha_o_concepto','turno_o_cantidad','importe_centavos','N_V','U_R','U_N','P']];
 r.days.forEach(x=>['am','pm','fs'].forEach(shift=>rows.push([r.brand,r.weekStart,r.weekEnd,'efectivo',x.date,shift,x[shift],x.nv,x.renewals,x.newUsers,x.prospects])));
 r.terminals.forEach(x=>rows.push([r.brand,r.weekStart,r.weekEnd,'terminal',x.name,x.qty,x.qty*x.price,'','','','']));
 r.payroll.forEach(x=>rows.push([r.brand,r.weekStart,r.weekEnd,'nomina',x.name,'',x.amount,'','','','']));
 r.fixedExpenses.forEach(x=>rows.push([r.brand,r.weekStart,r.weekEnd,'gasto_fijo',x.name,'',x.amount,'','','','']));
 r.variableExpenses.forEach(x=>rows.push([r.brand,r.weekStart,r.weekEnd,'gasto_variable',x.name,'',x.amount,'','','','']));
 rows.push([r.brand,r.weekStart,r.weekEnd,'resumen','ingresos_total','',c.totals.income,'','','','']);
 rows.push([r.brand,r.weekStart,r.weekEnd,'resumen','egresos_total','',c.totals.expenses,'','','','']);
 rows.push([r.brand,r.weekStart,r.weekEnd,'resumen','ganancia','',c.totals.profit,'','','','']);
 const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='hesed-'+r.brand.toLowerCase()+'-semana-'+r.weekStart+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
async function loadWeek(id){
 const r=(await all()).find(x=>x.id===id);if(!r)return;
 activeId=r.id;$('bwBrand').value=r.brand;$('bwWeekStart').value=r.weekStart;
 $('bwWeekEnd').textContent=r.weekEnd;
 build({...blank(r.brand,r.weekStart),...r,days:r.days||blank(r.brand,r.weekStart).days,terminals:r.terminals||blank(r.brand,r.weekStart).terminals,payroll:r.payroll||[],fixedExpenses:r.fixedExpenses||[],variableExpenses:r.variableExpenses||[],metrics:r.metrics||{}});
 $('bwCurrentTitle').textContent='Editando '+r.brand+' · '+r.weekStart;
}
function loadBlank(){activeId=null;const b=blank($('bwBrand').value,$('bwWeekStart').value||lastFriday());$('bwWeekEnd').textContent=b.weekEnd;$('bwCurrentTitle').textContent='Nueva semana';build(b)}
async function mount(root){
 if(!root||document.getElementById('bwApp'))return;
 root.insertAdjacentHTML('afterbegin','<div class="bc-subpanel" id="bwApp"><div class="bw-top"><div><span class="bw-kicker">Control semanal · basado en tu formato</span><h3>Administración BEFIT / FORUM</h3><p class="bc-muted">Registro de ingresos, nómina, gastos y métricas. Cada unidad y semana se guarda por separado.</p></div><span class="tag">Registro semanal</span></div><div class="bw-selector"><label>Unidad de negocio<select id="bwBrand"><option value="BEFIT">BEFIT</option><option value="FORUM">FORUM</option></select></label><label>Inicio de semana · viernes<input id="bwWeekStart" type="date" value="'+lastFriday()+'"></label><label>Fin de semana<strong id="bwWeekEnd">'+addDays(lastFriday(),6)+'</strong></label><div class="bw-actions"><button type="button" class="btn secondary" id="bwLoad">Cargar semana</button><button type="button" class="btn secondary" id="bwNew">Nueva semana</button></div></div><p id="bwCurrentTitle" class="bc-muted">Nueva semana</p><div id="bwEntry"></div><div class="bw-history"><h4>Historial de semanas guardadas</h4><div id="bwHistory"></div></div></div>');
 try{db=await openDB()}catch(e){$('bwEntry').innerHTML='<p class="bc-muted">No se pudo abrir el almacenamiento semanal. '+esc(e.message)+'</p>';return}
 $('bwWeekStart').addEventListener('change',()=>{
  const start=$('bwWeekStart').value;$('bwWeekEnd').textContent=start?addDays(start,6):'—';
  if(start)document.querySelectorAll('#bwEntry tr[data-day-index]').forEach((tr,i)=>{const dateCell=tr.querySelector('td:first-child small');if(dateCell)dateCell.textContent=addDays(start,i)});
  activeId=null;$('bwCurrentTitle').textContent='Nueva semana · verifica que inicie en viernes';
 });
 $('bwBrand').addEventListener('change',()=>{activeId=null;$('bwCurrentTitle').textContent='Nueva semana · '+$('bwBrand').value});
 $('bwLoad').onclick=async()=>{const r=(await all()).find(x=>x.brand===$('bwBrand').value&&x.weekStart===$('bwWeekStart').value);if(r)await loadWeek(r.id);else{activeId=null;$('bwCurrentTitle').textContent='No hay registro: '+$('bwBrand').value+' · '+$('bwWeekStart').value;build(blank($('bwBrand').value,$('bwWeekStart').value))}};
 $('bwNew').onclick=loadBlank;
 $('bwHistory').addEventListener('click',e=>{const b=e.target.closest('[data-load-week]');if(b)loadWeek(b.dataset.loadWeek)});
 build(blank('BEFIT',lastFriday()));renderHistory(await all());
}
const style=document.createElement('style');
style.textContent='.bw-top,.bw-week-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}.bw-kicker{font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:var(--green)}.bw-top h3,.bw-week-head h3{font-size:18px;margin:5px 0}.bw-selector{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;align-items:end;margin:16px 0}.bw-selector label,.bw-metrics-grid label{display:block;color:var(--muted);font-size:11px}.bw-selector input,.bw-selector select,.bw-metrics-grid input,.bw-table input{width:100%;min-width:72px;margin-top:5px;border:1px solid var(--line);background:#0b1714;color:var(--text);border-radius:8px;padding:9px;font:inherit}.bw-selector strong{display:block;padding:9px 0;color:var(--text)}.bw-table{min-width:760px!important}.bw-table th,.bw-table td{font-size:11px;padding:8px}.bw-table td:first-child small{display:block;color:var(--muted);margin-top:3px}.bw-table input{padding:7px;min-width:68px}.bw-table [data-terminal-name],.bw-table .bw-line-name{min-width:135px}.bw-remove{background:transparent;border:0;color:#e6a69b;font-size:20px;cursor:pointer}.bw-two-col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.bw-metrics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:12px 0 22px}.bw-metrics-grid input{min-width:0}.bw-actions{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0}.bw-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.bw-summary>div{padding:13px;border-radius:10px;border:1px solid var(--line);background:var(--panel2)}.bw-summary small{display:block;color:var(--muted);font-size:11px}.bw-summary strong{display:block;font-size:20px;margin-top:7px;font-variant-numeric:tabular-nums}.bw-summary .bw-loss{color:#ef9b8c}.bw-counts{display:flex;flex-wrap:wrap;gap:8px 18px;color:var(--muted);font-size:12px}.bw-counts b{color:var(--text)}.bw-history{border-top:1px solid var(--line);margin-top:20px;padding-top:14px}.bw-history h4{margin:0 0 10px}.bw-history-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.bw-history-list button{display:flex;flex-direction:column;gap:4px;text-align:left;background:var(--panel2);color:var(--text);border:1px solid var(--line);border-radius:9px;padding:11px;cursor:pointer}.bw-history-list span,.bw-history-list small{color:var(--muted);font-size:11px}@media(max-width:720px){.bw-two-col{grid-template-columns:1fr}.bw-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.bw-summary{grid-template-columns:1fr}}@media print{#bwApp .bw-selector,#bwApp .bw-actions,#bwApp .bw-history{display:none!important}}';
document.head.appendChild(style);
window.HesedBefitWeekly={mount};
})();