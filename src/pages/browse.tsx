import { useState, useEffect } from "react";
import Papa from "papaparse";
import { fetchReleases, findMultiStatusCSVs, type GitHubRelease, type DomainRecord } from "../lib/github";
import { StatsCards } from "../components/StatsCards";
import { DomainTable } from "../components/DomainTable";
import { Database, RefreshCw } from "lucide-react";

export default function BrowsePage() {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [data, setData] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReleases()
      .then((r) => {
        setReleases(r);
        if (r.length > 0) setSelected(r[0].tag_name);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingReleases(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const rel = releases.find((r) => r.tag_name === selected);
    if (!rel) return;

    setLoading(true);
    setError("");

    const csvUrls = findMultiStatusCSVs(rel);
    if (csvUrls.length === 0) {
      setError("No CSV assets found in this release");
      setLoading(false);
      return;
    }

    Promise.all(
      csvUrls.map(({ url }) =>
        fetch(url).then((r) => r.text()).then((text) => Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data)
      )
    ).then((results) => {
      const merged: DomainRecord[] = results.flat().map((row: Record<string, string>) => ({
        domain: row.domain || "",
        dns_resolves: row.dns_resolves?.toLowerCase() === "true",
        ip_address: row.ip_address || null,
        https_works: row.https_works?.toLowerCase() === "true",
        http_works: row.http_works?.toLowerCase() === "true",
        status_code: row.status_code ? parseInt(row.status_code, 10) : null,
        title: row.title || null,
        final_url: row.final_url || null,
        error: row.error || null,
      }));
      setData(merged);
    }).catch((e) => setError(e.message))
    .finally(() => setLoading(false));
  }, [selected, releases]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank.in Domain Audit</h1>
          <p className="text-muted-foreground mt-1">
            Searchable inventory of Indian financial TLD subdomains
          </p>
        </div>
        <a
          href="https://github.com/CCAgentOrg/bank-in-domains"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          GitHub → CCAGentOrg/bank-in-domains
        </a>
      </div>

      {/* Release selector */}
      {loadingReleases ? (
        <div className="flex items-center gap-2 text-muted-foreground mb-6">
          <RefreshCw className="size-4 animate-spin" />
          Loading releases...
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Database className="size-4 text-muted-foreground" />
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm min-w-[180px]"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {releases.map((r) => (
              <option key={r.id} value={r.tag_name}>
                {r.tag_name} — {new Date(r.published_at).toLocaleDateString()}
              </option>
            ))}
          </select>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="size-3 animate-spin" />
              Loading data...
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Stats */}
      {data.length > 0 && !loading && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <StatsCards data={data} />
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="size-5 animate-spin mr-2" />
          Loading {selected}...
        </div>
      ) : data.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Domains ({data.length.toLocaleString()})</h2>
          <DomainTable data={data} />
        </div>
      ) : !error && !loadingReleases ? (
        <div className="text-center py-20 text-muted-foreground">
          Select a release to browse its data
        </div>
      ) : null}
    </div>
  );
}
