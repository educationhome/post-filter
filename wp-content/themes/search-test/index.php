<?php
get_header();

$pageId = get_the_ID();

$argsFilter = parseArtQueryArgs();

// Get Filters

$artFilters = get_terms([
    "taxonomy"=> "artworks_color_filter",
    "hide_empty"=> true,
]);

$argsFilter["min_price"] = intval($argsFilter["min_price"]);
$argsFilter["max_price"] = intval($argsFilter["max_price"]);

// Size Buttons

$artSizes = getArtSizes();
$highestArtPrice = getHighestArtPrice();

$page = $argsFilter["art_page"] ?? 1;
$posts_per_page = $page * POSTS_PER_PAGE;

$argsPosts = [
    "post_type"      => "art",
    "posts_per_page" => $posts_per_page,
];

if (!empty($argsFilter["query"])) {
    $argsPosts["s"] = $argsFilter["query"];
}

if (!empty($argsFilter["filters"])) {
    $argsPosts["tax_query"] = [
        [
            "taxonomy" => "artworks_color_filter",
            "field"    => "slug",
            "terms"    => $argsFilter["filters"],
        ],
    ];
}

if (!empty($argsFilter["sizes"])) {
    $argsPosts["meta_query"][] = array(
        "key" => "art_size",
        "value" => $argsFilter["sizes"],
        "compare" => "IN",
    );
}

if (isset($argsFilter["min_price"]) && isset($argsFilter["max_price"])) {
    $argsPosts["meta_query"][] = array(
        "relation" => "AND",
        array(
            "key" => "art_price",
            "value" => $argsFilter["min_price"],
            "compare" => ">=",
            "type" => "NUMERIC",
        ),
        array(
            "key" => "art_price",
            "value" => $argsFilter["max_price"],
            "compare" => "<=",
            "type" => "NUMERIC",
        ),
    );
}

$queryPosts = new WP_Query($argsPosts);
?>

<h1>Search Test</h1>

<div id="search-test">
    <form class="search-methods">

        <div class="search">
            <label class="search__label" for="query">
                Search: 
            </label>
            <input 
            type="text" 
            name="query" 
            id="query" 
            placeholder="Search by Art Title" 
            value="<?php echo !empty($argsFilter["query"]) ? $argsFilter["query"] : ""; ?>"
            >

            <button type="submit">
                Submit
            </button>
        </div>

        <div class="filters">
            <h2>
                Colors: 
            </h2>
            <?php foreach ($artFilters as $term): 
                $isChecked = is_array($argsFilter["filters"]) && in_array($term->slug, $argsFilter["filters"]);
                $labelClass = "filters__label" . ($isChecked ? " -is-active" : "");
            ?>
                <label class="<?php echo $labelClass; ?>">
                    <input 
                        type="checkbox" 
                        class="filters__checkbox" 
                        name="filters[]" 
                        value="<?php echo $term->slug; ?>" 
                        <?php if ($isChecked) echo "checked"; ?>
                        >
                    <?php echo $term->name; ?>
                </label>
            <?php endforeach; ?>
        </div>

        <div class="sizes">
            <h2>
                Sizes: 
            </h2>
            <?php foreach ($artSizes as $term):
                $isChecked = is_array($argsFilter["sizes"]) && in_array($term, $argsFilter["sizes"]);
                $labelClass = "sizes__label" . ($isChecked ? " -is-active" : "");
            ?>
                <label class="<?php echo $labelClass; ?>">
                    <input 
                        type="checkbox" 
                        class="sizes__checkbox" 
                        name="sizes[]" 
                        value="<?php echo $term; ?>" 
                        <?php if ($isChecked) echo "checked"; ?>
                        >
                    <?php echo $term; ?>
                </label>
            <?php endforeach; ?>
        </div>

        <div class="price">
            <label for="price" class="price__label">
                Price
            </label>
            <div class="prices">
                <div class="range-values">
                    <p>
                        Min: <span id="min-value"></span>
                    </p>
                    <p>
                        Max: <span id="max-value"></span>
                    </p>
                </div>
                
                <span class="multi-range">
                    <input 
                        type="range" 
                        min="0" 
                        max="<?php echo $highestArtPrice; ?>" 
                        value="<?php echo empty($argsFilter["min_price"]) ? 0 : $argsFilter["min_price"]; ?>" 
                        id="lower" 
                        step="1000"
                        name="min_price"
                    >

                    <input 
                        type="range" 
                        min="0" 
                        max="<?php echo $highestArtPrice; ?>" 
                        value="<?php echo empty($argsFilter["max_price"]) ? $highestArtPrice : $argsFilter["max_price"];?>" 
                        id="upper"
                        step="1000"
                        name="max_price"
                    >
                </span>
            </div>
        </div>

    </form>
</div>

<div class="posts">
    <h1>Result</h1>

    <section class="posts__gallery">
        <?php
        $matchingPosts = fetchMatchingPosts($queryPosts);
        $showMoreButton = !empty($matchingPosts) && count($matchingPosts) >= POSTS_PER_PAGE * $argsFilter["art_page"];
        ?>

        <?php if (empty($matchingPosts)): ?>
            <div class="posts__container">
                <div class="no-posts">
                    <p class="no-posts__paragraph">
                        No posts founded
                    </p>
                    <button id="clear-all-filters">
                        Clear All Filters
                    </button>
                </div>
            </div>

        <?php else: 
            for ($containerNum = 1; $containerNum <= GALLERY_COLUMN_COUNT; $containerNum++): ?>

                <div class="posts__container">
                    <?php for ($i = 0; $i < count($matchingPosts); $i++):
                        if ($i % GALLERY_COLUMN_COUNT == $containerNum - 1): ?>

                            <a class="post__image" href="<?php echo home_url() . "/art/" . get_post_field("post_name", $matchingPosts[$i]["postId"]); ?>">
                                <img 
                                    data-src="<?php echo $matchingPosts[$i]["image"]["url"]; ?>" 
                                    alt="<?php echo $matchingPosts[$i]["image"]["title"]; ?>" 
                                    class="lazy"
                                >
                                <h3>
                                    <?php echo $matchingPosts[$i]["title"]; ?>
                                </h3>
                                <p>
                                    US$<?php echo $matchingPosts[$i]["price"]; ?>
                                </p>
                            </a>

                        <?php endif;
                    endfor; ?>
                </div>
            <?php endfor;
        endif; ?>

    </section>
    
    <button class="load-more <?php if (empty($matchingPosts) || (!$showMoreButton)) { echo "--is-invisible"; } ?>" >
        Load More
    </button>
</div>

<?php 
get_footer();
?>