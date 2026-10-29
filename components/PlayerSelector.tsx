'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const ROLE_LABELS: Record<string, string> = {
  REPORTER: 'Репортёр',
  MILITARY: 'Военный',
  BUSINESSMAN: 'Бизнесмен',
  POLITICIAN: 'Политик',
};

const ROLE_ICONS: Record<string, string> = {
  REPORTER: '📰',
  MILITARY: '🎖️',
  BUSINESSMAN: '💰',
  POLITICIAN: '🏛️',
};

export type Player = {
  id: string;
  username: string | null;
  country: string | null;
  publicRole: string | null;
  avatarUrl?: string | null;
};

type Props = {
  players: Player[];
  onSelect?: (player: Player) => void;
  getHref?: (player: Player) => string;
  emptyText?: string;
  title?: string;
};

export default function PlayerSelector({
  players,
  onSelect,
  getHref,
  emptyText = 'Нет игроков',
  title,
}: Props) {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const countries = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      if (p.country) set.add(p.country);
    });
    return Array.from(set).sort();
  }, [players]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    players.forEach((p) => {
      if (p.publicRole) set.add(p.publicRole);
    });
    return Array.from(set).sort();
  }, [players]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (countryFilter && p.country !== countryFilter) return false;
      if (roleFilter && p.publicRole !== roleFilter) return false;
      if (q) {
        const name = (p.username || '').toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [players, search, countryFilter, roleFilter]);

  const resetFilters = () => {
    setSearch('');
    setCountryFilter('');
    setRoleFilter('');
  };

  return (
    <div className="font-mono">
      {title && (
        <h3 className="text-sm tracking-widest text-[#39ff14] mb-4">{title}</h3>
      )}

      {/* Фильтры */}
      <div className="space-y-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="> ПОИСК ПО ИМЕНИ..."
          className="w-full px-3 py-2 bg-transparent text-[#39ff14] border border-gray-700 focus:border-[#39ff14] outline-none text-sm rounded-none placeholder-gray-600"
        />

        <div className="flex gap-2">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#050807] text-[#39ff14] border border-gray-700 focus:border-[#39ff14] outline-none text-sm rounded-none appearance-none"
          >
            <option value="">ВСЕ СТРАНЫ</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#050807] text-[#39ff14] border border-gray-700 focus:border-[#39ff14] outline-none text-sm rounded-none appearance-none"
          >
            <option value="">ВСЕ РОЛИ</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r.toUpperCase()] || r}
              </option>
            ))}
          </select>
        </div>

        {(search || countryFilter || roleFilter) && (
          <button
            onClick={resetFilters}
            className="text-xs text-gray-500 hover:text-[#39ff14] underline mt-1 transition-colors"
          >
            СБРОСИТЬ ФИЛЬТРЫ
          </button>
        )}
      </div>

      {/* Список */}
      {filtered.length === 0 ? (
        <p className="text-gray-600 text-sm italic text-center py-6">[ {emptyText} ]</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const content = (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-700 overflow-hidden flex items-center justify-center shrink-0">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.username || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-500">USR</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    @{p.username || 'Неизвестный'}
                  </p>
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider truncate mt-1">
                    {ROLE_ICONS[p.publicRole?.toUpperCase() || ''] || '👤'}{' '}
                    {ROLE_LABELS[p.publicRole?.toUpperCase() || ''] || p.publicRole || 'Без роли'}
                    {p.country ? ` // ${p.country}` : ''}
                  </p>
                </div>
              </div>
            );

            if (getHref) {
              return (
                <Link
                  key={p.id}
                  href={getHref(p)}
                  onClick={() => onSelect?.(p)}
                  className="block border border-gray-800 bg-[#0a0f0d] p-3 hover:border-[#39ff14]/50 transition-colors rounded-none"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={p.id}
                onClick={() => onSelect?.(p)}
                className="w-full text-left border border-gray-800 bg-[#0a0f0d] p-3 hover:border-[#39ff14]/50 transition-colors rounded-none"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}