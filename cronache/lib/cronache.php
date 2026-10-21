<?php
/**
 * Cronache dal Covo — motore della sezione.
 *
 * Legge gli articoli dal database Notion "Cronache — Articoli", mostra SOLO quelli
 * con Stato = Approvato/Pubblicato E Liberatoria firmata, li tiene in cache
 * e salva le foto sul server (gli URL dei file Notion scadono dopo ~1 ora).
 *
 * Configurazione: vedi cronache/README.md
 */

declare(strict_types=1);

const CRONACHE_NOTION_VERSION = '2022-06-28';
const CRONACHE_DEFAULT_DATABASE_ID = '733133839e8a48e6bd0feeb2df5303ea';
const CRONACHE_SITE_URL = 'https://ilcovocrossfitivrea.com';

/* ───────────────────────── Configurazione ───────────────────────── */

function cronache_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $config = [
        'notion_token' => '',
        'database_id' => CRONACHE_DEFAULT_DATABASE_ID,
        'cache_ttl' => 900,          // secondi (15 minuti)
        'demo' => false,             // true = usa i dati di prova in demo/demo.json
        'mark_published' => true,    // aggiorna Notion: Approvato -> Pubblicato + URL
        'site_url' => CRONACHE_SITE_URL,
        'refresh_key' => '',         // se impostata, /cronache/?refresh=CHIAVE svuota la cache
        'api_base' => 'https://api.notion.com/v1/', // modificabile solo per i test
    ];

    $candidates = array_filter([
        getenv('CRONACHE_CONFIG') ?: null,
        // Fuori dalla cartella pubblica (consigliato su Hostinger: accanto a public_html)
        !empty($_SERVER['DOCUMENT_ROOT']) ? dirname((string) $_SERVER['DOCUMENT_ROOT']) . '/cronache-config.php' : null,
        // Ripiego dentro il repository (file escluso da Git)
        dirname(__DIR__) . '/config.local.php',
    ]);

    foreach ($candidates as $file) {
        if (is_file($file) && is_readable($file)) {
            $loaded = require $file;
            if (is_array($loaded)) {
                $config = array_merge($config, $loaded);
            }
            break;
        }
    }

    if (getenv('CRONACHE_DEMO') === '1') {
        $config['demo'] = true;
    }
    $config['site_url'] = rtrim((string) $config['site_url'], '/');

    return $config;
}

function cronache_is_configured(): bool
{
    $c = cronache_config();
    return $c['demo'] || $c['notion_token'] !== '';
}

/* ───────────────────────── Cache su file ───────────────────────── */

function cronache_cache_dir(): string
{
    $dir = dirname(__DIR__) . '/cache';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir;
}

function cronache_media_dir(): string
{
    $dir = dirname(__DIR__) . '/media';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    return $dir;
}

/**
 * Restituisce il valore in cache se fresco; altrimenti chiama $producer.
 * Se $producer fallisce, restituisce l'ultima copia salvata (anche scaduta).
 */
function cronache_cached(string $key, callable $producer)
{
    $ttl = (int) cronache_config()['cache_ttl'];
    $file = cronache_cache_dir() . '/' . preg_replace('/[^a-z0-9_-]/i', '_', $key) . '.json';
    $fresh = is_file($file) && (time() - filemtime($file) < $ttl);

    $key = (string) cronache_config()['refresh_key'];
    $forceRefresh = $key !== '' && isset($_GET['refresh']) && hash_equals($key, (string) $_GET['refresh']);
    if ($fresh && !$forceRefresh) {
        $data = json_decode((string) file_get_contents($file), true);
        if (is_array($data)) {
            return $data;
        }
    }

    try {
        $data = $producer();
        @file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
        return $data;
    } catch (Throwable $e) {
        error_log('[cronache] ' . $e->getMessage());
        if (is_file($file)) {
            $data = json_decode((string) file_get_contents($file), true);
            if (is_array($data)) {
                return $data;
            }
        }
        return null;
    }
}

/* ───────────────────────── Client Notion ───────────────────────── */

