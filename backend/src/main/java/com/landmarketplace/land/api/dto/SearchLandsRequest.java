package com.landmarketplace.land.api.dto;

import jakarta.validation.constraints.NotNull;

public record SearchLandsRequest(
    @NotNull Double longitude,
    @NotNull Double latitude,
    @NotNull Double radiusMeters
) {}
