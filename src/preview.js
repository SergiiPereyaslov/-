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

// «soffice» на PATH працює на Linux-серверах і якщо LibreOffice стояв
// через `brew install --cask` (він додає символьне посилання в PATH).
// Але звичайне встановлення через інсталятор (macOS: перетягнути .app у
// Programs; Windows: майстер встановлення) PATH не чіпає — бінарник
// лишається лише в теці програми, тож перевіряємо і типові прямі шляхи
// для обох ОС (менеджери працюють і на Mac, і на Windows). Кандидат, що
// не існує на поточній ОС, просто швидко провалюється — нешкідливо.
const CANDIDATE_COMMANDS = [
  'soffice',
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/opt/homebrew/bin/soffice',
  '/usr/local/bin/soffice',
  '/usr/bin/soffice',
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

let resolvedCommand = null; // кешуємо лише підтверджений робочий шлях.

// Чи встановлено LibreOffice на цьому сервері. Успішний результат
// кешуємо назавжди (перевірка більше не потрібна); невдалий — ні:
// перевірка дешева (~0.1с), а кешування збою назавжди означало б, що
// одна випадкова невдача на старті ламає перегляд до перезапуску сервера.
function sofficeAvailable() {
  return resolveSofficeCommand().then((cmd) => !!cmd);
}

function resolveSofficeCommand() {
  if (resolvedCommand) return Promise.resolve(resolvedCommand);
  return tryCandidates(CANDIDATE_COMMANDS.slice());
}

function tryCandidates(candidates) {
  if (candidates.length === 0) return Promise.resolve(null);
  const [cmd, ...rest] = candidates;
  return new Promise((resolve) => {
    execFile(cmd, ['--version'], { timeout: 10000 }, (err) => {
      if (!err) {
        resolvedCommand = cmd;
        resolve(cmd);
      } else {
        resolve(tryCandidates(rest));
      }
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

async function convertToPdf(srcFile, outDir) {
  const cmd = await resolveSofficeCommand();
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
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