function cronache_notion(string $method, string $path, ?array $body = null): array
{
    $token = (string) cronache_config()['notion_token'];
    if ($token === '') {
        throw new RuntimeException('Token Notion mancante');
    }

    $ch = curl_init(rtrim((string) cronache_config()['api_base'], '/') . '/' . ltrim($path, '/'));
    $headers = [
        'Authorization: Bearer ' . $token,
        'Notion-Version: ' . CRONACHE_NOTION_VERSION,
        'Content-Type: application/json',
    ];
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($raw === false || $status >= 400) {
        throw new RuntimeException("Notion $method $path: HTTP $status $error " . substr((string) $raw, 0, 300));
    }
    $data = json_decode((string) $raw, true);
    if (!is_array($data)) {
        throw new RuntimeException("Notion $method $path: risposta non valida");
    }
    return $data;
}

/* ───────────────────────── Lettura proprietà ───────────────────────── */

function cronache_prop_text(array $props, string $name): string
{
    $p = $props[$name] ?? null;
    if (!$p) {
        return '';
    }
    $items = $p['title'] ?? $p['rich_text'] ?? [];
    return trim(implode('', array_map(fn ($t) => $t['plain_text'] ?? '', $items)));
}

function cronache_prop_select(array $props, string $name): string
{
    $p = $props[$name] ?? null;
    return (string) ($p['select']['name'] ?? $p['status']['name'] ?? '');
}

function cronache_prop_bool(array $props, string $name): bool
{
    return (bool) ($props[$name]['checkbox'] ?? false);
}

function cronache_prop_date(array $props, string $name): string
{
    return (string) ($props[$name]['date']['start'] ?? '');
}

function cronache_prop_number(array $props, string $name): ?int
{
    $n = $props[$name]['number'] ?? null;
    return $n === null ? null : (int) $n;
}

/** @return array<int, array{url:string, name:string}> */
function cronache_prop_files(array $props, string $name): array
{
    $out = [];
    foreach ($props[$name]['files'] ?? [] as $f) {
        $url = $f['file']['url'] ?? $f['external']['url'] ?? '';
        if ($url !== '') {
            $out[] = ['url' => $url, 'name' => (string) ($f['name'] ?? '')];
        }
    }
    return $out;
}

/* ───────────────────────── Foto ───────────────────────── */

/**
 * Scarica un'immagine (URL Notion temporaneo) sul server e restituisce il percorso pubblico.
 * La chiave stabile evita di riscaricarla a ogni aggiornamento della cache.
 */
function cronache_store_image(string $url, string $stableKey): string
{
    if ($url === '') {
        return '';
    }
    // In demo i percorsi locali del sito sono già pubblici
    if (str_starts_with($url, '/')) {
        return $url;
    }

    $hash = substr(sha1($stableKey), 0, 16);
    $dir = cronache_media_dir();
    foreach (['jpg', 'png', 'webp'] as $ext) {
        if (is_file("$dir/$hash.$ext")) {
            return "/cronache/media/$hash.$ext";
        }
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_MAXFILESIZE => 25 * 1024 * 1024,
    ]);
    $bytes = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($bytes === false || $status >= 400 || strlen((string) $bytes) < 100) {
        throw new RuntimeException("Download immagine fallito ($status)");
    }

    $info = @getimagesizefromstring((string) $bytes);
    $mime = $info['mime'] ?? '';
    $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;
    if ($ext === null) {
        throw new RuntimeException("Formato immagine non supportato: $mime");
    }

    $target = "$dir/$hash.$ext";
    // Ridimensiona le foto grandi (lato lungo max 1800px) se GD è disponibile
    if (function_exists('imagecreatefromstring') && max($info[0], $info[1]) > 1800) {
        $src = @imagecreatefromstring((string) $bytes);
        if ($src) {
            if ($ext === 'jpg' && function_exists('exif_read_data')) {
                $src = cronache_fix_orientation($src, (string) $bytes);
            }
            $w = imagesx($src);
            $h = imagesy($src);
            $scale = 1800 / max($w, $h);
            $dst = imagescale($src, (int) round($w * $scale), (int) round($h * $scale));
            if ($dst) {
                $ok = match ($ext) {
                    'png' => imagepng($dst, $target, 7),
                    'webp' => imagewebp($dst, $target, 82),
                    default => imagejpeg($dst, $target, 82),
                };
                imagedestroy($dst);
                imagedestroy($src);
                if ($ok) {
                    return "/cronache/media/$hash.$ext";
                }
            }
        }
    }

    file_put_contents($target, $bytes, LOCK_EX);
    return "/cronache/media/$hash.$ext";
}

