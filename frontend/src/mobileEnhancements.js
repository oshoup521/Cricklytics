// Keyboard shortcuts for scoring
export const setupKeyboardShortcuts = () => {
  document.addEventListener('keydown', (event) => {
    // Prevent default if we're handling the shortcut
    const activeElement = document.activeElement;
    const isInput = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );

    // Don't trigger shortcuts when typing in inputs
    if (isInput) return;

    switch(event.key) {
      case '0':
        event.preventDefault();
        triggerScoringAction('dot-ball');
        break;
      case '1':
        event.preventDefault();
        triggerScoringAction('single');
        break;
      case '2':
        event.preventDefault();
        triggerScoringAction('double');
        break;
      case '3':
        event.preventDefault();
        triggerScoringAction('triple');
        break;
      case '4':
        event.preventDefault();
        triggerScoringAction('four');
        break;
      case '6':
        event.preventDefault();
        triggerScoringAction('six');
        break;
      case 'w':
      case 'W':
        event.preventDefault();
        triggerScoringAction('wicket');
        break;
      case 'b':
      case 'B':
        event.preventDefault();
        triggerScoringAction('bye');
        break;
      case 'l':
      case 'L':
        event.preventDefault();
        triggerScoringAction('leg-bye');
        break;
      case 'n':
      case 'N':
        event.preventDefault();
        triggerScoringAction('no-ball');
        break;
      case 'd':
      case 'D':
        event.preventDefault();
        triggerScoringAction('wide');
        break;
      case 'u':
      case 'U':
        event.preventDefault();
        triggerScoringAction('undo');
        break;
      case 'Enter':
        event.preventDefault();
        triggerScoringAction('confirm');
        break;
      case 'Escape':
        event.preventDefault();
        triggerScoringAction('cancel');
        break;
      default:
        break;
    }
  });
};

const triggerScoringAction = (action) => {
  // Dispatch custom event that scoring components can listen to
  const event = new CustomEvent('scoringShortcut', {
    detail: { action }
  });
  document.dispatchEvent(event);
};

// Touch gestures for mobile
export const setupTouchGestures = () => {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  document.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  });

  document.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;
    
    handleGesture();
  });

  const handleGesture = () => {
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    const minSwipeDistance = 50;

    // Only trigger gestures in scoring interface
    if (!document.querySelector('.scoring-interface')) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) {
          // Swipe left - previous ball
          triggerScoringAction('previous-ball');
        } else {
          // Swipe right - next ball
          triggerScoringAction('next-ball');
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > minSwipeDistance) {
        if (diffY > 0) {
          // Swipe up - quick four
          triggerScoringAction('quick-four');
        } else {
          // Swipe down - quick six
          triggerScoringAction('quick-six');
        }
      }
    }
  };
};

// Vibration feedback for mobile
export const hapticFeedback = (type = 'light') => {
  if ('vibrate' in navigator) {
    switch(type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([30, 10, 30]);
        break;
      case 'success':
        navigator.vibrate([50, 25, 50]);
        break;
      case 'error':
        navigator.vibrate([100, 50, 100, 50, 100]);
        break;
      default:
        navigator.vibrate(10);
    }
  }
};

// Install PWA prompt
export const setupPWAInstall = () => {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the mini-infobar from appearing on mobile
    event.preventDefault();
    deferredPrompt = event;
    
    // Show custom install button
    showInstallButton();
  });

  const showInstallButton = () => {
    const installButton = document.createElement('button');
    installButton.innerHTML = '📱 Install App';
    installButton.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
    
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
          hapticFeedback('success');
        }
        
        deferredPrompt = null;
        installButton.remove();
      }
    });

    document.body.appendChild(installButton);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (installButton.parentNode) {
        installButton.remove();
      }
    }, 10000);
  };
};

// Register service worker
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Initialize all mobile enhancements
export const initializeMobileEnhancements = () => {
  setupKeyboardShortcuts();
  setupTouchGestures();
  setupPWAInstall();
  registerServiceWorker();
  
  // Add mobile-specific CSS classes
  if (window.innerWidth <= 768) {
    document.body.classList.add('mobile-device');
  }

  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  });
  
  // Debug mode for development
  if (process.env.NODE_ENV === 'development') {
    // Import and run mobile debug tools
    import('./mobileDebug.js').then(({ addMobileDebugInfo, testMobileFeatures, testMobileMenu }) => {
      addMobileDebugInfo();
      
      // Auto-test mobile features after page loads
      setTimeout(() => {
        testMobileFeatures();
        testMobileMenu();
      }, 2000);
    }).catch(err => {
      console.log('Debug tools not available:', err);
    });
  }
};
