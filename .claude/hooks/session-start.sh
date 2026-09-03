#!/bin/bash
# Готує середовище для сесій Claude Code на вебі: залежності обох застосунків
# і повний LibreOffice.
#
# Навіщо LibreOffice: src/preview.js конвертує договори через soffice, а
# інструменти роботи з таблицями перераховують формули ним же. У базовому
# образі стоїть лише libreoffice-core без модуля Calc — soffice запускається,
# але жодного xlsx не читає й повертає «source file could not be loaded».
set -euo pipefail

# Локально нічого не чіпаємо — хук лише для віддаленого середовища.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

echo "→ Залежності системи рахунків"
npm install --no-audit --no-fund

if [ -f trainer/package.json ]; then
  echo "→ Залежності тренажера"
  (cd trainer && npm install --no-audit --no-fund)
fi

# Модуль Calc: ставимо, лише якщо його немає. Відсутність мережі або apt не
# має валити старт сесії — решта роботи від LibreOffice не залежить.
if [ ! -e /usr/lib/libreoffice/program/scalc ]; then
  echo "→ LibreOffice Calc відсутній, встановлюю"
  if command -v apt-get >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get update -qq || true
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq libreoffice-calc \
      || echo "⚠ Не вдалося встановити libreoffice-calc — таблиці й перегляд документів працюватимуть не повністю"
  else
    echo "⚠ apt-get недоступний — пропускаю LibreOffice Calc"
  fi
else
  echo "→ LibreOffice Calc уже на місці"
fi

# Перевірка, а не припущення: soffice має реально прочитати xlsx.
if command -v soffice >/dev/null 2>&1 && [ -e /usr/lib/libreoffice/program/scalc ]; then
  probe_dir=$(mktemp -d)
  python3 - "$probe_dir/probe.xlsx" <<'PY' 2>/dev/null || true
import sys
try:
    from openpyxl import Workbook
except ImportError:
    sys.exit(0)
wb = Workbook(); wb.active['A1'] = 1; wb.active['A2'] = '=A1+1'
wb.save(sys.argv[1])
PY
  if [ -f "$probe_dir/probe.xlsx" ]; then
    if timeout 120 soffice --headless --norestore --convert-to xlsx \
         --outdir "$probe_dir/out" "$probe_dir/probe.xlsx" >/dev/null 2>&1 \
       && [ -f "$probe_dir/out/probe.xlsx" ]; then
      echo "✓ LibreOffice читає xlsx"
    else
      echo "⚠ LibreOffice не зміг прочитати тестовий xlsx"
    fi
  fi
  rm -rf "$probe_dir"
fi

echo "✓ Середовище готове"
