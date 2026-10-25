# API de Vendas com Comissões, Metas e Performance

API REST (Node.js + Express) para uma rede de lojas com unidades nas regiões
Norte, Nordeste, Sudeste e Sul. Gerencia vendedores e vendas, calcula a comissão
de cada venda automaticamente e gera um relatório de desempenho comercial por
período. Os dados são persistidos em MySQL, acessado com `mysql2/promise` e
funções `async/await`.

## Requisitos

- Node.js 18 ou superior
- MySQL 8 (ou MariaDB 10.5+)

## Como rodar

1. Instalar as dependências:

   ```
   npm install
   ```

2. Criar o banco, as tabelas e os dados de teste (cria o database `db_vendas`,
   as tabelas `vendedores`, `regioes` e `vendas`, 6 vendedores e 18 vendas):

   ```
   mysql -u root -p < docs/db_vendas.sql
   ```

   Rodar o script de novo apaga tudo e recria do zero: é o jeito de voltar ao
   estado inicial antes de repetir os testes.

3. Configurar as credenciais do banco. Copie o `.env.example` para `.env` e
   preencha a senha do seu MySQL:

   ```
   cp .env.example .env
   ```

   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_DATABASE=db_vendas
   PORTA=3000
   ```

   O `.env` está no `.gitignore`: a senha não vai para o repositório.

4. Subir o servidor (porta 3000):

   ```
   npm start
   ```

   Se der certo, o terminal mostra `Conectado ao MySQL (...)` e
   `Servidor rodando na porta 3000`.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/vendedores` | Cadastra um vendedor. 201 no sucesso, 400 em erro de validação. |
| GET | `/vendedores` | Lista os vendedores. Filtro opcional: `?ativo=true` ou `?ativo=false`. |
| GET | `/vendedores/:id` | Consulta um vendedor (inclusive inativo). 404 se não existir. |
| PUT | `/vendedores/:id` | Atualiza meta mensal e/ou percentual base. Aceita envio parcial. 404 se não existir. |
| PATCH | `/vendedores/:id/desativar` | Desativa o vendedor, mantendo o histórico de vendas. 400 se já estiver inativo. |
| POST | `/vendas` | Registra uma venda e calcula a comissão. 201 no sucesso; 400/404 em erro de validação. |
| GET | `/vendas` | Lista as vendas, com nome do vendedor e da região. |
| GET | `/vendas/vendedor/:id` | Vendas de um vendedor. 404 se o vendedor não existir. |
| GET | `/vendas/regiao/:id` | Vendas de uma região. 404 se a região não existir. |
| DELETE | `/vendas/:id` | Exclui uma venda após verificar se ela existe. 404 se não existir. |
| GET | `/relatorios/performance?inicio=AAAA-MM-DD&fim=AAAA-MM-DD` | Relatório gerencial do período. |

### Corpo das requisições

**POST /vendedores**

```json
{ "nome": "Gabriela Teixeira", "meta_mensal": 10000, "percentual_base": 5 }
```

**PUT /vendedores/:id**: um ou os dois campos; o campo ausente mantém o valor atual.

```json
{ "meta_mensal": 9000, "percentual_base": 4.5 }
```

**POST /vendas**

```json
{
  "id_venda": 2001,
  "id_vendedor": 1,
  "id_regiao": 1,
  "valor_venda": 2000,
  "tipo_cliente": "PJ",
  "data_venda": "2026-10-20 10:00:00"
}
```

- `id_venda` é o código único da venda, informado pelo cliente (não é
  auto-incremento), por isso a API consegue rejeitar um código repetido.
- `data_venda` é opcional: se não vier, a venda é registrada com a data e hora atuais.
- `tipo_cliente` aceita `PF` ou `PJ` (maiúsculas ou minúsculas).
- Regiões: `1` Norte, `2` Nordeste, `3` Sudeste, `4` Sul.

### Respostas

Todas as respostas são JSON no formato `{ status, message, ... }`. Erros de
validação de formato vêm em `{ status: false, error }`, e erros de banco
trazem a causa em `erro`.

| Código | Quando |
| --- | --- |
| 200 | Consulta, atualização, desativação ou exclusão com sucesso |
| 201 | Vendedor ou venda criados |
| 400 | Campo ausente ou inválido, código de venda duplicado, vendedor inativo, período inválido |
| 404 | Vendedor, região, venda ou rota inexistente |
| 500 | Falha na conexão ou na consulta ao banco |

