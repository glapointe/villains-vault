const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin to pin the Gradle wrapper distribution URL.
 * Runs after `expo prebuild` generates the android/ folder, ensuring
 * the correct Gradle version is always used even when android/ is deleted and rebuilt.
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 * @param {{ gradleVersion: string }} options
 */
const withGradleWrapper = (config, { gradleVersion }) => {
	return withDangerousMod(config, [
		'android',
		async (config) => {
			const gradleWrapperPath = path.join(
				config.modRequest.platformProjectRoot,
				'gradle',
				'wrapper',
				'gradle-wrapper.properties'
			);

			const content = fs.readFileSync(gradleWrapperPath, 'utf8');

			const updated = content.replace(
				/distributionUrl=.*gradle-.*-bin\.zip/,
				`distributionUrl=https\\://services.gradle.org/distributions/gradle-${gradleVersion}-bin.zip`
			);

			fs.writeFileSync(gradleWrapperPath, updated, 'utf8');
			console.log(`[withGradleWrapper] Pinned Gradle to ${gradleVersion}`);

			return config;
		},
	]);
};

module.exports = withGradleWrapper;
