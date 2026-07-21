import type { DomainRecord } from "./github";

export interface DiffResult {
  added: DomainRecord[];
  removed: DomainRecord[];
  changed: { domain: string; before: DomainRecord; after: DomainRecord; fields: string[] }[];
  unchanged: number;
}

export function computeDiff(before: DomainRecord[], after: DomainRecord[]): DiffResult {
  const beforeMap = new Map(before.map((r) => [r.domain, r]));
  const afterMap = new Map(after.map((r) => [r.domain, r]));
  const beforeDomains = new Set(beforeMap.keys());
  const afterDomains = new Set(afterMap.keys());

  const added: DomainRecord[] = [];
  const removed: DomainRecord[] = [];
  const changed: DiffResult["changed"] = [];

  for (const domain of afterDomains) {
    if (!beforeDomains.has(domain)) {
      added.push(afterMap.get(domain)!);
    }
  }

  for (const domain of beforeDomains) {
    if (!afterDomains.has(domain)) {
      removed.push(beforeMap.get(domain)!);
    }
  }

  for (const domain of afterDomains) {
    if (!beforeDomains.has(domain)) continue;
    const before = beforeMap.get(domain)!;
    const after = afterMap.get(domain)!;
    const fields: string[] = [];

    if (before.dns_resolves !== after.dns_resolves) fields.push("dns_resolves");
    if (before.ip_address !== after.ip_address) fields.push("ip_address");
    if (before.https_works !== after.https_works) fields.push("https_works");
    if (before.http_works !== after.http_works) fields.push("http_works");
    if (before.status_code !== after.status_code) fields.push("status_code");
    if (before.title !== after.title) fields.push("title");
    if (before.final_url !== after.final_url) fields.push("final_url");

    if (fields.length > 0) {
      changed.push({ domain, before, after, fields });
    }
  }

  return {
    added,
    removed,
    changed,
    unchanged: afterDomains.size - added.length - changed.length,
  };
}
