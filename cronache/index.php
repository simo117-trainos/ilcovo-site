<?php
declare(strict_types=1);
require __DIR__ . '/lib/cronache.php';
require __DIR__ . '/lib/layout.php';

$rubriche = ['storie' => 'Storie', 'traguardi' => 'Traguardi', 'cronaca' => 'Cronaca'];
$filtro = strtolower((string) ($_GET['rubrica'] ?? ''));
$filtro = isset($rubriche[$filtro]) ? $filtro : '';

$all = cronache_articles();
$latest = $all[0] ?? null;
$numero = $latest && $latest['edizione'] ? $latest['edizione'] : max(1, (int) ceil(count($all) / 4));
$edition = 'N° ' . str_pad((string) $numero, 2, '0', STR_PAD_LEFT) . ' — ' . cronache_month_it($latest['date'] ?? '');

// Storia di copertina: quella segnata "In copertina", altrimenti l'ultima Storia, altrimenti l'ultimo pezzo
$cover = null;
if (!$filtro) {
    foreach ($all as $a) {
        if ($a['copertina']) { $cover = $a; break; }
    }
    if (!$cover) {
        foreach ($all as $a) {
            if ($a['rubrica'] === 'Storie') { $cover = $a; break; }
        }
    }
    $cover = $cover ?? $latest;
}

$traguardi = $filtro ? [] : array_slice(array_values(array_filter($all, fn ($a) => $a['rubrica'] === 'Traguardi' && $a !== $cover)), 0, 8);
$grid = array_values(array_filter($all, function ($a) use ($cover, $filtro, $rubriche, $traguardi) {
    if ($filtro) {
        return $a['rubrica'] === $rubriche[$filtro];
    }
    return $a !== $cover && !in_array($a, $traguardi, true);
}));

$pageTitle = $filtro ? $rubriche[$filtro] . ' | Cronache dal Covo' : 'Cronache dal Covo | Il giornale di IL COVO CrossFit Ivrea';
cronache_head([
    'title' => $pageTitle,
    'description' => 'Storie, traguardi e cronache delle persone che vivono IL COVO CrossFit Ivrea. Le persone sono la notizia.',
    'path' => '/cronache/' . ($filtro ? '?rubrica=' . $filtro : ''),
    'image' => $cover['images'][0] ?? null,
]);

function cr_card(array $a, string $variant = ''): void
{
    $img = $a['images'][0] ?? '';
    ?>
  <article class="cr-card <?= e($variant) ?>">
    <a href="/cronache/<?= e($a['slug']) ?>" class="cr-card__link">
      <div class="cr-card__media<?= $img ? '' : ' cr-card__media--empty' ?>">
        <?php if ($img): ?><img src="<?= e($img) ?>" alt="" loading="lazy"><?php else: ?><span><?= e($a['rubrica']) ?></span><?php endif; ?>
      </div>
      <div class="cr-card__body">
        <p class="cr-kicker cr-kicker--<?= e(strtolower($a['rubrica'])) ?>"><?= e($a['rubrica']) ?><?= $a['formato'] && $a['formato'] !== 'Breve' ? ' · ' . e($a['formato']) : '' ?></p>
        <h3><?= e($a['title']) ?></h3>
        <?php if ($a['estratto']): ?><p class="cr-card__excerpt"><?= e($a['estratto']) ?></p><?php endif; ?>
        <p class="cr-card__date"><?= e(cronache_date_it($a['date'])) ?></p>
      </div>
    </a>
  </article>
<?php
}
?>
<main class="cr-main">
<?php cronache_masthead($edition); ?>

<div class="cr-sections" role="navigation" aria-label="Rubriche">
  <div class="cr-wrap">
    <a href="/cronache/"<?= $filtro === '' ? ' aria-current="page"' : '' ?>>Tutto</a>
    <?php foreach ($rubriche as $k => $label): ?>
      <a href="/cronache/?rubrica=<?= $k ?>"<?= $filtro === $k ? ' aria-current="page"' : '' ?>><?= e($label) ?></a>
    <?php endforeach; ?>
  </div>
</div>

<?php if (!$all): ?>
  <section class="cr-empty">
    <div class="cr-wrap">
      <p class="cr-kicker">In redazione</p>
      <h2>Il primo numero sta arrivando.</h2>
      <p>Stiamo raccogliendo le storie di chi vive il box ogni giorno. Torna presto.</p>
    </div>
  </section>
<?php else: ?>

  <?php if ($cover): $img = $cover['images'][0] ?? ''; ?>
  <section class="cr-cover">
    <div class="cr-wrap">
      <a class="cr-cover__link" href="/cronache/<?= e($cover['slug']) ?>">
        <div class="cr-cover__media<?= $img ? '' : ' cr-card__media--empty' ?>">
          <?php if ($img): ?><img src="<?= e($img) ?>" alt=""><?php endif; ?>
          <span class="cr-cover__badge">In copertina</span>
        </div>
        <div class="cr-cover__body">
          <p class="cr-kicker cr-kicker--<?= e(strtolower($cover['rubrica'])) ?>"><?= e($cover['rubrica']) ?></p>
          <h2><?= e($cover['title']) ?></h2>
          <?php if ($cover['occhiello']): ?><p class="cr-cover__lede"><?= e($cover['occhiello']) ?></p><?php endif; ?>
          <?php if ($cover['citazione']): ?><blockquote class="cr-pull">«<?= e($cover['citazione']) ?>»</blockquote><?php endif; ?>
          <span class="cr-readmore">Leggi la storia →</span>
        </div>
      </a>
    </div>
  </section>
  <?php endif; ?>

  <?php if ($traguardi): ?>
  <section class="cr-strip" aria-label="Traguardi">
    <div class="cr-wrap">
      <div class="cr-strip__head">
        <h2 class="cr-section-title">Traguardi</h2>
        <a href="/cronache/?rubrica=traguardi">Tutti →</a>
      </div>
      <div class="cr-strip__rail">
        <?php foreach ($traguardi as $t): cr_card($t, 'cr-card--mini'); endforeach; ?>
      </div>
    </div>
  </section>
  <?php endif; ?>

  <?php if ($grid): ?>
  <section class="cr-grid-section">
    <div class="cr-wrap">
      <h2 class="cr-section-title"><?= $filtro ? e($rubriche[$filtro]) : 'Ultimi numeri' ?></h2>
      <div class="cr-grid">
        <?php foreach ($grid as $a): cr_card($a); endforeach; ?>
      </div>
    </div>
  </section>
  <?php elseif ($filtro): ?>
  <section class="cr-empty"><div class="cr-wrap"><p>Ancora nessun articolo in questa rubrica.</p></div></section>
  <?php endif; ?>

<?php endif; ?>

<section class="cr-invite">
  <div class="cr-wrap cr-invite__inner">
    <div>
      <p class="cr-kicker">Sei iscritto al COVO?</p>
      <h2>Hai una storia da raccontare?</h2>
      <p>Un primo pull-up, una gara, un ritorno dopo un infortunio. Parlane con il tuo coach: ti mandiamo noi le domande.</p>
    </div>
  </div>
</section>

<?php cronache_cta('homepage'); ?>
</main>
<?php cronache_foot(); ?>
