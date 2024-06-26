/* <div id="loading">
    <div id="loading-center">
      <div id="loading-center-absolute">
        <div class="object" id="object_one"></div>
        <div class="object" id="object_two"></div>
        <div class="object" id="object_three"></div>
        <div class="object" id="object_four"></div>
      </div>
    </div>

  </div> */
  window.addEventListener('load', function(ev) {
    var loading = document.querySelector('#loading');
    // loading.textContent = "Loading entrypoint...";
    _flutter.loader.loadEntrypoint({
      serviceWorker: {
        serviceWorkerVersion: "1",
      },
      onEntrypointLoaded: async function(engineInitializer) {
        // loading.textContent = "Initializing engine...";
        let appRunner = await engineInitializer.initializeEngine();

        // loading.textContent = "Running app...";
        await appRunner.runApp();
        await new Promise(resolve => setTimeout(resolve, 0));
        loading.style.display = 'none';

      }
    });
  });