/**
 * Takt — das selbst erzeugte Zertifikat des Aufgabenbereichs (E-046, E-018).
 *
 * ===========================================================================
 * Was hier entsteht und wo es liegt
 * ===========================================================================
 *
 * Ein RSA-Schlüsselpaar und ein selbst signiertes Zertifikat für `localhost`,
 * erzeugt beim **ersten** Start und abgelegt im Anwendungsdatenverzeichnis
 * (E-018) — dort, wo auch das Token liegt, mit denselben engen Rechten:
 * Verzeichnis `0700`, Dateien `0600`, ausdrücklich gesetzt und nicht dem
 * `umask` überlassen (B-2.2 Punkt 3).
 *
 * **Der private Schlüssel ist ein Geheimnis wie das Token.** Wer ihn hat, kann
 * sich gegenüber Outlook als der Aufgabenbereich ausgeben. Er wird nie
 * protokolliert, nie in einer Antwort genannt und nie neben die Datenbank
 * kopiert.
 *
 * ---------------------------------------------------------------------------
 * Warum RSA und nicht EC
 * ---------------------------------------------------------------------------
 *
 * EC-Schlüssel wären kleiner und schneller. Aber WebView2 und der
 * Zertifikatspeicher von Windows behandeln RSA-2048 als den Fall, den jeder
 * kennt, und der Benutzer muss dieses Zertifikat **einmal von Hand annehmen**
 * (E-046, Konsequenz). Bei einem Schritt, den ein Anwender einmal und unter
 * Anleitung geht, ist das langweiligste Verfahren das richtige.
 *
 * ---------------------------------------------------------------------------
 * Warum es nicht bei jedem Start neu entsteht
 * ---------------------------------------------------------------------------
 *
 * Weil der Benutzer es angenommen hat. Ein Zertifikat, das sich bei jedem Start
 * ändert, müsste bei jedem Start erneut angenommen werden — und ein Anwender,
 * der eine Sicherheitswarnung täglich wegklickt, klickt sie auch dann weg, wenn
 * sie einmal berechtigt ist.
 *
 * Abgelaufen wird es ersetzt. Das ist der einzige Fall, in dem ein vorhandenes
 * Paar verworfen wird.
 */

import {
  X509Certificate,
  createPrivateKey,
  generateKeyPairSync,
  randomBytes,
  sign,
} from 'node:crypto';
import { chmod, readFile, writeFile } from 'node:fs/promises';

import {
  bitString,
  boolean,
  explicit,
  implicitPrimitive,
  integer,
  nullValue,
  octetString,
  oid,
  sequence,
  set,
  toPem,
  utcTime,
  utf8String,
} from './asn1.ts';
import { FILE_MODE } from '../access/paths.ts';

/** Gültigkeitsdauer. 825 Tage ist die Obergrenze, die Browser noch annehmen. */
const VALIDITY_DAYS = 825;

/**
 * Ein Zertifikat, das in weniger als dieser Frist abläuft, wird erneuert.
 *
 * Vierzehn Tage Vorlauf: genug, dass niemand mitten in einer Arbeitswoche vor
 * einem abgelaufenen Aufgabenbereich steht, und kurz genug, dass die Erneuerung
 * eine Ausnahme bleibt.
 */
const RENEW_BEFORE_DAYS = 14;

const OID = {
  rsaEncryption: '1.2.840.113549.1.1.1',
  sha256WithRsa: '1.2.840.113549.1.1.11',
  commonName: '2.5.4.3',
  organizationName: '2.5.4.10',
  basicConstraints: '2.5.29.19',
  keyUsage: '2.5.29.15',
  extKeyUsage: '2.5.29.37',
  subjectAltName: '2.5.29.17',
  serverAuth: '1.3.6.1.5.5.7.3.1',
} as const;

export interface CertificatePair {
  readonly keyPem: string;
  readonly certPem: string;
}

