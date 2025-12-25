import React from 'react';
import { Card as NeumorphicCard, CardProps as NeumorphicCardProps } from './neumorphic/Card';
import { colors, spacing, typography } from '../../styles/design-tokens';

// Re-export the base Card component
export const Card = NeumorphicCard;
export type CardProps = NeumorphicCardProps;

// CardHeader component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style, ...props }) => {
  return (
    <div
      style={{
        padding: `${spacing[4]} ${spacing[4]} ${spacing[3]} ${spacing[4]}`,
        borderBottom: `1px solid ${colors.surface.border}`,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// CardTitle component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, style, ...props }) => {
  return (
    <h3
      style={{
        margin: 0,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        ...style
      }}
      {...props}
    >
      {children}
    </h3>
  );
};

// CardDescription component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style, ...props }) => {
  return (
    <p
      style={{
        margin: `${spacing[1]} 0 0 0`,
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        ...style
      }}
      {...props}
    >
      {children}
    </p>
  );
};

// CardContent component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style, ...props }) => {
  return (
    <div
      style={{
        padding: spacing[4],
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
