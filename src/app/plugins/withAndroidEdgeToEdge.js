const { withAndroidStyles, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Config plugin to remove deprecated Android status bar/navigation bar style
 * attributes that trigger Play Store warnings on Android 15+, and to remove
 * the portrait-only orientation restriction on GmsBarcodeScanningDelegateActivity
 * (from Google ML Kit) that triggers large-screen warnings on Android 16.
 *
 * `android:statusBarColor` calls the deprecated `Window.setStatusBarColor()` API.
 * `android:enforceNavigationBarContrast` is superseded by WindowInsetsController
 * when edge-to-edge mode is active (edgeToEdgeEnabled: true).
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 */
const withAndroidEdgeToEdge = (config) => {
	config = withAndroidStyles(config, (config) => {
		config.modResults = removeStyleItem(
			config.modResults,
			'AppTheme',
			'android:statusBarColor'
		);
		config.modResults = removeStyleItem(
			config.modResults,
			'AppTheme',
			'android:enforceNavigationBarContrast'
		);
		return config;
	});

	config = withAndroidManifest(config, (config) => {
		const manifest = config.modResults.manifest;

		// Add xmlns:tools namespace if not already present (required for tools:replace)
		if (!manifest.$['xmlns:tools']) {
			manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
		}

		const application = manifest.application[0];
		if (!application.activity) {
			application.activity = [];
		}

		// Override GmsBarcodeScanningDelegateActivity (Google ML Kit transitive dep) to
		// remove its hardcoded portrait orientation restriction. tools:remove instructs
		// the manifest merger to delete the attribute from the merged output entirely,
		// leaving no orientation restriction on the activity.
		const targetActivity =
			'com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity';

		const existing = application.activity.find(
			(a) => a.$?.['android:name'] === targetActivity
		);

		if (existing) {
			existing.$['tools:remove'] = 'android:screenOrientation';
			delete existing.$['android:screenOrientation'];
		} else {
			application.activity.push({
				$: {
					'android:name': targetActivity,
					'tools:remove': 'android:screenOrientation',
				},
			});
		}

		return config;
	});

	return config;
};

/**
 * Removes all <item> elements with the given name from the named style in
 * the parsed styles.xml resources object.
 *
 * @param {object} resources - Parsed styles.xml resources (via xml2js)
 * @param {string} styleName - The style name to target (e.g. "AppTheme")
 * @param {string} itemName  - The item name attribute to remove (e.g. "android:statusBarColor")
 * @returns {object} The mutated resources object
 */
function removeStyleItem(resources, styleName, itemName) {
	const styles = resources.resources?.style;
	if (!styles) return resources;

	for (const style of styles) {
		if (style.$?.name !== styleName) continue;
		if (!style.item) continue;

		style.item = style.item.filter(
			(item) => item.$?.name !== itemName
		);
	}

	return resources;
}

module.exports = withAndroidEdgeToEdge;
