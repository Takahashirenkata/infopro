// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Initialize fullscreen mode
function initFullscreen() {
    // Request fullscreen mode when the app starts
    document.addEventListener('DOMContentLoaded', () => {
        // Check if the app is running in standalone mode (added to home screen)
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            
            // Request fullscreen on user interaction
            document.body.addEventListener('click', () => {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                }
            }, { once: true }); // Only trigger once
        }
    });

    // Handle screen orientation changes
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait')
            .catch(err => console.log('Orientation lock failed:', err));
    }

    // Handle Android Chrome's system UI
    if (navigator.userAgent.includes('Android')) {
        window.addEventListener('load', () => {
            // Add padding for system UI
            document.body.style.paddingTop = 'env(safe-area-inset-top)';
            document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
        });

        // Reapply fullscreen on resize
        window.addEventListener('resize', () => {
            if (document.fullscreenElement === null) {
                document.documentElement.requestFullscreen()
                    .catch(err => console.log('Fullscreen request failed:', err));
            }
        });
    }
}

// Call initialization
initFullscreen();

// State management
let state = {
    slides: [],
    currentSlideIndex: 0,
    highlightedWords: new Set(),
    comments: {} // Store comments by slide index
};

// DOM Elements
const landingPage = document.getElementById('landingPage');
const slidesContainer = document.getElementById('slidesContainer');
const textInput = document.getElementById('textInput');
const processButton = document.getElementById('processButton');
const importButton = document.getElementById('importButton');
const importFile = document.getElementById('importFile');
const saveButton = document.getElementById('saveButton');
const endSessionButton = document.getElementById('endSessionButton');
const addSlideButton = document.getElementById('addSlideButton');
const deleteSlideButton = document.getElementById('deleteSlideButton');
const toggleCompleteButton = document.getElementById('toggleCompleteButton');
const hamburgerMenu = document.getElementById('hamburgerMenu');
const highlightedWordsList = document.getElementById('highlightedWordsList');
const summaryPage = document.getElementById('summaryPage');
const summaryWordsList = document.getElementById('summaryWordsList');
const backToLandingButton = document.getElementById('backToLandingButton');

// Session Elements
const newSession = document.getElementById('newSession');
const resumeSession = document.getElementById('resumeSession');
const newButton = document.getElementById('newButton');
const resumeButton = document.getElementById('resumeButton');
const slideCount = document.getElementById('slideCount');
const wordCount = document.getElementById('wordCount');
const lastPosition = document.getElementById('lastPosition');

// Comment Elements
const commentSlideButton = document.getElementById('commentSlideButton');
const commentModal = document.getElementById('commentModal');
const commentInput = document.getElementById('commentInput');
const saveCommentButton = document.getElementById('saveCommentButton');
const closeCommentButton = document.getElementById('closeCommentButton');
const summaryCommentsList = document.getElementById('summaryCommentsList');

// Edit Elements
const editSlideButton = document.getElementById('editSlideButton');
const editModal = document.getElementById('editModal');
const editInput = document.getElementById('editInput');
const saveEditButton = document.getElementById('saveEditButton');
const closeEditButton = document.getElementById('closeEditButton');

// Event Listeners
processButton.addEventListener('click', processText);
importButton.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', handleImport);
saveButton.addEventListener('click', saveSession);
addSlideButton.addEventListener('click', addNewSlide);
deleteSlideButton.addEventListener('click', deleteCurrentSlide);
toggleCompleteButton.addEventListener('click', toggleSlideComplete);
newButton.addEventListener('click', showNewSession);
resumeButton.addEventListener('click', resumePreviousSession);
endSessionButton.addEventListener('click', handleEndSession);
backToLandingButton.addEventListener('click', showLandingPage);
commentSlideButton.addEventListener('click', openCommentModal);
saveCommentButton.addEventListener('click', saveComment);
closeCommentButton.addEventListener('click', closeCommentModal);
commentModal.addEventListener('click', (e) => {
    if (e.target === commentModal) closeCommentModal();
});
editSlideButton.addEventListener('click', openEditModal);
saveEditButton.addEventListener('click', saveEdit);
closeEditButton.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});

// Check for existing session on load
window.addEventListener('load', checkExistingSession);

