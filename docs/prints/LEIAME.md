# Capturas de tela

Coloque aqui os prints das requisições e respostas no Insomnia/Postman.
Sugestão de nomes, seguindo os testes obrigatórios:

| Arquivo | Requisição |
| --- | --- |
| `01-cadastrar-vendedor.png` | POST /vendedores (201) |
| `02-registrar-venda-comissao.png` | POST /vendas, exemplo do enunciado (201, comissão 180) |
| `03-venda-codigo-duplicado.png` | POST /vendas com id_venda repetido (400) |
| `04-venda-vendedor-inexistente.png` | POST /vendas com vendedor 99 (404) |
| `05-venda-vendedor-inativo.png` | POST /vendas com vendedor 6 (400) |
| `06-atualizar-meta.png` | PUT /vendedores/2 (200) |
| `07-vendas-por-regiao.png` | GET /vendas/regiao/1 (200) |
| `08-vendas-por-vendedor.png` | GET /vendas/vendedor/1 (200) |
| `09-relatorio-outubro.png` | GET /relatorios/performance?inicio=2026-10-01&fim=2026-10-31 (200) |
| `10-erro-banco.png` | GET /vendedores com o MySQL parado (500) |
