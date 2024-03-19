<?php


const GALLERY_COLUMN_COUNT = 3;
const POSTS_PER_PAGE = 5;


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

// PROCESSING AJAX REQUEST

add_action("wp_ajax_filter_ajax", "posts_json_response"); 
add_action("wp_ajax_nopriv_filter_ajax", "posts_json_response"); 

function posts_json_response() {

    $filtersArray = json_decode(stripslashes($_POST["filtersArray"]));
    $searchQuery = $_POST["searchQuery"];
    $select = json_decode(stripslashes($_POST["select"]));
    $minPrice = $_POST["minPrice"];
    $maxPrice = $_POST["maxPrice"];
    $currentPage = $_POST["currentPage"];

    $posts_per_page = $currentPage * POSTS_PER_PAGE;

    $argsPosts = [
        "post_type"      => "art",
        "posts_per_page" => $posts_per_page,
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

    if (!empty($select)) {
        $argsPosts["meta_query"][] = array(
            "key" => "art_size",
            "value" => $select, 
            "compare" => "IN",
        );
    }

    if (isset($minPrice) && isset($maxPrice)) {
        $argsPosts["meta_query"][] = array(
            "relation" => "AND",
            array(
                "key" => "art_price",
                "value" => $minPrice,
                "compare" => ">=",
                "type" => "NUMERIC",
            ),
            array(
                "key" => "art_price",
                "value" => $maxPrice,
                "compare" => "<=",
                "type" => "NUMERIC",
            ),
        );
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

            $post_data = [
                "title" => get_the_title(),
                "image_url" => $image["url"],
                "size" => $size,
                "price" => $price,
                "slug" => $slug,
            ];
            $posts[] = $post_data;
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

// PROCESSING AJAX REQUEST ( --- LOAD MORE --- )

add_action("wp_ajax_add_posts_ajax", "add_posts_json_response"); 
add_action("wp_ajax_nopriv_add_posts_ajax", "add_posts_json_response"); 

function add_posts_json_response() {

    $filtersArray = json_decode(stripslashes($_POST["filtersArray"]));
    $searchQuery = $_POST["searchQuery"];
    $select = json_decode(stripslashes($_POST["select"]));
    $minPrice = $_POST["minPrice"];
    $maxPrice = $_POST["maxPrice"];
    $currentPage = $_POST["currentPage"];

    $posts_per_page = POSTS_PER_PAGE;
    $firstPostNumber = POSTS_PER_PAGE;

    $argsPosts = [
        "post_type"      => "art",
        "posts_per_page" => $posts_per_page,
        "s"              => $searchQuery,
        "paged" => $currentPage,
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

    if (!empty($select)) {
        $argsPosts["meta_query"][] = array(
            "key" => "art_size",
            "value" => $select, 
            "compare" => "IN",
        );
    }

    if (isset($minPrice) && isset($maxPrice)) {
        $argsPosts["meta_query"][] = array(
            "relation" => "AND",
            array(
                "key" => "art_price",
                "value" => $minPrice,
                "compare" => ">=",
                "type" => "NUMERIC",
            ),
            array(
                "key" => "art_price",
                "value" => $maxPrice,
                "compare" => "<=",
                "type" => "NUMERIC",
            ),
        );
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

            $post_data = [
                "title" => get_the_title(),
                "image_url" => $image["url"],
                "size" => $size,
                "price" => $price,
                "slug" => $slug,
            ];
            $posts[] = $post_data;
        }

        $artColumn = [];

        for ($i = 0; $i < GALLERY_COLUMN_COUNT; $i++) {
            $artColumn[$i] = array();
        }

        $i = 0;

        foreach( $posts as $post ) {
            array_push($artColumn[$firstPostNumber % GALLERY_COLUMN_COUNT], $post);
            $firstPostNumber++;
        }
    }

    header("Content-Type: application/json");
    echo json_encode($artColumn);

    wp_die(); 
}

?>