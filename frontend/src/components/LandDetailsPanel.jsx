function LandDetailsPanel({ land, onBack, onClose, searchRadiusMeters }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="
              rounded
              text-sm
              font-medium
              text-slate-600
              transition

              hover:text-emerald-700

              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-emerald-600
            "
          >
            ← Back to results
          </button>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              text-lg
              text-slate-500
              transition

              hover:bg-slate-50
              hover:text-slate-700

              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-emerald-600
            "
            aria-label="Close land details"
          >
            ×
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div>
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700">
            Available land
          </span>

          <h2 className="mt-3 break-words text-3xl font-semibold tracking-tight text-slate-950">
            {formatPrice(land.price)}
          </h2>
        </div>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Current search
              </p>

              <p className="mt-1 text-sm font-semibold tabular-nums text-blue-700">
                {formatRadius(searchRadiusMeters)} radius
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="
                shrink-0
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-xs
                font-semibold
                text-slate-600
                transition

                hover:border-red-200
                hover:bg-red-50
                hover:text-red-700

                focus-visible:outline-2
                focus-visible:outline-offset-2
                focus-visible:outline-emerald-600
              "
            >
              Clear search
            </button>
          </div>
        </div>

        <div className="mt-7 space-y-6">
          <DetailSection label="Description" value={land.description} />

          <DetailSection label="Contact" value={land.contact} />

          <DetailSection label="Land ID" value={land.id} mono />
        </div>
      </div>
    </div>
  );
}

function DetailSection({ label, value, mono = false }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </h3>

      <p
        className={`
          mt-2
          break-words
          leading-6
          text-slate-700

          ${mono ? "font-mono text-xs" : "text-sm"}
        `}
      >
        {value || "—"}
      </p>
    </section>
  );
}

function formatPrice(price) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(price));
}

function formatRadius(radiusMeters) {
  const radius = Number(radiusMeters);

  if (!Number.isFinite(radius)) {
    return "—";
  }

  if (radius < 1000) {
    return `${Math.round(radius)} m`;
  }

  return `${(radius / 1000).toFixed(2)} km`;
}

export default LandDetailsPanel;
