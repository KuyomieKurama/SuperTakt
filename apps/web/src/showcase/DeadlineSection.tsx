import { useState } from "react";

import type {
  Id,
} from "../api/types";
import type {
  Attachment,
} from "../features/todos/api";
import { AttachmentOpenDialog } from "../features/todos/AttachmentOpenDialog";
import { DeadlineFlag } from "../shared/ui/DeadlineFlag";
import { Icon } from "../shared/ui/Icon";
import { Button, Card, EmptyState, InlineMessage } from "../shared/ui/Primitives";
import { attachmentLabel, ATTACHMENT_KIND_LABEL } from "../features/todos/attachmentLabel";
import { Foreign } from "../shared/ui/Foreign";
import { ForeignName } from "../shared/ui/ForeignName";
import { SHOWCASE_TODAY } from "./data";
import { Section, SubHeading } from "./Section";

/**
 * Abschnitt 13 der Musterseite — **Frist und Anhänge** (Spezifikation
 * Abschnitt 19, T-147).
 *
 * ===========================================================================
 * Warum dieser Abschnitt gegen einen **festen** Tag rechnet
 * ===========================================================================
 *
 * Die drei Zustände der Frist sind Tagesvergleiche (A-19.6). Rechnete diese
 * Seite gegen die Systemuhr, sähe sie an jedem zweiten Tag anders aus, und ein
 * Abgleich gegen den Prototyp wäre nicht wiederholbar. `SHOWCASE_TODAY` ist
 * deshalb fest — so wie alle übrigen Beispieldaten dieser Seite erfunden und
 * fest sind.
 *
 * ===========================================================================
 * Was hier abzunehmen ist
 * ===========================================================================
 *
 * 1. **Die dritte Sorte Marke trägt.** Nebeneinander stehen `DoneFlag`, der
 *    Exportstatus und die Frist. Wer den Graustufenschalter oben umlegt, sieht
 *    zugleich, dass fünf der sechs Merkmale ohne Farbe tragen (SC 1.4.1).
 * 2. **Ohne Frist steht nichts da.** Die vierte Zeile hat keine, und sie hat
 *    deshalb auch kein Etikett „Ohne Frist" (A-19.5, wörtlich).
 * 3. **Die Rückfrage vor dem Öffnen einer Datei** — mit dem Fall, um den es
 *    geht: ein Dateiname mit einem Richtungszeichen. Er zeigt sich hier so, wie
 *    er ist, und nicht umgedreht.
 */

/** Fünf Fristen um den festen Tag herum. Erfunden wie alles auf dieser Seite. */
const DEADLINE_CASES: ReadonlyArray<{
  readonly title: string;
  readonly dueDate: string | null;
  readonly note: string;
}> = [
  {
    title: "Musterwerk AG — Rechnungslauf abschließen",
    dueDate: "2026-08-28",
    note: "Überfällig: voll gefüllt, halbfett, Warndreieck, Datum dabei. Die lauteste der drei.",
  },
  {
    title: "Beispiel GmbH — Abnahmeprotokoll versenden",
    dueDate: SHOWCASE_TODAY,
    note: "Heute fällig: Kontur statt Fläche, halbfett, Kalender mit Zeiger.",
  },
  {
    title: "Musterkunde Nord — Schnittstelle testen",
    dueDate: "2026-09-19",
    note: "Später fällig: kein Zustandswort, keine Fläche, normale Schrift — nur Symbol und Datum. Der Regelfall flüstert.",
  },
  {
    title: "Betriebshandbuch Kapitel 3 fortschreiben",
    dueDate: null,
    note: "Ohne Frist: Es steht nichts da. Weder „Ohne Frist“ noch „unbefristet“ — A-19.5 sagt, dieses Todo hat keinen dieser Zustände.",
  },
];

/**
 * Vier Anhänge, einer je Fall aus A-19.12 und A-19.15.
 *
 * Der zweite trägt **keinen** Titel: Dort greift die Ersatzbezeichnung, und man
 * sieht, dass nie eine leere Zeile entsteht.
 */
