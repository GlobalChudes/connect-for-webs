# Платежный скрипт для интеграции с CloudPayments

## ✨ Особенности

- ✅ Валидация email
- 💳 Реализация двухстадийной оплаты (первый платёж + рекуррент)
- 👤 Автоматическое создание пользователя после оплаты
- ⚙️ Гибкая настройка через data-атрибуты

## 🚀 Быстрый старт

### 1. Подключение скриптов

Скачайте скрипт reg.js из репозитория и разместите его в папке со скриптами на вашем сайте.

Добавьте в `<head>` или перед закрывающим тегом `</body>` следующий код:

```html
<script src="path/to/reg.js"></script>
<script>window.cpLoadCallback = function() {};</script>
<script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" onload="window.cpLoadCallback()" onerror="console.error('Failed to load CloudPayments SDK')"></script>
```

Пример:
```html
<html>
<head></head>
<body>
    <!-- Код сайта -->
    <script src="path/to/reg.js"></script>
    <script>window.cpLoadCallback = function() {};</script>
    <script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" onload="window.cpLoadCallback()" onerror="console.error('Failed to load CloudPayments SDK')"></script>
</body>
</html>
```

Вместо `path/to/reg.js` укажите свой путь до скрипта.


### 2. Добавление необходимых элементов
- Найдите в коде вашего сайта - поле для ввода email (`input`) и добавьте в него `data-payment-email`

Пример:

```html
<input 
  class="your-custom-class"
  type="email"
  placeholder="Введите ваш email"
  required
  data-payment-email>
```

- Найдите в коде вашего сайта - кнопку отправки формы (`button` или `div`) и добавьте в неё `data-payment-submit`

Пример:

```html
<button 
  class="your-button-class"
  data-payment-submit>
  Получить доступ
</button>
```
