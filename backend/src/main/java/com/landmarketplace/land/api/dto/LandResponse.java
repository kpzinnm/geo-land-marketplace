package com.landmarketplace.land.api.dto;


import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LandResponse(
    UUID id,
    BigDecimal price,
    String description,
    String contact,
    GeoJsonPolygon geometry,
    Instant createdAt,
    Instant updatedAt
) {

}
