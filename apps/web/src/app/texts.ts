import type { TodoMatchOrigin } from "@takt/domain";
import { pickTexts } from "../lib/language";

/** UI texts of the application frame (A-28.2). `en` has the shape of `de`. */
const de = {
  // Navigation
  nav: {
    label: "Hauptnavigation",
    dashboard: "Dashboard",
    todos: "Todos",
    board: "Kanban",
    time: "Zeiterfassung",
    export: "Export",
    settings: "Einstellungen",
    openTodos: (count: string) => `${count} offene Todos`,
    unexportedEntries: (count: string) => `${count} noch nicht exportierte Buchungen`,
    versionAvailable: (version: string) => `v${version} verfügbar`,
    version: (version: string) => `Version ${version}`,
    versionUnknown: "Version unbekannt",
  },

  // GlobalSearch
  search: {
    label: "Globale Suche über Todos, Vermerke und Leistungstexte",
    placeholder: "Suchen … (Strg + K)",
    results: "Suchergebnisse",
    doneSuffix: " · erledigt",
    call: (callNumber: string) => `Call ${callNumber}`,
    withoutNote: "(ohne Leistung)",
    failed: "Die Suche ist fehlgeschlagen. Läuft der lokale Dienst noch?",
    // SP-21 in the approved version (T-393 K-15, E-138 point 2).
    noHit: (quotedTerm: string) =>
      `Kein Treffer für ${quotedTerm}. Gesucht wird in Titeln, Call-Nummern, Vermerken und Leistungstexten.`,
    // Groups by kind of hit (T-393 K-9 to K-11).
    groupTodos: "Todos",
    groupNote: "Im Vermerk (intern)",
    groupEntries: "In Leistungen",
    hitIn: (origins: string) => `Treffer in: ${origins}`,
    hitInNoteOnly: "Treffer im Vermerk",
    origin: { title: "Titel", call_number: "Call-Nummer", todo_note: "Vermerk" } satisfies Record<TodoMatchOrigin, string>,
  },

  // App frame and connection
  connecting: "SuperTakt wird verbunden",
  connectingText: "SuperTakt verbindet sich mit dem lokalen Dienst …",
  connectFailedTitle: "SuperTakt konnte sich nicht verbinden",
  serviceNotReady: "Der lokale Dienst ist noch nicht bereit",
  connectionFailed: "Die Verbindung zum lokalen Dienst ist fehlgeschlagen",
  connectFailedFallback: "Beenden Sie SuperTakt vollständig und starten Sie es neu.",
  noDataWithoutService:
    "Ohne den lokalen Dienst gibt es keine Daten: Todos, Zeiten und Einstellungen liegen allein dort. SuperTakt speichert nichts im Browser.",
  retry: "Erneut versuchen",
  noShellTitle: "SuperTakt läuft in der SuperTakt-Anwendung",
  noShellWhat:
    "Diese Seite ist die Oberfläche von SuperTakt. Sie spricht mit einem lokalen Dienst, der ausschließlich von der SuperTakt-Anwendung gestartet wird — und sie weist sich dabei mit einem Sitzungsgeheimnis aus, das nur diese Anwendung kennt. Im Browser allein gibt es beides nicht, deshalb bleibt hier alles leer.",
  noShellWhy:
    "Das ist kein Fehler, sondern die Absicht: Der Dienst hört nur auf die eigene Maschine und beantwortet keine Anfrage ohne Nachweis — auch nicht die Frage, ob es ihn gibt.",
  skipToContent: "Zum Inhalt springen",
  screenLoading: "Ansicht wird geladen",
  screenLoadingText: "Ansicht wird geladen …",
  unknownScreen: "Diese Ansicht gibt es nicht",
  unknownScreenHint: "Die Adresse führt ins Leere. Über die Navigation links geht es weiter.",
  toDashboard: "Zum Dashboard",
  screenLoadFailed: "Die Ansicht konnte nicht geladen werden",
  reload: "Erneut laden",
  reloadHint: "Bitte laden Sie die Anwendung erneut.",
  unknownStatus: "Unbekannter Status",

  // connection.ts: what does not exist without the application shell
  noShell: {
    quit: "SuperTakt läuft hier ohne seine Anwendungshülle. Den Befehl zum Beenden gibt es nur in der SuperTakt-Anwendung.",
    releasePage:
      "Die Release-Seite öffnet die SuperTakt-Anwendung. Im Browser allein steht dieser Weg nicht zur Verfügung.",
    folderPicker: "Der Ordnerauswahldialog gehört zur SuperTakt-Anwendung. Im Browser allein gibt es ihn nicht.",
    attachments: "Anhänge öffnet die SuperTakt-Anwendung. Im Browser allein steht dieser Weg nicht zur Verfügung.",
    filePicker: "Der Dateiauswahldialog gehört zur SuperTakt-Anwendung. Im Browser allein gibt es ihn nicht.",
    certificate: "Bitte öffnen Sie die SuperTakt-Desktop-App für die Zertifikatseinrichtung.",
  },

  // DashboardScreen
  dashboard: {
    title: "Dashboard",
    loading: "Dashboard wird geladen",
    newTodo: "Neues Todo",
    timeTracking: "Zeiterfassung",
    todayRecorded: "Heute erfasst",
    entryOne: "Buchung",
    entryMany: "Buchungen",
    notExported: "Noch nicht exportiert",
    openEntryOne: "offene Buchung",
    openEntryMany: "offene Buchungen",
    exportValueUnavailable: (openEntries: string) => `${openEntries} · Exportwert nicht abrufbar`,
    exportSummary: (entries: string, rows: string, hours: string) => `${entries} in ${rows} · ${hours} h`,
    exportRowOne: "Exportzeile",
    exportRowMany: "Exportzeilen",
    toExport: "Zur Export-Ansicht",
    openTodos: "Offene Todos",
    openTodosDetail: "In Pool-Ansichten sichtbar.",
    overdue: "Überfällig",
    openTodoOne: "offenes Todo",
    openTodoMany: "offene Todos",
    overdueDetail: (todos: string) => `${todos} mit einer Frist in der Vergangenheit.`,
    showInTodoList: "In der Todo-Liste zeigen",
    doneTodos: "Erledigte Todos",
    doneTodosDetail: "Ausgeblendet, bis Sie sie einblenden.",
    previewFailedTitle: "Was der Export aus den offenen Buchungen macht, ließ sich nicht abrufen",
    previewFailedBody:
      "Wie viel Zeit erfasst ist, steht fest — wie viele Exportzeilen und Stunden daraus werden, weiß SuperTakt gerade nicht und rät es nicht. Solange fehlt hier auch die Prüfung, ob eine Tagesgruppe ohne Leistung dasteht.",
    blockedGroupOne: "Tagesgruppe geht",
    blockedGroupMany: "Tagesgruppen gehen",
    blockedTitle: (groups: string) => `${groups} so nicht in den Export`,
    showInExport: "In der Export-Ansicht ansehen",
    blockedBody:
      "Ohne Leistungstext nimmt das Abrechnungstool eine Zeile nicht an. Der übrige Export läuft trotzdem — diese Zeit bliebe aber liegen, ohne dass es jemandem auffiele.",
    recent: "Zuletzt bearbeitet",
    recentDescription: "Das jüngste zuerst — erledigte mit ihrem Kennzeichen. Ein Timerstart hebt es auf.",
    noTodo: "Noch kein Todo",
    noTodoHint: "SuperTakt erfasst Zeit auf Todos. Legen Sie das erste an.",
    stop: "Stopp",
    start: "Start",
    todayEntries: "Buchungen von heute",
    nothingToday: "Heute noch nichts erfasst",
    nothingTodayHint: "Der erste Timerstart legt die erste Buchung an.",
    withoutNote: "Ohne Leistung",
    openTodoOfEntry: "Todo dieser Buchung öffnen",
  },

  // ShellStatus
  shell: {
    quitFailedTitle: "SuperTakt ließ sich so nicht beenden",
    quitFailedFallback: "Der Beenden-Befehl hat nicht gewirkt: Das Fenster steht noch.",
    quitStepWindow: "Schließen Sie das Fenster über das Kreuz in der Titelleiste — oder mit",
    quitStepWindowKeys: "Alt+F4",
    quitStepTaskManagerLead: "Hilft das nicht:",
    quitStepTaskManagerKeys: "Strg+Umschalt+Esc",
    quitStepTaskManager: "öffnet den Task-Manager. Beenden Sie dort den Eintrag „SuperTakt\".",
    quitSafe:
      "Beides ist gefahrlos. Was gespeichert ist, bleibt gespeichert, und der lokale Dienst hält von selbst an, sobald das Fenster von SuperTakt weg ist.",
    quitting: "SuperTakt wird beendet …",
    quit: "SuperTakt beenden",
    startupTitle: "SuperTakt ist nicht vollständig gestartet",
    startupBody: "Ein Teil der Anwendung steht nicht zur Verfügung. Das ist SuperTakt beim Start aufgefallen:",
    whatYouCanDo: "Was Sie tun können",
    startupAdvice:
      "Beenden Sie SuperTakt und starten Sie es neu. Bleibt die Meldung, geben Sie sie unverändert an Ihre Systembetreuung weiter — sie benennt bereits, was fehlt.",
    syncTitle: "Die Daten von SuperTakt liegen an einer ungeeigneten Stelle",
    whatItMeans: "Was das bedeutet",
    syncMeaning:
      "Zwei Programme, die gleichzeitig an derselben Datei arbeiten, können sie unbrauchbar machen — die erfassten Zeiten wären dann verloren. Und die Daten Ihrer Kunden verlassen den Rechner, sobald der Ordner auf einen Dateiserver oder in einen Onlinespeicher kopiert wird.",
    syncSelfHelp:
      "SuperTakt kann diesen Ordner nicht selbst verlegen; er wird vom Betriebssystem vorgegeben. " +
      "Legen Sie zuerst unter Einstellungen eine SuperTakt-Datensicherung an. Nehmen Sie dann den " +
      "Ordner von der Synchronisierung aus, oder stellen Sie den Ordner für lokale Anwendungsdaten " +
      "(Windows: LOCALAPPDATA, Linux: XDG_DATA_HOME) auf ein Laufwerk dieses Rechners um. Nach einem " +
      "Neustart verschwindet dieser Hinweis; fehlen dann Daten, spielen Sie die Datensicherung wieder ein.",
    forSupport: "Für die Systembetreuung",
    syncFoot: "SuperTakt arbeitet weiter. Der Hinweis bleibt stehen, solange der Ordner dort liegt.",
    stoppedTitle: "SuperTakt kann im Moment nichts speichern",
    stoppedBody:
      "Der lokale Dienst von SuperTakt ist nicht erreichbar. Er ist der Teil der Anwendung, der jede Buchung und jede Änderung auf die Festplatte schreibt.",
    stoppedAssurance: "Was bereits gespeichert ist, bleibt erhalten. Alles, was Sie ab jetzt eingeben, geht verloren.",
    whatToDo: "Was zu tun ist",
    stoppedStepNote: "Notieren Sie sich, woran Sie gerade gearbeitet haben.",
    stoppedStepRestart: "Beenden Sie SuperTakt und starten Sie es neu.",
    stoppedStepSupport: "Kommt die Meldung wieder, geben Sie sie an Ihre Systembetreuung weiter.",
    exitCodeLead: "Beendigungscode",
    exitCodeTail: "— hilft bei der Rückfrage.",
    userNameTitle: "SuperTakt kann unter diesem Windows-Benutzernamen nicht arbeiten",
    userNameBody:
      "SuperTakt schreibt den Windows-Benutzernamen, unter dem Sie an diesem Rechner angemeldet sind, unverändert in jede Exportdatei. Daran erkennt die Abrechnung, wem die erfasste Zeit gehört.",
    userNameConsequence:
      "In diesem Namen steht ein Steuer- oder Richtungszeichen. Solche Zeichen sind unsichtbar und können die Zeile, in der sie stehen, umstellen. SuperTakt startet deshalb nicht, statt eine Abrechnung zu schreiben, die etwas anderes anzeigt, als in ihr steht.",
    userNameNotShown:
      "Der Name selbst steht nicht in dieser Meldung — genau die Zeichen, um die es geht, würden sie umdrehen.",
    userNameStepOtherAccount:
      "Melden Sie sich an diesem Rechner unter einem anderen Windows-Konto an und starten Sie SuperTakt dort. Das ist der Weg, der ohne fremde Hilfe funktioniert.",
    userNameStepRename:
      "Oder lassen Sie den Anmeldenamen dieses Kontos ändern. Das geht nur mit Administratorrechten — bei einem Firmenkonto über die Systembetreuung.",
    userNameDataLead: "Ihre bisher erfassten Daten sind davon nicht betroffen. Sie liegen in",
    userNameDataTail:
      ". Sichern Sie diesen Ordner, bevor Sie das Konto wechseln: Unter einem anderen Konto legt SuperTakt einen eigenen an.",
    userNameSupportLead: "Der lokale Dienst weist den Windows-Benutzernamen ab (Grund",
    userNameSupportTail:
      "): Er enthält ein Steuer- oder Richtungszeichen (C0, C1 oder ein bidirektionales Formatierungszeichen) und ginge unverändert als Feld „WindowsUser\" in die Abrechnungsdatei.",
  },
};

