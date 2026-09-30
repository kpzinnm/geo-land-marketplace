package com.landmarketplace.land.application;

import com.landmarketplace.land.domain.Land;
import com.landmarketplace.land.domain.LandRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SearchLandsUseCase {
    public static final double MAX_RADIUS_METERS = 100_000;
    private final LandRepository repository;

    public SearchLandsUseCase(LandRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Land> execute(double longitude, double latitude, double radiusMeters) {
        if (!Double.isFinite(longitude) || longitude < -180 || longitude > 180
            || !Double.isFinite(latitude) || latitude < -90 || latitude > 90
            || !Double.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > MAX_RADIUS_METERS) {
            throw new IllegalArgumentException("Search requires valid longitude/latitude and radiusMeters in (0, 100000]");
        }
        return repository.search(longitude, latitude, radiusMeters);
    }
}
