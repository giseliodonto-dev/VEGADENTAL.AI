import { useEffect, useState } from "react";

// TODO: evoluir para coluna `clinics.plan` ('basic' | 'pro') via migration.
// Por ora, usa localStorage para permitir teste manual: localStorage.setItem("vega_plan", "pro").
export type Plan = "basic" | "pro";

export function useAiAccess() {
  const [plan, setPlan] = useState<Plan>("basic");

  useEffect(() => {
    try {
      const v = localStorage.getItem("vega_plan");
      if (v === "pro") setPlan("pro");
    } catch {}
  }, []);

  return { plan, hasAiAccess: plan === "pro" };
}
