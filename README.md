<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# ElderGuard Backend - Plataforma de Avaliação Geriátrica

Este é o core da plataforma **ElderGuard**, um sistema especializado na automação de avaliações de saúde geriátrica. O backend foi concebido para suportar a criação dinâmica de formulários clínicos e a geração automática de diagnósticos baseados em regras complexas de pontuação.

## 🚀 Tecnologias Utilizadas

- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Linguagem:** TypeScript
- **ORM:** Prisma
- **Base de Dados:** PostgreSQL / SQLite (Desenvolvimento)
- **Autenticação:** JWT (JSON Web Token) com estratégias Passport.js
- **Segurança:** RBAC (Role-Based Access Control)
- **Testes:** Jest
- **Documentação de API:** Swagger (OpenAPI)

## 🧠 Motor de Regras (Rule Engine)

O grande diferencial técnico deste sistema é o seu **Motor de Regras** customizado. Este motor permite que a plataforma interprete as respostas dos formulários e execute cálculos clínicos em tempo real, eliminando a necessidade de processamento manual.

### Funcionamento e Lógicas Suportadas:

O motor (implementado no `RuleEngineService`) processa expressões dinâmicas através de três tipos principais de lógica:

1.  **Aritmética (ARITHMETIC):**
    * Realiza o somatório ponderado das pontuações das questões.
    * Permite a definição de um valor máximo (*cap*): `MIN(SUM(pontuações), valor_maximo)`.
2.  **Condicional (CONDITIONAL):**
    * Implementa lógica ternária para decisões clínicas complexas.
    * Exemplo: `(score > 10) ? (score + 5) : score`.
3.  **Rateio Proporcional (PRORATE):**
    * Essencial para avaliações com respostas ausentes, calculando a pontuação proporcional.
    * Fórmula: `(Soma das Respostas * Total de Itens Definido) / Quantidade de Itens Respondidos`.

As regras são geridas pelo `RuleBuilderService` e aplicadas automaticamente assim que uma avaliação é finalizada, garantindo a persistência imediata do diagnóstico.

## 🏗️ Arquitetura e Padrões

A solução foi desenvolvida seguindo os princípios de **Clean Architecture** e **SOLID**, garantindo um código escalável e testável:

- **Modularização:** Estrutura dividida por domínios (Utilizadores, Idosos, Formulários, Avaliações).
- **Segurança:** Implementação de `Guards` para controlo de acesso baseado em funções (Admin, Profissional, Comum).
- **Validação:** Uso rigoroso de DTOs e `class-validator` para assegurar a integridade dos dados clínicos recebidos.

## 📋 Funcionalidades Principais

- **Gestão de Idosos:** Registo completo e histórico de avaliações.
- **Formulários Dinâmicos:** Configuração de secções e questões com pesos variados.
- **Fluxo de Avaliação:** Sistema de pausa e retoma, permitindo guardar estados parciais das respostas.
- **Geração de Diagnósticos:** Processamento automático do resultado clínico final.

## 🔧 Instalação e Execução

1.  **Instalação de Dependências:**
    ```bash
    npm install
    ```

2.  **Configuração de Ambiente:**
    Crie um ficheiro `.env` na raiz seguindo o modelo `.env.example`.

3.  **Preparação da Base de Dados:**
    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```

4.  **Iniciar a Aplicação:**
    ```bash
    # Desenvolvimento
    npm run start:dev
    
    # Produção
    npm run build
    npm run start:prod
    ```

## 🧪 Testes

A suíte de testes foca-se especialmente na fiabilidade das regras de cálculo:
```bash
# Executar testes unitários
npm run test

# Verificar cobertura de código
npm run test:cov
```
Autores
Geovanni Magnani – Backend e Planeamento

Bruna Kodama Budel – Frontend e Documentação

Projeto de Conclusão de Curso (TCC) Tecnologia em Análise e Desenvolvimento de Sistemas – UFPR
