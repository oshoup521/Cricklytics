// Mobile debugging utilities for testing mobile functionality

export const addMobileDebugInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    // Add mobile debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'mobile-debug';
    debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 10000;
      max-width: 200px;
    `;
    
    const updateInfo = () => {
      const info = {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
        touchSupport: 'ontouchstart' in window ? 'Yes' : 'No',
        platform: navigator.platform,
      };
      
      debugPanel.innerHTML = `
        <strong>Mobile Debug</strong><br>
        Viewport: ${info.viewport}<br>
        Device: ${info.userAgent}<br>
        Touch: ${info.touchSupport}<br>
        Platform: ${info.platform}
      `;
    };
    
    updateInfo();
    window.addEventListener('resize', updateInfo);
    document.body.appendChild(debugPanel);
    
    // Hide debug panel after 5 seconds
    setTimeout(() => {
      if (debugPanel.parentNode) {
        debugPanel.remove();
      }
    }, 5000);
  }
};

export const testMobileFeatures = () => {
  console.log('🔍 Testing Mobile Features:');
  console.log('📱 Viewport size:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('👆 Touch support:', 'ontouchstart' in window);
  console.log('📲 User agent mobile:', navigator.userAgent.includes('Mobile'));
  console.log('🔧 Platform:', navigator.platform);
  
  // Test click events
  const testButton = document.createElement('button');
  testButton.textContent = '🧪 Test Mobile Click';
  testButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #007bff;
    color: white;
    border: none;
    padding: 12px 16px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 14px;
    cursor: pointer;
  `;
  
  let clickCount = 0;
  testButton.addEventListener('click', () => {
    clickCount++;
    testButton.textContent = `✅ Clicked ${clickCount}x`;
    console.log('✅ Mobile click test successful:', clickCount);
    
    if (clickCount >= 3) {
      testButton.remove();
      console.log('🎉 Mobile click test completed!');
    }
  });
  
  document.body.appendChild(testButton);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (testButton.parentNode) {
      testButton.remove();
    }
  }, 10000);
};

// Mobile menu testing
export const testMobileMenu = () => {
  const mobileMenuButton = document.querySelector('[aria-label="Toggle mobile menu"]');
  if (mobileMenuButton) {
    console.log('📱 Mobile menu button found:', mobileMenuButton);
    
    // Test programmatic click
    setTimeout(() => {
      console.log('🔄 Testing mobile menu toggle...');
      mobileMenuButton.click();
      
      setTimeout(() => {
        const loginButton = document.querySelector('a[href="/login"]');
        const registerButton = document.querySelector('a[href="/register"]');
        
        if (loginButton && registerButton) {
          console.log('✅ Login/Register buttons found in mobile menu');
          console.log('📍 Login button position:', loginButton.getBoundingClientRect());
          console.log('📍 Register button position:', registerButton.getBoundingClientRect());
        } else {
          console.log('❌ Login/Register buttons not found in mobile menu');
        }
        
        // Close menu
        mobileMenuButton.click();
      }, 500);
    }, 1000);
  } else {
    console.log('❌ Mobile menu button not found');
  }
};
