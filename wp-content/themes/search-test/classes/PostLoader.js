import { debounce, setLazyLoading, POSTS_PER_PAGE, setHistory } from "../helper.js";

export default class PostLoader {

    constructor() {
        this.page = document.getElementById("search-test");
        this.posts = document.querySelector(".posts");

        if (!this.page || !this.posts) {
            return;
        }

        this.currentPage = this.queryCurrentPage;

        this.debounceLoadPosts = debounce(() => this.updateURL(), 800);
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

        if (this.posts.querySelector("#load-more")) {
            this.posts.querySelector("#load-more").addEventListener("click", this.loadPosts.bind(this)); 
        }
    }

    loadPosts() {
        this.currentPage++;
        this.updateURL(true);
    }

    updateURL(loadMore = false) {
        if (!loadMore) {
            this.currentPage = 1;
        }
        
        const filters = this.page.querySelectorAll(".filters__checkbox");
        const selectElement = this.page.querySelectorAll(".sizes__checkbox");
        const query = this.page.querySelector("#query");
        const searchQuery = query.value;
        const filtersArray = this.getActiveItems(filters);
        const select = this.getActiveItems(selectElement);
        const minPrice = this.getPrice("lower");
        const maxPrice = this.getPrice("upper");
        
        window.history.replaceState({}, "", this.queryUrl(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage, true));

        let filterResponse;

        if (!loadMore) {
            this.sendDataToServer(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage, loadMore)
                .then(data => {
                    filterResponse = data;
                    return this.hidePosts();
                })
                .then(() => {
                    this.changeGalleryContent((filterResponse == null || this.isArrayEmpty(filterResponse)) ? 1 : 0, filterResponse);
                    setHistory();

                    if (!(filterResponse == null || this.isArrayEmpty(filterResponse))) {
                        if (!this.hasMoreElements(filterResponse)) {
                            document.getElementById("load-more").style.display = "none";
                        } else {
                            document.getElementById("load-more").style.display = "block";
                        }
                    }
                    
                    this.showPosts();
                    setLazyLoading();
                })
                .catch(error => {
                    console.error("Error outside the function:", error);
                    throw error;
                });
        } else {
            this.sendDataToServer(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage, loadMore)
                .then(data => {
                    this.addGalleryContent(data); 
                    setHistory();
                    if (!(data == null || this.isArrayEmpty(data))) {
                        if (!this.hasMoreElements(data)) {
                            document.getElementById("load-more").style.display = "none";
                        } else {
                            document.getElementById("load-more").style.display = "block";
                        }
                    }   
                    setLazyLoading();
                })
                .catch(error => {
                    console.error("Error outside the function:", error);
                    throw error;
                });
        }
    }

    hasMoreElements(data) {
        let sum = 0;
        data.forEach(subArray => {
            subArray.forEach(el => {
                sum++;
            });
        });

        if (sum < POSTS_PER_PAGE) {
            return false;
        }

        return true;
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

        if (!emptyArray) {
            data.forEach((group) => {
                const groupContainer = document.createElement("div");
                groupContainer.classList.add("posts__container");
                
                group.forEach(post => {
                    const titleElement = document.createElement("h3");
                    titleElement.textContent = post.title;
            
                    const imageElement = document.createElement("img");
                    imageElement.setAttribute("data-src", post.image_url);
                    imageElement.classList.add("lazy");
            
                    const priceParagraph = document.createElement("p");
                    priceParagraph.textContent = `US$${post.price}`;
            
                    const postContainer = document.createElement("a");
                    postContainer.classList.add("post__image");
                    postContainer.setAttribute("href", window.location.origin + "/art/" + post.slug);
            
                    postContainer.appendChild(imageElement);
                    postContainer.appendChild(titleElement);
                    postContainer.appendChild(priceParagraph);
                    groupContainer.appendChild(postContainer);
                });
            
                container.appendChild(groupContainer);
            });
        } else {
            const groupContainer = document.createElement("div");
            groupContainer.classList.add("posts__container");

            const noPostsDiv = document.createElement("div");
            noPostsDiv.classList.add("no-posts");

            const noPostsParagraph = document.createElement("p");
            noPostsParagraph.classList.add("no-posts__paragraph");
            noPostsParagraph.textContent = "No posts founded";

            noPostsDiv.appendChild(noPostsParagraph);
            groupContainer.appendChild(noPostsDiv);

            container.appendChild(groupContainer);
        }
    }

