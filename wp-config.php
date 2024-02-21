<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/documentation/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'search-test' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', '' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'Ld[]{1cm4IIPemb6+5W50~(g. PIx7aD1#sTC^^p rdjN]}~ZCGmuD?fdNUBcnX/' );
define( 'SECURE_AUTH_KEY',  'dx-7}XCOm[e}upM5n}[d|Yc*noG;A)_<<2Iv0~%LDTBl7>.B1NL.}?No0dDQK4In' );
define( 'LOGGED_IN_KEY',    'g24_0>PK6I^INeyC*o=vbI]MelyQan3#j|zosAu@-]#Oj!_U`GHB*wXs!^PkG[-b' );
define( 'NONCE_KEY',        'xSU P`)qC}al9?zFEqXs]pXFaRjgphOZ(d83M}e<s!{!Bn4L:PvN,R^4)x1cR3=h' );
define( 'AUTH_SALT',        '[`>7F>AJ}AOBX b.n:}NgYjGrk9/wga>Co1-_n~0sp&RVS-V]YJ<r<@ep[hI)j3X' );
define( 'SECURE_AUTH_SALT', 'A I*K0}~d.OIP-]3K}</eF.2z4vxnt))&IO+gf>.|$k.OeSP>U-[X$6&=M!Qdo@.' );
define( 'LOGGED_IN_SALT',   '0t(bl9d|ViEXtIcgzU*&%JRY>jxfrxyEdG66f8-vw:Eftq?D}893CLTrJ3bfo)gS' );
define( 'NONCE_SALT',       'ri1-G]]@Jr$Y;=^rG-N*Vhm/xlx9X(bwc9.d$zNvT5HzMkDq*w7W[I.1yp^0=Q$2' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/documentation/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
