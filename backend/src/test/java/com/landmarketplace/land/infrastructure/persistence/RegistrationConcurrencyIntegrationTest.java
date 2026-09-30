package com.landmarketplace.land.infrastructure.persistence;

import com.landmarketplace.land.application.CreateLandUseCase;
import com.landmarketplace.land.application.LandOverlapException;
import com.landmarketplace.land.domain.LandRepository;
import com.landmarketplace.support.PostgisIntegrationSupport;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.concurrent.*;
import static com.landmarketplace.support.LandFixtures.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RegistrationConcurrencyIntegrationTest extends PostgisIntegrationSupport {
    @Autowired LandRepository repository;
    @Autowired CreateLandUseCase create;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired JdbcTemplate jdbc;

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void shouldWaitForIndependentTransactionAndObserveCommitOrRollback(boolean rollback) throws Exception {
        jdbc.update("DELETE FROM app.lands");
        var lockHeld = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var candidate = land("POLYGON((0 0,1 0,1 1,0 1,0 0))");
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> new TransactionTemplate(transactionManager).execute(status -> {
                repository.acquireRegistrationLock();
                repository.save(candidate);
                int pid = jdbc.queryForObject("SELECT pg_backend_pid()", Integer.class);
                lockHeld.countDown();
                try {
                    if (!release.await(15, TimeUnit.SECONDS)) throw new IllegalStateException("Release timed out");
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                }
                if (rollback) status.setRollbackOnly();
                return pid;
            }));
            assertTrue(lockHeld.await(10, TimeUnit.SECONDS));
            var second = executor.submit(() -> {
                try {
                    create.execute(candidate.getPrice(), candidate.getDescription(), candidate.getContact(), candidate.getGeometry());
                    return "created";
                } catch (LandOverlapException exception) {
                    return "conflict";
                }
            });
            try {
                long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                boolean waiting = false;
                while (System.nanoTime() < deadline) {
                    waiting = Boolean.TRUE.equals(jdbc.queryForObject("""
                        SELECT EXISTS(SELECT 1 FROM pg_locks
                        WHERE locktype = 'advisory' AND classid = 724019 AND objid = 1 AND NOT granted)
                        """, Boolean.class));
                    if (waiting) break;
                    Thread.sleep(20);
                }
                assertTrue(waiting, "The second database connection must actually wait for the advisory lock");
                assertFalse(second.isDone());
            } finally {
                release.countDown();
            }
            assertNotNull(first.get(10, TimeUnit.SECONDS));
            assertEquals(rollback ? "created" : "conflict", second.get(10, TimeUnit.SECONDS));
            assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM app.lands", Integer.class));
        } finally {
            release.countDown();
            jdbc.update("DELETE FROM app.lands");
        }
    }
}
