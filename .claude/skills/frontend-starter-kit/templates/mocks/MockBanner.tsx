// src/mocks/MockBanner.tsx: always visible while mock mode is on, so example data is never
// mistaken for real data. Rendered by app/Providers.tsx.
import { FlaskConical } from "lucide-react";

export function MockBanner() {
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-950"
    >
      <FlaskConical className="size-4" aria-hidden />
      Sample data mode is on. The data on screen is not real.
    </div>
  );
}