    queryUrl(filters = [], query = "", select = [], minPrice = 0, maxPrice = 0, page = 1, override = false) {
        const currentURL = new URL(window.location.href);
        const params = currentURL.searchParams;

        if (override) {
            Array.from(currentURL.searchParams.entries()).forEach(([key, value], index) => {
                params.delete(`filters[${index}]`);
            });

            params.delete("filters[]");
            params.delete("query");

            Array.from(currentURL.searchParams.entries()).forEach(([key, value], index) => {
                params.delete(`sizes[${index}]`);
            });

            params.delete("sizes[]");
            params.delete("min_price");
            params.delete("max_price");
            params.delete("art_page");
        }

        filters.forEach((filter) => {
            params.append("filters[]", filter);
        });
    
        select.forEach((size) => {
            params.append("sizes[]", size);
        });
    
        if (query.length === 0) {
            params.delete("query");
        } else {
            params.set("query", query);
        }
    
        if (minPrice == 0) {
            params.delete("min_price");
        } else {
            params.set("min_price", minPrice);
        }

        if (maxPrice == 0) {
            params.delete("max_price");
        } else {
            params.set("max_price", maxPrice);
        }
    
        if (page === 1) {
            params.delete("art_page");
        } else {
            params.set("art_page", page);
        }
    
        currentURL.search = params.toString();

        return currentURL.toString();
    }

    sendDataToServer(filtersArray, searchQuery, select, minPrice, maxPrice, currentPage, loadMore = false) {
        const formData = new FormData();
        const ADMIN_AJAX_URL = window.location.origin + "/wp-admin/admin-ajax.php";
    
        if (!loadMore) {
            formData.append("action", "filter_ajax"); 
        } else {
            formData.append("action", "add_posts_ajax"); 
        }
        
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

    isArrayEmpty(array) {
        return array.every(subArray => Array.isArray(subArray) && subArray.length === 0);
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
    
    hidePosts() {
        return new Promise(resolve => {
            const posts = document.querySelectorAll(".posts__container");
            let completedAnimations = 0;
    
            if(posts.length === 0) resolve();
    
            posts.forEach((post, index) => {
                gsap.to(post, {
                    opacity: 0,
                    y: -50,
                    delay: index * 0.2, 
                    duration: 0.3, 
                    onComplete: () => {
                        completedAnimations++;
                        if (completedAnimations === posts.length) {
                            const postContainer = document.querySelector(".posts__gallery");
                            postContainer.style.display = "none";
                            resolve(); 
                        }
                    },
                });
            });
        });
    }

    showPosts() {
        const postContainer = document.querySelector(".posts__gallery");
        postContainer.style.display = "flex";

        const posts = document.querySelectorAll(".posts__container");

        let startedAnimations = 0;

        posts.forEach((post, index) => {
           
            gsap.fromTo(post, 
                { opacity: 0, y: -50 },
                {
                    opacity: 1, 
                    y: 0, 
                    delay: index * 0.2,
                    duration: 0.3,
                    onStart: function() {
                        startedAnimations++;
                    },
                    onComplete: function() {
                        if (startedAnimations === posts.length) {
                           
                        }
                    },
                }
            );
        });
    }

    getPrice(name = "") {
        const input = document.getElementById(`${name}`);

        return input.value;
    }

    getActiveItems(element) {
        let array = [];
    
        element.forEach(item => {
            if (item.checked && item.value) {
                array.push(item.value);
            }
        });
    
        return array;
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