function cronache_fix_orientation($img, string $bytes)
{
    $exif = @exif_read_data('data://image/jpeg;base64,' . base64_encode($bytes));
    $o = (int) ($exif['Orientation'] ?? 1);
    return match ($o) {
        3 => imagerotate($img, 180, 0),
        6 => imagerotate($img, -90, 0),
        8 => imagerotate($img, 90, 0),
        default => $img,
    };
}

/* ───────────────────────── Articoli ───────────────────────── */

function cronache_slugify(string $text): string
{
    $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;
    $text = strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $text));
    return trim(substr($text, 0, 60), '-');
}

/** Trasforma una pagina Notion in un articolo (senza corpo). */
function cronache_map_page(array $page): ?array
{
    $p = $page['properties'] ?? [];

    // Doppio controllo lato server: mai pubblicare senza liberatoria e approvazione
    $stato = cronache_prop_select($p, 'Stato');
    if (!cronache_prop_bool($p, 'Liberatoria firmata') || !in_array($stato, ['Approvato', 'Pubblicato'], true)) {
        return null;
    }

    $title = cronache_prop_text($p, 'Titolo');
    $slug = cronache_slugify(cronache_prop_text($p, 'Slug') ?: $title);
    if ($slug === '' || $title === '') {
        return null;
    }

    $images = [];
    $cover = cronache_prop_files($p, 'Copertina');
    $gallery = cronache_prop_files($p, 'Galleria');
    foreach (array_merge($cover, $gallery) as $i => $f) {
        try {
            $images[] = cronache_store_image($f['url'], $page['id'] . '|' . $f['name'] . '|' . $i);
        } catch (Throwable $e) {
            error_log('[cronache] ' . $e->getMessage());
        }
    }

    $scheda = array_values(array_filter(array_map('trim', explode('|', cronache_prop_text($p, 'Scheda atleta')))));

    return [
        'id' => $page['id'],
        'slug' => $slug,
        'title' => $title,
        'rubrica' => cronache_prop_select($p, 'Rubrica') ?: 'Storie',
        'formato' => cronache_prop_select($p, 'Formato'),
        'occhiello' => cronache_prop_text($p, 'Occhiello'),
        'estratto' => cronache_prop_text($p, 'Estratto'),
        'citazione' => cronache_prop_text($p, 'Citazione'),
        'protagonista' => cronache_prop_text($p, 'Protagonista'),
        'scheda' => $scheda,
        'images' => array_values(array_filter($images)),
        'date' => cronache_prop_date($p, 'Data pubblicazione') ?: substr((string) ($page['created_time'] ?? ''), 0, 10),
        'date_set' => cronache_prop_date($p, 'Data pubblicazione') !== '',
        'edizione' => cronache_prop_number($p, 'Edizione'),
        'copertina' => cronache_prop_bool($p, 'In copertina'),
        'stato' => $stato,
        'url_notion' => cronache_prop_text($p, 'URL articolo'),
    ];
}

