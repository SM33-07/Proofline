import fs from 'fs';
import path from 'path';
import { evaluateMysqlRefund, closePool } from '../src/lib/mysql-backend.ts';

const fixturesDir = fs.existsSync('fixtures/disruption')
  ? path.resolve('fixtures/disruption')
  : path.resolve('../fixtures/disruption');
const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith('.json')).sort();

let passed = 0;
let failed = 0;

console.log('================================================================');
console.log('RailSync Phase 2: Differential Parity Suite (D-01 to D-14)');
console.log('Database Backend: MySQL 8 (railsync_test)');
console.log('Contract: docs/CANONICAL_CONTRACT.md (FROZEN 1.0.0)');
console.log('================================================================\n');

for (const file of files) {
  const filePath = path.join(fixturesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const fid = data.fixtureId || file;
  const expected = data.expected;

  try {
    const actual = await evaluateMysqlRefund(data);

    const diffs = [];
    if (actual.outcome !== expected.outcome) {
      diffs.push(`outcome: expected '${expected.outcome}', got '${actual.outcome}'`);
    }
    if (actual.actionCode !== expected.actionCode) {
      diffs.push(`actionCode: expected '${expected.actionCode}', got '${actual.actionCode}'`);
    }
    if (actual.refundAmount !== expected.refundAmount) {
      diffs.push(`refundAmount: expected '${expected.refundAmount}', got '${actual.refundAmount}'`);
    }

    // Check reason codes
    const expReasons = expected.reasonCodes || [];
    const actReasons = actual.reasonCodes || [];
    for (const r of expReasons) {
      if (!actReasons.includes(r)) {
        diffs.push(`missing expected reasonCode '${r}' (actual: [${actReasons.join(', ')}])`);
      }
    }

    if (diffs.length === 0) {
      console.log(`  [PASS] ${fid.padEnd(42)} -> ${actual.outcome} | INR ${actual.refundAmount} | ${actual.actionCode}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${fid}:`);
      for (const d of diffs) {
        console.error(`         - ${d}`);
      }
      failed++;
    }
  } catch (err) {
    console.error(`  [FAIL] ${fid}: Exception during evaluation:`, err);
    failed++;
  }
}

await closePool();

console.log('\n================================================================');
console.log(`Differential Parity Summary:`);
console.log(`Passed: ${passed}/${files.length} | Failed: ${failed}/${files.length}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
