<?php

function parseArtQueryArgs($input = INPUT_GET) {
    $args = array(
        'query'  => FILTER_SANITIZE_FULL_SPECIAL_CHARS,
        'filters' => array(
            'filter' => FILTER_REQUIRE_ARRAY,
            'flags'  => FILTER_FORCE_ARRAY, 
        ),
        'sizes'  => array(
            'filter' => FILTER_REQUIRE_ARRAY,
            'flags'  => FILTER_FORCE_ARRAY, 
        ),
        'min_price' => FILTER_SANITIZE_NUMBER_INT,
        'max_price' => FILTER_SANITIZE_NUMBER_INT,
        'art_page' => FILTER_SANITIZE_NUMBER_INT,
    );

    $argsFilter = filter_input_array($input, $args);

    if (empty($argsFilter["filters"])) {
        $argsFilter["filters"] = [];
    }

    if(empty($argsFilter["sizes"])) {
        $argsFilter["sizes"] = [];
    }

    if (empty($argsFilter["min_price"])) {
        $argsFilter["min_price"] = 0;
    }

    if (empty($argsFilter["max_price"])) {
        $argsFilter["max_price"] = getHighestArtPrice();
    }

    if (empty($argsFilter["art_page"])) {
        $argsFilter["art_page"] = 1;
    }

    return $argsFilter;
}



function getArtSizes() {
    $artSizesArgs = array(
        'post_type'      => 'art',
        'posts_per_page' => -1,
    );

    $queryArtSizes = new WP_Query($artSizesArgs);

    $artSizes = array();

    if ($queryArtSizes->have_posts()) {
        while ($queryArtSizes->have_posts()) {
            $queryArtSizes->the_post();
            $sizes = get_field('art_size', get_the_ID());
            if ($sizes && !in_array($sizes, $artSizes)) {
                $artSizes[] = $sizes;
            }
        }
    }

    if (count($artSizes) === 0) {
        $artSizes = [];
    }

    return $artSizes;
}



function getHighestArtPrice() {
    $argsPostsMinMax = array(
        'post_type'      => 'art',
        'posts_per_page' => 1,
        'orderby'        => 'meta_value_num', 
        'meta_key'       => 'art_price',     
        'order'          => 'DESC',   
    );

    $queryPostsMinMax = new WP_Query($argsPostsMinMax);

    if ($queryPostsMinMax->have_posts()) {
        $queryPostsMinMax->the_post();
        
        $highestPrice = get_field("art_price");
    }

    return $highestPrice;
}
?>
