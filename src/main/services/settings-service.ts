import type { GlobalLlmSettings } from "../../shared/contracts";
import { openProjectDatabase } from "../database/schema";
import { AppSettingsRepository } from "../database/repositories/app-settings-repository";

const SETTINGS_KEY = "llm";

const DEFAULT_SETTINGS: GlobalLlmSettings = {
  provider: "",
  baseUrl: "",
  apiKey: "",
  model: "",
};

export function createSettingsService(dbPath: string) {
  const database = openProjectDatabase(dbPath);
  const repository = new AppSettingsRepository(database);

  return {
    getGlobalLlmSettings(): GlobalLlmSettings {
      const serialized = repository.get(SETTINGS_KEY);

      if (!serialized) {
        return { ...DEFAULT_SETTINGS };
      }

      return {
        ...DEFAULT_SETTINGS,
        ...(JSON.parse(serialized) as Partial<GlobalLlmSettings>),
      };
    },

    saveGlobalLlmSettings(input: GlobalLlmSettings): GlobalLlmSettings {
      repository.set(SETTINGS_KEY, JSON.stringify(input));
      return input;
    },
  };
}
