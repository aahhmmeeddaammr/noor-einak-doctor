import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
const key = 'doctor-portal-ui';
const bootstrap = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
const runtime = ts.transpile(readFileSync(new URL('../src/lib/theme.ts', import.meta.url), 'utf8'), { module: ts.ModuleKind.ESNext });

function setup({ saved, system = 'light', blocked = false } = {}) {
  let value = saved;
  let systemDark = system === 'dark';
  const listeners = {};
  const root = { classList: { toggle: (_, dark) => { root.dark = dark; } }, style: {} };
  const media = { get matches() { return systemDark; }, addEventListener: (_, fn) => { listeners.media = fn; } };
  const localStorage = {
    getItem: () => { if (blocked) throw new Error('Storage blocked'); return value ?? null; },
    setItem: (_, next) => { if (blocked) throw new Error('Storage blocked'); value = next; },
  };
  const context = { localStorage, document: { documentElement: root }, window: {
    matchMedia: () => media,
    addEventListener: (event, fn) => { listeners[event] = fn; },
  } };
  runInNewContext(bootstrap, context);
  const firstPaint = root.dark;
  runInNewContext(runtime.replace(/^export /gm, '') + '\nthis.api = { getInitialTheme, saveTheme, initializeTheme };', context);
  let state = { theme: context.api.getInitialTheme() };
  let notify;
  const store = { getState: () => state, subscribe: (fn) => { notify = fn; }, setState: (next) => { state = next; notify?.(state); } };
  context.api.initializeTheme(store);
  return { root, store, firstPaint,
    choose: (theme) => { context.api.saveTheme(theme); store.setState({ theme }); },
    system: (theme) => { systemDark = theme === 'dark'; listeners.media({ matches: systemDark }); },
    storage: (next, eventKey = key) => { value = next; listeners.storage({ key: eventKey }); },
    saved: () => value,
  };
}

for (const theme of ['light', 'dark']) {
  test(`saved ${theme} applies before React and overrides system`, () => {
    const env = setup({ saved: JSON.stringify({ state: { theme } }), system: theme === 'light' ? 'dark' : 'light' });
    assert.equal(env.firstPaint, theme === 'dark');
    assert.equal(env.root.style.colorScheme, theme);
  });
}

test('system preference initializes and updates an unsaved theme', () => {
  const env = setup({ system: 'dark' });
  assert.equal(env.firstPaint, true);
  env.system('light');
  assert.equal(env.root.dark, false);
});

test('explicit choice persists and wins over later system changes', () => {
  const env = setup();
  env.choose('dark');
  assert.equal(JSON.parse(env.saved()).state.theme, 'dark');
  env.system('light');
  assert.equal(env.root.dark, true);
});

test('other tabs update the theme; removing preference restores system behavior', () => {
  const env = setup();
  env.storage(JSON.stringify({ state: { theme: 'dark' } }));
  assert.equal(env.root.dark, true);
  env.storage(null);
  assert.equal(env.root.dark, false);
  env.system('dark');
  assert.equal(env.root.dark, true);
});

for (const saved of ['{broken', JSON.stringify({ state: { theme: 'invalid' } })]) {
  test(`invalid saved value falls back safely: ${saved}`, () => {
    const env = setup({ saved, system: 'dark' });
    assert.equal(env.firstPaint, true);
    assert.equal(env.root.dark, true);
  });
}

test('blocked storage permits switching and preserves the in-memory choice', () => {
  const env = setup({ blocked: true });
  env.choose('dark');
  env.system('light');
  assert.equal(env.root.dark, true);
});
