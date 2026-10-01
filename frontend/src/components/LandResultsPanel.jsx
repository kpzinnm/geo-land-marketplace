function LandResultsPanel({ lands, onSelectLand, selectedLand, onClose }) {
  return (
    <div className="flex h-full flex-col">
      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-200
          px-5
          py-4
        "
      >
        <div>
          <h2
            className="
              font-semibold
              text-slate-900
            "
          >
            Search results
          </h2>

          <p
            className="
              text-sm
              text-slate-500
            "
          >
            {lands.length} land
            {lands.length === 1 ? "" : "s"} found
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            rounded-lg
            px-2
            py-1
            text-slate-400
            hover:bg-slate-100
            hover:text-slate-700
          "
        >
          ×
        </button>
      </div>

      <div
        className="
          flex-1
          space-y-3
          overflow-y-auto
          p-4
        "
      >
        {lands.length === 0 && (
          <div
            className="
              rounded-lg
              bg-slate-50
              p-4
              text-sm
              text-slate-500
            "
          >
            No lands were found in this area.
          </div>
        )}

        {lands.map((land) => (
          <button
            key={land.id}
            type="button"
            onClick={() => onSelectLand(land)}
            className={`
                w-full
                rounded-xl
                border
                bg-white
                p-4
                text-left
                transition
                hover:shadow-sm

                ${
                  selectedLand?.id === land.id
                    ? "border-emerald-500 ring-2 ring-emerald-100"
                    : "border-slate-200 hover:border-emerald-400"
                }
              `}
          >
            <p
              className="
                text-lg
                font-semibold
                text-slate-900
              "
            >
              {formatPrice(land.price)}
            </p>

            <p
              className="
                mt-1
                line-clamp-2
                text-sm
                text-slate-600
              "
            >
              {land.description}
            </p>

            <p
              className="
                mt-3
                text-xs
                font-medium
                text-emerald-700
              "
            >
              View land
            </p>
          </button>
        ))}
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