// Session Management
function checkExistingSession() {
    const savedState = sessionStorage.getItem('infoproState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        updateSessionInfo(parsedState);
        showResumeSession();
    }
}

function updateSessionInfo(sessionState) {
    slideCount.textContent = sessionState.slides.length;
    wordCount.textContent = sessionState.highlightedWords.length;
    const position = sessionState.lastPosition || (sessionState.currentSlideIndex + 1);
    lastPosition.textContent = `Slide ${position}`;
}

function showNewSession() {
    newSession.classList.add('active');
    resumeSession.classList.remove('active');
}

function showResumeSession() {
    newSession.classList.remove('active');
    resumeSession.classList.add('active');
}

function resumePreviousSession() {
    const savedState = sessionStorage.getItem('infoproState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        state.slides = parsedState.slides;
        state.currentSlideIndex = parsedState.currentSlideIndex;
        state.highlightedWords = new Set(parsedState.highlightedWords);
        state.comments = parsedState.comments || {};
        showSlides();
        updateHighlightedWordsList();
    }
}

// Save current state to session storage
function saveCurrentState() {
    const stateToSave = {
        slides: state.slides,
        currentSlideIndex: state.currentSlideIndex,
        highlightedWords: Array.from(state.highlightedWords),
        lastPosition: state.currentSlideIndex + 1,
        comments: state.comments
    };
    sessionStorage.setItem('infoproState', JSON.stringify(stateToSave));
    updateSessionInfo(stateToSave);
}

// Modified checkSessionEnd function
function checkSessionEnd() {
    const shouldEnd = confirm('You\'ve reached the last slide. Would you like to end the session?');
    if (shouldEnd) {
        saveCurrentState();
        showSummaryPage();
    }
}

// Show summary page
function showSummaryPage() {
    slidesContainer.classList.remove('active');
    summaryPage.classList.add('active');
    renderSummaryWords();
}

// Show landing page
function showLandingPage() {
    summaryPage.classList.remove('active');
    landingPage.classList.add('active');
    showResumeSession();
}

// Render summary words
function renderSummaryWords() {
    summaryWordsList.innerHTML = '';
    state.highlightedWords.forEach(word => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'summary-word';
        wordDiv.textContent = word;
        summaryWordsList.appendChild(wordDiv);
    });

    // Render comments
    summaryCommentsList.innerHTML = '';
    Object.entries(state.comments).forEach(([slideIndex, comment]) => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        
        const slideNumber = document.createElement('div');
        slideNumber.className = 'comment-slide-number';
        slideNumber.textContent = `Slide ${parseInt(slideIndex) + 1}`;
        
        const commentText = document.createElement('div');
        commentText.className = 'comment-text';
        commentText.textContent = comment;
        
        commentDiv.appendChild(slideNumber);
        commentDiv.appendChild(commentText);
        summaryCommentsList.appendChild(commentDiv);
    });
}

// Modify existing functions to save state
function processText() {
    const text = textInput.value.trim();
    if (!text) return;

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    state.slides = sentences.map(sentence => ({
        text: sentence.trim(),
        completed: false
    }));
    state.currentSlideIndex = 0;
    state.highlightedWords.clear();
    
    saveCurrentState();
    showSlides();
}

// Update toggleHighlight function to rerender the current slide
function toggleHighlight(word) {
    if (state.highlightedWords.has(word)) {
        state.highlightedWords.delete(word);
    } else {
        state.highlightedWords.add(word);
    }
    
    // Update all instances of this word in the current slide
    const currentSlide = document.querySelector('.slide.current');
    if (currentSlide) {
        const wordElements = currentSlide.querySelectorAll('.word');
        wordElements.forEach(wordElement => {
            if (wordElement.textContent === word) {
                wordElement.classList.toggle('highlighted', state.highlightedWords.has(word));
            }
        });
    }
    
    updateHighlightedWordsList();
    saveCurrentState();
}

function addNewSlide() {
    const newText = prompt('Enter a new sentence:');
    if (newText) {
        state.slides.splice(state.currentSlideIndex + 1, 0, {
            text: newText.trim(),
            completed: false
        });
        state.currentSlideIndex++;
        saveCurrentState();
        renderCurrentSlide();
    }
}

