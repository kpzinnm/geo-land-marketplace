package com.landmarketplace.land.domain;

import java.util.List;
import org.locationtech.jts.geom.Polygon;

import java.util.Optional;
import java.util.UUID;

public interface LandRepository {

    boolean existsOverlappingLand(Polygon polygon);

    Land save(Land land);

    Optional<Land> findById(UUID id);

    List<Land> search(double longitude, double latitude, double radiusMeters);

    void acquireRegistrationLock();
}
