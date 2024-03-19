import PriceRangeUpdater from "./classes/PriceRangeUpdater.js";
import PostLoader from "./classes/PostLoader.js";

import { setLazyLoading, backHistory } from "./helper.js";

setLazyLoading();
backHistory();

const priceRangeUpdater = new PriceRangeUpdater();

const postLoader = new PostLoader();


