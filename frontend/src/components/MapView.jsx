import { useEffect, useRef } from "react";

import Map from "ol/Map";
import View from "ol/View";

import Feature from "ol/Feature";

import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";

import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";

import Draw from "ol/interaction/Draw";

import GeoJSON from "ol/format/GeoJSON";

import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

import { fromLonLat, toLonLat } from "ol/proj";

import { getDistance } from "ol/sphere";

import { circleToSearchArea } from "../utils/mapUtils";

import { unByKey } from "ol/Observable";

const candidateStyle = new Style({
  fill: new Fill({
    color: "rgba(37, 99, 235, 0.20)",
  }),

  stroke: new Stroke({
    color: "#2563eb",
    width: 3,
  }),
});

const searchCircleStyle = new Style({
  fill: new Fill({
    color: "rgba(59, 130, 246, 0.10)",
  }),

  stroke: new Stroke({
    color: "#3b82f6",
    width: 2,
    lineDash: [8, 8],
  }),
});

const resultStyle = new Style({
  fill: new Fill({
    color: "rgba(16, 185, 129, 0.25)",
  }),

  stroke: new Stroke({
    color: "#059669",
    width: 3,
  }),
});

const selectedResultStyle = new Style({
  fill: new Fill({
    color: "rgba(5, 150, 105, 0.45)",
  }),

  stroke: new Stroke({
    color: "#064e3b",
    width: 5,
  }),
});