function toggleSlideComplete() {
    state.slides[state.currentSlideIndex].completed = !state.slides[state.currentSlideIndex].completed;
    saveCurrentState();
    renderCurrentSlide();
}

// Mobile hamburger menu toggle
const hamburgerButton = hamburgerMenu.querySelector('.hamburger-button');
const menuContent = hamburgerMenu.querySelector('.menu-content');

hamburgerButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    const isOpen = menuContent.classList.contains('toggled');
    
    if (isOpen) {
        closeHamburgerMenu();
    } else {
        openHamburgerMenu();
    }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburgerMenu.contains(e.target)) {
        closeHamburgerMenu();
    }
});

// Prevent menu from closing when clicking inside menu content
menuContent.addEventListener('click', (e) => {
    e.stopPropagation();
});

function openHamburgerMenu() {
    menuContent.classList.add('toggled');
    hamburgerButton.classList.add('active');
}

function closeHamburgerMenu() {
    menuContent.classList.remove('toggled');
    hamburgerButton.classList.remove('active');
}

// Show slides view
function showSlides() {
    landingPage.classList.remove('active');
    slidesContainer.classList.add('active');
    renderCurrentSlide();
}

// Render current slide
function renderCurrentSlide() {
    // Keep track of existing slides
    const existingSlides = Array.from(slidesContainer.querySelectorAll('.slide'));
    
    // Create new slide if it doesn't exist
    const currentSlide = existingSlides.find(slide => 
        slide.dataset.index === state.currentSlideIndex.toString()
    ) || createSlide(state.currentSlideIndex);
    
    // Update slide positions
    existingSlides.forEach(slide => {
        const slideIndex = parseInt(slide.dataset.index);
        if (slideIndex < state.currentSlideIndex) {
            slide.className = 'slide previous';
        } else if (slideIndex === state.currentSlideIndex) {
            slide.className = `slide current${state.slides[slideIndex].completed ? ' completed' : ''}`;
        } else {
            slide.className = 'slide next';
        }
    });

    // Clean up slides that are too far from current (keep only adjacent slides)
    existingSlides.forEach(slide => {
        const slideIndex = parseInt(slide.dataset.index);
        if (Math.abs(slideIndex - state.currentSlideIndex) > 1) {
            slide.remove();
        }
    });

    // Create adjacent slides if they don't exist
    if (state.currentSlideIndex > 0) {
        const prevIndex = state.currentSlideIndex - 1;
        if (!slidesContainer.querySelector(`[data-index="${prevIndex}"]`)) {
            createSlide(prevIndex);
        }
    }
    if (state.currentSlideIndex < state.slides.length - 1) {
        const nextIndex = state.currentSlideIndex + 1;
        if (!slidesContainer.querySelector(`[data-index="${nextIndex}"]`)) {
            createSlide(nextIndex);
        }
    }
}

