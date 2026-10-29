'use client';

import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[#050807] text-gray-300 font-mono pb-10">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#050807]/90 backdrop-blur border-b border-[#39ff14]/30 px-4 py-3 flex items-center gap-3">
        <Link href="/game" className="text-[#39ff14] hover:text-white text-xl shrink-0 transition-colors">
          ←
        </Link>
        <h1 className="text-sm tracking-widest text-[#39ff14] truncate">[ ПРАВИЛА_ИГРЫ ]</h1>
      </header>

      <div className="pt-20 px-4 pb-4 max-w-3xl mx-auto space-y-4">
        
        {/* ОБЩЕЕ ОПИСАНИЕ */}
        <section className="border border-gray-800 bg-[#0a0f0d] p-4">
          <h2 className="text-xs tracking-widest text-[#39ff14] mb-4 border-b border-gray-800 pb-2">
            &gt; О_ПРОТОКОЛЕ
          </h2>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              <strong className="text-white">SpyMe</strong> — социальная детективная игра. Вы общаетесь в чате, публикуете посты, расследуете. Внутри игры есть скрытые шпионы, которые действуют против своей страны.
            </p>
            <p>
              Игра <strong className="text-white">бесконечная</strong> — нет финала, нет сброса. Каждый игрок играет свою роль столько, сколько хочет.
            </p>
            <p>
              <strong className="text-white">Главная идея:</strong> противостояние шпионов и не-шпионов. Шпион может быть кем угодно — Репортером, Бизнесменом, Политиком. Но <strong className="text-white">никогда</strong> — Военным.
            </p>
          </div>
        </section>

        {/* РОЛИ */}
        <section className="border border-gray-800 bg-[#0a0f0d] p-4">
          <h2 className="text-xs tracking-widest text-[#39ff14] mb-4 border-b border-gray-800 pb-2">
            &gt; ДОСТУПНЫЕ_СЕКТОРЫ
          </h2>

          <div className="space-y-4">
            {/* РЕПОРТЕР */}
            <div className="border border-[#39ff14]/30 bg-transparent p-4 relative">
              <h3 className="text-sm font-bold text-[#39ff14] mb-2 tracking-wider">[ РЕПОРТЕР ]</h3>
              <p className="text-sm text-gray-400 mb-2">
                <strong className="text-white">Кто это:</strong> источник информации. Пишет посты, расследует игроков.
              </p>
              <p className="text-sm text-gray-400 mb-1"><strong className="text-white">Что может:</strong></p>
              <ul className="space-y-1 mb-3">
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Публиковать посты в ленте (видят все в стране).</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Запускать расследование на любого игрока.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Через 24 часа получать отчёт с аномалиями.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Передавать улики Военному своей страны.</li>
              </ul>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Цель:</strong> раскрывать шпионов и передавать их Военным.
              </p>
              <p className="text-xs text-yellow-500/70 mt-3 border-t border-gray-800 pt-2">
                ⚠️ Репортер может быть шпионом. Тогда он саботирует расследования или сдаёт конкурентов.
              </p>
            </div>

            {/* ВОЕННЫЙ */}
            <div className="border border-orange-500/30 bg-transparent p-4 relative">
              <h3 className="text-sm font-bold text-orange-400 mb-2 tracking-wider">[ ВОЕННЫЙ ]</h3>
              <p className="text-sm text-gray-400 mb-2">
                <strong className="text-white">Кто это:</strong> защитник страны. Получает улики и ликвидирует шпионов.
              </p>
              <p className="text-sm text-gray-400 mb-1"><strong className="text-white">Что может:</strong></p>
              <ul className="space-y-1 mb-3">
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Просматривать улики от Репортеров своей страны.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Ликвидировать шпионов из других стран.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Не может ликвидировать игроков своей страны.</li>
              </ul>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Цель:</strong> ликвидировать как можно больше шпионов. Каждая успешная ликвидация — победа.
              </p>
              <div className="border-t border-gray-800 pt-2 mt-3 space-y-1">
                <p className="text-xs text-red-500/70">⚠️ Если ликвидируете не-шпиона — блокировка на 24 часа.</p>
                <p className="text-xs text-yellow-500/70">⚠️ Военный не может быть шпионом.</p>
              </div>
            </div>

            {/* БИЗНЕСМЕН */}
            <div className="border border-yellow-500/30 bg-transparent p-4 relative">
              <h3 className="text-sm font-bold text-yellow-500 mb-2 tracking-wider">[ БИЗНЕСМЕН ]</h3>
              <p className="text-sm text-gray-400 mb-2">
                <strong className="text-white">Кто это:</strong> экономический центр. Копит ВЛИ, финансирует других.
              </p>
              <p className="text-sm text-gray-400 mb-1"><strong className="text-white">Что может:</strong></p>
              <ul className="space-y-1 mb-3">
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Переводить ВЛИ другим игрокам.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Получать пассивный доход +50 ВЛИ в сутки.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Финансировать расследования Репортеров.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Подкупать Военных (в будущем).</li>
              </ul>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Цель:</strong> заработать больше всех ВЛИ и влиять на исход игры через деньги.
              </p>
              <p className="text-xs text-yellow-500/70 mt-3 border-t border-gray-800 pt-2">
                ⚠️ Бизнесмен может быть шпионом. Тогда он финансирует дезинформацию и саботирует расследования.
              </p>
            </div>

            {/* ПОЛИТИК */}
            <div className="border border-cyan-500/30 bg-transparent p-4 relative">
              <h3 className="text-sm font-bold text-cyan-400 mb-2 tracking-wider">[ ПОЛИТИК ]</h3>
              <p className="text-sm text-gray-400 mb-2">
                <strong className="text-white">Кто это:</strong> дипломат. Маневрирует между странами.
              </p>
              <p className="text-sm text-gray-400 mb-1"><strong className="text-white">Что может:</strong></p>
              <ul className="space-y-1 mb-3">
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Менять страну раз в 48 часов.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Получать иммунитет на 48 часов после смены страны.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Общаться с Военными других стран.</li>
              </ul>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Цель:</strong> выжить и влиять на международные отношения.
              </p>
              <p className="text-xs text-yellow-500/70 mt-3 border-t border-gray-800 pt-2">
                ⚠️ Политик может быть шпионом. Тогда он использует иммунитет, чтобы не быть ликвидированным.
              </p>
            </div>

            {/* ШПИОН */}
            <div className="border border-purple-500/50 bg-purple-900/10 p-4 relative">
              <h3 className="text-sm font-bold text-purple-400 mb-2 tracking-wider">[ ШПИОН // СКРЫТО ]</h3>
              <p className="text-sm text-gray-400 mb-2">
                <strong className="text-white">Кто это:</strong> скрытый агент. О нём знает только он сам.
              </p>
              <p className="text-sm text-gray-400 mb-1"><strong className="text-white">Что может:</strong></p>
              <ul className="space-y-1 mb-3">
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Саботировать расследования, если он Репортер.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Финансировать дезинформацию, если он Бизнесмен.</li>
                <li className="text-xs text-gray-400 flex gap-2"><span className="text-gray-600">&gt;</span> Сбегать от ликвидации через смену страны, если он Политик.</li>
              </ul>
              <p className="text-sm text-gray-400">
                <strong className="text-white">Цель:</strong> выжить и не быть раскрытым. Каждый день в роли шпиона — победа.
              </p>
              <p className="text-xs text-purple-400 mt-3 border-t border-gray-800 pt-2">
                ⚠️ Шпион может быть кем угодно, кроме Военного.
              </p>
            </div>
          </div>
        </section>

        {/* МЕХАНИКИ */}
        <section className="border border-gray-800 bg-[#0a0f0d] p-4">
          <h2 className="text-xs tracking-widest text-[#39ff14] mb-4 border-b border-gray-800 pb-2">
            &gt; СИСТЕМНЫЕ_МЕХАНИКИ
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">&gt; РАССЛЕДОВАНИЕ</h3>
              <p className="text-sm text-gray-400">
                Репортер запускает расследование на игрока. Через 24 часа получает отчёт: количество сообщений цели, связи с другими странами, вероятность шпионажа. Отчёт можно передать Военному как улику.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-1">&gt; УЛИКА</h3>
              <p className="text-sm text-gray-400">
                Доказательство, которое Репортер передаёт Военному. Содержит отчёт расследования. Военный использует улику для ликвидации шпиона. Военный видит только улики на игроков <strong className="text-white">из других стран</strong>.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-1">&gt; ЛИКВИДАЦИЯ</h3>
              <p className="text-sm text-gray-400">
                Военный выбирает улику и нажимает «Ликвидировать». Если цель — шпион, он забанен. Если нет — Военный получает блокировку на 24 часа.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-1">&gt; ВЛИ (ВЛИЯНИЕ)</h3>
              <p className="text-sm text-gray-400">
                Игровая валюта. Все игроки начинают с 500 ВЛИ, Бизнесмены — с 1000. Бизнесмены получают +50 ВЛИ в сутки. ВЛИ можно переводить другим игрокам через кнопку «Перевести ВЛИ».
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-1">&gt; ПЕРВЫЕ_3_ДНЯ</h3>
              <p className="text-sm text-gray-400">
                Первые 3 дня после регистрации игрок не может стать шпионом. Это даёт время освоиться в игре.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-1">&gt; СМЕНА_СТРАНЫ</h3>
              <p className="text-sm text-gray-400">
                Политик может менять страну раз в 48 часов. После смены получает иммунитет на 48 часов — его нельзя ликвидировать.
              </p>
            </div>
          </div>
        </section>

        {/* ПРАВИЛА ПОВЕДЕНИЯ */}
        <section className="border border-gray-800 bg-[#0a0f0d] p-4">
          <h2 className="text-xs tracking-widest text-[#39ff14] mb-4 border-b border-gray-800 pb-2">
            &gt; КОДЕКС_ПОВЕДЕНИЯ
          </h2>
          <ul className="space-y-2">
            <li className="text-sm text-gray-400 flex gap-2"><span className="text-red-500/70">!</span> Не используйте оскорбления и мат в чате.</li>
            <li className="text-sm text-gray-400 flex gap-2"><span className="text-red-500/70">!</span> Не разглашайте личные данные других игроков.</li>
            <li className="text-sm text-gray-400 flex gap-2"><span className="text-red-500/70">!</span> Не создавайте мультиаккаунты.</li>
            <li className="text-sm text-gray-400 flex gap-2"><span className="text-red-500/70">!</span> Не используйте скриншоты чужих диалогов для доказательств (в игре).</li>
            <li className="text-sm text-gray-400 flex gap-2"><span className="text-red-500/70">!</span> Играйте честно — обман в игре разрешён, но не за её пределами.</li>
          </ul>
        </section>

        {/* СОВЕТ */}
        <section className="border border-[#39ff14] bg-[#39ff14]/5 p-4 shadow-[0_0_15px_rgba(57,255,20,0.1)]">
          <h2 className="text-xs tracking-widest text-[#39ff14] mb-4 border-b border-[#39ff14]/30 pb-2">
            &gt; СОВЕТ_НОВИЧКУ
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Если вы не знаете, что делать — задайте вопрос <strong className="text-white">ИИ-помощнику</strong> (кнопка ❓ в правом нижнем углу).
          </p>
          <p className="text-sm text-gray-400">
            Он объяснит правила, цели и возможности вашей роли. Но не даст стратегических советов — это часть игры.
          </p>
        </section>
      </div>

      <div className="max-w-3xl mx-auto mt-8 mb-4 flex justify-center">
        <Link
          href="/game"
          className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-[#39ff14] hover:border-[#39ff14] rounded-none text-xs font-semibold tracking-wider transition-colors"
        >
          &lt; НАЗАД_В_ИГРУ
        </Link>
      </div>
    </div>
  );
}