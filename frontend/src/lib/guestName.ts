const STORAGE_KEY = "cr.guest.name";

const ADJECTIVES = [
  "Brave", "Bright", "Swift", "Sunny", "Turbo", "Lucky", "Wild", "Mighty",
  "Silent", "Zippy", "Solar", "Lunar", "Peppy", "Neon", "Stellar", "Cobalt",
  "Crimson", "Golden", "Frosty", "Electric", "Mystic", "Radiant", "Nimble", "Iron",
  "Vivid", "Dapper", "Bold", "Clever", "Rapid", "Glacial"
];

const NOUNS = [
  "Fox", "Comet", "Otter", "Falcon", "Tiger", "Phoenix", "Yeti", "Quark",
  "Nova", "Hawk", "Panda", "Dragon", "Bison", "Lynx", "Orca", "Wolf",
  "Cobra", "Raven", "Badger", "Mantis", "Viper", "Heron", "Koala", "Puma",
  "Sable", "Stoat", "Eel", "Ibex", "Newt", "Vole"
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateGuestName(): string {
  return `${pick(ADJECTIVES)}${pick(NOUNS)}`;
}

export function loadOrCreateGuestName(): string {
  if (typeof window === "undefined") return "Player";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && /^[A-Za-z][A-Za-z _-]*$/.test(stored)) return stored;
  const generated = generateGuestName();
  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
}

export function saveGuestName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, name);
}

export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 30) return false;
  return /^[A-Za-z][A-Za-z _-]*$/.test(trimmed);
}
