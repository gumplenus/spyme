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
    <div>
      {title && (
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      )}

      {/* Фильтры */}
      <div className="space-y-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени..."
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 outline-none"
        />

        <div className="flex gap-2">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 outline-none"
          >
            <option value="">Все страны</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-green-400 outline-none"
          >
            <option value="">Все роли</option>
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
            className="text-sm text-gray-400 hover:text-green-400 underline"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Список */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-6">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const content = (
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {p.username || 'Неизвестный'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {ROLE_ICONS[p.publicRole?.toUpperCase() || ''] || '👤'}{' '}
{ROLE_LABELS[p.publicRole?.toUpperCase() || ''] || p.publicRole || 'Без роли'}
{p.country ? ` · ${p.country}` : ''}
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
                  className="block bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={p.id}
                onClick={() => onSelect?.(p)}
                className="w-full text-left bg-gray-700 p-3 rounded-lg hover:bg-gray-600 transition-colors"
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