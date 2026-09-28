CREATE TABLE app.lands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price NUMERIC(15,2) NOT NULL,

    geometry GEOMETRY(POLYGON, 4326) NOT NULL,.
    
)