// Helper function to create a slide
function createSlide(index) {
    const slide = document.createElement('div');
    slide.className = index < state.currentSlideIndex ? 'slide previous' : 
                     index === state.currentSlideIndex ? 'slide current' : 'slide next';
    slide.dataset.index = index;

    const slideNumber = document.createElement('div');
    slideNumber.className = 'slide-number';
    slideNumber.textContent = `${index + 1}/${state.slides.length}`;

    const content = document.createElement('div');
    content.className = 'slide-content';
    
    // Split sentence into words
    const words = state.slides[index].text.split(/\s+/);
    
    // Calculate number of pages needed (15 words per page)
    const wordsPerPage = 15;
    const pages = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
        pages.push(words.slice(i, i + wordsPerPage));
    }
    
    // Create horizontal slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'horizontal-slider-container';
    
    // Create slider for words
    const slider = document.createElement('div');
    slider.className = 'horizontal-slider';
    slider.style.width = `${pages.length * 100}%`;
    
    // Create pages
    pages.forEach((pageWords, pageIndex) => {
        const page = document.createElement('div');
        page.className = 'word-page';
        page.style.width = `${100 / pages.length}%`;
        
        pageWords.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            // Set initial highlight state based on state.highlightedWords
            wordSpan.className = `word${state.highlightedWords.has(word) ? ' highlighted' : ''}`;
            wordSpan.textContent = word;
            wordSpan.dataset.word = word; // Add word data attribute for easier reference
            
            let touchStartTime = 0;
            let isTouchMove = false;
            
            // Handle touch events
            wordSpan.addEventListener('touchstart', (e) => {
                touchStartTime = Date.now();
                isTouchMove = false;
                e.stopPropagation();
            }, { passive: true });

            wordSpan.addEventListener('touchmove', () => {
                isTouchMove = true;
            }, { passive: true });

            wordSpan.addEventListener('touchend', (e) => {
                // Only toggle highlight if:
                // 1. Touch duration was less than 300ms (to differentiate from scrolling)
                // 2. The touch didn't move (to differentiate from swiping)
                if (Date.now() - touchStartTime < 300 && !isTouchMove) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleHighlight(word);
                }
            }, { passive: false });

            // Handle mouse events
            wordSpan.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleHighlight(word);
            });
            
            page.appendChild(wordSpan);
            if (wordIndex < pageWords.length - 1) {
                page.appendChild(document.createTextNode(' '));
            }
        });
        
        slider.appendChild(page);
    });
    
    sliderContainer.appendChild(slider);
    content.appendChild(sliderContainer);
    
    let currentPage = 0;
    let dotsContainer;
    
    // Create dot navigation if there are multiple pages
    if (pages.length > 1) {
        dotsContainer = document.createElement('div');
        dotsContainer.className = 'dots-navigation';
        
        pages.forEach((_, pageIndex) => {
            const dot = document.createElement('div');
            dot.className = `dot${pageIndex === 0 ? ' active' : ''}`;
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                navigateToPage(pageIndex);
            });
            dotsContainer.appendChild(dot);
        });
        
        content.appendChild(dotsContainer);
    }
    
    function navigateToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= pages.length) return;
        
        currentPage = pageIndex;
        slider.style.transform = `translateX(-${(pageIndex * 100) / pages.length}%)`;
        
        // Update dots
        if (dotsContainer) {
            const dots = dotsContainer.getElementsByClassName('dot');
            Array.from(dots).forEach((dot, index) => {
                dot.classList.toggle('active', index === pageIndex);
            });
        }
    }
    
    // Add scroll handling with debouncing
    let isScrolling = false;
    let lastScrollTime = 0;
    let scrollTimeout;
    let accumulatedDelta = 0;

    sliderContainer.addEventListener('wheel', (e) => {
        // Check if it's a horizontal scroll or shift+scroll
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            
            // Clear any existing scroll timeout
            clearTimeout(scrollTimeout);
            
            const now = Date.now();
            if (now - lastScrollTime < 250) { // Minimum time between scroll actions
                return;
            }
            
            // Accumulate scroll delta
            accumulatedDelta += e.deltaX || (e.shiftKey ? e.deltaY : 0);
            
            // Only process scroll if we're not already scrolling
            if (!isScrolling) {
                isScrolling = true;
                
                // Process the accumulated delta
                if (Math.abs(accumulatedDelta) > 50) { // Threshold for scroll navigation
                    if (accumulatedDelta > 0 && currentPage < pages.length - 1) {
                        navigateToPage(currentPage + 1);
                    } else if (accumulatedDelta < 0 && currentPage > 0) {
                        navigateToPage(currentPage - 1);
                    }
                    
                    // Reset accumulated delta
                    accumulatedDelta = 0;
                    lastScrollTime = now;
                }
                
                // Reset scroll state after animation completes
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                    accumulatedDelta = 0;
                }, 300); // Match this with your CSS transition duration
            }
        }
    }, { passive: false });
    
    // Add keyboard navigation for arrow keys
    function handleKeyNavigation(e) {
        // Only handle arrow keys if this is the current slide
        if (index === state.currentSlideIndex) {
            if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && pages.length > 1) {
                e.preventDefault();
                e.stopPropagation();
                
                if (e.key === 'ArrowLeft' && currentPage > 0) {
                    navigateToPage(currentPage - 1);
                } else if (e.key === 'ArrowRight' && currentPage < pages.length - 1) {
                    navigateToPage(currentPage + 1);
                }
                
                // Prevent the event from triggering vertical navigation
                e.stopImmediatePropagation();
                return false;
            }
        }
    }
    
    // Add and remove keyboard listener based on slide visibility
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (slide.classList.contains('current')) {
                    document.addEventListener('keydown', handleKeyNavigation);
                } else {
                    document.removeEventListener('keydown', handleKeyNavigation);
                }
            }
        });
    });
    
    observer.observe(slide, { attributes: true });
    
    // Add touch handling with better gesture detection
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isHorizontalSwipe = false;
    let hasMovedEnough = false;

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isHorizontalSwipe = false;
        hasMovedEnough = false;
        e.stopPropagation();
    }, { passive: true });

    sliderContainer.addEventListener('touchmove', (e) => {
        if (pages.length <= 1) return;

        touchEndX = e.touches[0].clientX;
        touchEndY = e.touches[0].clientY;

        const deltaX = touchStartX - touchEndX;
        const deltaY = touchStartY - touchEndY;

        // Determine if this is a horizontal or vertical swipe
        if (!hasMovedEnough && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
            hasMovedEnough = true;
            isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        }

        // Only handle horizontal swipes
        if (isHorizontalSwipe) {
            e.preventDefault();
            const percentageMoved = (deltaX / sliderContainer.offsetWidth) * 100;
            
            // Calculate the maximum translation based on the number of pages
            const maxTranslation = ((pages.length - 1) * 100) / pages.length;
            
            // Calculate the new position
            let newPosition = -(currentPage * 100 / pages.length) - percentageMoved;
            
            // Limit the translation to prevent overscrolling
            newPosition = Math.max(-maxTranslation, Math.min(0, newPosition));
            
            // Apply the translation
            slider.style.transform = `translateX(${newPosition}%)`;
        }
    }, { passive: false });

    sliderContainer.addEventListener('touchend', (e) => {
        if (pages.length <= 1 || !isHorizontalSwipe) return;

        touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchStartX - touchEndX;
        const swipeThreshold = sliderContainer.offsetWidth * 0.2;

        if (Math.abs(deltaX) >= swipeThreshold) {
            if (deltaX > 0 && currentPage < pages.length - 1) {
                navigateToPage(currentPage + 1);
            } else if (deltaX < 0 && currentPage > 0) {
                navigateToPage(currentPage - 1);
            } else {
                navigateToPage(currentPage);
            }
        } else {
            navigateToPage(currentPage);
        }

        // Prevent vertical slide navigation if this was a horizontal swipe
        if (isHorizontalSwipe) {
            e.stopPropagation();
        }
    }, { passive: false });

    slide.appendChild(slideNumber);
    slide.appendChild(content);

    if (state.comments[index]) {
        const commentIndicator = document.createElement('div');
        commentIndicator.className = 'comment-indicator';
        commentIndicator.innerHTML = '<i class="fas fa-comment"></i>';
        slide.appendChild(commentIndicator);
    }

    slidesContainer.appendChild(slide);
    return slide;
}

