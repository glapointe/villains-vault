/**
 * Type declarations for plotly.js bundles
 * 
 * plotly.js-gl2d-dist is a partial bundle containing only WebGL 2D trace types
 * plotly.js/dist/plotly.min.js is the pre-built full bundle (avoids Metro require issues)
 */

declare module 'plotly.js-gl2d-dist' {
	import Plotly from 'plotly.js';
	export default Plotly;
}

declare module 'plotly.js/dist/plotly.min.js' {
	import Plotly from 'plotly.js';
	export default Plotly;
}
