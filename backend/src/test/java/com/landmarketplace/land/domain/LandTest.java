package com.landmarketplace.land.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.math.BigDecimal;
import static com.landmarketplace.support.LandFixtures.*;
import static org.junit.jupiter.api.Assertions.*;

class LandTest {
    private static final String SQUARE = "POLYGON((0 0,1 0,1 1,0 1,0 0))";

    @Test
    void shouldDefensivelyCopyMutableGeometryAndRestoreAllFields() {
        var shape = polygon(SQUARE);
        var land = Land.create(BigDecimal.ONE, "Description", "Contact", shape);
        shape.setSRID(0);
        land.getGeometry().setSRID(0);
        assertEquals(4326, land.getGeometry().getSRID());
        var restored = Land.restore(land.getId(), land.getPrice(), land.getDescription(), land.getContact(),
            land.getGeometry(), land.getCreatedAt(), land.getUpdatedAt());
        assertEquals(land.getId(), restored.getId());
        assertEquals(land.getCreatedAt(), restored.getUpdatedAt());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1", "1.001", "10000000000000"})
    void shouldRejectPricesOutsideDatabaseContract(String price) {
        assertThrows(IllegalArgumentException.class,
            () -> Land.create(new BigDecimal(price), "Description", "Contact", polygon(SQUARE)));
    }

    @Test
    void shouldRejectMissingFieldsAndWrongSrid() {
        assertThrows(NullPointerException.class, () -> Land.create(null, "D", "C", polygon(SQUARE)));
        assertThrows(IllegalArgumentException.class, () -> Land.create(BigDecimal.ONE, " ", "C", polygon(SQUARE)));
        assertThrows(IllegalArgumentException.class, () -> Land.create(BigDecimal.ONE, "D", null, polygon(SQUARE)));
        assertThrows(NullPointerException.class, () -> Land.create(BigDecimal.ONE, "D", "C", null));
        var shape = polygon(SQUARE);
        shape.setSRID(0);
        assertThrows(IllegalArgumentException.class, () -> Land.create(BigDecimal.ONE, "D", "C", shape));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "POLYGON EMPTY", "POLYGON((0 0,1 1,0 1,1 0,0 0))",
        "POLYGON((0 0,1 0,2 0,0 0))", "POLYGON((181 0,182 0,182 1,181 1,181 0))",
        "POLYGON((179 0,-179 0,-179 1,179 1,179 0))"
    })
    void shouldRejectInvalidOrUnsupportedGeometry(String wkt) {
        assertThrows(IllegalArgumentException.class, () -> land(wkt));
    }
}
