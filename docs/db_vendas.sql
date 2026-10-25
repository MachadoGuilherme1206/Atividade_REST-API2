-- Garante que acentos (ex.: "Fábio") sejam gravados corretamente,
-- independente da codificação padrão do cliente MySQL que rodar o script
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS db_vendas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_vendas;

-- A ordem do DROP importa: vendas depende das outras duas por chave estrangeira
DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS vendedores;
DROP TABLE IF EXISTS regioes;

-- =====================================================================
-- Vendedores
-- =====================================================================
CREATE TABLE vendedores (
  id_vendedor       INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome              VARCHAR(100)    NOT NULL,
  meta_mensal       DECIMAL(12,2)   NOT NULL,                -- meta em R$
  percentual_base   DECIMAL(5,2)    NOT NULL,                -- comissão base em %
  ativo             BOOLEAN         NOT NULL DEFAULT TRUE,   -- desativar não apaga o histórico

  criado_em         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  atualizado_em     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_meta_mensal CHECK (meta_mensal > 0),
  CONSTRAINT chk_percentual_base CHECK (percentual_base >= 0 AND percentual_base <= 100)
);

-- =====================================================================
-- Regiões (tabela fixa: o bônus regional é lido daqui no cálculo da comissão)
-- =====================================================================
CREATE TABLE regioes (
  id_regiao         INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome_regiao       VARCHAR(50)     NOT NULL,
  percentual_bonus  DECIMAL(5,2)    NOT NULL DEFAULT 0,

  CONSTRAINT uq_nome_regiao UNIQUE (nome_regiao),
  CONSTRAINT chk_nome_regiao CHECK (nome_regiao IN ('Norte', 'Nordeste', 'Sudeste', 'Sul')),
  CONSTRAINT chk_percentual_bonus CHECK (percentual_bonus >= 0 AND percentual_bonus <= 100)
);

-- =====================================================================
-- Vendas
-- =====================================================================
CREATE TABLE vendas (
  -- Código único da venda (recebido no corpo do POST, não é auto-incremento),
  -- por isso a API consegue validar e rejeitar um código duplicado
  id_venda          INT             NOT NULL PRIMARY KEY,

  id_vendedor       INT             NOT NULL,
  id_regiao         INT             NOT NULL,
  data_venda        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valor_venda       DECIMAL(12,2)   NOT NULL,
  tipo_cliente      ENUM('PF','PJ') NOT NULL,

  -- Calculado pela API no momento da venda e gravado aqui: se o percentual
  -- do vendedor mudar depois, a comissão das vendas antigas não muda
  valor_comissao    DECIMAL(12,2)   NOT NULL,

  -- RESTRICT impede apagar um vendedor ou região que tenha vendas,
  -- preservando o histórico (o vendedor é desativado, não excluído)
  CONSTRAINT fk_vendas_vendedor FOREIGN KEY (id_vendedor)
    REFERENCES vendedores (id_vendedor) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_vendas_regiao FOREIGN KEY (id_regiao)
    REFERENCES regioes (id_regiao) ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_id_venda CHECK (id_venda > 0),
  CONSTRAINT chk_valor_venda CHECK (valor_venda > 0),
  CONSTRAINT chk_valor_comissao CHECK (valor_comissao >= 0)
);

-- Índice para o filtro por período usado no relatório de performance
CREATE INDEX idx_vendas_data ON vendas (data_venda);

-- =====================================================================
-- Dados de teste
-- =====================================================================

INSERT INTO regioes (id_regiao, nome_regiao, percentual_bonus) VALUES
  (1, 'Norte',    1.00),
  (2, 'Nordeste', 1.00),
  (3, 'Sudeste',  0.00),
  (4, 'Sul',      0.50);

-- O vendedor 6 está inativo: serve para o teste de venda para vendedor inativo
-- e mostra que o histórico dele (venda 1016) continua no banco
INSERT INTO vendedores (id_vendedor, nome, meta_mensal, percentual_base, ativo) VALUES
  (1, 'Ana Souza',    15000.00, 5.00, TRUE),
  (2, 'Bruno Lima',   12000.00, 4.50, TRUE),
  (3, 'Carla Mendes', 20000.00, 6.00, TRUE),
  (4, 'Diego Santos', 10000.00, 4.00, TRUE),
  (5, 'Elisa Rocha',   8000.00, 5.50, TRUE),
  (6, 'Fábio Nunes',   9000.00, 4.00, FALSE);

-- Comissão = valor_venda × (percentual_base + bônus do cliente + bônus da região) / 100
-- Bônus do cliente: PF 2%, PJ 3%. Bônus da região: tabela regioes.
-- Ex.: venda 1001 → 2000 × (5 + 3 + 1) / 100 = 180,00 (exemplo do enunciado)
--
-- Em outubro/2026 atingem a meta: Ana (15.700 / 15.000), Carla (23.050 / 20.000)
-- e Elisa (9.050 / 8.000). Bruno (9.150 / 12.000) e Diego (8.000 / 10.000) não.
INSERT INTO vendas (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao) VALUES
  (1001, 1, 1, '2026-10-02 09:15:00',  2000.00, 'PJ',  180.00),
  (1002, 1, 3, '2026-10-05 14:30:00',  8500.00, 'PJ',  680.00),
  (1003, 1, 4, '2026-10-12 10:00:00',  5200.00, 'PF',  390.00),
  (1004, 2, 2, '2026-10-03 11:20:00',  3200.00, 'PF',  240.00),
  (1005, 2, 2, '2026-10-15 16:45:00',  4100.00, 'PJ',  348.50),
  (1006, 2, 4, '2026-10-21 09:30:00',  1850.00, 'PF',  129.50),
  (1007, 3, 3, '2026-10-04 13:10:00', 12000.00, 'PJ', 1080.00),
  (1008, 3, 3, '2026-10-18 15:00:00',  6300.00, 'PF',  504.00),
  (1009, 3, 1, '2026-10-25 10:40:00',  4750.00, 'PJ',  475.00),
  (1010, 4, 1, '2026-10-06 08:50:00',  2600.00, 'PF',  182.00),
  (1011, 4, 4, '2026-10-14 17:25:00',  3900.00, 'PJ',  292.50),
  (1012, 4, 2, '2026-10-27 12:05:00',  1500.00, 'PF',  105.00),
  (1013, 5, 4, '2026-10-08 10:30:00',  4800.00, 'PJ',  432.00),
  (1014, 5, 1, '2026-10-19 14:15:00',  2350.00, 'PF',  199.75),
  (1015, 5, 3, '2026-10-29 11:00:00',  1900.00, 'PF',  142.50),
  (1016, 6, 2, '2026-09-22 15:30:00',  2750.00, 'PF',  192.50),
  (1017, 1, 2, '2026-09-10 09:00:00',  6100.00, 'PJ',  549.00),
  (1018, 3, 4, '2026-09-17 16:20:00',  9400.00, 'PF',  799.00);
