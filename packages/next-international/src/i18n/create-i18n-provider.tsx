import React, { Context, ReactNode, useEffect, useState } from 'react';
import { LocaleContext, Locales, Locale } from '../types';
import { useRouter } from 'next/router';
import { warn } from '../helpers/log';

type I18nProviderProps<LocaleType extends Locale> = {
  locale: LocaleType;
  children: ReactNode;
};

export function createI18nProvider<LocaleType extends Locale>(
  I18nContext: Context<LocaleContext<LocaleType> | null>,
  locales: Locales,
) {
  return function I18nProvider({ locale: baseLocale, children }: I18nProviderProps<LocaleType>) {
    const {
      locale,
      defaultLocale,
      locales: nextLocales,
    } = useRouter() as {
      locale: string | undefined;
      defaultLocale: string | undefined;
      locales: string[] | undefined;
    };
    const [clientLocale, setClientLocale] = useState<LocaleType>();

    useEffect(() => {
      function checkConfigMatch([first, second]: [[string, string[]], [string, string[]]]) {
        const notDefined = first[1].filter(locale => !second[1].includes(locale));

        if (notDefined.length > 0) {
          warn(
            `The following locales are defined in '${first[0]}' but not in '${second[0]}': ${notDefined.join(', ')}`,
          );
        }
      }

      const createI18n = ['createI18n', Object.keys(locales)] as [string, string[]];
      const nextConfig = ['next.config.js', nextLocales || []] as [string, string[]];

      checkConfigMatch([createI18n, nextConfig]);
      checkConfigMatch([nextConfig, createI18n]);
    }, [nextLocales]);

    useEffect(() => {
      if (!locale || !defaultLocale) {
        return;
      }

      const load = locales[locale] || locales[defaultLocale];

      load().then(content => {
        setClientLocale(content.default as LocaleType);
      });
    }, [locale, defaultLocale]);

    if (!locale || !defaultLocale) {
      warn(`'i18n.defaultLocale' not defined in 'next.config.js'`);
      return null;
    }

    if (!nextLocales) {
      warn(`'i18n.locales' not defined in 'next.config.js'`);
      return null;
    }

    return (
      <I18nContext.Provider
        value={{
          localeContent: clientLocale || baseLocale,
        }}
      >
        {children}
      </I18nContext.Provider>
    );
  };
}
