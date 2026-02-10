'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "bitcoin",
  "title": "Bitcoin - A Peer-to-Peer Electronic Cash System",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Distributed Systems • Permissionless Consensus",
  "accent": "amber",
  "heroIcon": "Binary",
  "paper": {
    "filename": "Bitcoin - A Peer-to-Peer Electronic Cash System.pdf"
  },
  "abstract": ". A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another without going through a financial institution. Digital signatures provide part of the solution, but the main benefits are lost if a trusted third party is still required to prevent double-spending. We propose a solution to the double-spending problem using a peer-to-peer network. The network timestamps transactions by hashing them into an ongoing chain of hash-based proof-of-work, forming a record that cannot be changed without redoing the proof-of-work. The longest chain not only serves as proof of the sequence of events witnessed, but proof that it came from the largest pool of CPU power. As long as a majority of CPU power is controlled by nodes that are not cooperating to attack the network, they'll generate the longest chain and outpace attackers. The network itself requires minimal structure. Messages are broadcast on a best effort basis, and nodes can leave and rejoin the network at will, accepting the longest proof-of-work chain as proof of what happened while they were gone. 1. Introduction Commerce on the Internet has come to rely almost exclusively on financial institutions serving as trusted third parties to process electronic payments. While the system works well enough for most transactions, it still suffers from the inherent weaknesses of the trust based model. Completely non-reversible transactions are not really possible, since financial institutions cannot avoid mediating disputes. The cost of mediation increases transaction costs, limiting the minimum practical transaction size and cutting off the possibility for small casual transactions, and there is a broader cost in the loss of ability to make non-reversible payments for non- reversible services. With the possibility of reversal, the need for trust spreads. Merchants must be wary of their customers, hassling them for more information than they would otherwise need. A certain percentage of fraud is accepted as unavoidable. These costs and payment uncertainties can be avoided in person by using physical currency, but no mechanism exists to make payments over a communications channel without a trusted party. What is needed is an electronic payment system based on cryptographic proof instead of trust, allowing any two willing parties to transact directly with each other without the need for a trusted third party. Transactions that are computationally impractical to reverse would protect sellers from fraud, and routine escrow mechanisms could easily be implemented to protect buyers. In this paper, we propose a solution to the double-spending problem using a peer-to-peer distributed timestamp server to generate computational proof of the chronological order of transactions. The system is secure as long as honest nodes collectively control more CPU power than any cooperating group of attacker nodes. 1 2. Transactions We define an electronic coin as a chain of digital signatures. Each owner transfers the coin to the next by digitally signing a hash of the previous transaction and the public key of the next owner and adding these to the end of the coin. A payee can verify the signatures to verify the chain of ownership. The problem of course is the payee can't verify that one of the owners did not double-spend the coin. A common solution is to introduce a trusted central authority, or mint, that checks every transaction for double spending. After each transaction, the coin must be returned to the mint to issue a new coin, and only coins issued directly from the mint are trusted not to be double-spent. The problem with this solution is that the fate of the entire money system depends on the company running the mint, with every transaction having to go through them, just like a bank. We need a way for the payee to know that the previous owners did not sign any earlier transactions. For our purposes, the earliest transaction is the one that counts, so we don't care about later attempts to double-spend. The only way to confirm the absence of a transaction is to be aware of all transactions. In the mint based model, the mint was aware of all transactions and decided which arrived first. To accomplish this without a trusted party, transactions must be publicly announced [1], and we need a system for participants to agree on a single history of the order in which they were received. The payee needs proof that at the time of each transaction, the majority of nodes agreed it was the first received. 3. Timestamp Server The solution we propose begins with a timestamp server. A timestamp server works by taking a hash of a block of items to be timestamped and widely publishing the hash, such as in a newspaper or Usenet post [2-5]. The timestamp proves that the data must have existed at the time, obviously, in order to get into the hash. Each timestamp includes the previous timestamp in its hash, forming a chain, with each additional timestamp reinforcing the ones before it. 2 Block Item Item ... Hash Block Item Item ... Hash Transaction Owner 1's Public Key Owner 0's Signature Hash Transaction Owner 2's Public Key Owner 1's Signature Hash Verify Transaction Owner 3's Public Key Owner 2's Signature Hash Verify Owner 2's Private Key Owner 1's Private Key Sign Sign Owner 3's Private Key",
  "diagram": {
    "nodes": [
      {
        "id": "wallet",
        "label": "Wallet",
        "icon": "Lock",
        "hint": "Creates transactions"
      },
      {
        "id": "p2p",
        "label": "P2P Network",
        "icon": "Globe",
        "hint": "Gossip propagation"
      },
      {
        "id": "nodes",
        "label": "Full Nodes",
        "icon": "Server",
        "hint": "Validate & relay"
      },
      {
        "id": "miners",
        "label": "Miners",
        "icon": "Cpu",
        "hint": "Build blocks + PoW"
      },
      {
        "id": "chain",
        "label": "Blockchain",
        "icon": "Database",
        "hint": "Longest valid chain"
      }
    ],
    "flow": [
      "wallet",
      "p2p",
      "nodes",
      "miners",
      "chain"
    ]
  },
  "steps": [
    {
      "title": "Create transaction",
      "description": "Wallet selects UTXOs and signs a new transaction.",
      "active": [
        "wallet"
      ],
      "log": "New signed transaction created.",
      "message": {
        "from": "Wallet",
        "to": "P2P Network",
        "label": "Sign TX"
      }
    },
    {
      "title": "Broadcast via gossip",
      "description": "Transaction is broadcast to peers and spreads through the network.",
      "active": [
        "wallet",
        "p2p",
        "nodes"
      ],
      "log": "TX enters mempools across the network.",
      "message": {
        "from": "Wallet",
        "to": "P2P Network",
        "label": "Gossip TX"
      }
    },
    {
      "title": "Validate & store",
      "description": "Nodes verify signatures, scripts, and double-spend rules.",
      "active": [
        "nodes"
      ],
      "log": "Valid TX kept in mempool; invalid dropped.",
      "message": {
        "from": "Full Nodes",
        "to": "Miners",
        "label": "Validate"
      }
    },
    {
      "title": "Mine candidate block",
      "description": "Miners assemble a block from mempool and start proof-of-work.",
      "active": [
        "miners"
      ],
      "log": "Miner searches for a valid nonce.",
      "message": {
        "from": "Miners",
        "to": "Blockchain",
        "label": "PoW"
      }
    },
    {
      "title": "Propagate block",
      "description": "Found block is broadcast; peers validate and extend the chain.",
      "active": [
        "miners",
        "nodes",
        "chain"
      ],
      "log": "Block accepted into longest valid chain.",
      "message": {
        "from": "Miners",
        "to": "Full Nodes",
        "label": "Block propagation"
      }
    },
    {
      "title": "Confirmations accrue",
      "description": "More blocks on top reduce reorg probability; settlement strengthens.",
      "active": [
        "chain",
        "nodes"
      ],
      "log": "TX gains confirmations with each added block.",
      "message": {
        "from": "Blockchain",
        "to": "Full Nodes",
        "label": "Confirmations"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Core idea",
        "icon": "Info",
        "bullets": [
          "A public ledger maintained by a network of nodes without central authority.",
          "Consensus via **proof-of-work** and the rule: follow the longest valid chain.",
          "Transactions spend **UTXOs** and are authorized via digital signatures."
        ]
      },
      {
        "title": "What makes it work",
        "icon": "ShieldCheck",
        "bullets": [
          "Economic cost (PoW) makes rewriting history expensive.",
          "Validation is deterministic and independently performed by every full node.",
          "Gossip-based propagation enables open membership."
        ]
      },
      {
        "title": "Trade-offs",
        "icon": "AlertTriangle",
        "bullets": [
          "Throughput/latency are limited by block size and block interval.",
          "Energy use is a direct consequence of proof-of-work security.",
          "Temporary forks and reorgs are expected; confirmations mitigate risk."
        ]
      }
    ],
    "glossary": [
      {
        "term": "UTXO",
        "def": "Unspent transaction output: the spendable unit of value in Bitcoin."
      },
      {
        "term": "Mempool",
        "def": "Node-local pool of validated but unconfirmed transactions."
      },
      {
        "term": "Proof-of-Work",
        "def": "Hash puzzle requiring computation to propose a block."
      },
      {
        "term": "Confirmation",
        "def": "A block depth measure: additional blocks built on top."
      },
      {
        "term": "Reorg",
        "def": "Chain reorganization when a different branch becomes longest."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function BitcoinSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}
