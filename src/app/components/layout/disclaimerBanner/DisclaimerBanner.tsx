/**
 * Disclaimer Banner Component
 * 
 * Legal disclaimer shown on the home page above the footer
 * Appears as an alert-style notification bar
 */

import { View, Text } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getThemedColors } from '../../../theme';
import { styles, getThemedStyles } from './DisclaimerBanner.styles';

/**
 * Disclaimer banner component for home page
 */
export function DisclaimerBanner(): React.ReactElement {
	const { isDark } = useTheme();
	const colors = getThemedColors(isDark);
	const themedStyles = getThemedStyles(colors);

	return (
		<View style={[styles.disclaimer, themedStyles.disclaimer]}>
			<Text style={[styles.disclaimerText, themedStyles.disclaimerText]}>
				⚠️ Villains Vault is not affiliated with, endorsed by, or sponsored by runDisney or Track Shack. 
				This site is for entertainment and informational purposes only. Race results are aggregated from publicly 
				available Track Shack data to provide insights and analytics for the runDisney community.
			</Text>
		</View>
	);
}
