(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ProjectCaseRoute = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const CASE_PARAM = 'case';
  const CRAFT_HASH = '#craft';

  function relativeHref(url) {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function inspect(href, allowedSlugs) {
    const url = new URL(href, 'https://portfolio.invalid/');
    const hasCase = url.searchParams.has(CASE_PARAM);
    const candidate = hasCase ? url.searchParams.get(CASE_PARAM) : null;
    const allowed = allowedSlugs instanceof Set
      ? allowedSlugs
      : new Set(allowedSlugs || []);

    return {
      hasCase,
      slug: candidate && allowed.has(candidate) ? candidate : null,
    };
  }

  function withCase(href, slug) {
    const url = new URL(href, 'https://portfolio.invalid/');
    url.searchParams.set(CASE_PARAM, slug);
    url.hash = CRAFT_HASH;
    return relativeHref(url);
  }

  function withoutCase(href, { keepCraftHash = true } = {}) {
    const url = new URL(href, 'https://portfolio.invalid/');
    url.searchParams.delete(CASE_PARAM);
    if (keepCraftHash) url.hash = CRAFT_HASH;
    return relativeHref(url);
  }

  return Object.freeze({
    CASE_PARAM,
    CRAFT_HASH,
    inspect,
    withCase,
    withoutCase,
  });
});
