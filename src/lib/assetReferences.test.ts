import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('uses PNG and ICO branding assets', async () => {
  const [html, sidebar] = await Promise.all([
    readFile(new URL('../../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../components/Sidebar.tsx', import.meta.url), 'utf8'),
  ]);

  assert.match(html, /type="image\/x-icon" href="\/favicon\.ico"/);
  assert.match(sidebar, /src="\/logo\.png"/);
});
