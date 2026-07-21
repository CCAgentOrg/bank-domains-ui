import { Globe, Server, CheckCircle, XCircle, ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardsProps {
  data: { dns_resolves: boolean; https_works: boolean; http_works: boolean; status_code: number | null }[];
}

export function StatsCards({ data }: StatsCardsProps) {
  const total = data.length;
  const resolving = data.filter((d) => d.dns_resolves).length;
  const httpsOk = data.filter((d) => d.https_works).length;
  const httpOk = data.filter((d) => d.http_works).length;
  const withTitle = data.filter((d) => d.title && d.title.length > 0).length;
  const status200 = data.filter((d) => d.status_code && d.status_code >= 200 && d.status_code < 300).length;
  const status4xx = data.filter((d) => d.status_code && d.status_code >= 400 && d.status_code < 500).length;
  const status5xx = data.filter((d) => d.status_code && d.status_code >= 500).length;

  const cards = [
    { label: "Total Domains", value: total.toLocaleString(), icon: Globe },
    { label: "DNS Resolves", value: resolving.toLocaleString(), sub: `${((resolving / total) * 100).toFixed(1)}%`, icon: ArrowUp },
    { label: "HTTPS Working", value: httpsOk.toLocaleString(), sub: `${((httpsOk / total) * 100).toFixed(1)}%`, icon: CheckCircle },
    { label: "HTTP Working", value: httpOk.toLocaleString(), sub: `${((httpOk / total) * 100).toFixed(1)}%`, icon: Server },
    { label: "2xx Status", value: status200.toLocaleString(), icon: ArrowUp },
    { label: "4xx Status", value: status4xx.toLocaleString(), icon: XCircle },
    { label: "5xx Status", value: status5xx.toLocaleString(), icon: XCircle },
    { label: "With Page Title", value: withTitle.toLocaleString(), sub: `${((withTitle / total) * 100).toFixed(1)}%`, icon: Globe },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
            <card.icon className="size-3.5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{card.value}</div>
          {card.sub && <div className="text-xs text-muted-foreground mt-0.5">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}
