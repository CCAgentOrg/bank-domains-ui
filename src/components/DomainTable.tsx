import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";

interface DomainTableProps {
  data: {
    domain: string;
    dns_resolves: boolean;
    ip_address: string | null;
    https_works: boolean;
    http_works: boolean;
    status_code: number | null;
    title: string | null;
    final_url: string | null;
    error: string | null;
  }[];
  caption?: string;
}

type SortKey = "domain" | "status_code" | "ip_address" | "title";
type SortDir = "asc" | "desc";

export function DomainTable({ data, caption }: DomainTableProps) {
  const [search, setSearch] = useState("");
  const [filterResolves, setFilterResolves] = useState<string>("all");
  const [filterHttps, setFilterHttps] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("domain");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    let rows = data;

    // Search
    if (q) {
      rows = rows.filter(
        (d) =>
          d.domain.toLowerCase().includes(q) ||
          (d.title && d.title.toLowerCase().includes(q)) ||
          (d.ip_address && d.ip_address.includes(q))
      );
    }

    // Filters
    if (filterResolves === "yes") rows = rows.filter((d) => d.dns_resolves);
    else if (filterResolves === "no") rows = rows.filter((d) => !d.dns_resolves);

    if (filterHttps === "yes") rows = rows.filter((d) => d.https_works);
    else if (filterHttps === "no") rows = rows.filter((d) => !d.https_works);

    // Sort
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "domain") cmp = a.domain.localeCompare(b.domain);
      else if (sortKey === "status_code") cmp = (a.status_code ?? 0) - (b.status_code ?? 0);
      else if (sortKey === "ip_address") cmp = (a.ip_address ?? "").localeCompare(b.ip_address ?? "");
      else if (sortKey === "title") cmp = (a.title ?? "").localeCompare(b.title ?? "");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [data, search, filterResolves, filterHttps, sortKey, sortDir]);

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? <ChevronUp className="size-3 inline" /> : <ChevronDown className="size-3 inline" />;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search domains, titles, IPs..."
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-md border bg-background px-3 py-2 text-xs"
            value={filterResolves}
            onChange={(e) => setFilterResolves(e.target.value)}
          >
            <option value="all">DNS: All</option>
            <option value="yes">DNS: Resolves</option>
            <option value="no">DNS: No resolve</option>
          </select>
          <select
            className="rounded-md border bg-background px-3 py-2 text-xs"
            value={filterHttps}
            onChange={(e) => setFilterHttps(e.target.value)}
          >
            <option value="all">HTTPS: All</option>
            <option value="yes">HTTPS: Works</option>
            <option value="no">HTTPS: Fails</option>
          </select>
        </div>
      </div>

      {caption && (
        <p className="text-xs text-muted-foreground mb-3">{caption}</p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("domain")}>
                Domain {sortIndicator("domain")}
              </th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap">DNS</th>
              <th className="text-center px-3 py-3 font-medium whitespace-nowrap">HTTPS</th>
              <th className="text-left px-3 py-3 font-medium cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("status_code")}>
                Status {sortIndicator("status_code")}
              </th>
              <th className="text-left px-3 py-3 font-medium cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("ip_address")}>
                IP {sortIndicator("ip_address")}
              </th>
              <th className="text-left px-3 py-3 font-medium cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort("title")}>
                Title {sortIndicator("title")}
              </th>
              <th className="text-left px-3 py-3 font-medium whitespace-nowrap">Final URL</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 500).map((row) => (
              <tr key={row.domain} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs">{row.domain}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex items-center justify-center size-5 rounded text-xs font-medium ${row.dns_resolves ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {row.dns_resolves ? "✓" : "✗"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex items-center justify-center size-5 rounded text-xs font-medium ${row.https_works ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {row.https_works ? "✓" : "✗"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`font-mono text-xs ${row.status_code && row.status_code >= 400 ? "text-red-600 dark:text-red-400" : row.status_code && row.status_code >= 200 && row.status_code < 300 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {row.status_code ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{row.ip_address || "—"}</td>
                <td className="px-3 py-2.5 max-w-[300px] truncate text-xs" title={row.title || ""}>
                  {row.title || "—"}
                </td>
                <td className="px-3 py-2.5 max-w-[200px] truncate text-xs text-muted-foreground" title={row.final_url || ""}>
                  {row.final_url ? (
                    <a href={row.final_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {row.final_url}
                    </a>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > 500 && (
        <p className="text-xs text-muted-foreground mt-2">
          Showing first 500 of {sorted.length.toLocaleString()} results. Refine your search for more specific results.
        </p>
      )}
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">No domains match your filters.</p>
      )}
    </div>
  );
}
