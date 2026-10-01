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

    /*
     * No search results should be
     * displayed while registering.
     */
    setHasSearched(false);

    setMessage(null);

    resetInteraction();
  }

  /*
   * Starts a NEW search.
   *
   * Previous search results disappear
   * because the user is defining another
   * search area.
   */
  function startSearch() {
    setMode("search");

    setPolygon(null);

    setSearchArea(null);

    setSelectedLand(null);

    setSearchResults([]);

    /*
     * We are starting a search,
     * but it has NOT finished yet.
     */
    setHasSearched(false);

    setMessage(null);

    resetInteraction();
  }

  /*
   * Closes the right interaction panel.
   */
  function cancelCurrentMode() {
    setMode("browse");

    setPolygon(null);

    setSearchArea(null);

    setMessage(null);

    resetInteraction();
  }

  /*
   * Completely closes the left search
   * results panel.
   */
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

  /*
   * Executes the spatial search.
   */
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
       * THIS IS THE IMPORTANT LINE.
       *
       * At this point the request finished
       * successfully.
       *
       * Even if lands = [], we want to open
       * the left sidebar showing:
       *
       * "No lands were found."
       */
      setHasSearched(true);

      setSelectedLand(null);

      /*
       * The search panel on the right closes.
       *
       * The result panel on the left opens.
       */
      setMode("browse");

      setSearchArea(null);

      resetInteraction();
    } catch (error) {
      /*
       * The search did NOT complete
       * successfully.
       */
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
    <div
      className="
        flex
        h-screen
        flex-col
        bg-slate-100
      "
    >
      <header
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-200
          bg-white
          px-6
          py-4
        "
      >
        <div>
          <h1
            className="
              text-xl
              font-semibold
              text-slate-900
            "
          >
            Geo Land Marketplace
          </h1>

          <p
            className="
              text-sm
              text-slate-500
            "
          >
            Explore and register available land
          </p>
        </div>

        <div
          className="
            flex
            gap-2
          "
        >
          <button
            type="button"
            onClick={startRegistration}
            className="
              rounded-lg
              bg-slate-900
              px-4
              py-2
              text-sm
              font-medium
              text-white
              transition
              hover:bg-slate-700
            "
          >
            Register land
          </button>

          <button
            type="button"
            onClick={startSearch}
            className="
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2
              text-sm
              font-medium
              text-slate-700
              transition
              hover:bg-slate-100
            "
          >
            Search area
          </button>
        </div>
      </header>

      <div
        className="
          flex
          min-h-0
          flex-1
        "
      >
        {/*
         * LEFT PANEL
         *
         * Notice:
         *
         * hasSearched
         *
         * NOT:
         *
         * searchResults.length > 0
         *
         * This allows us to display an
         * empty search result.
         */}
        {hasSearched && (
          <aside
            className="
              w-80 max-w-[35vw] shrink-0
              shrink-0
              border-r
              border-slate-200
              bg-white
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
        )}

        <section
          className="
            relative
            min-w-0
            flex-1
          "
        >
          <MapView
            mode={mode}
            onPolygonDrawn={handlePolygonDrawn}
            onSearchAreaChange={handleSearchAreaChange}
            resetKey={resetKey}
            searchResults={searchResults}
            selectedLand={selectedLand}
            onLandSelected={setSelectedLand}
          />

          {mode === "register" && (
            <MapInstruction>
              Click to draw the land boundary.
              <br />
              Click the first point to finish.
            </MapInstruction>
          )}

          {mode === "search" && (
            <MapInstruction>
              Click and drag to define the search radius.
            </MapInstruction>
          )}
        </section>

        {/*
         * RIGHT PANEL
         *
         * Used only while the user is
         * performing an action.
         */}
        {mode !== "browse" && (
          <aside
            className="
              w-96 max-w-[40vw] shrink-0
              shrink-0
              overflow-y-auto
              border-l
              border-slate-200
              bg-white
              p-6
            "
          >
            {message && (
              <div
                className={`
                  mb-4
                  rounded-lg
                  p-3
                  text-sm

                  ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-red-50 text-red-800"
                  }
                `}
              >
                {message.text}
              </div>
            )}

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
                /*
                 * Search results are only
                 * displayed AFTER the search
                 * completes and the left
                 * panel opens.
                 */
                resultCount={null}
                onSearch={handleSearch}
                onCancel={cancelCurrentMode}
              />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function MapInstruction({ children }) {
  return (
    <div
      className="
        absolute
        left-4
        top-4
        z-10
        rounded-lg
        bg-white/95
        px-4
        py-3
        text-sm
        text-slate-700
        shadow-lg
      "
    >
      {children}
    </div>
  );
}

export default LandMapPage;
