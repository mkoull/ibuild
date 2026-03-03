import { isEnabled } from "./featureFlags.js";

function fireAndForget(url, method, body) {
  const run = () => {
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run);
  } else {
    setTimeout(run, 0);
  }
}

export function createShadowWriter(baseUrl = "/api") {
  return {
    onProjectSave(project) {
      if (!isEnabled("shadow_write_enabled")) return;
      fireAndForget(`${baseUrl}/projects/${project.id}`, "PUT", {
        name: project.name,
        stage: project.stage,
        clientId: project.clientId,
        data: project,
      });
    },

    onClientSave(client) {
      if (!isEnabled("shadow_write_enabled")) return;
      fireAndForget(`${baseUrl}/clients/${client.id}`, "PUT", {
        displayName: client.displayName,
        companyName: client.companyName,
        email: client.email || "",
        phone: client.phone || "",
        status: client.status,
        data: client,
      });
    },

    onTradeSave(trade) {
      if (!isEnabled("shadow_write_enabled")) return;
      fireAndForget(`${baseUrl}/trades/${trade.id}`, "PUT", {
        businessName: trade.businessName,
        category: trade.category,
        status: trade.status,
        data: trade,
      });
    },

    onSettingsSave(settings) {
      if (!isEnabled("shadow_write_enabled")) return;
      fireAndForget(`${baseUrl}/settings`, "PUT", settings);
    },
  };
}

export const shadowWriter = createShadowWriter();
