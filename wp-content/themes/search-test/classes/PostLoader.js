import { debounce, setLazyLoading } from "../helper.js";

export default class PostLoader {

    constructor() {
        this.page = document.getElementById("search-test");

        if (!this.page) {
            return;
        }

        this.currentPage = 1;

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
    }

    updateURL(loadMore = false) {
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

        this.sendDataToServer(filtersArray, searchQuery, select, minPrice, maxPrice, this.currentPage)
            .then(data => {
                filterResponse = data;
                return this.hidePosts(); 
            })
            .then(() => {
                this.changeGalleryContent(filterResponse);
                this.showPosts();
                setLazyLoading();
            })
            .catch(error => {
                console.error("Error outside the function:", error);
                throw error;
            });
    }

    changeGalleryContent(data) {
        const container = document.querySelector(".posts__gallery");
        container.innerHTML = "";

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

    sendDataToServer(filtersArray, searchQuery, select, minPrice, maxPrice, currentPage) {
        const formData = new FormData();
        const ADMIN_AJAX_URL = window.location.origin + "/wp-admin/admin-ajax.php";
    
        formData.append("action", "filter_ajax");
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

    hidePosts() {
        return new Promise(resolve => {
            const posts = document.querySelectorAll('.posts__container');
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

        const posts = document.querySelectorAll('.posts__container');

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

}