## Regras de comissão

```
comissão = valor_venda × (percentual_base + bônus_cliente + bônus_região) / 100
```

Os percentuais são somados, sem composição entre eles.

| Tipo de cliente | Bônus |
| --- | --- |
| PF | 2% |
| PJ | 3% |

| Região | Bônus |
| --- | --- |
| Norte | 1% |
| Nordeste | 1% |
| Sudeste | 0% |
| Sul | 0,5% |

Exemplo: venda de R$ 2.000,00 para PJ no Norte, com base de 5%, dá
5 + 3 + 1 = 9%, ou seja, comissão de R$ 180,00.

- A regra fica numa única função, `calcularComissao()` em `utils/comissao.js`.
- O bônus da região é lido da tabela `regioes`. O bônus do tipo de cliente é
  uma constante na mesma função.
- A comissão é calculada no momento da venda e gravada em `valor_comissao`.
  Se o percentual do vendedor mudar depois, a comissão das vendas antigas
  continua a mesma.

## Relatório de performance

`GET /relatorios/performance?inicio=2026-10-01&fim=2026-10-31`

O período inclui o dia final inteiro. Cada indicador vem de uma consulta SQL:

| Indicador | Campo na resposta | SQL |
| --- | --- | --- |
| Total de vendas | `total_vendas` | `COUNT` |
| Vendas por região | `vendas_por_regiao` | `LEFT JOIN` + `GROUP BY` + `SUM` |
| Vendas por tipo de cliente | `vendas_por_tipo_cliente` | `GROUP BY` + `SUM` |
| Melhor vendedor | `melhor_vendedor` | `JOIN` + `GROUP BY` + `SUM` (maior valor vendido) |
| Maior comissão | `maior_comissao` | `JOIN` + `GROUP BY` + `SUM` (maior comissão acumulada) |
| Metas atingidas | `metas_atingidas` | `JOIN` + `GROUP BY` mês e vendedor + `SUM` |
| Comissão média geral | `comissao_media_geral` | `AVG` |
| Comissão média por região | `comissao_media_por_regiao` | `LEFT JOIN` + `GROUP BY` + `AVG` |

**Metas mensais.** As vendas são somadas por vendedor dentro de cada mês do
período e comparadas com a `meta_mensal`. Num relatório de setembro a outubro,
cada mês é avaliado separadamente, em vez de somar dois meses de vendas contra
uma meta de um mês. A resposta traz, para cada mês, quantos vendedores
atingiram a meta e a lista de vendedores com total vendido, percentual
atingido e `atingiu_meta`.

## Dados de teste

O script `docs/db_vendas.sql` cadastra:

- **6 vendedores.** O vendedor 6, Fábio Nunes, está inativo, para os testes
  de vendedor inativo e de histórico preservado.
- **18 vendas.**
  - 15 em outubro/2026, distribuídas entre as 4 regiões e entre PF e PJ.
  - 3 em setembro/2026.

Em outubro/2026 atingem a meta Ana Souza, Carla Mendes e Elisa Rocha. Bruno
Lima e Diego Santos não atingem.

## Testando no Insomnia

O arquivo [`docs/insomnia_vendas.json`](docs/insomnia_vendas.json) é uma
collection pronta com 34 requisições: todos os endpoints e todos os casos de
erro.

Para importar, use **Application → Preferences → Data → Import Data → From
File**, ou o botão **Import** na tela de collections, e selecione o arquivo.

A variável `base_url` já vem configurada como `http://localhost:3000`.

As requisições estão em cinco pastas, numeradas na ordem de execução. Cada uma
traz na descrição o status e os valores esperados.

- **1. Vendedores**: cadastro, listagem, consulta, atualização e desativação.
- **2. Vendas**: registro com comissão, listagens, consultas por vendedor e
  região, e exclusão.
- **3. Validações e erros**: os casos que devem retornar 400 ou 404.
- **4. Relatórios**: outubro/2026 e setembro a outubro.
- **5. Erro de banco**: requisições para enviar com o MySQL parado.

Recomendo rodar o `docs/db_vendas.sql` antes de começar. Assim os ids e os
valores esperados nas descrições batem.

### Testes obrigatórios

