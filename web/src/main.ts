import { ApplicationInsights } from "@microsoft/applicationinsights-web";

declare var process: {
    env: {
        NODE_ENV: string;
    };
};

export function init(functionsHostname: string, functionsCode: string, instrumentationKey: string): void {
    const appInsights = new ApplicationInsights({
        config: {
            disableFetchTracking: false,
            enableCorsCorrelation: true,
            instrumentationKey,
        },
    });
    appInsights.loadAppInsights();

    const serviceUrl = process.env.NODE_ENV === "development" ? "/" : `https://${functionsHostname}/`;

    function createButton(arg: "on" | "off", title: string): HTMLButtonElement {
        const button = document.createElement("button");
        button.style.height = "100px";
        button.style.width = "200px";
        button.style.fontSize = "60px";
        button.textContent = title;
        button.addEventListener("click", async () => {
            const status = document.getElementById("status");
            if (!status) {
                throw "Could not find status";
            }
            status.textContent = `Schalte Maschine ${title.toLocaleLowerCase()}`;
            try {
                const res = await fetch(`${serviceUrl}api/switch?${arg}=1&code=${functionsCode}`, {method: "POST"});
                status.textContent = res.ok ?
                    `Maschine ${title.toLocaleLowerCase()}` :
                    `Fehler vom Service: ${await res.text()}`;
            } catch (err) {
                status.textContent = `Netzwerkfehler: ${err.message}`;
            }
        });
        return button;
    }

    async function warmUp(): Promise<void> {
        const status = document.getElementById("status");
        if (!status) {
            throw "Could not find status";
        }
        status.textContent = "Aufwärmen...";
        try {
            await fetch(`${serviceUrl}api/switch`);
            status.textContent = "Aufgewärmt";
        } catch {
            status.textContent = "Fehler beim Aufwärmen";
        }
    }

    function component(): HTMLDivElement {
        const div = document.createElement("div");
        div.appendChild(createButton("on", "An"));
        div.appendChild(document.createElement("br"));
        div.appendChild(createButton("off", "Aus"));
        div.appendChild(document.createElement("br"));
        const span = document.createElement("span");
        span.id = "status";
        div.appendChild(span);

        return div;
    }

    appInsights.trackPageView({name: "index"});

    document.body.appendChild(component());
    warmUp();
}
