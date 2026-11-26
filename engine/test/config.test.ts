import { describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config";

const fullEnv: Record<string, string | undefined> = {
  GNO_RPC_URL: "https://rpc.example:443",
  GNO_CHAIN_ID: "onyx-1",
  HIRELING_REALM: "gno.land/r/ns/hireling",
  AGENT_MNEMONIC: "word1 word2 word3",
  LLM_BASE_URL: "https://llm.example/v1",
  LLM_API_KEY: "sk-secret-key-value",
  LLM_MODEL: "some-model",
};

describe("loadConfig", () => {
  test("loads all vars", () => {
    const c = loadConfig(fullEnv);
    expect(c.rpcUrl).toBe("https://rpc.example:443");
    expect(c.chainId).toBe("onyx-1");
    expect(c.realm).toBe("gno.land/r/ns/hireling");
    expect(c.mnemonic).toBe("word1 word2 word3");
    expect(c.llmBaseUrl).toBe("https://llm.example/v1");
    expect(c.llmApiKey).toBe("sk-secret-key-value");
    expect(c.llmModel).toBe("some-model");
    expect(c.pollIntervalMs).toBe(5000);
  });

  test("returns trimmed string values", () => {
    const env = { ...fullEnv, GNO_RPC_URL: "  https://rpc.example:443\n", LLM_API_KEY: " sk-x ", AGENT_MNEMONIC: " a b c " };
    const c = loadConfig(env);
    expect(c.rpcUrl).toBe("https://rpc.example:443");
    expect(c.llmApiKey).toBe("sk-x");
    expect(c.mnemonic).toBe("a b c");
  });

  test("throws naming every missing var", () => {
    const env = { ...fullEnv, AGENT_MNEMONIC: undefined, LLM_MODEL: "" };
    expect(() => loadConfig(env)).toThrow(/AGENT_MNEMONIC.*LLM_MODEL|LLM_MODEL.*AGENT_MNEMONIC/);
  });

  test("never echoes secret values", () => {
    const words = Array.from({ length: 24 }, (_, i) => `word${i + 1}`).join(" ");
    const env = { ...fullEnv, AGENT_MNEMONIC: words, POLL_INTERVAL_MS: "abc" };
    let msg = "";
    try {
      loadConfig(env);
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).not.toBe("");
    expect(msg).not.toContain("word1");
    expect(msg).not.toContain("sk-secret-key-value");
  });

  test("rejects interval below 1000", () => {
    expect(() => loadConfig({ ...fullEnv, POLL_INTERVAL_MS: "999" })).toThrow(/POLL_INTERVAL_MS/);
  });
});
