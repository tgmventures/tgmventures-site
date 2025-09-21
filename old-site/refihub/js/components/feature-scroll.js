// Note: This implementation focuses on smoothness for infinite scroll.

document.addEventListener('DOMContentLoaded', () => {
    const scrollGallery = document.querySelector('.feature-scroll-gallery');
    const scrollContainer = document.querySelector('.feature-scroll-container');
    const cardSet = scrollContainer?.querySelector('.feature-card-set');
    const paddleLeft = document.querySelector('.feature-scroll-paddle-left');
    const paddleRight = document.querySelector('.feature-scroll-paddle-right');

    if (!scrollContainer || !cardSet) {
        console.warn('Feature scroll container or card set not found. Infinite scroll disabled.');
        if(scrollGallery && scrollGallery.querySelector('.feature-scroll-paddles')) {
             scrollGallery.querySelector('.feature-scroll-paddles').style.display = 'none';
        }
        return;
    }

    let originalItems = Array.from(cardSet.children).filter(el => !el.classList.contains('clone'));
    let numOriginalItems = originalItems.length;
    if (numOriginalItems === 0) {
         if(scrollGallery && scrollGallery.querySelector('.feature-scroll-paddles')) {
             scrollGallery.querySelector('.feature-scroll-paddles').style.display = 'none';
        }
        return;
    }

    // --- Configuration ---
    const cloneCount = Math.min(numOriginalItems, 5); 
    const scrollAmount = 320; 
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
        // Ensure itemWidth is calculated correctly, considering potential display issues
        const width = firstItem.offsetWidth;
        const marginRight = parseFloat(style.marginRight) || 0;
        if (width === 0) { // Item might be hidden or not rendered yet
            console.warn("Could not calculate item width accurately.")
            return 0;
        }
        itemWidth = width + marginRight;
        totalOriginalWidth = itemWidth * numOriginalItems;

        let calculatedPrependedWidth = 0;
        cardSet.querySelectorAll('.clone-prepended').forEach(clone => {
             const cloneStyle = window.getComputedStyle(clone);
             calculatedPrependedWidth += clone.offsetWidth + (parseFloat(cloneStyle.marginRight) || 0);
        });
        // console.log(`Calculated Metrics: itemWidth=${itemWidth}, totalOriginalWidth=${totalOriginalWidth}, prependedWidth=${calculatedPrependedWidth}`);
        return calculatedPrependedWidth; // Return prependedWidth for setup
    };

    // --- DOM Manipulation --- 
    const setupClones = () => {
        isJumping = true; // Prevent scroll events during setup
        // Clear existing clones 
        cardSet.querySelectorAll('.clone').forEach(clone => clone.remove());
        originalItems = Array.from(cardSet.children); // Re-query original items
        numOriginalItems = originalItems.length;

        if (numOriginalItems === 0) {
            isJumping = false;
            return;
        }

        // Prepend clones
        for (let i = 0; i < cloneCount; i++) {
            const itemToClone = originalItems[numOriginalItems - 1 - i % numOriginalItems];
             if (!itemToClone) continue; // Safety check
            const clone = itemToClone.cloneNode(true);
            // Add specific theme class based on original item's index (modulo N for repeats)
            const originalIndex = numOriginalItems - 1 - i % numOriginalItems;
            clone.classList.add(`card-theme-${(originalIndex % 16) + 1}`); // Cycle through 16 themes
            clone.classList.add('clone', 'clone-prepended');
            clone.setAttribute('aria-hidden', 'true');
            cardSet.insertBefore(clone, cardSet.firstChild);
        }

        // Append clones
        for (let i = 0; i < cloneCount; i++) {
            const itemToClone = originalItems[i % numOriginalItems];
             if (!itemToClone) continue; // Safety check
            const clone = itemToClone.cloneNode(true);
            // Add specific theme class based on original item's index
            const originalIndex = i % numOriginalItems;
            clone.classList.add(`card-theme-${(originalIndex % 16) + 1}`); // Cycle through 16 themes
            clone.classList.add('clone', 'clone-appended');
            clone.setAttribute('aria-hidden', 'true');
            cardSet.appendChild(clone);
        }

        prependedWidth = calculateMetrics(); // Calculate widths after cloning

        // Set initial position silently - use RAF to ensure it happens after DOM updates
        requestAnimationFrame(() => {
            scrollContainer.scrollLeft = prependedWidth;
            scrollContainer.dataset.initialScroll = prependedWidth;
             // console.log("Clones set up, initial scrollLeft:", prependedWidth);
            // Release jump lock after setting initial scroll
            requestAnimationFrame(() => { isJumping = false; }); 
        });
    };

    // --- Scroll Event Handler --- 
    const handleInfiniteScroll = () => {
        if (isJumping || isPointerDown) return; // Don't jump if pointer is down or already jumping

        const currentScroll = scrollContainer.scrollLeft;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const jumpThreshold = itemWidth * jumpThresholdMultiplier;

        if (totalOriginalWidth <= 0 || itemWidth <= 0) { 
            // console.warn("Metrics not ready, skipping infinite scroll check.");
            return; // Avoid issues if metrics aren't calculated yet
        }

        let newScrollLeft = currentScroll;
        let jumped = false;

        // Check if near the end (use > for stricter condition)
        if (currentScroll > maxScroll - jumpThreshold) {
            newScrollLeft = currentScroll - totalOriginalWidth;
            // console.log(`Near End: Trigger jump from ${currentScroll} to ${newScrollLeft}`);
            jumped = true;
        // Check if near the beginning (use < for stricter condition)
        } else if (currentScroll < jumpThreshold) { 
            newScrollLeft = currentScroll + totalOriginalWidth;
            // console.log(`Near Start: Trigger jump from ${currentScroll} to ${newScrollLeft}`);
            jumped = true;
        }

        if (jumped) {
            isJumping = true;
            // Apply the jump
            scrollContainer.scrollLeft = newScrollLeft;
            // Use RAF to release the lock *after* the browser has likely painted the change
             cancelAnimationFrame(rafJumpId); // Cancel previous pending release if any
             rafJumpId = requestAnimationFrame(() => {
                isJumping = false;
                // console.log("Jump lock released");
            });
        }
    };

    // Use RAF for scroll event handling to improve smoothness
    const throttledScrollHandler = () => {
        if (!isJumping && !isPointerDown) { // Only check when not jumping or dragging
            cancelAnimationFrame(rafScrollId); // Throttle checks
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
        cancelAnimationFrame(rafScrollId); // Stop scroll checks while dragging
        cancelAnimationFrame(rafJumpId); // Cancel any pending jump flag release
        isJumping = false; // Ensure dragging overrides any pending jump release
    };

    const pointerUp = () => {
        if (!isPointerDown) return;
        isPointerDown = false;
        scrollContainer.classList.remove('active');
        scrollContainer.style.cursor = 'grab';
        scrollContainer.style.userSelect = '';
        // Trigger a scroll check after dragging stops
        throttledScrollHandler();
        // Delay resetting isDragging slightly 
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
             // Prevent default for touchmove ONLY if dragging horizontally enough
            if (e.touches && e.cancelable) {
                 e.preventDefault(); 
            }
            // Direct scroll manipulation during drag
            scrollContainer.scrollLeft = scrollLeftStart - walk * dragMultiplier;
        } 
    };

    // --- Event Listeners Setup --- 
    // Mouse
    scrollContainer.addEventListener('mousedown', pointerDown);
    scrollContainer.addEventListener('mouseleave', pointerUp); 
    scrollContainer.addEventListener('mouseup', pointerUp);
    scrollContainer.addEventListener('mousemove', pointerMove);
    // Touch
    scrollContainer.addEventListener('touchstart', pointerDown, { passive: true });
    scrollContainer.addEventListener('touchend', pointerUp);
    scrollContainer.addEventListener('touchcancel', pointerUp);
    scrollContainer.addEventListener('touchmove', pointerMove, { passive: false });

    // Prevent clicks after dragging
    scrollContainer.querySelectorAll('.feature-scroll-item a, .feature-scroll-item button').forEach(el => {
        let clickStartX, clickStartY;
        el.addEventListener('mousedown', (e) => { clickStartX = e.clientX; clickStartY = e.clientY; }, true);
        el.addEventListener('mouseup', (e) => {
            // Allow click if pointer didn't move much OR if it wasn't a drag action
            const moved = Math.abs(e.clientX - clickStartX) > dragMoveThreshold || Math.abs(e.clientY - clickStartY) > dragMoveThreshold;
            if (isDragging || moved) { 
                // console.log("Preventing click due to drag/move");
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
        // Add similar logic for touch if needed, though drag flag should cover most cases
    });

    scrollContainer.style.cursor = 'grab';

    // --- Handle Clicks for Section Scrolling (using event delegation) ---
    cardSet.addEventListener('click', (e) => {
        // Find the clicked feature item, if any
        const clickedItem = e.target.closest('.feature-scroll-item');
        if (!clickedItem) return; // Clicked outside an item

        // Check if this click should be ignored due to dragging
        // Use the existing isDragging flag and timing checks
        const clickTime = Date.now();
        // Add a small buffer (50ms) to the threshold check to better catch drags ending close to the click time
        const isLikelyDrag = isDragging || (isPointerDown && (clickTime - dragStartTime > clickThreshold));

        if (isLikelyDrag) {
            // console.log("Ignoring click, likely part of a drag.");
            e.preventDefault(); // Prevent any default action (like following a link)
            e.stopPropagation(); // Stop propagation to prevent other listeners
            return;
        }


        // Get the target section ID from the clicked item's data attribute
        const targetSectionId = clickedItem.dataset.targetSection; // Assumes HTML has data-target-section="sectionId"

        if (targetSectionId) {
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                // console.log(`Scrolling to section: ${targetSectionId}`);
                e.preventDefault(); // Prevent default link behavior etc.
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); // scroll to top of section
            } else {
                console.warn(`Target section #${targetSectionId} not found for card:`, clickedItem);
            }
        }
        // else: No target section defined, allow default behavior.
    });

    // --- Paddle Logic --- 
    const updatePaddleVisibility = () => {
        if (!paddleLeft || !paddleRight || !scrollGallery) return;
        const paddlesContainer = scrollGallery.querySelector('.feature-scroll-paddles');
        if (!paddlesContainer) return;
        const tolerance = 1;
        // Check based on *original* content width vs container width if needed, 
        // but usually checking scrollWidth > clientWidth is sufficient even with clones.
        const canScroll = scrollContainer.scrollWidth > scrollContainer.clientWidth + tolerance;
        paddlesContainer.style.display = canScroll ? 'flex' : 'none';
        if(canScroll){
            paddleLeft.disabled = false;
            paddleRight.disabled = false;
        }
    };

    if (paddleLeft && paddleRight && scrollGallery) {
        paddleLeft.addEventListener('click', () => {
            scrollContainer.scrollTo({
                left: scrollContainer.scrollLeft - scrollAmount,
                behavior: 'smooth'
            });
        });

        paddleRight.addEventListener('click', () => {
            scrollContainer.scrollTo({
                left: scrollContainer.scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        });

        window.addEventListener('resize', () => {
            // Re-initialize fully on resize for simplicity and accuracy
            setupClones(); 
            updatePaddleVisibility();
        });
        // Initial visibility check happens after setupClones

    } else {
        if (scrollGallery && scrollGallery.querySelector('.feature-scroll-paddles')) {
            scrollGallery.querySelector('.feature-scroll-paddles').style.display = 'none';
        }
        if (!paddleLeft || !paddleRight) console.warn('Feature scroll paddles not found.');
    }

     // --- Initial Setup ---
    setupClones(); 
    if (paddleLeft && paddleRight && scrollGallery) {
         updatePaddleVisibility(); // Call visibility check after initial clones
    }

}); 