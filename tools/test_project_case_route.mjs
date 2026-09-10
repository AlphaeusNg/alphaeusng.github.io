import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const route = require('../js/project-case-route.js');
const slugs = new Set(['aily', 'koboforge']);

test('case route preserves unrelated parameters and anchors Craft', () => {
  const href = route.withCase(
    'https://alphaeusng.github.io/?utm_source=profile&view=compact#thoughts',
    'aily'
  );
  const url = new URL(href, 'https://alphaeusng.github.io/');

  assert.equal(url.searchParams.get('utm_source'), 'profile');
  assert.equal(url.searchParams.get('view'), 'compact');
  assert.equal(url.searchParams.get('case'), 'aily');
  assert.equal(url.hash, '#craft');
});

test('closing removes only case state and retains Craft', () => {
  const href = route.withoutCase(
    '/?utm_source=profile&case=koboforge&view=compact#craft'
  );
  const url = new URL(href, 'https://alphaeusng.github.io/');

  assert.equal(url.searchParams.has('case'), false);
  assert.equal(url.searchParams.get('utm_source'), 'profile');
  assert.equal(url.searchParams.get('view'), 'compact');
  assert.equal(url.hash, '#craft');
});

test('route inspection accepts stable slugs and fails unknown slugs closed', () => {
  assert.deepEqual(route.inspect('/?case=aily#craft', slugs), {
    hasCase: true,
    slug: 'aily',
  });
  assert.deepEqual(route.inspect('/?case=not-a-project#craft', slugs), {
    hasCase: true,
    slug: null,
  });
  assert.deepEqual(route.inspect('/?utm_source=profile#craft', slugs), {
    hasCase: false,
    slug: null,
  });
});

test('invalid case cleanup can preserve a non-Craft hash', () => {
  assert.equal(
    route.withoutCase('/?case=unknown&utm_source=profile#story', {
      keepCraftHash: false,
    }),
    '/?utm_source=profile#story'
  );
});
