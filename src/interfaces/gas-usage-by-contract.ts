export interface GasUsageByContract {
  [key: string]: { methods: { [key: string]: number[] }; deployments: number[] };
}
