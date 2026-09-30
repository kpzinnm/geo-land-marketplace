package com.landmarketplace.land.application;

import com.landmarketplace.land.domain.Land;
import com.landmarketplace.land.domain.LandRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;

import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateLandUseCaseTest {

    @Mock
    private LandRepository repository;

    private CreateLandUseCase useCase;

    private final GeometryFactory factory =
        new GeometryFactory(new PrecisionModel(), 4326);

    @BeforeEach
    void setUp() {
        useCase = new CreateLandUseCase(repository);
    }

    @Test
    void shouldCreateLandWhenThereIsNoOverlap() {
        Polygon geometry = createPolygon();

        when(repository.existsOverlappingLand(any(Polygon.class)))
            .thenReturn(false);

        when(repository.save(any(Land.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        Land result = useCase.execute(
            new BigDecimal("250000.00"),
            "Residential land",
            "owner@example.com",
            geometry
        );

        assertNotNull(result.getId());
        assertEquals(new BigDecimal("250000.00"), result.getPrice());

        InOrder order = inOrder(repository);

        order.verify(repository).acquireRegistrationLock();
        order.verify(repository).existsOverlappingLand(any(Polygon.class));
        order.verify(repository).save(any(Land.class));
    }

    @Test
    void shouldRejectOverlappingLand() {
        when(repository.existsOverlappingLand(any(Polygon.class)))
            .thenReturn(true);

        assertThrows(
            LandOverlapException.class,
            () -> useCase.execute(
                new BigDecimal("250000.00"),
                "Residential land",
                "owner@example.com",
                createPolygon()
            )
        );

        verify(repository).acquireRegistrationLock();
        verify(repository, never()).save(any(Land.class));
    }

    @Test
    void shouldRejectInvalidPriceBeforeAccessingRepository() {
        assertThrows(
            IllegalArgumentException.class,
            () -> useCase.execute(
                new BigDecimal("-100.00"),
                "Residential land",
                "owner@example.com",
                createPolygon()
            )
        );

        verifyNoInteractions(repository);
    }

    private Polygon createPolygon() {
        return factory.createPolygon(new Coordinate[]{
            new Coordinate(0, 0),
            new Coordinate(1, 0),
            new Coordinate(1, 1),
            new Coordinate(0, 1),
            new Coordinate(0, 0)
        });
    }
}
