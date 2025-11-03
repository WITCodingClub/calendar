# WIT-Calendar (client)

## Setup
1. Install ``npm`` on the node.js official website: https://nodejs.org/en/download
2. Find where it says "Get a prebuilt Node.js for Windows running a x64 architecture"
   - Select the correct OS and architecture by using the dropdowns
   - Click the ``"<your OS> Installer (.<ext>)"`` button, then run the installer

<img width="688" height="122" src="https://i.imgur.com/wKaPCgR.png" />

3. Run ``npm i`` in this directory (``/client``)
4. Run ``npm run build`` to build the extension. Built files will be in ``/client/extension/``

## Testing the Extension

1. Head to ``chrome://extensions``
2. Enable Developer Mode
3. Click ``Load Unpacked``
4. Select the folder (extension)
5. Ensure the added Extension is enabled
6. Simply click on the extension icon to use it.