/**
 * Was ein Anhang trägt, den der Benutzer **selbst** eingetragen hat (A-A-84).
 *
 * Vier Felder, und alle vier sagen dasselbe: Es gibt hier keine fremde Hand.
 * Der Dienst bildet Unbekanntes ausdrücklich auf `user` ab und nicht auf
 * `email` — eine behauptete Herkunft läse die Rückfrage vor dem Öffnen vor.
 */
const SELF_CHOSEN: Pick<Attachment, "origin" | "originSender" | "displayName" | "rebuilt"> = {
  origin: "user",
  originSender: null,
  displayName: null,
  rebuilt: false,
};

const ATTACHMENT_CASES: readonly Attachment[] = [
  {
    id: "a-1" as Id,
    todoId: "t-1" as Id,
    kind: "link",
    title: "Kundenportal — Ticket 4711",
    target: "https://portal.beispiel.invalid/tickets/4711",
    position: 1,
    createdAt: "2026-09-01T08:00:00Z",
    ...SELF_CHOSEN,
  },
  {
    id: "a-2" as Id,
    todoId: "t-1" as Id,
    kind: "link",
    title: null,
    target: "https://wiki.beispiel.invalid/betrieb/schnittstellen/abrechnung",
    position: 2,
    createdAt: "2026-09-01T08:05:00Z",
    ...SELF_CHOSEN,
  },
  {
    id: "a-3" as Id,
    todoId: "t-1" as Id,
    kind: "file",
    title: null,
    target: "/home/musterfrau/Belege/2026-09/abnahmeprotokoll.pdf",
    position: 3,
    createdAt: "2026-09-02T09:10:00Z",
    ...SELF_CHOSEN,
  },
  {
    id: "a-4" as Id,
    todoId: "t-1" as Id,
    kind: "file",
    title: null,
    /*
      **Der Fall, um den es geht** (Auflage A-A-6 Punkt 2). `U+202E` dreht die
      Anzeige einer Zeile um: Ohne die Behandlung für fremden Text stünde hier
      `rechnungexe.pdf` — an einer Zeile, deren Klick ein Programm startet.
      `Foreign` macht das Zeichen sichtbar, statt es zu verschweigen.
    */
    target: "/home/musterfrau/Downloads/rechnung\u{202e}fdp.exe",
    position: 4,
    createdAt: "2026-09-03T11:00:00Z",
    ...SELF_CHOSEN,
  },
  /*
    **Der Anhang aus einer E-Mail** (A-19.23). Drei Dinge auf einmal, und keines
    davon hat ein Anhang, den der Benutzer selbst eingetragen hat:

     - Der **Pfad** ist der von SuperTakt **erzeugte** Name (A-A-78) — er sagt
       einem Menschen nichts, und das ist Absicht.
     - Der **Anzeigename** kommt aus fremder Hand. Er ist lang genug, um in
       jeder Spalte dieser Seite umzubrechen, und er endet auf `.exe`. Genau
       dieses Ende nimmt ein Deckel weg (A-19.23b, A-A-93, R-27).
     - Der **Absender** steht an der Zeile (A-A-87).
  */
  {
    id: "a-5" as Id,
    todoId: "t-1" as Id,
    kind: "file",
    title: null,
    target:
      "/home/musterfrau/.local/share/de.takt.desktop/email-attachments/4a7c1f90b2e84d6580aa13c7e5d90f21.exe",
    position: 5,
    createdAt: "2026-09-04T07:30:00Z",
    origin: "email",
    originSender: "buchhaltung@lieferant.invalid",
    displayName:
      "Rechnung_Nachtrag_Q3_2026_Projekt_Schnittstelle_Abrechnung_Endfassung_final.exe",
    rebuilt: false,
  },
  /*
    **Der Nachbau** (A-19.22a/b, Auflage A-A-97). Outlook hat die ursprüngliche
    Nachricht nicht herausgegeben; SuperTakt hat sie aus den verfügbaren Angaben
    zusammengestellt. Die Kennzeichnung hängt an der **Datei** und steht deshalb
    hier — drei Wochen nach dem Anlegen, wo sie gebraucht wird, und nicht im
    Aufgabenbereich, wo sie beim Anlegen einmal aufblitzte.
  */
  {
    id: "a-6" as Id,
    todoId: "t-1" as Id,
    kind: "file",
    title: null,
    target:
      "/home/musterfrau/.local/share/de.takt.desktop/email-attachments/9f21c05ab7de41328e6f0a5c3b91d874.eml",
    position: 6,
    createdAt: "2026-09-04T07:30:01Z",
    origin: "email",
    originSender: "buchhaltung@lieferant.invalid",
    displayName: "Nachtrag zur Rechnung 2026-0417.eml",
    rebuilt: true,
  },
];

