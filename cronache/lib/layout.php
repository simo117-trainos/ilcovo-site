<?php
declare(strict_types=1);

/**
 * Testata HTML condivisa: stesse risorse, menu e footer del resto del sito.
 * <base href="/"> fa funzionare i percorsi relativi del sito (assets/, components/) anche in /cronache/.
 */
function cronache_head(array $meta): void
{
    $site = cronache_config()['site_url'];
    $title = $meta['title'];
    $desc = $meta['description'];
    $url = $site . $meta['path'];
    $image = $meta['image'] ?? '/assets/images/social/il-covo-og.jpg';
    $image = str_starts_with($image, 'http') ? $image : $site . $image;
    $type = $meta['type'] ?? 'website';
    ?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="/">
<title><?= e($title) ?></title>
<meta name="description" content="<?= e($desc) ?>">
<link rel="canonical" href="<?= e($url) ?>">
<?php if (!empty($meta['noindex'])): ?><meta name="robots" content="noindex"><?php endif; ?>
<meta property="og:locale" content="it_IT">
<meta property="og:type" content="<?= e($type) ?>">
<meta property="og:title" content="<?= e($title) ?>">
<meta property="og:description" content="<?= e($desc) ?>">
<meta property="og:url" content="<?= e($url) ?>">
<meta property="og:image" content="<?= e($image) ?>">
<meta property="og:site_name" content="IL COVO CrossFit Ivrea">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= e($title) ?>">
<meta name="twitter:description" content="<?= e($desc) ?>">
<meta name="twitter:image" content="<?= e($image) ?>">
<link rel="alternate" type="application/rss+xml" title="Cronache dal Covo" href="/cronache/feed.xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<?php if (!empty($meta['jsonld'])): ?>
<script type="application/ld+json"><?= json_encode($meta['jsonld'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?></script>
<?php endif; ?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@600;700&family=Bebas+Neue&family=Barlow:wght@300;400;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css">
<link rel="stylesheet" href="cronache/assets/cronache.css?v=1">
<script src="/assets/js/privacy-consent.js?v=20260817" defer></script>
</head>
<body class="cronache-page">
<nav id="nav" class="site-header header--light">
  <div class="nav-container">
  <a href="/" class="nav-logo nav-brand" aria-label="IL COVO">
    <img src="assets/img/Scritta+lupo-bianco - Copia.png" alt="IL COVO CrossFit Ivrea" class="nav-logo-img">
  </a>
  <div class="nav-links">
    <a href="/">HOME</a>
    <a href="/crossfit">CrossFit</a>
    <a href="/hyrox">Hyrox</a>
    <a href="/orari">Orari</a>
    <a href="/prezzi">Prezzi</a>
    <a href="/cronache/" aria-current="page">Cronache</a>
    <a href="/prenota-prova?type=trial" class="nav-cta nav-cta--mobile">Prenota la tua prova</a>
  </div>
  <div class="nav-actions">
    <a href="/prenota-prova?type=trial" class="nav-cta">Prenota la tua prova</a>
    <button class="nav-toggle" type="button" aria-label="Apri menu" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
  </div>
</nav>
<?php
}

function cronache_masthead(string $edition, bool $asLink = false): void
{
    $name = 'Cronache <span>dal</span> Covo';
    ?>
<header class="cr-masthead">
  <div class="cr-wrap">
    <div class="cr-masthead__meta">
      <span><?= e($edition) ?></span>
      <span class="cr-masthead__place">Ivrea · Corso Vercelli 332/E</span>
    </div>
    <?php if ($asLink): ?>
      <a class="cr-masthead__name" href="/cronache/"><?= $name ?></a>
    <?php else: ?>
      <h1 class="cr-masthead__name"><?= $name ?></h1>
    <?php endif; ?>
    <p class="cr-masthead__tag">Le persone sono la notizia. Il box è il luogo in cui nascono le storie.</p>
  </div>
</header>
<?php
}

function cronache_cta(string $campaign): void
{
    $href = '/prenota-prova?type=trial&utm_source=cronache&utm_medium=articolo&utm_campaign=' . rawurlencode($campaign);
    ?>
<section class="cr-cta">
  <div class="cr-wrap cr-cta__inner">
    <p class="cr-kicker">La prossima storia può essere la tua</p>
    <h2>Ogni storia qui dentro<br>è cominciata con una prova.</h2>
    <a href="<?= e($href) ?>" class="btn btn-red">Prenota la tua prova →</a>
  </div>
</section>
<?php
}

function cronache_foot(): void
{
    ?>
<div data-site-footer></div>
<script src="assets/js/header.js" defer></script>
<script src="assets/js/footer.js" defer></script>
<script src="cronache/assets/cronache.js?v=1" defer></script>
</body>
</html>
<?php
}
