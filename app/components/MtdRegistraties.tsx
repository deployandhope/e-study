import { groepeerRegistraties, type Registratie } from "../lib/stats";

const kaart = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  boxShadow: "0 1px 4px rgba(26,39,68,0.06)",
} as const;
const kop = "px-2 py-1.5 text-left font-semibold whitespace-nowrap";
const cel = "px-2 py-1 whitespace-nowrap tabular-nums";

/** "2026-10-24 13:05:00" (UTC) als "24-10-2026". */
function datum(utc: string | null): string {
  if (!utc) return "—";
  const [d] = utc.split(" ");
  const [j, m, dag] = d.split("-");
  return `${dag}-${m}-${j}`;
}

function Tegel({ label, waarde, uitleg }: { label: string; waarde: number; uitleg: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={kaart}>
      <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="text-xl font-bold tabular-nums" style={{ color: "var(--text)" }}>{waarde.toLocaleString("nl-NL")}</div>
      <div className="text-xs" style={{ color: "var(--muted)" }}>{uitleg}</div>
    </div>
  );
}

/**
 * Wat de database van MijnTafeldiploma per registratie bewaart (opruimplan fase R): de UTM-velden uit de cookie
 * mtd_tracking, of er een fbclid was en of het account een klas heeft. Eerst per bron, campagne en advertentieset, dan de
 * laatste registraties zelf.
 */
export default function MtdRegistraties({ registraties }: { registraties: Registratie[] }) {
  const groepen = groepeerRegistraties(registraties);
  const leerkrachten = registraties.filter((r) => r.rol === "leerkracht");
  const metUtm = registraties.filter((r) => r.utm_source !== null).length;
  const metFbclid = registraties.filter((r) => r.fbclid).length;
  const leerkrachtMetKlas = leerkrachten.filter((r) => r.klassen > 0).length;
  const laatste = registraties.slice(0, 100);

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h1 className="text-base font-semibold" style={{ color: "var(--text)" }}>
          MijnTafeldiploma — registratiegegevens uit de database
        </h1>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          leerkrachten en ouders · UTM uit de link waarmee iemand binnenkwam (cookie, 30 dagen) · live
        </p>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <Tegel label="Accounts" waarde={registraties.length} uitleg={`${leerkrachten.length} leerkrachten · ${registraties.length - leerkrachten.length} ouders`} />
        <Tegel label="Met UTM" waarde={metUtm} uitleg="kwamen binnen via een link met utm_source" />
        <Tegel label="Met fbclid" waarde={metFbclid} uitleg="kwamen binnen via een klik op Facebook" />
        <Tegel label="Leerkrachten met klas" waarde={leerkrachtMetKlas} uitleg={`van ${leerkrachten.length} leerkrachten`} />
      </div>

      <div className="rounded-xl overflow-auto" style={{ ...kaart, maxHeight: 420 }}>
        <table className="w-full text-xs" style={{ color: "var(--text)" }}>
          <thead className="sticky top-0" style={{ background: "var(--card)" }}>
            <tr style={{ color: "var(--muted)" }}>
              <th className={kop}>Bron</th>
              <th className={kop}>Campagne</th>
              <th className={kop}>Advertentieset</th>
              <th className={`${kop} text-right`}>Leerkrachten</th>
              <th className={`${kop} text-right`}>Met klas</th>
              <th className={`${kop} text-right`}>Ouders</th>
              <th className={`${kop} text-right`}>Met fbclid</th>
              <th className={`${kop} text-right`}>Laatste</th>
            </tr>
          </thead>
          <tbody>
            {groepen.map((g) => (
              <tr key={`${g.bron}|${g.campagne}|${g.adset}`} style={{ borderTop: "1px solid var(--border)" }}>
                <td className={cel}>{g.bron}</td>
                <td className={cel} title={g.campagne}>{g.campagne}</td>
                <td className={cel} title={g.adset}>{g.adset}</td>
                <td className={`${cel} text-right`}>{g.leerkrachten}</td>
                <td className={`${cel} text-right`}>{g.metKlas}</td>
                <td className={`${cel} text-right`}>{g.ouders}</td>
                <td className={`${cel} text-right`}>{g.metFbclid}</td>
                <td className={`${cel} text-right`}>{datum(g.laatste)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Laatste {laatste.length} registraties</h2>
      </div>
      <div className="rounded-xl overflow-auto" style={{ ...kaart, maxHeight: 420 }}>
        <table className="w-full text-xs" style={{ color: "var(--text)" }}>
          <thead className="sticky top-0" style={{ background: "var(--card)" }}>
            <tr style={{ color: "var(--muted)" }}>
              <th className={kop}>Datum</th>
              <th className={kop}>Rol</th>
              <th className={kop}>Bron</th>
              <th className={kop}>Medium</th>
              <th className={kop}>Campagne</th>
              <th className={kop}>Advertentieset</th>
              <th className={kop}>fbclid</th>
              <th className={`${kop} text-right`}>Klassen</th>
              <th className={`${kop} text-right`}>Laatste login</th>
            </tr>
          </thead>
          <tbody>
            {laatste.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td className={cel}>{datum(r.geregistreerd_op)}</td>
                <td className={cel}>{r.rol}</td>
                <td className={cel}>{r.utm_source ?? "—"}</td>
                <td className={cel}>{r.utm_medium ?? "—"}</td>
                <td className={cel}>{r.utm_campaign_name ?? r.utm_campaign ?? "—"}</td>
                <td className={cel}>{r.utm_adset ?? "—"}</td>
                <td className={cel}>{r.fbclid ? "ja" : "—"}</td>
                <td className={`${cel} text-right`}>{r.klassen}</td>
                <td className={`${cel} text-right`}>{datum(r.laatste_login)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
