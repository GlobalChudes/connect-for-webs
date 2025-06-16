// Конфигурация:
// Элементы страницы
const EMAIL_INPUT_SELECTOR = '[data-payment-email]'; // Поле ввода email
const SUBMIT_BUTTON_SELECTOR = '[data-payment-submit]'; // Кнопка отправки формы

// Платежные параметры
const INITIAL_AMOUNT = 39.00; // Первоначальный платеж
const PRODUCT_LABEL = 'Покупка доступа к курсу на GlobalChudes'; // Описание товара

// API
const PAYMENT_ENDPOINT = 'https://globalchudes.ru/payment/check-card';
const BAD_PAYMENT_ENDPOINT = 'https://globalchudes.ru/payment/missing-users';
const SUCCESS_REDIRECT_URL = "https://globalchudes.ru/payment/login";


async function register(e) {
    e.preventDefault();

    const emailInput = document.querySelector(EMAIL_INPUT_SELECTOR);
    const email = emailInput.value.trim();

    // Проверка валидности email
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    if (!isValidEmail(email)) {
        alert("Пожалуйста, введите корректный email!");
        return;
    }

    // Проверяем наличие CloudPayments
    if (typeof cp === 'undefined' || !cp.CloudPayments) {
        throw new Error('Сервис оплаты временно недоступен');
    }

    // Извлечение UTM-меток из URL
    const urlParams = new URLSearchParams(window.location.search);
    let params = {};
    urlParams.forEach((val, key) => {
        params[key] = val;
    })

    // Создаем платеж в системе
    const paymentResponse = await fetch(PAYMENT_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
            email: email,
            query: params
        }),
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Accept': 'application/json'
        },
    });

    const responseData = await paymentResponse.json();
    const publicId  = responseData.publicId;

    if (!responseData.success) {
        for(let key in responseData.message) {
            new Notify({
                status: 'error',
                text: responseData.message[key][0],
                autotimeout: 2000,
            })
        }
        return;
    }

    const queryText = window.sessionStorage.getItem("query");
    const query = JSON.parse(queryText);

    const now = new Date();
    const reccurentDate = now.setDate(now.getDate() + 7);

    const widget = new cp.CloudPayments({
        yandexMetrika: false,
        googleAnalytics: false,
        applePaySupport: false,
        configuration: {
            common: {
                successRedirect: false,
                failRedirect: false
            },
        }
    });

    const customerReceipt = {
        Items: [
            {
                label: PRODUCT_LABEL,
                price: 399.00,
                quantity: 1.00,
                amount: 399.00,
                vat: null,
                method: 1,
                object: 4
            }
        ],
        taxationSystem: 2,
        email: email,
        amounts: {
            electronic: 399.00,
        }
    };

    const receipt = {
        Items: [
            {
                label: PRODUCT_LABEL,
                price: INITIAL_AMOUNT,
                quantity: 1.00,
                amount: INITIAL_AMOUNT,
                vat: null,
                method: 1,
                object: 4
            }
        ],
        taxationSystem: 2,
        email: email,
        amounts: {
            electronic: INITIAL_AMOUNT,
        }
    };

    const data = {
        query: query,
    };

    data.CloudPayments = {
        CustomerReceipt: receipt,
        recurrent: {
            interval: 'Day',
            period: 1,
            amount: 399.00,
            startDate:"/Date("+reccurentDate+")/",
            customerReceipt: customerReceipt
        }
    };

    const result = await new Promise((resolve, reject) => {
        try {
            widget.charge({
                    publicId: publicId,
                    description: PRODUCT_LABEL,
                    amount: INITIAL_AMOUNT,
                    currency: 'RUB',
                    accountId: email,
                    autoClose: 3,
                    skin: "modern",
                    requireEmail: true,
                    email: email,
                    data: data,
                    payer: {
                        firstName: 'Пользователь',
                        email: email,
                        phone: ''
                    }
                },
                function (options) { // success
                    resolve({success: true, ...options});
                },
                function (reason, options) { // fail
                    if (reason === 'User has cancelled') {
                        resolve({success: false, cancelled: true});
                        return;
                    } else {
                        reject(new Error(reason || 'Ошибка оплаты'));
                    }
                }
            );
        } catch (e) {
            reject(new Error('Не удалось открыть платежную форму'));
        }
    });

    if (result.success) {
        // Создаем пользователя
        const paymentResponse = await fetch(PAYMENT_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                query: params,
                register: true
            }),
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': 'application/json'
            },
        });

        const responseData = await paymentResponse.json();
        const token  = responseData.token;

        setTimeout(() => {
            window.location.href = `${SUCCESS_REDIRECT_URL}?email=${email}&token=${token}`;
        }, 300);
    } else if (result.cancelled) {
        console.log('Payment cancelled by user');
        await fetch(BAD_PAYMENT_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                query: JSON.stringify(params),
                error_message: 'Платёж отменён пользователем'
            }),
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': 'application/json'
            },
        });
    } else {
        console.log('Платеж не был завершен');
        await fetch(BAD_PAYMENT_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({
                email: email,
                query: JSON.stringify(params),
                error_message: 'Платеж не был завершен'
            }),
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': 'application/json'
            },
        });
        throw new Error('Платеж не был завершен');
    }
}

const setup = function () {
    const urlParams = new URLSearchParams(window.location.search);
    let params = {};
    urlParams.forEach((val, key) => {
        params[key] = val;
    });
    window.sessionStorage.setItem("query", JSON.stringify(params));

    const emailInput = document.querySelector(EMAIL_INPUT_SELECTOR);
    let emailGoalSent = false;

    // Проверяем валидность email по длине и наличию '@'
    emailInput.addEventListener("input", function (e) {
        const val = e.target.value;
        if (!emailGoalSent && val.length >= 7 && val.includes('@')) {
            emailGoalSent = true;
        }
    });

    const registration = document.querySelector(SUBMIT_BUTTON_SELECTOR);
    registration.addEventListener('click', register);
}

function documentReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 100);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

documentReady(setup);
