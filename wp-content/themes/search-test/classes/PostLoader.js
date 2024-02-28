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

        setLazyLoading();

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
