package com.landmarketplace.support;

import com.landmarketplace.land.domain.Land;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.WKTReader;
import java.math.BigDecimal;

public final class LandFixtures {
    private LandFixtures() {}

    public static Polygon polygon(String wkt) {
        try {
            Polygon polygon = (Polygon) new WKTReader().read(wkt);
            polygon.setSRID(4326);
            return polygon;
        } catch (org.locationtech.jts.io.ParseException exception) {
            throw new IllegalArgumentException(exception);
        }
    }

    public static Land land(String wkt) {
        return Land.create(new BigDecimal("250000.00"), "Residential land", "owner@example.com", polygon(wkt));
    }
}
