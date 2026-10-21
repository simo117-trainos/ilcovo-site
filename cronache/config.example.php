<?php
/**
 * Configurazione di Cronache dal Covo — ESEMPIO.
 *
 * Copia questo file come  cronache-config.php  nella cartella SOPRA public_html
 * (su Hostinger: Gestore file → cartella del dominio, accanto a public_html),
 * così il token non è mai raggiungibile dal web e non finisce su GitHub.
 */
return [
    // Token dell'integrazione Notion (inizia con "ntn_" o "secret_")
    'notion_token' => 'INCOLLA_QUI_IL_TOKEN',

    // ID del database "Cronache — Articoli" (già corretto, non toccare)
    'database_id' => '733133839e8a48e6bd0feeb2df5303ea',

    // Ogni quanto il sito rilegge Notion (secondi). 900 = 15 minuti
    'cache_ttl' => 900,

    // Quando un articolo Approvato va online, aggiorna Notion: Stato = Pubblicato + URL + data
    'mark_published' => true,

    // Facoltativa: parola segreta per forzare l'aggiornamento subito
    // visitando https://ilcovocrossfitivrea.com/cronache/?refresh=PAROLA
    'refresh_key' => '',
];
