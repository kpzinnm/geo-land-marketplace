package com.landmarketplace.land.application;

import org.springframework.transaction.annotation.Isolation;
import com.landmarketplace.land.domain.Land;
import com.landmarketplace.land.domain.LandRepository;
import org.locationtech.jts.geom.Polygon;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class CreateLandUseCase {

    private final LandRepository landRepository;

    public CreateLandUseCase(LandRepository landRepository) {
        this.landRepository = landRepository;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Land execute(
        BigDecimal price,
        String description,
        String contact,
        Polygon geometry
    ) {
        Land land = Land.create(
            price,
            description,
            contact,
            geometry
        );

        landRepository.acquireRegistrationLock();

        // The lock, conflict check and insert share the same transaction.
        if (landRepository.existsOverlappingLand(land.getGeometry())) {
            throw new LandOverlapException();
        }

        return landRepository.save(land);
    }
}
