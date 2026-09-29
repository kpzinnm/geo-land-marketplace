package com.landmarketplace.land.infrastructure.persistence;

import com.landmarketplace.land.domain.Land;
import com.landmarketplace.land.domain.LandRepository;
import org.springframework.stereotype.Repository;
import org.locationtech.jts.geom.Polygon;


import java.util.Optional;
import java.util.UUID;

@Repository
public class LandRepositoryAdapter implements LandRepository {

    private final SpringDataLandRepository repository;
    private final LandPersistenceMapper mapper;

    public LandRepositoryAdapter(SpringDataLandRepository repository, LandPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public boolean existsOverlappingLand(Polygon geometry) {
        return repository.existsOverlappingLand(geometry.toText());
    }

    @Override
    public Land save(Land land) {
        LandJpaEntity entity = mapper.toEntity(land);
        LandJpaEntity savedEntity = repository.save(entity);

        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Land> findById(UUID id) {
        return repository.findById(id)
            .map(mapper::toDomain);
    }
}
