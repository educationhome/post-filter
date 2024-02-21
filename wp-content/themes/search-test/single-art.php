<?php 

/**
 * Template Name: Single Art
*/

get_header();

the_post();

$postId = get_the_ID();
$image = get_field("art_image", $postId);
$size = get_field("art_size", $postId);
$price = get_field("art_price", $postId);
$color = wp_get_post_terms($postId, 'artworks_color_filter', ['hide_empty' => true]);

?>

<div id="art-page" data-template="art">
    
    <div class="back">
        <a href="#" id="go-back">
            <-- back
        </a>
    </div>
    <div class="art">
        <div class="art__container">
            <img data-src="<?php echo $image["url"]; ?>" class="lazy" width="700px" height="700px">
        </div>

        <div class="art__info">
            <h1><?php echo get_the_title($postId); ?></h1>
            <p>Size: <?php echo $size; ?></p>
            <div class="art__colors">
                <p>Colors </p> 
                <div class="colors">
                    <?php foreach ($color as $value): ?>
                    <div class="color" style="background-color: <?php echo $value->slug; ?>"></div>
                <?php endforeach; ?>
                </div>
                
            </div>

            <div class="art__price">
                <p>US$<?php echo $price; ?></p>
            </div>
        </div>
    </div>
    
</div>


<?php get_footer(); ?>