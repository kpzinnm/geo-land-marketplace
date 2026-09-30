-- Metric searches cast geometry to geography and need a matching expression index.
CREATE INDEX idx_lands_geography
    ON app.lands
    USING GIST ((geometry::public.geography));
