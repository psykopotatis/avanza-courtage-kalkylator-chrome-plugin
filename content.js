(function () {
    // --- Konfig: courtageklasser som i din lista ---
    const CLASSES = [
        { name: "Mini", pct: 0.25, min: 1 },
        { name: "Small", pct: 0.15, min: 39 },
        { name: "Medium", pct: 0.069, min: 69 },
        { name: "Fast Pris", pct: 0.0, min: 99 }
    ];

    // --- Hjälpare ---
    const nf = new Intl.NumberFormat("sv-SE");
    const toNumber = (val) => {
        if (typeof val !== "string") return val;
        return parseFloat(val.replace(/\s+/g, "").replace(/\./g, "").replace(",", "."));
    };

    function computeRows(amount) {
        return CLASSES.map(c => {
            const variable = (c.pct / 100) * amount;
            const fee = Math.max(variable, c.min);
            return {
                ...c,
                variable,
                fee
            };
        });
    }

    function makePanel() {
        if (document.getElementById("ctg-panel")) return;

        const panel = document.createElement("div");
        panel.id = "ctg-panel";
        panel.innerHTML = `
      <header>
        <h3>Courtagekalkylator</h3>
        <button id="ctg-close" title="Stäng">✕</button>
      </header>
      <div id="ctg-body">
        <div id="ctg-inputs">
          <input id="ctg-amt" type="text" inputmode="decimal" placeholder="Affärsbelopp (kr)" />
        </div>
        <table id="ctg-table">
          <thead>
            <tr>
              <th>Klass</th><th>Rörligt</th><th>Min</th><th>Kostnad</th>
            </tr>
          </thead>
          <tbody id="ctg-tbody"></tbody>
        </table>
      </div>
    `;
        document.body.appendChild(panel);

        document.getElementById("ctg-close").addEventListener("click", () => panel.remove());

        const amtEl = document.getElementById("ctg-amt");
        const tbody = document.getElementById("ctg-tbody");

        function render(amount) {
            if (!amount || !isFinite(amount) || amount <= 0) {
                tbody.innerHTML = "";
                return;
            }
            const rows = computeRows(amount);
            const minFee = Math.min(...rows.map(r => r.fee));
            tbody.innerHTML = rows.map(r => `
        <tr class="${r.fee === minFee ? 'best-price' : ''}">
          <td>${r.name}</td>
          <td>${r.pct.toString().replace('.', ',')}%</td>
          <td>${nf.format(r.min)}</td>
          <td><b>${nf.format(r.fee)}</b></td>
        </tr>
      `).join("");
        }

        // Lyssna på inmatning i vår egen ruta
        amtEl.addEventListener("input", () => render(toNumber(amtEl.value)));

        // Försök hitta ett belopps-/summafält på sidan och synka (icke-kritiskt).
        // Lägg gärna till fler selektorer vid behov.
        const candidateSelectors = [
            "input[name='amount']",
            "input[id*='amount']",
            "input[name*='belopp']",
            "input[id*='belopp']",
            "input[data-testid*='amount']",
            "input[aria-label*='Belopp']",
            "input[aria-label*='belopp']"
        ];

        function attachToPageField() {
            const el = candidateSelectors
                .map(sel => document.querySelector(sel))
                .find(Boolean);
            if (!el) return; // Hittade inget – använd endast den egna rutan

            const sync = () => {
                const v = toNumber(el.value || el.getAttribute("value") || "");
                if (isFinite(v) && v > 0) {
                    amtEl.value = nf.format(v);
                    render(v);
                }
            };
            el.addEventListener("input", sync);
            el.addEventListener("change", sync);
            // Initial sync om värde redan finns
            sync();
        }

        // Vänta lite så DOM hinner bli klar i Single Page Apps
        setTimeout(attachToPageField, 1500);
    }

    // Init
    makePanel();
})();