/** Tutti gli articoli pubblicabili, dal più recente. */
function cronache_articles(): array
{
    $c = cronache_config();
    if ($c['demo']) {
        return cronache_demo()['articles'];
    }
    if ($c['notion_token'] === '') {
        return [];
    }

    $articles = cronache_cached('articles', function () use ($c) {
        $out = [];
        $cursor = null;
        do {
            $body = [
                'page_size' => 100,
                'filter' => ['and' => [
                    ['property' => 'Liberatoria firmata', 'checkbox' => ['equals' => true]],
                    ['or' => [
                        ['property' => 'Stato', 'status' => ['equals' => 'Approvato']],
                        ['property' => 'Stato', 'status' => ['equals' => 'Pubblicato']],
                    ]],
                ]],
                'sorts' => [['timestamp' => 'created_time', 'direction' => 'descending']],
            ];
            if ($cursor) {
                $body['start_cursor'] = $cursor;
            }
            $res = cronache_notion('POST', 'databases/' . $c['database_id'] . '/query', $body);
            foreach ($res['results'] ?? [] as $page) {
                $a = cronache_map_page($page);
                if ($a) {
                    $out[] = $a;
                }
            }
            $cursor = !empty($res['has_more']) ? ($res['next_cursor'] ?? null) : null;
        } while ($cursor);

        cronache_mark_published($out);
        usort($out, fn ($a, $b) => strcmp($b['date'], $a['date']));
        return $out;
    });

    return is_array($articles) ? $articles : [];
}

function cronache_article(string $slug): ?array
{
    foreach (cronache_articles() as $a) {
        if ($a['slug'] === $slug) {
            $a['blocks'] = cronache_blocks($a['id']);
            return $a;
        }
    }
    return null;
}

/**
 * Chiude il cerchio su Notion: Approvato -> Pubblicato, con data e URL.
 * Best effort: se fallisce (es. integrazione in sola lettura) il sito funziona lo stesso.
 */
function cronache_mark_published(array &$articles): void
{
    $c = cronache_config();
    if (!$c['mark_published']) {
        return;
    }
    foreach ($articles as &$a) {
        if ($a['stato'] !== 'Approvato') {
            continue;
        }
        $today = date('Y-m-d');
        $url = $c['site_url'] . '/cronache/' . $a['slug'];
        $props = [
            'Stato' => ['status' => ['name' => 'Pubblicato']],
            'URL articolo' => ['url' => $url],
        ];
        if (empty($a['date_set'])) {
            $props['Data pubblicazione'] = ['date' => ['start' => $today]];
            $a['date'] = $today;
        }
        try {
            cronache_notion('PATCH', 'pages/' . $a['id'], ['properties' => $props]);
            $a['stato'] = 'Pubblicato';
        } catch (Throwable $e) {
            error_log('[cronache] aggiornamento Notion non riuscito: ' . $e->getMessage());
        }
    }
    unset($a);
}

/* ───────────────────────── Corpo dell'articolo ───────────────────────── */

/** Blocchi del corpo: solo quelli sotto il titolo "Bozza articolo". */
function cronache_blocks(string $pageId): array
{
    $c = cronache_config();
    if ($c['demo']) {
        return cronache_demo()['blocks'][$pageId] ?? [];
    }

    $blocks = cronache_cached('blocks_' . $pageId, function () use ($pageId) {
        $all = [];
        $cursor = null;
        do {
            $q = 'blocks/' . $pageId . '/children?page_size=100' . ($cursor ? '&start_cursor=' . urlencode($cursor) : '');
            $res = cronache_notion('GET', $q);
            $all = array_merge($all, $res['results'] ?? []);
            $cursor = !empty($res['has_more']) ? ($res['next_cursor'] ?? null) : null;
        } while ($cursor);

        // Tieni solo ciò che sta dopo "Bozza articolo"
        $start = null;
        foreach ($all as $i => $b) {
            if (str_starts_with($b['type'], 'heading_')) {
                $text = strtolower(implode('', array_map(fn ($t) => $t['plain_text'] ?? '', $b[$b['type']]['rich_text'] ?? [])));
                if (str_contains($text, 'bozza articolo')) {
                    $start = $i + 1;
                }
            }
        }
        $body = $start === null ? $all : array_slice($all, $start);

        $out = [];
        foreach ($body as $b) {
            $type = $b['type'];
            $data = $b[$type] ?? [];
            $item = ['type' => $type, 'rich' => $data['rich_text'] ?? []];
            if ($type === 'image') {
                $url = $data['file']['url'] ?? $data['external']['url'] ?? '';
                try {
                    $item['src'] = cronache_store_image($url, $b['id']);
                } catch (Throwable $e) {
                    continue;
                }
                $item['rich'] = $data['caption'] ?? [];
            }
            $out[] = $item;
        }
        return $out;
    });

    return is_array($blocks) ? $blocks : [];
}

