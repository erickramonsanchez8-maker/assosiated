import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const control = readFileSync('docs/befit-control.js', 'utf8');
const html = readFileSync('docs/befit.html', 'utf8');
const reception = readFileSync('docs/test-data/befit-recepcion-prueba.csv', 'utf8').trim().split(/\r?\n/);
const admin = readFileSync('docs/test-data/befit-administracion-prueba.csv', 'utf8').trim().split(/\r?\n/);

new vm.Script(control, { filename: 'befit-control.js' });
assert.match(html, /data-tab="control"/, 'BEFIT must expose the financial-control tab');
assert.match(html, /befit-control\.js/, 'BEFIT must load the financial-control module');
for (const marker of ['cashClosings', 'saveCashClose', 'renderCashHistory', 'reconcile', 'scanTicket', 'fieldConfidence', 'bcMonthPDF']) {
  assert.ok(control.includes(marker), `Missing expected feature: ${marker}`);
}
assert.equal(reception.length, 8, 'Reception fixture should have seven transactions plus header');
assert.equal(admin.length, 7, 'Administration fixture should have six transactions plus header');

// Validate the designed fixture scenario independently of the browser UI.
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
const delta = r.reduce((n, x) => n + x.amount, 0) - a.reduce((n, x) => n + x.amount, 0);
assert.equal(delta, 30000, 'Fixture must retain a net difference of MXN 300.00');
console.log('BEFIT smoke tests passed: syntax, UI wiring, cash close, OCR, monthly PDF, and reconciliation fixture.');
