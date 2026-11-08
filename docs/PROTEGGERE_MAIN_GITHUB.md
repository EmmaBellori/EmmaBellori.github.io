# Proteggere l'accesso a GitHub e il ramo main — Emma Bellori Books

La protezione più importante contro modifiche non autorizzate al sito è combinare un account GitHub resistente al phishing con regole di pubblicazione che non permettano di modificare `main` direttamente.

## 1. Accesso GitHub — impostazioni personali (non automatizzabili tramite PR)

Aprire https://github.com/settings/security e verificare:
- 2FA attivata (preferibilmente app di autenticazione o chiave di sicurezza, non solo SMS);
- almeno una passkey registrata; se possibile un metodo di recupero indipendente;
- codici di recupero salvati in un luogo sicuro e mai caricati nel repository;
- dispositivi, sessioni, app OAuth, autorizzazioni e personal access token non più necessari rimossi.

Nessuna di queste impostazioni può essere attivata da una Pull Request.

## 2. Prima di bloccare main: separare lo stato delle newsletter

La nuova automazione di newsletter salva `growth/release-email-state.json` nel ramo
`automation/release-email-state`, senza effettuare push a `main`.
Il ramo deve esistere prima del merge della PR che modifica il workflow.
Il ramo è stato inizializzato da una copia corrente di `main`, incluso lo storico
degli invii, per non perdere l'elenco degli annunci già effettuati.

Il workflow schedulato:
1. carica il registro dal ramo `automation/release-email-state`;
2. genera e, se previsto, invia la newsletter come prima;
3. scrive il registro aggiornato soltanto nel ramo dedicato.

L'automazione mantiene il permesso `contents: write` per questo aggiornamento.
Il ruleset di `main` aggiunge la barriera che impedisce al token di utilizzarlo
per modifiche dirette alla pubblicazione. Non aggiungere `automation/release-email-state`
al ruleset che impone le PR; altrimenti il registro non potrà essere aggiornato.

## 3. Creare il ruleset per main (richiede accesso amministratore GitHub)

Aprire:
https://github.com/EmmaBellori/EmmaBellori.github.io/settings/rules

Scegliere **New ruleset → New branch ruleset** e impostare:

- Name: `Protect production main`
- Enforcement status: **Active**
- Target branches: **Include default branch** (ovvero `main`)
- Bypass list: preferibilmente **vuota**
- **Restrict deletions**: attivo
- **Block force pushes**: attivo
- **Require a pull request before merging**: attivo
- **Require status checks to pass before merging**: attivo; selezionare il job `security` del workflow `Static site security audit`, già eseguito su ogni PR
- Approvazioni PR: **0** se il repository è gestito da un solo account (GitHub non consente in genere di approvare la propria PR). Se c'è un altro manutentore affidabile, valutare 1 approvazione indipendente.
- Non attivare **Restrict updates**, **Lock branch**, o ulteriori controlli non testati che impedirebbero anche i normali merge.
- Non aggiungere eccezioni globali per chiunque abbia accesso al repository.

Creare il ruleset, verificare che il ramo `main` risulti protetto e provare
una modifica innocua tramite PR; i check devono diventare verdi prima del merge.

**Nota:** non è possibile creare questo ruleset dai permessi dell'integrazione GitHub attualmente disponibile. Va fatto dalla pagina GitHub indicata.

## 4. Proteggere anche il ramo di stato dell'email

Facoltativo ma consigliato: creare un secondo branch ruleset che punti solo a
`automation/release-email-state` e blocchi **force push** e **deletion**,
senza imporre PR. Così il job programmato può aggiornare il registro normalmente.

## 5. Verifica di completamento

- Il ruleset `Protect production main` è **Active** e punta a `main`;
- una PR richiede almeno il check `security` verde;
- un push diretto a `main` viene respinto;
- il prossimo invio newsletter aggiorna lo stato su `automation/release-email-state`, non su `main`;
- passkey/2FA e codici di recupero sono stati configurati;
- nessun segreto è stato condiviso in chat o salvato nel repository.

Riferimenti GitHub:
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- https://docs.github.com/en/authentication/authenticating-with-a-passkey/managing-your-passkeys
