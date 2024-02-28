import PriceRangeUpdater from "./classes/PriceRangeUpdater.js";
import PostLoader from "./classes/PostLoader.js";

import { setLazyLoading } from "./helper.js";

setLazyLoading();

const priceRangeUpdater = new PriceRangeUpdater();

const postLoader = new PostLoader();

