import { type Language } from '~/contexts/LanguageContext';

// Define the translation keys
type TranslationKey =
  | 'signIn'
  | 'getStarted'
  | 'weMeanBusiness'
  | 'connectingEntrepreneursAndInvestors'
  | 'whyChooseImVestor'
  | 'entrepreneur'
  | 'investor'
  | 'joinUsNow'
  | 'exclusiveUpdates'
  | 'specialGift'
  | 'takeYourSpecialGift'
  | 'dontHaveAccount'
  | 'createOne'
  | 'enterYourEmail'
  | 'password'
  | 'forgotPassword'
  | 'login'
  | 'loggingIn'
  | 'followUs'
  | 'termsAndConditions'
  | 'navigateConfidence'
  | 'navigateConfidenceDesc'
  | 'navigateConfidenceShort'
  | 'smartMatching'
  | 'smartMatchingDesc'
  | 'seamlessNegotiations'
  | 'seamlessNegotiationsDesc'
  | 'seamlessNegotiationsShort'
  | 'pokeBoost'
  | 'pokeBoostDesc'
  | 'investmentsProtected'
  | 'investmentsProtectedDesc'
  | 'investmentsProtectedShort'
  | 'businessRevolution'
  | 'selectPath'
  | 'entrepreneurDesc'
  | 'investorDesc'
  | 'copyright'
  | 'receiveUpdates'
  | 'beNotified'
  | 'forBeingFirst'
  | 'revolution'
  | 'cookieConsent'
  | 'cookieConsentDescription'
  | 'notice'
  | 'preferences'
  | 'cookieNoticeText'
  | 'cookieNoticePrivacyText'
  | 'privacyPolicy'
  | 'necessaryCookies'
  | 'necessaryCookiesDescription'
  | 'analyticsCookies'
  | 'analyticsCookiesDescription'
  | 'marketingCookies'
  | 'marketingCookiesDescription'
  | 'preferenceCookies'
  | 'preferenceCookiesDescription'
  | 'acceptAll'
  | 'rejectAll'
  | 'savePreferences'
  | 'freeYearPromo'
  | 'cancel'
  | 'trustedByPartners'
  | 'partnersDescription'
  | 'yourAccountAs'
  | 'partner'
  | 'firstName'
  | 'lastName'
  | 'companyName'
  | 'email'
  | 'confirmPassword'
  | 'mobilePhone'
  | 'wereYouReferred'
  | 'referralToken'
  | 'referralTokenOptional'
  | 'continue'
  | 'pleaseFieldFields'
  | 'takeYourPass'
  | 'back'
  | 'accountCreatedSuccessfully'
  | 'failedToCreateAccount';

