class ProgressBar {
    constructor(progress, backgroundId) {
        this.progress = progress;
        this.backgroundId = backgroundId;
    }

    blurBackground(isBlured) {
        if(isBlured) {
            document.querySelector(this.backgroundId).classList.add("blured");
        } else {
            document.querySelector(this.backgroundId).classList.remove("blured");
        }
    
    }
    
    incProgressBar() {
        this.progress++;
        this.setValue(this.progress);
        if(this.progress == progressBar.max) {
            this.blurBackground(false);
            this.displayProgress(false);
        }
    }
    
    setMax(max) {
        const progressBar = this.getProgressBar();
        progressBar.max = max;
    }
    
    setValue(value) {
        const progressBar = this.getProgressBar();
        progressBar.value = value;
    }
    
    initProgress() {
        this.blurBackground(true);
        this.displayProgress(true);
        this.progress = 0;
        this.setValue(0);
        this.setMax(0);
    }
    
    displayProgress(isDisplayed) {
        if(isDisplayed) {
            document.querySelector(".ontop").style.visibility = 'visible';
        } else {
            this.blurBackground(false);
            document.querySelector(".ontop").style.visibility = 'hidden';
        }
    }
    
    getProgressBar() {
        return document.querySelector("progress");
    }
};



export {ProgressBar};