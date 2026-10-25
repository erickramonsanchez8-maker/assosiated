CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  fulfilment VARCHAR(60) NOT NULL DEFAULT 'Recoger en restaurante',
  address VARCHAR(180) NOT NULL DEFAULT '',
  notes VARCHAR(500) NOT NULL DEFAULT '',
  items_json JSON NOT NULL,
  status ENUM('pendiente','confirmado','en preparación','listo','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_created (created_at),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL DEFAULT '',
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests TINYINT UNSIGNED NOT NULL,
  notes VARCHAR(500) NOT NULL DEFAULT '',
  status ENUM('pendiente','confirmada','rechazada','cancelada','atendida') NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reservation_date_time (reservation_date, reservation_time),
  INDEX idx_reservations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
