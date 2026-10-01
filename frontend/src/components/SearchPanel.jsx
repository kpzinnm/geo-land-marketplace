function SearchPanel({ searchArea, loading, resultCount, onSearch, onCancel }) {
  const radius = searchArea?.radiusMeters ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="
            text-lg
            font-semibold
            text-slate-900
          "
        >
          Search lands
        </h2>

        <p
          className="
            mt-1
            text-sm
            text-slate-500
          "
        >
          Draw a circular area on the map to find intersecting lands.
        </p>
      </div>

      <div
        className="
          rounded-lg
          bg-slate-50
          p-4
        "
      >
        <p
          className="
            text-xs
            font-medium
            uppercase
            tracking-wide
            text-slate-500
          "
        >
          Search radius
        </p>

        <p
          className="
            mt-1
            text-2xl
            font-semibold
            text-slate-900
          "
        >
          {formatRadius(radius)}
        </p>
      </div>

      {!searchArea && (
        <div
          className="
            rounded-lg
            bg-blue-50
            p-3
            text-sm
            text-blue-800
          "
        >
          Click and drag on the map to define the search area.
        </div>
      )}

      {resultCount !== null && (
        <div
          className="
            rounded-lg
            bg-emerald-50
            p-3
            text-sm
            text-emerald-800
          "
        >
          {resultCount} land
          {resultCount === 1 ? "" : "s"} found.
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!searchArea || loading}
          onClick={onSearch}
          className="
            flex-1
            rounded-lg
            bg-slate-900
            px-4
            py-2
            font-medium
            text-white
            transition
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {loading ? "Searching..." : "Search"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="
            rounded-lg
            border
            border-slate-300
            px-4
            py-2
            text-slate-700
            transition
            hover:bg-slate-100
          "
        >
          Cancel
        </button>
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
