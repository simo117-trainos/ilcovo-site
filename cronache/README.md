# Cronache dal Covo — sezione del sito

Il giornale della community. I contenuti stanno su Notion (database **Cronache — Articoli**);
queste pagine PHP li leggono e li mostrano su `/cronache/`.

## Regole di pubblicazione (applicate dal server)
Un articolo è online **solo se** in Notion:
- Stato = **Approvato** o **Pubblicato**, e
- **Liberatoria firmata** è spuntata.

Quando un articolo Approvato va online, il server aggiorna Notion: Stato → Pubblicato,
URL articolo e Data pubblicazione (se vuota). I segnaposto `[DA VERIFICARE …]` non vengono mai mostrati.

## File
| Percorso | Cosa fa |
|---|---|
| `index.php` | Homepage del giornale (testata, copertina, Traguardi, griglia, rubriche) |
| `articolo.php` | Pagina articolo — URL: `/cronache/<slug>` |
| `feed.php`, `sitemap.php` | `/cronache/feed.xml` (RSS) e `/cronache/sitemap.xml` |
| `lib/cronache.php` | Lettura Notion, cache, download foto |
| `lib/layout.php` | Testata, menu e footer condivisi |
| `assets/` | CSS e JS della sezione |
| `cache/` | Copie locali delle risposte Notion (escluse da Git, non accessibili dal web) |
| `media/` | Foto scaricate da Notion (escluse da Git) |
| `demo/demo.json` | Dati finti per l'anteprima locale |

## Attivazione (una volta sola)
1. **Integrazione Notion**: notion.so/profile/integrations → *Nuova integrazione* (interna) →
   capacità: *Leggere contenuti* e *Aggiornare contenuti*. Copia il token.
2. Apri il database **Cronache — Articoli** → `•••` → *Connessioni* → aggiungi l'integrazione.
3. Su Hostinger crea `cronache-config.php` **accanto a** `public_html` partendo da `config.example.php`
   e incolla il token.
4. Apri `https://ilcovocrossfitivrea.com/cronache/`.

## Anteprima locale con dati finti
```
CRONACHE_DEMO=1 php -S 127.0.0.1:8099 -t .. router.php
```
(serve un router che emuli `.htaccess`; in produzione le regole sono in `cronache/.htaccess`).
