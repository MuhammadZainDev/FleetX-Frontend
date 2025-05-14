import React from 'react';
import Svg, { Path } from 'react-native-svg';

type ArrowIconProps = {
  color?: string;
  size?: number;
};

export function ArrowIcon({ color = '#ffffff', size = 24 }: ArrowIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.01 11H4V13H16.01V16L20 12L16.01 8V11Z"
        fill={color}
      />
    </Svg>
  );
} 