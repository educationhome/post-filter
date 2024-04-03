import { 
    debounce, 
    setLazyLoading, 
    POSTS_PER_PAGE, 
    setHistory, 
    isArrayEmpty, 
    getActiveItems,
    removeArrayParams,
    clearSearchParams,
    GALLERY_COLUMN_COUNT,
} from "../helper.js";

export default class PostLoader {

    constructor() {
        this.page = document.getElementById("search-test");
        this.posts = document.querySelector(".posts");

        if (!this.page || !this.posts) {
            return;
        }

        this.currentPage = this.queryCurrentPage;

        this.loadingGif = document.querySelector(".loading-gif");

        this.debounceLoadPosts = debounce(() => this.updateURL(), 800);
        this.isPostsLoaded = false;

        this.addEvents();
    }

    addEvents() {
        this.page.querySelector("#query").addEventListener("input", this.debounceLoadPosts);
        
        this.page.querySelectorAll(".filters__checkbox").forEach(element => {
            element.addEventListener("change", this.debounceLoadPosts);
        });

        this.page.querySelectorAll(".sizes__checkbox").forEach(element => {
            element.addEventListener("change", this.debounceLoadPosts);
        });

        this.page.querySelector("#lower").addEventListener("change", this.debounceLoadPosts);
        this.page.querySelector("#upper").addEventListener("change", this.debounceLoadPosts);

        if (this.posts.querySelector(".load-more")) {
            this.posts.querySelector(".load-more").addEventListener("click", this.loadPosts.bind(this)); 
        }

        if (this.posts.querySelector("#clear-all-filters")) {
            this.posts.querySelector("#clear-all-filters").addEventListener("click", this.clearAllFilters.bind(this));
        }
        
        window.addEventListener("popstate", this.updateFilters.bind(this));
    }

    loadPosts() {
        this.currentPage++;
        this.updateURL(true);
    }

    async updateURL(loadMore = false, refreshPage = false) {
        if (!loadMore && !refreshPage) {
            this.currentPage = 1;
        }
        
        const filters = this.page.querySelectorAll(".filters__checkbox");
        const selectElement = this.page.querySelectorAll(".sizes__checkbox");
        const query = this.page.querySelector("#query");
        const searchQuery = query.value;
        const filtersArray = getActiveItems(filters);
        const select = getActiveItems(selectElement);
        const minPrice = this.getPrice("lower");
        const maxPrice = this.getPrice("upper");
        
        if (!refreshPage) {
            window.history.pushState({path: this.queryUrl(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage, true).toString()}, "", this.queryUrl(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage, true));
            window.history.replaceState({path: this.queryUrl(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage, true).toString()}, "", this.queryUrl(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage, true).toString());
        }

        try {
            this.showLoadingProcess();

            if (!refreshPage) {
                console.log("!refreshPage");
                const filterResponse = await this.sendDataToServer(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage, loadMore);
                const sortedResponse = this.sortResponse(loadMore, filterResponse);

                if (!loadMore) {
                    await this.hidePosts();
                    this.changeGalleryContent((filterResponse == null || isArrayEmpty(filterResponse)) ? 1 : 0, sortedResponse);
                } else {
                    this.addGalleryContent(sortedResponse);
                }

                this.updateLoadMoreButton(filterResponse);
            } else {
                if (this.currentPage == null) {
                    this.currentPage = 1;
                }

                for (let i = 1; i <= this.currentPage; i++) {
                    const filterResponse = await this.sendDataToServer(filtersArray, searchQuery, select, minPrice, maxPrice, i, loadMore);
                    console.log(filterResponse);
                    if (i == 1) {
                        const sortedResponse = this.sortResponse(loadMore, filterResponse);
                        this.changeGalleryContent((filterResponse == null || isArrayEmpty(filterResponse)) ? 1 : 0, sortedResponse);
                    } else {
                        const sortedResponse = this.sortResponse(!loadMore, filterResponse);
                        this.addGalleryContent(sortedResponse);
                    }

                    this.updateLoadMoreButton(filterResponse);
                }   
            }

            setHistory();

            if (!loadMore) {
                this.showPosts();
            }

            setLazyLoading();
            this.hideLoadingProcess();
        } 
        catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }



    updateLoadMoreButton(filterResponse) {
        if (!(isArrayEmpty(filterResponse))) {
            if (!this.hasMoreElements(filterResponse)) {
                this.hideLoadMoreButton();
            } else {
                this.showLoadMoreButton();
            }
        }
    }