/** Der Fehlerfall aus A-19.15, wörtlich so, wie die Anwendung ihn zeigt. */
const FAILURE_TEXT = "Diese Datei ist an diesem Pfad nicht mehr vorhanden.";

/**
 * Die Absage, die **vor** dem Klick feststeht (V-07) — wörtlich derselbe Satz,
 * den `REFUSAL_TEXT` in `features/todos/Attachments.tsx` zu `path_indirect_extension`
 * führt. Er steht hier zweimal, weil die Musterseite keine Anwendung ist; er
 * darf nirgends anders lauten.
 */
const BLOCKED_TEXT =
  "Diese Datei ist eine Verknüpfung. Ihr Ziel steht woanders — die Rückfrage könnte darüber nicht die Wahrheit sagen, deshalb öffnet SuperTakt sie nicht.";

export function DeadlineSection() {
  const [dialog, setDialog] = useState<
    | "harmlos"
    | "ausfuehrbar"
    | "abgewiesen"
    | "namensabweichung"
    | "umleitung"
    | "ausEmail"
    | "nachbau"
    | null
  >(null);

  return (
    <Section
      id="frist"
      title="13 — Frist und Anhänge"
      lead="Die dritte Sorte Marke am Todo, fünf Flächen für Anhänge und die Rückfrage, die vor einem Programmstart steht."
      refs={["A-19.1", "A-19.5", "A-19.9", "A-19.12", "A-19.15", "A-19.18", "E-070", "E-071", "E-072"]}
    >
      <Card
        title="Die drei Zustände"
        description={`Gerechnet gegen einen festen Tag: ${SHOWCASE_TODAY}. In der Anwendung ist es der heutige — im selben Tagesbegriff wie die Tagesgruppierung des Exports (E-025).`}
      >
        <ul className="showcase-rows" aria-label="Zustände der Frist">
          {DEADLINE_CASES.map((entry) => (
            <li key={entry.title} className="showcase-row">
              <span className="showcase-row__main">
                <span className="showcase-row__title">{entry.title}</span>
                <span className="showcase-row__note">{entry.note}</span>
              </span>
              <DeadlineFlag dueDate={entry.dueDate} today={SHOWCASE_TODAY} />
            </li>
          ))}
        </ul>

        <InlineMessage tone="info" title="Warum es überhaupt eine dritte Marke geben darf">
          Am Todo hängen bereits das Erledigt-Kennzeichen und der Exportstatus. Die Frist trägt nur
          unter drei Auflagen: Sie ist <strong>ein</strong> Element und nicht drei, sie ist{" "}
          <strong>abwesend</strong>, wenn keine Frist gesetzt ist, und nur{" "}
          <strong>zwei der drei Zustände</strong> sind laut. Ohne die dritte Auflage stünde sie auf
          jedem Todo mit Frist voll sichtbar — der Punkt, an dem A-13.2 kippt.
        </InlineMessage>
      </Card>

      <Card
        title="Anhänge — Titel und Ersatzbezeichnung"
        description="Fehlt der Titel, steht ein lesbares Stück der Adresse beziehungsweise der Dateiname. Nie eine leere Zeile (A-19.12)."
      >
        <ul className="attachment-list" aria-label="Anhänge, Beispiel">
          {ATTACHMENT_CASES.map((attachment) => (
            <li key={attachment.id} className="attachment">
              <span className="attachment__icon" aria-hidden>
                <Icon name={attachment.kind === "link" ? "link" : "folder"} size={16} />
              </span>
              <span className="attachment__main">
                <span className="attachment__open">
                  {/*
                    `ForeignName` und nicht `Foreign`: Der Name darf am Ende
                    **nie** gekürzt werden (A-19.23b, A-A-93). Die Musterseite
                    zeigt die Bauart und nicht nur das Bild — ein `truncate`
                    hier wäre dieselbe Lüge wie in der Anwendung.
                  */}
                  <ForeignName className="attachment__label" value={attachmentLabel(attachment)} />
                  {/*
                    „(nachgebaut)" steht hinter dem Namen und **nicht in ihm**
                    (A-19.22b): Der Name kommt aus fremder Hand, die Klammer von
                    uns. Zwei Herkünfte in einer Zeichenkette wären an dieser
                    Zeile der teuerste Fehler — ein Absender könnte die
                    Kennzeichnung sonst selbst schreiben.
                  */}
                  {attachment.rebuilt ? (
                    <span className="attachment__rebuilt">
                      <span className="attachment__mark-icon" aria-hidden>
                        <Icon name="alert-triangle" size={12} />
                      </span>
                      (nachgebaut)
                    </span>
                  ) : null}
                </span>
                {attachment.origin === "email" ? (
                  <span className="attachment__marks">
                    <span className="attachment__mark attachment__mark--email">
                      <span className="attachment__mark-icon" aria-hidden>
                        <Icon name="inbox" size={12} />
                      </span>
                      <span>
                        Aus einer E-Mail von <Foreign value={attachment.originSender ?? ""} />
                      </span>
                    </span>
                  </span>
                ) : null}
                <span className="attachment__value muted">
                  <Foreign value={attachment.target} />
                </span>
              </span>
            </li>
          ))}
        </ul>

        <SubHeading>Der Anhang, der sich nicht öffnen lässt (A-19.15)</SubHeading>
        <ul className="attachment-list" aria-label="Anhang mit Fehler, Beispiel">
          <li className="attachment attachment--failed">
            <span className="attachment__icon" aria-hidden>
              <Icon name="folder" size={16} />
            </span>
            <span className="attachment__main">
              <span className="attachment__label">abnahmeprotokoll.pdf</span>
              <span className="attachment__value muted">
                /home/musterfrau/Belege/2026-09/abnahmeprotokoll.pdf
              </span>
              {/* Mit `role="status"`, wie in `Attachments.tsx` (O-GQ, T-191):
                  Die Musterseite zeigt die Bauart und nicht nur das Bild. Hier
                  steht der Satz von Anfang an da — eine Region sagt an, was
                  sich **ändert**, nicht was beim Aufbau schon dasteht. */}
              <span className="attachment__failure" role="status">
                <Icon name="alert-triangle" size={13} />
                <span>{FAILURE_TEXT}</span>
              </span>
            </span>
          </li>
        </ul>
        <p className="section__lead">
          Er <strong>verschwindet nicht</strong> und er <strong>wirft nicht</strong>. Kein „Erneut
          versuchen" — es gibt nichts zu wiederholen. Zwei Wege bleiben: entfernen oder den Pfad
          bearbeiten.
        </p>

        <SubHeading>Leer</SubHeading>
        <EmptyState
          icon="paperclip"
          compact
          title="Keine Anhänge"
          description="Ein Verweis, ein Bild oder eine Datei, die zu diesem Todo gehört. SuperTakt kopiert nur Bilder; Verweise und Dateien merkt es sich als Adresse beziehungsweise Pfad."
        />
      </Card>

      <Card
        title="Die Rückfrage vor dem Öffnen einer Datei"
        description="Sie steht nur vor einer Datei, nie vor einem Verweis — eine Frage, die immer erscheint, ist die Frage, die weggeklickt wird."
      >
        <div className="showcase-buttons">
          <Button variant="secondary" onClick={() => setDialog("harmlos")}>
            Harmlose Endung
          </Button>
          <Button variant="secondary" onClick={() => setDialog("ausfuehrbar")}>
            Ausführbare Endung, mit Richtungszeichen im Namen
          </Button>
          <Button variant="secondary" onClick={() => setDialog("abgewiesen")}>
            Von der Hülle abgewiesen
          </Button>
          <Button variant="secondary" onClick={() => setDialog("namensabweichung")}>
            Name beim Öffnen weicht ab
          </Button>
          <Button variant="secondary" onClick={() => setDialog("umleitung")}>
            Umleitung — SuperTakt öffnet sie gar nicht
          </Button>
          <Button variant="secondary" onClick={() => setDialog("ausEmail")}>
            Aus einer E-Mail, langer fremder Name mit „.exe"
          </Button>
          <Button variant="secondary" onClick={() => setDialog("nachbau")}>
            Nachbau der Nachricht
          </Button>
        </div>

        <InlineMessage tone="info" title="Sechs Eigenschaften, und keine davon ist Zierde">
          Voller Pfad, ungekürzt und mit abgesetztem Dateinamen · jeder angezeigte Teil durch die
          Behandlung für fremden Text · die <strong>Wirkung</strong> im Satz, nicht die Handlung ·
          keine Vorauswahl, kein Anfangsfokus auf einem Knopf, Enter löst nichts aus · <strong>kein
          „nicht mehr fragen"</strong> · kein <code>window.confirm</code>.
        </InlineMessage>
      </Card>

      <AttachmentOpenDialog
        open={dialog === "harmlos"}
        path="/home/musterfrau/Belege/2026-09/abnahmeprotokoll.pdf"
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
      <AttachmentOpenDialog
        open={dialog === "ausfuehrbar"}
        path={"/home/musterfrau/Downloads/rechnung\u{202e}fdp.exe"}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
      <AttachmentOpenDialog
        open={dialog === "abgewiesen"}
        path="/home/musterfrau/Belege/verschwunden.pdf"
        refusal={FAILURE_TEXT}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
      {/*
        X-05: Der Name endet auf einem Punkt, Windows wirft ihn weg. Die
        Rückfrage stellt beide Namen untereinander und sagt in einem Satz,
        woher der Unterschied kommt. Bei jedem anderen Pfad dieser Seite
        erscheint dieses dritte Paar **nicht**.
      */}
      <AttachmentOpenDialog
        open={dialog === "namensabweichung"}
        path="/home/musterfrau/Downloads/quartalsbericht.exe."
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
      {/*
        V-07: Für eine Umleitung gibt es keinen Öffnen-Knopf mehr. Der Satz
        stand vorher erst **nach** dem Bestätigen da — bei genau der Dateiart,
        über deren Wirkung die Rückfrage nicht die Wahrheit sagen kann.
      */}
      <AttachmentOpenDialog
        open={dialog === "umleitung"}
        path="/home/musterfrau/Belege/rechnung.lnk"
        foreseenRefusal={BLOCKED_TEXT}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
      {/*
        T-302 — der Fall, um den es in A-19.23b und R-27 geht. Der Anzeigename
        ist 78 Zeichen lang und endet auf `.exe`. Ein Deckel am Zeilenende
        machte daraus `Rechnung_Nachtrag_Q3_2026…` — der Benutzer bestätigte
        eine PDF und startete ein Programm, **ohne daß ein Zeichen falsch
        gewesen wäre**. Hier bricht der Name um, und die Endung steht zusätzlich
        abgesetzt in ihrer eigenen Zeile (A-A-86).
      */}
      <AttachmentOpenDialog
        open={dialog === "ausEmail"}
        path="/home/musterfrau/.local/share/de.takt.desktop/email-attachments/4a7c1f90b2e84d6580aa13c7e5d90f21.exe"
        displayName="Rechnung_Nachtrag_Q3_2026_Projekt_Schnittstelle_Abrechnung_Endfassung_final.exe"
        originSender="buchhaltung@lieferant.invalid"
        fromEmail
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
      {/*
        A-19.22b und Auflage A-A-97: Die Kennzeichnung hängt an der **Datei**.
        Drei Wochen nach dem Anlegen ist der Aufgabenbereich längst zu — diese
        Rückfrage ist die Stelle, an der der Satz noch gelesen wird, bevor die
        Datei in eine Akte wandert.
      */}
      <AttachmentOpenDialog
        open={dialog === "nachbau"}
        path="/home/musterfrau/.local/share/de.takt.desktop/email-attachments/9f21c05ab7de41328e6f0a5c3b91d874.eml"
        displayName="Nachtrag zur Rechnung 2026-0417.eml"
        originSender="buchhaltung@lieferant.invalid"
        fromEmail
        rebuilt
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
    </Section>
  );
}

/** Nur damit die Wörter der drei Arten auch hier aus einer Quelle kommen. */
export const SHOWCASE_KIND_WORDS = ATTACHMENT_KIND_LABEL;
