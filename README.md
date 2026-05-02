# Crash Game — Desafio Full-stack 🎮

Implementação de um jogo de Crash multiplayer em tempo real, desenvolvido como desafio técnico fullstack. O projeto segue uma arquitetura de microserviços com comunicação assíncrona via RabbitMQ e princípios de Domain-Driven Design (DDD).

---

## Como Rodar

Requisitos: **Docker** e **Bun** instalados.

```bash
bun install         # instala dependências do monorepo
bun run docker:up   # sobe toda a stack
```

Acesse em **[http://localhost:3000](http://localhost:3000)**.

### Usuário de teste

| Campo | Valor       |
| ----- | ----------- |
| Login | `player`    |
| Senha | `player123` |
| Saldo | R$ 10.000   |

### Portas

| Serviço        | Porta direta | Via Kong                          |
| -------------- | ------------ | --------------------------------- |
| Frontend       | `3000`       | —                                 |
| Game Service   | `4001`       | `http://localhost:8000/games/*`   |
| Wallet Service | `4002`       | `http://localhost:8000/wallets/*` |
| Keycloak       | `8080`       | —                                 |
| RabbitMQ UI    | `15672`      | —                                 |

### Documentação da API (Swagger)

- Game Service: [http://localhost:4001/docs](http://localhost:4001/docs)
- Wallet Service: [http://localhost:4002/docs](http://localhost:4002/docs)

---

### Game Service — domínio

- **Round** (agregado raiz): gerencia o ciclo de vida completo `BETTING → ACTIVE → CRASHED`. Impõe invariantes como impedir aposta durante rodada ativa e impedir cashout sem aposta.
- **Bet** (entidade): status `PENDING → CASHED_OUT | LOST`. Payout = `amountCents × multiplier`. Limites de R$ 1,00 a R$ 1.000,00 aplicados no construtor.
- **CrashPoint** (value object): gerado via HMAC-SHA256 com house edge de 4%. Determinístico e verificável.

### Wallet Service — domínio

- **Wallet** (entidade): saldo em centavos inteiros (`BigInt`). Nunca usa ponto flutuante. Operações de crédito e débito com proteção de saldo negativo.

---

## Decisões de Arquitetura

### RabbitMQ para comunicação entre serviços

Os serviços nunca se chamam via REST. Toda comunicação é assíncrona:

- `games` publica `wallet.debit` ao receber uma aposta
- `wallets` processa o débito e, em caso de falha, publica `wallet.debit.failed`
- `games` consome a falha e cancela a aposta via WebSocket (`bet:cancelled`)
- `games` publica `wallet.credit` ao registrar um cashout
- `wallets` processa o crédito e atualiza o saldo

Essa estratégia de compensação garante que nenhum débito fique órfão e que o jogador seja notificado em tempo real sobre o cancelamento.

### Provably Fair

O crash point de cada rodada é pré-determinado e verificável:

1. **Server Seed**: 32 bytes aleatórios gerados no início da rodada
2. **Seed Hash** (SHA256): publicado via WebSocket antes das apostas — prova que o resultado já existia
3. **Crash Point**: derivado do seed via HMAC-SHA256 com house edge de 4%
4. **Verificação**: após o crash, o seed é revelado e qualquer jogador pode recalcular o resultado no endpoint `GET /games/rounds/:id/verify`

### WebSocket: server-push only

O WebSocket é usado exclusivamente para push do servidor ao cliente. Ações do jogador (apostar, cashout) passam sempre pelo REST — isso simplifica autenticação, validação e rate limiting via Kong.

Eventos emitidos pelo servidor:

| Evento                | Payload                                               | Quando                             |
| --------------------- | ----------------------------------------------------- | ---------------------------------- |
| `round:betting_start` | `{ roundId, seedHash, bettingEndsAt }`                | Início da fase de apostas          |
| `round:started`       | `{ roundId }`                                         | Rodada ativa                       |
| `multiplier:tick`     | `{ multiplier, elapsed }`                             | A cada ~100ms durante rodada ativa |
| `round:crashed`       | `{ roundId, crashPoint, serverSeed }`                 | Crash com seed revelado            |
| `bet:placed`          | `{ roundId, betId, playerId, username, amountCents }` | Nova aposta                        |
| `bet:cashout`         | `{ betId, multiplier, payoutCents }`                  | Cashout registrado                 |
| `bet:cancelled`       | `{ betId, reason }`                                   | Compensação por débito falho       |

### Precisão monetária

Todo valor monetário é armazenado em **centavos inteiros** (`BigInt` no TypeScript, `BIGINT` no PostgreSQL). Nenhuma operação usa ponto flutuante para dinheiro. O multiplicador do crash point (não monetário) usa `Float`.

### Cashout: multiplicador do servidor

O endpoint `POST /games/bet/cashout` usa o multiplicador atual calculado pelo `GameLoopService` no servidor — o cliente não envia o valor. Isso previne qualquer manipulação do multiplicador pelo cliente.

---

## Trade-offs

| Decisão                             | Vantagem                                                                                                                             | Custo                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Monorepo com Bun**                | Velocidade de build/install, compartilhamento de tipos via `packages/`                                                               | Algumas libs com compatibilidade parcial no runtime Bun                                                          |
| **DDD com camadas explícitas**      | Domínio testável em isolamento, regras de negócio sem dependências de framework                                                      | Verbosidade, mappers entre camadas                                                                               |
| **Compensação via RabbitMQ**        | Consistência eventual sem acoplamento síncrono                                                                                       | Janela de inconsistência entre aposta criada e débito confirmado                                                 |
| **Crash point pré-determinado**     | Confiança do jogador (provably fair), imutável após apostas                                                                          | Casa não pode ajustar vantagem dinamicamente                                                                     |
| **REST para ações + WS para push**  | Auth/validação/rate limiting centralizados no Kong                                                                                   | Latência de uma chamada HTTP para apostar/cashout                                                                |
| **Next.js como framework frontend** | Familiaridade com a stack — utilizo em projetos pessoais e institucionais, o que acelerou o desenvolvimento sem sacrificar qualidade | Over-engineered para este caso: SSR, App Router e RSC são completamente desnecessários num jogo 100% client-side |

---

## Testes

```bash
# Unitários (sem Docker)
cd services/games && bun test tests/unit
cd services/wallets && bun test tests/unit

# E2E (requer bun run docker:up)
cd services/games && bun test tests/e2e
cd services/wallets && bun test tests/e2e
```

---

## Bônus implementados

- **Efeitos sonoros** — Web Audio API com síntese de áudio para bet, cashout, crash e início de rodada
- **Rate limiting** — 100 req/min por IP via Kong
- **Fórmula da curva na UI** — `m(t) = e^(0.1·t)` exibida no gráfico para transparência
