<?php
declare(strict_types=1);
require __DIR__ . '/lib/cronache.php';

$site = cronache_config()['site_url'];
header('Content-Type: application/xml; charset=UTF-8');
echo '<?xml version="1.0" encoding="UTF-8"?>', "\n";
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc><?= e($site) ?>/cronache/</loc></url>
<?php foreach (cronache_articles(false) as $a): ?>
  <url><loc><?= e($site . '/cronache/' . $a['slug']) ?></loc><lastmod><?= e($a['date']) ?></lastmod></url>
<?php endforeach; ?>
</urlset>
