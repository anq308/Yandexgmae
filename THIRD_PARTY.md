# Зависимости

В игровую сборку не включены сторонние графические или музыкальные ресурсы. Canvas-графика, пиксельные SVG-иконки и Web Audio созданы в исходниках проекта.

Шрифты (входят в игровую сборку как файлы WOFF2):

- [Tiny5](https://fonts.google.com/specimen/Tiny5) через `@fontsource/tiny5` — SIL Open Font License 1.1.
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) через `@fontsource/press-start-2p` — SIL Open Font License 1.1.

Инструменты разработки (не отправляются в игровой ZIP):

- [Vite](https://github.com/vitejs/vite/blob/main/LICENSE) — MIT.
- [Playwright](https://github.com/microsoft/playwright/blob/main/LICENSE) — Apache-2.0.
- Транзитивные зависимости и точные версии зафиксированы в `package-lock.json`; их лицензии находятся в соответствующих пакетах `node_modules`.

Яндекс SDK загружается платформой во время работы. В проекте нет копии SDK или имитации рекламы. Тестовый SDK находится только в браузерных тестах и не включается в production-сборку.
