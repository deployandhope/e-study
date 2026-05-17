<?php
/**
 * Plugin Name: eStudy Stats
 * Description: Geeft geaggregeerde site-statistieken (zoals teacher-registraties per dag) terug via een REST endpoint, beveiligd met een token.
 * Version: 1.0.0
 * Author: Blogic Media
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('estudy-stats/v1', '/teachers', [
        'methods' => 'GET',
        'callback' => 'estudy_stats_teachers',
        'permission_callback' => 'estudy_stats_check_token',
    ]);
});

function estudy_stats_check_token(WP_REST_Request $request) {
    $expected = get_option('estudy_stats_token');
    if (empty($expected)) {
        return false;
    }
    $provided = $request->get_header('x-estudy-token');
    if (!is_string($provided) || $provided === '') {
        $provided = $request->get_param('token');
    }
    if (!is_string($provided) || $provided === '') {
        return false;
    }
    return hash_equals($expected, $provided);
}

function estudy_stats_teachers(WP_REST_Request $request) {
    global $wpdb;
    $sql = "
        SELECT DATE(u.user_registered) AS date, COUNT(*) AS count
        FROM {$wpdb->users} u
        INNER JOIN {$wpdb->usermeta} um ON um.user_id = u.ID
        WHERE um.meta_key = %s
          AND um.meta_value LIKE %s
        GROUP BY DATE(u.user_registered)
        ORDER BY date ASC
    ";
    $prepared = $wpdb->prepare(
        $sql,
        $wpdb->prefix . 'capabilities',
        '%"teacher"%'
    );
    $rows = $wpdb->get_results($prepared, ARRAY_A);
    $daily = array_map(function ($r) {
        return ['date' => $r['date'], 'count' => (int) $r['count']];
    }, $rows);
    $total = 0;
    foreach ($daily as $d) {
        $total += $d['count'];
    }
    return [
        'site' => parse_url(get_site_url(), PHP_URL_HOST),
        'teachers_total' => $total,
        'daily' => $daily,
    ];
}
