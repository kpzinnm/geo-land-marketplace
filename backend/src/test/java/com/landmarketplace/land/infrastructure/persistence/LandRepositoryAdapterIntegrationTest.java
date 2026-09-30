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
class LandRepositoryAdapterIntegrationTest extends com.landmarketplace.support.PostgisIntegrationSupport {

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Autowired
    private LandRepository repository;

    private final GeometryFactory geometryFactory =
        new GeometryFactory(new PrecisionModel(), 4326);

    @org.junit.jupiter.api.BeforeEach
    void cleanDedicatedDatabase() {
        entityManager.createQuery("delete from LandJpaEntity").executeUpdate();
        entityManager.clear();
    }

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

        entityManager.flush();
        entityManager.clear();

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

    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.CsvSource(delimiter = '|', value = {
        "POLYGON((0 0,2 0,2 2,0 2,0 0))|true",
        "POLYGON((0.5 0.5,1 0.5,1 1,0.5 1,0.5 0.5))|true",
        "POLYGON((-1 -1,3 -1,3 3,-1 3,-1 -1))|true",
        "POLYGON((2 2,3 2,3 3,2 3,2 2))|false",
        "POLYGON((3 3,4 3,4 4,3 4,3 3))|false"
    })
    void shouldClassifyInteriorConflicts(String wkt, boolean conflict) {
        repository.save(com.landmarketplace.support.LandFixtures.land("POLYGON((0 0,2 0,2 2,0 2,0 0))"));
        assertEquals(conflict, repository.existsOverlappingLand(com.landmarketplace.support.LandFixtures.polygon(wkt)));
    }

    @Test
    void shouldPreserveHolesAndAllowLandInsideAHole() {
        Land original = com.landmarketplace.support.LandFixtures.land(
            "POLYGON((0 0,4 0,4 4,0 4,0 0),(1 1,1 3,3 3,3 1,1 1))");
        repository.save(original);
        entityManager.clear();
        Land restored = repository.findById(original.getId()).orElseThrow();
        assertTrue(original.getGeometry().equalsExact(restored.getGeometry()));
        assertTrue(Math.abs(java.time.Duration.between(original.getCreatedAt(), restored.getCreatedAt()).toNanos()) < 1000);
        assertTrue(Math.abs(java.time.Duration.between(original.getUpdatedAt(), restored.getUpdatedAt()).toNanos()) < 1000);
        assertFalse(repository.existsOverlappingLand(com.landmarketplace.support.LandFixtures.polygon(
            "POLYGON((1.5 1.5,2 1.5,2 2,1.5 2,1.5 1.5))")));
        assertTrue(repository.search(2, 2, 100).isEmpty());
    }

    @Test
    void shouldSearchByMinimumDistanceInMetersIncludingPartialIntersection() {
        Land near = repository.save(com.landmarketplace.support.LandFixtures.land(
            "POLYGON((0.004 -0.001,0.02 -0.001,0.02 0.001,0.004 0.001,0.004 -0.001))"));
        repository.save(com.landmarketplace.support.LandFixtures.land(
            "POLYGON((1 1,1.01 1,1.01 1.01,1 1.01,1 1))"));
        assertEquals(java.util.List.of(near.getId()), repository.search(0, 0, 500).stream().map(Land::getId).toList());
        assertTrue(repository.search(0, 0, 400).isEmpty());
        assertEquals(1, repository.search(0.01, 0, 1).size());
    }

    @Test
    void shouldIncludeTangencyAtTheMeasuredDistance() {
        repository.save(com.landmarketplace.support.LandFixtures.land(
            "POLYGON((0.004 0,0.005 0,0.005 0.001,0.004 0.001,0.004 0))"));
        double distance = ((Number) entityManager.createNativeQuery("""
            SELECT public.ST_Distance(geometry::public.geography,
                public.ST_SetSRID(public.ST_MakePoint(0, 0),4326)::public.geography) FROM app.lands
            """).getSingleResult()).doubleValue();
        assertEquals(1, repository.search(0, 0, distance + 0.000001).size());
        assertTrue(repository.search(0, 0, distance - 0.001).isEmpty());
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
