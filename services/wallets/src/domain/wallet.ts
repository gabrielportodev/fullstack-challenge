export class Wallet {
  id: string;
  playerId: string;
  balanceCents: bigint;

  constructor(id: string, playerId: string, balanceCents: bigint = 0n) {
    this.id = id;
    this.playerId = playerId;
    this.balanceCents = balanceCents;
  }

  credit(amountCents: bigint): void {
    if (amountCents <= 0n) {
      throw new Error("O valor deve ser positivo");
    }

    this.balanceCents += amountCents;
  }

  debit(amountCents: bigint): void {
    if (amountCents <= 0n) {
      throw new Error("O valor deve ser positivo");
    }

    if (amountCents > this.balanceCents) {
      throw new Error("Saldo insuficiente");
    }

    this.balanceCents -= amountCents;
  }
}
