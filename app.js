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

// Add state saving to relevant functions
function toggleHighlight(word) {
    if (state.highlightedWords.has(word)) {
        state.highlightedWords.delete(word);
    } else {
        state.highlightedWords.add(word);
    }
    saveCurrentState();
    updateHighlightedWordsList();
    renderCurrentSlide();
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

// Add close hamburger menu when starting to swipe between slides
slidesContainer.addEventListener('touchstart', e => {
    // Check if we're touching a control element
    if (isControlElement(e.target)) {
        isTouchingControl = true;
        return;
    }
    
    // Close hamburger menu when starting to swipe
    closeHamburgerMenu();
    
    touchStartY = e.touches[0].clientY;
    isTouchingControl = false;
});

// Show slides view
function showSlides() {
    landingPage.classList.remove('active');
    slidesContainer.classList.add('active');
    renderCurrentSlide();
}

// Render current slide
function renderCurrentSlide() {
    // Remove existing slides
    const existingSlides = slidesContainer.querySelectorAll('.slide');
    existingSlides.forEach(slide => slide.remove());

    if (state.slides.length === 0) return;

    const slide = document.createElement('div');
    slide.className = `slide${state.slides[state.currentSlideIndex].completed ? ' completed' : ''}`;

    const slideNumber = document.createElement('div');
    slideNumber.className = 'slide-number';
    slideNumber.textContent = `${state.currentSlideIndex + 1}/${state.slides.length}`;

    const content = document.createElement('div');
    content.className = 'slide-content';
    
    // Split sentence into clickable words
    const words = state.slides[state.currentSlideIndex].text.split(/\s+/);
    words.forEach((word, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = `word${state.highlightedWords.has(word) ? ' highlighted' : ''}`;
        wordSpan.textContent = word;
        wordSpan.addEventListener('click', () => toggleHighlight(word));
        content.appendChild(wordSpan);
        
        if (index < words.length - 1) {
            content.appendChild(document.createTextNode(' '));
        }
    });

    slide.appendChild(slideNumber);
    slide.appendChild(content);

    // Add comment indicator if slide has a comment
    if (state.comments[state.currentSlideIndex]) {
        const commentIndicator = document.createElement('div');
        commentIndicator.className = 'comment-indicator';
        commentIndicator.innerHTML = '<i class="fas fa-comment"></i>';
        slide.appendChild(commentIndicator);
    }

    slidesContainer.appendChild(slide);

    // Update toggle complete button icon
    const toggleIcon = toggleCompleteButton.querySelector('i');
    toggleIcon.className = state.slides[state.currentSlideIndex].completed ? 'fas fa-minus' : 'far fa-circle';
}

// Update highlighted words list
function updateHighlightedWordsList() {
    highlightedWordsList.innerHTML = '';
    state.highlightedWords.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        li.addEventListener('click', () => toggleHighlight(word));
        highlightedWordsList.appendChild(li);
    });
}

// Handle vertical scrolling
let touchStartY = 0;
let touchEndY = 0;
let isTouchingControl = false;

// Helper function to check if element is a control
function isControlElement(element) {
    return element.closest('.slide-controls') ||
           element.closest('.top-right-controls') ||
           element.closest('#hamburgerMenu') ||
           element.closest('.modal') ||
           element.closest('.button-group') ||
           element.classList.contains('word');
}

slidesContainer.addEventListener('touchmove', e => {
    if (isTouchingControl) return;
    touchEndY = e.touches[0].clientY;
});

slidesContainer.addEventListener('touchend', () => {
    if (isTouchingControl) {
        isTouchingControl = false;
        return;
    }

    const difference = touchStartY - touchEndY;
    if (Math.abs(difference) > 50) { // Minimum swipe distance
        if (difference > 0) {
            // Swipe up - next slide
            if (state.currentSlideIndex < state.slides.length - 1) {
                state.currentSlideIndex++;
                renderCurrentSlide();
                saveCurrentState();
            } else {
                checkSessionEnd();
            }
        } else if (difference < 0 && state.currentSlideIndex > 0) {
            // Swipe down - previous slide
            state.currentSlideIndex--;
            renderCurrentSlide();
            saveCurrentState();
        }
    }
});

// Handle mouse wheel scrolling
let wheelTimeout;
slidesContainer.addEventListener('wheel', (e) => {
    // Check if the scroll event originated from within the hamburger menu or any modal
    if (hamburgerMenu.contains(e.target) || 
        commentModal.classList.contains('active') || 
        editModal.classList.contains('active')) {
        return; // Do nothing if scrolling inside hamburger menu or modals are active
    }

    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
        if (e.deltaY > 0) {
            // Scroll down - next slide
            if (state.currentSlideIndex < state.slides.length - 1) {
                state.currentSlideIndex++;
                renderCurrentSlide();
                saveCurrentState();
            } else {
                checkSessionEnd();
            }
        } else if (e.deltaY < 0 && state.currentSlideIndex > 0) {
            // Scroll up - previous slide
            state.currentSlideIndex--;
            renderCurrentSlide();
            saveCurrentState();
        }
    }, 50); // Debounce scroll events
});

// Handle keyboard navigation
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
    if (['Space', 'Enter', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    switch (e.code) {
        // Forward navigation
        case 'Space':
        case 'Enter':
        case 'ArrowRight':
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
        case 'ArrowLeft':
        case 'ArrowUp':
            if (state.currentSlideIndex > 0) {
                state.currentSlideIndex--;
                renderCurrentSlide();
                saveCurrentState();
            }
            break;
    }
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