<p align="center">
  <a href="#" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="ElderGuard Logo" /></a>
</p>

# ElderGuard Backend - Plataforma de Avaliação Geriátrica

Este repositório contém o core da plataforma **ElderGuard**, um sistema robusto para a automação de avaliações de saúde do idoso. O backend foi projetado para gerenciar formulários dinâmicos e processar diagnósticos clínicos em tempo real, utilizando uma arquitetura escalável e um motor de regras customizado.

## 🛠️ Tecnologias e Ferramentas

- **Runtime:** [Node.js](https://nodejs.org/) (v18+)
- **Framework:** [NestJS](https://nestjs.com/)
- **Linguagem:** TypeScript
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** PostgreSQL (Produção) / SQLite (Desenvolvimento)
- **Segurança:** Passport.js (JWT) e RBAC (Role-Based Access Control)
- **Testes:** Jest
- **Documentação:** Swagger / OpenAPI

---

## 🧠 O Motor de Regras (Rule Engine)

O diferencial técnico deste projeto é o seu **Motor de Regras**. Diferente de sistemas estáticos, o ElderGuard permite que profissionais definam lógicas de pontuação dinâmicas para cada seção dos formulários.

O processamento é realizado pelo `RuleEngineService`, que interpreta expressões lógicas e matemáticas para gerar diagnósticos automáticos.

### Tipos de Lógica Suportados:

1.  **Aritmética (ARITHMETIC):**
    * Realiza a soma ponderada das questões.
    * Permite definir um "teto" (cap) para a pontuação: `MIN(SUM(questões), valor_maximo)`.
2.  **Condicional (CONDITIONAL):**
    * Implementa lógica ternária para decisões complexas.
    * Exemplo: `(score > 10) ? (score + 5) : score`.
3.  **Rateio Proporcional (PRORATE):**
    * Calcula o score proporcional quando há questões não respondidas, evitando diagnósticos incorretos por falta de dados.
    * Fórmula: `(Soma das Respostas * Total de Itens Definido) / Quantidade de Itens Respondidos`.

### Fluxo de Execução:
O `RuleBuilderService` compila as regras no banco de dados, e o `RuleEngineService` as executa durante a submissão da avaliação (`EvaluationAnsware`), garantindo que o resultado clínico seja persistido imediatamente após o encerramento.

---

## 🏗️ Arquitetura e Padrões de Projeto

Para garantir a manutenibilidade e escalabilidade, foram aplicados:

- **Clean Architecture:** Separação clara entre regras de negócio, casos de uso e provedores externos.
- **Princípios SOLID:** Baixo acoplamento entre módulos (User, Elderly, Form, Evaluation).
- **Segurança RBAC:** Decorators customizados (`@Roles`) e Guards para restringir o acesso a rotas sensíveis entre administradores e profissionais de saúde.
- **Data Validation:** Uso de `class-validator` e `Pipes` para garantir a integridade de todos os payloads da API.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js instalado
- Gerenciador de pacotes (npm ou yarn)

### Passo a Passo

1. **Instale as dependências:**
   ```bash
   npm install
