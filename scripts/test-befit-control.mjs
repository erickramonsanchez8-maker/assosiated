import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const control = readFileSync('docs/befit-control.js', 'utf8');
const html = readFileSync('docs/befit.html', 'utf8');
const weekly = readFileSync('docs/befit-weekly.js', 'utf8');
const csvLines = content => content.replaceAll(String.fromCharCode(13), '').trim().split(String.fromCharCode(10));
const reception = csvLines(readFileSync('docs/test-data/befit-recepcion-prueba.csv', 'utf8'));
const admin = csvLines(readFileSync('docs/test-data/befit-administracion-prueba.csv', 'utf8'));

new vm.Script(control, { filename: 'befit-control.js' });
new vm.Script(weekly, { filename: 'befit-weekly.js' });
assert.match(html, /data-tab="control"/, 'BEFIT must expose the financial-control tab');
assert.match(html, /befit-control\.js/, 'BEFIT must load the financial-control module');

assert.match(html, /befit-weekly\.js/, 'BEFIT must load the weekly administration module');
assert.ok(html.indexOf('befit-weekly.js') < html.indexOf('befit-control.js'), 'Weekly module must load before the control module mounts it');
for (const marker of [
  'VERSION=4', "['weeklyReports',{keyPath:'id'}]", 'weeklyReports',
  'HesedBefitWeekly.mount(root)', 'function capture()', 'function calculate(r)',
  'fixedExpenses', 'variableExpenses', 'terminals', 'activeUsers', 'expiredUsers',
  'whatsSent', 'whatsReceived', 'whatsAnswered', 'schedule', 'incidents',
  'function printWeek(r)', 'function exportWeek(r)'
]) {
  assert.ok(weekly.includes(marker) || control.includes(marker), 'Missing weekly feature or regression guard: ' + marker);
}
assert.match(control, /'cashImports','weeklyReports'/, 'Weekly data must be included in backup and restore flows');

// Exercise the production weekly aggregation function. All money values are integer cents.
const calculateStart = weekly.indexOf('function calculate(r){');
const calculateEnd = weekly.indexOf('async function saveCurrent()', calculateStart);
assert.ok(calculateStart >= 0 && calculateEnd > calculateStart, 'Weekly calculation must remain independently testable');
const calculateSource = weekly.slice(calculateStart, calculateEnd).trim();
const calculate = vm.runInNewContext('(' + calculateSource + ')');
const weeklyResult = calculate({
  days: [
    { am: 12500, pm: 5000, fs: 0, nv: 2, renewals: 1, newUsers: 1, prospects: 3 },
    { am: 0, pm: 2500, fs: 0, nv: 1, renewals: 0, newUsers: 1, prospects: 1 }
  ],
  terminals: [{ qty: 2, price: 54900 }, { qty: 1, price: 49900 }],
  payroll: [{ amount: 20000 }, { amount: 15000 }],
  fixedExpenses: [{ amount: 40000 }],
  variableExpenses: [{ amount: 7500 }]
});
assert.deepEqual(JSON.parse(JSON.stringify(weeklyResult)), {
  totals: { cash: 20000, terminal: 159700, income: 179700, payroll: 35000, fixedOther: 40000, fixed: 75000, variable: 7500, expenses: 82500, profit: 97200 },
  derived: { nv: 3, renewals: 1, newUsers: 2, prospects: 4, terminalUnits: 3 }
});


for (const marker of [
  'cashClosings', 'saveCashClose', 'renderCashHistory', 'reconcile', 'scanTicket',
  'fieldConfidence', 'bcMonthPDF', 'backupControl', 'restoreControl',
  'cashImports', 'readCashCuts', 'saveCashCuts', 'bcCashCutFile', 'bcReadCashCuts', 'bcSaveCashCuts',
  'Conciliación automática', 'countSignatures=rows=>', 'eligible=branch?',
  "await put('reconciliations',result)", "f.total==null?'No detectado'"
]) {
  assert.ok(control.includes(marker), `Missing expected feature or regression guard: ${marker}`);
}
assert.doesNotMatch(control, /value="2026-11-02"/, 'Cash date must not be hard-coded');
assert.match(control, /const localDate=/, 'Date defaults must use the local calendar date');

// Exercise the exact money parser embedded in the browser module.
const centsStart = control.indexOf('const cents=');
const centsEnd = control.indexOf('const localDate=', centsStart);
assert.ok(centsStart >= 0 && centsEnd > centsStart, 'Money parser must remain a standalone pure helper');
const centsExpression = control.slice(centsStart + 'const cents='.length, centsEnd).trim().replace(/;$/, '');
const cents = vm.runInNewContext(`(${centsExpression})`);
assert.equal(cents('1234.56'), 123456);
assert.equal(cents('1,234.56'), 123456);
assert.equal(cents('1.234,56'), 123456);
assert.equal(cents('1,234'), 123400, 'Thousands comma must not be read as a decimal');
assert.equal(cents('123,45'), 12345, 'Decimal comma must be supported');
assert.equal(cents('$ 1 234,50'), 123450);
assert.equal(cents('(100.50)'), -10050);
assert.equal(cents('not an amount'), 0);

assert.equal(reception.length, 8, 'Reception fixture should have seven transactions plus header');
assert.equal(admin.length, 7, 'Administration fixture should have six transactions plus header');

// Validate the synthetic reconciliation scenario, including duplicate movements.
const parse = rows => rows.slice(1).map(line => {
  const [date, branch, concept, method, amount, reference] = line.split(',');
  return { date, branch, concept, method, amount: Math.round(Number(amount) * 100), reference };
});
const r = parse(reception), a = parse(admin);
const signature = x => [x.date, x.branch, x.concept, x.method, x.reference].join('|');
const used = new Set(); let exact = 0, different = 0, onlyReception = 0;
for (const x of r) {
  let i = a.findIndex((y, n) => !used.has(n) && signature(y) === signature(x) && y.amount === x.amount);
  if (i >= 0) { used.add(i); exact++; continue; }
  i = a.findIndex((y, n) => !used.has(n) && signature(y) === signature(x));
  if (i >= 0) { used.add(i); different++; } else onlyReception++;
}
const onlyAdmin = a.filter((_, i) => !used.has(i)).length;
assert.deepEqual({ exact, different, onlyReception, onlyAdmin }, {
  exact: 2, different: 3, onlyReception: 2, onlyAdmin: 1
});
const duplicateReception = new Map();
for (const x of r) duplicateReception.set(signature(x), (duplicateReception.get(signature(x)) || 0) + 1);
assert.equal([...duplicateReception.values()].filter(n => n > 1).length, 1, 'Fixture must include one repeated movement');
const delta = r.reduce((n, x) => n + x.amount, 0) - a.reduce((n, x) => n + x.amount, 0);
assert.equal(delta, 30000, 'Fixture must retain a net difference of MXN 300.00');
console.log('BEFIT smoke tests passed: syntax, money parsing, import/reconciliation flow, OCR, cash closing and backup markers.');