    updateFilters() {
        const params = new URLSearchParams(window.location.search);

        document.getElementById("query").value = params.get("query") || "";
    
        const filterCheckboxes = document.querySelectorAll(".filters__checkbox");
        filterCheckboxes.forEach(checkbox => {
            checkbox.checked = params.getAll(checkbox.name).includes(checkbox.value);
        });

        const sizesCheckboxes = document.querySelectorAll(".sizes__checkbox");
        sizesCheckboxes.forEach(checkbox => {
            checkbox.checked = params.getAll(checkbox.name).includes(checkbox.value);
        });
    
        const minPrice = params.get("min_price");
        const maxPrice = params.get("max_price");

        if (minPrice) {
            document.querySelector("#lower").value = minPrice;
            document.querySelector("#min-value").textContent = minPrice;
        }
        if (maxPrice) {
            document.querySelector("#upper").value = maxPrice;
            document.querySelector("#max-value").textContent = maxPrice;
        }

        this.currentPage = params.get("art_page");

        this.updateURL(false, true);
    }



    sortResponse(loadMore, data = []) {
        let response = [];

        for (let i = 0; i < GALLERY_COLUMN_COUNT; i++) {
            response[i] = [];
        }

        if (!loadMore) {
            data.forEach((post, index) => {
                const bucketIndex = index % GALLERY_COLUMN_COUNT;
                response[bucketIndex].push(post);
            });
            return response;
        } else {
            let postImagesCount = document.querySelectorAll(".post__image").length;
            
            data.forEach((post) => {
                const bucketIndex = postImagesCount % GALLERY_COLUMN_COUNT;
                response[bucketIndex].push(post);
                postImagesCount++;
            });
            return response;
        }
    }



    hasMoreElements(data) {
        return data.flat().length >= POSTS_PER_PAGE;
    }



    addGalleryContent(data = []) {
        const containers = document.querySelectorAll(".posts__container");

        if (containers.length === 0) return;

        data.forEach((group, index) => {
            const container = containers[index];
    
            group.forEach(item => {
                const postElement = document.createElement("a");
                postElement.classList.add("post__image");
    
                const title = document.createElement("h3");
                title.textContent = item.title;
    
                const image = document.createElement("img");
                image.src = item.image_url;
                image.alt = item.title;
    
                const price = document.createElement("p");
                price.textContent = `Price: $${item.price}`;
    
                postElement.appendChild(image);
                postElement.appendChild(title);
                postElement.appendChild(price);
    
                container.appendChild(postElement);

                const totalExistingPosts = container.querySelectorAll(".post__image").length;
                this.animatePostElement(postElement, totalExistingPosts + index);
            });
        });
    }



    changeGalleryContent(emptyArray = 0, data = []) {
        const container = document.querySelector(".posts__gallery");
        container.innerHTML = "";

        if (!emptyArray && data.length > 0) {
            data.forEach(group => {
                const groupContainer = document.createElement("div");
                groupContainer.classList.add("posts__container");

                group.forEach(post => {
                    const postContainer = document.createElement("a");
                    postContainer.classList.add("post__image");
                    postContainer.setAttribute("href", `/art/${post.slug}`);
    
                    postContainer.innerHTML = `
                        <img class="lazy" data-src="${post.image_url}">
                        <h3>${post.title}</h3>
                        <p>US$${post.price}</p>
                    `;
    
                    groupContainer.appendChild(postContainer);
                });
    
                container.appendChild(groupContainer);
            });
            this.showLoadMoreButton();
        } else {
            const groupContainer = document.createElement("div");
            groupContainer.classList.add("posts__container");
    
            groupContainer.innerHTML = `
                <div class="no-posts">
                    <p class="no-posts__paragraph">
                        No posts founded
                    </p>
                    <button id="clear-all-filters">
                        Clear All Filters
                    </button>
                </div>
            `;
    
            this.hideLoadMoreButton();
            container.appendChild(groupContainer);

            document.querySelector("#clear-all-filters").addEventListener("click", this.clearAllFilters.bind(this));
        }
    }



