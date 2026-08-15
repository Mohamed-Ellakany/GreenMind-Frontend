import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export type TourPlacement = 'bottom' | 'top' | 'left' | 'right' | 'auto';

export interface TourStep {
  id: string;
  targetSelector: string;
  title: string;
  badge: string;
  description: string;
  tip?: string;
  icon?: IconDefinition;
  iconEmoji?: string;
  placement?: TourPlacement;
  route?: string;
  highlightPadding?: number;
}

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface PopoverPosition {
  top: number;
  left: number;
  placement: 'bottom' | 'top' | 'left' | 'right';
  arrowOffset?: number;
}
