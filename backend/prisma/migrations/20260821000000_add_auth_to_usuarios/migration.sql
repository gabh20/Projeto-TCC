ALTER TABLE `usuarios`
  ADD COLUMN `senha_hash` VARCHAR(255) NULL,
  ADD COLUMN `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE `usuarios`
SET `senha_hash` = 'scrypt:legacy-user:00'
WHERE `senha_hash` IS NULL;

ALTER TABLE `usuarios`
  MODIFY COLUMN `senha_hash` VARCHAR(255) NOT NULL;

CREATE UNIQUE INDEX `usuarios_email_key` ON `usuarios`(`email`);
