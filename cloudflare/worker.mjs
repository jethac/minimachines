import { Container } from "@cloudflare/containers";

export class MiniMachinesContainer extends Container {
  defaultPort = 18679;
  sleepAfter = "10m";
  envVars = {
    PUBLIC_URL: "https://mm.jethachan.net",
  };
}

export default {
  async fetch(request, env) {
    // One durable container owns the complete HFT relay, including WebSockets.
    // Container.fetch proxies HTTP upgrades as well as ordinary asset requests.
    const url = new URL(request.url);
    if (url.pathname === "/" && request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      url.pathname = "/game.html";
      request = new Request(url, request);
    }
    return env.MINI_MACHINES.getByName("production").fetch(request);
  },
};
