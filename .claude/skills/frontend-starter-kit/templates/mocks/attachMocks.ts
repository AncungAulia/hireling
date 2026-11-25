// src/mocks/attachMocks.ts: mock mode (references/mocking.md).
// Only lib/apiClient.ts calls this, and only while NEXT_PUBLIC_API_MOCKING=enabled in dev.
import type { AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";
import { registerProductMocks } from "./handlers/productMocks";

/** One entry per module with endpoints the backend does not serve yet. */
const registrations: Array<(mock: MockAdapter) => void> = [registerProductMocks];

export function attachMocks(client: AxiosInstance) {
  // Requests without a mock go to the real backend, so mocked and real endpoints can be mixed.
  // The delay keeps loading states visible, as they would be against a real server.
  const mock = new MockAdapter(client, { delayResponse: 400, onNoMatch: "passthrough" });
  for (const register of registrations) register(mock);
}