// Update the highlighted words list with animation
function updateHighlightedWordsList() {
    highlightedWordsList.innerHTML = '';
    const words = Array.from(state.highlightedWords);
    
    words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.style.opacity = '0';
        li.style.transform = 'translateX(-10px)';
        
        li.addEventListener('click', () => toggleHighlight(word));
        
        highlightedWordsList.appendChild(li);
        
        // Trigger animation
        requestAnimationFrame(() => {
            li.style.transition = 'all 0.3s ease';
            li.style.opacity = '1';
            li.style.transform = 'translateX(0)';
        });
    });
}

// Handle vertical scrolling
let lastScrollTime = 0;
let isScrolling = false;

// Helper function to check if element is a control
function isControlElement(element) {
    return element.closest('.slide-controls') ||
           element.closest('.top-right-controls') ||
           element.closest('#hamburgerMenu') ||
           element.closest('.modal') ||
           element.closest('.button-group') ||
           element.classList.contains('word');
}

// For mobile scroll events
let touchStartY = 0;
let touchStartX = 0;
let touchEndY = 0;
let touchEndX = 0;

slidesContainer.addEventListener('touchstart', (e) => {
    // Store the initial touch coordinates
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    
    // Only close hamburger menu on touch if not touching a control element
    if (!isControlElement(e.target)) {
        closeHamburgerMenu();
    }
}, { passive: true });

