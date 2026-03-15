module.exports = function (api) {
	// Disable babel cache for production builds to ensure env vars update
	api.cache.using(() => process.env.NODE_ENV + process.env.EXPO_PUBLIC_API_URL);
    //api.cache(true);
	return {
		presets: [
			"babel-preset-expo"
		],
        plugins: [
            "react-native-reanimated/plugin"
        ]
	};
};
