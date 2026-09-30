package com.landmarketplace.land.api;

import com.landmarketplace.land.api.dto.GeoJsonPolygon;
import com.landmarketplace.land.api.dto.LandResponse;
import com.landmarketplace.land.domain.Land;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class LandApiMapper {

    private final GeometryFactory geometryFactory =
        new GeometryFactory(new PrecisionModel(), 4326);

    public Polygon toPolygon(GeoJsonPolygon geoJson) {
        if (geoJson == null || !"Polygon".equals(geoJson.type())) {
            throw new IllegalArgumentException(
                "Geometry must be a GeoJson Polygon"
            );
        }

        List<List<List<Double>>> rings = geoJson.coordinates();

        if (rings == null || rings.isEmpty()) {
            throw new IllegalArgumentException(
                "Polygon must contain an exterior ring"
            );
        }

        LinearRing shell = toLinearRing(rings.get(0));

        LinearRing[] holes = new LinearRing[rings.size() - 1];

        for (int i = 1; i < rings.size(); i++) {
            holes[i - 1] = toLinearRing(rings.get(i));
        }

        Polygon polygon = geometryFactory.createPolygon(shell, holes);

        if (polygon.isEmpty()
            || !polygon.isValid()
            || polygon.getArea() <= 0) {
            throw new IllegalArgumentException(
                "Invalid polygon geometry"
            );
        }

        return polygon;
    }

    private LinearRing toLinearRing(List<List<Double>> positions) {
        if (positions == null || positions.size() < 4) {
            throw new IllegalArgumentException(
                "A polygon ring requires at least four positions"
            );
        }

        Coordinate[] coordinates = new Coordinate[positions.size()];

        for (int i = 0; i < positions.size(); i++) {
            List<Double> position = positions.get(i);

            if (position == null || position.size() != 2
                || position.get(0) == null
                || position.get(1) == null) {
                throw new IllegalArgumentException(
                    "Each position requires longitude and latitude"
                );
            }

            double longitude = position.get(0);
            double latitude = position.get(1);

            if (!Double.isFinite(longitude)
                || !Double.isFinite(latitude)
                || longitude < -180 || longitude > 180
                || latitude < -90 || latitude > 90) {
                throw new IllegalArgumentException(
                    "Invalid geographic coordinates"
                );
            }

            coordinates[i] = new Coordinate(longitude, latitude);
        }

        if (!coordinates[0].equals2D(
            coordinates[coordinates.length - 1])) {
            throw new IllegalArgumentException(
                "Polygon ring must be closed"
            );
        }

        try {
            return geometryFactory.createLinearRing(coordinates);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                "Invalid polygon ring",
                exception
            );
        }
    }

    public LandResponse toResponse(Land land) {
        return new LandResponse(
            land.getId(),
            land.getPrice(),
            land.getDescription(),
            land.getContact(),
            toGeoJson(land.getGeometry()),
            land.getCreatedAt(),
            land.getUpdatedAt()
        );
    }

    private GeoJsonPolygon toGeoJson(Polygon polygon) {
        List<List<List<Double>>> rings = new ArrayList<>();

        rings.add(toPositions(
            polygon.getExteriorRing().getCoordinates()
        ));

        for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
            rings.add(toPositions(
                polygon.getInteriorRingN(i).getCoordinates()
            ));
        }

        return new GeoJsonPolygon("Polygon", rings);
    }

    private List<List<Double>> toPositions(Coordinate[] coordinates) {
        List<List<Double>> positions = new ArrayList<>();

        for (Coordinate coordinate : coordinates) {
            positions.add(List.of(
                coordinate.getX(),
                coordinate.getY()
            ));
        }

        return positions;
    }
}

