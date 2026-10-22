<?php
declare(strict_types=1);
require __DIR__ . '/lib/cronache.php';
require __DIR__ . '/lib/layout.php';

$slug = cronache_slugify((string) ($_GET['slug'] ?? ''));
$a = $slug !== '' ? cronache_article($slug) : null;

if (!$a) {
    http_response_code(404);
    cronache_head([
        'title' => 'Articolo non trovato | Cronache dal Covo',
        'description' => 'Questo articolo non è disponibile.',
        'path' => '/cronache/',
        'noindex' => true,
    ]);
    echo '<main class="cr-main"><section class="cr-empty"><div class="cr-wrap"><p class="cr-kicker">404</p><h2>Questa storia non è (più) qui.</h2><p><a href="/cronache/">Torna alle Cronache →</a></p></div></section></main>';
    cronache_foot();
    exit;
}

$site = cronache_config()['site_url'];
$url = $site . '/cronache/' . $a['slug'];
$hero = $a['images'][0] ?? '';
$gallery = array_slice($a['images'], 1);
$minutes = cronache_reading_time($a['blocks']);
$description = $a['estratto'] ?: $a['occhiello'];

// "Leggi anche": stessa rubrica prima, poi le altre
$related = array_values(array_filter(cronache_articles(), fn ($x) => $x['slug'] !== $a['slug']));
usort($related, fn ($x, $y) => ($y['rubrica'] === $a['rubrica']) <=> ($x['rubrica'] === $a['rubrica']));
$related = array_slice($related, 0, 3);

cronache_head([
    'title' => $a['title'] . ' | Cronache dal Covo',
    'description' => $description,
    'path' => '/cronache/' . $a['slug'],
    'image' => $hero ?: null,
    'type' => 'article',
    'jsonld' => [
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => $a['title'],
        'description' => $description,
        'datePublished' => $a['date'],
        'image' => $hero ? [$site . $hero] : [],
        'mainEntityOfPage' => $url,
        'author' => ['@type' => 'Organization', 'name' => 'Cronache dal Covo'],
        'publisher' => [
            '@type' => 'Organization',
            'name' => 'IL COVO CrossFit Ivrea',
            'logo' => ['@type' => 'ImageObject', 'url' => $site . '/assets/img/wolf-logo.png'],
        ],
    ],
]);

$shareText = $a['title'] . ' — Cronache dal Covo ' . $url;
?>
<main class="cr-main">
<?php cronache_masthead('Cronache dal Covo', true); ?>

<article class="cr-article">
  <header class="cr-article__head">
    <div class="cr-wrap cr-wrap--narrow">
      <p class="cr-kicker cr-kicker--<?= e(strtolower($a['rubrica'])) ?>">
        <a href="/cronache/?rubrica=<?= e(strtolower($a['rubrica'])) ?>"><?= e($a['rubrica']) ?></a>
      </p>
      <h1><?= e($a['title']) ?></h1>
      <?php if ($a['occhiello']): ?><p class="cr-article__lede"><?= e($a['occhiello']) ?></p><?php endif; ?>
      <p class="cr-article__meta">
        <time datetime="<?= e($a['date']) ?>"><?= e(cronache_date_it($a['date'])) ?></time>
        <span aria-hidden="true">·</span> <?= $minutes ?> min di lettura
      </p>
    </div>
  </header>

  <?php if ($hero): ?>
  <figure class="cr-article__hero<?= cronache_is_portrait($hero) ? ' cr-article__hero--portrait' : '' ?>">
    <img src="<?= e($hero) ?>" alt="<?= e($a['protagonista'] ?: $a['title']) ?>">
  </figure>
  <?php endif; ?>

  <div class="cr-wrap cr-article__layout">
    <aside class="cr-article__aside">
      <?php if ($a['scheda']): ?>
      <div class="cr-scheda">
        <p class="cr-scheda__title">Scheda atleta</p>
        <?php if ($a['protagonista']): ?><p class="cr-scheda__name"><?= e(explode(' ', $a['protagonista'])[0]) ?></p><?php endif; ?>
        <ul>
          <?php foreach ($a['scheda'] as $row): ?><li><?= e($row) ?></li><?php endforeach; ?>
        </ul>
      </div>
      <?php endif; ?>
      <div class="cr-share" data-share-title="<?= e($a['title']) ?>" data-share-url="<?= e($url) ?>">
        <p class="cr-scheda__title">Condividi</p>
        <a class="cr-share__btn" href="https://wa.me/?text=<?= rawurlencode($shareText) ?>" target="_blank" rel="noopener">WhatsApp</a>
        <button class="cr-share__btn" type="button" data-share-native hidden>Condividi…</button>
        <button class="cr-share__btn" type="button" data-share-copy>Copia link</button>
      </div>
    </aside>

    <div class="cr-prose">
      <?= cronache_render_blocks($a['blocks']) ?>

      <?php if ($a['citazione']): ?>
      <blockquote class="cr-pull cr-pull--end">«<?= e($a['citazione']) ?>»</blockquote>
      <?php endif; ?>
    </div>
  </div>

  <?php if ($gallery): ?>
  <section class="cr-gallery" aria-label="Foto">
    <div class="cr-wrap">
      <div class="cr-gallery__grid cr-gallery__grid--<?= min(count($gallery), 4) ?>">
        <?php foreach ($gallery as $img): ?><img src="<?= e($img) ?>" alt="" loading="lazy"><?php endforeach; ?>
      </div>
    </div>
  </section>
  <?php endif; ?>
</article>

<?php cronache_cta($a['slug']); ?>

<?php if ($related): ?>
<section class="cr-grid-section cr-related">
  <div class="cr-wrap">
    <h2 class="cr-section-title">Leggi anche</h2>
    <div class="cr-grid">
      <?php foreach ($related as $r): $img = $r['images'][0] ?? ''; ?>
      <article class="cr-card">
        <a href="/cronache/<?= e($r['slug']) ?>" class="cr-card__link">
          <div class="cr-card__media<?= $img ? '' : ' cr-card__media--empty' ?>"><?php if ($img): ?><img src="<?= e($img) ?>" alt="" loading="lazy"><?php else: ?><span><?= e($r['rubrica']) ?></span><?php endif; ?></div>
          <div class="cr-card__body">
            <p class="cr-kicker cr-kicker--<?= e(strtolower($r['rubrica'])) ?>"><?= e($r['rubrica']) ?></p>
            <h3><?= e($r['title']) ?></h3>
          </div>
        </a>
      </article>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php endif; ?>
</main>
<?php cronache_foot(); ?>
