import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const control = readFileSync('docs/befit-control.js', 'utf8');
const html = readFileSync('docs/befit.html', 'utf8');
const csvLines = content => content.replaceAll(String.fromCharCode(13), '').trim().split(String.fromCharCode(10));
const reception = csvLines(readFileSync('docs/test-data/befit-recepcion-prueba.csv', 'utf8'));
const admin = csvLines(readFileSync('docs/test-data/befit-administracion-prueba.csv', 'utf8'));

new vm.Script(control, { filename: 'befit-control.js' });
assert.match(html, /data-tab="control"/, 'BEFIT must expose the financial-control tab');
assert.match(html, /befit-control\.js/, 'BEFIT must load the financial-control module');

for (const marker of [
  'cashClosings', 'saveCashClose', 'renderCashHistory', 'reconcile', 'scanTicket',
  'fieldConfidence', 'bcMonthPDF', 'backupControl', 'restoreControl',
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
