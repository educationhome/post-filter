<?php
get_header();

$pageId = get_the_ID();

$argsFilter = parseArtQueryArgs();
var_dump($argsFilter);
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
$posts_per_page = $page * 5;

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
            value="<?php echo !empty($argsFilter["query"]) ? $argsFilter['query'] : ""; ?>"
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
                        <?php if ($isChecked) echo 'checked'; ?>
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
                        <?php if ($isChecked) echo 'checked'; ?>
                        >
                    <?php echo $term; ?>
                </label>
            <?php endforeach; ?>
        </div>

        <div class="price">
            <label for="price" class="price__label">Price</label>
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
        $foundPosts = false;
        $totalContainers = 3;

        for ($containerNum = 1; $containerNum <= $totalContainers; $containerNum++): ?>
            <div class="posts__container container__<?php echo $containerNum; ?>">
                <?php 
                while ($queryPosts->have_posts()): $queryPosts->the_post();
                    $currentPost = $queryPosts->current_post + 1; 
                    
                    if ($currentPost % $totalContainers == $containerNum % $totalContainers):
                        $postId = get_the_ID();
                        $title = get_the_title($postId);
                        $image = get_field("art_image", $postId);
                        $size = get_field("art_size", $postId);
                        $price = intval(get_field("art_price", $postId));
                        
                        if ((in_array($size, $argsFilter["sizes"]) || empty($argsFilter["sizes"])) && ($price >= $argsFilter["min_price"] && $price <= $argsFilter["max_price"]) || (empty($argsFilter["min_price"]) && empty($argsFilter["max_price"]))):
                            $foundPosts = true; ?>
                            <a class="post__image" href="<?php echo home_url() . "/art/" . get_post_field('post_name', $postId); ?>">
                                <img data-src="<?php echo $image["url"]; ?>" alt="<?php echo $image["title"]; ?>" class="lazy">
                                <h3><?php echo $title; ?></h3>
                                <p>US$<?php echo $price; ?></p>
                            </a>
                        <?php endif; ?>
                    <?php endif;
                endwhile; ?>
            </div>
        <?php 
        endfor;
        ?>
    </section>

<?php 
get_footer();
?>