from pathlib import Path

path = Path('apps/local-api/scripts/proof-callers.mjs')
text = path.read_text(encoding='utf-8')

old_import = """/*
 * Die Eingabeschemata der Add-in-Tür (T-132, O-M).
 *
 * `routes/addin/**` gehört integration-dev und wird hier **gelesen**, nicht
 * geändert. Anders als die vier Routendateien der Hauptfläche führt diese
 * Datei keine Aufstellung `REQUEST_SCHEMAS`; die Zuordnung zu den
 * Operationskennungen steht deshalb unten in `ADDIN_SCHEMAS` und nirgends
 * sonst. Die Schemata selbst sind dieselben Werte, die die Routen benutzen —
 * keine Abschrift.
 */
import { bookSchema, createTodoSchema } from '../src/routes/addin/schema.ts';
"""
new_import = """/*
 * Die Eingabeschemata der Add-in-Tür (T-132, O-M; seit T-149 als gemeinsame
 * Aufstellung direkt neben den Routen). Der Nachweis liest dieselbe Registry
 * wie `proof:openapi`, damit eine neue Add-in-Route mit Rumpf nicht an einem
 * zweiten, handgepflegten Wörterbuch vorbeilaufen kann.
 */
import { REQUEST_SCHEMAS as ADDIN_SCHEMAS } from '../src/routes/addin/schema.ts';
"""
if text.count(old_import) != 1:
    raise SystemExit('Add-in-Importblock nicht eindeutig gefunden')
text = text.replace(old_import, new_import, 1)

old_local = """/** Die beiden Türen mit Rumpf unter `/addin/*`, nach Operationskennung. */
const ADDIN_SCHEMAS = {
  createAddinTodo: createTodoSchema,
  createAddinTimeEntry: bookSchema,
};

"""
if text.count(old_local) != 1:
    raise SystemExit('lokale ADDIN_SCHEMAS-Aufstellung nicht eindeutig gefunden')
text = text.replace(old_local, '', 1)

old_list = """  // Die vier Add-in-Routen. **Anderer Aufrufer, nicht ungeprüft** (T-132,
  // O-M): Dass jede von ihnen im Aufgabenbereich einen Aufrufer hat, misst
  // Abschnitt 7 — mit demselben Leser und demselben Urteil.
  'getAddinContext',
  'findAddinDuplicates',
  'createAddinTodo',
  'createAddinTimeEntry',
"""
new_list = """  // Die fünf Add-in-Routen. **Anderer Aufrufer, nicht ungeprüft** (T-132,
  // O-M): Dass jede von ihnen im Aufgabenbereich einen Aufrufer hat, misst
  // Abschnitt 7 — mit demselben Leser und demselben Urteil.
  'getAddinContext',
  'findAddinDuplicates',
  'createAddinTodo',
  'addAddinTodoAttachment',
  'createAddinTimeEntry',
"""
if text.count(old_list) != 1:
    raise SystemExit('NOT_CALLED_BY_UI-Add-in-Block nicht eindeutig gefunden')
text = text.replace(old_list, new_list, 1)

path.write_text(text, encoding='utf-8')
