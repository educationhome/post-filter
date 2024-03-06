<?php


const GALLERY_COLUMN_COUNT = 3;




function parseArtQueryArgs($input = INPUT_GET) {
    $args = [
        "query"  => FILTER_SANITIZE_FULL_SPECIAL_CHARS,
        "filters" => [
            "filter" => FILTER_REQUIRE_ARRAY,
            "flags"  => FILTER_FORCE_ARRAY, 
        ],
        "sizes"  => [
            "filter" => FILTER_REQUIRE_ARRAY,
            "flags"  => FILTER_FORCE_ARRAY,
        ],
        "min_price" => FILTER_SANITIZE_NUMBER_INT,
        "max_price" => FILTER_SANITIZE_NUMBER_INT,
        "art_page" => FILTER_SANITIZE_NUMBER_INT,
    ];

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
        "post_type"      => "art",
        "posts_per_page" => -1,
    );

    $queryArtSizes = new WP_Query($artSizesArgs);

    $artSizes = array();

    if ($queryArtSizes->have_posts()) {
        while ($queryArtSizes->have_posts()) {
            $queryArtSizes->the_post();
            $sizes = get_field("art_size", get_the_ID());
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
        "post_type"      => "art",
        "posts_per_page" => 1,
        "orderby"        => "meta_value_num", 
        "meta_key"       => "art_price",     
        "order"          => "DESC",   
    );

    $queryPostsMinMax = new WP_Query($argsPostsMinMax);

    if ($queryPostsMinMax->have_posts()) {
        $queryPostsMinMax->the_post();
        
        $highestPrice = get_field("art_price");
    }

    return $highestPrice;
}


add_action("wp_ajax_filter_ajax", "posts_json_response"); 
add_action("wp_ajax_nopriv_filter_ajax", "posts_json_response"); 

function posts_json_response() {

    $filtersArray = json_decode(stripslashes($_POST["filtersArray"]));
    $searchQuery = $_POST["searchQuery"];
    $select = json_decode(stripslashes($_POST["select"]));
    $minPrice = $_POST["minPrice"];
    $maxPrice = $_POST["maxPrice"];
    $currentPage = $_POST["currentPage"];

    $argsPosts = [
        "post_type"      => "art",
        "posts_per_page" => -1,
        "s"              => $searchQuery, 
    ];

    if (!empty($filtersArray)) {
        $argsPosts["tax_query"] = [
            [
                "taxonomy" => "artworks_color_filter",
                "field"    => "slug",
                "terms"    => $filtersArray, 
            ],
        ];
    }

    $queryPosts = new WP_Query($argsPosts);

    $posts = [];
    if ($queryPosts->have_posts()) {
        while ($queryPosts->have_posts()) {
            $queryPosts->the_post();
            $postId = get_the_ID();
            $image = get_field("art_image", $postId);
            $size = get_field("art_size", $postId);
            $slug = get_post_field("post_name", $postId);
            $price = intval(get_field("art_price", $postId));

            if ((is_array($select) && in_array($size, $select) || empty($select)) && ($price >= $minPrice  && $price <= $maxPrice) || (empty($minPrice) && empty($maxPrice))):

                $post_data = [
                    "title" => get_the_title(),
                    "image_url" => $image["url"],
                    "size" => $size,
                    "price" => $price,
                    "slug" => $slug,
                ];
                $posts[] = $post_data;
            endif;
        }

        $artColumn = [];

        for ($i = 0; $i < GALLERY_COLUMN_COUNT; $i++) {
            $artColumn[$i] = array();
        }

        $i = 0;

        foreach( $posts as $post ) {
            array_push($artColumn[$i], $post);
            $i++;

            if ($i > GALLERY_COLUMN_COUNT-1) {
                $i = 0;
            }
        }
    }

    header("Content-Type: application/json");
    echo json_encode($artColumn);

    wp_die(); 
}
?>
