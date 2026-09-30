package com.landmarketplace.land.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateLandRequest(
    @NotNull
    @Positive
    @Digits(integer = 13, fraction = 2)
    BigDecimal price,
    @NotBlank
    String description,
    @NotBlank
    String contact,
    @NotNull
    @Valid
    GeoJsonPolygon geometry
) {
}
