function LandResultsPanel({ lands, onSelectLand, selectedLand, onClose }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">Spatial search</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Search results</h2>
            <p className="mt-1 text-sm text-slate-500">
              {lands.length === 1 ? "1 land found" : `${lands.length} lands found`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" aria-label="Close search results">×</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {lands.length === 0 ? <EmptySearchState /> : (
          <div className="space-y-3">
            {lands.map((land) => (
              <button key={land.id} type="button" onClick={() => onSelectLand(land)}
                className={`group w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${selectedLand?.id === land.id ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200 hover:border-emerald-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 basis-32">
                    <p className="break-words text-lg font-semibold tracking-tight text-slate-950">{formatPrice(land.price)}</p>
                    <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-slate-600">{land.description}</p>
                  </div>
                  <span className="mt-1 shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700">Available</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="min-w-0 truncate text-xs text-slate-500">{land.contact || "—"}</span>
                  <span className="ml-3 shrink-0 text-xs font-semibold text-emerald-700 transition motion-safe:group-hover:translate-x-0.5">View details →</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptySearchState() {
  return (
    <div className="flex min-h-64 items-center justify-center px-4 text-center">
      <div className="max-w-xs">
        <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">○</div>
        <h3 className="mt-4 text-sm font-semibold text-slate-900">No lands found</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Try drawing a larger search area or searching another location.</p>
      </div>
    </div>
  );
}

function formatPrice(price) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(price));
}

export default LandResultsPanel;