const en: typeof de = {
  nav: {
    label: "Main navigation",
    dashboard: "Dashboard",
    todos: "Todos",
    board: "Kanban",
    time: "Time tracking",
    export: "Export",
    settings: "Settings",
    openTodos: (count: string) => `${count} open todos`,
    unexportedEntries: (count: string) => `${count} entries not yet exported`,
    versionAvailable: (version: string) => `v${version} available`,
    version: (version: string) => `Version ${version}`,
    versionUnknown: "Version unknown",
  },

  search: {
    label: "Global search across todos, internal notes and work done",
    placeholder: "Search … (Ctrl + K)",
    results: "Search results",
    doneSuffix: " · done",
    call: (callNumber: string) => `Call ${callNumber}`,
    withoutNote: "(no work done)",
    failed: "The search failed. Is the local service still running?",
    noHit: (quotedTerm: string) =>
      `No match for ${quotedTerm}. The search covers titles, call numbers, internal notes and work done.`,
    groupTodos: "Todos",
    groupNote: "In the internal note",
    groupEntries: "In work done",
    hitIn: (origins: string) => `Match in: ${origins}`,
    hitInNoteOnly: "Match in the internal note",
    origin: { title: "title", call_number: "call number", todo_note: "internal note" } satisfies Record<TodoMatchOrigin, string>,
  },

  connecting: "Connecting SuperTakt",
  connectingText: "SuperTakt is connecting to the local service …",
  connectFailedTitle: "SuperTakt could not connect",
  serviceNotReady: "The local service is not ready yet",
  connectionFailed: "The connection to the local service failed",
  connectFailedFallback: "Quit SuperTakt completely and start it again.",
  noDataWithoutService:
    "Without the local service there is no data: todos, times and settings live there alone. SuperTakt stores nothing in the browser.",
  retry: "Try again",
  noShellTitle: "SuperTakt runs in the SuperTakt application",
  noShellWhat:
    "This page is the interface of SuperTakt. It talks to a local service that only the SuperTakt application starts — and it identifies itself with a session secret that only this application knows. In the browser alone neither exists, so everything stays empty here.",
  noShellWhy:
    "This is not an error but intended: the service only listens to its own machine and answers nothing without proof — not even the question whether it exists.",
  skipToContent: "Skip to content",
  screenLoading: "Loading view",
  screenLoadingText: "Loading view …",
  unknownScreen: "This view does not exist",
  unknownScreenHint: "The address leads nowhere. Continue via the navigation on the left.",
  toDashboard: "Go to dashboard",
  screenLoadFailed: "The view could not be loaded",
  reload: "Reload",
  reloadHint: "Please reload the application.",
  unknownStatus: "Unknown status",

  noShell: {
    quit: "SuperTakt is running here without its application shell. The quit command only exists in the SuperTakt application.",
    releasePage: "The SuperTakt application opens the release page. This is not available in the browser alone.",
    folderPicker: "The folder picker belongs to the SuperTakt application. It does not exist in the browser alone.",
    attachments: "The SuperTakt application opens attachments. This is not available in the browser alone.",
    filePicker: "The file picker belongs to the SuperTakt application. It does not exist in the browser alone.",
    certificate: "Please open the SuperTakt desktop app to set up the certificate.",
  },

  dashboard: {
    title: "Dashboard",
    loading: "Loading dashboard",
    newTodo: "New todo",
    timeTracking: "Time tracking",
    todayRecorded: "Recorded today",
    entryOne: "entry",
    entryMany: "entries",
    notExported: "Not yet exported",
    openEntryOne: "open entry",
    openEntryMany: "open entries",
    exportValueUnavailable: (openEntries: string) => `${openEntries} · export value unavailable`,
    exportSummary: (entries: string, rows: string, hours: string) => `${entries} in ${rows} · ${hours} h`,
    exportRowOne: "export row",
    exportRowMany: "export rows",
    toExport: "Go to export",
    openTodos: "Open todos",
    openTodosDetail: "Visible in pool views.",
    overdue: "Overdue",
    openTodoOne: "open todo",
    openTodoMany: "open todos",
    overdueDetail: (todos: string) => `${todos} with a due date in the past.`,
    showInTodoList: "Show in todo list",
    doneTodos: "Done todos",
    doneTodosDetail: "Hidden until you show them.",
    previewFailedTitle: "What the export makes of the open entries could not be retrieved",
    previewFailedBody:
      "How much time is recorded is certain — how many export rows and hours result from it, SuperTakt does not know right now and does not guess. Until then, the check for day groups without work done is missing here as well.",
    blockedGroupOne: "day group cannot",
    blockedGroupMany: "day groups cannot",
    blockedTitle: (groups: string) => `${groups} go into the export like this`,
    showInExport: "View in export",
    blockedBody:
      "The billing tool does not accept a row without work done. The rest of the export still runs — but this time would be left behind without anyone noticing.",
    recent: "Recently edited",
    recentDescription: "Newest first — done ones with their flag. A timer start lifts it.",
    noTodo: "No todo yet",
    noTodoHint: "SuperTakt records time on todos. Create the first one.",
    stop: "Stop",
    start: "Start",
    todayEntries: "Today's entries",
    nothingToday: "Nothing recorded today",
    nothingTodayHint: "The first timer start creates the first entry.",
    withoutNote: "No work done",
    openTodoOfEntry: "Open the todo of this entry",
  },

  shell: {
    quitFailedTitle: "SuperTakt could not be quit this way",
    quitFailedFallback: "The quit command had no effect: the window is still open.",
    quitStepWindow: "Close the window with the cross in the title bar — or with",
    quitStepWindowKeys: "Alt+F4",
    quitStepTaskManagerLead: "If that does not help:",
    quitStepTaskManagerKeys: "Ctrl+Shift+Esc",
    quitStepTaskManager: "opens the Task Manager. End the “SuperTakt” entry there.",
    quitSafe:
      "Both are safe. What is saved stays saved, and the local service stops on its own once the SuperTakt window is gone.",
    quitting: "Quitting SuperTakt …",
    quit: "Quit SuperTakt",
    startupTitle: "SuperTakt did not start completely",
    startupBody: "Part of the application is not available. SuperTakt noticed this at startup:",
    whatYouCanDo: "What you can do",
    startupAdvice:
      "Quit SuperTakt and start it again. If the message remains, pass it on unchanged to your IT support — it already names what is missing.",
    syncTitle: "SuperTakt's data is stored in an unsuitable place",
    whatItMeans: "What this means",
    syncMeaning:
      "Two programs working on the same file at the same time can make it unusable — the recorded times would then be lost. And your customers' data leaves this computer as soon as the folder is copied to a file server or online storage.",
    syncSelfHelp:
      "SuperTakt cannot move this folder itself; the operating system determines it. " +
      "First create a SuperTakt backup under Settings. Then exclude the folder from synchronisation, " +
      "or point the folder for local application data (Windows: LOCALAPPDATA, Linux: XDG_DATA_HOME) " +
      "to a drive of this computer. After a restart this notice disappears; if data is missing then, restore the backup.",
    forSupport: "For IT support",
    syncFoot: "SuperTakt keeps working. The notice stays as long as the folder is there.",
    stoppedTitle: "SuperTakt cannot save anything right now",
    stoppedBody:
      "SuperTakt's local service cannot be reached. It is the part of the application that writes every entry and every change to disk.",
    stoppedAssurance: "What is already saved is kept. Everything you enter from now on will be lost.",
    whatToDo: "What to do",
    stoppedStepNote: "Write down what you were just working on.",
    stoppedStepRestart: "Quit SuperTakt and start it again.",
    stoppedStepSupport: "If the message comes back, pass it on to your IT support.",
    exitCodeLead: "Exit code",
    exitCodeTail: "— helps when asking for support.",
    userNameTitle: "SuperTakt cannot work under this Windows user name",
    userNameBody:
      "SuperTakt writes the Windows user name you are signed in with on this computer unchanged into every export file. That is how billing knows whose recorded time it is.",
    userNameConsequence:
      "This name contains a control or direction character. Such characters are invisible and can rearrange the line they are in. SuperTakt therefore does not start, instead of writing a bill that shows something other than what it contains.",
    userNameNotShown:
      "The name itself is not in this message — the very characters in question would turn it around.",
    userNameStepOtherAccount:
      "Sign in on this computer with another Windows account and start SuperTakt there. This is the way that works without outside help.",
    userNameStepRename:
      "Or have the sign-in name of this account changed. This requires administrator rights — for a company account via IT support.",
    userNameDataLead: "Your data recorded so far is not affected. It is stored in",
    userNameDataTail:
      ". Back up this folder before you switch accounts: under another account SuperTakt creates its own.",
    userNameSupportLead: "The local service rejects the Windows user name (reason",
    userNameSupportTail:
      "): it contains a control or direction character (C0, C1 or a bidirectional formatting character) and would go unchanged into the billing file as the “WindowsUser” field.",
  },
};

export function appTexts(): typeof de {
  return pickTexts({ de, en });
}
