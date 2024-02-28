export default class PriceRangeUpdater {
    constructor() {
        this.element = document.querySelector(".price");

        if (!this.element) {
            return;
        }

        this.lowerInput = this.element.querySelector("#lower");
        this.upperInput = this.element.querySelector("#upper");
        this.minValueSpan = this.element.querySelector("#min-value");
        this.maxValueSpan = this.element.querySelector("#max-value");

        this.initListeners();
        this.updateValues();
    }

    initListeners() {
        this.lowerInput.addEventListener("input", () => this.handleLowerInput());
        this.upperInput.addEventListener("input", () => this.handleUpperInput());
    }

    handleLowerInput() {
        const lowerVal = parseInt(this.lowerInput.value);
        const upperVal = parseInt(this.upperInput.value);

        if (lowerVal > upperVal - 4) {
            this.upperInput.value = lowerVal + 4;

            if (upperVal == this.upperInput.max) {
                this.lowerInput.value = parseInt(this.upperInput.max) - 4;
            }
        }

        this.updateValues();
    }

    handleUpperInput() {
        const lowerVal = parseInt(this.lowerInput.value);
        const upperVal = parseInt(this.upperInput.value);

        if (upperVal < lowerVal + 4) {
            this.lowerInput.value = upperVal - 4;

            if (lowerVal == this.lowerInput.min) {
                this.upperInput.value = 4;
            }
        }

        this.updateValues();
    }

    updateValues() {
        this.minValueSpan.textContent = this.lowerInput.value;
        this.maxValueSpan.textContent = this.upperInput.value;

        // this.debounceLoadPosts();
    }
}

