import { json } from '@remix-run/cloudflare';
import { LLMManager } from '~/lib/modules/llm/manager';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { ProviderInfo } from '~/types/model';

interface ModelsResponse {
  modelList: ModelInfo[];
  providers: ProviderInfo[];
  defaultProvider: ProviderInfo;
}

let cachedProviders: ProviderInfo[] | null = null;
let cachedDefaultProvider: ProviderInfo | null = null;

function getProviderInfo(llmManager: LLMManager) {
  if (!cachedProviders) {
    cachedProviders = llmManager.getAllProviders().map((provider) => ({
      name: provider.name,
      staticModels: provider.staticModels,
      getApiKeyLink: provider.getApiKeyLink,
      labelForGetApiKey: provider.labelForGetApiKey,
      icon: provider.icon,
    }));
  }

  if (!cachedDefaultProvider) {
    const defaultProvider = llmManager.getDefaultProvider();
    cachedDefaultProvider = {
      name: defaultProvider.name,
      staticModels: defaultProvider.staticModels,
      getApiKeyLink: defaultProvider.getApiKeyLink,
      labelForGetApiKey: defaultProvider.labelForGetApiKey,
      icon: defaultProvider.icon,
    };
  }

  return { providers: cachedProviders, defaultProvider: cachedDefaultProvider };
}

export async function loader({ request }: { request: Request }): Promise<Response> {
  const llmManager = LLMManager.getInstance(import.meta.env);

  // process client-side overwritten api keys
  const clientsideApiKeys = request.headers.get('x-client-api-keys');
  const apiKeys = clientsideApiKeys ? JSON.parse(clientsideApiKeys) : {};

  const { providers, defaultProvider } = getProviderInfo(llmManager);

  const modelList = await llmManager.updateModelList({
    apiKeys,
    providerSettings: {},
    serverEnv: import.meta.env,
  });

  return json<ModelsResponse>({
    modelList,
    providers,
    defaultProvider,
  });
}
