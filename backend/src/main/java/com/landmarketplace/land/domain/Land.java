package com.landmarketplace.land.domain;

import lombok.Getter;
import org.locationtech.jts.geom.Polygon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Getter
public class Land {

    private final UUID id;
    private final BigDecimal price;
    private final String description;
    private final String contact;
    private final Polygon geometry;
    private final Instant createdAt;
    private final Instant updatedAt;

    private Land(
        UUID id,
        BigDecimal price,
        String description,
        String contact,
        Polygon geometry,
        Instant createdAt,
        Instant updatedAt
    ) {
        this.id = Objects.requireNonNull(id, "Land ID is required");
        this.price = validatePrice(price);
        this.description = validateText(description, "Description");
        this.contact = validateText(contact, "Contact");
        this.geometry = validateGeometry(geometry);
        this.createdAt = Objects.requireNonNull(createdAt, "Creation date is required");
        this.updatedAt = Objects.requireNonNull(updatedAt, "Update date is required");
    }

    public static Land create(
        BigDecimal price,
        String description,
        String contact,
        Polygon geometry
    ) {
        Instant now = Instant.now();

        return new Land(
            UUID.randomUUID(),
            price,
            description,
            contact,
            geometry,
            now,
            now
        );
    }

    public static Land restore(
        UUID id,
        BigDecimal price,
        String description,
        String contact,
        Polygon geometry,
        Instant createdAt,
        Instant updatedAt
    ) {
        return new Land(
            id,
            price,
            description,
            contact,
            geometry,
            createdAt,
            updatedAt
        );
    }

    public Polygon getGeometry() {
        return (Polygon) geometry.copy();
    }

    private static BigDecimal validatePrice(BigDecimal price) {
        Objects.requireNonNull(price, "Price is required");

        if (price.signum() <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }

        if (price.scale() > 2 || price.precision() - price.scale() > 13) {
            throw new IllegalArgumentException("Price must fit 13 integer digits and 2 decimal places");
        }
        return price;
    }

    private static String validateText(String text, String field) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }

        return text;
    }

    private static Polygon validateGeometry(Polygon geometry) {
        Objects.requireNonNull(geometry, "Geometry is required");

        if (geometry.getSRID() != 4326) {
            throw new IllegalArgumentException("Geometry must use (SRID 4326)");
        }

        if (geometry.isEmpty() || !geometry.isValid() || geometry.getArea() <= 0) {
            throw new IllegalArgumentException("Invalid land geometry");
        }

        for (var coordinate : geometry.getCoordinates()) {
            if (!Double.isFinite(coordinate.x) || !Double.isFinite(coordinate.y)
                || coordinate.x < -180 || coordinate.x > 180
                || coordinate.y < -90 || coordinate.y > 90) {
                throw new IllegalArgumentException("Invalid geographic coordinates");
            }
        }
        if (geometry.getEnvelopeInternal().getWidth() >= 180) {
            throw new IllegalArgumentException("Polygons spanning 180 degrees or crossing the antimeridian are not supported");
        }
        return (Polygon) geometry.copy();
    }

}
