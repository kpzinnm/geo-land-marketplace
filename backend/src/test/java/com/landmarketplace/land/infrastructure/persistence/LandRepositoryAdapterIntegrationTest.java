package com.landmarketplace.land.infrastructure.persistence;

import com.landmarketplace.land.domain.Land;
import com.landmarketplace.land.domain.LandRepository;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class LandRepositoryAdapterIntegrationTest {

    @Autowired
    private LandRepository repository;

    private final GeometryFactory geometryFactory =
        new GeometryFactory(new PrecisionModel(), 4326);

    @Test
    void shouldPersistAndRetrieveLand() {
        Polygon geometry = createPolygon(0, 0, 1, 1);

        Land land = Land.create(
            new BigDecimal("250000.00"),
            "Residential land",
            "owner@example.com",
            geometry
        );

        Land saved = repository.save(land);

        Land retrieved = repository.findById(saved.getId())
            .orElseThrow();

        assertEquals(land.getId(), retrieved.getId());
        assertEquals(land.getPrice(), retrieved.getPrice());
        assertEquals(land.getDescription(), retrieved.getDescription());
        assertEquals(land.getContact(), retrieved.getContact());

        assertEquals(4326, retrieved.getGeometry().getSRID());
        assertTrue(retrieved.getGeometry().equalsExact(geometry));
    }

    @Test
    void shouldDetectOverlappingLand() {
        Land land = Land.create(
            new BigDecimal("250000.00"),
            "Existing land",
            "owner@example.com",
            createPolygon(0, 0, 2, 2)
        );

        repository.save(land);

        Polygon overlapping = createPolygon(1, 1, 3, 3);

        assertTrue(repository.existsOverlappingLand(overlapping));
    }

    @Test
    void shouldAllowSharedBoundary() {
        Land land = Land.create(
            new BigDecimal("250000.00"),
            "Existing land",
            "owner@example.com",
            createPolygon(0, 0, 2, 2)
        );

        repository.save(land);

        Polygon adjacent = createPolygon(2, 0, 4, 2);

        assertFalse(repository.existsOverlappingLand(adjacent));
    }

    private Polygon createPolygon(
        double minX,
        double minY,
        double maxX,
        double maxY
    ) {
        Coordinate[] coordinates = {
            new Coordinate(minX, minY),
            new Coordinate(maxX, minY),
            new Coordinate(maxX, maxY),
            new Coordinate(minX, maxY),
            new Coordinate(minX, minY)
        };

        return geometryFactory.createPolygon(coordinates);
    }
}
