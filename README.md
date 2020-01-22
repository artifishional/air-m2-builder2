# air-m2-builder2

## Использование

### Установка

`npm install air-m2-builder2 --save-dev`

### Подключение

```json
{
  "scripts": {
    "build": "node --experimental-modules ./node_modules/air-m2-builder2/bin/server.mjs",
    "dev": "node --experimental-modules ./node_modules/air-m2-builder2/bin/server.mjs --dev-server"
  }
}
```

### Запуск

`npm run dev`

#### Параметры запуска

- `--revision 111` - номер ревизии
- `--dev-server` - запуск отладочного сервера
- `--build-mode [production|development]` - режим сборки скриптов webpack
- `--m2units m2unit.prod` - переопределит зависимости
- `--direct-dependencies-only` - поиск и сборка только прямых зависемостей (из корня текущего проекта в файлах m2units.json и/или package.json#m2units)

### Командная строка

- `clear cache [all|key]` - очищает кэш установки целиком, если без параметров или `all`, или конкретный ключ `key`

## Конфигурация

`air-m2.config.json`

```json
{
  "entry-unit": "master", //main m2 script data-arg
  "port": 9000,
  "latency": [{ "regex": "index\\.html", "delay": 1000 }]
}
```

Модуль, путь к которому удовлетворит условию регулярного выражения `regex`, будет выдан с задержкой `delay`.
Поиск срабатывает только по первому совпадению.

## Точка входа

`lib/m2.js` и `lib/m2.html` - будут найдены в корне проекта.

## Встроенные стили

Можно подключать стили, написанные с препроцессором SASS/SCSS, прямо в html страницу.
Для этого в любом месте кода нужно создать тег `style` с обязательным указанием атрибута `type="text/scss"`.
Стили будут скомпилированы в CSS каждый по отдельности.

```html
<style type="text/scss">
  $clr: red;
  .block {
    color: $clr;
  }
</style>
```

#### Компиляция стилей
при компиляции стилей url(<адрес изображения>) заменяется на /* \<image url="${<адрес изображения>}"> */,
для замены на фронте регулярками

## Supported env's vars
STATIC_VERSION

## Supported local's vars
--revision:<build-number>

## debug вложения

Вкрапления для отладки:
``` 
/*<@debug>*/
код для отладки в production
/*</@debug>*/
```
