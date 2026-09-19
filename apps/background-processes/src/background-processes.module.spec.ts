import { BackgroundProcessesModule } from './background-processes.module';

describe('BackgroundProcessesModule', () => {
  it('registers middleware for every worker route', () => {
    const apply = jest.fn().mockReturnValue({ forRoutes: jest.fn() });
    const consumer = { apply };

    new BackgroundProcessesModule().configure(consumer as never);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply.mock.results[0].value.forRoutes).toHaveBeenCalledWith('');
  });

  it('declares the worker integrations in module metadata', () => {
    const imports = Reflect.getMetadata('imports', BackgroundProcessesModule);
    const providers = Reflect.getMetadata(
      'providers',
      BackgroundProcessesModule,
    );

    expect(imports).toEqual(expect.arrayContaining([expect.anything()]));
    expect(providers).toBeUndefined();
  });
});
