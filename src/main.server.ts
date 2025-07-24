import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = () => {
  if (!config.providers) config.providers = [];
  config.providers.push(provideClientHydration());
  return bootstrapApplication(App, config);
};

export default bootstrap;
