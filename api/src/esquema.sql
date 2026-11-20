-- Esquema de Pixel & Play. Es idempotente: la API lo ejecuta en cada inicio.

CREATE TABLE IF NOT EXISTS productos (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(120) NOT NULL,
  price       INTEGER      NOT NULL CHECK (price >= 0),
  category    VARCHAR(60)  NOT NULL,
  featured    BOOLEAN      NOT NULL DEFAULT FALSE,
  description TEXT         NOT NULL DEFAULT '',
  image       TEXT         NOT NULL DEFAULT '',
  images      TEXT[]       NOT NULL DEFAULT '{}',
  video       TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  creado        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Se guarda el hash SHA-256 del token, no el token: si se filtra la tabla, las sesiones no se pueden usar
CREATE TABLE IF NOT EXISTS sesiones (
  token_hash CHAR(64)    PRIMARY KEY,
  usuario_id INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  expira     TIMESTAMPTZ NOT NULL
);

-- El número de boleta es correlativo entre todas las cuentas
CREATE TABLE IF NOT EXISTS compras (
  numero     SERIAL PRIMARY KEY,
  usuario_id INTEGER     NOT NULL REFERENCES usuarios (id),
  fecha      TIMESTAMPTZ NOT NULL DEFAULT now(),
  unidades   INTEGER     NOT NULL,
  total      INTEGER     NOT NULL
);

-- Nombre y precio se copian al comprar para que la boleta no cambie si después se edita el producto
CREATE TABLE IF NOT EXISTS compra_items (
  id            SERIAL       PRIMARY KEY,
  compra_numero INTEGER      NOT NULL REFERENCES compras (numero) ON DELETE CASCADE,
  producto_id   INTEGER      REFERENCES productos (id) ON DELETE SET NULL,
  title         VARCHAR(120) NOT NULL,
  price         INTEGER      NOT NULL,
  quantity      INTEGER      NOT NULL CHECK (quantity > 0),
  subtotal      INTEGER      NOT NULL
);
