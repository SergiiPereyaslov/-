'use strict';

// Перегляд файлів договорів прямо в браузері (без завантаження на диск).
//
// PDF і зображення браузер показує сам. Word/Excel/RTF/ODT/TXT такого не
// вміють — для них на льоту готуємо PDF-версію через LibreOffice
// (headless-режим, встановлений окремо на сервері). Результат кешується:
// повторний перегляд того самого файлу вже не запускає конвертацію.

const path = require('node:path');
const fs = require('node:fs');
const { execFile } = require('node:child_process');
const { UPLOAD_DIR } = require('./uploads');

const PREVIEW_DIR = path.join(UPLOAD_DIR, 'previews');
if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

// Типи, які браузер показує сам — конвертація не потрібна.
const NATIVE_INLINE = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
// Типи, які вміє сконвертувати LibreOffice у PDF для перегляду.
const CONVERTIBLE = new Set(['.doc', '.docx', '.rtf', '.odt', '.xls', '.xlsx', '.txt']);

const CONTENT_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
};

let sofficeConfirmed = false; // кешуємо лише підтверджену наявність.

// Чи встановлено LibreOffice на цьому сервері. Успішний результат
// кешуємо назавжди (перевірка більше не потрібна); невдалий — ні:
// перевірка дешева (~0.1с), а кешування збою назавжди означало б, що
// одна випадкова невдача на старті ламає перегляд до перезапуску сервера.
function sofficeAvailable() {
  if (sofficeConfirmed) return Promise.resolve(true);
  return new Promise((resolve) => {
    execFile('soffice', ['--version'], { timeout: 10000 }, (err) => {
      sofficeConfirmed = !err;
      resolve(sofficeConfirmed);
    });
  });
}

function canPreview(ext) {
  return NATIVE_INLINE.has(ext) || CONVERTIBLE.has(ext);
}

// Готує PDF-версію для перегляду. Повертає шлях до файлу, який можна
// віддати клієнту, або null, якщо перегляд неможливий (тип не
// підтримується або LibreOffice не встановлено — тоді викликач має
// запропонувати звичайне завантаження).
async function previewPath(storedName, ext) {
  if (NATIVE_INLINE.has(ext)) {
    return { file: path.join(UPLOAD_DIR, storedName), contentType: CONTENT_TYPES[ext] };
  }
  if (!CONVERTIBLE.has(ext)) return null;

  const cached = path.join(PREVIEW_DIR, `${storedName}.pdf`);
  if (fs.existsSync(cached)) return { file: cached, contentType: 'application/pdf' };

  if (!(await sofficeAvailable())) return null;

  const src = path.join(UPLOAD_DIR, storedName);
  await convertToPdf(src, PREVIEW_DIR);

  // LibreOffice називає результат за іменем вхідного файлу, не за нашим
  // бажаним ім'ям — перейменовуємо в очікуване кешоване ім'я.
  const producedName = path.basename(storedName, ext) + '.pdf';
  const produced = path.join(PREVIEW_DIR, producedName);
  if (fs.existsSync(produced) && produced !== cached) {
    fs.renameSync(produced, cached);
  }
  return fs.existsSync(cached) ? { file: cached, contentType: 'application/pdf' } : null;
}

function convertToPdf(srcFile, outDir) {
  return new Promise((resolve, reject) => {
    execFile(
      'soffice',
      ['--headless', '--convert-to', 'pdf', '--outdir', outDir, srcFile],
      { timeout: 30000 },
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// Прибирає кешовану PDF-версію (при видаленні самого файлу).
function removePreview(storedName) {
  const cached = path.join(PREVIEW_DIR, `${storedName}.pdf`);
  fs.rmSync(cached, { force: true });
}

module.exports = { canPreview, previewPath, removePreview, sofficeAvailable };
