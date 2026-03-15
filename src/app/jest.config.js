module.exports = {
	preset: 'jest-expo',
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@auth0/auth0-react)',
	],
	moduleNameMapper: {
		'\\.svg$': '<rootDir>/__mocks__/svgMock.js',
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	collectCoverageFrom: [
		'**/*.{ts,tsx}',
		'!**/*.d.ts',
		'!**/node_modules/**',
		'!**/.expo/**',
		'!**/coverage/**',
	],
	testMatch: [
		'**/__tests__/**/*.test.{ts,tsx}',
		'**/*.test.{ts,tsx}',
	],
};
