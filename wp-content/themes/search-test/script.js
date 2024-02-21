if(document.querySelector(".search-methods")) {
    const query = document.getElementById("search");
    const filters = document.querySelectorAll(".filters__item");
    const selectElement = document.querySelectorAll(".sizes__item");
    // Debounce Function 

    function debounce(callback, wait) {
        let timeoutId = null;

        return (...args) => {
            clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                callback.apply(this, args);
            }, wait);
        };
    }

    // Load Posts

    async function loadPosts() {
        const searchQuery = query.value;
        const filtersArray = getActiveFilters();
        const select = getActiveSelects();
        const price = getMinMaxPrice();
    
        window.history.replaceState({}, "", queryUrl(filtersArray, searchQuery, select, price, true));
    
        document.querySelector(".posts__gallery").style.opacity = "0.2";
        document.querySelector(".svg").style.display = "block";
    
        try {
            // Get New Page (AJAX)
            const htmlString = await getNewPage(filtersArray, searchQuery, select, price, true);
    
            if (!htmlString) {
                return Promise.resolve();
            }
    
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            const postsGallery = doc.querySelector('.posts__gallery');
            document.querySelector('.posts__gallery').innerHTML = '';
            const posts = postsGallery.querySelectorAll(".post__image");
    
            if (posts.length === 0) {
                showNoPostsMessage();
            } else {
                posts.forEach(el => {
                    document.querySelector('.posts__gallery').appendChild(el.cloneNode(true));
                });
            }
        } finally {
            document.querySelector(".svg").style.display = "none";
            document.querySelector(".posts__gallery").style.opacity = "1";
    
            setLazyLoading();
        }
    }

    this.debounceLoadPosts = debounce(() => loadPosts(), 700);

    function showNoPostsMessage() {
        const noPostsContainer = document.createElement('div');
        noPostsContainer.classList.add('no-posts');
        
        const noPostsParagraph = document.createElement('p');
        noPostsParagraph.classList.add('no-posts__paragraph');
        noPostsParagraph.textContent = 'No posts founded';
        
        noPostsContainer.appendChild(noPostsParagraph);
        
        document.querySelector('.posts__gallery').appendChild(noPostsContainer);
    }

    // Get Active Filters

    function getActiveFilters() {
        let array = [];

        filters.forEach(filter => {
            if (filter.classList.contains("--is-active") && filter.dataset.filter && filter.dataset.filter.trim().length > 0) {
                array.push(filter.dataset.filter.trim());
            }
        });

        return array;
    }

    // Get Active Selects

    function getActiveSelects() {
        let selectArray = []; 

        selectElement.forEach(select => {
            if (select.classList.contains("--is-active") && select.dataset.size && select.dataset.size.trim().length > 0) {
                selectArray.push(select.dataset.size.trim());
            }
        });

        return selectArray;
    }

    // Get Query Url

    function queryUrl(filters = [], query = "", select = [], price="", override = false) {
        const currentURL = new URL(window.location.href);
        const params = currentURL.searchParams;
        
        if (override) {
            let count = 0;
            Array.from(currentURL.searchParams.entries()).forEach(el => {
                params.delete(`filters[${count}]`);
                count++;
            });

            count = 0;
            params.delete("filters[]");
            params.delete("query");
            Array.from(currentURL.searchParams.entries()).forEach(el => {
                params.delete(`sizes[${count}]`);
                count++;
            });
            params.delete("sizes[]");
            params.delete("price_range");
        }

        filters.forEach((filter) => {
            params.append("filters[]", filter);
        });

        select.forEach((size) => {
            params.append("sizes[]", size);
        })

        query.length === 0 ? params.delete('query') : params.set("query", query);
        price.length === 0 ? params.delete('price_range') : params.set("price_range", price);

        currentURL.searchParams = params;
        
        return currentURL.toString();
    }


    // Enable Filters 

    function enableFilters(element) {
        const $target = element.currentTarget;
        $target.classList.toggle("--is-active");
        this.debounceLoadPosts();
    }

    // Event Listener

    const filtersItem = document.querySelectorAll(".filters__item"); 

    filtersItem.forEach(item => {
        item.addEventListener("click", enableFilters.bind(this));
    });

    selectElement.forEach(item => {
        item.addEventListener("click", enableFilters.bind(this));
    });

    query.addEventListener("input", () => this.debounceLoadPosts());
    
    // document.querySelectorAll(".post__image").forEach(el => {
    //     el.addEventListener("click", saveHistory());
    // })

    // Get New Page 

    function getNewPage(filters = [], query = "", select = "", price = "") {
        const url = queryUrl(filters, query, select, price, true); 

        return new Promise((resolve) => {
            this.controller = new AbortController();

            fetch(url, { signal: this.controller.signal })
                .then(data => resolve(data.text()))
                .catch((error) => resolve(null));
        });
    }

    function getMinMaxPrice() {
        const lowerInput = document.getElementById('lower');
        const upperInput = document.getElementById('upper');

        return lowerInput.value + "-" + upperInput.value;
    }

    function setMinMaxPriceRange() {
        const lowerInput = document.getElementById('lower');
        const upperInput = document.getElementById('upper');
        const minValueSpan = document.getElementById('min-value');
        const maxValueSpan = document.getElementById('max-value');
    
        function updateValues() {
            minValueSpan.textContent = lowerInput.value;
            maxValueSpan.textContent = upperInput.value;

            this.debounceLoadPosts();
        }
    
        lowerInput.addEventListener('input', function () {
            const lowerVal = parseInt(lowerInput.value);
            const upperVal = parseInt(upperInput.value);
    
            if (lowerVal > upperVal - 4) {
                upperInput.value = lowerVal + 4;
    
                if (upperVal == upperInput.max) {
                    lowerInput.value = parseInt(upperInput.max) - 4;
                }
            }
    
            updateValues();
        });
    
        upperInput.addEventListener('input', function () {
            const lowerVal = parseInt(lowerInput.value);
            const upperVal = parseInt(upperInput.value);
    
            if (upperVal < lowerVal + 4) {
                lowerInput.value = upperVal - 4;
    
                if (lowerVal == lowerInput.min) {
                    upperInput.value = 4;
                }
            }
    
            updateValues();
        });

    }
    
    
    setMinMaxPriceRange();
    
    function saveHistory() {
        const searchQuery = query.value;
        const filtersArray = getActiveFilters();
        const select = getActiveSelects();
        const price = getMinMaxPrice();
    
        window.history.replaceState({}, "", queryUrl(filtersArray, searchQuery, select, price, true));
    }
}

// Lazy Loading

document.addEventListener("DOMContentLoaded", setLazyLoading);


function setLazyLoading() {
    var lazyLoadInstance = new LazyLoad({
        elements_selector: ".lazy"
    }); 
}


if (document.getElementById("art-page")) {
    document.getElementById("go-back").addEventListener("click", () => {
        history.back();
    });
}