/**
 * Erzeugt Schlüssel und selbst signiertes Zertifikat für `localhost`.
 *
 * Der alternative Name führt **beide** Schreibweisen: den Namen `localhost`
 * und die Adresse `127.0.0.1`. Der Aufgabenbereich wird über den Namen geladen
 * (so steht es im Manifest und in `ALLOWED_ORIGINS`), aber wer zur Fehlersuche
 * die Adresse eintippt, soll nicht an einer Namensabweichung scheitern, die
 * mit dem eigentlichen Problem nichts zu tun hat.
 *
 * Ohne `subjectAltName` würde das Zertifikat von keinem heutigen Browser
 * angenommen — der `commonName` allein zählt seit Jahren nicht mehr.
 */
export function createSelfSignedCertificate(nowDate: Date = new Date()): CertificatePair {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

  const spki = publicKey.export({ type: 'spki', format: 'der' });

  const notBefore = new Date(nowDate.getTime() - 60 * 60 * 1000); // eine Stunde Vorlauf
  const notAfter = new Date(nowDate.getTime() + VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  /*
   * Eine zufällige, positive Seriennummer aus `crypto.randomBytes`.
   *
   * Hier stand bis T-066 `Math.random()`. **Für dieses Zertifikat war das
   * folgenlos** — es wird lokal erzeugt, lokal angenommen und von keiner
   * Zertifizierungsstelle ausgestellt; die Nummer unterscheidet hier nur zwei
   * Zertifikate desselben Ausstellers voneinander.
   *
   * Weg muss es trotzdem, aus zwei Gründen, und der zweite wiegt schwerer:
   *
   *  1. Bei einer **echten** Zertifizierungsstelle ist die Seriennummer eine
   *     Sicherheitsgröße. Sie muss unvorhersehbar sein, weil sie zusammen mit
   *     dem Hash-Verfahren die Kollisionsangriffe auf Zertifikate verteuert
   *     (deshalb schreibt das CA/Browser-Forum mindestens 64 Bit aus einer
   *     kryptographisch geeigneten Quelle vor). Wer diese Zeile abschreibt,
   *     schreibt sie irgendwann in einen solchen Zusammenhang.
   *  2. Dieses Repository wird öffentlich. Zwei Dateien nebeneinander dürfen
   *     nicht zwei Aussagen machen: `access/token.ts` schreibt in ihrem Kopf
   *     „Ausdrücklich nicht: `Math.random`" — und daneben stand es.
   *
   * `randomBytes` ist dieselbe Quelle wie beim Token. Der Unterschied im
   * Aufwand ist an dieser Stelle nicht messbar: Sie läuft **einmal** im Leben
   * einer Installation, neben einer RSA-2048-Schlüsselerzeugung, die um
   * Größenordnungen länger dauert.
   */
  const serial = randomBytes(16);
  // Das oberste Bit fällt: ASN.1 INTEGER ist vorzeichenbehaftet, und eine
  // negative Seriennummer ist nach RFC 5280 unzulässig.
  serial[0] = (serial[0] ?? 1) & 0x7f;

  const algorithm = sequence(oid(OID.sha256WithRsa), nullValue());

  const name = sequence(
    set(sequence(oid(OID.organizationName), utf8String('Takt'))),
    set(sequence(oid(OID.commonName), utf8String('localhost'))),
  );

  const extensions = explicit(
    3,
    sequence(
      // basicConstraints: kein CA. Kritisch — ein Zertifikat, das versehentlich
      // andere signieren dürfte, wäre eine ganz andere Sache als ein Serverzertifikat.
      extension(OID.basicConstraints, true, sequence()),
      // keyUsage: digitalSignature und keyEncipherment. Bit 0 und Bit 2,
      // also 0b1010_0000 mit fünf ungenutzten Bits.
      extension(OID.keyUsage, true, bitString(Buffer.from([0xa0]), 5)),
      // extKeyUsage: ausschließlich serverAuth.
      extension(OID.extKeyUsage, false, sequence(oid(OID.serverAuth))),
      // subjectAltName: dNSName [2] und iPAddress [7].
      extension(
        OID.subjectAltName,
        false,
        sequence(
          implicitPrimitive(2, Buffer.from('localhost', 'ascii')),
          implicitPrimitive(7, Buffer.from([127, 0, 0, 1])),
        ),
      ),
    ),
  );

  const tbs = sequence(
    explicit(0, integer(2)), // Fassung v3
    integer(serial),
    algorithm,
    name, // Aussteller — dieselbe Stelle wie der Inhaber, weil selbst signiert
    sequence(utcTime(notBefore), utcTime(notAfter)),
    name, // Inhaber
    Buffer.from(spki),
    extensions,
  );

  const signature = sign('sha256', tbs, privateKey);

  const certificate = sequence(tbs, algorithm, bitString(signature));

  return {
    keyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    certPem: toPem(certificate, 'CERTIFICATE'),
  };
}

/** Eine einzelne Erweiterung: OID, Kritikalität, und der Inhalt als OCTET STRING. */
function extension(id: string, critical: boolean, value: Buffer): Buffer {
  return critical
    ? sequence(oid(id), boolean(true), octetString(value))
    : sequence(oid(id), octetString(value));
}

export type CertificateSource = 'loaded' | 'created' | 'renewed';

export interface LoadedCertificate extends CertificatePair {
  readonly source: CertificateSource;
  readonly validUntil: Date;
}

/**
 * Lädt das vorhandene Paar oder erzeugt eines.
 *
 * Ein unlesbares, kaputtes oder abgelaufenes Paar wird **ersetzt** und nicht
 * beklagt: Anders als beim Token sperrt ein neues Zertifikat niemanden aus —
 * es kostet den Benutzer einmal das erneute Annehmen. Beim Token ist die
 * Abwägung genau umgekehrt (siehe `token-store.ts`), und dass sie hier anders
 * ausfällt, ist eine Entscheidung und kein Versehen.
 */
export async function loadOrCreateCertificate(
  keyPath: string,
  certPath: string,
  nowDate: Date = new Date(),
): Promise<LoadedCertificate> {
  const existing = await readPair(keyPath, certPath);

  if (existing !== null) {
    const renewAt = new Date(nowDate.getTime() + RENEW_BEFORE_DAYS * 24 * 60 * 60 * 1000);
    if (existing.validUntil > renewAt) {
      return { ...existing, source: 'loaded' };
    }
  }

  const created = createSelfSignedCertificate(nowDate);
  await writePair(keyPath, certPath, created);

  return {
    ...created,
    source: existing === null ? 'created' : 'renewed',
    validUntil: new X509Certificate(created.certPem).validToDate,
  };
}

async function readPair(
  keyPath: string,
  certPath: string,
): Promise<(CertificatePair & { validUntil: Date }) | null> {
  try {
    const [keyPem, certPem] = await Promise.all([
      readFile(keyPath, 'utf8'),
      readFile(certPath, 'utf8'),
    ]);

    // Beide Teile werden geprüft, nicht nur gelesen: Ein Schlüssel, der nicht
    // zum Zertifikat gehört, ergäbe einen Dienst, der lauscht und bei jedem
    // Handschlag scheitert.
    const certificate = new X509Certificate(certPem);
    if (!certificate.checkPrivateKey(createPrivateKey(keyPem))) return null;

    return { keyPem, certPem, validUntil: certificate.validToDate };
  } catch {
    return null;
  }
}

async function writePair(keyPath: string, certPath: string, pair: CertificatePair): Promise<void> {
  // `mode` beim Schreiben **und** `chmod` danach: Die Angabe beim Anlegen wirkt
  // nur, wenn die Datei neu entsteht. Existiert sie schon, behielte sie sonst
  // ihre alten Rechte.
  await writeFile(keyPath, pair.keyPem, { mode: FILE_MODE });
  await chmod(keyPath, FILE_MODE);
  await writeFile(certPath, pair.certPem, { mode: FILE_MODE });
  await chmod(certPath, FILE_MODE);
}
