import { CustomReporter } from '../src';

describe('blah', () => {
  it('works', () => {
    const reporter = new CustomReporter({} as any);
    const stats = reporter.gasStatsCollector.getStats();
    expect(stats).toEqual(2);
  });
});
