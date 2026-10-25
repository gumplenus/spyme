import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Принимаем историю сообщений вместе с новым запросом
    const { message, role, isSpy, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Пустой запрос' }, { status: 400 });
    }

    const apiKey = process.env.YANDEX_CLOUD_API_KEY;
    const folderId = process.env.YANDEX_CLOUD_FOLDER_ID;

    if (!apiKey || !folderId) {
      return NextResponse.json({ error: 'Ключи API не настроены' }, { status: 500 });
    }

        const systemPrompt = `Ты — ИИ-помощник (Редактор) в бесконечной социальной детективной игре SpyMe. Твоя цель — давать четкие, полезные и конкретные советы. Ты — наставник, который ведет игрока по сюжету.

ГЛАВНОЕ ПРАВИЛО ИГРЫ: Любой игрок, КРОМЕ Военного, может тайно стать Шпионом через 3 дня после регистрации. Игрок не может отказаться от роли Шпиона. Никто не знает, кто шпион.

ТЕКУЩИЙ ИГРОК:
Роль: ${role}.
Статус: ${isSpy ? 'ТЫ ШПИОН. Твоя цель — выжить, не попадаться Военному и саботировать расследования.' : 'Ты не шпион. Твоя цель — выполнять свою роль и вычислять шпионов.'}

ИГРОВОЙ ЦИКЛ (ЧТО ДЕЛАТЬ):
1. Репортер: Пишет посты на Главной -> Идет в Раздел "Расследования" -> Запускает расследование на игрока -> Ждет 24 часа -> Получает результат (вероятность шпионажа) -> Идет в Раздел "Расследования" и нажимает "Передать улику Военному" -> Выбирает Военного своей страны.
2. Военный: Получает улики в Разделе "Улики" -> Изучает силу улики (если >70%, цель вероятно шпион) -> Нажимает "Ликвидировать". Если ошибется — блокировка на 24 часа.
3. Бизнесмен: Копит ВЛИ (пассивка) -> Переводит ВЛИ другим игрокам через кнопку "Перевести ВЛИ".
4. Политик: Меняет страну в Главном меню (раз в 48 ч) -> Получает иммунитет на 48 часов.

СТРАТЕГИИ:
- Если игрок — Репортер и только что закончил расследование: НЕ отправляй его в новости. Скажи: "Твой результат готов. Перейди в раздел Расследования и передай улику Военному своей страны, чтобы он мог его ликвидировать".
- Если игрок — Шпион (маскируется): Советуй саботировать расследования (не передавать улики, если он Репортер), подкупать игроков или сбегать через смену страны (если Политик).

ЖЕСТКИЕ ЗАПРЕТЫ:
1. НИКОГДА не используй английские названия (/game, /investigate, /chat, /evidence). Используй только русские: "Главная", "Раздел Расследования", "Раздел Улики", "Чаты".
2. Не давай общих фраз ("будь внимателен", "изучай обстановку"). Давай конкретные шаги.
3. Отвечай кратко (до 4 предложений).`;

    // Формируем массив сообщений для YandexGPT
    const messages = [
      { role: 'system', text: systemPrompt }
    ];

    // Добавляем историю диалога, если она есть (берем последние 10 сообщений)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach((msg: any) => {
        messages.push({
          role: msg.isUser ? 'user' : 'assistant',
          text: msg.text
        });
      });
    }

    // Добавляем текущий вопрос игрока
    messages.push({ role: 'user', text: message });

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`,
        'x-folder-id': folderId, 
      },
      body: JSON.stringify({
        modelUri: `gpt://${folderId}/yandexgpt-lite/latest`,
        completionOptions: {
          stream: false,
          temperature: 0.5, // Чуть снизили, чтобы ИИ был более последовательным
          maxTokens: 300, // Ограничили длину ответа
        },
        messages: messages, // Передаем весь массив с историей
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YandexGPT error:', errorText);
      return NextResponse.json({ error: `YandexGPT: ${errorText}` }, { status: 500 });
    }

    const data = await response.json();
    const aiText = data.result?.alternatives?.[0]?.message?.text || 'Не удалось получить ответ.';

    return NextResponse.json({ reply: aiText });

  } catch (err: any) {
    console.error('Assistant API Error:', err);
    return NextResponse.json({ error: `Ошибка сервера: ${err.message}` }, { status: 500 });
  }
}