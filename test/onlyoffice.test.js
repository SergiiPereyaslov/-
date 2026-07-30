'use strict';

const { test } = require('node:test');
const assert = require('node:assert');

test('canEdit/documentType — офісні формати редагуються, інші ні', () => {
  delete require.cache[require.resolve('../src/onlyoffice')];
  const oo = require('../src/onlyoffice');

  assert.equal(oo.canEdit('.docx'), true);
  assert.equal(oo.documentType('.docx'), 'word');
  assert.equal(oo.canEdit('.xlsx'), true);
  assert.equal(oo.documentType('.xlsx'), 'cell');
  assert.equal(oo.canEdit('.txt'), true);
  assert.equal(oo.canEdit('.pdf'), false);
  assert.equal(oo.canEdit('.jpg'), false);
  assert.equal(oo.documentType('.pdf'), null);
});

test('isEnabled — залежить лише від ONLYOFFICE_URL', () => {
  const prev = process.env.ONLYOFFICE_URL;
  try {
    delete process.env.ONLYOFFICE_URL;
    delete require.cache[require.resolve('../src/onlyoffice')];
    let oo = require('../src/onlyoffice');
    assert.equal(oo.isEnabled(), false);

    process.env.ONLYOFFICE_URL = 'http://localhost:8082';
    assert.equal(oo.isEnabled(), true);
    assert.equal(oo.documentServerUrl(), 'http://localhost:8082');
  } finally {
    if (prev === undefined) delete process.env.ONLYOFFICE_URL; else process.env.ONLYOFFICE_URL = prev;
  }
});

test('documentServerUrl — прибирає кінцевий слеш', () => {
  const prev = process.env.ONLYOFFICE_URL;
  try {
    process.env.ONLYOFFICE_URL = 'http://localhost:8082/';
    delete require.cache[require.resolve('../src/onlyoffice')];
    const oo = require('../src/onlyoffice');
    assert.equal(oo.documentServerUrl(), 'http://localhost:8082');
  } finally {
    if (prev === undefined) delete process.env.ONLYOFFICE_URL; else process.env.ONLYOFFICE_URL = prev;
  }
});

test('signFileToken/verifyFileToken — підписаний токен проходить лише для свого файлу й дії', () => {
  delete require.cache[require.resolve('../src/onlyoffice')];
  const oo = require('../src/onlyoffice');

  const token = oo.signFileToken(42, 'raw');
  assert.equal(oo.verifyFileToken(token, 42, 'raw'), true);
  assert.equal(oo.verifyFileToken(token, 43, 'raw'), false);
  assert.equal(oo.verifyFileToken(token, 42, 'callback'), false);
  assert.equal(oo.verifyFileToken('не-токен', 42, 'raw'), false);
  assert.equal(oo.verifyFileToken('', 42, 'raw'), false);
});

test('buildEditorConfig — без ONLYOFFICE_JWT_SECRET токен у конфігу відсутній', () => {
  const prevSecret = process.env.ONLYOFFICE_JWT_SECRET;
  const prevUrl = process.env.ONLYOFFICE_URL;
  try {
    delete process.env.ONLYOFFICE_JWT_SECRET;
    process.env.ONLYOFFICE_URL = 'http://localhost:8082';
    delete require.cache[require.resolve('../src/onlyoffice')];
    const oo = require('../src/onlyoffice');

    const req = { protocol: 'http', get: () => 'localhost:3000' };
    const config = oo.buildEditorConfig({
      req, fileId: 5, clientId: 8, ext: '.docx', title: 'Договір.docx',
      mtimeMs: 1000, user: { id: 1, full_name: 'Тест Тестович' },
    });

    assert.equal(config.token, undefined);
    assert.equal(config.document.fileType, 'docx');
    assert.equal(config.documentType, 'word');
    assert.match(config.document.url, /\/clients\/8\/files\/5\/raw\?token=/);
    assert.match(config.editorConfig.callbackUrl, /\/clients\/8\/files\/5\/oo-callback\?token=/);
  } finally {
    if (prevSecret === undefined) delete process.env.ONLYOFFICE_JWT_SECRET; else process.env.ONLYOFFICE_JWT_SECRET = prevSecret;
    if (prevUrl === undefined) delete process.env.ONLYOFFICE_URL; else process.env.ONLYOFFICE_URL = prevUrl;
  }
});

test('buildEditorConfig — з ONLYOFFICE_JWT_SECRET конфіг підписаний і перевіряється', () => {
  const jwt = require('jsonwebtoken');
  const prevSecret = process.env.ONLYOFFICE_JWT_SECRET;
  const prevUrl = process.env.ONLYOFFICE_URL;
  try {
    process.env.ONLYOFFICE_JWT_SECRET = 'секрет-для-тесту';
    process.env.ONLYOFFICE_URL = 'http://localhost:8082';
    delete require.cache[require.resolve('../src/onlyoffice')];
    const oo = require('../src/onlyoffice');

    const req = { protocol: 'http', get: () => 'localhost:3000' };
    const config = oo.buildEditorConfig({
      req, fileId: 5, clientId: 8, ext: '.xlsx', title: 'Кошторис.xlsx',
      mtimeMs: 2000, user: { id: 2, full_name: '' },
    });

    assert.ok(config.token);
    const decoded = jwt.verify(config.token, 'секрет-для-тесту');
    assert.equal(decoded.document.key, config.document.key);
    assert.equal(config.editorConfig.user.name, undefined); // full_name порожній рядок — не задано
  } finally {
    if (prevSecret === undefined) delete process.env.ONLYOFFICE_JWT_SECRET; else process.env.ONLYOFFICE_JWT_SECRET = prevSecret;
    if (prevUrl === undefined) delete process.env.ONLYOFFICE_URL; else process.env.ONLYOFFICE_URL = prevUrl;
  }
});

test('buildEditorConfig — ключ документа міняється разом із mtime файлу', () => {
  process.env.ONLYOFFICE_URL = process.env.ONLYOFFICE_URL || 'http://localhost:8082';
  delete require.cache[require.resolve('../src/onlyoffice')];
  const oo = require('../src/onlyoffice');
  const req = { protocol: 'http', get: () => 'localhost:3000' };
  const base = { req, fileId: 1, clientId: 1, ext: '.docx', title: 'a.docx', user: { id: 1, full_name: 'X' } };

  const c1 = oo.buildEditorConfig({ ...base, mtimeMs: 1000 });
  const c2 = oo.buildEditorConfig({ ...base, mtimeMs: 2000 });
  const c3 = oo.buildEditorConfig({ ...base, mtimeMs: 1000 });

  assert.notEqual(c1.document.key, c2.document.key);
  assert.equal(c1.document.key, c3.document.key);
});
