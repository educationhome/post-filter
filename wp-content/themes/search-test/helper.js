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

export function setHistory() {
    if (document.querySelectorAll('.post__image')) {
        document.querySelectorAll('.post__image').forEach(post => {
            post.addEventListener('click', function() {
                history.pushState({}, '', window.location.href);
            });
        });
    }
}

export function backHistory() {
    if (document.getElementById('go-back')) {
        document.getElementById('go-back').addEventListener('click', function() {
            history.back();
        });
    }
}
