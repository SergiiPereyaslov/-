'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { canPreview } = require('../src/preview');

test('canPreview — PDF і зображення показуються без конвертації', () => {
  assert.equal(canPreview('.pdf'), true);
  assert.equal(canPreview('.jpg'), true);
  assert.equal(canPreview('.jpeg'), true);
  assert.equal(canPreview('.png'), true);
});

test('canPreview — офісні формати підлягають конвертації', () => {
  assert.equal(canPreview('.doc'), true);
  assert.equal(canPreview('.docx'), true);
  assert.equal(canPreview('.rtf'), true);
  assert.equal(canPreview('.odt'), true);
  assert.equal(canPreview('.xls'), true);
  assert.equal(canPreview('.xlsx'), true);
  assert.equal(canPreview('.txt'), true);
});

test('canPreview — невідомі розширення не підтримуються', () => {
  assert.equal(canPreview('.exe'), false);
  assert.equal(canPreview(''), false);
});
