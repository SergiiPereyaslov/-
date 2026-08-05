# Vendor links — where to look, and what to look for

Client asked for links, not a verdict: «дай посилання на сайти щоб я мав
уявлення які мені сервіси шукати». This is a directory, ordered by the seven
questions in `STT-GUIDE.md`.

**Status of every claim here:** collected from vendor marketing and docs on
2026-08-05 via web search. Several vendor doc sites returned HTTP 403 to
automated fetching, so entries marked `[UNVERIFIED]` come from search snippets
rather than a page read. Nothing here replaces the recording test.

---

## 1. STT — the shortlist

The gate is **streaming + Ukrainian**, not «supports Ukrainian». Sorted by how
likely they are to survive that gate.

| Vendor | Ukrainian streaming | Why it is on the list |
|---|---|---|
| Soniox | claimed yes | Публікує прямі порівняння саме по українській |
| ElevenLabs Scribe v2 Realtime | claimed yes | 150 ms, укр. в списку «≤5% WER» |
| Gladia Solaria | claimed yes `[UNVERIFIED]` | Єдиний, хто бенчмаркає на 8 кГц телефонії |
| Deepgram Nova-3 | yes | Укр. додано; але Flux (розмовна) — без укр. |
| Speechmatics | claimed yes | Окрема сторінка укр., real-time продукт |
| Google Chirp 2 / 3 | ймовірно | На цьому побудований KeyCall |
| Azure Speech | ймовірно `[UNVERIFIED]` | Є укр. TTS-голоси, STT треба перевірити |
| AssemblyAI | **ні** для Universal-Streaming | Укр. лише через Whisper-Streaming |

### Soniox
- Ukrainian STT: https://soniox.com/speech-to-text/ukrainian
- Порівняння з Google по укр.: https://soniox.com/compare/soniox-vs-google/ukrainian
- Заявляє точність по укр. вищу за AssemblyAI, ElevenLabs, OpenAI, Deepgram,
  Speechmatics, AWS, Google, Azure. Це маркетинг вендора — але вони єдині, хто
  взагалі публікує укр. порівняння.
- Окремо заявлено розпізнавання **цифр, кодів, ID** — це прямо наше питання
  про тираж.

### ElevenLabs
- Scribe v2 Realtime (анонс): https://elevenlabs.io/blog/introducing-scribe-v2-realtime
- Realtime STT продукт: https://elevenlabs.io/realtime-speech-to-text
- Українська сторінка: https://elevenlabs.io/speech-to-text/ukrainian
- Моделі: https://elevenlabs.io/docs/overview/models
- 150 ms латентність, 90+ мов, автовизначення мови зі зміною **посеред
  розмови** — це і є відповідь на суржик, якщо працює.

