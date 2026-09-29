package com.landmarketplace.land.domain;

import org.locationtech.jts.geom.Polygon;

import java.util.Optional;
import java.util.UUID;

public interface LandRepository {

    boolean existsOverlappingLand(Polygon polygon);

    Land save(Land land);

    Optional<Land> findById(UUID id);
}
