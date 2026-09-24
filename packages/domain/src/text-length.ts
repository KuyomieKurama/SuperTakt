/**
 * Die Eingabeprüfung zählt UTF-16-Einheiten; Titelvorschläge werden zusätzlich an Zeichengrenzen
 * gekürzt, damit Emoji nicht zerteilt werden.
 */
export const MAX_TITLE_CHARACTERS = 500;

/**
 * Title limit before T-114. Only an own data archive reads titles up to this length, so a store
 * that still holds such a title can restore its own backup (A-20.4, E-132 point 1).
 */
export const LEGACY_MAX_TITLE_CHARACTERS = 512;

/** Longest priority name; the SQL CHECK on `todo_priority.name` holds the same number. */
export const MAX_PRIORITY_NAME_CHARACTERS = 120;

/** Longest Windows user name accepted at the handshake (B-8.1) and in an archive (T-394). */
export const MAX_WINDOWS_USER_CHARACTERS = 256;
