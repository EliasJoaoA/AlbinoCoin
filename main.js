const { Blockchain, Transacao } = require("./blockchain");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const myKey = ec.keyFromPrivate(
  "b63d80531e708875681ed2365826f7cd1e00f1fb83b76d927ebb2b9400867dc8"
);
const minhaCarteiraADress = myKey.getPublic("hex");

let albinaoCoin = new Blockchain();

const tx1 = new Transacao(minhaCarteiraADress, "Chave publica vai aqui", 10);
tx1.assinarTransicao(myKey);
albinaoCoin.addTransicao(tx1);

console.log("\nComeçando a minerar...");
albinaoCoin.minerarTransacoesPendentes(minhaCarteiraADress);

console.log(
  "\nSaldo do joao é ",
  albinaoCoin.getSaldoDeUmAdress(minhaCarteiraADress)
);