/* ───────────────────────── Dati di prova ───────────────────────── */

function cronache_demo(): array
{
    static $demo = null;
    if ($demo === null) {
        $demo = json_decode((string) file_get_contents(dirname(__DIR__) . '/demo/demo.json'), true) ?: ['articles' => [], 'blocks' => []];
    }
    return $demo;
}

/* ───────────────────────── Helper HTML ───────────────────────── */

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function cronache_rich(array $rich): string
{
    $html = '';
    foreach ($rich as $t) {
        $text = e($t['plain_text'] ?? $t['text']['content'] ?? '');
        $text = nl2br($text);
        $a = $t['annotations'] ?? [];
        if (!empty($a['bold'])) {
            $text = "<strong>$text</strong>";
        }
        if (!empty($a['italic'])) {
            $text = "<em>$text</em>";
        }
        $href = $t['href'] ?? ($t['text']['link']['url'] ?? null);
        if ($href && preg_match('#^https?://#i', $href)) {
            $text = '<a href="' . e($href) . '" rel="noopener" target="_blank">' . $text . '</a>';
        }
        $html .= $text;
    }
    return $html;
}

function cronache_render_blocks(array $blocks): string
{
    $html = '';
    $list = null;
    foreach ($blocks as $b) {
        $type = $b['type'];
        $isList = in_array($type, ['bulleted_list_item', 'numbered_list_item'], true);
        $tag = $type === 'numbered_list_item' ? 'ol' : 'ul';
        if ($list && (!$isList || $list !== $tag)) {
            $html .= "</$list>";
            $list = null;
        }
        if ($isList && !$list) {
            $html .= "<$tag>";
            $list = $tag;
        }
        $inner = cronache_rich($b['rich'] ?? []);
        switch ($type) {
            case 'paragraph':
                if ($inner !== '') {
                    $html .= "<p>$inner</p>";
                }
                break;
            case 'heading_1':
            case 'heading_2':
                $html .= "<h2>$inner</h2>";
                break;
            case 'heading_3':
                $html .= "<h3>$inner</h3>";
                break;
            case 'bulleted_list_item':
            case 'numbered_list_item':
                $html .= "<li>$inner</li>";
                break;
            case 'quote':
            case 'callout':
                $html .= "<blockquote>$inner</blockquote>";
                break;
            case 'divider':
                $html .= '<hr>';
                break;
            case 'image':
                $html .= '<figure><img src="' . e($b['src'] ?? '') . '" alt="' . e(strip_tags($inner)) . '" loading="lazy">'
                    . ($inner !== '' ? "<figcaption>$inner</figcaption>" : '') . '</figure>';
                break;
        }
    }
    if ($list) {
        $html .= "</$list>";
    }
    // Il redattore usa [DA VERIFICARE: …]: non deve mai finire online
    return preg_replace('/\[DA VERIFICARE[^\]]*\]/u', '', $html);
}

function cronache_date_it(string $date): string
{
    if ($date === '') {
        return '';
    }
    $mesi = ['', 'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    $t = strtotime($date);
    return $t ? date('j', $t) . ' ' . $mesi[(int) date('n', $t)] . ' ' . date('Y', $t) : '';
}

function cronache_month_it(string $date): string
{
    $mesi = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    $t = strtotime($date ?: 'now');
    return $mesi[(int) date('n', $t)] . ' ' . date('Y', $t);
}

function cronache_reading_time(array $blocks): int
{
    $words = 0;
    foreach ($blocks as $b) {
        $text = implode(' ', array_map(fn ($t) => $t['plain_text'] ?? '', $b['rich'] ?? []));
        $words += count(preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY));
    }
    return max(1, (int) round($words / 220));
}
