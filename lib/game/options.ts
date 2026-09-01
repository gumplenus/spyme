export const COUNTRIES = [
  { code: "RU", name: "Россия" },
  { code: "US", name: "США" },
  { code: "GB", name: "Великобритания" },
  { code: "DE", name: "Германия" },
  { code: "FR", name: "Франция" },
  { code: "CN", name: "Китай" },
  { code: "IL", name: "Израиль" },
  { code: "JP", name: "Япония" },
] as const;

export const ROLES = [
  { id: "spy", label: "Шпион", hint: "Невидимка в чужой столице" },
  { id: "handler", label: "Куратор", hint: "Ведёте сеть агентов" },
  { id: "analyst", label: "Аналитик", hint: "Читаете шифровки и следы" },
  { id: "double", label: "Двойной агент", hint: "Играете на две стороны" },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];
export type RoleId = (typeof ROLES)[number]["id"];
