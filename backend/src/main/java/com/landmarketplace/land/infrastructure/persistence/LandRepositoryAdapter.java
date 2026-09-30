package com.landmarketplace.land.infrastructure.persistence;

import org.hibernate.Session;
import java.util.List;
import com.landmarketplace.land.domain.Land;
import com.landmarketplace.land.domain.LandRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;
import org.locationtech.jts.geom.Polygon;


import java.util.Optional;
import java.util.UUID;

@Repository
public class LandRepositoryAdapter implements LandRepository {

    private final SpringDataLandRepository repository;
    private final LandPersistenceMapper mapper;
    private final EntityManager entityManager;

    public LandRepositoryAdapter(SpringDataLandRepository repository, LandPersistenceMapper mapper, EntityManager entityManager) {
        this.repository = repository;
        this.mapper = mapper;
        this.entityManager = entityManager;
    }

    @Override
    public boolean existsOverlappingLand(Polygon geometry) {
        return repository.existsOverlappingLand(geometry.toText());
    }

    @Override
    public Land save(Land land) {
        LandJpaEntity entity = mapper.toEntity(land);
        LandJpaEntity savedEntity = repository.saveAndFlush(entity);

        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Land> findById(UUID id) {
        return repository.findById(id)
            .map(mapper::toDomain);
    }

    @Override
    public List<Land> search(double longitude, double latitude, double radiusMeters) {
        return repository.search(longitude, latitude, radiusMeters).stream().map(mapper::toDomain).toList();
    }

    @Override
    public void acquireRegistrationLock() {
        entityManager.unwrap(Session.class).doWork(connection -> {
            try (var statement = connection.prepareStatement("SELECT pg_advisory_xact_lock(724019, 1)")) {
                statement.execute();
            }
        });
    }
}
