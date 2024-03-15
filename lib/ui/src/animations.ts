export const quickAnimation: KeyframeAnimationOptions = {
  duration: 175,
  easing: 'cubic-bezier(0, 0, 1, 1)',
};

export const quickReverseAnimation: KeyframeAnimationOptions = {
  ...quickAnimation,
  direction: 'reverse',
};

export const animation: KeyframeAnimationOptions = {
  duration: 250,
  easing: 'cubic-bezier(0.3, 0, 1, 1)',
};

export const reverseAnimation: KeyframeAnimationOptions = {
  ...animation,
  easing: 'cubic-bezier(0, 0, 0, 1)',
  direction: 'reverse',
};
