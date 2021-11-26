import { providers } from 'ethers';
import { glob } from 'glob';
import { readFileSync } from 'fs';
import { ContractABI, GasUsageByContract } from './interfaces';
import { matchBinaries } from './utils';

// @ts-ignore
import * as decoder from 'abi-decoder';

export class GasStatsCollector {
  stats: GasUsageByContract = {};
  provider: providers.JsonRpcProvider;
  contracts: ContractABI[];
  currentBlock = 0;

  constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
    this.contracts = glob
      .sync('artifacts/contracts/**/*.json', {
        ignore: '**/*.dbg.json',
      })
      .map(contract => {
        return JSON.parse(readFileSync(contract, 'utf8'));
      });
  }

  async getStats() {
    await this.collectGasData();
    return this.stats;
  }

  private async collectGasData() {
    const endBlockNum = await this.provider.getBlockNumber();

    const blocksWithTransactions = [];
    for (let i = this.currentBlock; i <= endBlockNum; i++) {
      const block = await this.provider.getBlockWithTransactions(i);
      blocksWithTransactions.push(block);
    }

    this.currentBlock = endBlockNum;

    const transactionReceipts = await Promise.all(
      blocksWithTransactions
        // @ts-ignore
        .flatMap(currentBlock => currentBlock.transactions)
        .map(async transactionOne => {
          return {
            transaction: transactionOne,
            transactionReceipt: await this.provider.getTransactionReceipt(
              transactionOne.hash
            ),
          };
        })
    );

    for (const {
      transaction,
      transactionReceipt,
    } of transactionReceipts as any) {
      if (!transactionReceipt.contractAddress) {
        await this.getMethodGasStats(transaction, transactionReceipt);
      } else {
        this.getDeploymentStats(transaction, transactionReceipt);
      }
    }
  }

  private getDeploymentStats(
    transaction: providers.TransactionResponse,
    transactionReceipt: providers.TransactionReceipt
  ) {
    const match = this.contracts
      .filter(contract => matchBinaries(transaction.data, contract.bytecode))
      .find((item: any) => item.bytecode !== '0x');

    if (match) {
      this.addDeploymentStats(match, transactionReceipt);
    }
  }

  private addDeploymentStats(
    match: ContractABI,
    transactionReceipt: providers.TransactionReceipt
  ) {
    if (!this.stats[match.contractName]) {
      this.stats[match.contractName] = {
        deployments: [],
        methods: {},
      };
    }

    this.stats[match.contractName].deployments.push(
      transactionReceipt.cumulativeGasUsed.toNumber()
    );
  }

  private async getMethodGasStats(
    transaction: providers.TransactionResponse,
    transactionReceipt: providers.TransactionReceipt
  ) {
    const code = await this.provider.getCode(transaction.to as string);
    const match = this.contracts
      .filter((item: any) => matchBinaries(code, item.deployedBytecode))
      .find((item: any) => item.deployedBytecode !== '0x');

    if (match) {
      this.addMethodCallStats(match, transaction, transactionReceipt);
    }
  }

  private addMethodCallStats(
    match: ContractABI,
    transaction: providers.TransactionResponse,
    transactionReceipt: providers.TransactionReceipt
  ) {
    decoder.addABI(match.abi);
    const method = decoder.decodeMethod(transaction.data);
    if (!this.stats[match.contractName]) {
      this.stats[match.contractName] = {
        methods: {},
        deployments: [],
      };
    }
    if (!this.stats[match.contractName].methods) {
      this.stats[match.contractName].methods = {};
    }
    if (!this.stats[match.contractName].methods[method.name]) {
      this.stats[match.contractName].methods[method.name] = [];
    }
    this.stats[match.contractName].methods[method.name].push(
      transactionReceipt.cumulativeGasUsed.toNumber()
    );
  }
}
