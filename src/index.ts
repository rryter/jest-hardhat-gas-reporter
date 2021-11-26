import { Reporter, Context, Config } from '@jest/reporters';
import { AggregatedResult } from '@jest/test-result';
import { GasStatsOutput } from './gas-stats-output';
import { GasStatsCollector } from './gas-stats-collector';

export class CustomReporter implements Reporter {
  // @ts-ignore
  gasStatsCollector: GasStatsCollector;
  globalConfig: Config.GlobalConfig;

  constructor(globalConfig: Config.GlobalConfig) {
    this.globalConfig = globalConfig;
  }

  async onRunStart() {}
  async onTestStart() {}
  async onTestCaseResult(a: any) {
    const provider = a.context.config.globals.ethers.provider;
    this.gasStatsCollector = new GasStatsCollector(provider);
    this.gasStatsCollector.getStats();
  }

  getLastError(): Error {
    return new Error('');
  }

  async onTestResult() {}
  async onRunComplete(_context: Set<Context>, _results: AggregatedResult) {
    const stats = await this.gasStatsCollector.getStats();
    const table = new GasStatsOutput(stats).table;
    console.log(table.toString());
    return;
  }
}

export default CustomReporter;
