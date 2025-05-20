'use client';

import { Chart } from '@/app/components/elements/Chart';
import { ScoreCard } from '@/app/components/elements/ScoreCard';
import { Text } from '@/app/components/elements/Text';
import { Container } from '@/app/components/layout/Container';
import { Grid } from '@/app/components/layout/Grid';
import { GridItem } from '@/app/components/layout/GridItem';
import { Section } from '@/app/components/layout/Section';
import Navbar from '@/app/components/Navbar';
import { useParams } from 'next/navigation';
import { ReactNode } from 'react';

interface LayoutProps {
  type: string;
  children?: any[];
  props?: any;
  class_name?: string;
  subType?: string;
}

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  [key: string]: string | string[];
}

const componentMap: { [key: string]: React.ComponentType<any> } = {
  webView: Container,
  webview: Container,
  container: Container,
  section: Section,
  grid: Grid,
  gridItem: GridItem,
  text: Text,
  scoreCard: ScoreCard,
  scorecard: ScoreCard,
  chart: Chart,
  navbar: Navbar,
};

export function DynamicLayout({ layout }: { layout: LayoutProps }) {
  console.log('DynamicLayout received:', layout);
  const params = useParams<RouteParams>();
  const { tenantCode, productCode, objectCode = 'default', viewContentCode = 'default' } = params;

  const renderComponent = (config: LayoutProps): ReactNode => {
    console.log('Rendering component:', config.type);
    const ComponentType = componentMap[config.type] || componentMap[config.type.toLowerCase()];

    if (!ComponentType) {
      console.warn(`Unknown component type: ${config.type} (tried ${config.type.toLowerCase()} as well)`);
      return null;
    }

    const childElements = config.children?.map((child, index) => {
      console.log('Rendering child:', child.type);
      return renderComponent({ ...child, key: `child-${index}` });
    });

    // Special handling for Chart component
    if (config.type.toLowerCase() === 'chart') {
      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          subType={config.subType}
          props={config.props}
        />
      );
    }

    // Special handling for Navbar component
    if (config.type.toLowerCase() === 'navbar') {
      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          tenantCode={tenantCode}
          productCode={productCode}
          objectCode={objectCode}
          viewContentCode={viewContentCode}
          {...config.props}
        />
      );
    }

    // Special handling for Grid components
    if (config.type.toLowerCase() === 'grid') {
      const { container, spacing, style, ...otherProps } = config.props || {};
      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          container={container}
          spacing={spacing}
          style={style}
          {...otherProps}
        >
          {childElements}
        </ComponentType>
      );
    }

    // Special handling for GridItem components
    if (config.type.toLowerCase() === 'griditem') {
      console.log('GridItem config:', config);
      const gridProps = {
        key: config.props?.key,
        className: config.class_name,
        xs: config.props?.xs,
        sm: config.props?.sm,
        md: config.props?.md,
        lg: config.props?.lg,
        xl: config.props?.xl,
        style: config.props?.style
      };
      console.log('Processed GridItem props:', gridProps);
      return (
        <ComponentType {...gridProps}>
          {childElements}
        </ComponentType>
      );
    }

    // For other components
    const { key, ...otherProps } = {
      className: config.class_name,
      ...config.props,
      subType: config.subType
    };

    return (
      <ComponentType
        key={key}
        {...otherProps}
      >
        {childElements}
      </ComponentType>
    );
  };

  return layout ? renderComponent(layout) : null;
} 