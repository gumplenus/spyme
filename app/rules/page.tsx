'use client';

import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <Link href="/game" className="text-green-400 hover:underline mb-4 inline-block">
        ← Назад в игру
      </Link>

      <h1 className="text-4xl font-bold text-green-400 mb-8 text-center">
        📖 Правила игры SpyMe
      </h1>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* ОБЩЕЕ ОПИСАНИЕ */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-green-400 mb-4">🎯 О игре</h2>
          <p className="text-gray-300 mb-3">
            <strong className="text-white">SpyMe</strong> — социальная детективная игра.
            Вы общаетесь в чате, публикуете посты, расследуете. Внутри игры есть скрытые
            шпионы, которые действуют против своей страны.
          </p>
          <p className="text-gray-300 mb-3">
            Игра <strong className="text-white">бесконечная</strong> — нет финала,
            нет сброса. Каждый игрок играет свою роль столько, сколько хочет.
          </p>
          <p className="text-gray-300">
            <strong className="text-white">Главная идея:</strong> противостояние шпионов
            и не-шпионов. Шпион может быть кем угодно — Репортером, Бизнесменом, Политиком.
            Но <strong className="text-white">никогда</strong> — Военным.
          </p>
        </section>

        {/* РОЛИ */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-green-400 mb-4">👥 Роли</h2>

          <div className="space-y-4">
            {/* РЕПОРТЕР */}
            <div className="bg-gray-700 p-4 rounded-lg border border-green-600">
              <h3 className="text-xl font-bold text-green-400 mb-2">📰 Репортер</h3>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Кто это:</strong> источник информации.
                Пишет посты, расследует игроков.
              </p>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Что может:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-2">
                <li>Публиковать посты в ленте (видят все в стране).</li>
                <li>Запускать расследование на любого игрока.</li>
                <li>Через 24 часа получать отчёт с аномалиями.</li>
                <li>Передавать улики Военному своей страны.</li>
              </ul>
              <p className="text-gray-300 mt-2">
                <strong className="text-white">Цель:</strong> раскрывать шпионов
                и передавать их Военным.
              </p>
              <p className="text-yellow-400 text-sm mt-2">
                ⚠️ Репортер может быть шпионом. Тогда он саботирует расследования
                или сдаёт конкурентов.
              </p>
            </div>

            {/* ВОЕННЫЙ */}
            <div className="bg-gray-700 p-4 rounded-lg border border-orange-600">
              <h3 className="text-xl font-bold text-orange-400 mb-2">⚔️ Военный</h3>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Кто это:</strong> защитник страны.
                Получает улики и ликвидирует шпионов.
              </p>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Что может:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-2">
                <li>Просматривать улики от Репортеров своей страны.</li>
                <li>Ликвидировать шпионов из других стран.</li>
                <li>Не может ликвидировать игроков своей страны.</li>
              </ul>
              <p className="text-gray-300 mt-2">
                <strong className="text-white">Цель:</strong> ликвидировать как можно
                больше шпионов. Каждая успешная ликвидация — победа.
              </p>
              <p className="text-red-400 text-sm mt-2">
                ⚠️ Если ликвидируете не-шпиона — блокировка на 24 часа.
              </p>
              <p className="text-yellow-400 text-sm mt-2">
                ⚠️ Военный <strong>не может</strong> быть шпионом.
              </p>
            </div>

            {/* БИЗНЕСМЕН */}
            <div className="bg-gray-700 p-4 rounded-lg border border-yellow-600">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">💰 Бизнесмен</h3>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Кто это:</strong> экономический центр.
                Копит ВЛИ, финансирует других.
              </p>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Что может:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-2">
                <li>Переводить ВЛИ другим игрокам.</li>
                <li>Получать пассивный доход +50 ВЛИ в сутки.</li>
                <li>Финансировать расследования Репортеров.</li>
                <li>Подкупать Военных (в будущем).</li>
              </ul>
              <p className="text-gray-300 mt-2">
                <strong className="text-white">Цель:</strong> заработать больше всех ВЛИ
                и влиять на исход игры через деньги.
              </p>
              <p className="text-yellow-400 text-sm mt-2">
                ⚠️ Бизнесмен может быть шпионом. Тогда он финансирует дезинформацию
                и саботирует расследования.
              </p>
            </div>

            {/* ПОЛИТИК */}
            <div className="bg-gray-700 p-4 rounded-lg border border-cyan-600">
              <h3 className="text-xl font-bold text-cyan-400 mb-2">🌍 Политик</h3>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Кто это:</strong> дипломат.
                Маневрирует между странами.
              </p>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Что может:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-2">
                <li>Менять страну раз в 48 часов.</li>
                <li>Получать иммунитет на 48 часов после смены страны.</li>
                <li>Общаться с Военными других стран.</li>
              </ul>
              <p className="text-gray-300 mt-2">
                <strong className="text-white">Цель:</strong> выжить и влиять
                на международные отношения.
              </p>
              <p className="text-yellow-400 text-sm mt-2">
                ⚠️ Политик может быть шпионом. Тогда он использует иммунитет,
                чтобы не быть ликвидированным.
              </p>
            </div>

            {/* ШПИОН */}
            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500">
              <h3 className="text-xl font-bold text-purple-300 mb-2">🕵️ Шпион (скрытая роль)</h3>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Кто это:</strong> скрытый агент.
                О нём знает только он сам.
              </p>
              <p className="text-gray-300 mb-2">
                <strong className="text-white">Что может:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-2">
                <li>Использовать кодовое слово для связи с другими шпионами.</li>
                <li>Вербовать цель через чат (первая миссия-пример).</li>
                <li>Саботировать расследования, если он Репортер.</li>
                <li>Финансировать дезинформацию, если он Бизнесмен.</li>
                <li>Сбегать от ликвидации через смену страны, если он Политик.</li>
              </ul>
              <p className="text-gray-300 mt-2">
                <strong className="text-white">Цель:</strong> выжить и не быть раскрытым.
                Каждый день в роли шпиона — победа.
              </p>
              <p className="text-purple-300 text-sm mt-2">
                ⚠️ Шпион может быть кем угодно, кроме Военного.
              </p>
            </div>
          </div>
        </section>

        {/* МЕХАНИКИ */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-green-400 mb-4">⚙️ Механики</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🔍 Расследование</h3>
              <p className="text-gray-300">
                Репортер запускает расследование на игрока. Через 24 часа получает
                отчёт: количество сообщений цели, связи с другими странами, вероятность
                шпионажа. Отчёт можно передать Военному как улику.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">📂 Улика</h3>
              <p className="text-gray-300">
                Доказательство, которое Репортер передаёт Военному. Содержит отчёт
                расследования. Военный использует улику для ликвидации шпиона.
                Военный видит только улики на игроков <strong className="text-white">из других стран</strong>.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">⚔️ Ликвидация</h3>
              <p className="text-gray-300">
                Военный выбирает улику и нажимает «Ликвидировать». Если цель — шпион,
                он забанен. Если нет — Военный получает блокировку на 24 часа.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">💰 ВЛИ (Влияние)</h3>
              <p className="text-gray-300">
                Игровая валюта. Все игроки начинают с 500 ВЛИ, Бизнесмены — с 1000.
                Бизнесмены получают +50 ВЛИ в сутки. ВЛИ можно переводить другим
                игрокам через кнопку «Перевести ВЛИ».
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🎓 Онбординг</h3>
              <p className="text-gray-300">
                Первые 3 дня после регистрации. Игрок не может быть шпионом.
                Видит подсказки. Через 3 дня онбординг автоматически заканчивается.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🔑 Кодовое слово</h3>
              <p className="text-gray-300">
                Секретная фраза у каждого шпиона. Если шпион использует своё слово
                в чате с другим игроком, а тот тоже шпион — система отправит ему
                скрытое уведомление. Так шпионы находят друг друга.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🌍 Смена страны (Политик)</h3>
              <p className="text-gray-300">
                Политик может менять страну раз в 48 часов. После смены получает
                иммунитет на 48 часов — его нельзя ликвидировать.
              </p>
            </div>
          </div>
        </section>

        {/* ПРАВИЛА ПОВЕДЕНИЯ */}
        <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-green-400 mb-4">📜 Правила поведения</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Не используйте оскорбления и мат в чате.</li>
            <li>Не разглашайте личные данные других игроков.</li>
            <li>Не создавайте мультиаккаунты.</li>
            <li>Не используйте скриншоты чужих диалогов для доказательств (в игре).</li>
            <li>Играйте честно — обман в игре разрешён, но не за её пределами.</li>
          </ul>
        </section>

        {/* СОВЕТ */}
        <section className="bg-green-900/30 p-6 rounded-xl border border-green-500">
          <h2 className="text-2xl font-bold text-green-400 mb-4">💡 Совет новичку</h2>
          <p className="text-gray-300 mb-2">
            Если вы не знаете, что делать — задайте вопрос <strong className="text-white">ИИ-помощнику</strong>
            (кнопка ❓ в правом нижнем углу).
          </p>
          <p className="text-gray-300">
            Он объяснит правила, цели и возможности вашей роли. Но не даст
            стратегических советов — это часть игры.
          </p>
        </section>
      </div>

      <div className="max-w-3xl mx-auto mt-8 mb-4 flex justify-center">
        <Link
          href="/game"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold"
        >
          ← Назад в игру
        </Link>
      </div>
    </div>
  );
}