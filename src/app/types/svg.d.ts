declare module '*.svg' {
  import type { ComponentType } from 'react';
  import type { SvgProps } from 'react-native-svg';
  import type { StyleProp, ViewStyle } from 'react-native';

  // Extend SvgProps to include style property which is supported but not typed
  interface ExtendedSvgProps extends SvgProps {
    style?: StyleProp<ViewStyle>;
  }

  const content: ComponentType<ExtendedSvgProps>;
  export default content;
}