### Gladia
- Real-time продукт: https://www.gladia.io/product/real-time
- Contact-center / CCaaS: https://www.gladia.io/use-cases/ccaas
- Solaria-3 (європейські мови): https://www.gladia.io/blog/solaria-3-speech-to-text-model-for-european-languages
- Код-світчинг: https://www.gladia.io/blog/code-switching-language-coverage-limitations
- Список мов: https://docs-v1.gladia.io/reference/supported-languages
- **Чому важливо:** єдиний вендор, який публікує результат на Switchboard —
  бенчмарку зі здеградованого 8 кГц телефонного аудіо (33.9% WER, #1). Решта
  показує цифри зі студійних записів. Українську в списку треба підтвердити.

### Deepgram
- Мови: https://developers.deepgram.com/docs/language
- Огляд моделей і мов: https://developers.deepgram.com/docs/models-languages-overview
- Flux vs Nova-3: https://developers.deepgram.com/docs/flux/flux-nova-3-comparison
- Flux Multilingual: https://developers.deepgram.com/docs/flux/language-prompting
- Мультимовний код-світчинг: https://developers.deepgram.com/docs/multilingual-code-switching
- **Головне тут — пастка №4 з гайда.** Nova-3 українську має, і в стрімінгу
  теж. Але **Flux** — їхня розмовна модель, та сама, що вміє визначати кінець
  репліки — станом на квітень 2026 підтримує 10 мов: англійська, іспанська,
  французька, німецька, гінді, **російська**, португальська, японська,
  італійська, нідерландська. Української немає.
  Джерело: https://deepgram.com/learn/introducing-flux-multilingual
- Тобто Deepgram для нас = Nova-3 + власне визначення кінця репліки збоку.

### Speechmatics
- Українська: https://www.speechmatics.com/speech-to-text/ukrainian
- Real-time: https://www.speechmatics.com/product/real-time
- Мови (56+): https://www.speechmatics.com/languages
- Контакт-центри: https://www.speechmatics.com/use-cases/contact-center-solutions

### Google Cloud
- Chirp 2: https://docs.cloud.google.com/speech-to-text/docs/models/chirp-2
- Chirp 3: https://docs.cloud.google.com/speech-to-text/docs/models/chirp-3
- Release notes: https://docs.cloud.google.com/speech-to-text/docs/release-notes
- Chirp 2 вміє streaming (не тільки batch) — перевіряти треба саме перетин
  «streaming + uk-UA», бо це різні таблиці в доках.
- **KeyCall побудований на Google Speech API** — тобто це нижня планка якості,
  яку ми маємо перевершити, а не орієнтир.

### Azure
- Мови й голоси: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- STT огляд: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-to-text

### AssemblyAI — читати, щоб не витрачати час
- Мови стрімінгу (FAQ): https://www.assemblyai.com/docs/faq/language-support-for-real-time-transcription
- Мультимовний стрімінг: https://www.assemblyai.com/docs/streaming/universal-streaming/multilingual-transcription
- Universal-Streaming мультимовний = EN, ES, FR, DE, IT, PT. **Українською —
  ні.** Укр. доступна лише через Whisper-Streaming, який повільніший.
- Це найчистіший приклад пастки №1 з гайда: на головній сторінці «99+ мов», а
  в потоковій розмовній моделі шість.

### OpenAI
- Realtime transcription: https://developers.openai.com/api/docs/guides/realtime-transcription
- gpt-4o-transcribe: https://developers.openai.com/api/docs/models/gpt-4o-transcribe
- Speech-to-text guide: https://developers.openai.com/api/docs/guides/speech-to-text

---

## 2. Кінець репліки — окремий шар, окремі посилання

Пастка №4 не вирішується вибором STT. Якщо взятий STT не вміє визначати кінець
репліки (а більшість не вміє), цей шар ставиться окремо.

- LiveKit turn detector (open weights, мультимовна версія):
  https://huggingface.co/livekit/turn-detector
- Документація: https://docs.livekit.io/agents/logic/turns/turn-detector/
- Як воно працює і навіщо: https://livekit.com/blog/using-a-transformer-to-improve-end-of-turn-detection
- Результат «−39% перебивань»: https://blog.livekit.io/improved-end-of-turn-model-cuts-voice-ai-interruptions-39/
- PyPI плагін: https://pypi.org/project/livekit-plugins-turn-detector/

Мультимовна версія покриває англійську + 13 мов. **Чи є там українська —
треба перевірити на сторінці моделі** (автоматичне читання сторінки
заблоковано, 403). Якщо немає — залишається VAD + поріг тиші, і поріг
доведеться підбирати на записах Дніпрографа.

- Silero VAD (детектор наявності мовлення, мовно-незалежний):
  https://github.com/snakers4/silero-vad

---

## 3. TTS — голос агента

- **Respeecher** — український стартап, TTS API з українською **і суржиком**:
  https://www.respeecher.com/real-time-tts-api
- Про запуск: https://dou.ua/lenta/news/respeecher-ukrainian-ai-language/
- ElevenLabs TTS API: https://elevenlabs.io/text-to-speech-api
- Azure укр. голоси (перелік у таблиці локалей): див. language-support вище

Respeecher варто перевірити першим: єдиний, хто прямо заявляє суржик, і вони
українські — тобто питання підтримки й рахунків простіше.

---

## 4. Оркестрація — платформи голосових агентів

Це шар, який з'єднує телефонію + STT + LLM + TTS. Або беремо готовий, або
збираємо самі.

- Vapi мультимовність: https://docs.vapi.ai/customization/multilingual
- Vapi speech config (вибір STT): https://docs.vapi.ai/customization/speech-configuration
- Vapi SIP trunking: https://docs.vapi.ai/advanced/sip/sip-trunk
- Vapi ↔ Gladia: https://docs.vapi.ai/providers/transcriber/gladia
- Vapi ↔ Speechmatics: https://docs.vapi.ai/providers/transcriber/speechmatics
- LiveKit Agents: https://docs.livekit.io/agents/
- Порівняння оркестраторів: https://www.assemblyai.com/blog/orchestration-tools-ai-voice-agents
- Vapi vs Retell vs LiveKit vs Pipecat: https://particula.tech/blog/vapi-vs-retell-vs-livekit-vs-pipecat-voice-agent-platform

Сторінки провайдерів у Vapi корисні окремо: вони показують, **який STT з якою
мовою реально працює в бойовому голосовому агенті**, а не в загальному списку
мов вендора.

---

## 5. Телефонія — номер і SIP

- Zadarma SIP trunk: https://zadarma.com/en/services/calls/sip-trunk/
- Zadarma віртуальний номер України: https://zadarma.com/en/tariffs/numbers/ukraine/
- Vega Telecom SIP: https://vega.ua/eng/for_office/sip_trunk
- Список SIP-провайдерів України (3CX): https://www.3cx.com/partners/sip-trunks/ukraine/

Нагадування з попереднього кроку: на номер, з якого дзвонимо, будуть
передзвонювати. Питання «куди веде цей номер» вирішується разом із вибором
номера, не після.

---

## 6. Конкуренти — що вони показують клієнту

Дивитись не на технологію, а на **те, які поля вони показують у результатах
дзвінка**. Це найдешевша специфікація для нашого веб-інтерфейсу.

- KeyCall: https://k-call.com/ua
- **KeyCall API: https://k-call.com/ua/api** ← найцінніше з цього списку
- KeyCall по нішах (послуги): https://k-call.com/ua/niches/poslugi
- VoIPTime робокол: https://www.voiptime.net/uk/robocall.html
- Ringostat AI-агент: https://focus.ua/uk/ukraine/760549-robit-tisyachi-personalizovanih-dzvinkiv-na-den-ringostat-predstavila-golosovogo-ai-agenta-shcho-avtomatizuye-do-90-rutinnih-komunikaciy-biznesu

---

## 7. Незалежні бенчмарки й відкриті моделі

- Open ASR Leaderboard: https://huggingface.co/spaces/hf-audio/open_asr_leaderboard
- Стаття про методологію: https://huggingface.co/blog/open-asr-leaderboard
- Огляд відкритих ASR-моделей 2026: https://www.marktechpost.com/2026/07/23/best-open-speech-recognition-asr-models-in-2026-wer-languages-latency-and-license-compared/
- **Українські відкриті моделі й датасети (найповніший каталог):**
  https://github.com/egorsmkv/speech-recognition-uk

Останнє посилання — українська спільнота, яка веде каталог ASR і TTS моделей
для української. Корисно як довідник і як запасний варіант, якщо комерційні
вендори виявляться слабкими на суржику.

Застереження щодо лідербордів: мультимовний трек Open ASR Leaderboard —
німецька, французька, італійська, іспанська, португальська. **Української в
ньому немає.** Тобто навіть незалежний бенчмарк наше питання не закриває.

---

## Що з цього випливає для тесту

Порядок перевірки на записах Дніпрографа:

1. Soniox, ElevenLabs Scribe v2 Realtime, Gladia — три перші, у всіх є демо.
2. Deepgram Nova-3 — четвертим, з поправкою, що кінець репліки доведеться
   робити окремо.
3. Speechmatics, Google, Azure — якщо перші чотири не дали результату.
4. AssemblyAI Universal-Streaming — не витрачати час, української немає.

Слухати чотири речі, як домовлялись: цифри (тираж!), суржик, поліграфічні
терміни, поведінка на поганому зв'язку.