// Define the translations for each language
const translations: Record<Language, Record<TranslationKey, string>> = {
  'en-US': {
    signIn: 'Sign In',
    getStarted: 'Get Started',
    weMeanBusiness: 'We mean Business!',
    connectingEntrepreneursAndInvestors:
      'Connecting visionary entrepreneurs with strategic investors in the expanding universe of opportunity',
    whyChooseImVestor: 'Why',
    entrepreneur: 'ENTREPRENEUR',
    investor: 'INVESTOR',
    joinUsNow: 'Join us Now',
    exclusiveUpdates: 'exclusive updates',
    specialGift: 'special gift',
    takeYourSpecialGift: 'Take your special gift!',
    dontHaveAccount: "Don't have an account?",
    createOne: 'Create one',
    enterYourEmail: 'Enter your email',
    password: 'Password',
    forgotPassword: 'Forgot your password?',
    login: 'Login',
    loggingIn: 'Logging in...',
    followUs: 'Follow us',
    termsAndConditions: 'Terms & Conditions',
    navigateConfidence: 'Navigate with Confidence',
    navigateConfidenceDesc:
      "Whether you're a seasoned investor or a first-time entrepreneur, Im-Vestor provides resources to guide you through each stage of your business or investment journey.",
    navigateConfidenceShort:
      "Whether you're a seasoned investor or a first-time entrepreneur, Im-Vestor is here!",
    smartMatching: 'Smart Matching',
    smartMatchingDesc:
      'Our AI-powered algorithm ensures you find the most relevant connections for your goals.',
    seamlessNegotiations: 'Seamless Negotiations',
    seamlessNegotiationsDesc:
      'Investors and entrepreneurs can communicate directly through the platform, schedule meetings, and negotiate terms openly. Both parties stay informed, building trust and collaboration in order to make a deal and a long term partnership.',
    seamlessNegotiationsShort:
      'Investors and entrepreneurs can communicate directly through the platform, schedule meetings, and negotiate terms openly.',
    pokeBoost: 'Poke, Boost and Hyper Train',
    pokeBoostDesc: 'Guarantee special addons in order to help you grow your profile.',
    investmentsProtected: "You're Protected",
    investmentsProtectedDesc:
      'Im-Vestor prioritizes the safety of all users. We ensure all projects and investors are thoroughly vetted, creating a trusted environment for business to thrive.',
    investmentsProtectedShort:
      'Im-Vestor prioritizes the safety of all users and a trusted environment for business to thrive.',
    businessRevolution: 'Choose your path',
    selectPath: 'Select your path and start your journey today!',
    entrepreneurDesc:
      "Secure funding from investors, and top VCs and accelerate your business growth. Whether you're a startup or a business incubator, we've got you covered",
    investorDesc:
      'Unlock exclusive access to high-quality startups, streamline your deal flow, and keep a close watch on the latest emerging companies.',
    copyright: '© 2024 Im-Vestor. All rights reserved.',
    receiveUpdates: 'Receive',
    beNotified: 'and be notified first-hand when Im-Vestor is launched, and receive a',
    forBeingFirst: 'for being among the first',
    revolution: 'Business Revolution',
    cookieConsent: 'Cookie Settings',
    cookieConsentDescription:
      'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. Please choose your preferences below.',
    notice: 'Notice',
    preferences: 'Preferences',
    cookieNoticeText:
      'This website uses cookies to ensure you get the best experience on our website. Some cookies are necessary for the website to function properly, while others help us improve our services and your experience.',
    cookieNoticePrivacyText: 'For more information about how we use cookies, please see our',
    privacyPolicy: 'Privacy Policy',
    necessaryCookies: 'Necessary Cookies',
    necessaryCookiesDescription:
      'These cookies are essential for the website to function properly and cannot be disabled.',
    analyticsCookies: 'Analytics Cookies',
    analyticsCookiesDescription:
      'These cookies help us understand how visitors interact with our website.',
    marketingCookies: 'Marketing Cookies',
    marketingCookiesDescription:
      'These cookies are used to deliver advertisements more relevant to you and your interests.',
    preferenceCookies: 'Preference Cookies',
    preferenceCookiesDescription:
      'These cookies allow the website to remember choices you make and provide enhanced functionality.',
    acceptAll: 'Accept All',
    rejectAll: 'Reject All',
    savePreferences: 'Save Preferences',
    freeYearPromo: 'Sign up now and get 1 year free.',
    cancel: 'Cancel',
    trustedByPartners: 'Trusted by Leading Partners',
    partnersDescription:
      'Join forces with industry leaders and innovative companies that trust Im-Vestor to connect the best entrepreneurs with strategic investors.',
    yourAccountAs: 'Your account as',
    partner: 'Partner',
    firstName: 'First Name',
    lastName: 'Last Name',
    companyName: 'Company Name',
    email: 'Email',
    confirmPassword: 'Confirm Password',
    mobilePhone: 'Mobile Phone',
    wereYouReferred: 'Were you',
    referralToken: 'referred?',
    referralTokenOptional: 'Referral Token (optional)',
    continue: 'Continue',
    pleaseFieldFields: 'Please fill all the fields',
    takeYourPass: 'Take your pass',
    back: 'Back',
    accountCreatedSuccessfully: 'Check your email to verify your account!',
    failedToCreateAccount: 'Failed to create account.',
  },
  'pt-PT': {
    signIn: 'Iniciar Sessão',
    getStarted: 'Começar',
    weMeanBusiness: 'Negócios é connosco!',
    connectingEntrepreneursAndInvestors:
      'Connecting visionary entrepreneurs with strategic investors in the expanding universe of opportunity',
    whyChooseImVestor: 'Porquê',
    entrepreneur: 'EMPREENDEDOR',
    investor: 'INVESTIDOR',
    joinUsNow: 'Junte-se a nós Agora',
    exclusiveUpdates: 'atualizações exclusivas',
    specialGift: 'presente especial',
    takeYourSpecialGift: 'Receba o seu presente especial!',
    dontHaveAccount: 'Não tem uma conta?',
    createOne: 'Criar uma',
    enterYourEmail: 'Introduza o seu email',
    password: 'Palavra-passe',
    forgotPassword: 'Esqueceu a sua palavra-passe?',
    login: 'Entrar',
    loggingIn: 'A entrar...',
    followUs: 'Siga-nos',
    termsAndConditions: 'Termos e Condições',
    navigateConfidence: 'Navegue na sua jornada com Confiança',
    navigateConfidenceDesc:
      'Seja um investidor experiente ou um empreendedor de primeira viagem, o Im-Vestor fornece recursos para o guiar em cada etapa da sua jornada de negócios ou investimento.',
    navigateConfidenceShort:
      'Seja um investidor experiente ou um empreendedor de primeira viagem, o Im-Vestor está aqui!',
    smartMatching: 'Correspondência Inteligente',
    smartMatchingDesc:
      'O nosso algoritmo alimentado por IA garante que encontre as conexões mais relevantes para os seus objetivos.',
    seamlessNegotiations: 'Negociações Simplificadas',
    seamlessNegotiationsDesc:
      'Investidores e empreendedores podem comunicar diretamente através da plataforma, agendar reuniões e negociar termos abertamente. Ambas as partes mantêm-se informadas, construindo confiança e colaboração para fazer um negócio e uma parceria de longo prazo.',
    seamlessNegotiationsShort:
      'Investidores e empreendedores podem comunicar diretamente através da plataforma, agendar reuniões e negociar termos abertamente.',
    pokeBoost: 'Cutuque, Impulsione e Hypertrain',
    pokeBoostDesc: 'Garanta complementos especiais para ajudar a fazer crescer o seu perfil.',
    investmentsProtected: 'Os Seus Investimentos, Protegidos',
    investmentsProtectedDesc:
      'O Im-Vestor prioriza a segurança de todos os utilizadores. Garantimos que todos os projetos e investidores são minuciosamente verificados, criando um ambiente de confiança para os negócios prosperarem.',
    investmentsProtectedShort:
      'O Im-Vestor prioriza a segurança de todos os utilizadores e um ambiente de confiança para os negócios prosperarem.',
    businessRevolution: 'Escolha seu caminho',
    revolution: 'Revolução de Negócios',
    selectPath: 'Selecione o seu caminho e comece a sua jornada hoje!',
    entrepreneurDesc:
      'Garanta financiamento de investidores e das principais VCs e acelere o crescimento do seu negócio. Seja uma startup ou uma incubadora de negócios, nós temos tudo o que precisa',
    investorDesc:
      'Desbloqueie acesso exclusivo a startups de alta qualidade, simplifique o seu fluxo de negócios e mantenha-se atento às mais recentes empresas emergentes.',
    copyright: '© 2024 Im-Vestor. Todos os direitos reservados.',
    receiveUpdates: 'Receba',
    beNotified: 'e seja notificado em primeira mão quando o Im-Vestor for lançado, e receba um',
    forBeingFirst: 'por estar entre os primeiros',
    cookieConsent: 'Configurações de Cookies',
    cookieConsentDescription:
      'Utilizamos cookies para melhorar sua experiência de navegação, fornecer conteúdo personalizado e analisar nosso tráfego. Por favor, escolha suas preferências abaixo.',
    notice: 'Aviso',
    preferences: 'Preferências',
    cookieNoticeText:
      'Este site usa cookies para garantir que você obtenha a melhor experiência em nosso site. Alguns cookies são necessários para o funcionamento adequado do site, enquanto outros nos ajudam a melhorar nossos serviços e sua experiência.',
    cookieNoticePrivacyText: 'Para mais informações sobre como usamos cookies, consulte nossa',
    privacyPolicy: 'Política de Privacidade',
    necessaryCookies: 'Cookies Necessários',
    necessaryCookiesDescription:
      'Estes cookies são essenciais para o funcionamento adequado do site e não podem ser desativados.',
    analyticsCookies: 'Cookies de Análise',
    analyticsCookiesDescription:
      'Estes cookies nos ajudam a entender como os visitantes interagem com nosso site.',
    marketingCookies: 'Cookies de Marketing',
    marketingCookiesDescription:
      'Estes cookies são usados para entregar anúncios mais relevantes para você e seus interesses.',
    preferenceCookies: 'Cookies de Preferência',
    preferenceCookiesDescription:
      'Estes cookies permitem que o site lembre as escolhas que você faz e forneça funcionalidades aprimoradas.',
    acceptAll: 'Aceitar Todos',
    rejectAll: 'Rejeitar Todos',
    savePreferences: 'Salvar Preferências',
    freeYearPromo: 'Inscreva-se agora e aproveite 1 ano grátis.',
    cancel: 'Cancelar',
    trustedByPartners: 'Confiado pelos Principais Parceiros',
    partnersDescription:
      'Junte-se às empresas líderes da indústria e empresas inovadoras que confiam no Im-Vestor para conectar os melhores empreendedores com investidores estratégicos.',
    yourAccountAs: 'A sua conta como',
    partner: 'Parceiro',
    firstName: 'Primeiro Nome',
    lastName: 'Último Nome',
    companyName: 'Nome da Empresa',
    email: 'Email',
    confirmPassword: 'Confirmar Palavra-passe',
    mobilePhone: 'Telemóvel',
    wereYouReferred: 'Foi',
    referralToken: 'referenciado?',
    referralTokenOptional: 'Token de Referência (opcional)',
    continue: 'Continuar',
    pleaseFieldFields: 'Por favor, preencha todos os campos',
    takeYourPass: 'Obtenha o seu passe',
    back: 'Voltar',
    accountCreatedSuccessfully: 'Verifique o seu email para verificar a sua conta!',
    failedToCreateAccount: 'Falha ao criar conta.',
  },
};

// Create a hook to get translations
export const getTranslation = (language: Language, key: TranslationKey): string => {
  return translations[language][key];
};
