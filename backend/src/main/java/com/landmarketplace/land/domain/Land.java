package com.landmarketplace.land.domain;

import lombok.Getter;
import org.locationtech.jts.geom.Polygon;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Getter
public class Land {

    private UUID id;
    private BigDecimal price;
    private String description;
    private String contact;
    private Polygon geometry;
    private Instant createdAt;
    private Instant updatedAt;

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

    private static BigDecimal validatePrice(BigDecimal price) {
        Objects.requireNonNull(price, "Price is required");

        if (price.signum() <= 0) {
            throw new IllegalArgumentException("Price must be positive");
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

        return geometry;
    }

}
