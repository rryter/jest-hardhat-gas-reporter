import chalk from "chalk";
import Table from "cli-table3";
import { gasToCost } from "./utils";
import { GasUsageByContract } from "./interfaces";

export class GasStatsOutput {
  data: { methods: any; deployments: any } = { methods: {}, deployments: {} };
  table: Table.Table;
  constructor(inputData: GasUsageByContract) {
    this.table = this.setupTable(inputData);
  }

  private setupTable(inputData: GasUsageByContract) {
    const table = new Table({
      head: [
        chalk.grey("Contract"),
        chalk.grey("Method"),
        chalk.grey("Min"),
        chalk.grey("Max"),
        chalk.grey("Avg"),
        chalk.grey("# calls"),
        chalk.grey("eur(avg)"),
      ],
      colWidths: [20, 20, 20, 20, 20, 20, 20],
    });

    const trackingEntries = Object.entries(inputData);
    const reportingData = trackingEntries.reduce<{
      methods: any[];
      deployments: any[];
    }>(
      (accumulator, [contractName, { methods, deployments }]) => {
        accumulator.methods.push(...this.getMethodCallData(methods, contractName));
        accumulator.deployments.push([...this.getDeploymentsData(deployments, contractName)]);
        return accumulator;
      },
      { methods: [], deployments: [] }
    );

    table.push(...reportingData.methods);
    const deploymentHeaders: any[] = [
      {
        colSpan: 2,
        content: chalk.gray("Deployments"),
      },
      chalk.grey(""),
      chalk.grey(""),
      chalk.grey(""),
      chalk.grey(""),
      chalk.grey(""),
    ];
    table.push(deploymentHeaders);
    table.push(...reportingData.deployments);
    return table;
  }

  private formatNumber(number: number) {
    return new Intl.NumberFormat("de-CH").format(number);
  }

  private getMethodCallData(methodCalls: { [key: string]: number[] }, contractName: string) {
    let isSameContract = false;
    return Object.entries(methodCalls).reduce((accumulator, [methodName, usedGas]) => {
      const { uniform, min, max, avg, cost } = this.getStats(usedGas);

      accumulator.push([
        isSameContract ? chalk.gray('  "  ') : contractName,
        methodName,
        {
          hAlign: "right",
          content: uniform ? chalk.gray("-") : chalk.blue(min),
        },
        {
          hAlign: "right",
          content: uniform ? chalk.gray("-") : chalk.red(max),
        },
        {
          hAlign: "right",
          content: chalk.gray(avg),
        },
        {
          hAlign: "right",
          content: usedGas.length,
        },
        {
          hAlign: "right",
          content: cost,
        },
      ]);

      isSameContract = true;

      return accumulator;
    }, [] as any[]);
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((a: number, b: number) => a + b, 0) / values.length;
  }

  private getDeploymentsData(usedGas: number[], contractName: string) {
    const { uniform, min, max, avg, cost } = this.getStats(usedGas);

    return [
      {
        colSpan: 2,
        content: contractName,
      },
      {
        hAlign: "right",
        content: uniform ? chalk.gray("-") : chalk.blue(min),
      },
      {
        hAlign: "right",
        content: uniform ? chalk.gray("-") : chalk.red(max),
      },
      {
        hAlign: "right",
        content: chalk.gray(avg),
      },
      {
        hAlign: "right",
        content: usedGas.length,
      },
      {
        hAlign: "right",
        content: cost,
      },
    ];
  }

  private getStats(usedGas: number[]) {
    const min = this.formatNumber(Math.min(...usedGas));
    const max = this.formatNumber(Math.max(...usedGas));
    const avg = this.formatNumber(Math.round(this.calculateAverage(usedGas)));
    const uniform = min === max;
    const cost = new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(gasToCost(Math.round(this.calculateAverage(usedGas))));
    return { uniform, min, max, avg, cost };
  }
}
