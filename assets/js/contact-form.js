// Kontaktní formulář pro statický web (bez serveru).
//
// Nastavení: do atributu data-endpoint na <form> (viz kontakt/index.html) vložte adresu
// služby pro příjem formulářů (např. Formspree: https://formspree.io/f/xxxxxxxx).
// Dokud je atribut prázdný, formulář otevře předvyplněný e-mail v poštovním programu
// návštěvníka na adresu z data-mailto.
(() => {
  const form = document.querySelector('form[data-static-form]');
  if (!form) return;

  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.style.marginTop = '1em';
  status.hidden = true;
  const say = (text) => { status.textContent = text; status.hidden = false; };
  form.appendChild(status);

  const fields = () => [...form.querySelectorAll('.wnd-form-field')].map((f) => {
    const input = f.querySelector('input, textarea, select');
    const label = f.querySelector('label .it-c');
    return { name: input.name, label: label ? label.textContent.trim() : input.name, value: input.value.trim() };
  });

  form.addEventListener('submit', async (e) => {
    // capture phase: Webnode skripty už na tomto formuláři nemají co dělat
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!form.reportValidity()) return;

    const data = fields();
    const endpoint = form.dataset.endpoint;

    if (!endpoint) {
      const body = data.map((f) => `${f.label}: ${f.value}`).join('\n');
      location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent('Zpráva z webu')}&body=${encodeURIComponent(body)}`;
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    say('Odesílám…');
    try {
      const payload = Object.fromEntries(data.map((f) => [f.label, f.value]));
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.status);
      form.querySelectorAll('input').forEach((i) => { i.value = i.type === 'email' ? '@' : ''; });
      say('Děkujeme, zpráva byla odeslána.');
    } catch {
      say(`Zprávu se nepodařilo odeslat. Napište nám prosím na ${form.dataset.mailto}.`);
    } finally {
      button.disabled = false;
    }
  }, true);
})();
