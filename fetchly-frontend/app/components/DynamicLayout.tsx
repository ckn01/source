/* eslint-disable react/no-children-prop */
'use client';

import { Card } from '@/app/components/elements/Card';
import { Chart } from '@/app/components/elements/Chart';
import { Dropdown } from '@/app/components/elements/Dropdown';
import { Heroes } from '@/app/components/elements/Heroes';
import { PageTitle } from '@/app/components/elements/PageTitle';
import { ScoreCard } from '@/app/components/elements/ScoreCard';
import { Text } from '@/app/components/elements/Text';
import Footer from '@/app/components/Footer';
import { Container } from '@/app/components/layout/Container';
import { Grid } from '@/app/components/layout/Grid';
import { GridItem } from '@/app/components/layout/GridItem';
import { MaxWidthContainer } from '@/app/components/layout/MaxWidthContainer';
import { Section } from '@/app/components/layout/Section';
import Menu from '@/app/components/Menu';
import Navbar from '@/app/components/Navbar';
import { useParams } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { CardList } from "./elements/CardList";

interface LayoutProps {
  type: string;
  children?: any[];
  props?: any;
  class_name?: string;
  subType?: string;
  viewContent?: {
    name: string;
    object?: {
      display_name?: string;
    };
  };
}

interface RouteParams {
  tenantCode: string;
  productCode: string;
  objectCode: string;
  viewContentCode: string;
  [key: string]: string | string[];
}

const componentMap: Record<string, React.ComponentType<any>> = {
  webView: Container,
  webview: Container,
  container: Container,
  maxWidthContainer: MaxWidthContainer,
  section: Section,
  grid: Grid,
  gridItem: GridItem,
  text: Text,
  scoreCard: ScoreCard,
  scorecard: ScoreCard,
  chart: Chart,
  navbar: Navbar,
  heroes: Heroes,
  menu: Menu,
  footer: Footer,
  pageTitle: PageTitle,
  card: Card,
  dropdown: Dropdown,
  cardList: CardList,
};

interface DynamicLayoutProps {
  layout: LayoutProps;
  viewContent?: {
    name: string;
    object?: {
      display_name?: string;
    };
  };
}

export function DynamicLayout({ layout, viewContent }: DynamicLayoutProps) {
  console.log('DynamicLayout received:', layout);
  const params = useParams<RouteParams>();
  const { tenantCode, productCode, objectCode = 'default', viewContentCode = 'default' } = params;
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  const handleEvent = (event: { type: string; action: string; params: any; target: string }) => {
    if (event.type === 'action' && event.action === 'loadTable') {
      setSelectedValues(prev => ({
        ...prev,
        [event.target]: event.params.selectedValue
      }));
    }
  };

  const renderComponent = (config: LayoutProps): ReactNode => {
    console.log('Rendering component:', config.type);
    const ComponentType = componentMap[config.type] || componentMap[config.type.toLowerCase()];

    if (!ComponentType) {
      console.warn(`Unknown component type: ${config.type} (tried ${config.type.toLowerCase()} as well)`);
      return null;
    }

    const childElements = config.children?.map((child, index) => {
      console.log('Rendering child:', child.type);
      return renderComponent({
        ...child,
        key: child.key || `child-${index}-${child.type}`,
        viewContent
      });
    });

    // Special handling for Dropdown component
    if (config.type.toLowerCase() === 'dropdown') {
      const eventListeners = config.props?.eventListeners || {};
      const onChangeHandler = (value: string) => {
        Object.entries(eventListeners).forEach(([eventName, eventConfig]: [string, any]) => {
          if (eventName === 'onChange') {
            handleEvent(eventConfig);
          }
        });
      };

      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          {...config.props}
          onChange={onChangeHandler}
        />
      );
    }

    // Special handling for CardList component
    if (config.type.toLowerCase() === 'card-list' || config.type.toLowerCase() === 'cardlist') {
      const targetId = `${config.props.objectCode}__${config.props.viewContentCode}`;
      const className = config.class_name || (config as any).className;
      return (
        <ComponentType
          key={config.props?.key}
          className={className}
          {...config.props}
          selectedValue={selectedValues[targetId]}
        />
      );
    }

    // Special handling for Footer component
    if (config.type.toLowerCase() === 'footer') {
      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          {...config.props}
        />
      );
    }

    // Special handling for MaxWidthContainer component
    if (config.type.toLowerCase() === 'maxwidthcontainer') {
      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          maxWidth={config.props?.maxWidth}
          align={config.props?.align}
        >
          {childElements}
        </ComponentType>
      );
    }

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

    // Special handling for Heroes component
    if (config.type.toLowerCase() === 'heroes') {
      const { children, ...otherProps } = config.props || {};
      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          {...config.props}
          children={config.children}
        />
      );
    }

    // Special handling for Menu component
    if (config.type.toLowerCase() === 'menu') {
      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          viewContentCode={config.props?.viewContentCode}
          overflowType={config.props?.overflowType}
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

      return (
        <ComponentType {...gridProps}>
          {childElements}
        </ComponentType>
      );
    }

    // Special handling for PageTitle component
    if (config.type.toLowerCase() === 'pagetitle') {
      return (
        <ComponentType
          key={config.props?.key}
          className={config.class_name}
          viewContent={viewContent}
        />
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

  return layout ? renderComponent({ ...layout, viewContent }) : null;
} 