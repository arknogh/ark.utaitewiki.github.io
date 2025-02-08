(() => {
    if (window.VideoPreviewLoaded) return;
    window.VideoPreviewLoaded = true;

    let previewElements = null;

    const createPreviewElement = () => {
        const preview = document.createElement("div");
        preview.className = "video-preview-container";
        preview.style.cssText = "display: none; position: absolute; z-index: 1000; background: #000; padding: 10px; border-radius: 4px;";

        const iframe = document.createElement("iframe");
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "1");
        iframe.style.cssText = "width: 320px; height: 180px;";

        preview.appendChild(iframe);
        document.body.appendChild(preview);

        return { container: preview, iframe };
    };

    const getVideoDetails = (href) => {
        const ytMatch = href.match(/(?:v=|be\/)([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
            return {
                type: "youtube",
                id: ytMatch[1],
                embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`,
            };
        }

        const nndMatch = href.match(/(?:nicovideo\.jp\/watch\/)?(sm\d+)/);
        if (nndMatch) {
            return {
                type: "niconico",
                id: nndMatch[1],
                embedUrl: `https://embed.nicovideo.jp/watch/${nndMatch[1]}?autoplay=1&mute=1`,
            };
        }

        return null;
    };

    let hideTimeout;

    const showPreview = (event) => {
        if (!previewElements) return;
        
        const target = event.target;
        const href = target.getAttribute("href");
        const videoDetails = getVideoDetails(href);
        if (!videoDetails) return;

        clearTimeout(hideTimeout);

        const rect = target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        Object.assign(previewElements.container.style, {
            top: `${rect.bottom + scrollTop + 10}px`,
            left: `${rect.left + scrollLeft}px`,
            display: "block",
        });

        previewElements.container.className = `video-preview-container ${videoDetails.type}`;
        previewElements.iframe.src = videoDetails.embedUrl;
    };

    const hidePreview = () => {
        if (!previewElements) return;
        
        hideTimeout = setTimeout(() => {
            previewElements.container.style.display = "none";
            previewElements.iframe.src = "";
        }, 300);
    };

    const initVideoLinks = () => {
        // Create preview elements if they don't exist
        if (!previewElements && document.body) {
            previewElements = createPreviewElement();
        }

        document.querySelectorAll(
            'a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href*="nicovideo.jp/watch/"]'
        ).forEach((link) => {
            if (link.getAttribute("data-preview-initialized")) return;

            const href = link.getAttribute("href");
            if (!getVideoDetails(href)) return;

            link.setAttribute("data-preview-initialized", "true");
            link.addEventListener("mouseenter", showPreview);
            link.addEventListener("mouseleave", hidePreview);
        });

        if (previewElements) {
            previewElements.container.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
            previewElements.container.addEventListener("mouseleave", hidePreview);
        }
    };

    // Initialize when DOM is ready
    const initializeObserver = () => {
        if (document.body) {
            // Start observing only when body is available
            new MutationObserver((mutations) => {
                if (mutations.some((mutation) => mutation.addedNodes.length)) {
                    initVideoLinks();
                }
            }).observe(document.body, { childList: true, subtree: true });
            
            // Initial setup
            initVideoLinks();
        } else {
            // If body is not available yet, wait and try again
            setTimeout(initializeObserver, 100);
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeObserver);
    } else {
        initializeObserver();
    }
})();