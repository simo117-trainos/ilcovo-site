<?php
declare(strict_types=1);
require __DIR__ . '/lib/cronache.php';

$site = cronache_config()['site_url'];
header('Content-Type: application/rss+xml; charset=UTF-8');
echo '<?xml version="1.0" encoding="UTF-8"?>', "\n";
?>
<rss version="2.0">
<channel>
  <title>Cronache dal Covo</title>
  <link><?= e($site) ?>/cronache/</link>
  <description>Storie, traguardi e cronache delle persone che vivono IL COVO CrossFit Ivrea.</description>
  <language>it-it</language>
<?php foreach (array_slice(cronache_articles(false), 0, 30) as $a): ?>
  <item>
    <title><?= e($a['title']) ?></title>
    <link><?= e($site . '/cronache/' . $a['slug']) ?></link>
    <guid><?= e($site . '/cronache/' . $a['slug']) ?></guid>
    <pubDate><?= e(date(DATE_RSS, strtotime($a['date']) ?: time())) ?></pubDate>
    <description><?= e($a['estratto'] ?: $a['occhiello']) ?></description>
  </item>
<?php endforeach; ?>
</channel>
</rss>
