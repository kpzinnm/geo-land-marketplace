function SearchPanel({ searchArea, loading, resultCount = null, onSearch, onCancel }) {
  return (
    <div className="space-y-5" aria-busy={loading}>
      <div role="status" className={`rounded-xl border px-4 py-4 ${searchArea ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
        <p className={`text-sm font-medium ${searchArea ? "text-blue-900" : "text-slate-800"}`}>
          {loading ? "Searching lands..." : searchArea ? "Search area ready" : "Draw a search area"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {loading ? "Finding lands that intersect your search area." : searchArea
            ? "The circular area is ready. You can run the spatial search."
            : "Click and drag on the map to define the radius."}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Search radius</p>
        </div>
        <div className="px-4 py-5">
          <p className="text-2xl font-semibold tracking-tight text-slate-900">
            {searchArea ? formatRadius(searchArea.radiusMeters) : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Lands touching or intersecting this area will be returned.</p>
        </div>
      </div>
      {resultCount !== null && (
        <div role="status" className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {resultCount === 1 ? "1 land found" : `${resultCount} lands found`}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <button type="button" onClick={onSearch} disabled={!searchArea || loading} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">
          {loading ? "Searching..." : "Search"}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
      </div>
    </div>
  );
}

function formatRadius(radiusMeters) {
  if (!radiusMeters) {
    return "0 m";
  }

  if (radiusMeters >= 1000) {
    return `${(radiusMeters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(radiusMeters)} m`;
}

export default SearchPanel;
