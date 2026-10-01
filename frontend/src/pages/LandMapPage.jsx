import { useCallback, useState } from "react";

import MapView from "../components/MapView";
import LandForm from "../components/LandForm";
import SearchPanel from "../components/SearchPanel";
import LandResultsPanel from "../components/LandResultsPanel";
import LandDetailsPanel from "../components/LandDetailsPanel";

import { createLand, searchLands } from "../api/landApi";

function LandMapPage() {
  const [mode, setMode] = useState("browse");

  const [polygon, setPolygon] = useState(null);

  const [searchArea, setSearchArea] = useState(null);

  const [searchResults, setSearchResults] = useState([]);

  const [hasSearched, setHasSearched] = useState(false);

  const [selectedLand, setSelectedLand] = useState(null);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(null);

  const [resetKey, setResetKey] = useState(0);

  const handlePolygonDrawn = useCallback((geometry) => {
    setPolygon(geometry);
    setMessage(null);
  }, []);

  const handleSearchAreaChange = useCallback((area) => {
    setSearchArea(area);
  }, []);

  function resetInteraction() {
    setResetKey((current) => current + 1);
  }

  function startRegistration() {
    setMode("register");

    setPolygon(null);
    setSearchArea(null);
    setSelectedLand(null);
    setSearchResults([]);
    setHasSearched(false);
    setMessage(null);

    resetInteraction();
  }

  function startSearch() {
    setMode("search");

    setPolygon(null);
    setSearchArea(null);
    setSelectedLand(null);
    setSearchResults([]);
    setHasSearched(false);
    setMessage(null);

    resetInteraction();
  }

  function cancelCurrentMode() {
    setMode("browse");

    setPolygon(null);
    setSearchArea(null);
    setMessage(null);

    resetInteraction();
  }

  function closeSearchResults() {
    setSelectedLand(null);
    setSearchResults([]);
    setHasSearched(false);
  }

  async function handleCreateLand(payload) {
    try {
      setLoading(true);
      setMessage(null);

      await createLand(payload);

      setMessage({
        type: "success",
        text: "Land registered successfully.",
      });

      setPolygon(null);

      resetInteraction();

      return true;
    } catch (error) {
      if (error.status === 409) {
        setMessage({
          type: "error",
          text: "This land overlaps an existing land.",
        });
      } else if (error.status === 400) {
        setMessage({
          type: "error",
          text: error.body?.message || "Invalid land data.",
        });
      } else {
        setMessage({
          type: "error",
          text: "Unable to register the land.",
        });
      }

      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchArea) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await searchLands({
        longitude: searchArea.longitude,

        latitude: searchArea.latitude,

        radiusMeters: searchArea.radiusMeters,
      });

      const lands = Array.isArray(response) ? response : [];

      setSearchResults(lands);

      /*
       * A completed search and an empty search
       * are different from "no search performed".
       */
      setHasSearched(true);

      setSelectedLand(null);

      setMode("browse");

      setSearchArea(null);

      resetInteraction();
    } catch (error) {
      setHasSearched(false);

      setSearchResults([]);

      setMessage({
        type: "error",
        text: error.body?.message || "Unable to search lands.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-slate-50">
      <AppHeader
        mode={mode}
        onRegister={startRegistration}
        onSearch={startSearch}
      />

      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        {hasSearched && (
          <>
            <div
              className="
                absolute
                inset-0
                z-20
                bg-slate-950/20
                backdrop-blur-[1px]
                lg:hidden
              "
              onClick={closeSearchResults}
              aria-hidden="true"
            />

            <aside
              className="
                absolute
                inset-y-0
                left-0
                z-30
                w-[min(88vw,22rem)]
                overflow-hidden
                border-r
                border-slate-200
                bg-white
                shadow-2xl

                lg:static
                lg:z-auto
                lg:w-80
                lg:shrink-0
                lg:shadow-sm
              "
            >
              {selectedLand ? (
                <LandDetailsPanel
                  land={selectedLand}
                  onBack={() => setSelectedLand(null)}
                  onClose={closeSearchResults}
                />
              ) : (
                <LandResultsPanel
                  lands={searchResults}
                  onSelectLand={setSelectedLand}
                  onClose={closeSearchResults}
                />
              )}
            </aside>
          </>
        )}

        <section className="relative min-w-0 flex-1 overflow-hidden">
          <MapView
            mode={mode}
            onPolygonDrawn={handlePolygonDrawn}
            onSearchAreaChange={handleSearchAreaChange}
            resetKey={resetKey}
            searchResults={searchResults}
            selectedLand={selectedLand}
            onLandSelected={setSelectedLand}
          />

          {mode === "browse" && !hasSearched && <BrowseHint />}

          {mode === "register" && (
            <MapInstruction
              eyebrow="Land registration"
              title="Draw the land boundary"
            >
              Click the map to add polygon vertices. Click the first point again
              to finish.
            </MapInstruction>
          )}

          {mode === "search" && (
            <>
              <MapInstruction
                eyebrow="Spatial search"
                title="Draw a search area"
              >
                Click and drag anywhere on the map to define the search radius.
              </MapInstruction>

              {searchArea && (
                <SearchRadiusBadge radiusMeters={searchArea.radiusMeters} />
              )}
            </>
          )}
        </section>

        {mode !== "browse" && (
          <>
            <div
              className="
                absolute
                inset-0
                z-20
                bg-slate-950/20
                backdrop-blur-[1px]
                lg:hidden
              "
              onClick={cancelCurrentMode}
              aria-hidden="true"
            />

            <aside
              className="
                absolute
                inset-y-0
                right-0
                z-30
                w-[min(92vw,24rem)]
                overflow-y-auto
                border-l
                border-slate-200
                bg-white
                shadow-2xl

                lg:static
                lg:z-auto
                lg:w-96
                lg:shrink-0
                lg:shadow-sm
              "
            >
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                      {mode === "register" ? "Registration" : "Search"}
                    </p>

                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                      {mode === "register" ? "Register land" : "Search lands"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={cancelCurrentMode}
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      text-lg
                      text-slate-400
                      transition

                      hover:border-slate-300
                      hover:bg-slate-50
                      hover:text-slate-700

                      focus:outline-none
                      focus:ring-2
                      focus:ring-emerald-100
                    "
                    aria-label="Close panel"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {message && <StatusMessage message={message} />}

                {mode === "register" && (
                  <LandForm
                    polygon={polygon}
                    onSubmit={handleCreateLand}
                    onCancel={cancelCurrentMode}
                    loading={loading}
                  />
                )}

                {mode === "search" && (
                  <SearchPanel
                    searchArea={searchArea}
                    loading={loading}
                    resultCount={null}
                    onSearch={handleSearch}
                    onCancel={cancelCurrentMode}
                  />
                )}
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}

function AppHeader({ mode, onRegister, onSearch }) {
  return (
    <header
      className="
        relative
        z-40
        shrink-0
        border-b
        border-slate-200/80
        bg-white/95
        shadow-[0_1px_3px_rgba(15,23,42,0.04)]
        backdrop-blur
      "
    >
      <div
        className="
          flex
          min-h-16
          items-center
          justify-between
          gap-4
          px-4
          py-3

          sm:px-6
          lg:px-8
        "
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-emerald-600
                text-sm
                font-bold
                text-white
                shadow-sm
              "
              aria-hidden="true"
            >
              GL
            </div>

            <div className="min-w-0">
              <h1
                className="
                  truncate
                  text-base
                  font-semibold
                  tracking-tight
                  text-slate-950

                  sm:text-lg
                "
              >
                Geo Land Marketplace
              </h1>

              <p
                className="
                  hidden
                  truncate
                  text-xs
                  text-slate-500

                  sm:block
                "
              >
                Explore and register land through an interactive map
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRegister}
            className={`
              inline-flex
              h-10
              items-center
              justify-center
              rounded-xl
              px-3
              text-sm
              font-medium
              transition

              focus:outline-none
              focus:ring-2
              focus:ring-emerald-100

              sm:px-4

              ${
                mode === "register"
                  ? `
                    bg-emerald-700
                    text-white
                    shadow-sm
                  `
                  : `
                    bg-emerald-600
                    text-white
                    shadow-sm
                    hover:bg-emerald-700
                  `
              }
            `}
          >
            <span className="hidden sm:inline">Register land</span>

            <span className="sm:hidden">Register</span>
          </button>

          <button
            type="button"
            onClick={onSearch}
            className={`
              inline-flex
              h-10
              items-center
              justify-center
              rounded-xl
              border
              px-3
              text-sm
              font-medium
              transition

              focus:outline-none
              focus:ring-2
              focus:ring-emerald-100

              sm:px-4

              ${
                mode === "search"
                  ? `
                    border-emerald-300
                    bg-emerald-50
                    text-emerald-800
                  `
                  : `
                    border-slate-200
                    bg-white
                    text-slate-700
                    hover:border-slate-300
                    hover:bg-slate-50
                  `
              }
            `}
          >
            <span className="hidden sm:inline">Search area</span>

            <span className="sm:hidden">Search</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function BrowseHint() {
  return (
    <div
      className="
        pointer-events-none
        absolute
        bottom-5
        left-1/2
        z-10
        w-[calc(100%-2rem)]
        max-w-md
        -translate-x-1/2

        sm:bottom-6
      "
    >
      <div
        className="
          rounded-2xl
          border
          border-white/80
          bg-white/90
          px-4
          py-3
          text-center
          shadow-lg
          shadow-slate-900/10
          backdrop-blur-md
        "
      >
        <p className="text-sm font-medium text-slate-800">Explore the map</p>

        <p className="mt-0.5 text-xs leading-5 text-slate-500">
          Register a land parcel or draw a circular area to search nearby
          listings.
        </p>
      </div>
    </div>
  );
}

function MapInstruction({ eyebrow, title, children }) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        left-1/2
        top-4
        z-10
        w-[calc(100%-2rem)]
        max-w-sm
        -translate-x-1/2

        sm:top-5
      "
    >
      <div
        className="
          rounded-2xl
          border
          border-white/80
          bg-white/95
          px-4
          py-3
          shadow-xl
          shadow-slate-900/10
          backdrop-blur-md
        "
      >
        <p
          className="
            text-[0.65rem]
            font-semibold
            uppercase
            tracking-[0.16em]
            text-emerald-600
          "
        >
          {eyebrow}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500">{children}</p>
      </div>
    </div>
  );
}

function SearchRadiusBadge({ radiusMeters }) {
  return (
    <div
      className="
        pointer-events-none
        absolute
        bottom-5
        left-1/2
        z-10
        -translate-x-1/2
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
          rounded-full
          border
          border-blue-100
          bg-white/95
          px-4
          py-2
          shadow-lg
          shadow-slate-900/10
          backdrop-blur-md
        "
      >
        <span className="text-xs text-slate-500">Radius</span>

        <span className="text-sm font-semibold tabular-nums text-blue-600">
          {formatRadius(radiusMeters)}
        </span>
      </div>
    </div>
  );
}

function StatusMessage({ message }) {
  const success = message.type === "success";

  return (
    <div
      className={`
        mb-5
        rounded-xl
        border
        px-4
        py-3
        text-sm
        leading-5

        ${
          success
            ? `
              border-emerald-200
              bg-emerald-50
              text-emerald-800
            `
            : `
              border-red-200
              bg-red-50
              text-red-800
            `
        }
      `}
    >
      <div className="flex gap-3">
        <span
          className={`
            mt-1
            h-2
            w-2
            shrink-0
            rounded-full

            ${success ? "bg-emerald-500" : "bg-red-500"}
          `}
          aria-hidden="true"
        />

        <span>{message.text}</span>
      </div>
    </div>
  );
}

function formatRadius(radiusMeters) {
  if (!Number.isFinite(radiusMeters)) {
    return "—";
  }

  if (radiusMeters < 1000) {
    return `${Math.round(radiusMeters)} m`;
  }

  return `${(radiusMeters / 1000).toFixed(2)} km`;
}

export default LandMapPage;
