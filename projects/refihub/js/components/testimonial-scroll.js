// Note: This implementation focuses on smoothness for infinite scroll.

document.addEventListener('DOMContentLoaded', () => {
    const scrollGallery = document.querySelector('.testimonial-scroll-gallery');
    const scrollContainer = document.querySelector('.testimonial-scroll-container');
    const cardSet = scrollContainer?.querySelector('.testimonial-card-set');

    if (!scrollContainer || !cardSet) {
        console.warn('Testimonial scroll container or card set not found. Infinite scroll disabled.');
        return;
    }

    let originalItems = Array.from(cardSet.children).filter(el => !el.classList.contains('clone'));
    let numOriginalItems = originalItems.length;
    if (numOriginalItems === 0) {
        return;
    }

    // --- Configuration ---
    const cloneCount = Math.min(numOriginalItems, 5); 
    const scrollAmount = 320; // Adjust if testimonial card width differs significantly
    const dragMultiplier = 1.5; 
    const clickThreshold = 150; 
    const dragMoveThreshold = 5; 
    const jumpThresholdMultiplier = 1.5; 

    // --- State Variables ---
    let isPointerDown = false;
    let startX;
    let scrollLeftStart;
    let isDragging = false;
    let dragStartTime = 0;
    let itemWidth = 0; 
    let totalOriginalWidth = 0;
    let prependedWidth = 0;
    let isJumping = false; 
    let rafScrollId = null; // ID for scroll event RAF throttling
    let rafJumpId = null; // ID for jump flag release RAF

    // --- Calculation Functions --- 
    const calculateMetrics = () => {
        if (originalItems.length === 0) return 0;
        const firstItem = originalItems[0];
        const style = window.getComputedStyle(firstItem);
        const width = firstItem.offsetWidth;
        const marginRight = parseFloat(style.marginRight) || 0;
        if (width === 0) { 
            console.warn("Could not calculate testimonial item width accurately.")
            return 0;
        }
        itemWidth = width + marginRight;
        totalOriginalWidth = itemWidth * numOriginalItems;

        let calculatedPrependedWidth = 0;
        cardSet.querySelectorAll('.clone-prepended').forEach(clone => {
             const cloneStyle = window.getComputedStyle(clone);
             calculatedPrependedWidth += clone.offsetWidth + (parseFloat(cloneStyle.marginRight) || 0);
        });
        return calculatedPrependedWidth;
    };

    // --- DOM Manipulation --- 
    const setupClones = () => {
        isJumping = true; 
        cardSet.querySelectorAll('.clone').forEach(clone => clone.remove());
        originalItems = Array.from(cardSet.children); 
        numOriginalItems = originalItems.length;

        if (numOriginalItems === 0) {
            isJumping = false;
            return;
        }

        // Prepend clones
        for (let i = 0; i < cloneCount; i++) {
            const itemToClone = originalItems[numOriginalItems - 1 - i % numOriginalItems];
             if (!itemToClone) continue; 
            const clone = itemToClone.cloneNode(true);
            clone.classList.add('clone', 'clone-prepended');
            clone.setAttribute('aria-hidden', 'true');
            cardSet.insertBefore(clone, cardSet.firstChild);
        }

        // Append clones
        for (let i = 0; i < cloneCount; i++) {
            const itemToClone = originalItems[i % numOriginalItems];
             if (!itemToClone) continue;
            const clone = itemToClone.cloneNode(true);
            clone.classList.add('clone', 'clone-appended');
            clone.setAttribute('aria-hidden', 'true');
            cardSet.appendChild(clone);
        }

        prependedWidth = calculateMetrics();

        requestAnimationFrame(() => {
            scrollContainer.scrollLeft = prependedWidth;
            scrollContainer.dataset.initialScroll = prependedWidth;
            requestAnimationFrame(() => { isJumping = false; }); 
        });
    };

    // --- Scroll Event Handler --- 
    const handleInfiniteScroll = () => {
        if (isJumping || isPointerDown) return;

        const currentScroll = scrollContainer.scrollLeft;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const jumpThreshold = itemWidth * jumpThresholdMultiplier;

        if (totalOriginalWidth <= 0 || itemWidth <= 0) { 
            return;
        }

        let newScrollLeft = currentScroll;
        let jumped = false;

        if (currentScroll > maxScroll - jumpThreshold) {
            newScrollLeft = currentScroll - totalOriginalWidth;
            jumped = true;
        } else if (currentScroll < jumpThreshold) { 
            newScrollLeft = currentScroll + totalOriginalWidth;
            jumped = true;
        }

        if (jumped) {
            isJumping = true;
            scrollContainer.scrollLeft = newScrollLeft;
            cancelAnimationFrame(rafJumpId);
            rafJumpId = requestAnimationFrame(() => {
                isJumping = false;
            });
        }
    };

    const throttledScrollHandler = () => {
        if (!isJumping && !isPointerDown) {
            cancelAnimationFrame(rafScrollId);
            rafScrollId = requestAnimationFrame(handleInfiniteScroll);
        }
    };

    scrollContainer.addEventListener('scroll', throttledScrollHandler);

    // --- Drag/Swipe Logic --- 
    const pointerDown = (e) => {
        isPointerDown = true;
        isDragging = false;
        dragStartTime = Date.now();
        startX = (e.pageX || e.touches[0].pageX) - scrollContainer.offsetLeft;
        scrollLeftStart = scrollContainer.scrollLeft;
        scrollContainer.classList.add('active');
        scrollContainer.style.cursor = 'grabbing';
        scrollContainer.style.userSelect = 'none';
        cancelAnimationFrame(rafScrollId);
        cancelAnimationFrame(rafJumpId);
        isJumping = false;
    };

    const pointerUp = () => {
        if (!isPointerDown) return;
        isPointerDown = false;
        scrollContainer.classList.remove('active');
        scrollContainer.style.cursor = 'grab';
        scrollContainer.style.userSelect = '';
        throttledScrollHandler();
        setTimeout(() => { isDragging = false; }, 50); 
    };

    const pointerMove = (e) => {
        if (!isPointerDown) return;
        const x = (e.pageX || e.touches[0].pageX) - scrollContainer.offsetLeft;
        const walk = (x - startX);

        if (Math.abs(walk) > dragMoveThreshold || isDragging) {
             if (!isDragging) {
                 window.getSelection()?.removeAllRanges();
            }
            isDragging = true;
            if (e.touches && e.cancelable) {
                 e.preventDefault(); 
            }
            scrollContainer.scrollLeft = scrollLeftStart - walk * dragMultiplier;
        } 
    };

    // --- Event Listeners Setup --- 
    scrollContainer.addEventListener('mousedown', pointerDown);
    scrollContainer.addEventListener('mouseleave', pointerUp); 
    scrollContainer.addEventListener('mouseup', pointerUp);
    scrollContainer.addEventListener('mousemove', pointerMove);
    scrollContainer.addEventListener('touchstart', pointerDown, { passive: true });
    scrollContainer.addEventListener('touchend', pointerUp);
    scrollContainer.addEventListener('touchcancel', pointerUp);
    scrollContainer.addEventListener('touchmove', pointerMove, { passive: false });

    // Simplified click prevention for potential links/buttons *within* testimonials (if any)
    cardSet.addEventListener('click', (e) => {
        if(isDragging) {
            // Find if the click target is inside a link or button
            const interactiveElement = e.target.closest('a, button');
            if (interactiveElement) {
                 console.log("Preventing click on interactive element due to drag.");
                 e.preventDefault();
                 e.stopPropagation();
            }
        }
    }, true); // Use capture phase

    scrollContainer.style.cursor = 'grab';

    // --- Initial Setup ---
    setupClones(); 

}); 