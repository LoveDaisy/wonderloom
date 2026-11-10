import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateStaleness, evaluateWithFacts, run } from '../../scripts/check-source-staleness.mjs';

const a = 'a'.repeat(40), b = 'b'.repeat(40), c = 'c'.repeat(40), d = 'd'.repeat(40);

test('staleness judgment covers the complete input domain in explicit evaluation order', () => {
  // ① fires first even when later facts would demand a different verdict —
  // the round-2 ordering bug (drift condition without the deployed==HEAD prefix).
  assert.equal(evaluateStaleness({ headSha: a, publishedSha: a, pastSha: b, pastAncestorOfPublished: false }), 0);
  // ② boundary commit unavailable → fail-closed, never treated as fresh.
  assert.equal(evaluateStaleness({ headSha: a, publishedSha: b, pastSha: null, pastAncestorOfPublished: null }), 1);
  // ③ ancestry-or-equal → fresh with all three shas pairwise distinct — pins the
  // ancestor judgment against an equality-judgment regression.
  assert.equal(evaluateStaleness({ headSha: a, publishedSha: c, pastSha: b, pastAncestorOfPublished: true }), 0);
  // ④ S_past not an ancestor → drift, whether the deployed sha is older or diverged.
  assert.equal(evaluateStaleness({ headSha: a, publishedSha: b, pastSha: c, pastAncestorOfPublished: false }), 10);
  assert.equal(evaluateStaleness({ headSha: a, publishedSha: c, pastSha: b, pastAncestorOfPublished: false }), 10);
  // ⑤ deployed sha not in repository history → fail-closed.
  assert.equal(evaluateStaleness({ headSha: a, publishedSha: c, pastSha: b, pastAncestorOfPublished: 'missing' }), 1);
  for (const bad of [
    { headSha: 'nothex', publishedSha: a, pastSha: null, pastAncestorOfPublished: null },
    { headSha: a, publishedSha: undefined, pastSha: null, pastAncestorOfPublished: null },
    { headSha: a, publishedSha: b, pastSha: 'x'.repeat(40), pastAncestorOfPublished: true },
    { headSha: a, publishedSha: b, pastSha: c, pastAncestorOfPublished: undefined },
  ]) assert.throws(() => evaluateStaleness(bad));
});

function requestFixture({ provenance, commits, compare, log = [], headers = [] } = {}) {
  return async (url, options = {}) => {
    log.push(String(url));
    headers.push(options.headers ?? {});
    if (url.startsWith('https://wonderloom.space/')) {
      if (provenance.error) throw new Error('network down');
      if (!provenance.ok) return { ok: false, status: provenance.status, text: async () => 'nope' };
      return { ok: true, status: 200, text: async () => JSON.stringify(provenance.body) };
    }
    if (url.includes('/commits?')) {
      if (!commits.ok) return { ok: false, status: commits.status, json: async () => [] };
      return { ok: true, status: 200, json: async () => commits.body };
    }
    if (url.includes('/compare/')) {
      if (compare.status === 404) return { ok: false, status: 404, json: async () => ({}) };
      if (!compare.ok) return { ok: false, status: compare.status, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ status: compare.status }) };
    }
    throw new Error(`unexpected URL ${url}`);
  };
}

const lsRemote = (sha) => () => `${sha}\trefs/heads/main\n`;
const NOW = new Date('2026-11-10T12:00:00.000Z');

test('daily pushes do not reset the drift clock: the boundary query is pinned to now-24h, not HEAD time', async () => {
  const log = [];
  const request = requestFixture({ log, provenance: { ok: true, body: { sourceSha: b } }, commits: { ok: true, body: [{ sha: c }] }, compare: { ok: true, status: 'behind' } });
  const { exit } = await evaluateWithFacts({ request, lsRemote: lsRemote(a), now: NOW });
  assert.equal(exit, 10);
  const commitsUrl = log.find((url) => url.includes('/commits?'));
  assert.match(commitsUrl, /until=2026-11-09T12%3A00%3A00\.000Z/, 'S_past must be queried at the 24h boundary, independent of push cadence');
});

test('healthy deployed HEAD short-circuits before any S_past IO', async () => {
  const log = [];
  const request = requestFixture({ log, provenance: { ok: true, body: { sourceSha: a } }, commits: { ok: true, body: [{ sha: c }] }, compare: { ok: true, status: 'identical' } });
  const { exit } = await evaluateWithFacts({ request, lsRemote: lsRemote(a), now: NOW });
  assert.equal(exit, 0);
  assert.equal(log.length, 1, `only the provenance fetch should happen, saw: ${log.join(' | ')}`);
});

