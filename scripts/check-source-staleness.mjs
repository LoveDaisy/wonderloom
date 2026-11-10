// Daily drift gate between the writing repository main and the deployed site.
// Exit 0 = fresh, 10 = drift (commits older than 24h are undeployed), 1 = check
// failed. Judgment is a pure function over public read-only facts; this shell
// never materializes writing-repository history locally (S_past comes from the
// GitHub commits API, ancestry from the compare API).
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMainRef } from './check-deployment.mjs';

const website = 'https://wonderloom.space';
const sourceRepository = 'https://github.com/LoveDaisy/ice_halo_notes';
const sourceApi = 'https://api.github.com/repos/LoveDaisy/ice_halo_notes';
const DRIFT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Explicit evaluation order over the complete observable input domain (plan §2):
// ① deployed exactly HEAD → 0; ② boundary commit unavailable → 1 (fail-closed);
// ③ S_past is an ancestor of, or equal to, the deployed sha → 0 (ancestry, not
// equality — equal-sha judgment would raise a false drift when a young commit
// is deployed but HEAD moved on); ⑤ compare 404 (deployed sha not in history) →
// 1; ④ everything else (S_past not an ancestor, including a deployed sha older
// than S_past or diverged history) → 10. Invalid input throws and lands on 1.
export function evaluateStaleness({ headSha, publishedSha, pastSha, pastAncestorOfPublished }) {
  const sha = (value, name) => { if (!/^[0-9a-f]{40}$/.test(value ?? '')) throw new Error(`Staleness: invalid ${name}`); return value; };
  sha(headSha, 'headSha');
  sha(publishedSha, 'publishedSha');
  if (publishedSha === headSha) return 0;
  if (pastSha === null || pastSha === undefined) return 1;
  sha(pastSha, 'pastSha');
  if (pastAncestorOfPublished === true) return 0;
  if (pastAncestorOfPublished === 'missing') return 1;
  if (pastAncestorOfPublished === false) return 10;
  throw new Error('Staleness: ancestry fact missing');
}

const apiHeaders = (token) => ({ Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) });

async function fetchPublishedSha(request) {
  const response = await request(`${website}/writing-lab/source.json`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Staleness: source.json HTTP ${response.status}`);
  const provenance = JSON.parse(await response.text());
  if (!/^[0-9a-f]{40}$/.test(provenance?.sourceSha ?? '')) throw new Error('Staleness: provenance is missing a valid sourceSha');
  return provenance.sourceSha;
}

async function fetchPastSha(request, boundary, token) {
  const response = await request(`${sourceApi}/commits?until=${encodeURIComponent(boundary.toISOString())}&per_page=1`, { headers: apiHeaders(token), signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Staleness: commits API HTTP ${response.status}`);
  const commits = await response.json();
  return Array.isArray(commits) && commits[0]?.sha ? commits[0].sha : null;
}

async function compareAncestry(request, pastSha, publishedSha, token) {
  const response = await request(`${sourceApi}/compare/${pastSha}...${publishedSha}`, { headers: apiHeaders(token), signal: AbortSignal.timeout(30000) });
  if (response.status === 404) return 'missing';
  if (!response.ok) throw new Error(`Staleness: compare API HTTP ${response.status}`);
  const { status } = await response.json();
  if (status === 'ahead' || status === 'identical') return true;
  if (status === 'behind' || status === 'diverged') return false;
  throw new Error(`Staleness: unexpected compare status "${status}"`);
}

function lsRemoteMain() {
  return execFileSync('git', ['-c', 'core.hooksPath=/dev/null', 'ls-remote', '--refs', sourceRepository, 'refs/heads/main'], { encoding: 'utf8', timeout: 30000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
}

export async function evaluateWithFacts({ request = fetch, lsRemote = lsRemoteMain, now = new Date(), drillPublishedSha = process.env.STALENESS_DRILL_PUBLISHED_SHA || undefined, token = process.env.GITHUB_TOKEN } = {}) {
  if (drillPublishedSha !== undefined && !/^[0-9a-f]{40}$/.test(drillPublishedSha)) throw new Error('Staleness: drill published SHA must be a lowercase 40-hex sha');
  const headSha = parseMainRef(lsRemote());
  const publishedSha = drillPublishedSha ?? await fetchPublishedSha(request);
  const facts = { headSha, publishedSha, pastSha: null, pastAncestorOfPublished: null, drill: Boolean(drillPublishedSha) };
  if (publishedSha === headSha) return { exit: evaluateStaleness({ headSha, publishedSha }), facts };
  facts.pastSha = await fetchPastSha(request, new Date(now.getTime() - DRIFT_WINDOW_MS), token);
  facts.pastAncestorOfPublished = facts.pastSha ? await compareAncestry(request, facts.pastSha, publishedSha, token) : null;
  return { exit: evaluateStaleness(facts), facts };
}

export async function run(options = {}) {
  try {
    const { exit, facts } = await evaluateWithFacts(options);
    // The STALENESS_FACTS line protocol is a cross-file contract: the
    // source-staleness workflow extracts it with `sed -n 's/^STALENESS_FACTS //p'`
    // to build the alert issue body. Changing the prefix or shape breaks the
    // body silently — the protocol is pinned by tests/writing-lab/staleness.test.mjs.
    console.log(`STALENESS_FACTS ${JSON.stringify(facts)}`);
    if (exit === 10) console.log('Staleness: drift — the deployed site is at least 24h behind the writing repository main');
    if (exit === 0) console.log('Staleness: fresh — the deployed site matches the writing repository main');
    return exit;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await run();
}
