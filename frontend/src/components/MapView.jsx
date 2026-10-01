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

import { fromLonLat } from "ol/proj";

import { unByKey } from "ol/Observable";

import { circleToSearchArea } from "../utils/mapUtils";

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

const hoveredResultStyle = new Style({
  fill: new Fill({
    color: "rgba(16, 185, 129, 0.38)",
  }),

  stroke: new Stroke({
    color: "#047857",
    width: 4,
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
  fitResultsKey,
  searchResults,
  selectedLand,
  hoveredLand,
  onLandSelected,
  onLandHover,
}) {
  const mapElementRef = useRef(null);

  const mapRef = useRef(null);

  const interactionSourceRef = useRef(null);

  const resultsSourceRef = useRef(null);

  const drawInteractionRef = useRef(null);

  /*
   * Initializes the OpenLayers map.
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
        const geometry = feature.getGeometry();

        const geometryType = geometry?.getType();

        if (geometryType === "Circle") {
          return searchCircleStyle;
        }

        return candidateStyle;
      },
    });

    const resultsLayer = new VectorLayer({
      source: resultsSource,

      style: (feature) => {
        const selected = feature.get("selected");

        const hovered = feature.get("hovered");

        if (selected) {
          return selectedResultStyle;
        }

        if (hovered) {
          return hoveredResultStyle;
        }

        return resultStyle;
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

    function getResultFeature(pixel) {
      return (
        map.forEachFeatureAtPixel(
          pixel,

          (feature) => feature,

          {
            layerFilter: (layer) => layer === resultsLayer,
          },
        ) || null
      );
    }

    const clickKey = map.on("singleclick", (event) => {
      const feature = getResultFeature(event.pixel);

      if (!feature) {
        return;
      }

      const land = feature.get("land");

      if (!land) {
        return;
      }

      onLandHover?.(null);

      onLandSelected?.(land);
    });

    const pointerMoveKey = map.on("pointermove", (event) => {
      if (event.dragging) {
        return;
      }

      const feature = getResultFeature(event.pixel);

      const land = feature?.get("land");

      onLandHover?.(land || null);

      const target = map.getTargetElement();

      if (target) {
        target.style.cursor = land ? "pointer" : "";
      }
    });

    mapRef.current = map;

    interactionSourceRef.current = interactionSource;

    resultsSourceRef.current = resultsSource;

    return () => {
      unByKey(clickKey);
      unByKey(pointerMoveKey);

      const target = map.getTargetElement();

      if (target) {
        target.style.cursor = "";
      }

      map.setTarget(undefined);

      mapRef.current = null;

      interactionSourceRef.current = null;

      resultsSourceRef.current = null;
    };
  }, [onLandHover, onLandSelected]);

  /*
   * Controls drawing according
   * to the current mode.
   */
  useEffect(() => {
    const map = mapRef.current;

    const interactionSource = interactionSourceRef.current;

    if (!map || !interactionSource) {
      return;
    }

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
      interactionSource.clear();

      if (mode === "register") {
        onPolygonDrawn?.(null);
      }

      if (mode === "search") {
        onSearchAreaChange?.(null);

        const circle = event.feature.getGeometry();

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

      if (mode === "register") {
        const geometry = event.feature.getGeometry();

        const geoJson = new GeoJSON().writeGeometryObject(geometry, {
          featureProjection: "EPSG:3857",

          dataProjection: "EPSG:4326",

          rightHanded: true,
        });

        onPolygonDrawn?.(geoJson);
      }

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

  useEffect(() => {
    interactionSourceRef.current?.clear();
  }, [resetKey]);

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
      const geometry = geoJson.readGeometry(land.geometry, {
        dataProjection: "EPSG:4326",

        featureProjection: "EPSG:3857",
      });

      const feature = new Feature({
        geometry,
      });

      /*
       * React/API identity and
       * OpenLayers identity use
       * the same land ID.
       */
      feature.setId(land.id);

      feature.set("land", land);

      feature.set("selected", false);

      feature.set("hovered", false);

      return feature;
    });

    source.addFeatures(features);
  }, [searchResults]);

  useEffect(() => {
    const map = mapRef.current;

    const source = resultsSourceRef.current;

    if (!map || !source) {
      return;
    }

    source.getFeatures().forEach((feature) => {
      feature.set("selected", false);
    });

    if (!selectedLand) {
      return;
    }

    const selectedFeature = source.getFeatureById(selectedLand.id);

    if (!selectedFeature) {
      return;
    }

    selectedFeature.set("selected", true);

    const geometry = selectedFeature.getGeometry();

    if (!geometry) {
      return;
    }

    map.getView().fit(geometry.getExtent(), {
      duration: 600,

      maxZoom: 17,

      padding: [100, 100, 100, 100],
    });
  }, [selectedLand]);

  /*
   * Synchronizes hover state
   * from either the result list
   * or the map.
   */
  useEffect(() => {
    const source = resultsSourceRef.current;

    if (!source) {
      return;
    }

    source.getFeatures().forEach((feature) => {
      feature.set("hovered", false);
    });

    if (!hoveredLand) {
      return;
    }

    const hoveredFeature = source.getFeatureById(hoveredLand.id);

    if (!hoveredFeature) {
      return;
    }

    hoveredFeature.set("hovered", true);
  }, [hoveredLand]);

  useEffect(() => {
    const map = mapRef.current;

    const source = resultsSourceRef.current;

    if (!map || !source) {
      return;
    }

    const features = source.getFeatures();

    if (features.length === 0) {
      return;
    }

    const extent = source.getExtent();

    map.getView().fit(extent, {
      duration: 600,

      maxZoom: 16,

      padding: [80, 80, 80, 80],
    });
  }, [fitResultsKey]);

  return <div ref={mapElementRef} className="h-full w-full" />;
}

export default MapView;
