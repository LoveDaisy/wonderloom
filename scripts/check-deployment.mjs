import { execFileSync } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function parseMainRef(output) {
  const rows = output.trim().split('\n');
  if (rows.length !== 1 || !/^[0-9a-f]{40}\trefs\/heads\/main$/.test(rows[0])) throw new Error('Expected exactly one valid main ref');
  return rows[0].slice(0, 40);
}
export function isCurrent(candidate, current) {
  for (const sha of [candidate.website, candidate.source, current.website, current.source]) if (!/^[0-9a-f]{40}$/.test(sha ?? '')) throw new Error('Missing or malformed deployment SHA');
  return candidate.website === current.website && candidate.source === current.source;
}
export function readCurrent() {
  const ref = (repository) => parseMainRef(execFileSync('git', ['ls-remote', '--refs', `https://github.com/LoveDaisy/${repository}`, 'refs/heads/main'], { encoding: 'utf8', timeout: 30000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] }));
  return { website: ref('wonderloom'), source: ref('ice_halo_notes') };
}
export async function dispatchLatest(token, sourceHint, request = fetch) {
  if (!token) throw new Error('Missing workflow dispatch credential');
  const response = await request('https://api.github.com/repos/LoveDaisy/wonderloom/actions/workflows/pages.yml/dispatches', {
    method: 'POST', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    body: JSON.stringify({ ref: 'main', inputs: { source_hint: sourceHint } }), signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Latest rebuild dispatch failed: HTTP ${response.status}`);
}
export async function freshnessGate({ candidate, current, refresh = false, token, request }) {
  const fresh = isCurrent(candidate, current);
  if (refresh || !fresh) await dispatchLatest(token, current.source, request);
  return fresh;
}
async function main() {
  const mode = process.argv[2], candidate = { website: process.env.CANDIDATE_WEBSITE_SHA, source: process.env.CANDIDATE_SOURCE_SHA };
  const current = readCurrent();
  if (mode === 'check') {
    const fresh = isCurrent(candidate, current);
    await appendFile(process.env.GITHUB_OUTPUT, `fresh=${fresh}\n`);
    console.log(`Final freshness gate: ${fresh ? 'current' : 'stale; skip deployment'}`);
  } else if (mode === 'refresh' || mode === 'settle') {
    const fresh = await freshnessGate({ candidate, current, refresh: mode === 'refresh', token: process.env.GITHUB_TOKEN });
    console.log(mode === 'refresh' || !fresh ? 'Requested one latest main rebuild' : 'Deployed snapshot is current at post-deployment observation');
  } else throw new Error('Expected check, refresh or settle');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