slidesContainer.addEventListener('touchmove', (e) => {
    // Don't prevent default for control elements to allow normal scrolling
    if (isControlElement(e.target)) {
        return;
    }
    
    // Prevent default scroll behavior
    e.preventDefault();
    
    // Update end coordinates as finger moves
    touchEndY = e.touches[0].clientY;
    touchEndX = e.touches[0].clientX;
}, { passive: false });

slidesContainer.addEventListener('touchend', (e) => {
    // Don't handle swipes on control elements
    if (isControlElement(e.target)) {
        return;
    }
    
    // Calculate swipe distance
    const deltaY = touchStartY - touchEndY;
    const deltaX = touchStartX - touchEndX;
    
    // Only process if it's a significant vertical swipe (more vertical than horizontal)
    const swipeThreshold = 50; // minimum swipe distance in pixels
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
    
    if (isVerticalSwipe && Math.abs(deltaY) >= swipeThreshold) {
        const now = Date.now();
        if (now - lastScrollTime < 500 || isScrolling) return;
        
        isScrolling = true;
        lastScrollTime = now;
        
        if (deltaY > 0) {
            // Swipe up - next slide
            if (state.currentSlideIndex < state.slides.length - 1) {
                state.currentSlideIndex++;
                renderCurrentSlide();
                saveCurrentState();
            } else {
                checkSessionEnd();
            }
        } else {
            // Swipe down - previous slide
            if (state.currentSlideIndex > 0) {
                state.currentSlideIndex--;
                renderCurrentSlide();
                saveCurrentState();
            }
        }
        
        // Reset scrolling flag after animation
        setTimeout(() => {
            isScrolling = false;
        }, 500);
    }
}, { passive: true });

// Handle mouse wheel scrolling
function handleScroll(e) {
    // Check if the scroll event originated from within the hamburger menu or any modal
    if (hamburgerMenu.contains(e.target) || 
        commentModal.classList.contains('active') || 
        editModal.classList.contains('active')) {
        return; // Do nothing if scrolling inside hamburger menu or modals are active
    }

    // Prevent default scroll behavior
    e.preventDefault();

    // Throttle scroll events
    const now = Date.now();
    if (now - lastScrollTime < 500 || isScrolling) return; // 500ms throttle
    
    isScrolling = true;
    lastScrollTime = now;

    const delta = e.deltaY || e.detail || -e.wheelDelta;

    if (delta > 0) {
        // Scroll down - next slide
        if (state.currentSlideIndex < state.slides.length - 1) {
            state.currentSlideIndex++;
            renderCurrentSlide();
            saveCurrentState();
        } else {
            checkSessionEnd();
        }
    } else if (delta < 0 && state.currentSlideIndex > 0) {
        // Scroll up - previous slide
        state.currentSlideIndex--;
        renderCurrentSlide();
        saveCurrentState();
    }

    // Reset scrolling flag after animation
    setTimeout(() => {
        isScrolling = false;
    }, 500);
}

// Add event listeners for all scroll events
slidesContainer.addEventListener('wheel', handleScroll, { passive: false });
slidesContainer.addEventListener('mousewheel', handleScroll, { passive: false });
slidesContainer.addEventListener('DOMMouseScroll', handleScroll, { passive: false });

// Update keyboard navigation to use the same timing constraints
document.addEventListener('keydown', (e) => {
    // Don't handle keyboard navigation when any modal is active
    if (commentModal.classList.contains('active') || editModal.classList.contains('active')) {
        // Handle Escape key for modals
        if (e.code === 'Escape') {
            if (commentModal.classList.contains('active')) {
                closeCommentModal();
            }
            if (editModal.classList.contains('active')) {
                closeEditModal();
            }
        }
        return;
    }

    // Only handle keyboard navigation when in slides view
    if (!slidesContainer.classList.contains('active')) return;

    // Prevent default behavior for navigation keys
    if (['Space', 'Enter', 'Backspace', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
    }

    // Apply the same timing constraints as scroll
    const now = Date.now();
    if (now - lastScrollTime < 500 || isScrolling) return;
    
    isScrolling = true;
    lastScrollTime = now;

    switch (e.code) {
        // Forward navigation
        case 'Space':
        case 'Enter':
        case 'ArrowDown':
            if (state.currentSlideIndex < state.slides.length - 1) {
                state.currentSlideIndex++;
                renderCurrentSlide();
                saveCurrentState();
            } else {
                checkSessionEnd();
            }
            break;

        // Backward navigation
        case 'Backspace':
        case 'ArrowUp':
            if (state.currentSlideIndex > 0) {
                state.currentSlideIndex--;
                renderCurrentSlide();
                saveCurrentState();
            }
            break;
    }

    // Reset scrolling flag after animation
    setTimeout(() => {
        isScrolling = false;
    }, 500);
});

// Import session
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            state.slides = data.slides;
            state.highlightedWords = new Set(data.highlightedWords);
            state.currentSlideIndex = 0;
            state.comments = data.comments || {};
            showSlides();
            updateHighlightedWordsList();
        } catch (error) {
            alert('Error importing file. Please make sure it\'s a valid JSON file.');
        }
    };
    reader.readAsText(file);
}

