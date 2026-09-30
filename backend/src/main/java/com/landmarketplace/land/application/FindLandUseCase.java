package com.landmarketplace.land.application;

import com.landmarketplace.land.domain.Land;
import com.landmarketplace.land.domain.LandRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class FindLandUseCase {
    private final LandRepository repository;

    public FindLandUseCase(LandRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Land execute(UUID id) {
        return repository.findById(id).orElseThrow(LandNotFoundException::new);
    }
}
