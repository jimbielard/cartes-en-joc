export function RestaurantLinks({ name, area, googlePlaceId }: { name: string; area?: string | null; googlePlaceId?: string | null }) {
  const query = [name, area].filter(Boolean).join(", ");
  const maps = new URLSearchParams({ api: "1", query });
  const directions = new URLSearchParams({ api: "1", destination: query });
  if (googlePlaceId) {
    maps.set("query_place_id", googlePlaceId);
    directions.set("destination_place_id", googlePlaceId);
  }
  const links = [
    { label: "Google", href: `https://www.google.com/search?${new URLSearchParams({ q: query })}` },
    { label: "Google Maps", href: `https://www.google.com/maps/search/?${maps}` },
    { label: "Cercar ressenyes", href: `https://www.google.com/search?${new URLSearchParams({ q: `${query} opinions ressenyes` })}` },
    { label: "Com arribar-hi", href: `https://www.google.com/maps/dir/?${directions}` },
  ];
  return <nav aria-label={`Enllaços externs de ${name}`} className="mt-4 flex flex-wrap gap-2">
    {links.map(link => <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${link.label}: ${name} (s’obre en una pestanya nova)`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-orange-400 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600">{link.label} <span aria-hidden="true">↗</span></a>)}
  </nav>;
}
