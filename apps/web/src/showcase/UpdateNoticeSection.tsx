import { useState } from "react";
import { Button, Card, InlineMessage } from "../components/Primitives";
import { UpdateDialog } from "../components/UpdateDialog";
import { releasePageUrl } from "../lib/releasePage";
import { Section, SubHeading } from "./Section";

/**
 * Abschnitt 12 der Musterseite — der Hinweis auf eine neuere Fassung (T-139).
 *
 * Die Zustände sind hier abnehmbar, weil sie sich in der Anwendung nur
 * herbeiführen lassen, wenn GitHub gerade etwas Bestimmtes sagt. Der Abschnitt
 * zeigt den **echten** Baustein, nicht eine Nachbildung: dieselbe Datei, die
 * `app/UpdateNotice.tsx` benutzt.
 *
 * **Der wichtigste Zustand ist der, den man hier nicht sehen kann.** Liegt
 * nichts Neues vor — oder ist GitHub nicht erreichbar, antwortet unerwartet
 * oder wurde noch gar nicht gefragt —, entsteht **kein Element**: kein Dialog,
 * kein Abzeichen, keine Fehlerfläche (A-18.5, A-18.11). Er steht deshalb als
 * Satz da und nicht als Bild.
 */

/** Erfundene Fassungen, wie überall auf dieser Seite. */
const DEMO_INSTALLED = "0.9.0";
const DEMO_AVAILABLE = "0.10.0";

type DemoCase = "plain" | "rejected" | "busy";

const PROBLEMS: Readonly<Record<DemoCase, string | null>> = {
  plain: null,
  rejected:
    "Die gemeldete Fassungsbezeichnung hat die Prüfung der Anwendung nicht bestanden. Takt öffnet dafür keine Seite.",
  busy: null,
};

export function UpdateNoticeSection() {
  const [open, setOpen] = useState<DemoCase | null>(null);

  return (
    <Section
      id="fassung"
      title="12 — Wenn eine neuere Fassung vorliegt"
      lead="Takt fragt, es lädt nicht. Der Dialog nennt beide Fassungen und die Release-Seite, und er trifft keine der beiden Antworten im Voraus."
      refs={["A-18.5", "A-18.6", "A-18.7", "A-18.8", "A-18.9", "A-18.10", "A-18.11"]}
    >
      <Card title="Die drei Zustände des Dialogs">
        <p className="prose">
          <strong>0,9,0 gegen 0,10,0</strong> ist mit Absicht das Beispielpaar: Als Zeichenkette
          verglichen stünde die neuere Fassung darunter und der Hinweis bliebe aus. Die Ordnung
          liegt deshalb in der Fachlogik und nicht in dieser Oberfläche.
        </p>
        <div className="row">
          <Button onClick={() => setOpen("plain")}>Neue Fassung liegt vor</Button>
          <Button onClick={() => setOpen("rejected")}>Öffnen abgewiesen</Button>
          <Button onClick={() => setOpen("busy")}>Überspringen läuft</Button>
        </div>
      </Card>

      <SubHeading>Der Zustand ohne Bild</SubHeading>
      <InlineMessage tone="info" title="Liegt nichts Neues vor, geschieht nichts">
        Aktuell, übersprungen, noch nicht geprüft, GitHub nicht erreichbar, unbrauchbare Antwort,
        keine Anwendungshülle: Alle sechs sehen gleich aus, und sie sehen aus wie nichts. Es gibt
        dafür keine Fehlerfläche und keinen Hinweis „Prüfung fehlgeschlagen" — der Benutzer wird
        bei seiner Arbeit von etwas, das ihn nicht behindert, nicht unterbrochen.
      </InlineMessage>

      {open === null ? null : (
        <UpdateDialog
          open
          installed={DEMO_INSTALLED}
          available={DEMO_AVAILABLE}
          url={releasePageUrl(DEMO_AVAILABLE)}
          problem={PROBLEMS[open]}
          busy={open === "busy"}
          onInstall={() => setOpen("rejected")}
          onSkip={() => setOpen(null)}
          onPostpone={() => setOpen(null)}
        />
      )}
    </Section>
  );
}
