function LandDetailsPanel({ land, onBack, onClose }) {
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
        <button
          type="button"
          onClick={onBack}
          className="
            text-sm
            font-medium
            text-slate-600
            hover:text-slate-900
          "
        >
          ← Back to results
        </button>

        <button
          type="button"
          onClick={onClose}
          className="
            rounded-lg
            px-2
            py-1
            text-slate-400
            hover:bg-slate-100
          "
        >
          ×
        </button>
      </div>

      <div
        className="
          flex-1
          overflow-y-auto
          p-6
        "
      >
        <p
          className="
            text-xs
            font-semibold
            uppercase
            tracking-wide
            text-emerald-600
          "
        >
          Available land
        </p>

        <h2
          className="
            mt-2
            text-2xl
            font-semibold
            text-slate-900
          "
        >
          {formatPrice(land.price)}
        </h2>

        <div
          className="
            mt-6
            space-y-6
          "
        >
          <section>
            <h3
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Description
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-700
              "
            >
              {land.description}
            </p>
          </section>

          <section>
            <h3
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Contact
            </h3>

            <p
              className="
                mt-2
                break-all
                text-sm
                font-medium
                text-slate-700
              "
            >
              {land.contact}
            </p>
          </section>

          <section>
            <h3
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Land ID
            </h3>

            <p
              className="
                mt-2
                break-all
                font-mono
                text-xs
                text-slate-500
              "
            >
              {land.id}
            </p>
          </section>
        </div>
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

export default LandDetailsPanel;
