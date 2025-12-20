export const SETTINGS = Object.freeze({
    ITEMS_PER_PAGE_OPTIONS: [
        {
            value: 5,
            title: '5'
        },
        {
            value: 7,
            title: '7'
        },
        {
            value: 9,
            title: '9'
        },
        {
            value: 11,
            title: '11'
        }
    ],
    INDEXES: new Map([
        ['dax', 'DAX'],
        ['dow', 'Dow Jones'],
        ['nasdaq', 'NASDAQ Comp.'],
        ['nikkei', 'NIKKEI 225'],
        ['hang', 'Hang Seng'],
        ['ibex', 'IBEX 35'],
        ['straits', 'Straits Times'],
        ['asx', 'Australia All Ordinaries'],
        ['rts', 'RTS'],
        ['bovespa', 'BOVESPA'],
        ['sensex', 'SENSEX'],
        ['sci', 'Shanghai Composite'],
        ['ftse', 'FTSE 100'],
        ['smi', 'SMI'],
        ['cac', 'CAC 40'],
        ['stoxx', 'Euro Stoxx 50'],
        ['tsx', 'S&P/TSX'],
        ['sp', 'S&P 500']
    ]),
    MATERIALS: new Map([
        ['au', 'Goldpreis'],
        ['ag', 'Silberpreis'],
        ['brent', 'Ölpreis (Brent)'],
        ['wti', 'Ölpreis (WTI)'],
        ['cu', 'Kupferpreis'],
        ['pt', 'Platinpreis'],
        ['al', 'Aluminiumpreis'],
        ['ni', 'Nickelpreis'],
        ['sn', 'Zinnpreis'],
        ['pb', 'Bleipreis'],
        ['pd', 'Palladiumpreis']
    ])
});