function MapView({
  mode,
  onPolygonDrawn,
  onSearchAreaChange,
  resetKey,
  searchResults,
  selectedLand,
  onLandSelected,
}) {
  const mapElementRef = useRef(null);

  const mapRef = useRef(null);

  const interactionSourceRef = useRef(null);

  const resultsSourceRef = useRef(null);

  const drawInteractionRef = useRef(null);

  /*
   * Initializes the OpenLayers map.
   *
   * This effect is responsible for creating:
   *
   * - the base map;
   * - the interaction layer;
   * - the search result layer;
   * - the click handler.
   */
  useEffect(() => {
    if (mapRef.current) {
      return;
    }

    const interactionSource = new VectorSource();

    const resultsSource = new VectorSource();

    const interactionLayer = new VectorLayer({
      source: interactionSource,

      style: (feature) => {
        const geometryType = feature.getGeometry().getType();

        if (geometryType === "Circle") {
          return searchCircleStyle;
        }

        return candidateStyle;
      },
    });

    /*
     * This layer contains lands returned
     * by the search endpoint.
     */
    const resultsLayer = new VectorLayer({
      source: resultsSource,

      style: (feature) => {
        const selected = feature.get("selected");

        return selected ? selectedResultStyle : resultStyle;
      },
    });

    const map = new Map({
      target: mapElementRef.current,

      layers: [
        new TileLayer({
          source: new OSM(),
        }),

        resultsLayer,

        interactionLayer,
      ],

      view: new View({
        center: fromLonLat([-35.8811, -7.2306]),

        zoom: 13,
      }),
    });

    /*
     * Allows the user to select a land
     * directly by clicking its polygon.
     */
    const clickKey = map.on("singleclick", (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,

        (candidateFeature) => candidateFeature,

        {
          /*
           * Ignore the search circle
           * and registration polygon.
           *
           * Only search result features
           * can be selected.
           */
          layerFilter: (layer) => layer === resultsLayer,
        },
      );

      if (!feature) {
        return;
      }

      const land = feature.get("land");

      if (!land) {
        return;
      }

      onLandSelected?.(land);
    });

    mapRef.current = map;

    interactionSourceRef.current = interactionSource;

    resultsSourceRef.current = resultsSource;

    return () => {
      unByKey(clickKey);

      map.setTarget(undefined);

      mapRef.current = null;

      interactionSourceRef.current = null;

      resultsSourceRef.current = null;
    };
  }, [onLandSelected]);

  /*
   * Controls the drawing tool according
   * to the current application mode.
   *
   * browse:
   *   no drawing interaction
   *
   * register:
   *   polygon drawing
   *
   * search:
   *   circle drawing
   */
  useEffect(() => {
    const map = mapRef.current;

    const interactionSource = interactionSourceRef.current;

    if (!map || !interactionSource) {
      return;
    }

    /*
     * Remove a previous drawing interaction
     * before adding another one.
     */
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);

      drawInteractionRef.current = null;
    }

    if (mode === "browse") {
      return;
    }

    const geometryType = mode === "register" ? "Polygon" : "Circle";

    const draw = new Draw({
      source: interactionSource,
      type: geometryType,
    });

    let geometryChangeKey = null;

    draw.on("drawstart", (event) => {
      /*
       * Only one temporary geometry
       * should exist at a time.
       */
      interactionSource.clear();

      if (mode === "register") {
        onPolygonDrawn?.(null);
      }

      if (mode === "search") {
        onSearchAreaChange?.(null);

        const circle = event.feature.getGeometry();

        /*
         * During mouse movement,
         * the Circle geometry changes.
         *
         * We listen to this event so
         * the radius displayed in the
         * sidebar updates dynamically.
         */
        geometryChangeKey = circle.on("change", () => {
          const searchArea = circleToSearchArea(circle);

          onSearchAreaChange?.(searchArea);
        });
      }
    });

    draw.on("drawend", (event) => {
      if (geometryChangeKey) {
        unByKey(geometryChangeKey);

        geometryChangeKey = null;
      }

      /*
       * Registration polygon.
       */
      if (mode === "register") {
        const geometry = event.feature.getGeometry();

        const geoJson = new GeoJSON().writeGeometryObject(geometry, {
          featureProjection: "EPSG:3857",

          dataProjection: "EPSG:4326",

          rightHanded: true,
        });

        onPolygonDrawn?.(geoJson);
      }

      /*
       * Search circle.
       */
      if (mode === "search") {
        const circle = event.feature.getGeometry();

        const searchArea = circleToSearchArea(circle);

        onSearchAreaChange?.(searchArea);
      }
    });

    map.addInteraction(draw);

    drawInteractionRef.current = draw;

    return () => {
      if (geometryChangeKey) {
        unByKey(geometryChangeKey);
      }

      map.removeInteraction(draw);

      if (drawInteractionRef.current === draw) {
        drawInteractionRef.current = null;
      }
    };
  }, [mode, onPolygonDrawn, onSearchAreaChange]);

  /*
   * Clears temporary interaction geometry.
   *
   * Changing resetKey from the parent
   * triggers this effect.
   */
  useEffect(() => {
    interactionSourceRef.current?.clear();
  }, [resetKey]);

  /*
   * Converts backend search results into
   * OpenLayers Features.
   */
  useEffect(() => {
    const source = resultsSourceRef.current;

    if (!source) {
      return;
    }

    source.clear();

    if (!searchResults?.length) {
      return;
    }

    const geoJson = new GeoJSON();

    const features = searchResults.map((land) => {
      /*
       * Backend:
       * EPSG:4326
       *
       * OpenLayers:
       * EPSG:3857
       */
      const geometry = geoJson.readGeometry(land.geometry, {
        dataProjection: "EPSG:4326",

        featureProjection: "EPSG:3857",
      });

      const feature = new Feature({
        geometry,
      });

      /*
       * Connect backend identity with
       * OpenLayers identity.
       */
      feature.setId(land.id);

      /*
       * Store the complete backend
       * object inside the Feature.
       *
       * This allows map clicks to recover
       * the corresponding land.
       */
      feature.set("land", land);

      feature.set("selected", false);

      return feature;
    });

    source.addFeatures(features);
  }, [searchResults]);

  /*
   * Reacts whenever selectedLand changes.
   *
   * Responsibilities:
   *
   * 1. remove previous visual selection;
   * 2. highlight selected polygon;
   * 3. move the map to that polygon.
   */
  useEffect(() => {
    const map = mapRef.current;

    const source = resultsSourceRef.current;

    if (!map || !source) {
      return;
    }

    /*
     * First remove selection from
     * every result.
     */
    source.getFeatures().forEach((feature) => {
      feature.set("selected", false);
    });

    /*
     * No land selected means all features
     * should use the normal style.
     */
    if (!selectedLand) {
      return;
    }

    const selectedFeature = source.getFeatureById(selectedLand.id);

    if (!selectedFeature) {
      return;
    }

    /*
     * Changing this property causes the
     * layer style function to use
     * selectedResultStyle.
     */
    selectedFeature.set("selected", true);

    const geometry = selectedFeature.getGeometry();

    if (!geometry) {
      return;
    }

    /*
     * getExtent returns the bounding box:
     *
     * [
     *   minX,
     *   minY,
     *   maxX,
     *   maxY
     * ]
     *
     * fit() calculates a suitable center
     * and zoom automatically.
     */
    map.getView().fit(geometry.getExtent(), {
      duration: 600,

      maxZoom: 17,

      padding: [100, 100, 100, 100],
    });
  }, [selectedLand]);

  return (
    <div
      ref={mapElementRef}
      className="
        h-full
        w-full
      "
    />
  );
}

export default MapView;
