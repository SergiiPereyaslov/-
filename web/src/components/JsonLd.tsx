/**
 * Вставляє готовий об'єкт розмітки як <script type="application/ld+json">.
 *
 * Єдина точка в проєкті, де JSON потрапляє в розмітку скриптом, — тому
 * екранування живе тут, а не в кожного, хто малює JSON-LD.
 *
 * Чому самого JSON.stringify не досить: він не чіпає `<`, `>` і `/`, а
 * всередині <script> браузер шукає рядок `</script>` незалежно від того,
 * що той лежить у JSON-рядку. Значення для розмітки беруться з БД (назви
 * категорій і товарів, питання FAQ), тож текст із адмінки міг би закрити
 * тег і відкрити свій. CSP тут не рубіж: script-src має 'unsafe-inline'
 * (див. коментар у next.config.ts), тому інлайн-скрипт виконався б.
 *
 * \u003c замість символу лишається валідним JSON і читається парсерами
 * пошукових систем так само, як звичайний `<`.
 */
const escapeForScript = (json: string) =>
  json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\//g, '\\/');

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeForScript(JSON.stringify(data)) }}
    />
  );
}
