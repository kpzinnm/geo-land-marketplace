CREATE TABLE app.lands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    price NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    contact TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    geometry public.geometry(POLYGON, 4326) NOT NULL,

    CONSTRAINT chk_lands_positive_price
        CHECK (price > 0),

    CONSTRAINT chk_lands_description_not_blank
        CHECK (LENGTH(BTRIM(description)) > 0),

    CONSTRAINT chk_lands_contact_not_blank
        CHECK (LENGTH(BTRIM(contact)) > 0),

    CONSTRAINT chk_lands_valid_geometry
        CHECK (public.ST_IsValid(geometry)),

    CONSTRAINT chk_lands_non_empty_geometry
        CHECK (NOT public.ST_IsEmpty(geometry)),

    CONSTRAINT chk_lands_positive_area
        CHECK (public.ST_Area(geometry) > 0)
);

CREATE INDEX idx_lands_geometry
    ON app.lands
    USING GIST (geometry);