    queryUrl(filters = [], query = "", select = [], minPrice = 0, maxPrice = 0, page = 1, override = false) {
        const currentURL = new URL(window.location.href);
        const params = currentURL.searchParams;

        if (override) {
            removeArrayParams(params, currentURL, "filters");
            removeArrayParams(params, currentURL, "sizes");
            clearSearchParams(params, "filters[]", "query", "sizes[]", "min_price", "max_price", "art_page");
        }

        filters.forEach((filter) => {
            params.append("filters[]", filter);
        });
    
        select.forEach((size) => {
            params.append("sizes[]", size);
        });
    
        if (query.length === 0) params.delete("query");
        else params.set("query", query);

        if (minPrice === 0) params.delete("min_price");
        else params.set("min_price", minPrice);

        if (maxPrice === 0) params.delete("max_price");
        else params.set("max_price", maxPrice);

        if (page === 1) params.delete("art_page");
        else params.set("art_page", page);
    
        currentURL.search = params.toString();

        return currentURL;
    }



    sendDataToServer(filtersArray, searchQuery, select, minPrice, maxPrice, currentPage, loadMore = false) {
        const formData = new FormData();
        const ADMIN_AJAX_URL = window.location.origin + "/wp-admin/admin-ajax.php";
    
        formData.append("action", "add_posts_ajax");
        formData.append("filtersArray", JSON.stringify(filtersArray));
        formData.append("searchQuery", searchQuery);
        formData.append("select", JSON.stringify(select));
        formData.append("minPrice", minPrice);
        formData.append("maxPrice", maxPrice);
        formData.append("currentPage", currentPage);
    
        return fetch(ADMIN_AJAX_URL, {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .catch(error => {
            console.error("Error:", error);
            throw error;
        });
    }


    
    animatePostElement(postElement, animationIndex) {
        gsap.fromTo(postElement, 
            { opacity: 0, y: -50 },
            {
                opacity: 1, 
                y: 0, 
                delay: animationIndex * 0.2,
                duration: 0.3
            }
        );
    }



    showLoadingProcess() {
        this.loadingGif.style.display = "flex";
        document.querySelector(".posts__gallery").style.opacity = 0.3;
    }



    hideLoadingProcess() {
        this.loadingGif.style.display = "none";
        document.querySelector(".posts__gallery").style.opacity = 1;
    }



    showLoadMoreButton() {
        document.querySelector(".load-more").classList.remove("--is-invisible");
    }


    
    hideLoadMoreButton() {
        document.querySelector(".load-more").classList.add("--is-invisible");
    }


    
    hidePosts() {
        return new Promise(resolve => {
            this.loadingGif.style.display = "flex";
            const posts = document.querySelectorAll(".posts__container");
    
            if(posts.length === 0) resolve();

            gsap.to(posts,  {
                opacity: 0,
                    y: -50,
                    stagger: 0.2, 
                    duration: 0.3,
                    onComplete: () => {
                        const postContainer = document.querySelector(".posts__gallery");
                        postContainer.style.display = "none";
                        resolve();
                }
            }) 
        });
    }



    showPosts() {
        const postContainer = document.querySelector(".posts__gallery");
        postContainer.style.display = "flex";
    
        const posts = document.querySelectorAll(".posts__container");
    
        gsap.fromTo(posts, {
            opacity: 0,
            y: -50
        }, {
            opacity: 1,
            y: 0,
            stagger: 0.2,
            duration: 0.3
        });
    }



    getPrice(name = "") {
        const input = document.getElementById(name);
        return input.value;
    }



    clearAllFilters() {
        const textInputs =  this.page.querySelectorAll(".search input[type='text']");
        textInputs.forEach(input => {
            input.value = "";
        });

        const checkboxes =  this.page.querySelectorAll(".filters input[type='checkbox'], .sizes input[type='checkbox']");
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        const lowerSlider = this.page.querySelector("#lower");
        const upperSlider = this.page.querySelector("#upper");
        const minValue = this.page.querySelector(".range-values #min-value");
        const maxValue = this.page.querySelector(".range-values #max-value");
        const formData = new FormData();
        const ADMIN_AJAX_URL = window.location.origin + "/wp-admin/admin-ajax.php";
    
        formData.append("action", "get_highest_price");
    
        fetch(ADMIN_AJAX_URL, {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const maxPrice = data;
            lowerSlider.value = 0;
            upperSlider.value = maxPrice;
            minValue.textContent = 0;
            maxValue.textContent = maxPrice;
        });

        this.debounceLoadPosts();
    }



    // Helper 

    get queryCurrentPage() {
        const url = this.currentUrlObject;

        return url.searchParams.get("art_page") ?? 1;
    }


    
    get currentUrlObject() {
        return new URL(window.location.href);
    }
}
