import { useTranslation } from 'react-i18next';

// Test component to verify translations
const TestTranslations = () => {
  const { t, i18n } = useTranslation();

  const testTranslations = () => {
    console.log('Testing translations...');

    // Test English translations
    i18n.changeLanguage('en');
    console.log('English - Dashboard:', t('dashboard'));
    console.log('English - Login:', t('login'));
    console.log('English - Landing Hero:', t('landing.hero.title_start'));

    // Test Portuguese translations
    i18n.changeLanguage('pt');
    console.log('Portuguese - Dashboard:', t('dashboard'));
    console.log('Portuguese - Login:', t('login'));
    console.log('Portuguese - Landing Hero:', t('landing.hero.title_start'));

    // Test Spanish translations
    i18n.changeLanguage('es');
    console.log('Spanish - Dashboard:', t('dashboard'));
    console.log('Spanish - Login:', t('login'));
    console.log('Spanish - Landing Hero:', t('landing.hero.title_start'));

    // Test French translations
    i18n.changeLanguage('fr');
    console.log('French - Dashboard:', t('dashboard'));
    console.log('French - Login:', t('login'));
    console.log('French - Landing Hero:', t('landing.hero.title_start'));

    console.log('Translation test completed!');
  };

  return (
    <div>
      <h1>Translation Test</h1>
      <button onClick={testTranslations}>Test Translations</button>
    </div>
  );
};

export default TestTranslations;