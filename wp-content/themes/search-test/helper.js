export function debounce(callback, wait) {
    let timeoutId = null;

    return (...args) => {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            callback.apply(this, args);
        }, wait);
    };
}

export function setLazyLoading() {
    window.lazyload = new LazyLoad({
        elements_selector: ".lazy"
    });
}

export const POSTS_PER_PAGE = 5;
export const GALLERY_COLUMN_COUNT = 3;

export function setHistory() {
    if (document.querySelectorAll(".post__image")) {
        document.querySelectorAll(".post__image").forEach(post => {
            post.addEventListener("click", function() {
                history.pushState({}, "", window.location.href);
            });
        });
    }
}

export function backHistory() {
    if (document.getElementById("go-back")) {
        document.getElementById("go-back").addEventListener("click", function() {
            history.back();
        });
    }
}

export function isArrayEmpty(array) {
    return array.every(subArray => Array.isArray(subArray) && subArray.length === 0);
}

export function getActiveItems(element) {
    let array = [];

    element.forEach(item => {
        if (item.checked && item.value) {
            array.push(item.value);
        }
    });

    return array;
}

export function removeArrayParams(params, currentURL, name = "") {
    Array.from(currentURL.searchParams.entries()).forEach(([key, value], index) => {
        params.delete(`${name}[${index}]`);
    });
}


export function clearSearchParams(params, ...keys) {
    keys.forEach(key => params.delete(key));
}
