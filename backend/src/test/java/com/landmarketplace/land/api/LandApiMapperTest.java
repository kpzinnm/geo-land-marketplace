package com.landmarketplace.land.api;

import com.landmarketplace.land.api.dto.GeoJsonPolygon;

import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Polygon;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LandApiMapperTest {

    private final LandApiMapper mapper = new LandApiMapper();

    @Test
    void shouldConvertValidGeoJsonToPolygon() {
        GeoJsonPolygon geoJson = validPolygon();

        Polygon polygon = mapper.toPolygon(geoJson);

        assertEquals(4326, polygon.getSRID());
        assertTrue(polygon.isValid());
        assertEquals(1.0, polygon.getArea());
    }

    @Test
    void shouldRejectUnsupportedGeometryType() {
        GeoJsonPolygon geoJson = new GeoJsonPolygon(
            "Point",
            validPolygon().coordinates()
        );

        assertThrows(
            IllegalArgumentException.class,
            () -> mapper.toPolygon(geoJson)
        );
    }

    @Test
    void shouldRejectOpenPolygonRing() {
        GeoJsonPolygon geoJson = new GeoJsonPolygon(
            "Polygon",
            List.of(
                List.of(
                    List.of(0.0, 0.0),
                    List.of(1.0, 0.0),
                    List.of(1.0, 1.0),
                    List.of(0.0, 1.0)
                )
            )
        );

        assertThrows(
            IllegalArgumentException.class,
            () -> mapper.toPolygon(geoJson)
        );
    }

    @Test
    void shouldRejectSelfIntersectingPolygon() {
        GeoJsonPolygon geoJson = new GeoJsonPolygon(
            "Polygon",
            List.of(
                List.of(
                    List.of(0.0, 0.0),
                    List.of(1.0, 1.0),
                    List.of(0.0, 1.0),
                    List.of(1.0, 0.0),
                    List.of(0.0, 0.0)
                )
            )
        );

        assertThrows(
            IllegalArgumentException.class,
            () -> mapper.toPolygon(geoJson)
        );
    }

    @Test
    void shouldRoundTripPolygonWithHolesAndMetadata() {
        var land = com.landmarketplace.support.LandFixtures.land(
            "POLYGON((0 0,4 0,4 4,0 4,0 0),(1 1,1 3,3 3,3 1,1 1))");
        var response = mapper.toResponse(land);
        assertEquals(land.getId(), response.id());
        assertEquals(land.getPrice(), response.price());
        assertEquals(land.getCreatedAt(), response.createdAt());
        assertEquals(land.getUpdatedAt(), response.updatedAt());
        assertTrue(land.getGeometry().equalsExact(mapper.toPolygon(response.geometry())));
    }

    @Test
    void shouldRejectMissingRingsAndMalformedPositions() {
        assertThrows(IllegalArgumentException.class, () -> mapper.toPolygon(null));
        assertThrows(IllegalArgumentException.class, () -> mapper.toPolygon(new GeoJsonPolygon("Polygon", null)));
        assertThrows(IllegalArgumentException.class, () -> mapper.toPolygon(new GeoJsonPolygon("Polygon", List.of())));
        var rings = new java.util.ArrayList<List<List<Double>>>();
        rings.add(null);
        assertThrows(IllegalArgumentException.class, () -> mapper.toPolygon(new GeoJsonPolygon("Polygon", rings)));
        rings.set(0, List.of(List.of(0.0, 0.0)));
        assertThrows(IllegalArgumentException.class, () -> mapper.toPolygon(new GeoJsonPolygon("Polygon", rings)));
        var malformed = java.util.Arrays.asList(null, List.of(0.0), List.of(0.0, 0.0, 0.0),
            java.util.Arrays.asList(null, 0.0), java.util.Arrays.asList(0.0, null),
            List.of(Double.NaN, 0.0), List.of(0.0, Double.POSITIVE_INFINITY),
            List.of(181.0, 0.0), List.of(-181.0, 0.0), List.of(0.0, 91.0), List.of(0.0, -91.0));
        for (var position : malformed) {
            var positions = new java.util.ArrayList<>(validPolygon().coordinates().getFirst());
            positions.set(0, position);
            assertThrows(IllegalArgumentException.class,
                () -> mapper.toPolygon(new GeoJsonPolygon("Polygon", List.of(positions))));
        }
    }

    private GeoJsonPolygon validPolygon() {
        return new GeoJsonPolygon(
            "Polygon",
            List.of(
                List.of(
                    List.of(0.0, 0.0),
                    List.of(1.0, 0.0),
                    List.of(1.0, 1.0),
                    List.of(0.0, 1.0),
                    List.of(0.0, 0.0)
                )
            )
        );
    }
}
