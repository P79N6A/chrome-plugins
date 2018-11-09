if (chrome.devtools && chrome.devtools.panels) {
    chrome.devtools.panels.create('batch',
        'logo.png', './pages/files/batch.html' );
} else {
    alert('Chrome DevTools extension API is not available.');
}
