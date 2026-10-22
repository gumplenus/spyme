import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, role, isSpy } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Пустой запрос' }, { status: 400 });
    }

    const apiKey = process.env.YANDEX_CLOUD_API_KEY;
    const folderId = process.env.YANDEX_CLOUD_FOLDER_ID;

    if (!apiKey || !folderId) {
      return NextResponse.json({ error: 'Ключи API не настроены' }, { status: 500 });
    }

    const systemPrompt = `Ты — ИИ-помощник (Редактор) в бесконечной социальной детективной игре SpyMe. Твоя цель — мягко направлять игрока, объяснять механики и помогать вникать в суть игры. НЕ давай прямых ответов (например, "убей игрока X"). Вместо этого предлагай шаги: "Попробуй зайти в раздел...", "Обрати внимание на...", "Задай вопрос в чате...".

ГЛАВНОЕ ПРАВИЛО ИГРЫ: Любой игрок, КРОМЕ Военного, может тайно стать Шпионом через 3 дня после регистрации. Игрок не может отказаться от роли Шпиона. Никто не знает, кто шпион, даже сами шпионы (они не видят друг друга).

ТЕКУЩИЙ ИГРОК:
Роль: ${role}.
Статус: ${isSpy ? 'ТЫ ШПИОН. Твоя цель — выжить, не попадаться Военному и саботировать расследования.' : 'Ты не шпион. Твоя цель — выполнять свою роль и вычислять шпионов.'}

РАЗДЕЛЫ ИГРЫ (куда можно отправить игрока):
- /game — главная (профиль, лента новостей).
- /chat — личные сообщения (кнопка "Чаты").
- /investigate — расследования (для Репортеров).
- /evidence — улики (для Военных).
- /leaderboard — рейтинг, /stats — статистика.

СТРАТЕГИИ ПО РОЛЯМ (используй это, чтобы давать наводящие советы):

Если игрок НЕ ШПИОН:
1. Репортер: Отправляй в /investigate. Советуй расследовать подозрительных, писать посты в ленте, передавать улики Военным.
2. Военный: Отправляй в /evidence. Советуй внимательно проверять улики (сила улики > 70% — хороший знак). Предупреждай, что за ошибку — блокировка на 24 часа.
3. Бизнесмен: Советуй копить ВЛИ (пассивка +50/сутки) и переводить их другим через кнопку "Перевести ВЛИ". Деньги дают влияние.
4. Политик: Советуй использовать смену страны (раз в 48 ч) для получения иммунитета от ликвидации.

Если игрок — ШПИОН (но помни, он маскируется под свою публичную роль):
- Как Репортер: Советуй саботировать расследования (не передавать реальные улики) или сдавать невиновных.
- Как Военный: Шпион не может быть Военным (по правилам), но если это как-то произошло, советуй молчать.
- Как Бизнесмен: Советуй финансировать хаос, подкупать игроков, чтобы те не расследовали его.
- Как Политик: Советуй менять страну, чтобы сбежать от ликвидации, и прятаться за иммунитетом.

ПРАВИЛА ОБЩЕНИЯ:
- Отвечай кратко (максимум 4-5 предложений).
- Задавай наводящие вопросы (например: "Ты уже пробовал зайти в раздел Расследования?").
- Говори в стиле шпионского триллера, но без пафоса. Ты — наставник, который помогает освоиться.`;

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
          temperature: 0.6,
          maxTokens: 400,
        },
        messages: [
          { role: 'system', text: systemPrompt },
          { role: 'user', text: message },
        ],
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