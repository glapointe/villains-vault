const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const config = getDefaultConfig(__dirname);

// Fix for React Native new architecture multipart/chunked encoding issues
config.server = {
	...config.server,
	// Force HTTP/1.0 to avoid chunked encoding issues
	enhanceMiddleware: (middleware, metroServer) => {
		return (req, res, next) => {
			const originalWriteHead = res.writeHead;
			res.writeHead = function(statusCode, headers) {
				// Remove chunked transfer encoding
				if (headers && headers['Transfer-Encoding']) {
					delete headers['Transfer-Encoding'];
				}
				// Force HTTP/1.0
				res.httpVersion = '1.0';
				return originalWriteHead.apply(this, arguments);
			};
			return middleware(req, res, next);
		};
	},
};

config.transformer = {
	...config.transformer,
	babelTransformerPath: require.resolve('react-native-svg-transformer'),
	minifierConfig: {
		// Use aggressive compression in production, preserve names in dev
		keep_classnames: process.env.NODE_ENV !== 'production',
		keep_fnames: process.env.NODE_ENV !== 'production',
		mangle: {
			keep_classnames: process.env.NODE_ENV !== 'production',
			keep_fnames: process.env.NODE_ENV !== 'production',
		},
		compress: {
			// Multiple passes for better minification
			passes: 2,
			// Remove dead code
			dead_code: true,
			// Drop console.log in production
			drop_console: process.env.NODE_ENV === 'production',
		},
		output: {
			// Remove comments in production
			comments: process.env.NODE_ENV !== 'production',
		},
	},
	// Enable inlining for better tree-shaking
	getTransformOptions: async () => ({
		transform: {
			experimentalImportSupport: false,
			inlineRequires: true,
		},
	}),
};

config.resolver = {
	...config.resolver,
	assetExts: [
		...config.resolver.assetExts.filter((ext) => ext !== 'svg'),
		'TTF',
		'md',
	],
	sourceExts: [...config.resolver.sourceExts, 'svg'],
	// Allow CSS imports but resolve them to empty module on native
	resolveRequest: (context, moduleName, platform) => {
		// On native platforms, resolve CSS imports to an empty module
		if (platform !== 'web' && moduleName.endsWith('.css')) {
			return {
				type: 'empty',
			};
		}
		// Use default resolution for everything else
		return context.resolveRequest(context, moduleName, platform);
	},
};

module.exports = withNativeWind(config, { input: './global.css' });
