
 // chrome.devtools.panels.create('Recorder PFC', 'images/app_icon_128.png', 'index.html');
  chrome.devtools.panels.elements.createSidebarPane("Recorder PFC",
  function(sidebar) {
      // sidebar initialization code here
      sidebar.setPage('index.html')
});
