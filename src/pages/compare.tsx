import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  fetchReleases,
  findStatusCSV,
  findMultiStatusCSVs,
  type GitHubRelease,
  type DomainRecord,
} from "../lib/github";
import { DomainTable } from "../components/DomainTable";
import { DiffStats } from "../components/DiffStats";
import { GitCompare, RefreshCw } from "lucide-react";

export default function DiffPage() {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [leftTag, setLeftTag] = useState("");
  const [rightTag, setRightTag] = useState("");
  const [leftData, setLeftData] = useState<DomainRecord[]>([]);
  const [rightData, setRightData] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReleases()
      .then((r) => {
        setReleases(r);
        if (r.length >= 2) {
          setLeftTag(r[1].tag_name);
          setRightTag(r[0].tag_name);
        } else if (r.length === 1) {
          setRightTag(r[0].tag_name);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingReleases(false));
  }, []);

  useEffect(() => {
    if (!leftTag || !rightTag) return;
    const left = releases.find((r) => r.tag_name === leftTag);
    const right = releases.find((r) => r.tag_name === rightTag);
    if (!left || !right) return;

    setLoading(true);
    setError("");

    const loadRelease = async (rel: GitHubRelease): Promise<DomainRecord[]> => {
      const csvUrls = findMultiStatusCSVs(rel);
      const results = await Promise.all(
        csvUrls.map(({ url }) =>
          fetch(url)
            .then((r) => r.text())
            .then((text) =>
              Papa.parse<Record<string, string>>(text, {
                header: true,
                skipEmptyLines: true,
              }).data
            )
        )
      );
      return results.flat().map((row: Record<string, string>) => ({
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
    };

    Promise.all([loadRelease(left), loadRelease(right)])
      .then(([l, r]) => {
        setLeftData(l);
        setRightData(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leftTag, rightTag, releases]);

  // Compute diff
  const diff = useMemo(() => {
    if (leftData.length === 0 || rightData.length === 0) return null;
    const leftDomains = new Set(leftData.map((d) => d.domain));
    const rightDomains = new Set(rightData.map((d) => d.domain));

    const added = rightData.filter((d) => !leftDomains.has(d.domain));
    const removed = leftData.filter((d) => !rightDomains.has(d.domain));
    const staying = rightData.filter((d) => leftDomains.has(d.domain));
    const changed = staying.filter((d) => {
      const old = leftData.find((l) => l.domain === d.domain);
      return (
        old &&
        (old.dns_resolves !== d.dns_resolves ||
          old.ip_address !== d.ip_address ||
          old.https_works !== d.https_works ||
          old.http_works !== d.http_works ||
          old.status_code !== d.status_code)
      );
    });

    return { added, removed, changed };
  }, [leftData, rightData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <GitCompare className="size-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Release Comparison</h1>
          <p className="text-muted-foreground mt-1">
            Compare domain inventories across releases
          </p>
        </div>
      </div>

      {/* Release selectors */}
      {loadingReleases ? (
        <div className="flex items-center gap-2 text-muted-foreground mb-6">
          <RefreshCw className="size-4 animate-spin" />
          Loading releases...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Earlier release</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={leftTag}
              onChange={(e) => setLeftTag(e.target.value)}
            >
              {releases.map((r) => (
                <option key={r.id} value={r.tag_name}>
                  {r.tag_name} — {new Date(r.published_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Later release</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={rightTag}
              onChange={(e) => setRightTag(e.target.value)}
            >
              {releases.map((r) => (
                <option key={r.id} value={r.tag_name}>
                  {r.tag_name} — {new Date(r.published_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="size-5 animate-spin mr-2" />
          Loading data...
        </div>
      )}

      {/* Diff stats */}
      {diff && !loading && (
        <>
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Delta</h2>
            <DiffStats
              leftTag={leftTag}
              rightTag={rightTag}
              leftCount={leftData.length}
              rightCount={rightData.length}
              added={diff.added.length}
              removed={diff.removed.length}
              changed={diff.changed.length}
            />
          </div>

          {/* Added domains */}
          {diff.added.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Added Domains <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">{diff.added.length}</span>
              </h2>
              <DomainTable data={diff.added} caption="Domains added in the newer release" />
            </div>
          )}

          {/* Removed domains */}
          {diff.removed.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Removed Domains <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">{diff.removed.length}</span>
              </h2>
              <DomainTable data={diff.removed} caption="Domains removed from the newer release" />
            </div>
          )}

          {/* Changed domains */}
          {diff.changed.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Changed Domains <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">{diff.changed.length}</span>
              </h2>
              <DomainTable data={diff.changed} caption="Domains with changed probe results between releases" />
            </div>
          )}
        </>
      )}

      {!diff && !loading && !error && !loadingReleases && (
        <div className="text-center py-20 text-muted-foreground">
          Select two releases to compare
        </div>
      )}
    </div>
  );
}
