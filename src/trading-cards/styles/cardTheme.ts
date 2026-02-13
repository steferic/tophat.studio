export interface ShellTokens {
  width: number;
  height: number;
  borderRadius: number;
  borderPadding: number;
  borderBackground: string;
  boxShadow: string;
  innerBackground: string;
  innerBorderRadius: number;
}

export interface HeaderTokens {
  stageColor: string;
  nameColor: string;
  nameTextShadow: string;
  hpColor: string;
  fontFamily: string;
}

export interface ArtWindowTokens {
  height: number;
  border: string;
  borderRadius: number;
  defaultBackground: string;
}

export interface AttacksTokens {
  background: string;
  border: string;
  activeHighlight: string;
  nameColor: string;
  descriptionColor: string;
  damageColor: string;
  dividerColor: string;
  fontFamily: string;
}

export interface StatsTokens {
  borderTop: string;
  labelColor: string;
  valueColor: string;
}

export interface FlavorTokens {
  textColor: string;
  borderTop: string;
}

export interface FooterTokens {
  illustratorColor: string;
  cardNumberColor: string;
}

export interface HoloOverrides {
  border?: (angle: number) => string;
  header?: (angle: number) => string;
  art?: (angle: number, opacity: number) => string;
  attacks?: (angle: number) => string;
  stats?: (angle: number) => string;
  flavor?: (angle: number) => string;
}

export interface CardTheme {
  shell: ShellTokens;
  header: HeaderTokens;
  artWindow: ArtWindowTokens;
  attacks: AttacksTokens;
  stats: StatsTokens;
  flavor: FlavorTokens;
  footer: FooterTokens;
  holoEnabled: boolean;
  holo?: HoloOverrides;
}

export const DEFAULT_THEME: CardTheme = {
  shell: {
    width: 350,
    height: 490,
    borderRadius: 12,
    borderPadding: 6,
    borderBackground: 'linear-gradient(160deg, #e8d44d 0%, #d4a017 100%)',
    boxShadow: '0 0 40px rgba(245,212,66,0.15), 0 16px 48px rgba(0,0,0,0.6)',
    innerBackground: 'linear-gradient(180deg, #4a9ec9 0%, #3a82ad 6%, #e2ecf2 6%, #e2ecf2 100%)',
    innerBorderRadius: 7,
  },
  header: {
    stageColor: 'rgba(255,255,255,0.7)',
    nameColor: '#fff',
    nameTextShadow: '0 1px 2px rgba(0,0,0,0.25)',
    hpColor: '#e02020',
    fontFamily: 'Georgia, serif',
  },
  artWindow: {
    height: 180,
    border: '2px solid rgba(180,155,60,0.5)',
    borderRadius: 3,
    defaultBackground: 'linear-gradient(180deg, #b5ddf0 0%, #7ec4e2 50%, #5aafcf 100%)',
  },
  attacks: {
    background: 'rgba(245,242,230,0.7)',
    border: '1px solid rgba(0,0,0,0.08)',
    activeHighlight: 'rgba(74,158,201,0.2)',
    nameColor: '#1a1a1a',
    descriptionColor: '#666',
    damageColor: '#1a1a1a',
    dividerColor: 'rgba(0,0,0,0.1)',
    fontFamily: 'Georgia, serif',
  },
  stats: {
    borderTop: '1px solid rgba(0,0,0,0.1)',
    labelColor: '#888',
    valueColor: '#333',
  },
  flavor: {
    textColor: '#666',
    borderTop: '1px solid rgba(0,0,0,0.08)',
  },
  footer: {
    illustratorColor: '#999',
    cardNumberColor: '#666',
  },
  holoEnabled: true,
};
