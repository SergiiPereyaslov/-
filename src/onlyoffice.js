'use strict';

// Редагування договорів прямо в браузері через OnlyOffice Document
// Server — окремий сервіс (зазвичай Docker-контейнер), який сам малює
// редактор Word/Excel у сторінці. Наш сервер лише віддає йому файл на
// редагування і приймає збережений результат назад через callback.
//
// Вимикається, якщо не задано ONLYOFFICE_URL: тоді кнопка «Редагувати»
// просто не з'являється, решта сервісу (перегляд, друк, завантаження)
// працює як і без цієї функції.

const fs = require('node:fs');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const DOCUMENT_TYPES = {
  '.doc': 'word', '.docx': 'word', '.odt': 'word', '.rtf': 'word', '.txt': 'word',
  '.xls': 'cell', '.xlsx': 'cell',
};

// Секрет лише для власних тимчасових посилань (доступ Document Server
// до /raw і /oo-callback) — не має нічого спільного з JWT-секретом
// самого Document Server (ONLYOFFICE_JWT_SECRET нижче). Якщо
// адміністратор не задав окремий секрет — згенерувати один при старті
// процесу: посилання все одно живуть лише в межах однієї сесії
// редагування, тож їхня дійсність після перезапуску сервера не потрібна.
const INTERNAL_SECRET = process.env.ONLYOFFICE_JWT_SECRET || crypto.randomBytes(32).toString('hex');

function isEnabled() {
  return Boolean(process.env.ONLYOFFICE_URL);
}

function documentServerUrl() {
  return String(process.env.ONLYOFFICE_URL || '').replace(/\/+$/, '');
}

// Адреса, за якою САМ Document Server (інший контейнер чи інший сервер)
// звертається до нашого застосунку за файлом і надсилає збережений
// результат. На локальному Docker Desktop (Mac/Windows) це має бути
// http://host.docker.internal:PORT — для контейнера «localhost» означає
// його самого, а не хост-машину, де насправді працює наш сервер.
function callbackBaseUrl(req) {
  const configured = String(process.env.ONLYOFFICE_CALLBACK_URL || '').replace(/\/+$/, '');
  return configured || `${req.protocol}://${req.get('host')}`;
}

function canEdit(ext) {
  return Object.prototype.hasOwnProperty.call(DOCUMENT_TYPES, ext);
}

function documentType(ext) {
  return DOCUMENT_TYPES[ext] || null;
}

// Токен доступу для /raw і /oo-callback: Document Server не має нашої
// сесії-кукі, тож замість неї — коротка (2 год) підписана перепустка
// на конкретний файл і конкретну дію.
function signFileToken(fileId, purpose) {
  return jwt.sign({ fileId: Number(fileId), purpose }, INTERNAL_SECRET, { expiresIn: '2h' });
}

function verifyFileToken(token, fileId, purpose) {
  try {
    const payload = jwt.verify(String(token || ''), INTERNAL_SECRET);
    return payload.fileId === Number(fileId) && payload.purpose === purpose;
  } catch {
    return false;
  }
}

// Ключ версії документа для Document Server: має змінюватися щоразу,
// коли вміст файлу змінюється, інакше редактор покаже застарілу
// кешовану версію. Час зміни файлу на диску якраз для цього підходить —
// окрема колонка в базі не потрібна.
function documentKey(fileId, mtimeMs) {
  return crypto.createHash('sha1').update(`file-${fileId}-${Math.floor(mtimeMs)}`).digest('hex');
}

function buildEditorConfig({ req, fileId, clientId, ext, title, mtimeMs, user }) {
  const base = callbackBaseUrl(req);
  const docUrl = `${base}/clients/${clientId}/files/${fileId}/raw?token=${signFileToken(fileId, 'raw')}`;
  const callbackUrl = `${base}/clients/${clientId}/files/${fileId}/oo-callback?token=${signFileToken(fileId, 'callback')}`;

  const config = {
    document: {
      fileType: ext.replace('.', ''),
      key: documentKey(fileId, mtimeMs),
      title,
      url: docUrl,
      permissions: { edit: true, download: true, print: true },
    },
    documentType: documentType(ext),
    editorConfig: {
      callbackUrl,
      lang: 'uk',
      user: { id: String(user.id), name: user.full_name || user.username },
      customization: { autosave: true, forcesave: false },
    },
  };

  // Токен на весь конфіг додаємо, лише якщо адміністратор явно задав
  // спільний секрет (той самий, що й у JWT_SECRET на Document Server) —
  // інакше Document Server із увімкненим JWT відхилить конфіг без
  // токена, а з вимкненим — просто проігнорує зайве поле. Якщо секрет
  // не задано, найімовірніше й у Document Server JWT вимкнено (типове
  // тестове налаштування без -e JWT_ENABLED=true).
  if (process.env.ONLYOFFICE_JWT_SECRET) {
    config.token = jwt.sign(config, process.env.ONLYOFFICE_JWT_SECRET);
  }

  return config;
}

// Забирає збережений Document Server файл за посиланням з callback і
// записує його поверх наявного — та сама назва на диску, тож історія
// документів і посилання на файл лишаються дійсними.
async function fetchToFile(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} під час завантаження збереженого файлу`);
  const buf = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buf);
}

module.exports = {
  isEnabled, documentServerUrl, canEdit, documentType,
  signFileToken, verifyFileToken, buildEditorConfig, fetchToFile,
};
