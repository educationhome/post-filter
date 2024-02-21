<?php
get_header();

$pageId = get_the_ID();


// User Input + Validation

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
    'price_range' => FILTER_SANITIZE_FULL_SPECIAL_CHARS,
);

$argsFilter = filter_input_array(INPUT_GET, $args);

if (empty($argsFilter["filters"])) {
    $argsFilter["filters"] = [];
}

if(empty($argsFilter["sizes"])) {
    $argsFilter["sizes"] = [];
}

if(empty($argsFilter["price_range"])) {
    $argsFilter["price_range"] = "";
    $minPriceInput = 0;
    $maxPriceInput = 0; 
} else {
    list($minPriceInput, $maxPriceInput) = explode("-", $argsFilter["price_range"]);

    $minPriceInput = intval($minPriceInput);
    $maxPriceInput = intval($maxPriceInput); 
}

// Get Filters

$artFilters = get_terms([
    "taxonomy"=> "artworks_color_filter",
    "hide_empty"=> true,
]);

// Size Buttons

$artSizesArgs = array(
    "post_type" => "art",
    "posts_per_page" => -1, 
);

$queryArtSizes = new WP_Query($artSizesArgs);

$artSizes = [];

if ($queryArtSizes->have_posts()) {
    while ($queryArtSizes->have_posts()) {
        $queryArtSizes->the_post();
        $sizes = get_field("art_size", get_the_ID());
        if ($sizes && !in_array($sizes, $artSizes)) {
            $artSizes[] = $sizes;
        }
    }
}

if (empty($argsFilter["query"])) {
    $argsFilter["query"] = "";
}
// Query

$argsPosts = [
    "post_type"      => "art",
    "posts_per_page" => -1,
    "s" => $argsFilter["query"],
];

if (!empty($argsFilter["filters"])) {
    $argsPosts["tax_query"] = [
        [
            "taxonomy" => "artworks_color_filter",
            "field"    => "slug",
            "terms"    => $argsFilter["filters"],
        ],
    ];
}

$queryPosts = new WP_Query($argsPosts);

$sizesArray = array();

while ($queryPosts->have_posts()) {
    $queryPosts->the_post();
    $size = get_field("art_size", get_the_ID());

    if ($size && !in_array($size, $sizesArray)) {
        $sizesArray[] = $size;
    }
}

if (count($sizesArray) === 0) {
    $sizesArray = [];
}

$foundPosts = false;
?>

<h1>Search Test</h1>

<div class="search-methods">

    <div class="search">
        <label class="search__label" for="search">Search: </label>
        <input 
        type="text" 
        name="search" 
        id="search" 
        placeholder="Search by Art Title" 
        value="<?php if(!empty($argsFilter['query'])) { echo $argsFilter['query']; } ?>" >
    </div>

    <div class="filters">
        <h2>Colors: </h2>
        <?php foreach ($artFilters as $term) : ?>
            <?php 
                $filterClass = "filters__item";
                if (is_array($argsFilter["filters"]) && in_array($term->slug, $argsFilter["filters"])) {
                    $filterClass .= " --is-active";
                }
            ?>
            <button class="<?php echo $filterClass; ?>" data-filter="<?php echo $term->slug; ?>">
                <?php echo $term->name; ?>
            </button>
        <?php endforeach; ?>
    </div>

    <div class="sizes">
        <h2>Sizes: </h2>
        <?php foreach ($sizesArray as $term) : ?>
            <?php 
                $sizeClass = "sizes__item";
                if (is_array($argsFilter["sizes"]) && in_array($term, $argsFilter["sizes"]) ) {
                    $sizeClass .= " --is-active";
                }
            ?>
            <button class="<?php echo $sizeClass; ?>" data-size="<?php echo $term; ?>">
                <?php echo $term; ?>
            </button>
        <?php endforeach; ?>
    </div>

    <div class="price">
        <label for="price" class="price__label">Price</label>
        <div class="prices">
            <?php $maxPrice = 0; ?>
            <div class="range-values">
                <p>Min: <span id="min-value"><?php if (!empty($argsFilter["price_range"])) { echo $minPriceInput; } else { echo "0"; }?></span></p>
                <p>Max: <span id="max-value"><?php if (!empty($argsFilter["price_range"])) { echo $maxPriceInput; } else { echo $maxPrice; } ?></span></p>
            </div>
            <span class="multi-range">
                <?php
                while ($queryPosts->have_posts()): $queryPosts->the_post();
                    $postId = get_the_ID();
                    $price = get_field("art_price", $postId);
                    
                    if ($price > $maxPrice) {
                        $maxPrice = $price;
                    }

                endwhile; ?>
                <input type="range" min="0" max="<?php echo $maxPrice; ?>" value="<?php if (!empty($argsFilter["price_range"])) { echo $minPriceInput; } else { echo "0"; }?>" id="lower" step="1000">
                <input type="range" min="0" max="<?php echo $maxPrice; ?>" value="<?php if (!empty($argsFilter["price_range"])) { echo $maxPriceInput; } else { echo $maxPrice; } ?>" id="upper" step="1000">
            </span>
        </div>
        
    </div>
</div>

<div class="posts">
    <h1>Result</h1>
    <section class="posts__gallery">
        <?php while ($queryPosts->have_posts()): $queryPosts->the_post(); 
            $postId = get_the_ID();
            $title = get_the_title($postId);
            $image = get_field("art_image", $postId);
            $size = get_field("art_size", $postId);
            $price = intval(get_field("art_price", $postId));
            
            // check size
            if ((in_array($size, $argsFilter["sizes"]) || empty($argsFilter["sizes"])) && ($price >= $minPriceInput && $price <= $maxPriceInput) || (empty($minPriceInput) && empty($maxPriceInput))):
                $foundPosts = true;
            ?>

            <a class="post__image" href="<?php echo home_url() . "/art/" . get_post_field('post_name', $postId); ?>">
                <img data-src="<?php echo $image["url"]; ?>" alt="<?php echo $image["title"]; ?>" class="lazy">
                <h3><?php echo $title; ?></h3>
                <p>US$<?php echo $price; ?></p>
            </a>

            <?php endif; ?>
        <?php endwhile;  ?>
        <?php if (!$foundPosts): ?>
                <div class="no-posts">
                    <p class="no-posts__paragraph">No posts founded </p>
                </div>
        <?php endif; ?>
    </section>
    <div class="svg">
        <svg version="1.1" id="L4" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
            <circle fill="#000000" stroke="none" cx="6" cy="50" r="6">
                <animate
                attributeName="opacity"
                dur="1s"
                values="0;1;0"
                repeatCount="indefinite"
                begin="0.1"/>    
            </circle>
            <circle fill="#000000" stroke="none" cx="26" cy="50" r="6">
                <animate
                attributeName="opacity"
                dur="1s"
                values="0;1;0"
                repeatCount="indefinite" 
                begin="0.2"/>       
            </circle>
            <circle fill="#000000" stroke="none" cx="46" cy="50" r="6">
                <animate
                attributeName="opacity"
                dur="1s"
                values="0;1;0"
                repeatCount="indefinite" 
                begin="0.3"/>     
            </circle>
        </svg>
    </div>
</div>
<?php 
get_footer();
?>