test('young deployed commit with a moved-on HEAD stays fresh via ancestry (equal-sha judgment would false-alarm)', async () => {
  const log = [];
  const request = requestFixture({ log, provenance: { ok: true, body: { sourceSha: b } }, commits: { ok: true, body: [{ sha: c }] }, compare: { ok: true, status: 'ahead' } });
  const { exit, facts } = await evaluateWithFacts({ request, lsRemote: lsRemote(a), now: NOW });
  assert.equal(exit, 0);
  assert.equal(facts.pastSha, c);
  assert.equal(facts.pastAncestorOfPublished, true);
});

test('drill override replaces the published sha and skips the provenance fetch; forged shas fail closed', async () => {
  const drillLog = [];
  const drillRequest = requestFixture({ log: drillLog, provenance: { ok: true, body: { sourceSha: a } }, commits: { ok: true, body: [{ sha: c }] }, compare: { ok: true, status: 'behind' } });
  const drifted = await evaluateWithFacts({ request: drillRequest, lsRemote: lsRemote(a), now: NOW, drillPublishedSha: d });
  assert.equal(drifted.exit, 10);
  assert.equal(drifted.facts.drill, true);
  assert.equal(drifted.facts.publishedSha, d);
  assert.ok(!drillLog.some((url) => url.startsWith('https://wonderloom.space/')), 'drill must not consult the real provenance');

  const forgedLog = [];
  const forgedRequest = requestFixture({ log: forgedLog, provenance: { ok: true, body: { sourceSha: a } }, commits: { ok: true, body: [{ sha: c }] }, compare: { status: 404 } });
  assert.equal((await evaluateWithFacts({ request: forgedRequest, lsRemote: lsRemote(a), now: NOW, drillPublishedSha: 'f'.repeat(40) })).exit, 1, 'a sha outside repository history must exit 1 (explicit drill expectation, not an alert)');
});

test('any IO or input failure exits 1 without a verdict', async () => {
  assert.equal(await run({ lsRemote: () => { throw new Error('git unavailable'); } }), 1);
  assert.equal(await run({ request: requestFixture({ provenance: { ok: false, status: 500 } }), lsRemote: lsRemote(a), now: NOW }), 1);
  assert.equal(await run({ request: requestFixture({ provenance: { ok: true, body: { sourceSha: 'bad' } } }), lsRemote: lsRemote(a), now: NOW }), 1);
  assert.equal(await run({ request: requestFixture({ provenance: { error: true } }), lsRemote: lsRemote(a), now: NOW }), 1);
  assert.equal(await run({ request: requestFixture({ provenance: { ok: true, body: { sourceSha: b } }, commits: { ok: false, status: 403 } }), lsRemote: lsRemote(a), now: NOW }), 1);
  assert.equal(await run({ request: requestFixture({ provenance: { ok: true, body: { sourceSha: b } }, commits: { ok: true, body: [{ sha: c }] }, compare: { ok: false, status: 500 } }), lsRemote: lsRemote(a), now: NOW }), 1);
  assert.equal(await run({ request: requestFixture({ provenance: { ok: true, body: { sourceSha: b } }, commits: { ok: true, body: [] } }), lsRemote: lsRemote(a), now: NOW }), 1, 'empty boundary query is a failed check, not freshness');
  assert.equal(await run({ request: requestFixture({ provenance: { ok: true, body: { sourceSha: b } }, commits: { ok: true, body: [{ sha: c }] }, compare: { ok: true, status: 'mysterious' } }), lsRemote: lsRemote(a), now: NOW }), 1);
});

test('GitHub API calls authenticate when a token is available and stay anonymous otherwise', async () => {
  const withToken = [], withTokenHeaders = [];
  await evaluateWithFacts({ request: requestFixture({ log: withToken, headers: withTokenHeaders, provenance: { ok: true, body: { sourceSha: b } }, commits: { ok: true, body: [{ sha: c }] }, compare: { ok: true, status: 'identical' } }), lsRemote: lsRemote(a), now: NOW, token: 'test-only' });
  assert.equal(withTokenHeaders[1].Authorization, 'Bearer test-only');
  assert.equal(withTokenHeaders[1]['X-GitHub-Api-Version'], '2022-11-28');
  const anonymous = [], anonymousHeaders = [];
  await evaluateWithFacts({ request: requestFixture({ log: anonymous, headers: anonymousHeaders, provenance: { ok: true, body: { sourceSha: a } } }), lsRemote: lsRemote(a), now: NOW, token: undefined });
  assert.equal(anonymousHeaders[0].Authorization, undefined);
});
