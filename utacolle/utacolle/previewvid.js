(() => {
    if (window.VideoPreviewLoaded) return;
    window.VideoPreviewLoaded = true;

    const createPreviewElement = () => {
        const preview = document.createElement("div");
        preview.className = "video-preview-container";

        const iframe = document.createElement("iframe");
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "1");

        preview.appendChild(iframe);
        document.body.appendChild(preview);

        return { container: preview, iframe };
    };

    const previewElements = createPreviewElement();
    let hideTimeout;

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

    const showPreview = (event) => {
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
        hideTimeout = setTimeout(() => {
            previewElements.container.style.display = "none";
            previewElements.iframe.src = "";
        }, 300);
    };

    const initVideoLinks = () => {
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

        previewElements.container.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
        previewElements.container.addEventListener("mouseleave", hidePreview);
    };

    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", initVideoLinks)
        : initVideoLinks();

    new MutationObserver((mutations) => {
        if (mutations.some((mutation) => mutation.addedNodes.length)) {
            initVideoLinks();
        }
    }).observe(document.body, { childList: true, subtree: true });
})();
