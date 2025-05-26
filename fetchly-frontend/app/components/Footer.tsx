"use client";

import { dashboardConfig } from "@/app/appConfig";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface FooterProps {
  className?: string;
}

interface TenantData {
  tenant_name?: string;
  header_title?: string;
  tenant_product_config?: {
    value: {
      header_title?: string;
      description?: string;
      footer_text?: string;
      footer_links?: Array<{
        label: string;
        url: string;
      }>;
      social_media?: Array<{
        platform: string;
        url: string;
      }>;
      copyright_text?: string;
      text_color?: 'dark' | 'light';
      icon?: string;
      props?: {
        color_palette?: string[];
      };
    };
  };
}

export default function Footer({ className = '' }: FooterProps) {
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const params = useParams();
  const { tenantCode, productCode } = params;
  const currentYear = new Date().getFullYear();

  const fetchTenantData = async () => {
    try {
      const response = await fetch(
        `${dashboardConfig.backendAPIURL}/t/${tenantCode}/p/${productCode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tenant data");
      }

      const data = await response.json();

      setTenantData(data.data);
    } catch (error) {
      console.error("Tenant API error:", error);
    }
  };

  useEffect(() => {
    if (tenantCode && productCode) {
      fetchTenantData();
    }
  }, [tenantCode, productCode]);

  const footerConfig = tenantData?.tenant_product_config?.value || {};
  const colorPalette = footerConfig?.props?.color_palette || [];
  const tenantName = footerConfig?.header_title || 'Our Company';
  const tenantDescription = footerConfig?.description || tenantName;
  const tenantIcon = footerConfig?.icon || null;

  const textColor = footerConfig?.text_color === 'dark' ? 'text-gray-900' : 'text-white';
  const textColorMuted = footerConfig?.text_color === 'dark' ? 'text-gray-600' : 'text-gray-200';
  const borderColor = footerConfig?.text_color === 'dark' ? 'border-gray-200' : 'border-white/10';
  const linkHoverColor = footerConfig?.text_color === 'dark' ? 'hover:text-gray-900' : 'hover:text-white';

  const backgroundStyle = {
    background: colorPalette.length >= 2
      ? `linear-gradient(to right, ${colorPalette[0]}, ${colorPalette[1]})`
      : colorPalette[0] || 'linear-gradient(to bottom, rgb(249, 250, 251), rgb(243, 244, 246))'
  };

  return (
    <footer className={`w-full mt-16 ${className}`} style={backgroundStyle}>
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            {tenantIcon &&
              <Image
                src={`/${tenantIcon}`}
                alt="Tenant Logo"
                width={96}
                height={96}
                className="object-contain"
              />
            }
            <h3 className={`text-lg font-semibold ${textColor}`}>
              {tenantName}
            </h3>
            <p className={`text-sm leading-relaxed ${textColorMuted}`}>
              {tenantDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${textColor}`}>Quick Links</h3>
            <ul className="space-y-2">
              {(footerConfig.footer_links || [
                { label: 'About Us', url: '#' },
                { label: 'Contact', url: '#' },
                { label: 'Privacy Policy', url: '#' },
                { label: 'Terms of Service', url: '#' }
              ]).map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    className={`text-sm ${textColorMuted} ${linkHoverColor} transition-colors duration-200`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${textColor}`}>Connect With Us</h3>
            <div className="flex space-x-4">
              {(footerConfig.social_media || [
                { platform: 'Twitter', url: '#' },
                { platform: 'LinkedIn', url: '#' },
                { platform: 'Facebook', url: '#' }
              ]).map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  className={`text-sm ${textColorMuted} ${linkHoverColor} transition-colors duration-200`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.platform}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className={`mt-12 pt-8 border-t ${borderColor}`}>
          <p className={`text-sm text-center ${textColorMuted}`}>
            {footerConfig.copyright_text || `© ${currentYear} ${tenantName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
} 