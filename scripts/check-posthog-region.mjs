#!/usr/bin/env node
/**
 * PostHog region guard (CI).
 *
 * Bindercle's PostHog project (185260) lives on **EU Cloud**. If the SDK ever
 * points at the US host, events silently drop — ingestion returns 200, nothing
 * lands, and you don't find out until you go looking for data that isn't there.
 * This regression bit twice pre-launch (the `EXPO_PUBLIC_POSTHOG_HOST` default
 * falling back to US). Port-equivalent of HalalNomad's e7add10.
 *
 * Two surfaces are checked:
 *   1. The runtime host hardcoded in observability.ts must be the EU host
 *      (and must not mention the US host anywhere).
 *   2. Every `EXPO_PUBLIC_POSTHOG_HOST` baked into eas.json build profiles
 *      must be the EU host (defense in depth — vestigial today, but a wrong
 *      value here is exactly how the original drop happened).
 *
 * Exit non-zero with an actionable message on any violation. No deps — pure fs.
 */
import { readFileSync } from 'node:fs';

const EU_HOST = 'eu.i.posthog.com';
const US_HOST = 'us.i.posthog.com';

const root = new URL('..', import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), 'utf8');

const errors = [];

// 1) Runtime host in observability.ts
const obsPath = 'apps/mobile/src/lib/observability.ts';
const obs = read(obsPath);
const assign = obs.match(/POSTHOG_HOST\s*=\s*['"]([^'"]+)['"]/);
if (!assign) {
  errors.push(`${obsPath}: could not find a POSTHOG_HOST = '...' assignment to verify`);
} else if (!assign[1].includes(EU_HOST)) {
  errors.push(`${obsPath}: POSTHOG_HOST is '${assign[1]}', expected the EU host (${EU_HOST})`);
}
// The US host may legitimately appear inside an explanatory comment, so only
// fail if it shows up in a non-comment line (e.g. a real host string).
for (const [i, line] of obs.split('\n').entries()) {
  const code = line.replace(/\/\/.*$/, '');
  if (code.includes(US_HOST)) {
    errors.push(`${obsPath}:${i + 1}: references the US host (${US_HOST}) in code`);
  }
}

// 2) eas.json build-profile env values
const easPath = 'apps/mobile/eas.json';
const eas = JSON.parse(read(easPath));
for (const [name, profile] of Object.entries(eas.build ?? {})) {
  const host = profile?.env?.EXPO_PUBLIC_POSTHOG_HOST;
  if (host && !host.includes(EU_HOST)) {
    errors.push(`${easPath} [${name}]: EXPO_PUBLIC_POSTHOG_HOST is '${host}', expected ${EU_HOST}`);
  }
}

if (errors.length > 0) {
  console.error('✗ PostHog region guard failed — events would silently drop:');
  for (const e of errors) console.error(`  - ${e}`);
  console.error(`\nFix: every PostHog host must be the EU host (${EU_HOST}).`);
  process.exit(1);
}

console.log(`✓ PostHog region guard: all hosts resolve to the EU host (${EU_HOST}).`);
