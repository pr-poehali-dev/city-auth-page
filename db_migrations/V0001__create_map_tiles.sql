CREATE SCHEMA IF NOT EXISTS t_p71493936_city_auth_page;

CREATE TABLE t_p71493936_city_auth_page.map_tiles (
  x         INTEGER NOT NULL,
  y         INTEGER NOT NULL,
  tile_type INTEGER NOT NULL DEFAULT 0,
  walkable  BOOLEAN NOT NULL DEFAULT TRUE,
  sprite_id VARCHAR(64) NOT NULL DEFAULT 'grass',
  props     JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (x, y)
);

CREATE INDEX ON t_p71493936_city_auth_page.map_tiles (tile_type);

COMMENT ON TABLE t_p71493936_city_auth_page.map_tiles IS 'Карта Городка — каждая клетка 50x50 сетки';
COMMENT ON COLUMN t_p71493936_city_auth_page.map_tiles.tile_type IS '0=grass,1=road,2=building,3=tree,4=hospital,5=mall,6=prison';
COMMENT ON COLUMN t_p71493936_city_auth_page.map_tiles.walkable IS 'Можно ли пройти через клетку';
COMMENT ON COLUMN t_p71493936_city_auth_page.map_tiles.sprite_id IS 'ID спрайта для отрисовки';
COMMENT ON COLUMN t_p71493936_city_auth_page.map_tiles.props IS 'Дополнительные свойства клетки (JSON)';