| # | Teste | Requisição na collection | Esperado |
| --- | --- | --- | --- |
| 1 | Cadastro de vendedor e registro com comissão correta | Vendedores 1; Vendas 1 | 201; `valor_comissao` 180 |
| 2 | Venda com código duplicado | Validações 1 | 400 |
| 3 | Venda para vendedor inexistente ou inativo | Validações 2 e 3 | 404 e 400 |
| 4 | Atualização de meta mensal | Vendedores 5 | 200, meta 9000 |
| 5 | Consultas por região e por vendedor | Vendas 5 e 7 | 200 |
| 6 | Relatório mensal com atingimento de metas | Relatórios 1 | 200, `metas_atingidas` |
| 7 | Erro na conexão ou consulta ao banco | Erro de banco 1 e 2 | 500 com a causa em `erro` |

Para o teste 7, você pode parar o serviço do MySQL ou colocar uma senha errada
no `.env` e reiniciar a API. A API continua no ar e responde
`500 { "status": false, "message": "Erro ao consultar vendedores", "erro": "ECONNREFUSED" }`.
Com senha errada, o `erro` vem como `ER_ACCESS_DENIED_ERROR`.

### Exemplo

```
curl -X POST http://localhost:3000/vendas \
  -H "Content-Type: application/json" \
  -d '{"id_venda":2001,"id_vendedor":1,"id_regiao":1,"valor_venda":2000,"tipo_cliente":"PJ"}'
```

## Funções assíncronas

| Função | Onde | Responsabilidade |
| --- | --- | --- |
| `cadastrarVendedor()` | `models/Vendedor.js` | Inserir vendedor no MySQL |
| `listarVendedores()` | `models/Vendedor.js` | Consultar vendedores |
| `atualizarVendedor()` | `models/Vendedor.js` | Atualizar meta e comissão base |
| `desativarVendedor()` | `models/Vendedor.js` | Alterar situação do vendedor |
| `registrarVenda()` | `models/Venda.js` | Validar, calcular e registrar uma venda |
| `listarVendas()` | `models/Venda.js` | Consultar vendas |
| `consultarVendasPorVendedor()` | `models/Venda.js` | Filtrar por vendedor |
| `excluirVenda()` | `models/Venda.js` | Excluir venda existente |
| `calcularComissao()` | `utils/comissao.js` | Aplicar as regras de comissão |
| `gerarRelatorioPerformance()` | `models/Relatorio.js` | Consolidar indicadores por período |

`calcularComissao()` é síncrona, porque só faz conta. As demais usam
`async/await` com `try/catch`. Todas as consultas são parametrizadas (`?`),
o que previne SQL Injection. Em caso de erro, os models registram no console
e relançam o erro (`throw`). O controller responde 400/404 para erros de
regra de negócio e 500 para falhas de banco.

## Estrutura

```
app.js                              ponto de entrada (carrega o .env)
servidor.js                         configuração do Express, rotas e tratamento de erros
routes/vendedorRoutes.js            rotas de /vendedores
routes/vendaRoutes.js               rotas de /vendas
routes/relatorioRoutes.js           rota de /relatorios
middlewares/vendedorMiddleware.js   validações de entrada de vendedores
middlewares/vendaMiddleware.js      validações de entrada de vendas
middlewares/relatorioMiddleware.js  validação do período do relatório
controllers/vendedorController.js   fluxo das requisições de vendedores
controllers/vendaController.js      fluxo das requisições de vendas
controllers/relatorioController.js  fluxo do relatório
models/Banco.js                     pool de conexões MySQL (credenciais do .env)
models/Vendedor.js                  acesso à tabela vendedores
models/Venda.js                     acesso à tabela vendas e registro com comissão
models/Regiao.js                    consulta à tabela regioes
models/Relatorio.js                 consultas SQL do relatório de performance
utils/comissao.js                   calcularComissao() e arredondamento de valores
utils/data.js                       validação e normalização de datas
utils/ErroNegocio.js                erro de regra de negócio com código HTTP
utils/responderErro.js              resposta de erro padrão dos controllers
docs/db_vendas.sql                  script de criação do banco e dados de teste
docs/insomnia_vendas.json           collection do Insomnia para testes
docs/prints/                        capturas de tela das requisições
.env.example                        modelo das variáveis de ambiente
```
