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

    const systemPrompt = `Ты — ИИ-помощник в социальной детективной игре SpyMe. 
Игра бесконечная, игроки общаются в чате, расследуют и ликвидируют. В игре есть скрытые шпионы.
Роли в игре: Репортер (расследует), Военный (ликвидирует), Бизнесмен (экономика, ВЛИ), Политик (меняет страны).
Игрок, которому ты помогаешь, имеет роль: ${role}. ${isSpy ? 'ВНИМАНИЕ: Этот игрок — тайный Шпион. Помоги ему не попасться.' : 'Этот игрок не шпион.'}
Твоя задача — давать полезные, но не слишком прямые советы по игре, объяснять правила, подсказывать тактики. 
Отвечай в стиле шпионского триллера, кратко и по делу. Не раскрывай роли других игроков (ты их не знаешь).`;

    // Добавили заголовок x-folder-id, он обязателен при авторизации по Api-Key
    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`,
        'x-folder-id': folderId, // <-- ЭТОТ ЗАГОЛОВОК БЫЛ ПРОПУЩЕН
      },
      body: JSON.stringify({
        modelUri: `gpt://${folderId}/yandexgpt-lite/latest`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: 500,
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
      // Возвращаем точную ошибку, чтобы было видно на фронтенде
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