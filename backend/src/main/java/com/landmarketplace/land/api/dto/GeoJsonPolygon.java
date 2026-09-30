package com.landmarketplace.land.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

// GeoJSON positions use [longitude, latitude] in WGS84 (SRID 4326).
public record GeoJsonPolygon(
    @NotBlank String type,
    @NotNull List<List<List<Double>>> coordinates
    ) {
}