// Save session
function saveSession() {
    const data = {
        slides: state.slides,
        highlightedWords: Array.from(state.highlightedWords),
        comments: state.comments
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infopro-session.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// End session handler
function handleEndSession() {
    const shouldEnd = confirm('Are you sure you want to end the current session?');
    if (shouldEnd) {
        saveCurrentState();
        showSummaryPage();
    }
}

// Delete current slide
function deleteCurrentSlide() {
    // Don't allow deletion if there's only one slide
    if (state.slides.length <= 1) {
        alert('Cannot delete the last slide. End the session instead.');
        return;
    }

    const shouldDelete = confirm('Are you sure you want to delete this slide?');
    if (shouldDelete) {
        // Remove the current slide
        state.slides.splice(state.currentSlideIndex, 1);
        
        // If we deleted the last slide, move the index back
        if (state.currentSlideIndex >= state.slides.length) {
            state.currentSlideIndex = state.slides.length - 1;
        }
        
        // Update the view and save state
        renderCurrentSlide();
        saveCurrentState();
    }
}

// Comment functions
function openCommentModal() {
    const currentComment = state.comments[state.currentSlideIndex] || '';
    commentInput.value = currentComment;
    commentModal.classList.add('active');
    commentInput.focus();
}

function closeCommentModal() {
    commentModal.classList.remove('active');
}

function saveComment() {
    const comment = commentInput.value.trim();
    if (comment) {
        state.comments[state.currentSlideIndex] = comment;
    } else {
        delete state.comments[state.currentSlideIndex];
    }
    saveCurrentState();
    closeCommentModal();
    renderCurrentSlide(); // Update the current slide to show comment indicator if needed
}

// Edit functions
function openEditModal() {
    const currentSlide = state.slides[state.currentSlideIndex];
    editInput.value = currentSlide.text;
    editModal.classList.add('active');
    editInput.focus();
}

function closeEditModal() {
    editModal.classList.remove('active');
}

function saveEdit() {
    const newText = editInput.value.trim();
    if (newText) {
        state.slides[state.currentSlideIndex].text = newText;
        saveCurrentState();
        renderCurrentSlide();
    }
    closeEditModal();
}

// Update the document keyboard event listener to handle vertical navigation
document.removeEventListener('keydown', handleKeyboardNavigation); // Remove any existing listener

function handleKeyboardNavigation(e) {
    // Only handle keyboard navigation when in slides view
    if (!slidesContainer.classList.contains('active')) return;

    // Prevent default behavior for navigation keys
    if (['Space', 'Enter', 'Backspace', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
    }

    // Apply the same timing constraints as scroll
    const now = Date.now();
    if (now - lastScrollTime < 500 || isScrolling) return;
    
    isScrolling = true;
    lastScrollTime = now;

    switch (e.code) {
        // Forward navigation
        case 'Space':
        case 'Enter':
        case 'ArrowDown':
            if (state.currentSlideIndex < state.slides.length - 1) {
                state.currentSlideIndex++;
                renderCurrentSlide();
                saveCurrentState();
            } else {
                checkSessionEnd();
            }
            break;

        // Backward navigation
        case 'Backspace':
        case 'ArrowUp':
            if (state.currentSlideIndex > 0) {
                state.currentSlideIndex--;
                renderCurrentSlide();
                saveCurrentState();
            }
            break;
    }

    // Reset scrolling flag after animation
    setTimeout(() => {
        isScrolling = false;
    }, 500);
}

document.addEventListener('keydown', handleKeyboardNavigation); 