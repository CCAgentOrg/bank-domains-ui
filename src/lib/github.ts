export interface DomainRecord {
  domain: string;
  dns_resolves: boolean;
  ip_address: string | null;
  https_works: boolean;
  http_works: boolean;
  status_code: number | null;
  title: string | null;
  final_url: string | null;
  error: string | null;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: {
    name: string;
    browser_download_url: string;
  }[];
}

const OWNER = "CCAgentOrg";
const REPO = "bank-in-domains";

export async function fetchReleases(): Promise<GitHubRelease[]> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=20`,
    { headers: { Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

async function fetchCSV(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
  return res.text();
}

export function findStatusCSV(release: GitHubRelease): string | null {
  // Prefer bank_domains_status.csv first, then any _status.csv
  const status = release.assets.find(
    (a) => a.name === "bank_domains_status.csv"
  );
  if (status) return status.browser_download_url;

  // Fallback to any CSV in the assets
  const csv = release.assets.find((a) => a.name.endsWith(".csv"));
  if (csv && csv.name !== "new_subdomains.txt") return csv.browser_download_url;

  // For older releases, try the .csv asset directly
  const csvAsset = release.assets.find(
    (a) => a.name.endsWith(".csv") && a.name !== "new_subdomains.txt"
  );
  if (csvAsset) return csvAsset.browser_download_url;

  return null;
}

export function findMultiStatusCSVs(release: GitHubRelease): { name: string; url: string }[] {
  return release.assets
    .filter((a) => a.name.endsWith("_status.csv") || a.name === "bank_domains_ct_expansion.csv")
    .map((a) => ({ name: a.name, url: a.browser_download_url }));
}
