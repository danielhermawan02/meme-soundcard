/**
 * GLOBAL CONFIGURATION
 * 
 * To make your username and password apply to everyone who visits your site:
 * 1. Set 'enabled' to true.
 * 2. Set 'username' to your desired username.
 * 3. Run the app locally, set your password, and use the "Export Config" 
 *    button in Security Settings to get your 'hash'.
 */
const GLOBAL_AUTH = {
    enabled: false, // Set to true to lock the app for everyone
    username: 'admin',
    hash: '' // The SHA-256 hash of your password
};
