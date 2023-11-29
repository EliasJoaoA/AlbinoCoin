//Importando bibliotecas que serão utilizadas

const SHA256 = require("crypto-js/sha256");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

//Classe de transição
class Transacao {
  //Construtor com os atributos da classe
  constructor(fromAdress, toAdress, amount) {
    this.fromAdress = fromAdress;
    this.toAdress = toAdress;
    this.amount = amount;
  }
  //Calculando hash usando a função cripritográfica do próprio BitCoin
  calcularHash() {
    return SHA256(this.fromAdress + this.toAdress + this.amount).toString();
  }
  //Método para assinar uma chave usando a biblioteca "elliptic"
  assinarTransicao(chaveAssinatura) {
    //Verifica se a chave corresponde ao remetente
    if (chaveAssinatura.getPublic("hex") !== this.fromAdress) {
      throw new Error(
        "Voce nao pode assinar transações de outras carteiras, seu espertinho!"
      );
    }
    //Aqui é calculado o hash da transição e gera a assinatura
    const hashTx = this.calcularHash();
    const assinatura = chaveAssinatura.sign(hashTx, "base64");
    this.assinatura = assinatura.toDER("hex");
  }
  //Método para verificar se a transição é válida
  isValid() {
    //Aqui declaramos que, mesmo sem endereço remetente, uma transação pode ser válida, já que implementamos o método de recompensa por mineração
    if (this.fromAdress === null) return true;
    //Verifica se a transição possue assinatura
    if (!this.assinatura || this.assinatura.length === 0) {
      throw new Error("Sem assinatura nessa transação");
    }
    //Verificamos se a assinatura é válida usando chave pública
    const publicKey = ec.keyFromPublic(this.fromAdress, "hex");
    return publicKey.verify(this.calcularHash(), this.assinatura);
  }
}
//Definimos a classe Block
class Block {
  constructor(timestamp, transacoes, HashAnterior = "") {
    this.timestamp = timestamp;
    this.transacoes = transacoes;
    this.HashAnterior = HashAnterior;
    this.hash = this.calcularHash();
    this.nonce = 0;
  }
  //Cálculo do hash
  calcularHash() {
    return SHA256(
      this.timestamp +
        this.HashAnterior +
        JSON.stringify(this.transacoes) +
        this.nonce
    ).toString();
  }
  //Aqui declaramos um método para realizar a mineração, quanto maior a dificuldade de minerar o bloco, mais zeros teremos no começo do hash
  minerandoBloco(dificuldade) {
    while (
      this.hash.substring(0, dificuldade) !== Array(dificuldade + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calcularHash();
    }
    console.log(
      "Bloco após mineração - Hash: " + this.hash + " Nonce: " + this.nonce
    );
  }
  //Método para verificar se temos transações válidas no bloco
  haTransacoesValidas() {
    for (const tx of this.transacoes) {
      if (!tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createBlocoGenesis()];
    this.dificuldade = 2;
    this.transacoesPendentes = [];
    this.recompensaMineracao = 100;
  }
  //Método para criar o primeiro bloco da nossa BlockChain, o bloco Genesis
  createBlocoGenesis() {
    return new Block("21/11/2023", "Genesis block", "0");
  }

  getUltimoBloco() {
    return this.chain[this.chain.length - 1];
  }
  //Método parar minerarmos transações pendentes, fornecendo uma recompensa por minerar
  minerarTransacoesPendentes(recompensaMineracaoAdress) {
    let bloco = new Block(Date.now(), this.transacoesPendentes);
    bloco.minerandoBloco(this.dificuldade);

    console.log("Bloco minerado com sucesso");
    this.chain.push(bloco);

    this.transacoesPendentes = [
      new Transacao(null, recompensaMineracaoAdress, this.recompensaMineracao),
    ];
  }
  //Add transação para as transações pendentes
  addTransicao(transacao) {
    //verifica se possue remetente ou ou destino
    if (!transacao.fromAdress || !transacao.toAdress) {
      throw new Error("Deve ter um endereço mandante e um remetente");
    }
    //verifica se é válida antes de adciona-lá na blockchain
    if (!transacao.isValid()) {
      throw new Error("Nao podemos adicionar uma transição invalida na chain");
    }
    this.transacoesPendentes.push(transacao);
  }
  //Obter saldo de um determinado endereço
  getSaldoDeUmAdress(adress) {
    let conta = 0;

    for (const bloco of this.chain) {
      for (const trans of bloco.transacoes) {
        if (trans.fromAdress === adress) {
          conta -= trans.amount;
        }
        if (trans.toAdress === adress) {
          conta += trans.amount;
        }
      }
    }
    conta += this.recompensaMineracao;
    return conta;
  }
  //Valida a nossa blockchain
  validandoBlock() {
    for (let i = 1; i < this.chain.length; i++) {
      const blocoAtual = this.chain[i];
      const blocoAnterior = this.chain[i - 1];

      if (!blocoAtual.haTransacoesValidas()) {
        return false;
      }

      if (blocoAtual.hash !== blocoAtual.calcularHash()) {
        return false;
      }

      if (blocoAtual.HashAnterior !== blocoAnterior.hash) {
        return false;
      }
    }
    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.Transacao = Transacao;
