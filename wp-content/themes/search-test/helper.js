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